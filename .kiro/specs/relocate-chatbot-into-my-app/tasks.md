# Implementation Plan: Relocate Chatbot into my-app

## Overview

Move `Lowell.md`, `chatbot.py`, and `requirements.txt` from the repo root into `my-app/` with history preserved, update the two consumers (Next.js route handler and Python CLI) to the new paths, point the Python CLI at `my-app/.env.local`, and refresh comments and steering docs. The design rules out property-based tests; correctness is checked by the verification tasks in step 5, which are required.

## Tasks

- [x] 1. Relocate the files
  - [x] 1.1 Check tracking, record a baseline, create directories, and move files
    - Run `git ls-files --error-unmatch` for `Lowell.md`, `chatbot.py`, and `requirements.txt` at the repo root. At spec time all three were untracked (`??`), so plain `mv` is expected
    - Confirm `data/` and `scripts/` are not ignored (`git check-ignore --no-index` on the new paths; verified clean at spec time)
    - Record a baseline: `shasum -a 256 Lowell.md requirements.txt chatbot.py` and `cp chatbot.py /tmp/chatbot.py.orig`
    - `mkdir -p my-app/data my-app/scripts`
    - Tracked files: `git mv` to `my-app/data/Lowell.md`, `my-app/scripts/chatbot.py`, `my-app/scripts/requirements.txt`
    - Untracked files: plain `mv` to the same targets, and report that they had no git history
    - Do not edit file contents in this step
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x]* 1.2 Add `__pycache__/` to `my-app/.gitignore`
    - Optional; the CLI runs as a script so no bytecode is expected
    - _Requirements: 1.2_

- [x] 2. Point the web chatbot at the relocated knowledge base
  - [x] 2.1 Update `my-app/config/app.ts`
    - Set `AI_CONFIG.knowledgeBaseFile` to `"data/Lowell.md"`
    - Replace the "repo root (one level above my-app)" comment with one describing the path as relative to the app directory (`my-app/data/Lowell.md`)
    - _Requirements: 2.2, 5.1_

  - [x] 2.2 Update `my-app/app/api/chatbot/route.ts`
    - Change the path expression in `loadKnowledgeBase` to `path.join(process.cwd(), AI_CONFIG.knowledgeBaseFile)` (no `..`)
    - Update the knowledge base location comment to `my-app/data/Lowell.md`
    - Update the Python prototype comment (around line 32) to name `my-app/scripts/chatbot.py`
    - Leave production caching, per-request re-read in development, and the 500 error path unchanged
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 5.1, 5.2_

  - [x] 2.3 Update the comment in `my-app/lib/ai/prompts/chatbot.ts`
    - Change the "Mirrors the behavior of the Python `chatbot.py` prototype" comment to reference `my-app/scripts/chatbot.py`
    - No code changes
    - _Requirements: 5.2_

- [x] 3. Update the Python CLI
  - [x] 3.1 Edit `my-app/scripts/chatbot.py` for the new layout
    - Add `from pathlib import Path` if missing and `APP_DIR = Path(__file__).resolve().parent.parent`
    - Replace the implicit `load_dotenv()` with `load_dotenv(APP_DIR / ".env.local")`
    - Set the knowledge base path to `APP_DIR / "data" / "Lowell.md"`
    - Keep the system prompt, model `claude-haiku-5-5`, the "ANTHROPIC_API_KEY is missing." exit, the loop, and error handling unchanged
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 4.1, 1.7_

- [x] 4. Update documentation and root files
  - [x] 4.1 Update `.kiro/steering/structure.md`
    - Show `my-app/data/Lowell.md` and `my-app/scripts/{chatbot.py,requirements.txt}` in the project tree; remove the root-level entries
    - Update conventions and file placement guidance: knowledge base content in `my-app/data/`, standalone scripts in `my-app/scripts/`
    - _Requirements: 5.3_

  - [x] 4.2 Update `.kiro/steering/tech.md`
    - State that secrets live in `my-app/.env.local`
    - List `pip3 install -r my-app/scripts/requirements.txt` and `python3 my-app/scripts/chatbot.py` as the Python run commands
    - Remove the known issue calling `claude-haiku-5-5` an invalid model identifier
    - Remove the note that the web app has no Anthropic integration
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 3.7_

  - [x] 4.3 Update `.kiro/steering/product.md`
    - Update any references to the knowledge base and Python prototype locations
    - _Requirements: 5.3_

  - [x] 4.4 Check root `README.md`, `LICENSE`, and `.gitignore` for old paths
    - Edit only lines that reference root-level `Lowell.md`, `chatbot.py`, or `requirements.txt`; leave the files untouched otherwise
    - Do not modify or delete the root `.env`
    - _Requirements: 5.7, 5.8, 4.2_

