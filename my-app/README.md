# CivicConnect

A community/city platform where residents can report issues, chat with neighbors, explore the city map, interact with an AI assistant, and earn rewards through a bounty system.

Built with **Next.js 16 App Router**, **TypeScript**, and **Tailwind CSS v4**.

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template and fill in your keys
cp .env.local.example .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Required Clerk browser key |
| `CLERK_SECRET_KEY` | Required Clerk server key from the same instance |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JS and Geocoding API key |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Optional cloud map styling ID |
| `ANTHROPIC_API_KEY` | Enables the Claude city assistant |
| `CITY_STAFF_EMAILS` | Optional comma-separated verified staff emails |

Database and NextAuth variables are not used by the current app.
See [Vercel deployment instructions](../README.md#deploy-to-vercel) for hosting setup and demo storage limitations.

---

## Key Dependencies to Install

```bash
npm install swr zod clsx tailwind-merge @vis.gl/react-google-maps openai
npm install -D @types/google.maps
```

---

## File Structure

```
my-app/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Public auth routes (no sidebar)
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   │
│   ├── (dashboard)/              # Main app routes — share the TopNav layout
│   │   ├── layout.tsx            # Dashboard shell (top nav + full-height content)
│   │   ├── page.tsx              # Home (/): feed, mini map, City Problems list
│   │   ├── feed/                 # Community activity feed
│   │   ├── map/                  # Map view: your area + problems list w/ upvotes & comments
│   │   ├── channels/             # Channel directory
│   │   │   └── [channelId]/      # Individual channel message thread
│   │   ├── issues/               # Civic issue tracker list
│   │   │   └── [issueId]/        # Issue detail + map preview + city response
│   │   ├── bounties/             # Bounty board
│   │   │   └── [bountyId]/       # Bounty detail + claim action
│   │   ├── chatbot/              # CivicBot AI assistant
│   │   ├── notifications/        # User notification center
│   │   ├── profile/              # Current user profile + settings
│   │   │   └── [userId]/         # Public profile of any community member
│   │   └── admin/                # Admin-only area
│   │       ├── users/            # User management
│   │       └── reports/          # Moderation queue
│   │
│   └── api/                      # Next.js Route Handlers (REST API)
│       ├── auth/                 # Login / register / session
│       ├── users/                # User CRUD + profile updates
│       ├── channels/             # Channel management
│       ├── issues/               # GET reports (per-viewer vote state), POST new report
│       │   └── [issueId]/
│       │       ├── upvote/       # POST — toggle the viewer's upvote
│       │       └── comments/     # POST — add a comment
│       ├── bounties/             # Bounty creation + claiming
│       ├── chatbot/              # Claude messages proxy
│       ├── map/                  # Map pin queries (supports bounding box)
│       ├── posts/                # GET feed posts (per-viewer reaction state)
│       │   └── [postId]/react/   # POST — toggle "Thanks" / "Going"
│       └── notifications/        # User notifications
│
├── components/                   # React components
│   ├── layout/
│   │   ├── Sidebar.tsx           # Main nav sidebar with route links
│   │   └── TopNav.tsx            # Top bar: logo, Home/Map/Report/Bounties/Chat nav, sign in
│   │
│   ├── map/
│   │   ├── CivicMap.tsx          # Google Map: issue/post pins, info windows, "you are here" dot
│   │   ├── MapLegend.tsx         # Pin color key
│   │   ├── IssueMarker.tsx       # Colored map marker by category/status
│   │   └── ReportIssueDrawer.tsx # Slide-in drawer to file a report at a location
│   │
│   ├── issues/
│   │   ├── ReportCard.tsx        # Problem card with upvote + comment thread
│   │   ├── IssueCard.tsx         # Summary card for the issue list
│   │   └── CreateIssueForm.tsx   # Form to submit a new civic issue
│   │
│   ├── bounties/
│   │   └── BountyCard.tsx        # Summary card for the bounty board
│   │
│   ├── channels/
│   │   ├── MessageThread.tsx     # Scrollable message list
│   │   └── MessageInput.tsx      # Text input with Enter-to-send
│   │
│   ├── chatbot/
│   │   ├── ChatInterface.tsx     # Full chat UI (bubble layout + send bar)
│   │   └── DietaryPrefsModal.tsx # Allergen + dietary restriction picker
│   │
│   ├── feed/
│   │   ├── CommunityFeed.tsx     # "Around Lowell" feed with type filters
│   │   └── PostCard.tsx          # Post: official badge, type tag, photo + credit, Thanks/Going
│   │
│   ├── notifications/
│   │   └── NotificationBell.tsx  # Bell icon with unread badge
│   │
│   ├── auth/                     # Login/register form components
│   ├── profile/                  # User profile display components
│   └── ui/                       # Shared primitive components
│       └── RelativeTime.tsx      # Hydration-safe "3h ago" timestamps
│
├── lib/                          # Non-UI logic and utilities
│   ├── api/
│   │   └── client.ts             # Typed fetch wrapper (api.get/post/put/patch/delete)
│   ├── ai/
│   │   └── prompts/
│   │       └── chatbot.ts        # Builds the Claude system prompt with city + dietary context
│   ├── db/
│   │   ├── index.ts              # DB client stub (swap with Prisma / Drizzle / Supabase)
│   │   ├── seed.ts               # Mock Lowell, MA reports + posts, marker builder
│   │   └── store.ts              # In-memory server store: reports, upvotes, comments
│   ├── hooks/
│   │   ├── useAuth.ts            # SWR hook for current session
│   │   ├── useIssues.ts          # SWR reports + optimistic upvote, addComment
│   │   ├── usePosts.ts           # SWR feed posts + optimistic reactions
│   │   ├── useUserLocation.ts    # Browser geolocation, in/out of city area
│   │   └── useBounties.ts        # SWR hook for bounties
│   ├── maps/
│   │   └── index.ts              # Geocoding + reverse-geocoding helpers
│   ├── validators/
│   │   ├── auth.ts               # Zod schemas: loginSchema, registerSchema
│   │   ├── issue.ts              # Zod schema: createIssueSchema
│   │   └── bounty.ts             # Zod schema: createBountySchema
│   └── utils/
│       ├── index.ts              # cn(), timeAgo(), truncate(), formatCategory()
│       └── severity.ts           # Priority colors, badge styles, sortByPriority()
│
├── types/
│   └── index.ts                  # All shared TypeScript types:
│                                 #   User, Channel, Message, Issue, MapPin,
│                                 #   Bounty, ChatSession, Notification, etc.
│
├── config/
│   └── app.ts                    # App-wide constants: city name, map defaults,
│                                 #   AI model, API routes, bounty point values
│
├── store/
│   └── index.ts                  # Global client state (Zustand stub)
│
├── public/
│   ├── icons/                    # App icons and category marker SVGs
│   └── images/                   # Static images
│
├── .env.local.example            # Template for required environment variables
└── AGENTS.md                     # Codebase guide for AI agents
```

---

## Feature Overview

| Feature | Routes | Key Components |
|---|---|---|
| Community feed | `/feed` | feed/page.tsx |
| Interactive city map | `/map` | `CivicMap`, `IssueMarker`, `ReportIssueDrawer` |
| Issue reporting | `/issues`, `/issues/[id]` | `IssueCard`, `CreateIssueForm` |
| Channels / messaging | `/channels`, `/channels/[id]` | `MessageThread`, `MessageInput` |
| Bounty system | `/bounties`, `/bounties/[id]` | `BountyCard` |
| AI city assistant | `/chatbot` | `ChatInterface`, `DietaryPrefsModal` |
| Notifications | `/notifications` | `NotificationBell` |
| User profiles | `/profile`, `/profile/[id]` | — |
| Admin panel | `/admin` | — |

---

## Architecture Notes

- **Auth** — route group `(auth)` keeps login/register outside the dashboard layout. Authentication uses Clerk at `/sign-in` and `/sign-up`.
- **Data fetching** — SWR hooks in `lib/hooks/` call the internal API. Uncomment after installing `swr`.
- **Validation** — Zod schemas in `lib/validators/` are shared between API route handlers and client-side forms via `react-hook-form` + `@hookform/resolvers`.
- **Maps** — `@vis.gl/react-google-maps` renders the map client-side. The `/api/map` route serves pins with optional bounding-box filtering.
- **CivicBot** — the system prompt in `lib/ai/prompts/chatbot.ts` is hydrated with the user's dietary restrictions and allergen profile so food recommendations are always safe.
- **Bounty points** — point values live in `config/app.ts` (`BOUNTY_CONFIG`) so they can be tuned without touching business logic.
