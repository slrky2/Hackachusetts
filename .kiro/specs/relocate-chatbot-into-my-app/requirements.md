# Requirements Document

## Introduction

The Lowell knowledge base (`Lowell.md`), the Python CLI prototype (`chatbot.py`), and its dependency list (`requirements.txt`) currently live at the repository root, outside the Next.js app in `my-app/`. This feature relocates them into `my-app/` so the project is self-contained, while keeping both the web chatbot (`/api/chatbot`) and the Python CLI working. Both consumers read the same single knowledge base file, and the Python CLI reads the Anthropic API key from the same `my-app/.env.local` file the web app uses. Documentation and steering files are updated to reflect the new locations.

## Glossary

- **Repo_Root**: The repository root directory, `/Users/saadkapadia/Desktop/Hackachusetts`.
- **App_Dir**: The Next.js application directory, `my-app/` under the Repo_Root.
- **Knowledge_Base**: The Markdown file containing Lowell city information, relocated to `my-app/data/Lowell.md`.
- **Python_CLI**: The interactive Python chatbot script, relocated to `my-app/scripts/chatbot.py`.
- **Python_Requirements**: The Python dependency list, relocated to `my-app/scripts/requirements.txt`.
- **Chatbot_API**: The Next.js route handler at `my-app/app/api/chatbot/route.ts` serving `POST /api/chatbot`.
- **App_Config**: The configuration module at `my-app/config/app.ts`, including `AI_CONFIG.knowledgeBaseFile`.
- **App_Env_File**: The environment file `my-app/.env.local` holding `ANTHROPIC_API_KEY`.
- **Root_Env_File**: The environment file `.env` at the Repo_Root, which holds a secret.
- **Steering_Docs**: The files `.kiro/steering/structure.md`, `.kiro/steering/tech.md`, and `.kiro/steering/product.md`.
- **Source_Comments**: Code comments in the Chatbot_API, App_Config, and `my-app/lib/ai/prompts/chatbot.ts` that reference file locations.
- **Relocation**: The set of file moves, code changes, and documentation changes described in this document.

## Requirements

### Requirement 1: Relocate files into the app directory

**User Story:** As a developer, I want the knowledge base, Python CLI, and Python dependencies to live inside `my-app/`, so that the app folder is self-contained.

#### Acceptance Criteria

1. THE Relocation SHALL place the Knowledge_Base at `my-app/data/Lowell.md`.
2. THE Relocation SHALL place the Python_CLI at `my-app/scripts/chatbot.py`.
3. THE Relocation SHALL place the Python_Requirements at `my-app/scripts/requirements.txt`.
4. THE Relocation SHALL move each git-tracked file among the Knowledge_Base, the Python_CLI, and the Python_Requirements using `git mv` so that its git history is preserved, and SHALL move each untracked file with a plain filesystem move and report that no git history exists for it.
5. WHEN the Relocation is complete, THE Repo_Root SHALL contain no `Lowell.md`, `chatbot.py`, or `requirements.txt` file.
6. THE Relocation SHALL keep a single copy of the Knowledge_Base that is shared by the Chatbot_API and the Python_CLI.
7. THE Relocation SHALL preserve the contents of the Knowledge_Base, the Python_Requirements, and the Python_CLI system prompt unchanged apart from the path and environment loading changes defined in Requirement 3.

### Requirement 2: Web chatbot reads the relocated knowledge base

**User Story:** As a resident using the web chatbot, I want answers grounded in the Lowell knowledge base, so that the assistant keeps working after the move.

#### Acceptance Criteria

1. WHEN the Chatbot_API receives a valid request, THE Chatbot_API SHALL read the Knowledge_Base from `my-app/data/Lowell.md`.
2. THE App_Config SHALL define `AI_CONFIG.knowledgeBaseFile` as a path that resolves to `my-app/data/Lowell.md` when combined with the App_Dir.
3. WHILE `NODE_ENV` is `production`, THE Chatbot_API SHALL read the Knowledge_Base from disk once per server process and reuse the cached content for subsequent requests.
4. WHILE `NODE_ENV` is not `production`, THE Chatbot_API SHALL re-read the Knowledge_Base from disk on each request.
5. IF the Knowledge_Base cannot be read, THEN THE Chatbot_API SHALL respond with HTTP status 500 and an error message.
6. WHEN the Relocation is complete, THE App_Dir SHALL pass `next build` without errors.

### Requirement 3: Python CLI works from any working directory

**User Story:** As a developer, I want to run the Python CLI from the repo root or any other directory, so that the prototype stays usable after the move.

#### Acceptance Criteria

1. THE Python_CLI SHALL resolve the Knowledge_Base path relative to the Python_CLI file location as `my-app/data/Lowell.md`.
2. THE Python_CLI SHALL load environment variables from the App_Env_File, resolved relative to the Python_CLI file location.
3. WHEN the Python_CLI is started from the Repo_Root with `python3 my-app/scripts/chatbot.py`, THE Python_CLI SHALL load `ANTHROPIC_API_KEY` and the Knowledge_Base.
4. WHEN the Python_CLI is started from a working directory other than the Repo_Root, THE Python_CLI SHALL load `ANTHROPIC_API_KEY` and the Knowledge_Base.
5. IF `ANTHROPIC_API_KEY` is absent from the App_Env_File and the process environment, THEN THE Python_CLI SHALL exit with the message "ANTHROPIC_API_KEY is missing."
6. THE Python_CLI SHALL use the model identifier `claude-haiku-5-5`.
7. WHEN a developer runs `pip3 install -r my-app/scripts/requirements.txt` from the Repo_Root, THE Python_Requirements SHALL install the dependencies required by the Python_CLI.

### Requirement 4: Single API key source

**User Story:** As a developer, I want one place for the Anthropic API key, so that I do not have to keep two secret files in sync.

#### Acceptance Criteria

1. THE App_Env_File SHALL be the single source of `ANTHROPIC_API_KEY` for both the Chatbot_API and the Python_CLI.
2. THE Relocation SHALL leave the Root_Env_File in place.
3. WHEN the Relocation is complete, THE Relocation SHALL inform the user that the Root_Env_File is redundant and can be removed at the user's discretion.

### Requirement 5: References and documentation reflect new locations

**User Story:** As a developer, I want code comments and steering docs to point to the new locations, so that nobody is misled by stale paths.

#### Acceptance Criteria

1. THE Source_Comments SHALL describe the Knowledge_Base location as `my-app/data/Lowell.md`.
2. THE Source_Comments that reference the Python prototype SHALL name the Python_CLI path as `my-app/scripts/chatbot.py`.
3. THE Steering_Docs SHALL describe the Knowledge_Base, the Python_CLI, and the Python_Requirements at their relocated paths in the project tree, conventions, and file placement guidance.
4. THE `.kiro/steering/tech.md` file SHALL state that secrets live in the App_Env_File and SHALL list `pip3 install -r my-app/scripts/requirements.txt` and `python3 my-app/scripts/chatbot.py` as the Python run commands.
5. THE `.kiro/steering/tech.md` file SHALL omit the known issue stating that `claude-haiku-5-5` is an invalid model identifier.
6. THE `.kiro/steering/tech.md` file SHALL omit the note stating that the web app has no Anthropic integration.
7. WHEN the Relocation is complete, THE Repo_Root SHALL contain no references in source code, configuration, or Steering_Docs to the old root-level paths of the Knowledge_Base, the Python_CLI, or the Python_Requirements.
8. THE Relocation SHALL modify the root `README.md`, `LICENSE`, and `.gitignore` only where those files reference the old root-level paths.
