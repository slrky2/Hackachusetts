# Implementation Plan: community-channels-layout

## Overview

Build the Discord-style `/chatbot` page in TypeScript (Next.js App Router, React 19, Tailwind v4). Work runs bottom-up. First record checksums of the protected files and add the test tooling (Vitest + fast-check, exact-pinned). Then build the static data module and the pure logic module, with property tests next to each piece. After that come the client components and the `ChannelsView` island, wired into the server page under `<Suspense>`. The plan ends with automated verification (types, lint, tests, build, curl smoke checks, protected-file checksums) and a manual browser checklist for the user.

All commands run from `my-app/` unless noted. Never start long-running processes (`npm run dev`, watch mode). If the dev server is needed, ask the user to start it.

Protected files, which must not be modified by any task: `components/layout/SiteHeader.tsx`, `app/page.tsx`, `components/chatbot/ChatInterface.tsx`, `app/api/chatbot/route.ts`, `data/Lowell.md`, everything under `app/(dashboard)/`, `app/api/channels/route.ts`, `components/channels/MessageThread.tsx`, `components/channels/MessageInput.tsx`, `types/index.ts`.

## Tasks

- [x] 1. Baseline and test tooling
  - [x] 1.1 Record SHA-256 checksums of the protected files before any change
    - From `my-app/`, write checksums of every protected file (expand `app/(dashboard)/` recursively with `find "app/(dashboard)" -type f`) to `../.kiro/specs/community-channels-layout/protected-files.sha256` using `shasum -a 256`, with paths relative to `my-app/`
    - Use checksums, not `git status`, because the repo already has unrelated uncommitted changes
    - Confirm the file lists all 10 protected entries (plus every file under `(dashboard)`)
    - _Requirements: 8.1, 8.2, 8.3_
  - [x] 1.2 Add Vitest and fast-check with a single-run test script
    - Run `npm i -D -E vitest fast-check` (exact pinned versions, dev-only)
    - Add `"test": "vitest --run"` to `package.json` scripts; leave the other scripts unchanged
    - Create `my-app/vitest.config.ts` using `defineConfig` from `vitest/config`, with `resolve.alias` mapping `@` to the app root (`fileURLToPath(new URL(".", import.meta.url))`) and `test.environment: "node"`
    - Run `npx tsc --noEmit` to confirm the config type-checks. Until tests exist, `npm test` reporting "No test files found" is expected.
    - _Requirements: 8.4, 8.5_

- [x] 2. Channel data module
  - [x] 2.1 Create `my-app/lib/channels/data.ts`
    - Export `COMMUNITY_SLUGS`, `CommunitySlug`, `ChannelSlug`, `ChannelDef`, `CHANNEL_GROUPS`, `CHANNELS` (sidebar order: five community channels, then `chatbot`), `DemoMessage`, and `DEMO_MESSAGES`, exactly as in the design's Data Models section
    - Write the full demo strings following the design's seed table: 3 messages per community channel, invented author names, generic/example locations, fixed ascending ISO timestamps in October 2026, ids like `demo-general-1`
    - Follow `data/Lowell.md` Section 9 demo rules: no current emergencies, closures, or official City of Lowell announcements, and wording that marks content as sample/example where natural
    - No React and no DOM; plain data only
    - _Requirements: 2.1, 2.2, 2.3, 3.6, 5.2, 5.5_
  - [x] 2.2 Write example tests in `my-app/lib/channels/data.test.ts`
    - Import `describe/it/expect` explicitly from `vitest`
    - Community group order is exactly `general, new-food-places, events, lost-and-found, road-reports`. Assistant group is exactly `["chatbot"]`
    - Slugs are unique and match `/^[a-z]+(-[a-z]+)*$/`. Every description is non-empty and has no newline
    - Every community slug has at least 3 demo messages, with ids unique across all channels and timestamps strictly ascending within each channel
    - Keyword denylist on demo text (case-insensitive, e.g. "emergency", "closed today", "evacuat", "City of Lowell announces", "official notice") as a backstop to manual review
    - _Requirements: 2.1, 2.2, 2.3, 3.6, 5.2, 5.5_

