# Product

## What this is
**Lowell Local** — a community information assistant (chatbot) for the City of Lowell, Massachusetts. It answers questions about local places, city services, restaurants, transportation, attractions, events, public safety, and community resources, grounded in a curated knowledge base.

This is a **hackathon POC/MVP** (Hackachusetts). Prioritize working end-to-end flows over polish, but keep the code clean enough to extend.

## Current state
Everything lives in **`my-app/`**, a Next.js app with `(auth)`, `(dashboard)`, and `api` route groups:
1. **Web chatbot** — a working chat page at `/chatbot` backed by `POST /api/chatbot`, which calls Claude via the Anthropic SDK with the knowledge base as the system prompt.
2. **`my-app/scripts/chatbot.py`** — the original Python CLI prototype, kept for quick experiments. It reads the same knowledge base.

Both share a single knowledge base file: `my-app/data/Lowell.md`.

## Core behavior rules (from my-app/data/Lowell.md)
- Stay focused on Lowell, MA. Redirect off-topic questions.
- Never invent current/dynamic facts (hours, prices, menus, event dates, phone numbers, closures). Say when something can't be verified and point to an official source.
- Distinguish known general info, verified current info, and unverified community reports.
- Never claim to be a city employee or an official emergency service.
- Never claim an action (report submitted, reservation made) happened unless the app confirms it.
- Be concise, friendly, and consider dietary restrictions when recommending food.

The knowledge base lives in `my-app/data/Lowell.md` — treat it as the source of truth for product scope and assistant behavior.
