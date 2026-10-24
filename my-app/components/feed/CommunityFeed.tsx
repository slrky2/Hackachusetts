"use client";

import { useMemo, useState } from "react";
import { APP_CONFIG } from "@/config/app";
import { issueMarkerId, postMarkerId } from "@/lib/db/seed";
import type { CityPost } from "@/types";
import PostCard from "./PostCard";

const FILTERS = [
  { id: "all", label: "All", match: () => true },
  { id: "city", label: "From the city", match: (p: CityPost) => p.author.type === "city" },
  { id: "events", label: "Events", match: (p: CityPost) => Boolean(p.when) },
  { id: "heads-up", label: "Heads up", match: (p: CityPost) => p.kind === "alert" || p.kind === "lost_found" },
  { id: "reports", label: "Reported problems", match: (p: CityPost) => p.kind === "report" },
  { id: "neighbors", label: "Neighbors", match: (p: CityPost) => p.author.type === "resident" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const CITY_NAME = APP_CONFIG.defaultCity.split(",")[0];

interface CommunityFeedProps {
  posts: CityPost[];
  selectedId: string | null;
  showTimes: boolean;
  onSelect: (markerId: string) => void;
  onToggleReaction: (postId: number) => void;
}

/** Feed of updates from the city and neighbors, filterable by type. */
export default function CommunityFeed({ posts, selectedId, showTimes, onSelect, onToggleReaction }: CommunityFeedProps) {
  const [filter, setFilter] = useState<FilterId>("all");
  const visible = useMemo(() => {
    const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
    return posts.filter(active.match);
  }, [posts, filter]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Around {CITY_NAME}</h2>
          <p className="text-sm text-zinc-500">Updates from the city and your neighbors</p>
        </div>
        <div role="group" aria-label="Filter posts" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-zinc-600 shadow-sm ring-1 ring-black/5 hover:bg-emerald-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10 dark:hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-zinc-500">Nothing here yet.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {visible.map((post) => {
            // Report posts point at their report's pin; others have their own.
            const markerId = post.issueId !== undefined ? issueMarkerId(post.issueId) : postMarkerId(post.id);
            return (
              <li key={post.id}>
                <PostCard
                  post={post}
                  isSelected={selectedId === markerId}
                  showTime={showTimes}
                  onShowOnMap={() => onSelect(markerId)}
                  onToggleReaction={() => onToggleReaction(post.id)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
