"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import RelativeTime from "@/components/ui/RelativeTime";
import type { CityPost, PostKind } from "@/types";

const KIND_STYLES: Record<PostKind, { label: string; className: string }> = {
  announcement: { label: "City update", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300" },
  alert: { label: "Heads up", className: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" },
  event: { label: "Event", className: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300" },
  volunteer: { label: "Volunteer", className: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300" },
  lost_found: { label: "Lost & found", className: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" },
  community: { label: "Neighbors", className: "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-300" },
};

interface PostCardProps {
  post: CityPost;
  isSelected: boolean;
  /** Hide timestamps until real data has loaded. */
  showTime: boolean;
  onShowOnMap: () => void;
  onToggleReaction: () => void;
}

/** One feed post: who posted, what kind of update it is, and a way to help or show up. */
export default function PostCard({ post, isSelected, showTime, onShowOnMap, onToggleReaction }: PostCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const kind = KIND_STYLES[post.kind];
  const isOfficial = post.author.type === "city";
  // Events ask "are you going?"; everything else gets a community "thanks".
  const reactionLabel = post.when ? "Going" : "Thanks";

  // Bring the post into view when its map pin is clicked.
  useEffect(() => {
    if (isSelected) cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isSelected]);

  return (
    <article
      ref={cardRef}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow dark:bg-zinc-900 ${
        isSelected ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-black/5 dark:border-white/10"
      } ${post.kind === "alert" ? "border-l-4 border-l-amber-500" : ""}`}
    >
      {/* Header: author, official badge, time, post type */}
      <header className="flex items-center gap-3 px-4 pt-3 pb-2">
        <Avatar name={post.author.name} official={isOfficial} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            {post.author.name}
            {isOfficial && <OfficialBadge />}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {post.author.subtitle}
            {showTime && (
              <>
                {" · "}
                <RelativeTime iso={post.postedAt} />
              </>
            )}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${kind.className}`}>
          {kind.label}
        </span>
      </header>

      {post.title && <h3 className="px-4 pb-1 text-base font-bold leading-snug">{post.title}</h3>}

      {post.image && (
        <figure className="mt-1">
          <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800">
            <Image
              src={post.image.src}
              alt={post.image.alt}
              fill
              sizes="(min-width: 1024px) 576px, 100vw"
              className="object-cover"
            />
          </div>
          <figcaption className="px-4 pt-1 text-[10px] text-zinc-400">
            Photo:{" "}
            <a href={post.image.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {post.image.credit}, {post.image.license}, via Wikimedia Commons
            </a>
          </figcaption>
        </figure>
      )}

      <div className="space-y-2 px-4 py-3">
        <p className="text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">{post.caption}</p>
        {post.when && (
          <p className="flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-300">
            <CalendarIcon />
            {post.when}
          </p>
        )}
      </div>

      {/* Actions: useful reactions rather than likes, plus a link to the map */}
      <footer className="flex items-center justify-between gap-2 border-t border-black/5 px-4 py-2 dark:border-white/10">
        <button
          type="button"
          onClick={onToggleReaction}
          aria-pressed={post.hasReacted}
          aria-label={`${reactionLabel}, ${post.reactions} ${post.when ? "going" : "neighbors said thanks"}`}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            post.hasReacted
              ? "bg-emerald-600 text-white"
              : "bg-black/5 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-emerald-500/15"
          }`}
        >
          <span aria-hidden="true">{post.when ? "✓" : "🙏"}</span>
          {reactionLabel}
          <span className={post.hasReacted ? "text-white/80" : "text-zinc-500"}>{post.reactions}</span>
        </button>

        {post.coords ? (
          <button
            type="button"
            onClick={onShowOnMap}
            aria-label={`Show ${post.location} on map`}
            className="truncate text-xs font-medium text-zinc-500 hover:text-emerald-600 hover:underline"
          >
            📍 {post.location}
          </button>
        ) : (
          <span className="text-xs text-zinc-500">📍 {post.location}</span>
        )}
      </footer>
    </article>
  );
}

function Avatar({ name, official }: { name: string; official: boolean }) {
  if (official) {
    return (
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-700 text-white" aria-hidden="true">
        {/* Civic building */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V10M9.5 21V10M14.5 21V10M19 21V10" />
          <path d="M2.5 10 12 4l9.5 6Z" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-sm font-bold uppercase text-white"
      aria-hidden="true"
    >
      {name.charAt(0)}
    </span>
  );
}

function OfficialBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-600 px-1.5 py-px text-[10px] font-bold text-white">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m5 12 5 5L20 7" />
      </svg>
      Official
    </span>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}