- [x] 3. Pure channel logic in `my-app/lib/channels/state.ts`
  - [x] 3.1 Implement slug resolution and channel helpers
    - Export `DEFAULT_CHANNEL = "chatbot"`, `isChannelSlug`, `resolveChannelSlug` (exact, case-sensitive match against `CHANNELS`; `null`/`undefined`/anything else returns `"chatbot"`), `channelHref` (`/chatbot?channel=${slug}`), and `getChannel`
    - No React, no DOM, no `Date.now()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 3.2 Write property test for channel resolution in `my-app/lib/channels/state.test.ts`
    - **Property 1: Channel resolution is total and exact**
    - One `fc.assert(fc.property(...), { numRuns: 100 })` with tag comment `// Feature: community-channels-layout, Property 1: Channel resolution is total and exact`
    - Generator: `fc.oneof` of valid slugs, `fc.string()`, `fc.string({ unit: "binary" })`, `null`, `undefined`, and case/whitespace mutations of valid slugs (fast-check v4 API)
    - **Validates: Requirements 3.2, 3.3, 3.4**
  - [x] 3.3 Write property test for channel link round trip
    - **Property 2: Channel link round trip**
    - One `fc.assert` (numRuns >= 100) over `fc.constantFrom(...all six slugs)`. Parse with `new URL(channelHref(s), "http://localhost")`, then assert the pathname is `/chatbot` and that `resolveChannelSlug(url.searchParams.get("channel")) === s`
    - Tag comment `// Feature: community-channels-layout, Property 2: Channel link round trip`
    - **Validates: Requirements 3.1, 3.2**
  - [x] 3.4 Implement message text preparation and the session reducer
    - Export `MAX_MESSAGE_LENGTH = 1000`, `VISITOR_DISPLAY_NAME = "You"`, `SessionMessage`, `SessionState`, `SessionAction`, `prepareMessageText` (trim ends only; `null` if empty or longer than 1000), `createInitialSessionState` (every community slug maps to `[]`), and `sessionReducer`
    - The reducer re-runs `prepareMessageText`. It returns the identical state object for invalid text. Otherwise it returns a new state with one message appended to `state[channel]` (author `"You"`, id and timestamp from the action) and keeps the other channels' array references
    - _Requirements: 6.2, 6.4, 6.5, 6.7, 6.8_
  - [x] 3.5 Write property test for valid posts
    - **Property 3: Valid posts append one prepared visitor message**
    - One `fc.assert` (numRuns >= 100). Build a reachable state from a random prefix of post actions, pick a random community slug, id, and ISO timestamp, and use raw text with 1–1000 trimmed characters including internal newlines and surrounding whitespace. Assert `next[c]` equals `[...prev[c], { id, author: "You", timestamp, text: raw.trim() }]`
    - Tag comment `// Feature: community-channels-layout, Property 3: Valid posts append one prepared visitor message`
    - **Validates: Requirements 6.2, 6.8**
  - [x] 3.6 Write property test for invalid text rejection
    - **Property 4: Invalid text is rejected without changing state**
    - One `fc.assert` (numRuns >= 100). Text is `fc.oneof` of the empty string, whitespace-only `fc.string({ unit: fc.constantFrom(" ", "\t", "\n", "\r", "\u00a0", "\u2003") })`, and strings whose trimmed length is 1001–3000. Assert `prepareMessageText(raw) === null` and `sessionReducer(state, post(raw)) === state` for a reachable state and any channel
    - Tag comment `// Feature: community-channels-layout, Property 4: Invalid text is rejected without changing state`
    - **Validates: Requirements 6.4, 6.5**
  - [x] 3.7 Implement the display message selector
    - Export the `DisplayMessage` union and `getChannelMessages(slug, state)`, returning `DEMO_MESSAGES[slug]` tagged `kind: "demo"` followed by `state[slug]` tagged `kind: "session"`
    - _Requirements: 5.1, 6.6_
  - [x] 3.8 Write model-based property test for channel message order
    - **Property 5: Channel messages match the demo-then-posted model**
    - One `fc.assert` (numRuns >= 100) over `fc.array(postAction, { maxLength: 50 })` with random channels and a mix of valid and invalid texts. Fold the actions through `sessionReducer` alongside a simple model (per-channel arrays of valid, trimmed posts). For every community slug, assert `getChannelMessages(c, final)` deep-equals the demo messages (kind demo, original order) followed by the model's posts (kind session, dispatch order)
    - Tag comment `// Feature: community-channels-layout, Property 5: Channel messages match the demo-then-posted model`
    - **Validates: Requirements 5.1, 6.6**
  - [x] 3.9 Implement message metadata helpers
    - Export `authorInitial(name)`, which returns the first non-whitespace code point uppercased, or `"?"` if there is none
    - Export `formatMessageTime(iso)`, which uses one module-level `Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })`, e.g. "Oct 18, 2:15 PM"
    - _Requirements: 5.3_
  - [x] 3.10 Write property test for metadata helpers
    - **Property 6: Message metadata rendering helpers are total and deterministic**
    - One `fc.assert` (numRuns >= 100) combining an arbitrary author string (including whitespace-only and non-BMP characters) with `fc.date({ min: new Date("2000-01-01"), max: new Date("2100-01-01"), noInvalidDate: true })` converted to ISO. Assert `authorInitial` matches the reference definition (first non-whitespace code point uppercased, or `"?"`), and that `formatMessageTime(iso)` is non-empty and equal across two calls
    - Tag comment `// Feature: community-channels-layout, Property 6: Message metadata rendering helpers are total and deterministic`
    - **Validates: Requirements 5.3**

