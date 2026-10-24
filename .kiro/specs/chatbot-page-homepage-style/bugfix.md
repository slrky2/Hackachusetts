# Bugfix Requirements Document

## Introduction

The chatbot page (`/chatbot`) is visually inconsistent with the homepage (`/`). The homepage uses a "City Land" top header (emerald/teal logo tile, icon+label center nav, emerald "Sign in / Login" button), an emerald gradient page background, and rounded-2xl white/zinc-900 cards with emerald accents. The chatbot page instead renders inside the `(dashboard)` layout with a left "CivicConnect" sidebar using blue active links, a plain zinc background, no homepage header, and a chat UI styled in blue. Users moving between Home and Chat see two different-looking apps.

The fix makes `/chatbot` use the same top header, page shell, colors, and card style as the homepage, with the Chat nav item active, while keeping all chat functionality intact.

Constraints and context for later phases:
- Preferred approach: extract the homepage header and its inline SVG icons into shared components (for example `components/layout/SiteHeader.tsx` and `NavIcons.tsx`) used by both `/` and `/chatbot`, so the two cannot drift apart.
- The active nav item SHALL be passed as a prop, not derived via `usePathname`; in this Next.js 16 Cache Components setup, `usePathname` in a client component outside `<Suspense>` previously broke prerendering.
- The page moves out of the `(dashboard)` route group (e.g. to `my-app/app/chatbot/page.tsx`) so the Sidebar layout no longer wraps it; the URL remains `/chatbot`.
- `components/layout/TopNav.tsx` is an unused stub and may be replaced or removed.
- The separate spec `relocate-chatbot-into-my-app` is out of scope and must not be modified.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user visits `/chatbot` THEN the system renders the page inside the `(dashboard)` layout with a left "CivicConnect" Sidebar and no homepage "City Land" top header

1.2 WHEN a user visits `/chatbot` THEN the system renders a plain `bg-zinc-50` / `dark:bg-zinc-950` background instead of the homepage emerald gradient shell (`bg-gradient-to-b from-emerald-50 via-white to-emerald-50`, dark `from-zinc-950 via-black to-zinc-950`)

1.3 WHEN a user visits `/chatbot` THEN the system shows a "CivicBot" heading and a `rounded-xl border-zinc-200` card that does not match the homepage card style (`rounded-2xl border border-black/5 bg-white shadow-sm`, dark `border-white/10 bg-zinc-900`) or section heading style (`text-lg font-bold`)

1.4 WHEN a user sends a message on `/chatbot` THEN the system renders the user's message bubble in blue (`bg-blue-600`) instead of the homepage emerald/teal palette

1.5 WHEN a user views or focuses the chat input and Send button THEN the system uses blue styling (`bg-blue-600 hover:bg-blue-700` button, `focus:ring-blue-500`, `rounded-lg` input) instead of the homepage emerald, rounded-full style

1.6 WHEN a user is on `/chatbot` THEN the system highlights navigation in blue via the Sidebar and offers no Chat-active state in a homepage-style nav

1.7 WHEN a user clicks the homepage header's Home nav item THEN the system navigates to `/feed` instead of the homepage `/`

### Expected Behavior (Correct)

2.1 WHEN a user visits `/chatbot` THEN the system SHALL render the same top header as the homepage (logo tile with emerald-to-teal gradient and white "C", "City Land" title, center nav of Home, Map, Report, Bounties, Chat with the same icons and layout, right "Sign in / Login" emerald rounded-full button) and SHALL NOT render the dashboard Sidebar

2.2 WHEN a user visits `/chatbot` THEN the system SHALL render the same page shell as the homepage (`flex h-screen flex-col overflow-hidden` with the emerald gradient background and matching text colors in light and dark mode)

2.3 WHEN a user visits `/chatbot` THEN the system SHALL present the chat inside a card matching the homepage card style (`rounded-2xl border border-black/5 bg-white shadow-sm`, dark `border-white/10 bg-zinc-900`) with a homepage-style section heading (`text-lg font-bold`) and MAY use the homepage emerald pill style (`rounded-full bg-emerald-100 ... text-emerald-700`) for labels

2.4 WHEN a user sends a message on `/chatbot` THEN the system SHALL render the user's message bubble using the homepage emerald/teal palette (emerald-600 or emerald-to-teal gradient) with no blue styling

2.5 WHEN a user views or focuses the chat input and Send button THEN the system SHALL style the Send button as emerald (`bg-emerald-600 hover:bg-emerald-700`, rounded-full) and the input focus ring as `emerald-500`, with no blue styling remaining in the chat UI

2.6 WHEN a user is on `/chatbot` THEN the system SHALL show the Chat nav item as active (`text-emerald-600`) and the Home item as inactive (`text-zinc-600 dark:text-zinc-300`)

2.7 WHEN a user clicks the Home nav item in the shared header THEN the system SHALL navigate to `/`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user visits the homepage `/` THEN the system SHALL CONTINUE TO render the same header appearance with Home shown as the active item, and the same feed, map, and City Problems body content and appearance

3.2 WHEN a user clicks the Map, Bounties, or Chat nav items THEN the system SHALL CONTINUE TO navigate to `/map`, `/bounties`, and `/chatbot` respectively, and the Report item SHALL CONTINUE TO render as a gradient pill button with no route

3.3 WHEN a user sends a chat message THEN the system SHALL CONTINUE TO POST the message with conversation history to `/api/chatbot` and display the response

3.4 WHEN the assistant replies THEN the system SHALL CONTINUE TO render the reply as markdown via `MarkdownMessage` in a neutral (zinc) assistant bubble

3.5 WHEN a request is in flight or fails THEN the system SHALL CONTINUE TO show the "Thinking…" loading state, the error state, and disable input/Send as it does today

3.6 WHEN a user presses Enter in the chat input THEN the system SHALL CONTINUE TO send the message, and SHALL CONTINUE TO prevent sending empty messages

3.7 WHEN a user visits `/chatbot` THEN the system SHALL CONTINUE TO serve the page at the `/chatbot` URL

3.8 WHEN a user visits any other `(dashboard)` route (feed, map, bounties, channels, issues, notifications, profile, admin) THEN the system SHALL CONTINUE TO render it with the existing Sidebar layout

3.9 WHEN the project is built with `npm run build` THEN the system SHALL CONTINUE TO build and prerender successfully

3.10 WHEN the fix is applied THEN the system SHALL CONTINUE TO leave the `/api/chatbot` route, the Lowell knowledge base, and the `relocate-chatbot-into-my-app` spec unchanged
