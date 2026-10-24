"""BlockBoard backend: reports on a map, channels, the BlockBot assistant, and bounties.

Run:  uvicorn app:app --reload --host 0.0.0.0 --port 8000
"""
import base64
import json
import math
import os
import re
import sqlite3
import threading
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import assistant
import triage as T

BASE = Path(__file__).parent
DB_PATH = BASE / "blockboard.db"
UPLOADS = BASE / "uploads"
UPLOADS.mkdir(exist_ok=True)

TOWN = os.environ.get("TOWN_NAME", "Riverside")
CENTER = tuple(float(x) for x in os.environ.get("TOWN_CENTER", "33.9806,-117.3755").split(","))
GOOGLE_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

STATUSES = ["Received", "Crew assigned", "In progress", "Fixed"]
CHANNELS = ["general", "events", "lost-and-found", "city-news"]
lock = threading.Lock()
app = FastAPI(title="BlockBoard")


def offset(dx, dy):
    """Meters east/north of the town center -> (lat, lng)."""
    lat = CENTER[0] + dy / 111_111
    return lat, CENTER[1] + dx / (111_111 * math.cos(math.radians(CENTER[0])))


for _p in assistant.DATA["places"]:
    _p["lat"], _p["lng"] = offset(_p["dx"], _p["dy"])


# ---------- storage (SQLite, one JSON blob per row) ----------
def db():
    conn = sqlite3.connect(DB_PATH)
    for t in ("posts", "bounties"):
        conn.execute(f"CREATE TABLE IF NOT EXISTS {t} (id INTEGER PRIMARY KEY, data TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS notifs (id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, channel TEXT, data TEXT)")
    conn.execute("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)")
    return conn


def get_meta(conn, key, default=0):
    row = conn.execute("SELECT value FROM meta WHERE key=?", (key,)).fetchone()
    return float(row[0]) if row else default


def set_meta(conn, key, value):
    conn.execute("INSERT OR REPLACE INTO meta VALUES (?, ?)", (key, str(value)))


def bump(conn):
    set_meta(conn, "version", int(get_meta(conn, "version")) + 1)


def rows(conn, table):
    return [json.loads(r[0]) for r in conn.execute(f"SELECT data FROM {table} ORDER BY id DESC")]


def get_row(conn, table, rid):
    row = conn.execute(f"SELECT data FROM {table} WHERE id=?", (rid,)).fetchone()
    if not row:
        raise HTTPException(404, "Not found")
    return json.loads(row[0])


def save(conn, table, obj):
    conn.execute(f"INSERT OR REPLACE INTO {table} VALUES (?, ?)", (obj["id"], json.dumps(obj)))


def next_id(conn, key, start):
    n = int(get_meta(conn, key, start)) + 1
    set_meta(conn, key, n)
    return n


def notify(conn, ic, text, post_id=None):
    conn.execute("INSERT INTO notifs (data) VALUES (?)",
                 (json.dumps({"ic": ic, "t": text, "post": post_id, "at": time.time(), "isNew": 1}),))


def say(conn, channel, who, text, ago_s=0):
    conn.execute("INSERT INTO messages (channel, data) VALUES (?, ?)",
                 (channel, json.dumps({"who": who, "text": text, "at": time.time() - ago_s})))


def pay(conn, user, amount):
    set_meta(conn, f"wallet:{user}", get_meta(conn, f"wallet:{user}") + amount)


# ---------- reports ----------
def distance_m(a, b):
    dy = (a[0] - b[0]) * 111_111
    dx = (a[1] - b[1]) * 111_111 * math.cos(math.radians(a[0]))
    return math.hypot(dx, dy)


def find_dup(conn, cat, lat, lng):
    """Same kind of problem, still open, within 60 m of the new pin."""
    return next((p for p in rows(conn, "posts") if p["cat_id"] == cat and p["status"] != "Fixed"
                 and distance_m((p["lat"], p["lng"]), (lat, lng)) < 60), None)


def create_post(conn, who, text, result, lat, lng, image_url=None, ago_s=0):
    cat = T.CATS[result["category"]]
    pid = next_id(conn, "seq", 4818)
    p = {
        "id": pid, "who": who, "text": text, "cat_id": result["category"], "cat_name": cat["name"],
        "layer": cat["layer"], "lat": lat, "lng": lng,
        "place": result.get("place_hint") or "Pinned location",
        "pri": result["priority"] or cat["pri"], "status": "Received", "metoo": [who], "extra": 0,
        "comments": [{"who": "city", "city": 1,
                      "text": f"Thanks! Logged as #{pid}. Routed to {cat['dept']}, target {cat['sla']}."}],
        "image_url": image_url, "summary": result.get("summary"), "triage": result["source"],
        "dept": cat["dept"], "created_at": time.time() - ago_s, "bounty_id": None,
    }
    save(conn, "posts", p)
    return p


