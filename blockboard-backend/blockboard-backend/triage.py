"""Turns a resident's post (caption + optional photo) into a city ticket.

Uses Claude when an API key is available, and falls back to keyword rules
so the demo still works offline.
"""
import json
import os
import re

import anthropic

MODEL = "claude-opus-5-5"

# layer = which map layer the pin goes on
CATS = {
    "blockage": {"name": "Road blocked",             "dept": "Transportation",          "pri": "High",   "sla": "4 hours",  "layer": "closure", "kw": r"road (is )?(closed|blocked)|blocked|closure|detour|lane closed"},
    "hazard":   {"name": "Road hazard",              "dept": "Streets · Emergency",     "pri": "High",   "sla": "4 hours",  "layer": "hazard",  "kw": r"hazard|debris|black ice|\bice\b|broken glass|wires? down|downed wire|spill|nails"},
    "flood":    {"name": "Flooding / clogged drain", "dept": "Water & Sewer",           "pri": "High",   "sla": "24 hours", "layer": "hazard",  "kw": r"flood|drain|sewer|pooling|standing water"},
    "signal":   {"name": "Traffic signal or sign",   "dept": "Transportation",          "pri": "High",   "sla": "24 hours", "layer": "hazard",  "kw": r"traffic light|signal|stop sign|crosswalk"},
    "tree":     {"name": "Fallen tree or branch",    "dept": "Forestry",                "pri": "High",   "sla": "2 days",   "layer": "hazard",  "kw": r"\btrees?\b|branch|limb"},
    "light":    {"name": "Streetlight out",          "dept": "Public Works · Lighting", "pri": "Medium", "sla": "3 days",   "layer": "action",  "kw": r"street ?light|lamp|light (is )?out|too dark"},
    "pothole":  {"name": "Pothole",                  "dept": "Streets",                 "pri": "Medium", "sla": "5 days",   "layer": "action",  "kw": r"pothole|hole in the road|sinkhole"},
    "trash":    {"name": "Illegal dumping",          "dept": "Sanitation",              "pri": "Low",    "sla": "4 days",   "layer": "action",  "kw": r"trash|garbage|dump|litter|mattress|couch|\bbins?\b"},
    "graffiti": {"name": "Graffiti",                 "dept": "Clean City",              "pri": "Low",    "sla": "7 days",   "layer": "action",  "kw": r"graffiti|spray ?paint|tagged"},
    "other":    {"name": "Other city issue",         "dept": "311 General",             "pri": "Low",    "sla": "5 days",   "layer": "action",  "kw": r"broken|damaged|needs? (fix|repair)|sidewalk|bench|sign"},
}

SYSTEM = (
    "You sort neighborhood reports for a city's 311 desk. The resident has already dropped a "
    "pin on a map, so you don't need to find the location. Read the caption and photo and pick "
    "the one category that fits. 'blockage' means a road or lane is blocked or closed. 'hazard' "
    "means something on or near the road that could hurt someone right now (debris, ice, downed "
    "wires, spills). Use 'other' for a real city problem that fits no other category, and "
    "'not_city_issue' for posts that aren't problems for the city to fix. Raise priority above "
    "the category's usual level only for a clear danger to people. place_hint is the street or "
    "landmark named in the caption, or an empty string if none is named. The summary is one "
    "plain sentence a city crew can act on."
)

SCHEMA = {
    "type": "object",
    "properties": {
        "category": {"type": "string", "enum": list(CATS) + ["not_city_issue"]},
        "priority": {"type": "string", "enum": ["High", "Medium", "Low"]},
        "place_hint": {"type": "string"},
        "summary": {"type": "string"},
    },
    "required": ["category", "priority", "place_hint", "summary"],
    "additionalProperties": False,
}


def mode():
    if os.environ.get("TRIAGE") == "rules":
        return "rules"
    has_key = os.environ.get("ANTHROPIC_API_KEY") or os.environ.get("ANTHROPIC_AUTH_TOKEN")
    return "claude" if has_key else "rules"


def place_hint(text):
    m = re.search(r"\b(?:on|at|near|by)\s+([A-Z][\w']*(?:\s+(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Dr|Park|and|&|[A-Z0-9][\w']*))*)", text)
    return m.group(1).strip() if m else ""


def rules(text):
    cat = next((k for k, c in CATS.items() if re.search(c["kw"], text, re.I)), None)
    return {"category": cat, "priority": CATS[cat]["pri"] if cat else None,
            "place_hint": place_hint(text), "summary": None, "source": "rules"}


def claude(text, image_b64=None, media_type=None):
    content = []
    if image_b64:
        content.append({"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_b64}})
    content.append({"type": "text", "text": f"Resident's caption: {text}"})

    client = anthropic.Anthropic()
    resp = client.beta.messages.create(
        model=MODEL,
        max_tokens=2048,
        betas=["server-side-fallback-2026-07-01"],
        fallbacks="default",
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=SYSTEM,
        messages=[{"role": "user", "content": content}],
    )
    if resp.stop_reason == "refusal":
        return None
    data = json.loads(next(b.text for b in resp.content if b.type == "text"))
    cat = None if data["category"] == "not_city_issue" else data["category"]
    return {"category": cat, "priority": data["priority"], "place_hint": data["place_hint"] or place_hint(text),
            "summary": data["summary"], "source": "claude"}


def triage(text, image_b64=None, media_type=None):
    if mode() == "claude":
        try:
            result = claude(text, image_b64, media_type)
            if result:
                return result
        except anthropic.APIConnectionError as e:
            print(f"[triage] network error, using keyword rules: {e}")
        except anthropic.APIStatusError as e:
            print(f"[triage] Claude API error {e.status_code}, using keyword rules: {e.message}")
        except (json.JSONDecodeError, StopIteration) as e:
            print(f"[triage] unreadable reply, using keyword rules: {e}")
    return rules(text)
