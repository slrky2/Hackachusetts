/**
 * Static channel definitions and seeded demo messages for the /chatbot
 * channels page. Plain data only: no React, no DOM, no runtime clock.
 *
 * All demo messages are DEMO / FICTIONAL (see data/Lowell.md, Section 9):
 * invented author names, generic "example" locations, and no current
 * incidents or official City of Lowell announcements.
 */

export const COMMUNITY_SLUGS = [
  "general",
  "new-food-places",
  "events",
  "lost-and-found",
  "road-reports",
] as const;

export type CommunitySlug = (typeof COMMUNITY_SLUGS)[number];
export type ChannelSlug = CommunitySlug | "chatbot";

export interface ChannelDef {
  slug: ChannelSlug;
  /** One line, shown in the pane header. */
  description: string;
  group: "community" | "assistant";
}

export const CHANNEL_GROUPS = [
  { id: "community", label: "Community" },
  { id: "assistant", label: "Assistant" },
] as const;

/** Order defines sidebar order (Requirements 2.1, 2.2). */
export const CHANNELS: readonly ChannelDef[] = [
  { slug: "general", group: "community", description: "Neighborhood chat for anything Lowell." },
  { slug: "new-food-places", group: "community", description: "Share new spots to eat and drink." },
  { slug: "events", group: "community", description: "Community meetups and happenings." },
  { slug: "lost-and-found", group: "community", description: "Lost something? Found something? Post it here." },
  { slug: "road-reports", group: "community", description: "Neighbor notes about streets and sidewalks." },
  { slug: "chatbot", group: "assistant", description: "Ask CivicBot about Lowell, MA." },
];

export interface DemoMessage {
  /** e.g. "demo-general-1" */
  id: string;
  /** Fictional display name. */
  author: string;
  /** Fixed ISO 8601 string, ascending within a channel. */
  timestamp: string;
  text: string;
}

export const DEMO_MESSAGES: Readonly<Record<CommunitySlug, readonly DemoMessage[]>> = {
  general: [
    {
      id: "demo-general-1",
      author: "Rosa Delgado",
      timestamp: "2026-10-12T13:05:00.000Z",
      text: "Hi neighbors! Trying out the new community channels. 👋",
    },
    {
      id: "demo-general-2",
      author: "Theo Marchetti",
      timestamp: "2026-10-12T13:22:00.000Z",
      text: "Welcome! Sample tip: the library is a great place to start if you're new to town.",
    },
    {
      id: "demo-general-3",
      author: "Priya Nandakumar",
      timestamp: "2026-10-12T14:10:00.000Z",
      text: "Anyone up for a weekend walking group around an example riverside path? Sample idea, happy to plan details together.",
    },
  ],
  "new-food-places": [
    {
      id: "demo-new-food-places-1",
      author: "Sam Okafor",
      timestamp: "2026-10-14T16:30:00.000Z",
      text: "Sample post: tried a (fictional) dumpling spot called Little Lantern. Great broth and friendly staff.",
    },
    {
      id: "demo-new-food-places-2",
      author: "Lena Kowalski",
      timestamp: "2026-10-14T17:02:00.000Z",
      text: "Is Maple & Mill Bakery (example name) open on Sundays? Haven't checked yet.",
    },
    {
      id: "demo-new-food-places-3",
      author: "Diego Ferreira",
      timestamp: "2026-10-14T17:45:00.000Z",
      text: "Reminder: always confirm hours and allergen info with the restaurant directly.",
    },
  ],
  events: [
    {
      id: "demo-events-1",
      author: "Hannah Brooks",
      timestamp: "2026-10-16T12:00:00.000Z",
      text: "Example event: neighborhood book swap at an example community room. Bring a book, take a book.",
    },
    {
      id: "demo-events-2",
      author: "Marcus Lee",
      timestamp: "2026-10-16T12:40:00.000Z",
      text: "Sample listing: Saturday garden volunteer morning at an example park. Gloves provided (fictional).",
    },
    {
      id: "demo-events-3",
      author: "Aisha Rahman",
      timestamp: "2026-10-16T13:15:00.000Z",
      text: "These are demo listings. Check official sources for real event times.",
    },
  ],
  "lost-and-found": [
    {
      id: "demo-lost-and-found-1",
      author: "Owen Fitzgerald",
      timestamp: "2026-10-18T15:20:00.000Z",
      text: "Sample: found a blue water bottle near an example bus stop. Message me if it's yours.",
    },
    {
      id: "demo-lost-and-found-2",
      author: "Mei Chen",
      timestamp: "2026-10-18T16:05:00.000Z",
      text: "Demo post: lost a gray knit scarf, possibly at an example coffee shop.",
    },
    {
      id: "demo-lost-and-found-3",
      author: "Jonah Silva",
      timestamp: "2026-10-18T16:48:00.000Z",
      text: "Tip: lost items are often turned in at the nearest front desk or office.",
    },
  ],
  "road-reports": [
    {
      id: "demo-road-reports-1",
      author: "Carla Mendes",
      timestamp: "2026-10-20T11:10:00.000Z",
      text: "Demo note: sample pothole on an example residential street, marked resolved.",
    },
    {
      id: "demo-road-reports-2",
      author: "Ben Adeyemi",
      timestamp: "2026-10-20T11:55:00.000Z",
      text: "Example: streetlight out on a sample side street, report submitted (fictional).",
    },
    {
      id: "demo-road-reports-3",
      author: "Grace Park",
      timestamp: "2026-10-20T12:30:00.000Z",
      text: "For real road issues, use the city's official service request channels.",
    },
  ],
};
