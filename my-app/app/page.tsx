"use client";

import { MapIcon } from "@/components/layout/NavIcons";
import { SiteHeader } from "@/components/layout/SiteHeader";

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

export default function Home() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      <SiteHeader active="home" />

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
