import { randomUUID } from "node:crypto";
import type { CityReport, CityTicket } from "@/types";
import { SEED_ISSUES } from "./seed";

/**
 * Server-side in-memory store for reports, upvotes, and comments.
 *
 * POC only: data resets when the server restarts and isn't shared across
 * serverless instances. Replace with real DB calls behind the same functions.
 */

const MAX_COMMENTS_PER_ISSUE = 200;

interface StoredComment {
  id: string;
  authorId: string | null; // null for seed comments
  authorName: string;
  text: string;
  createdAt: string;
}

interface StoredIssue {
  ticket: CityTicket;
  reportedAt: string;
  baseUpvotes: number; // seed votes, not tied to a viewer
  upvoterIds: Set<string>;
  comments: StoredComment[];
}

interface Store {
  issues: Map<number, StoredIssue>;
  displayNames: Map<string, string>;
}

// Kept on globalThis so dev hot-reloads don't wipe the data.
const globalForStore = globalThis as typeof globalThis & { __cityLandStore?: Store };

function getStore(): Store {
  globalForStore.__cityLandStore ??= createStore();
  return globalForStore.__cityLandStore;
}

function createStore(): Store {
  const issues = new Map<number, StoredIssue>();
  for (const seed of SEED_ISSUES) {
    issues.set(seed.ticket.id, {
      ticket: seed.ticket,
      reportedAt: seed.reportedAt,
      baseUpvotes: seed.upvotes,
      upvoterIds: new Set(),
      comments: seed.comments.map((c) => ({ ...c, authorId: null })),
    });
  }
  return { issues, displayNames: new Map() };
}

/** Stable anonymous display name per viewer, e.g. "neighbor_101". */
function displayNameFor(store: Store, viewerId: string): string {
  let name = store.displayNames.get(viewerId);
  if (!name) {
    name = `neighbor_${101 + store.displayNames.size}`;
    store.displayNames.set(viewerId, name);
  }
  return name;
}

/** Shape a stored issue for a specific viewer. Never exposes other viewers' ids. */
function toReport(issue: StoredIssue, viewerId: string | null): CityReport {
  return {
    ...issue.ticket,
    reportedAt: issue.reportedAt,
    upvotes: issue.baseUpvotes + issue.upvoterIds.size,
    hasUpvoted: viewerId !== null && issue.upvoterIds.has(viewerId),
    comments: issue.comments.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      text: c.text,
      createdAt: c.createdAt,
      isMine: viewerId !== null && c.authorId === viewerId,
    })),
  };
}

export function listReports(viewerId: string | null): CityReport[] {
  return [...getStore().issues.values()].map((issue) => toReport(issue, viewerId));
}

/** Toggle the viewer's upvote. Returns null if the issue doesn't exist. */
export function toggleUpvote(issueId: number, viewerId: string): CityReport | null {
  const issue = getStore().issues.get(issueId);
  if (!issue) return null;
  if (issue.upvoterIds.has(viewerId)) issue.upvoterIds.delete(viewerId);
  else issue.upvoterIds.add(viewerId);
  return toReport(issue, viewerId);
}

export type AddCommentResult =
  | { ok: true; report: CityReport }
  | { ok: false; reason: "not_found" | "limit_reached" };

export function addComment(issueId: number, viewerId: string, text: string): AddCommentResult {
  const store = getStore();
  const issue = store.issues.get(issueId);
  if (!issue) return { ok: false, reason: "not_found" };
  if (issue.comments.length >= MAX_COMMENTS_PER_ISSUE) return { ok: false, reason: "limit_reached" };

  issue.comments.push({
    id: randomUUID(),
    authorId: viewerId,
    authorName: displayNameFor(store, viewerId),
    text,
    createdAt: new Date().toISOString(),
  });
  return { ok: true, report: toReport(issue, viewerId) };
}
