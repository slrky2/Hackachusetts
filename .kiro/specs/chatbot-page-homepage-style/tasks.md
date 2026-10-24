# Implementation Plan

Notes for every task:
- `my-app` has no test framework. Do not add one or any dependency. Use the lightweight checks from the design: `curl`/grep against `localhost:3000`, an optional `renderToStaticMarkup` Node script, `npx tsc --noEmit`, `npx eslint`, and `npm run build`.
- If `curl -s -o /dev/null -w '%{http_code}' localhost:3000/` does not return `200`, stop and ask the user to start `npm run dev` in `my-app`. Do not launch a long-running process.
- Do not modify `my-app/app/api/chatbot/route.ts`, `Lowell.md`, `my-app/components/layout/Sidebar.tsx`, `my-app/app/(dashboard)/layout.tsx`, or `.kiro/specs/relocate-chatbot-into-my-app/`.
- Coordination: the `relocate-chatbot-into-my-app` spec may run in the same session and edits `route.ts`, `config/app.ts`, `lib/ai/prompts/chatbot.ts`, `chatbot.py`, and steering docs. This spec touches disjoint files. Only `npm run build` and the live POST check are shared; if either fails, check whether the failure comes from those other files before changing anything here.
- Temporary files (HTML baselines, render scripts) go in a temp dir outside the repo (e.g. `$(mktemp -d)`) and are deleted in task 5.

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Chatbot page matches homepage style with Chat active
  - **CRITICAL**: This check MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This check encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: The bug is deterministic and the domain is finite, so scope the property to the concrete cases: `render /chatbot` and `clickNav Home`
  - Confirm `localhost:3000` responds (see notes); if not, ask the user to start `npm run dev`
  - Save baselines to the temp dir: `curl -s localhost:3000/ > $TMP/home-before.html` and `curl -s localhost:3000/chatbot > $TMP/chatbot-before.html` (the `/` baseline is reused by task 3.8)
  - Assert expected behavior from isBugCondition / Property 1 against `/chatbot` HTML:
    - contains "City Land" (expect FAIL)
    - does NOT contain "CivicConnect" (expect FAIL)
    - contains `from-emerald-50 via-white to-emerald-50` (expect FAIL)
    - contains `rounded-2xl border border-black/5 bg-white shadow-sm` (expect FAIL)
    - does NOT match `bg-blue-|hover:bg-blue-|focus:ring-blue-` (expect FAIL)
    - Chat link has `text-emerald-600` and `aria-current="page"` (expect FAIL)
  - Assert against `/` HTML: Home nav link has `href="/"` and no `href="/feed"` (expect FAIL)
  - Static grep of `my-app/components/chatbot/ChatInterface.tsx`: contains `focus:ring-emerald-500`, `rounded-full bg-emerald-600`, `from-emerald-500 to-teal-600`, and no `blue-` (expect FAIL)
  - Run on UNFIXED code
  - **EXPECTED OUTCOME**: Checks FAIL (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g. "`/chatbot` contains CivicConnect Sidebar, `bg-zinc-50`, `bg-blue-600`; no City Land header"; "Home `href=\"/feed\"`") to confirm the root cause (route group layout, inline non-shared header, hardcoded blue classes, hardcoded Home href)
  - Mark task complete when checks are written, run, and failures are documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Homepage, navigation, chat behavior, and other routes unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe on UNFIXED code (non-bug-condition inputs) and record results in the temp dir:
    - `/` header classes: Home `text-emerald-600` with filled HomeIcon; feed, map placeholder (MapIcon), and City Problems sections present (baseline `home-before.html` from task 1)
    - nav hrefs on `/`: Map `/map`, Bounties `/bounties`, Chat `/chatbot`; Report is a `<button type="button">` with gradient pill classes and no href
    - for each route in `{/feed, /map, /bounties, /channels, /issues, /notifications, /profile, /admin}`: HTML contains "CivicConnect" (Sidebar present); record status codes
    - `curl -s -X POST localhost:3000/api/chatbot -H 'Content-Type: application/json' -d '{"message":"hi","history":[]}'` returns JSON with a `reply` field (record shape only; content varies)
    - `ChatInterface.tsx` logic baseline: copy the file to the temp dir so task 3.8 can confirm only className strings changed
    - `git status --porcelain` for the protected files (route.ts, Lowell.md, Sidebar.tsx, dashboard layout, relocate spec) - record as baseline, since the other spec may legitimately change route.ts
  - Write the checks as an exhaustive enumeration over the finite domain (stands in for random property generation): every nav item × every route above, every dashboard route for Sidebar presence
  - Run checks on UNFIXED code
  - **EXPECTED OUTCOME**: Checks PASS (this confirms baseline behavior to preserve)
  - Mark task complete when checks are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10_

