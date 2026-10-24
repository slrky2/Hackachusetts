/**
 * Pure channel logic for the /chatbot channels page.
 * No React, no DOM, no runtime clock: everything here is deterministic
 * and unit-testable.
 */

import {
  CHANNELS,
  COMMUNITY_SLUGS,
  DEMO_MESSAGES,
  type ChannelDef,
  type DemoMessage,
  type ChannelSlug,
  type CommunitySlug,
} from "./data";

// ---------------------------------------------------------------------------
// Slug resolution and channel helpers (Requirements 3.1, 3.2, 3.3, 3.4)
// ---------------------------------------------------------------------------

/** Channel shown when the URL has no valid `channel` param. */
export const DEFAULT_CHANNEL: ChannelSlug = "chatbot";

/** Exact, case-sensitive match against the known channel slugs. */
export function isChannelSlug(value: string): value is ChannelSlug {
  return CHANNELS.some((channel) => channel.slug === value);
}

/**
 * Maps a raw `channel` query value to a known slug.
 * Anything that is not an exact match (null, "", "General", "bogus") falls
 * back to DEFAULT_CHANNEL.
 */
export function resolveChannelSlug(raw: string | null | undefined): ChannelSlug {
  return typeof raw === "string" && isChannelSlug(raw) ? raw : DEFAULT_CHANNEL;
}

/** Shareable URL for a channel. */
export function channelHref(slug: ChannelSlug): string {
  return `/chatbot?channel=${slug}`;
}

/** Looks up a channel definition. Every ChannelSlug has an entry in CHANNELS. */
export function getChannel(slug: ChannelSlug): ChannelDef {
  const channel = CHANNELS.find((c) => c.slug === slug);
  if (!channel) {
    throw new Error(`Unknown channel slug: ${slug}`);
  }
  return channel;
}

// ---------------------------------------------------------------------------
// Message text and session state (Requirements 6.2, 6.4, 6.5, 6.7, 6.8)
// ---------------------------------------------------------------------------

/** Max post length in UTF-16 code units, matching the textarea `maxLength`. */
export const MAX_MESSAGE_LENGTH = 1000;

/** Author name shown on messages the visitor posts this session. */
export const VISITOR_DISPLAY_NAME = "You";

/** A message the visitor posted during this page session (memory only). */
export interface SessionMessage {
  id: string;
  author: typeof VISITOR_DISPLAY_NAME;
  /** ISO 8601, captured in the submit handler. */
  timestamp: string;
  /** Prepared text: trimmed, 1..MAX_MESSAGE_LENGTH chars. */
  text: string;
}

/** Visitor posts per community channel. Never persisted or sent anywhere. */
export type SessionState = Readonly<Record<CommunitySlug, readonly SessionMessage[]>>;

export type SessionAction = {
  type: "post";
  channel: CommunitySlug;
  text: string;
  id: string;
  timestamp: string;
};

/**
 * Trims leading/trailing whitespace only; internal spaces and newlines are kept.
 * Returns null if the trimmed text is empty or longer than MAX_MESSAGE_LENGTH.
 */
export function prepareMessageText(raw: string): string | null {
  const text = raw.trim();
  if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
    return null;
  }
  return text;
}

/** Every community channel starts with no visitor posts. */
export function createInitialSessionState(): SessionState {
  const state = {} as Record<CommunitySlug, readonly SessionMessage[]>;
  for (const slug of COMMUNITY_SLUGS) {
    state[slug] = [];
  }
  return state;
}

/**
 * Appends a visitor post to its channel. Text is prepared again here so the
 * invariants hold regardless of the caller. Invalid text returns the same
 * state object; otherwise only the target channel's array is replaced.
 */
export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "post": {
      const text = prepareMessageText(action.text);
      if (text === null) {
        return state;
      }
      const message: SessionMessage = {
        id: action.id,
        author: VISITOR_DISPLAY_NAME,
        timestamp: action.timestamp,
        text,
      };
      return { ...state, [action.channel]: [...state[action.channel], message] };
    }
    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Display messages (Requirements 5.1, 6.6)
// ---------------------------------------------------------------------------

/** A message as rendered in a community channel log. */
export type DisplayMessage =
  | (DemoMessage & { kind: "demo" })
  | (SessionMessage & { kind: "session" });

/**
 * Messages for a community channel: the fixed demo messages in their original
 * order, followed by the visitor's session posts in the order they were made.
 */
export function getChannelMessages(slug: CommunitySlug, state: SessionState): DisplayMessage[] {
  const demo: DisplayMessage[] = DEMO_MESSAGES[slug].map((message) => ({
    ...message,
    kind: "demo",
  }));
  const session: DisplayMessage[] = state[slug].map((message) => ({
    ...message,
    kind: "session",
  }));
  return [...demo, ...session];
}

// ---------------------------------------------------------------------------
// Message metadata helpers (Requirement 5.3)
// ---------------------------------------------------------------------------

/**
 * Avatar initial for an author name: the first non-whitespace code point,
 * uppercased, or "?" if the name has no non-whitespace character.
 *
 * Iterates by code point (for...of), so astral characters such as emoji are
 * never split into lone surrogates. Note that uppercasing a single code point
 * can yield more than one character (e.g. "ß" becomes "SS"); that is expected.
 */
export function authorInitial(name: string): string {
  for (const char of name) {
    if (!/\s/u.test(char)) {
      return char.toUpperCase();
    }
  }
  return "?";
}

/** Shared formatter: en-US in Boston time, e.g. "Oct 18, 2:15 PM". */
const MESSAGE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/**
 * Formats an ISO 8601 timestamp for display in a message header.
 * If `iso` does not parse to a valid date, the original string is returned
 * unchanged instead of throwing, so a bad timestamp never breaks rendering.
 */
export function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return MESSAGE_TIME_FORMAT.format(date);
}
