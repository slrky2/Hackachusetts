# CivicConnect — Codebase Guide for AI Agents

## Project overview
Community / city platform built with **Next.js 16 App Router**, **TypeScript**, and **Tailwind CSS v4**.

## Directory map

| Path | Purpose |
|---|---|
| `app/(auth)/` | Public auth routes (login, register, forgot-password) |
| `app/(dashboard)/` | Protected app routes; share a common layout with sidebar + top nav |
| `app/api/` | Next.js Route Handlers (REST API) |
| `components/layout/` | Sidebar, TopNav — global shell |
| `components/map/` | Google Maps wrapper, issue markers, report drawer |
| `components/issues/` | Issue cards, create form |
| `components/bounties/` | Bounty cards |
| `components/channels/` | Message thread, message input |
| `components/chatbot/` | CivicBot chat UI, dietary prefs modal |
| `components/notifications/` | Notification bell |
| `lib/api/` | Typed fetch client (`api.get / post / put / patch / delete`) |
| `lib/ai/prompts/` | System prompt builder for CivicBot (injects dietary/allergen profile) |
| `lib/db/` | DB client stub — swap with Prisma / Drizzle / Supabase |
| `lib/hooks/` | SWR data hooks: `useAuth`, `useIssues`, `useBounties` |
| `lib/maps/` | Geocoding helpers |
| `lib/validators/` | Zod schemas for issues, bounties, auth |
| `lib/utils/` | `cn()`, `timeAgo()`, `formatCategory()` |
| `types/index.ts` | All shared TypeScript types |
| `config/app.ts` | App-wide constants (city name, map defaults, API routes) |
| `store/index.ts` | Client state (Zustand stub) |

## Key dependencies to install before building
```bash
npm install swr zod clsx tailwind-merge @vis.gl/react-google-maps openai
npm install -D @types/google.maps
```

## Environment variables
Copy `.env.local.example` → `.env.local` and fill in:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `ANTHROPIC_API_KEY` (optional chatbot)
- `CITY_STAFF_EMAILS` (optional staff access)

Vercel uses `my-app` as its Root Directory and Node.js 22.x. See the root README.
Data stores are demo-only memory; no database is configured.

## Coding conventions
- All client components start with `"use client"`.
- Use `cn()` from `lib/utils` for conditional Tailwind classes.
- Validate all API inputs with the Zod schemas in `lib/validators/`.
- Never expose API keys client-side (except `NEXT_PUBLIC_*` Map key).