def change_status(conn, p, status, silent=False):
    if p["status"] == status:
        return
    cat = T.CATS[p["cat_id"]]
    p["status"] = status
    msg = {
        "Crew assigned": f"A {cat['dept']} crew is assigned. Expected within {cat['sla']}.",
        "In progress": f"Crew is on site at {p['place']} now.",
        "Fixed": "Fixed! Swipe to see the after photo. Thanks to everyone who said me too 🙌",
        "Received": "Back in the queue.",
    }[status]
    p["comments"].append({"who": "city", "city": 1, "text": msg})
    save(conn, "posts", p)
    if not silent:
        mine = "you" in p["metoo"]
        notify(conn, "✅" if status == "Fixed" else ("🚧" if mine else "🏙️"),
               f'{"Your report" if mine else "City updated"} "{cat["name"]}" at {p["place"]}: {status.lower()}.', p["id"])
        if p["layer"] == "closure" and status == "Fixed":
            say(conn, "city-news", "city", f"✅ Road reopened: {p['place']}.")


# ---------- bounties ----------
def create_bounty(conn, poster, title, details, reward, lat=None, lng=None, place="", post_id=None, ago_s=0):
    b = {"id": next_id(conn, "bseq", 100), "title": title, "details": details, "reward": reward,
         "poster": poster, "lat": lat, "lng": lng, "place": place, "post_id": post_id,
         "status": "open", "claimer": None, "created_at": time.time() - ago_s}
    save(conn, "bounties", b)
    return b


# ---------- seed ----------
SEED_POSTS = [  # who, text, dx, dy, hours ago
    ("dev", "Big branch came down on Elm St after the wind last night", -380, 250, 24),
    ("sam", "Fresh graffiti on the wall at Main and 1st", 80, 120, 5),
    ("maria", "Pothole on Maple St keeps getting worse 😩", 40, 380, 3),
    ("june", "Storm drain clogged on Oak St, water pooling into the street", -150, -300, 0.7),
    ("dev", "Road blocked on River St, a delivery truck broke down across both lanes", 400, -160, 0.4),
    ("sam", "Broken glass and nails all over the bike lane on Main St", 300, 90, 0.2),
]
SEED_CHAT = [
    ("general", "maria", "Anyone know if the farmers market is still on Saturday with the rain?", 3 * 3600),
    ("general", "dev", "Yes! Moved under the pavilion at River Park.", 2.9 * 3600),
    ("general", "june", "Lost cat near Maple St, orange tabby named Pumpkin 🙏", 3600),
    ("events", "city", "🎃 Fall Festival Saturday 2 to 6 PM at River Park. Food trucks, live music, free entry.", 6 * 3600),
    ("events", "sam", "Pickup soccer at the park Sunday 10 AM, all levels welcome!", 2 * 3600),
    ("lost-and-found", "june", "Lost: orange tabby cat, answers to Pumpkin. Last seen near Maple St.", 3600),
    ("lost-and-found", "dev", "Found a set of keys with a blue Honda fob outside Bean There Cafe. Left them at the counter.", 1800),
    ("city-news", "city", "🧹 Street sweeping Tuesday 8 to 11 AM on Elm and Oak. Move your car or get a $45 ticket.", 8 * 3600),
    ("city-news", "city", "🗳️ Ward 4 meeting Thursday 6:30 PM at Riverside Library. Topic: the Main St bike lane.", 5 * 3600),
    ("city-news", "city", "🌧️ Heavy rain tonight. Please clear leaves off the storm drain in front of your house.", 3600),
]


