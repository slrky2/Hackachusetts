"use client";

import { useSyncExternalStore } from "react";
import { timeAgo } from "@/lib/utils";

// Re-check every 30s; the snapshot only changes when the minute rolls over.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
}
const currentMinute = () => Math.floor(Date.now() / 60_000);

/**
 * "3h ago" style timestamp. Renders empty on the server and during hydration
 * (the current time differs between build/server and browser), then fills in.
 */
export default function RelativeTime({ iso, className }: { iso: string; className?: string }) {
  const minute = useSyncExternalStore(subscribe, currentMinute, () => null);
  return (
    <time dateTime={iso} className={className}>
      {minute === null ? "" : timeAgo(iso, minute * 60_000)}
    </time>
  );
}
