# Project Structure

```
Hackachusetts/
├── .env                # Legacy/redundant ANTHROPIC_API_KEY (gitignored, do not commit; superseded by my-app/.env.local)
├── README.md
├── LICENSE
└── my-app/             # Next.js web frontend (intended production UI), self-contained
    ├── .env.local          # ANTHROPIC_API_KEY for the web app and the Python CLI (gitignored, do not commit)
    ├── app/
    │   ├── (auth)/         # auth route group
    │   ├── (dashboard)/    # dashboard route group
    │   ├── api/            # API routes (backend for chat, etc.)
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── config/
    │   └── app.ts          # AI_CONFIG.knowledgeBaseFile = "data/Lowell.md" (relative to my-app/)
    ├── data/
    │   └── Lowell.md       # Knowledge base + assistant behavior rules (source of truth)
    ├── scripts/
    │   ├── chatbot.py      # Python CLI chatbot prototype (Claude + data/Lowell.md)
    │   └── requirements.txt # Python deps (anthropic, python-dotenv)
    ├── public/
    ├── package.json
    ├── next.config.ts
    ├── tsconfig.json
    └── eslint.config.mjs
```

## Conventions
- **Knowledge base**: keep assistant scope and behavior rules in `my-app/data/Lowell.md`. It is the single copy shared by the web chatbot (`/api/chatbot`) and the Python CLI. When changing what the assistant can do or say, update it first.
- **Secrets**: all API keys via `my-app/.env.local` / environment variables, never hardcoded. Both the web app and `my-app/scripts/chatbot.py` read `ANTHROPIC_API_KEY` from `my-app/.env.local`. The root `.env` is legacy and redundant; it stays gitignored and should not be committed. The `.env*` glob is already in `.gitignore`.
- **Python**: standard-library-first, imports grouped (stdlib, third-party). Anchor file paths on `Path(__file__).resolve()` so scripts run from any working directory; for scripts in `my-app/scripts/`, `APP_DIR = Path(__file__).resolve().parent.parent` resolves to `my-app/` (e.g. `APP_DIR / "data" / "Lowell.md"`, `APP_DIR / ".env.local"`).
- **Web app**: follow Next.js App Router conventions. Route groups in parentheses `(auth)`, `(dashboard)` don't affect the URL path. Put server-side Claude calls in `app/api/` routes so the API key stays server-side — never call Anthropic from client components. Resolve app files from `process.cwd()` (which is `my-app/`), not via `..`.
- **Model calls**: send the Lowell knowledge base as the system prompt; keep the behavior rules from `my-app/data/Lowell.md` in sync with the system prompt used in code.

## Where things go
- New backend/chat logic for the web app → `my-app/app/api/`.
- Chat UI → `my-app/app/(dashboard)/` or a dedicated route.
- Knowledge base content and edits → `my-app/data/` (currently `my-app/data/Lowell.md`).
- Standalone scripts (Python CLI, tooling) → `my-app/scripts/`.
- New Python deps → `my-app/scripts/requirements.txt` (pinned). New JS deps → `my-app/package.json`.
