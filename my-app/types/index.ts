// ─── User ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "citizen" | "moderator" | "admin" | "city_official";
  neighborhood?: string;
  createdAt: string;
  reputation: number;
}

// ─── Channel ─────────────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  description: string;
  category: "general" | "announcements" | "safety" | "events" | "lost_found" | "classifieds";
  memberCount: number;
  isPublic: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  author: User;
  content: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  url: string;
  type: "image" | "video" | "document";
  name: string;
}

// ─── Map / Issue ──────────────────────────────────────────────────────────────

export type IssueCategory =
  | "road_hazard"
  | "road_blockage"
  | "pothole"
  | "broken_streetlight"
  | "graffiti"
  | "flooding"
  | "fallen_tree"
  | "abandoned_vehicle"
  | "noise_complaint"
  | "other";

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "high" | "critical";

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  category: IssueCategory;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  imageUrls?: string[];
  reportedBy: User;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  cityResponse?: string;
}

// ─── Bounty ───────────────────────────────────────────────────────────────────

/**
 * A bounty is a small paid job anyone can do: a household chore or favor
 * (mow a lawn, carry a couch), or light community work the city posts (park
 * cleanup). Repairs that need city equipment, like potholes or streetlights,
 * are not bounties; they stay city tickets for city crews.
 *
 * It moves through four states in one direction only:
 *
 *   open → claimed → done → paid
 *
 * Each step can be taken by exactly one person, checked by the server on
 * every request against the signed-in Clerk user:
 *   - claim   (open → claimed):  any signed-in user except the poster
 *   - done    (claimed → done):  only the claimer
 *   - approve (done → paid):     only the poster (city staff for city jobs)
 */
export type BountyStatus = "open" | "claimed" | "done" | "paid";

/** A step the current viewer is allowed to take on a bounty right now. */
export type BountyAction = "claim" | "done" | "approve";

export interface Bounty {
  id: number;
  /** The job, e.g. "Mow my front and back lawn". Required, non-blank. */
  title: string;
  /** Extra info: when, how long, what to bring. May be empty. */
  details: string;
  /** Dollars paid on approval. 0 < reward ≤ 1000, rounded to cents. */
  reward: number;
  /** Display name of the poster. User ids are never sent to the client. */
  posterName: string;
  /** Opaque public id for the poster's profile page (/profile/:id). */
  posterProfileId: string;
  /** Photo of the job, if the poster added one. */
  imageUrl: string | null;
  /** True for city jobs (paid by the city, approved by city staff). */
  postedByCity: boolean;
  /** Display name of whoever took the job. null while open. */
  claimerName: string | null;
  /** Where the job is. null means no map pin. */
  lat: number | null;
  lng: number | null;
  /** Where the job is, like "Lawrence St". Required; used for directions. */
  place: string;
  status: BountyStatus;
  /** ISO time it was posted. Drives "2h ago" on the card. */
  createdAt: string;
  /** The viewer's relationship to this job, for "My jobs" and the pill text. */
  mine: "posted" | "claimed" | null;
  /** The one step the viewer can take now, or null. The UI shows one button. */
  viewerCan: BountyAction | null;
}

/** The signed-in user as the bounty API sees them. */
export interface BountyViewer {
  name: string;
  isCityStaff: boolean;
  /** Simulated wallet balance in dollars. */
  wallet: number;
}

/** Public profile of someone who posts jobs, from GET /api/profiles/:id. */
export interface PosterProfile {
  id: string;
  name: string;
  isCity: boolean;
  jobsPosted: number;
  /** Jobs they claimed, finished and got paid for. */
  jobsCompleted: number;
}

/** GET /api/bounties response. `viewer` is null when signed out. */
export interface BountiesResponse {
  bounties: Bounty[];
  viewer: BountyViewer | null;
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  dietaryRestrictions?: DietaryRestriction[];
  allergens?: Allergen[];
  createdAt: string;
}

export type DietaryRestriction =
  | "vegetarian"
  | "vegan"
  | "halal"
  | "kosher"
  | "gluten_free"
  | "dairy_free";

export type Allergen =
  | "nuts"
  | "peanuts"
  | "shellfish"
  | "fish"
  | "eggs"
  | "milk"
  | "wheat"
  | "soy"
  | "sesame";

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "issue_update"
  | "bounty_claimed"
  | "bounty_completed"
  | "channel_message"
  | "city_announcement"
  | "mention";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Dashboard (lightweight shapes used by the home page + map) ───────────────

export type TicketSeverity = "High" | "Medium" | "Low";

/**
 * A reported city problem shown in the "City Problems" panel and as a map pin.
 * These are city crew jobs (roads, lighting, utilities), not bounties.
 */
export interface CityTicket {
  id: number;
  title: string;
  category: string;
  severity: TicketSeverity;
  location: string;
  lat: number;
  lng: number;
}

export type PostKind =
  | "announcement"
  | "event"
  | "alert"
  | "community"
  | "lost_found"
  | "volunteer"
  /** Auto-created when a resident files a report. */
  | "report";

export interface PostAuthor {
  name: string;
  /** City departments get an "Official" badge; residents post as themselves. */
  type: "city" | "resident";
  /** Department or neighborhood, shown under the name. */
  subtitle: string;
}

export interface PostImage {
  src: string;
  alt: string;
  /** Attribution required by the photo's license. */
  credit: string;
  license: string;
  sourceUrl: string;
}

/** A community feed post, shown in the feed and (if it has coords) as a map pin. */
export interface CityPost {
  id: number;
  author: PostAuthor;
  kind: PostKind;
  title?: string;
  caption: string;
  location: string;
  /** Omitted for citywide posts, which get no map pin. */
  coords?: { lat: number; lng: number };
  postedAt: string;
  image?: PostImage;
  /** Event time label, e.g. "Sat · 9am – 12pm". Turns the reaction into "Going". */
  when?: string;
  /** "Thanks" count, or "Going" count for posts with `when`. */
  reactions: number;
  hasReacted: boolean;
  /** Set on posts made from a report; links the post to that report's map pin. */
  issueId?: number;
  /** The report's own photos (served from /api/issues/photos/:id). */
  photoUrls?: string[];
  /** True when the current viewer wrote it. */
  isMine?: boolean;
}

/** A comment on a report, as returned to the client (no author ids exposed). */
export interface IssueComment {
  id: string;
  authorName: string;
  text: string;
  createdAt: string;
  /** True when the current viewer wrote it. */
  isMine?: boolean;
}

/** A ticket plus community activity, as served by GET /api/issues. */
export interface CityReport extends CityTicket {
  description: string;
  /** Served from /api/issues/photos/:photoId. */
  photoUrls: string[];
  authorName: string;
  /** True when the current viewer filed it. */
  isMine: boolean;
  reportedAt: string;
  upvotes: number;
  /** Whether the current viewer has upvoted it. */
  hasUpvoted: boolean;
  comments: IssueComment[];
}

/** Normalized marker the map renders; built from reports, posts and bounties. */
export type CityMarker =
  | { id: string; kind: "issue"; lat: number; lng: number; report: CityReport }
  | { id: string; kind: "post"; lat: number; lng: number; post: CityPost }
  | { id: string; kind: "bounty"; lat: number; lng: number; bounty: Bounty };