def seed(conn):
    for t in ("posts", "notifs", "meta", "messages", "bounties"):
        conn.execute(f"DELETE FROM {t}")
    for f in UPLOADS.glob("*"):
        f.unlink()
    made = {}
    for who, text, dx, dy, h in SEED_POSTS:
        lat, lng = offset(dx, dy)
        made[T.rules(text)["category"]] = create_post(conn, who, text, T.rules(text), lat, lng, ago_s=h * 3600)
    made["pothole"]["metoo"] += ["dev", "sam", "june"]; made["pothole"]["extra"] = 9
    made["flood"]["metoo"] += ["maria"]; made["flood"]["extra"] = 4
    made["tree"]["extra"] = 12
    made["blockage"]["extra"] = 6
    for p in made.values():
        save(conn, "posts", p)
    change_status(conn, made["graffiti"], "Crew assigned", silent=True)
    change_status(conn, made["tree"], "Fixed", silent=True)
    change_status(conn, made["blockage"], "In progress", silent=True)

    g = made["graffiti"]
    b = create_bounty(conn, "city", "Paint over graffiti on Main St wall",
                      "City supplies paint and rollers at City Hall. About 2 hours of work.", 60,
                      g["lat"], g["lng"], g["place"], g["id"], ago_s=4 * 3600)
    g["bounty_id"] = b["id"]; save(conn, "posts", g)
    lat, lng = offset(650, -380)
    create_bounty(conn, "city", "Clean up River Park after the Fall Festival",
                  "Saturday 6 to 8 PM. Trash bags and gloves provided. Up to 4 people.", 40, lat, lng, "River Park", ago_s=6 * 3600)
    lat, lng = offset(60, 420)
    create_bounty(conn, "maria", "Help carry a couch to the curb for bulk pickup",
                  "Second floor, should take 20 minutes. I'll book the city pickup.", 25, lat, lng, "Maple St", ago_s=2 * 3600)
    b4 = create_bounty(conn, "june", "Walk my dog Mon to Fri this week",
                       "Friendly golden retriever, 30 minutes around noon.", 75, None, None, "Oak St", ago_s=26 * 3600)
    b4["status"], b4["claimer"] = "claimed", "sam"; save(conn, "bounties", b4)

    for ch, who, text, ago in SEED_CHAT:
        say(conn, ch, who, text, ago)
    notify(conn, "🌧️", "Heavy rain expected tonight. Clear leaves off storm drains if you can.")
    notify(conn, "🚧", "River St is blocked by a broken-down truck. Use Oak St instead.")
    conn.execute("UPDATE notifs SET data = json_set(data, '$.isNew', 0)")
    set_meta(conn, "wallet:you", 35)
    bump(conn)


with lock, db() as _c:
    if not _c.execute("SELECT COUNT(*) FROM posts").fetchone()[0]:
        seed(_c)


# ---------- API models ----------
class NewPost(BaseModel):
    text: str
    lat: float
    lng: float
    author: str = "you"
    image: str | None = None   # data URL from the browser
    force: bool = False        # post even if a neighbor already reported it


class MeToo(BaseModel):
    user: str = "you"
    add: bool = False          # True = only add, never toggle off


class Comment(BaseModel):
    user: str = "you"
    text: str


class Status(BaseModel):
    status: str


class ChatMsg(BaseModel):
    user: str = "you"
    text: str


class Ask(BaseModel):
    messages: list[dict] = Field(..., description="[{role: user|assistant, content: str}], last one from the user")
    diets: list[str] = []


class NewBounty(BaseModel):
    title: str
    details: str = ""
    reward: float = Field(gt=0, le=1000)
    poster: str = "you"
    place: str = ""
    lat: float | None = None
    lng: float | None = None
    post_id: int | None = None


class Who(BaseModel):
    user: str = "you"


# ---------- API ----------
@app.get("/api/config")
def config():
    return {"town": TOWN, "center": CENTER, "google_maps_key": GOOGLE_KEY,
            "places": assistant.DATA["places"], "channels": CHANNELS}


@app.get("/api/state")
def state():
    with lock, db() as conn:
        notifs = [json.loads(r[0]) for r in conn.execute("SELECT data FROM notifs ORDER BY id DESC LIMIT 30")]
        chat = {ch: [json.loads(r[0]) for r in conn.execute(
            "SELECT data FROM (SELECT id, data FROM messages WHERE channel=? ORDER BY id DESC LIMIT 60) ORDER BY id", (ch,))]
            for ch in CHANNELS}
        return {"version": int(get_meta(conn, "version")), "posts": rows(conn, "posts"), "notifs": notifs,
                "dups": int(get_meta(conn, "dups")), "bounties": rows(conn, "bounties"), "chat": chat,
                "wallet": get_meta(conn, "wallet:you"), "triage_mode": T.mode()}


