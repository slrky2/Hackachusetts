import { randomUUID } from "node:crypto";
import type { CityPost, CityReport, CityTicket, TicketSeverity } from "@/types";
import type { ReportCategory } from "@/lib/utils/report";
import { SEED_ISSUES, seedPosts, seedReporterName } from "./seed";

/**
 * Server-side in-memory store for reports, photos, posts, upvotes, and comments.
 * Starts with the seed reports and posts; reports filed on the Report page are
 * added on top (and each one also gets a feed post).
 *
 * POC only: data resets when the server restarts and isn't shared across
 * serverless instances. Replace with real DB calls behind the same functions.
 */

const MAX_REPORTS = 500;
const MAX_COMMENTS_PER_ISSUE = 200;
// Caps total photo memory so the demo server can't be filled up.
const MAX_TOTAL_PHOTO_BYTES = 200 * 1024 * 1024;

interface StoredComment {
  id: string;
  authorId: string | null; // null for seed comments
  authorName: string;
  text: string;
  createdAt: string;
}

interface StoredIssue {
  ticket: CityTicket;
  description: string;
  authorId: string | null; // null for seed reports
  authorName: string;
  reportedAt: string;
  photoIds: string[];
  baseUpvotes: number; // seed votes, not tied to a viewer
  upvoterIds: Set<string>;
  comments: StoredComment[];
}

interface StoredPost {
  post: Omit<CityPost, "reactions" | "hasReacted" | "isMine">; // recomputed per viewer
  authorId: string | null; // null for seed posts
  baseReactions: number; // seed reactions, not tied to a viewer
  reactorIds: Set<string>;
}

// Bump when the Store shape changes so a running dev server rebuilds it.
const STORE_VERSION = 3;

interface Store {
  version: number;
  issues: Map<number, StoredIssue>;
  posts: Map<number, StoredPost>;
  photos: Map<string, Buffer>;
  photoBytes: number;
  displayNames: Map<string, string>;
  nextIssueId: number;
  nextPostId: number;
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
      description: seed.ticket.title,
      authorId: null,
      authorName: seedReporterName(seed.ticket.id),
      reportedAt: seed.reportedAt,
      photoIds: [],
      baseUpvotes: seed.upvotes,
      upvoterIds: new Set(),
      comments: seed.comments.map((c) => ({ ...c, authorId: null })),
    });
  }

  // Post times are relative to server start so the feed always looks fresh.
  const posts = new Map<number, StoredPost>();
  for (const { reactions, hasReacted: _unused, ...post } of seedPosts(Date.now())) {
    void _unused;
    posts.set(post.id, { post, authorId: null, baseReactions: reactions, reactorIds: new Set() });
  }

  const maxId = (ids: Iterable<number>) => Math.max(0, ...ids);
  return {
    version: STORE_VERSION,
    issues,
    posts,
    photos: new Map(),
    photoBytes: 0,
    displayNames: new Map(),
    nextIssueId: maxId(issues.keys()) + 1,
    nextPostId: maxId(posts.keys()) + 1,
  };
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

const photoUrl = (photoId: string) => `/api/issues/photos/${photoId}`;

/** Shape a stored issue for a specific viewer. Never exposes other viewers' ids. */
function toReport(issue: StoredIssue, viewerId: string | null): CityReport {
  return {
    ...issue.ticket,
    description: issue.description,
    photoUrls: issue.photoIds.map(photoUrl),
    authorName: issue.authorName,
    isMine: viewerId !== null && issue.authorId === viewerId,
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

/** All reports, newest first, so new reports land on top of the seed ones. */
export function listReports(viewerId: string | null): CityReport[] {
  return [...getStore().issues.values()]
    .map((issue) => toReport(issue, viewerId))
    .sort((a, b) => b.reportedAt.localeCompare(a.reportedAt) || b.id - a.id);
}

export interface NewReport {
  description: string;
  category: ReportCategory;
  severity: TicketSeverity;
  lat: number;
  lng: number;
  locationDetails?: string;
  /** Decoded JPEG bytes. */
  photos: Buffer[];
}

export type CreateReportResult =
  | { ok: true; report: CityReport; post: CityPost }
  | { ok: false; reason: "limit_reached" | "storage_full" };

/** Short headline from the description: first sentence, at most 80 characters. */
function titleFrom(description: string): string {
  const firstSentence = description.split(/(?<=[.!?])\s|\n/)[0].trim();
  return firstSentence.length <= 80 ? firstSentence : `${firstSentence.slice(0, 79).trimEnd()}…`;
}

/** Add a report, plus a feed post about it. */
export function createReport(input: NewReport, viewerId: string): CreateReportResult {
  const store = getStore();
  if (store.issues.size >= MAX_REPORTS) return { ok: false, reason: "limit_reached" };

  const incomingBytes = input.photos.reduce((sum, p) => sum + p.length, 0);
  if (store.photoBytes + incomingBytes > MAX_TOTAL_PHOTO_BYTES) {
    return { ok: false, reason: "storage_full" };
  }

  const photoIds = input.photos.map((bytes) => {
    const id = randomUUID();
    store.photos.set(id, bytes);
    return id;
  });
  store.photoBytes += incomingBytes;

  const now = new Date().toISOString();
  const authorName = displayNameFor(store, viewerId);
  const location = input.locationDetails || `${input.lat.toFixed(4)}, ${input.lng.toFixed(4)}`;

  const issueId = store.nextIssueId++;
  const issue: StoredIssue = {
    ticket: {
      id: issueId,
      title: titleFrom(input.description),
      category: input.category,
      severity: input.severity,
      location,
      lat: input.lat,
      lng: input.lng,
    },
    description: input.description,
    authorId: viewerId,
    authorName,
    reportedAt: now,
    photoIds,
    baseUpvotes: 0,
    upvoterIds: new Set(),
    comments: [],
  };
  store.issues.set(issueId, issue);

  const postId = store.nextPostId++;
  const post: StoredPost = {
    post: {
      id: postId,
      author: { name: authorName, type: "resident", subtitle: `Reported a ${input.category.toLowerCase()} problem` },
      kind: "report",
      title: issue.ticket.title,
      caption: input.description,
      location,
      coords: { lat: input.lat, lng: input.lng },
      postedAt: now,
      issueId,
      photoUrls: photoIds.map(photoUrl),
    },
    authorId: viewerId,
    baseReactions: 0,
    reactorIds: new Set(),
  };
  store.posts.set(postId, post);

  return { ok: true, report: toReport(issue, viewerId), post: toPost(post, viewerId) };
}

/** JPEG bytes for a report photo, or null if it doesn't exist. */
export function getPhoto(photoId: string): Buffer | null {
  return getStore().photos.get(photoId) ?? null;
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
    isMine: viewerId !== null && stored.authorId === viewerId,
  };
}

/** All posts, newest first. */
export function listPosts(viewerId: string | null): CityPost[] {
  return [...getStore().posts.values()]
    .map((stored) => toPost(stored, viewerId))
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt) || b.id - a.id);
}

/** Toggle the viewer's "Thanks" / "Going". Returns null if the post doesn't exist. */
export function toggleReaction(postId: number, viewerId: string): CityPost | null {
  const stored = getStore().posts.get(postId);
  if (!stored) return null;
  if (stored.reactorIds.has(viewerId)) stored.reactorIds.delete(viewerId);
  else stored.reactorIds.add(viewerId);
  return toPost(stored, viewerId);
}
