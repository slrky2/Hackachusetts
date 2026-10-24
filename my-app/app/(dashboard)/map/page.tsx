"use client";

import { useMemo, useState } from "react";
import ReportCard from "@/components/issues/ReportCard";
import CivicMap from "@/components/map/CivicMap";
import MapLegend from "@/components/map/MapLegend";
import { APP_CONFIG } from "@/config/app";
import { buildMarkers, issueMarkerId } from "@/lib/db/seed";
import { useBounties } from "@/lib/hooks/useBounties";
import { useIssues } from "@/lib/hooks/useIssues";
import { useUserLocation, type UserLocation } from "@/lib/hooks/useUserLocation";
import { SEVERITY_LEVELS, sortByPriority } from "@/lib/utils/severity";
import type { TicketSeverity } from "@/types";

type PriorityFilter = "All" | TicketSeverity;
const FILTERS: PriorityFilter[] = ["All", ...SEVERITY_LEVELS];
const CITY_NAME = APP_CONFIG.defaultCity.split(",")[0];

/**
 * Map view: map of the user's area on the left, reported problems on the
 * right with priority filters, upvotes, and comments.
 */
export default function MapPage() {
  const { reports, error, toggleUpvote, addComment } = useIssues();
  const { bounties } = useBounties();
  const location = useUserLocation(APP_CONFIG.defaultMapCenter, APP_CONFIG.localAreaRadiusKm);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PriorityFilter>("All");

  const visible = useMemo(
    () => sortByPriority(filter === "All" ? reports : reports.filter((r) => r.severity === filter)),
    [reports, filter],
  );
  // Bounty pins only show under "All"; the priority filters are about reports.
  const markers = useMemo(
    () => buildMarkers(visible, [], filter === "All" ? bounties : []),
    [visible, bounties, filter],
  );
  const counts = useMemo(() => {
    const byLevel = { All: reports.length, High: 0, Medium: 0, Low: 0 };
    for (const r of reports) byLevel[r.severity] += 1;
    return byLevel;
  }, [reports]);

  // Only center on the user if they're actually near the city.
  const userCoords = location.status === "in-area" ? location.coords : null;

  function changeFilter(next: PriorityFilter) {
    setFilter(next);
    setSelectedId(null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      {/* LEFT: map */}
      <section aria-label="Map of reported problems" className="relative h-[45vh] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
        <CivicMap
          markers={markers}
          selectedId={selectedId}
          onSelect={setSelectedId}
          defaultZoom={14}
          userLocation={userCoords}
        />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-2">
          <LocationNote location={location} />
          <div className="rounded-xl bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:bg-zinc-900/90">
            <MapLegend showPosts={false} />
          </div>
        </div>
      </section>

      {/* RIGHT: reported problems */}
      <aside className="flex flex-col border-black/5 lg:min-h-0 lg:w-[440px] lg:border-l xl:w-[480px] dark:border-white/10">
        <div className="shrink-0 space-y-3 border-b border-black/5 px-4 py-4 dark:border-white/10">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="text-lg font-bold">Reported problems</h1>
            <span className="text-xs text-zinc-500">Sorted by priority, then upvotes</span>
          </div>
          <div role="group" aria-label="Filter by priority" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => changeFilter(f)}
                aria-pressed={filter === f}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  filter === f
                    ? "bg-emerald-600 text-white"
                    : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
                }`}
              >
                {f} ({counts[f]})
              </button>
            ))}
          </div>
          {error && (
            <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
              Can&apos;t reach the server right now. Showing the last known data.
            </p>
          )}
        </div>

        <ul className="space-y-3 px-4 py-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          {visible.length === 0 && (
            <li className="py-8 text-center text-sm text-zinc-500">
              No {filter.toLowerCase()} priority problems right now.
            </li>
          )}
          {visible.map((report) => {
            const markerId = issueMarkerId(report.id);
            return (
              <li key={report.id}>
                <ReportCard
                  report={report}
                  isSelected={selectedId === markerId}
                  onSelect={() => setSelectedId((cur) => (cur === markerId ? null : markerId))}
                  // Failed upvotes roll back automatically; nothing else to show.
                  onToggleUpvote={() => void toggleUpvote(report.id).catch(() => {})}
                  onAddComment={(text) => addComment(report.id, text)}
                />
              </li>
            );
          })}
        </ul>
      </aside>
    </div>
  );
}

function LocationNote({ location }: { location: UserLocation }) {
  const text = {
    pending: "Finding your location…",
    "in-area": "Showing your area",
    "outside-area": `You're outside ${CITY_NAME}. Showing the city center.`,
    unavailable: `Location off. Showing ${CITY_NAME}.`,
  }[location.status];

  return (
    <p role="status" className="w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200">
      📍 {text}
    </p>
  );
}
