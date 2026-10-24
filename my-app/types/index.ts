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

export type BountyStatus = "open" | "claimed" | "in_review" | "completed" | "expired";
export type BountyCategory = "issue_fix" | "community_task" | "cleanup" | "survey" | "other";

export interface Bounty {
  id: string;
  title: string;
  description: string;
  category: BountyCategory;
  status: BountyStatus;
  reward: number; // points or currency
  rewardType: "points" | "gift_card" | "recognition";
  deadline?: string;
  createdBy: User;
  claimedBy?: User;
  linkedIssueId?: string;
  requirements: string[];
  createdAt: string;
  updatedAt: string;
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
