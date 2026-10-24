"use client";

import { useSyncExternalStore } from "react";
import useSWR from "swr";
import { api } from "@/lib/api/client";
import { seedReports } from "@/lib/db/seed";
import type { CityReport } from "@/types";

// Shown during SSR / before the first fetch so the UI never renders empty.
const FALLBACK_REPORTS = seedReports();

// ─── Anonymous viewer id ──────────────────────────────────────────────────────
// Until real auth exists, each browser gets a random id in localStorage so
// upvotes are one-per-browser and comments can be attributed.

const VIEWER_ID_KEY = "cityland:viewerId";
let cachedViewerId: string | null = null;

/** RFC 4122 v4 UUID; works on plain-http LAN demos where randomUUID is unavailable. */
function createUuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getViewerId(): string {
  if (cachedViewerId) return cachedViewerId;
  let id: string | null = null;
  try {
    id = localStorage.getItem(VIEWER_ID_KEY);
  } catch {
    // storage blocked (private mode etc.) — fall through to an in-memory id
  }
  if (!id) {
    id = createUuid();
    try {
      localStorage.setItem(VIEWER_ID_KEY, id);
    } catch {
      // ignore; id still works for this session
    }
  }
  cachedViewerId = id;
  return id;
}

const noopSubscribe = () => () => {};

/** Viewer id on the client, null during SSR/hydration. */
export function useViewerId(): string | null {
  return useSyncExternalStore(noopSubscribe, getViewerId, () => null);
}

// ─── Reports ──────────────────────────────────────────────────────────────────

const fetchReports = (url: string) =>
  api.get<{ reports: CityReport[] }>(url).then((res) => res.reports);

const replaceReport = (reports: CityReport[], updated: CityReport) =>
  reports.map((r) => (r.id === updated.id ? updated : r));

export function useIssues() {
  const viewerId = useViewerId();
  const key = viewerId ? `/api/issues?viewerId=${encodeURIComponent(viewerId)}` : null;

  const { data, error, mutate } = useSWR(key, fetchReports, {
    refreshInterval: 15_000, // pick up other residents' votes/comments during a demo
  });
  const reports = data ?? FALLBACK_REPORTS;

  /** Optimistically toggle the viewer's upvote; rolls back if the request fails. */
  async function toggleUpvote(issueId: number) {
    if (!viewerId) return;
    await mutate(
      async (current) => {
        const { report } = await api.post<{ report: CityReport }>(
          `/api/issues/${issueId}/upvote`,
          { viewerId },
        );
        return replaceReport(current ?? FALLBACK_REPORTS, report);
      },
      {
        optimisticData: (current) =>
          (current ?? FALLBACK_REPORTS).map((r) =>
            r.id === issueId
              ? { ...r, hasUpvoted: !r.hasUpvoted, upvotes: r.upvotes + (r.hasUpvoted ? -1 : 1) }
              : r,
          ),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  /** Post a comment. Throws with the server's message on failure. */
  async function addComment(issueId: number, text: string) {
    if (!viewerId) throw new Error("Still loading, try again in a moment.");
    const { report } = await api.post<{ report: CityReport }>(
      `/api/issues/${issueId}/comments`,
      { viewerId, text },
    );
    await mutate((current) => replaceReport(current ?? FALLBACK_REPORTS, report), {
      revalidate: false,
    });
  }

  return { reports, error, isLive: data !== undefined, toggleUpvote, addComment };
}
