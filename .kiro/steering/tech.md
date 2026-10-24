# Tech Stack

## Secrets
- `ANTHROPIC_API_KEY` lives in `my-app/.env.local`. It's the single source for both the web app and the Python CLI (`my-app/scripts/chatbot.py`).
- The root `.env` is legacy and redundant; nothing reads it anymore. It stays gitignored.
- All `.env*` files are gitignored. Never commit real keys. Use placeholder values in examples.

## Python CLI prototype (`my-app/scripts/`)
- **Python 3** with the **Anthropic SDK** (`anthropic`).
- **python-dotenv** for loading secrets from `my-app/.env.local`.
- Dependencies pinned in `my-app/scripts/requirements.txt`:
  - `anthropic==2.3.0`
  - `python-dotenv==1.2.4`
- Model: `claude-haiku-5-5`.

### Setup & run (from the repo root)
```bash
pip3 install -r my-app/scripts/requirements.txt
python3 my-app/scripts/chatbot.py
```

- The script resolves `my-app/.env.local` and `my-app/data/Lowell.md` relative to its own file location, so it works from any working directory.
- It exits early with "ANTHROPIC_API_KEY is missing." if the key isn't set.

## Web app (`my-app/`)
- **Next.js 16** (App Router) + **React 19** + **TypeScript 5**.
- **Tailwind CSS 4** (with `@tailwindcss/turbopack`).
- **ESLint 9** via `eslint-config-next`.
- **Anthropic SDK** (`@anthropic-ai/sdk`) powers the chatbot at `my-app/app/api/chatbot/route.ts` (`POST /api/chatbot`).
  - Model and token settings live in `AI_CONFIG` in `my-app/config/app.ts` (currently `claude-sonnet-5-5`).
  - Grounded in the shared knowledge base at `my-app/data/Lowell.md` (`AI_CONFIG.knowledgeBaseFile`).

### Commands (run from `my-app/`)
```bash
npm install
npm run dev      # start dev server (run manually, long-running)
npm run build    # production build
npm run lint     # eslint
```

> Dev servers and watchers are long-running. Start them manually in a terminal, don't block on them.
