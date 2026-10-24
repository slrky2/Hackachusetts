"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { APP_CONFIG } from "@/config/app";
import { CHANNELS, CHANNEL_GROUPS, type ChannelSlug } from "@/lib/channels/data";
import { channelHref } from "@/lib/channels/state";
import { cn } from "@/lib/utils";

interface ChannelSidebarProps {
  selected: ChannelSlug;
}

// Inline SVG in the same style as components/layout/NavIcons.tsx. Decorative only.
function BotIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4" />
      <circle cx="12" cy="3" r="1" />
      <path d="M9 13v1" />
      <path d="M15 13v1" />
      <path d="M9.5 17h5" />
    </svg>
  );
}

export default function ChannelSidebar({ selected }: ChannelSidebarProps) {
  return (
    <nav
      aria-label="Channels"
      className="max-h-[25vh] shrink-0 overflow-y-auto rounded-2xl border border-black/5 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-zinc-900 md:max-h-none md:w-64"
    >
      <div className="px-2 pb-3">
        <h2 className="text-lg font-bold">{APP_CONFIG.defaultCity}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Community channels</p>
      </div>

      <div className="space-y-4">
        {CHANNEL_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`channel-group-${group.id}`}>
            <h3
              id={`channel-group-${group.id}`}
              className="px-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
            >
              {group.label}
            </h3>
            <ul className="mt-1 space-y-0.5">
              {CHANNELS.filter((channel) => channel.group === group.id).map((channel) => {
                const slug = channel.slug;
                const href = channelHref(slug);
                const isSelected = slug === selected;

                // Plain primary clicks update the URL in place (no navigation request);
                // modified clicks (new tab/window) keep default link behavior.
                const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                    return;
                  }
                  e.preventDefault();
                  if (!isSelected) {
                    window.history.pushState(null, "", href);
                  }
                };

                return (
                  <li key={slug}>
                    <Link
                      href={href}
                      prefetch={false}
                      aria-current={isSelected ? "page" : undefined}
                      onClick={handleClick}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900",
                        isSelected
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-white/5",
                      )}
                    >
                      {slug === "chatbot" && <BotIcon />}
                      <span className="truncate">
                        <span aria-hidden="true">#</span>
                        {slug}
                      </span>
                      {/* Space keeps the accessible name "chatbot AI"; flex layout ignores it visually. */}
                      {slug === "chatbot" && " "}
                      {slug === "chatbot" && (
                        <span className="rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                          AI
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
