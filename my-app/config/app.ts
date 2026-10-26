// Central app configuration — pull sensitive values from environment variables

export const APP_CONFIG = {
  name: "CivicConnect",
  tagline: "Your neighborhood, connected.",
  defaultCity: "Lowell, MA",
  defaultMapCenter: { lat: 42.6430, lng: -71.3150 }, // Lowell, MA
  defaultMapZoom: 13,
  // Users within this radius of the city center get the map centered on them.
  localAreaRadiusKm: 15,
} as const;

export const API_ROUTES = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    session: "/api/auth/session",
  },
  users: "/api/users",
  channels: "/api/channels",
  issues: "/api/issues",
  bounties: "/api/bounties",
  chatbot: "/api/chatbot",
  map: "/api/map",
  notifications: "/api/notifications",
} as const;

export const MAP_CONFIG = {
  // Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  // Advanced Markers require a Map ID. Google's DEMO_MAP_ID works for development;
  // create a real one in Cloud Console > Map Management for custom styling.
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
  libraries: ["places", "geometry"] as const,
} as const;

export const AI_CONFIG = {
  // Set ANTHROPIC_API_KEY in my-app/.env.local (shared with scripts/chatbot.py)
  model: "claude-sonnet-5-5",
  maxTokens: 1024,
} as const;

export const BOUNTY_CONFIG = {
  pointsPerReport: 10,
  pointsPerBountyComplete: 50,
  pointsPerUpvote: 2,
} as const;