@app.post("/api/posts")
def new_post(body: NewPost):
    text = body.text.strip()
    if not text:
        raise HTTPException(422, "Write a caption that says what's wrong.")
    image_b64 = media_type = None
    if body.image:
        m = re.match(r"data:(image/(png|jpeg|gif|webp));base64,(.+)", body.image, re.S)
        if not m:
            raise HTTPException(422, "Photos must be PNG, JPEG, GIF or WebP.")
        media_type, image_b64 = m.group(1), m.group(3)

    result = T.triage(text, image_b64, media_type)   # slow call stays outside the lock
    if not result["category"]:
        raise HTTPException(422, "That doesn't look like something the city fixes. Try something like \"pothole on Main St\" or ask in #general.")

    with lock, db() as conn:
        dup = find_dup(conn, result["category"], body.lat, body.lng)
        if dup and not body.force:
            return {"duplicate": dup, "triage": result["source"]}
        image_url = None
        if image_b64:
            name = f"{uuid.uuid4().hex}.{media_type.split('/')[1]}"
            (UPLOADS / name).write_bytes(base64.b64decode(image_b64))
            image_url = f"/uploads/{name}"
        p = create_post(conn, body.author, text, result, body.lat, body.lng, image_url)
        if p["layer"] == "closure":
            say(conn, "city-news", "city", f"🚧 Reported road blockage near {p['place']}. Avoid the area until crews clear it.")
        bump(conn)
        return {"post": p, "triage": result["source"]}


@app.post("/api/posts/{pid}/metoo")
def metoo(pid: int, body: MeToo):
    with lock, db() as conn:
        p = get_row(conn, "posts", pid)
        if body.user in p["metoo"] and not body.add:
            p["metoo"].remove(body.user)
        elif body.user not in p["metoo"]:
            p["metoo"].append(body.user)
            if body.add:
                set_meta(conn, "dups", get_meta(conn, "dups") + 1)
        save(conn, "posts", p)
        bump(conn)
        return p


@app.post("/api/posts/{pid}/comments")
def comment(pid: int, body: Comment):
    if not body.text.strip():
        raise HTTPException(422, "Comment is empty.")
    with lock, db() as conn:
        p = get_row(conn, "posts", pid)
        p["comments"].append({"who": body.user, "text": body.text.strip()})
        save(conn, "posts", p)
        bump(conn)
        return p


@app.post("/api/posts/{pid}/status")
def status(pid: int, body: Status):
    if body.status not in STATUSES:
        raise HTTPException(422, f"Status must be one of {STATUSES}.")
    with lock, db() as conn:
        p = get_row(conn, "posts", pid)
        change_status(conn, p, body.status)
        bump(conn)
        return p


@app.post("/api/notifs/read")
def read_notifs():
    with lock, db() as conn:
        conn.execute("UPDATE notifs SET data = json_set(data, '$.isNew', 0)")
        bump(conn)
        return {"ok": True}


# channels
@app.post("/api/channels/{channel}/messages")
def post_message(channel: str, body: ChatMsg):
    if channel not in CHANNELS:
        raise HTTPException(404, "No such channel")
    if channel == "city-news" and body.user != "city":
        raise HTTPException(403, "Only the city posts in #city-news.")
    if not body.text.strip():
        raise HTTPException(422, "Message is empty.")
    with lock, db() as conn:
        say(conn, channel, body.user, body.text.strip()[:1000])
        bump(conn)
        return {"ok": True}


# BlockBot
@app.post("/api/assistant")
def ask(body: Ask):
    if not body.messages or body.messages[-1].get("role") != "user":
        raise HTTPException(422, "The last message must be from the user.")
    with lock, db() as conn:
        posts, bounties = rows(conn, "posts"), rows(conn, "bounties")
    result = assistant.ask(body.messages, body.diets, posts, bounties)   # slow call outside the lock
    result["places"] = [assistant.PLACES[i] for i in result["place_ids"]]
    return result


# bounties
@app.post("/api/bounties")
def new_bounty(body: NewBounty):
    if not body.title.strip():
        raise HTTPException(422, "Give the job a title.")
    with lock, db() as conn:
        if body.poster != "city" and get_meta(conn, f"wallet:{body.poster}") < body.reward:
            raise HTTPException(422, "Not enough in your wallet to fund this bounty.")
        if body.poster != "city":
            pay(conn, body.poster, -body.reward)   # held until the job is approved
        lat, lng, place = body.lat, body.lng, body.place
        if body.post_id:
            p = get_row(conn, "posts", body.post_id)
            lat, lng, place = p["lat"], p["lng"], p["place"]
        b = create_bounty(conn, body.poster, body.title.strip(), body.details.strip(), round(body.reward, 2),
                          lat, lng, place, body.post_id)
        if body.post_id:
            p["bounty_id"] = b["id"]
            p["comments"].append({"who": "city", "city": 1, "text": f"💰 The city posted a ${b['reward']:g} bounty for this job. Check the Bounties tab."})
            save(conn, "posts", p)
        bump(conn)
        return b


