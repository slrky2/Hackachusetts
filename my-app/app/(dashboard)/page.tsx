"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CivicMap from "@/components/map/CivicMap";
import MapLegend from "@/components/map/MapLegend";
import { CITY_POSTS, buildMarkers, issueMarkerId, postMarkerId } from "@/lib/db/seed";
import { useIssues } from "@/lib/hooks/useIssues";
import { severityBadgeClass, sortByPriority } from "@/lib/utils/severity";

export default function Home() {
  const { reports } = useIssues();
  // Which map pin is focused; shared by the map, ticket list, and feed.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const markers = useMemo(() => buildMarkers(reports, CITY_POSTS), [reports]);
  const tickets = useMemo(() => sortByPriority(reports), [reports]);

  return (
    // Feed left, map + tickets right. Stacks on small screens,
    // splits 50/50 and fills the viewport height on large screens.
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
      {/* LEFT: feed */}
      <section
        aria-label="Community feed"
        className="min-w-0 overflow-y-auto border-black/5 px-4 py-6 sm:px-6 lg:border-r dark:border-white/10"
      >
        <div className="mx-auto flex max-w-xl flex-col gap-6">
          {CITY_POSTS.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold">{post.author}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedId(postMarkerId(post.id))}
                    className="text-xs text-zinc-500 hover:text-emerald-600 hover:underline"
                    aria-label={`Show ${post.location} on map`}
                  >
                    📍 {post.location}
                  </button>
                </div>
              </div>
              <div className="aspect-square w-full bg-gradient-to-br from-emerald-100 to-teal-200 dark:from-zinc-800 dark:to-zinc-700" />
              <div className="px-4 py-3">
                <p className="text-sm">
                  <span className="font-semibold">{post.author}</span> {post.caption}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* RIGHT: map on top, tickets below, together filling the column */}
      <aside className="flex min-h-0 min-w-0 flex-col gap-4 px-4 py-6 sm:px-6">
        {/* Live Google Map with issue + post pins */}
        <section className="flex min-h-[320px] shrink-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:flex-1 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <Link href="/map" className="text-lg font-bold hover:text-emerald-600">
              Map
            </Link>
            <MapLegend />
          </div>
          <div className="relative min-h-0 flex-1">
            <CivicMap markers={markers} selectedId={selectedId} onSelect={setSelectedId} />
          </div>
        </section>

        {/* City problems panel */}
        <section className="flex min-h-[260px] flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:flex-1 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex shrink-0 items-center justify-between px-4 py-3">
            <h2 className="text-lg font-bold">City Problems</h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {tickets.length} open
            </span>
          </div>
          <ul className="min-h-0 flex-1 divide-y divide-black/5 overflow-y-auto dark:divide-white/10">
            {tickets.map((ticket) => {
              const markerId = issueMarkerId(ticket.id);
              const isSelected = markerId === selectedId;
              return (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(markerId)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.04] ${
                      isSelected ? "bg-emerald-50 dark:bg-emerald-500/10" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{ticket.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>{ticket.category}</span>
                        <span aria-hidden="true">•</span>
                        <span>{ticket.location}</span>
                        <span className={`rounded-full px-2 py-0.5 font-medium ${severityBadgeClass(ticket.severity)}`}>
                          {ticket.severity}
                        </span>
                        <span>▲ {ticket.upvotes}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
                      {ticket.reward}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </aside>
    </div>
  );
}
