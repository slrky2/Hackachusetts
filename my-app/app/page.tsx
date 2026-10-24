"use client";

// Instagram-style icons built as inline SVGs so we have no extra dependencies.
function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

function BountyIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

// Sample city problems shown in the bounties/tickets panel.
const CITY_TICKETS = [
  {
    id: 1,
    title: "Pothole on Main St & 4th Ave",
    category: "Roads",
    severity: "High",
    reward: "$120",
    location: "Downtown",
  },
  {
    id: 2,
    title: "Broken streetlight near City Park",
    category: "Lighting",
    severity: "Medium",
    reward: "$60",
    location: "Riverside",
  },
  {
    id: 3,
    title: "Overflowing trash bins at Market Square",
    category: "Sanitation",
    severity: "Medium",
    reward: "$45",
    location: "Market Square",
  },
  {
    id: 4,
    title: "Graffiti on the 2nd St underpass",
    category: "Vandalism",
    severity: "Low",
    reward: "$30",
    location: "West End",
  },
  {
    id: 5,
    title: "Fallen tree blocking bike lane",
    category: "Parks",
    severity: "High",
    reward: "$150",
    location: "Greenway",
  },
  {
    id: 6,
    title: "Faded crosswalk at Elm & 1st",
    category: "Roads",
    severity: "Low",
    reward: "$40",
    location: "Old Town",
  },
];

function severityStyles(severity: string) {
  switch (severity) {
    case "High":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
    case "Medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    default:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  }
}

const NAV_ITEMS = [
  { label: "Home", icon: <HomeIcon active />, active: true },
  { label: "Map", icon: <MapIcon />, active: false },
  { label: "Report", icon: <PlusIcon />, active: false, big: true },
  { label: "Bounties", icon: <BountyIcon />, active: false },
  { label: "Chat", icon: <ChatIcon />, active: false },
];

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      {/* Top bar: title left, nav center, sign in right */}
      <header className="z-20 flex shrink-0 items-center justify-between gap-4 border-b border-black/5 bg-white/70 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-white/10 dark:bg-black/40">
        {/* Left: title */}
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white shadow-sm">
            C
          </span>
          <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
            City Land
          </h1>
        </div>

        {/* Center: nav buttons */}
        <nav className="flex flex-1 items-center justify-center gap-1 sm:gap-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              className={
                item.big
                  ? "flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95 sm:px-4"
                  : `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:px-3 ${
                      item.active
                        ? "text-emerald-600"
                        : "text-zinc-600 dark:text-zinc-300"
                    }`
              }
            >
              {item.icon}
              <span
                className={
                  item.big
                    ? "hidden text-sm sm:inline"
                    : "text-[10px] font-medium"
                }
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Right: sign in */}
        <div className="flex min-w-0 shrink-0 justify-end">
          <button
            type="button"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95 sm:px-5"
          >
            Sign in / Login
          </button>
        </div>
      </header>

      {/* Body: feed left, map + tickets right. Stacks on small screens,
          splits 50/50 and fills the viewport height on large screens. */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-y-auto lg:grid-cols-2 lg:gap-0 lg:overflow-hidden">
        {/* LEFT: feed */}
        <main className="min-w-0 overflow-y-auto border-black/5 px-4 py-6 sm:px-6 lg:border-r dark:border-white/10">
          <div className="mx-auto flex max-w-xl flex-col gap-6">
            {[1, 2, 3, 4].map((i) => (
              <article
                key={i}
                className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">city_resident</span>
                    <span className="text-xs text-zinc-500">Downtown</span>
                  </div>
                </div>
                <div className="aspect-square w-full bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-zinc-800 dark:to-zinc-700" />
                <div className="px-4 py-3">
                  <p className="text-sm">
                    <span className="font-semibold">city_resident</span> A sample
                    post placeholder for the City Land feed.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </main>

        {/* RIGHT: map on top, tickets below, together filling the column */}
        <aside className="flex min-h-0 min-w-0 flex-col gap-4 px-4 py-6 sm:px-6">
          {/* Map placeholder (empty for now) */}
          <section className="flex min-h-[260px] shrink-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:flex-1 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex shrink-0 items-center justify-between px-4 py-3">
              <h3 className="text-lg font-bold">Map</h3>
              <span className="text-xs text-zinc-500">Live view</span>
            </div>
            <div
              className="relative flex-1 bg-[linear-gradient(0deg,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.06)_1px,transparent_1px)] bg-[length:28px_28px] dark:bg-[linear-gradient(0deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)]"
              aria-label="Map placeholder"
            >
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex flex-col items-center gap-2 text-zinc-400">
                  <MapIcon />
                  <span className="text-sm font-medium">Map coming soon</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bounties / tickets panel */}
          <section className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:flex-1 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex shrink-0 items-center justify-between px-4 py-3">
              <h3 className="text-lg font-bold">City Problems</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                {CITY_TICKETS.length} open
              </span>
            </div>
            <ul className="min-h-0 flex-1 divide-y divide-black/5 overflow-y-auto dark:divide-white/10">
              {CITY_TICKETS.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {ticket.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>{ticket.category}</span>
                      <span aria-hidden="true">•</span>
                      <span>{ticket.location}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${severityStyles(
                          ticket.severity,
                        )}`}
                      >
                        {ticket.severity}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                    {ticket.reward}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