@app.post("/api/bounties/{bid}/claim")
def claim(bid: int, body: Who):
    with lock, db() as conn:
        b = get_row(conn, "bounties", bid)
        if b["status"] != "open":
            raise HTTPException(409, "Someone already claimed this job.")
        if b["poster"] == body.user:
            raise HTTPException(409, "You can't claim your own bounty.")
        b["status"], b["claimer"] = "claimed", body.user
        save(conn, "bounties", b)
        if b["poster"] == "you":
            notify(conn, "🙋", f'{body.user} claimed your bounty "{b["title"]}".')
        bump(conn)
        return b


@app.post("/api/bounties/{bid}/done")
def done(bid: int, body: Who):
    with lock, db() as conn:
        b = get_row(conn, "bounties", bid)
        if b["status"] != "claimed" or b["claimer"] != body.user:
            raise HTTPException(409, "Only the person who claimed this job can mark it done.")
        b["status"] = "done"
        save(conn, "bounties", b)
        if b["poster"] == "you":
            notify(conn, "📸", f'"{b["title"]}" is done. Review and approve the payout.')
        bump(conn)
        return b


@app.post("/api/bounties/{bid}/approve")
def approve(bid: int, body: Who):
    with lock, db() as conn:
        b = get_row(conn, "bounties", bid)
        if b["poster"] != body.user:
            raise HTTPException(403, "Only the poster can approve the payout.")
        if b["status"] != "done":
            raise HTTPException(409, "The job isn't marked done yet.")
        b["status"] = "paid"
        pay(conn, b["claimer"], b["reward"])
        save(conn, "bounties", b)
        if b["claimer"] == "you":
            notify(conn, "💵", f'You got paid ${b["reward"]:g} for "{b["title"]}".')
        if b["post_id"]:
            p = get_row(conn, "posts", b["post_id"])
            change_status(conn, p, "Fixed")
        bump(conn)
        return b


NEIGHBOR = [("dev", "Streetlight out on Elm St, super dark at night", -300, 200),
            ("maria", "Water pooling on Oak St again, the drain is blocked", -150, -300),
            ("june", "Downed wires hanging over the sidewalk on Maple St", 150, 330),
            ("sam", "Pothole on Maple St almost took out my bike", 40, 380)]


@app.post("/api/simulate")
def simulate():
    """Demo helper: a neighbor posts a report, or claims/finishes a bounty."""
    with lock, db() as conn:
        i = int(get_meta(conn, "sim"))
        set_meta(conn, "sim", i + 1)
        if i % 3 == 2:
            open_b = [b for b in rows(conn, "bounties") if b["status"] == "open" and b["poster"] != "dev"]
            mine = [b for b in rows(conn, "bounties") if b["status"] == "claimed" and b["claimer"] == "dev"]
            if mine:
                b = mine[0]; b["status"] = "done"; msg = f'dev finished "{b["title"]}" and asked for payout'
            elif open_b:
                b = open_b[-1]; b["status"], b["claimer"] = "claimed", "dev"; msg = f'dev claimed "{b["title"]}"'
            else:
                b = None; msg = "No open bounties to claim"
            if b:
                save(conn, "bounties", b)
            bump(conn)
            return {"message": msg}
        who, text, dx, dy = NEIGHBOR[(i - i // 3) % len(NEIGHBOR)]
        lat, lng = offset(dx, dy)
        result = T.rules(text)
        dup = find_dup(conn, result["category"], lat, lng)
        if dup:
            dup["extra"] += 1
            save(conn, "posts", dup)
            set_meta(conn, "dups", get_meta(conn, "dups") + 1)
            msg = f"{who} added a me-too to #{dup['id']}"
        else:
            p = create_post(conn, who, text, result, lat, lng)
            msg = f"{who} posted a new report (#{p['id']})"
        bump(conn)
        return {"message": msg}


@app.post("/api/reset")
def reset():
    with lock, db() as conn:
        seed(conn)
        return {"ok": True}


app.mount("/uploads", StaticFiles(directory=UPLOADS), name="uploads")
app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")


@app.get("/")
def index():
    return FileResponse(BASE / "static" / "index.html")