- [x] 3. Fix for chatbot page not matching homepage style

  - [x] 3.1 Create shared nav icons module
    - New file `my-app/components/layout/NavIcons.tsx`
    - Move `HomeIcon({ active })`, `MapIcon`, `BountyIcon`, `ChatIcon`, `PlusIcon` verbatim from `my-app/app/page.tsx` as named exports
    - No `"use client"` (pure SVG)
    - _Bug_Condition: isBugCondition(input) where input.route = "/chatbot" AND NOT containsSiteHeader(html)_
    - _Expected_Behavior: Property 1 - same icons render in the shared header_
    - _Preservation: icons identical on `/` (3.1)_
    - _Requirements: 2.1, 3.1_

  - [x] 3.2 Create shared SiteHeader component
    - New file `my-app/components/layout/SiteHeader.tsx`, export `NavKey = "home" | "map" | "bounties" | "chat"` and `SiteHeader({ active }: { active?: NavKey })`
    - Move the `<header>` JSX (logo tile, "City Land" h1, nav, "Sign in / Login" button) from `app/page.tsx` with identical classes
    - `NAV_ITEMS` keyed by `NavKey | "report"`: Home `href: "/"`, Map `/map`, Report (big, no href), Bounties `/bounties`, Chat `/chatbot`
    - `isActive = item.key === active`, reuse the existing className expression in place of `item.active`; render `<HomeIcon active={active === "home"} />`
    - Add `aria-current="page"` to the active `Link` only; keep existing `aria-label`s
    - No `usePathname`, no `"use client"`; use `import type { ReactNode } from "react"`
    - _Bug_Condition: isBugCondition(input) where action = "clickNav" AND navItem = "Home" AND hrefOf("Home") != "/"; or route = "/chatbot" AND activeNavItem(html) != "Chat"_
    - _Expected_Behavior: for all active ∈ {home, map, bounties, chat, undefined}, exactly the matching item (or none) is active and Home href is "/"_
    - _Preservation: header classes, Map/Bounties/Chat hrefs, and Report button unchanged (3.1, 3.2)_
    - _Requirements: 2.1, 2.6, 2.7, 3.1, 3.2_

  - [x] 3.3 Use SiteHeader on the homepage
    - In `my-app/app/page.tsx`, delete the inline icons, `NAV_ITEMS`, and `<header>`
    - Render `<SiteHeader active="home" />` as the first child of the unchanged shell div
    - Import `MapIcon` from `@/components/layout/NavIcons` for the map placeholder; remove the `Link` import if unused
    - Keep `CITY_TICKETS`, `severityStyles`, and the body unchanged
    - _Bug_Condition: Home href = "/feed" (1.7)_
    - _Expected_Behavior: Home href = "/" (2.7)_
    - _Preservation: `/` header appearance and body unchanged except Home href and aria-current (3.1)_
    - _Requirements: 2.7, 3.1_

  - [x] 3.4 Move chatbot page out of the dashboard route group
    - Check `git ls-files "my-app/app/(dashboard)/chatbot/page.tsx"`; use `git mv` if tracked, plain `mv` otherwise, to `my-app/app/chatbot/page.tsx`
    - Remove the empty `my-app/app/(dashboard)/chatbot/` directory; confirm only one `app/**/chatbot/page.tsx` exists (avoids a Next.js route conflict)
    - Do not modify `app/(dashboard)/layout.tsx` or `Sidebar.tsx`
    - _Bug_Condition: isBugCondition(input) where route = "/chatbot" AND containsSidebar(html)_
    - _Expected_Behavior: no Sidebar on `/chatbot`, URL still `/chatbot`_
    - _Preservation: other dashboard routes keep the Sidebar (3.8); URL unchanged (3.7)_
    - _Requirements: 2.1, 3.7, 3.8_

  - [x] 3.5 Apply homepage shell and card to the chatbot page
    - `my-app/app/chatbot/page.tsx` is a server component
    - Outer div: `flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50`, then `<SiteHeader active="chat" />`
    - `<main className="flex min-h-0 flex-1 justify-center overflow-hidden p-4 sm:p-6">`
    - Card: `flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900`
    - Card header row: `flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10` with `<h2 className="text-lg font-bold">CivicBot</h2>` and an emerald pill (`rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300`) showing `APP_CONFIG.defaultCity`
    - Below it: `<div className="min-h-0 flex-1"><ChatInterface /></div>`
    - _Bug_Condition: isBugCondition(input) where route = "/chatbot" AND (NOT hasHomepageShell(html) OR NOT hasHomepageCard(html) OR NOT containsSiteHeader(html) OR activeNavItem(html) != "Chat")_
    - _Expected_Behavior: Property 1 - homepage shell, card, `text-lg font-bold` heading, Chat active_
    - _Preservation: `/chatbot` URL unchanged (3.7)_
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 3.7_

  - [x] 3.6 Swap ChatInterface blue classes for emerald
    - In `my-app/components/chatbot/ChatInterface.tsx`, change className strings only; no logic changes
    - User bubble: `bg-blue-600 text-white` → `bg-gradient-to-br from-emerald-500 to-teal-600 text-white` (keep `ml-auto whitespace-pre-wrap`)
    - Input row border: `border-zinc-200 dark:border-zinc-800` → `border-black/5 dark:border-white/10`
    - Input: `rounded-lg border-zinc-300 dark:border-zinc-700 ... focus:ring-blue-500` → `rounded-full border-black/10 dark:border-white/10 ... focus:ring-emerald-500`
    - Send button: `rounded-lg bg-blue-600 ... hover:bg-blue-700` → `rounded-full bg-emerald-600 font-semibold shadow-sm hover:bg-emerald-700 active:scale-95`; keep `disabled:opacity-50`
    - Leave assistant, loading, and error bubbles unchanged (zinc / red)
    - _Bug_Condition: isBugCondition(input) where route = "/chatbot" AND containsBlueAccent(html)_
    - _Expected_Behavior: no `bg-blue-`, `hover:bg-blue-`, `focus:ring-blue-`; emerald bubble, focus ring, and rounded-full Send_
    - _Preservation: send, history, markdown, Thinking…, error, disabled, Enter, empty-guard logic unchanged (3.3–3.6)_
    - _Requirements: 2.4, 2.5, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Chatbot page matches homepage style with Chat active
    - **IMPORTANT**: Re-run the SAME checks from task 1 - do NOT write new checks
    - The checks from task 1 encode the expected behavior
    - Re-run task 1's `/chatbot`, `/`, and `ChatInterface.tsx` grep assertions against the fixed code (dev server must be running; ask the user to start it if not)
    - Additionally run the fix-checking enumeration from the design: optional Node script in the temp dir that transpiles `NavIcons.tsx` and `SiteHeader.tsx` with the installed `typescript` package (stub `next/link` as `<a>` if needed), renders `SiteHeader` with `react-dom/server` `renderToStaticMarkup` for each `active ∈ {"home", "map", "bounties", "chat", undefined}`, and asserts `aria-current="page"` count is 1 (0 for undefined), the active label matches, HomeIcon is filled only for `"home"`, and Home `href="/"`; delete the script afterwards
    - Confirm Home link on `/chatbot` has `text-zinc-600`
    - **EXPECTED OUTCOME**: Checks PASS (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** - Homepage, navigation, chat behavior, and other routes unchanged
    - **IMPORTANT**: Re-run the SAME checks from task 2 - do NOT write new checks
    - Diff `curl -s localhost:3000/` against `home-before.html`, normalizing React-generated ids; the only allowed differences are Home `href` (`/feed` → `/`) and the added `aria-current="page"`
    - Re-run the nav href enumeration on both `/` and `/chatbot`, and the Sidebar check on every other dashboard route
    - Re-run the POST to `/api/chatbot`; expect JSON with `reply` (if it fails, check whether the other spec's in-progress edits to `route.ts` are the cause before changing this spec's files)
    - Diff `ChatInterface.tsx` against the saved copy: only className strings changed
    - Compare `git status --porcelain` for the protected files against the baseline: no changes from this spec
    - **EXPECTED OUTCOME**: Checks PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10_

- [x] 4. Static checks and build
  - Run `npx tsc --noEmit` in `my-app`
  - Run `npx eslint components/layout/NavIcons.tsx components/layout/SiteHeader.tsx app/page.tsx app/chatbot/page.tsx components/chatbot/ChatInterface.tsx` in `my-app`
  - Run `npm run build` in `my-app`; confirm success, no route conflict, and `○ /` and `○ /chatbot` listed as static
  - If the build fails in files owned by the relocate spec (`route.ts`, `config/app.ts`, `lib/ai/prompts/chatbot.ts`), report it rather than editing those files
  - _Requirements: 3.9_

- [x] 5. Clean up temporary files
  - Delete the temp dir with HTML baselines, the saved `ChatInterface.tsx` copy, and any render script
  - Confirm `git status` shows no stray files from verification
  - _Requirements: 3.10_

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all checks from tasks 3.7, 3.8, and 4 pass, ask the user if questions arise.
  - Suggest the manual integration pass from the design: `/` → Chat → Home in the dev server, send a message on `/chatbot`, and check light and dark mode