- [x] 4. Checkpoint - Ensure all tests pass
  - Run `npm test` and `npx tsc --noEmit` from `my-app/`. Ensure all tests pass, ask the user if questions arise.

- [x] 5. Channel UI components (new files under `my-app/components/channels/`)
  - [x] 5.1 Create `ChannelMessage.tsx`
    - Props `{ message: DisplayMessage }`. Show an `aria-hidden` initial avatar (emerald→teal gradient; `bg-zinc-700` for "You"), the author name, `<time dateTime>` via `formatMessageTime`, a small `DEMO` tag for demo messages, and the text in `<p className="whitespace-pre-wrap break-words ...">` as plain React text (no Markdown, no `dangerouslySetInnerHTML`)
    - Light and dark text colors exactly as in the design
    - _Requirements: 5.3, 6.8, 7.8_
  - [x] 5.2 Create `MessageComposer.tsx` (`"use client"`)
    - Props `{ channelSlug: CommunitySlug; onSubmit: (text: string) => void }`. Keep `draft` in `useState`; derive `prepared = prepareMessageText(draft)`
    - Form with an sr-only `<label>` "Message #slug" bound to the textarea `id`. Textarea has `rows={1}`, `maxLength={MAX_MESSAGE_LENGTH}`, placeholder `Message #slug`, and an emerald focus ring
    - Send button: ChatInterface emerald pill style, `type="submit"`, `disabled={prepared === null}`
    - `onKeyDown`: on Enter without Shift and not `nativeEvent.isComposing`, call `preventDefault` and submit if `prepared !== null`. Shift+Enter falls through to insert a newline. Submitting calls `onSubmit(prepared)` and clears the draft
    - No `fetch` or any network call
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 7.6_
  - [x] 5.3 Create `CommunityChannelPane.tsx` (`"use client"`)
    - Props `{ channel: ChannelDef; messages: readonly DisplayMessage[]; onPost: (text: string) => void }`
    - Header: `h2` `#slug` plus a one-line truncated description. Below it, the amber DEMO / FICTIONAL banner with the design's exact copy
    - Log container `role="log"` with `aria-label="Messages in #slug"`, `min-h-0 flex-1 overflow-y-auto`, rendering `ChannelMessage` for each message
    - `useEffect` on `messages.length` sets `logRef.current.scrollTop = scrollHeight` (no `scrollIntoView`)
    - Footer renders `MessageComposer` wired to `onPost`
    - _Requirements: 1.7, 3.6, 5.1, 5.3, 5.4, 5.6, 6.1, 7.5, 7.8_
  - [x] 5.4 Create `ChannelSidebar.tsx` (`"use client"`)
    - Props `{ selected: ChannelSlug }`. Root `<nav aria-label="Channels">` with the sidebar card classes (`max-h-[25vh] overflow-y-auto` on narrow, `md:max-h-none md:w-64`)
    - Top: `h2` with `APP_CONFIG.defaultCity` and a muted "Community channels" subtitle
    - One `section` per `CHANNEL_GROUPS` entry, each with an `h3` label and a `ul` of `next/link` entries (`href={channelHref(slug)}`, `prefetch={false}`), with `aria-current="page"` only on the selected entry
    - Entry text is `<span aria-hidden="true">#</span>{slug}`. The selected entry has the emerald highlight, unselected entries have the zinc hover style, and all entries get the emerald `focus-visible` ring with offset (light and dark)
    - Define a local `BotIcon` inline SVG (`aria-hidden="true"`, same style as `components/layout/NavIcons.tsx`) and an "AI" pill on the `chatbot` entry, so the accessible name is "chatbot AI"
    - `handleClick`: for a primary-button click with no modifier keys, call `preventDefault()` and, unless the slug is already selected, `window.history.pushState(null, "", href)`. Otherwise leave the default link behavior
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.5, 7.1, 7.2, 7.3, 7.4, 7.7, 7.8_
  - [x] 5.5 Create `ChannelsSkeleton.tsx` (no directive, no hooks)
    - Same two-card geometry and responsive classes as `ChannelsView`: a sidebar card with six `animate-pulse` bars and a pane card with a header bar and three message placeholders, in light and dark surfaces
    - Root has `aria-busy="true"` and an sr-only "Loading channels…"
    - _Requirements: 1.2, 1.3, 1.5, 1.6_
  - [x] 5.6 Create `ChannelsView.tsx` (`"use client"`, default export)
    - `const slug = resolveChannelSlug(useSearchParams().get("channel"))` and `useReducer(sessionReducer, undefined, createInitialSessionState)`, plus a `useRef(0)` id counter
    - Root `mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 md:flex-row`. Render `<ChannelSidebar selected={slug} />` and the pane card
    - Inside the pane card, the chatbot wrapper is always mounted and gets the `hidden` class (via `cn`) when `slug !== "chatbot"`. It contains the CivicBot header (`h2` "CivicBot", "AI" pill, emerald city pill with `APP_CONFIG.defaultCity`) and `<div className="min-h-0 flex-1"><ChatInterface /></div>`. Do not modify `ChatInterface.tsx`
    - When `slug !== "chatbot"`, render `<CommunityChannelPane key={slug} ...>` with `getChannel(slug)` and `getChannelMessages(slug, session)`. `onPost` dispatches a `post` action whose id is `session-${nextId.current++}` and whose timestamp is `new Date().toISOString()`, both created inside the handler only
    - _Requirements: 1.2, 1.3, 1.7, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 5.1, 6.2, 6.6, 6.7_