- [x] 5. Checkpoint - Verify the relocation
  - [x] 5.1 Run static checks in `my-app/`
    - `npx tsc --noEmit`
    - `npx eslint app/api/chatbot/route.ts config/app.ts lib/ai/prompts/chatbot.ts`
    - Fix any errors before continuing
    - _Requirements: 2.2, 2.6_

  - [x] 5.2 Verify file state
    - **Property 1: Every relocated file exists only at its new path**
    - **Property 2: Relocated content is preserved**
    - `test ! -e Lowell.md && test ! -e chatbot.py && test ! -e requirements.txt` at the repo root
    - Confirm exactly one `Lowell.md` exists outside `node_modules` and `.next`
    - SHA-256 of `my-app/data/Lowell.md` and `my-app/scripts/requirements.txt` matches the 1.1 baseline
    - `diff /tmp/chatbot.py.orig my-app/scripts/chatbot.py` shows only the `APP_DIR`, `load_dotenv`, and `file_path` changes (system prompt untouched); then delete `/tmp/chatbot.py.orig`
    - If any file was moved with `git mv`, `git status` shows it as a rename (`R`)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 5.3 Live check of `POST /api/chatbot`
    - **Property 4: Chatbot_API reads the relocated knowledge base**
    - Requires the dev server running from `my-app/`. If `localhost:3000` is not responding, ask the user to start `npm run dev`; do not launch it as a long-running process
    - POST `{"message": "Who is the mayor of Lowell?"}` (match the route's request schema) to `http://localhost:3000/api/chatbot` and confirm a 200 response citing Erik Gitschier
    - _Requirements: 2.1, 2.2, 2.4, 4.1_

  - [x] 5.4 Run the Python CLI from two working directories
    - **Property 3: Python_CLI path resolution is independent of working directory**
    - Never print or echo the API key
    - From the repo root: `echo exit | env -u ANTHROPIC_API_KEY python3 my-app/scripts/chatbot.py` → exit code 0, no traceback (proves the key comes from `my-app/.env.local`)
    - From `/tmp`: `echo exit | python3 /Users/saadkapadia/Desktop/Hackachusetts/my-app/scripts/chatbot.py` → exit code 0, no traceback
    - From the repo root: `pip3 install --dry-run -r my-app/scripts/requirements.txt` resolves without errors (packages are already installed, so nothing changes)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.7, 4.1_

  - [x] 5.5 Check for stale references and the root `.env`
    - **Property 5: No stale references remain**
    - `grep -rn` for `Lowell.md`, `chatbot.py`, and `requirements.txt`, excluding `node_modules`, `.next`, `.git`, `.kiro/specs/relocate-chatbot-into-my-app`, and `.env*` (`--exclude='.env*'`, so secret files are never read or echoed); confirm every hit uses the new paths
    - Confirm `.kiro/steering/tech.md` no longer contains the invalid-model known issue or the "no Anthropic integration" note
    - Confirm the root `.env` still exists with `test -f .env` (do not read or print its contents)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 4.2_

  - [x] 5.6 Run `npm run build` in `my-app/`
    - Safe while the user's dev server is running: Next.js 16 `next dev` writes to `.next/dev`, separate from the build output. Do not stop or restart the dev server
    - Must complete without errors
    - _Requirements: 2.6_

- [x] 6. Final checkpoint - Ensure all checks pass
  - Ensure all checks pass, ask the user if questions arise.
  - In the final summary, tell the user the root `.env` is now redundant and can be removed at their discretion
  - _Requirements: 4.3_

## Notes

- No property-based tests: the design rules them out for this refactor. The properties are verified by the checks in task 5.
- Task 1.2 is the only optional task.
- The live API check (5.3) depends on the user running `npm run dev`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3", "3.1", "4.1", "4.2", "4.3", "4.4"] },
    { "id": 2, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5"] },
    { "id": 3, "tasks": ["5.6"] }
  ]
}
```
