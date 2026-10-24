# BlockBoard (Python backend + web app)

A town app where neighbors report problems on a map, chat in channels, ask a chatbot
where to eat (with dietary needs and allergens), and pick up paid bounties. The city
works from a desk view on the same page.

## Run it

```bash
cd blockboard-backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

Open http://localhost:8000. Everything works without any keys. Optional settings
(set them before starting uvicorn):

| Variable | What it does |
|---|---|
| `ANTHROPIC_API_KEY` | Claude sorts reports (reads the photo and caption) and powers BlockBot. Without it, both use keyword rules. |
| `GOOGLE_MAPS_API_KEY` | Uses Google Maps. Without it, the map uses free OpenStreetMap tiles. Enable the "Maps JavaScript API" for the key in Google Cloud. |
| `TOWN_NAME` | Town name shown in the app (default `Riverside`). |
| `TOWN_CENTER` | Map center as `lat,lng` (default `33.9806,-117.3755`). Set it to your hackathon's city. |
| `TRIAGE=rules` | Forces offline mode even when an API key is set. |

macOS/Linux: `export ANTHROPIC_API_KEY=sk-ant-...`
Windows PowerShell: `$env:ANTHROPIC_API_KEY="sk-ant-..."`

**Demo on two devices:** with `--host 0.0.0.0`, open `http://<your-laptop-ip>:8000` on a
phone on the same Wi-Fi. Post a report from the phone, change it on the laptop's city desk,
and the phone updates within a few seconds.

If you ran an older version, delete `blockboard.db` once so the new sample data loads
(or press "Reset demo" in the app).

## Features

1. **Reports with a map pin.** Photo + caption + tap the map (or "Use my location"). Claude
   sorts it into a category, department and priority. Reports within 60 m of an open one of
   the same type are flagged as duplicates and the user is asked to add a me-too instead.
2. **Live map.** Layers for road closures 🚧, hazards ⚠️, things that need city action 🛠️,
   bounties 💰, and food & places 🍽️. Road closures also post to #city-news automatically.
3. **Channels.** #general, #events, #lost-and-found and #city-news (only the city can post there).
4. **BlockBot.** Ask where to eat or how city services work. Pick dietary needs (vegan,
   gluten-free, nut-free, halal, kosher, ...) and it only suggests places that fit, shows allergen
   notes, and reminds people to confirm allergies with staff. It also knows what's on the map.
5. **Bounties.** The city or neighbors post paid jobs. Someone claims it, marks it done, and the
   poster approves the payout. The city can turn any ticket into a bounty from the desk.
   Payments are simulated (wallet balances in SQLite). A real version would use Stripe Connect.

## Files

| File | What it does |
|---|---|
| `app.py` | API routes and SQLite storage (`blockboard.db` is created on first run with sample data) |
| `triage.py` | Sorts a report: Claude first, keyword rules as a backup |
| `assistant.py` | BlockBot: Claude with the town's places and FAQs, keyword search as a backup |
| `places.json` | Sample restaurants, shops and city FAQs. Replace with real local data. |
| `static/index.html` | The web app (phone view + city desk) |
| `static/scenes.js` | Drawn placeholder photos for sample reports |
| `static/leaflet/` | Map library, bundled so the map works on spotty venue Wi-Fi |

## API

Interactive docs at http://localhost:8000/docs.

| Method | Path | Body |
|---|---|---|
| GET | `/api/config` | Town, map center, Google key, places, channels |
| GET | `/api/state` | Posts, bounties, chat, notifications, wallet |
| POST | `/api/posts` | `{text, lat, lng, image?: dataURL, force?}` returns `{post}` or `{duplicate}` |
| POST | `/api/posts/{id}/metoo` | `{user, add?}` |
| POST | `/api/posts/{id}/comments` | `{user, text}` |
| POST | `/api/posts/{id}/status` | `{status}`: Received, Crew assigned, In progress, Fixed |
| POST | `/api/channels/{channel}/messages` | `{user, text}` |
| POST | `/api/assistant` | `{messages: [{role, content}], diets: [...]}` returns `{reply, places}` |
| POST | `/api/bounties` | `{title, details, reward, poster, place?, lat?, lng?, post_id?}` |
| POST | `/api/bounties/{id}/claim` / `done` / `approve` | `{user}` |
| POST | `/api/notifs/read`, `/api/simulate`, `/api/reset` | none |