- [x] 6. Wire the page
  - [x] 6.1 Replace the card in `my-app/app/chatbot/page.tsx` with the server shell
    - Server component (no `"use client"`). Gradient shell `flex h-screen flex-col overflow-hidden ...`, `<SiteHeader active="chat" />`, and `<main className="flex min-h-0 flex-1 overflow-hidden p-4 sm:p-6">` containing `<Suspense fallback={<ChannelsSkeleton />}><ChannelsView /></Suspense>`
    - Do not read `searchParams`, `cookies()`, `headers()`, or the current time, so the route still prerenders under Cache Components
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 3.7, 8.1, 8.4_

- [x] 7. Automated verification
  - [x] 7.1 Run type check, lint, tests, and production build
    - `npx tsc --noEmit`: no type errors
    - `npx eslint app/chatbot/page.tsx components/channels/ChannelsView.tsx components/channels/ChannelSidebar.tsx components/channels/CommunityChannelPane.tsx components/channels/ChannelMessage.tsx components/channels/MessageComposer.tsx components/channels/ChannelsSkeleton.tsx lib/channels vitest.config.ts`: no errors. Also run `npm run lint` and confirm any remaining errors are only in files this feature did not touch
    - `npm test`: all data example tests and Properties 1–6 pass
    - `npm run build`: succeeds with Cache Components enabled, with no missing-Suspense or prerender-time errors. `/chatbot` is still listed as a prerendered route (static or partial prerender), not fully dynamic
    - Fix any failures in the feature's own files before moving on
    - _Requirements: 8.4, 8.5_
  - [x] 7.2 Run curl smoke checks and the no-network grep
    - First check `curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000/chatbot`. If the connection fails, stop and ask the user to run `npm run dev` in `my-app/` in their own terminal. Do not start the dev server.
    - Confirm HTTP 200 for `/chatbot`, `/chatbot?channel=general`, and `/chatbot?channel=bogus`
    - For each response, confirm the HTML contains the SiteHeader "City Land" heading and a Chat link with `href="/chatbot"` and `aria-current="page"`
    - Grep `components/channels/{ChannelsView,ChannelSidebar,CommunityChannelPane,MessageComposer,ChannelMessage}.tsx` and `lib/channels/*.ts` (excluding tests) for `fetch(` and expect no matches
    - _Requirements: 1.1, 3.3, 3.4, 3.7, 6.7_
  - [x] 7.3 Verify protected files are unchanged
    - From `my-app/`, run `shasum -a 256 -c ../.kiro/specs/community-channels-layout/protected-files.sha256` and expect every line `OK`. Also confirm `find "app/(dashboard)" -type f | wc -l` matches the number of `(dashboard)` entries recorded in 1.1
    - If any file differs, revert this feature's change to that file. Do not touch unrelated pre-existing edits
    - Once all checks pass, delete `protected-files.sha256`
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Hand the user the design's manual browser checklist and ask them to confirm:
    - Layout at wide (≥768px) and narrow (<768px) widths; narrow sidebar stays ≤25vh and scrolls; only the message log scrolls (1.2–1.4, 1.7)
    - Sidebar: two groups in order, `#` prefixes, bot icon + AI pill on `#chatbot`, Lowell, MA heading, emerald highlight follows the selection (2.1–2.6)
    - Channel switching updates the URL with no full reload; Back/Forward restores channels; reloading `?channel=events` opens `#events`; `/chatbot` and `?channel=bogus` open `#chatbot`; pane header shows name and description (3.1–3.6)
    - `#chatbot`: CivicBot header with AI and city pills; ask a question and get a Markdown reply; switch to `#general` and back, and the conversation survives (4.1–4.4)
    - Community channels: DEMO / FICTIONAL banner, avatars, names, and times; auto-scroll to newest; Enter sends, Shift+Enter adds a newline, whitespace-only keeps Send disabled; pasting over 1000 chars truncates; posts survive switching; no network request on send; `<b>hi</b>` shows as literal text (5.1–5.6, 6.1–6.8)
    - Dark mode surfaces and contrast in both schemes; Tab focus ring visible on sidebar links; accessibility tree shows the "Channels" nav, group headings, a single `aria-current`, the log region, the composer label, and "chatbot AI" (1.6, 7.1–7.8). Full WCAG validation needs manual testing with assistive technologies and expert accessibility review.

