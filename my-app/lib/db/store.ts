import { randomUUID } from "node:crypto";
import type { CityPost, CityReport, CityTicket } from "@/types";
import { SEED_ISSUES, seedPosts } from "./seed";

/**
 * Server-side in-memory store for reports, posts, upvotes, and comments.
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

interface StoredPost {
  post: Omit<CityPost, "reactions">; // hasReacted is recomputed per viewer
  baseReactions: number; // seed reactions, not tied to a viewer
  reactorIds: Set<string>;
}

// Bump when the Store shape changes so a running dev server rebuilds it.
const STORE_VERSION = 2;

interface Store {
  version: number;
  issues: Map<number, StoredIssue>;
  posts: Map<number, StoredPost>;
  displayNames: Map<string, string>;
}

// Kept on globalThis so dev hot-reloads don't wipe the data.
const globalForStore = globalThis as typeof globalThis & { __cityLandStore?: Store };

function getStore(): Store {
  if (globalForStore.__cityLandStore?.version !== STORE_VERSION) {
    globalForStore.__cityLandStore = createStore();
  }
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

  // Post times are relative to server start so the feed always looks fresh.
  const posts = new Map<number, StoredPost>();
  for (const { reactions, ...post } of seedPosts(Date.now())) {
    posts.set(post.id, { post, baseReactions: reactions, reactorIds: new Set() });
  }

  return { version: STORE_VERSION, issues, posts, displayNames: new Map() };
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

// ─── Posts ────────────────────────────────────────────────────────────────────

function toPost(stored: StoredPost, viewerId: string | null): CityPost {
  return {
    ...stored.post,
    reactions: stored.baseReactions + stored.reactorIds.size,
    hasReacted: viewerId !== null && stored.reactorIds.has(viewerId),
  };
}

/** All posts, newest first. */
export function listPosts(viewerId: string | null): CityPost[] {
  return [...getStore().posts.values()]
    .map((stored) => toPost(stored, viewerId))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

/** Toggle the viewer's "Thanks" / "Going". Returns null if the post doesn't exist. */
export function toggleReaction(postId: number, viewerId: string): CityPost | null {
  const stored = getStore().posts.get(postId);
  if (!stored) return null;
  if (stored.reactorIds.has(viewerId)) stored.reactorIds.delete(viewerId);
  else stored.reactorIds.add(viewerId);
  return toPost(stored, viewerId);
}
