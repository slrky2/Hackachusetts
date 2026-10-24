"""BlockBot: the town's question-answering chatbot.

Answers questions about local places, food (with dietary needs and allergens),
city services, and what's happening on the map right now. Uses Claude when an
API key is set; otherwise a simple keyword search over the same data.
"""
import json
import re
from pathlib import Path

import anthropic

from triage import MODEL, mode

DATA = json.loads((Path(__file__).parent / "places.json").read_text(encoding="utf-8"))
PLACES = {p["id"]: p for p in DATA["places"]}

SYSTEM = f"""You are BlockBot, the friendly assistant inside the BlockBoard app for the town of {DATA['town']}.
Neighbors ask you where to eat, where to find things, and how city services work.

Rules:
- Only recommend places from the PLACES list below, and only state facts that are in the data. If you don't know, say so and suggest asking in the #general channel.
- Respect every dietary need the user mentions or has selected. Never recommend a place whose allergen notes conflict with a stated allergy without clearly warning about it.
- For any food allergy, remind the user to confirm with staff before ordering. Cross-contact matters for celiac disease and severe allergies.
- When the question is about roads, closures or hazards, use the LIVE MAP section.
- Keep replies short and friendly: two to five sentences, plain text, no markdown headings.
- Put the ids of the places you recommend in place_ids, best first, at most 4. Use an empty list when no place fits.

PLACES (sample data):
{json.dumps(DATA['places'], ensure_ascii=False)}

CITY FAQ:
{json.dumps(DATA['faqs'], ensure_ascii=False)}"""

SCHEMA = {
    "type": "object",
    "properties": {"reply": {"type": "string"}, "place_ids": {"type": "array", "items": {"type": "string"}}},
    "required": ["reply", "place_ids"],
    "additionalProperties": False,
}

DIET_WORDS = {
    "vegan": ["vegan"], "vegetarian": ["vegetarian", "veggie"], "gluten-free": ["gluten", "celiac", "coeliac"],
    "dairy-free": ["dairy", "lactose"], "nut-free": ["nut", "peanut"], "halal": ["halal"], "kosher": ["kosher"],
}
TYPE_WORDS = {
    "restaurant": ["eat", "food", "dinner", "lunch", "restaurant", "hungry", "pizza", "sushi", "tacos", "burrito", "grill", "deli"],
    "cafe": ["coffee", "cafe", "latte", "breakfast"], "bakery": ["bakery", "cake", "bread", "birthday"],
    "grocery": ["grocery", "groceries", "market", "store"], "pharmacy": ["pharmacy", "medicine", "epipen", "prescription", "flu shot"],
    "park": ["park", "playground", "farmers market"], "library": ["library", "wifi", "wi-fi", "print"],
    "city service": ["city hall", "permit", "water bill"],
}


def live_map(posts, bounties):
    open_posts = [p for p in posts if p["status"] != "Fixed"]
    lines = [f"- {p['cat_name']} near {p['place']} ({p['status']}, {p['pri']} priority)" for p in open_posts]
    lines += [f"- Bounty: {b['title']} for ${b['reward']} ({b['status']})" for b in bounties if b["status"] == "open"]
    return "\n".join(lines) or "- Nothing open right now."


def ask_claude(history, diets, posts, bounties):
    note = f"Selected dietary needs: {', '.join(diets) if diets else 'none'}.\nLIVE MAP right now:\n{live_map(posts, bounties)}"
    messages = [{"role": m["role"], "content": m["content"]} for m in history[-12:]]
    messages.append({"role": "system", "content": note})
    client = anthropic.Anthropic()
    resp = client.beta.messages.create(
        model=MODEL,
        max_tokens=4096,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=SYSTEM,
        messages=messages,
    )
    if resp.stop_reason == "refusal":
        return None
    data = json.loads(next(b.text for b in resp.content if b.type == "text"))
    data["place_ids"] = [i for i in data["place_ids"] if i in PLACES]
    return data


def ask_rules(question, diets, posts, bounties):
    q = question.lower()
    asked = {d for d, words in DIET_WORDS.items() if any(w in q for w in words)}
    want = set(diets) | asked
    for f in DATA["faqs"]:
        if any(w in q for w in f["q"].split()):
            return {"reply": f["a"], "place_ids": []}
    if any(w in q for w in ["road", "closed", "closure", "hazard", "traffic", "blocked"]):
        return {"reply": "Here's what's open on the map right now:\n" + live_map(posts, bounties), "place_ids": []}
    types = {t for t, words in TYPE_WORDS.items() if any(w in q for w in words)}
    if "restaurant" in types:
        types |= {"cafe", "bakery"}

    def ok(p):
        tags = " ".join(p["diet"]).lower()
        diet_ok = all(d.split("-")[0] in tags for d in want)
        return (not types or p["type"] in types) and diet_ok and (types or want)

    hits = [p for p in DATA["places"] if ok(p)]
    relaxed = False
    if not hits and want - set(asked):
        want, relaxed = set(asked), True   # drop the profile chips, keep what the question asked for
        hits = [p for p in DATA["places"] if ok(p)]
    words = [w for w in re.findall(r"[a-z]+", q) if len(w) > 3]
    exact = [p for p in hits if any(w in (p["name"] + " " + p["cuisine"]).lower() for w in words)]
    hits = exact or hits
    if not hits:
        return {"reply": "I couldn't find a match in my list. Try asking in #general, neighbors usually know!", "place_ids": []}
    reply = (f"Here's a spot" if len(hits) == 1 else "Here are some spots") + (f" that {'fits' if len(hits) == 1 else 'fit'} {', '.join(sorted(want))}" if want else "") + "."
    if relaxed:
        reply += f" Nothing on my list also fits {', '.join(sorted(set(diets) - asked))}."
    if want & {"nut-free", "gluten-free", "dairy-free"}:
        reply += " Check the allergen notes and confirm with staff before you order."
    return {"reply": reply, "place_ids": [p["id"] for p in hits[:4]]}


def ask(history, diets, posts, bounties):
    if mode() == "claude":
        try:
            result = ask_claude(history, diets, posts, bounties)
            if result:
                result["source"] = "claude"
                return result
        except anthropic.APIConnectionError as e:
            print(f"[assistant] network error, using keyword search: {e}")
        except anthropic.APIStatusError as e:
            print(f"[assistant] Claude API error {e.status_code}, using keyword search: {e.message}")
        except (json.JSONDecodeError, StopIteration) as e:
            print(f"[assistant] unreadable reply, using keyword search: {e}")
    result = ask_rules(history[-1]["content"], diets, posts, bounties)
    result["source"] = "rules"
    return result