## Notes

- The user chose to add the test tooling, so the tooling setup, the data example tests, and the property tests (Properties 1–6) are all required. None are marked optional.
- Each property test is one `fc.assert` with `numRuns >= 100`, has the tag comment `// Feature: community-channels-layout, Property N: ...`, and imports from `vitest` explicitly (no globals).
- Tasks 3.1–3.10 share `state.ts` and `state.test.ts`, so they run sequentially in the dependency graph.
- Protected files are checked by SHA-256 checksums (1.1 and 7.3) rather than `git status`, because the repo already has unrelated uncommitted changes.
- Never start `npm run dev` or any watcher. Ask the user to start the dev server for 7.2.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["2.2", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.4"] },
    { "id": 5, "tasks": ["3.3", "3.7"] },
    { "id": 6, "tasks": ["3.5", "3.9"] },
    { "id": 7, "tasks": ["3.6"] },
    { "id": 8, "tasks": ["3.8"] },
    { "id": 9, "tasks": ["3.10"] },
    { "id": 10, "tasks": ["5.1", "5.2", "5.4", "5.5"] },
    { "id": 11, "tasks": ["5.3"] },
    { "id": 12, "tasks": ["5.6"] },
    { "id": 13, "tasks": ["6.1"] },
    { "id": 14, "tasks": ["7.1"] },
    { "id": 15, "tasks": ["7.2", "7.3"] }
  ]
}
```
