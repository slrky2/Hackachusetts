import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  CHANNELS,
  COMMUNITY_SLUGS,
  DEMO_MESSAGES,
  type ChannelSlug,
  type CommunitySlug,
} from "./data";
import {
  authorInitial,
  channelHref,
  createInitialSessionState,
  formatMessageTime,
  getChannelMessages,
  prepareMessageText,
  resolveChannelSlug,
  sessionReducer,
  type SessionAction,
  type SessionState,
} from "./state";

// ---------------------------------------------------------------------------
// Shared fixtures and generators (reused by later property tests in this file)
// ---------------------------------------------------------------------------

/** The six known slugs, written out independently of CHANNELS as an oracle. */
const VALID_SLUGS: readonly ChannelSlug[] = [
  "general",
  "new-food-places",
  "events",
  "lost-and-found",
  "road-reports",
  "chatbot",
];

const CHANNEL_SLUGS_IN_DATA = CHANNELS.map((c) => c.slug);

/** Any one of the known slugs. */
const validSlugArb = fc.constantFrom(...VALID_SLUGS);

/** Near-miss variants of valid slugs: case changes and surrounding whitespace. */
const mutatedSlugArb = fc
  .tuple(
    validSlugArb,
    fc.constantFrom<(s: string) => string>(
      (s) => s.toUpperCase(),
      (s) => s.charAt(0).toUpperCase() + s.slice(1),
      (s) => ` ${s}`,
      (s) => `${s} `,
      (s) => `\t${s}\n`,
      (s) => s.replace(/-/g, " "),
    ),
  )
  .map(([slug, mutate]) => mutate(slug));

/** Raw `channel` query values: valid, near-miss, arbitrary, or absent. */
const rawChannelArb: fc.Arbitrary<string | null | undefined> = fc.oneof(
  validSlugArb,
  mutatedSlugArb,
  fc.string(),
  fc.string({ unit: "binary" }),
  fc.constant(null),
  fc.constant(undefined),
);

// ---------------------------------------------------------------------------
// Slug resolution
// ---------------------------------------------------------------------------

describe("resolveChannelSlug", () => {
  // Feature: community-channels-layout, Property 1: Channel resolution is total and exact
  // **Validates: Requirements 3.2, 3.3, 3.4**
  it("returns a known slug, equal to raw iff raw is an exact slug, else chatbot", () => {
    fc.assert(
      fc.property(rawChannelArb, (raw) => {
        const result = resolveChannelSlug(raw);
        expect(CHANNEL_SLUGS_IN_DATA).toContain(result);

        const isExactSlug =
          typeof raw === "string" && (VALID_SLUGS as readonly string[]).includes(raw);
        expect(result).toBe(isExactSlug ? raw : "chatbot");
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Channel links
// ---------------------------------------------------------------------------

describe("channelHref", () => {
  // Feature: community-channels-layout, Property 2: Channel link round trip
  // **Validates: Requirements 3.1, 3.2**
  it("builds a /chatbot link whose channel param resolves back to the same slug", () => {
    fc.assert(
      fc.property(validSlugArb, (slug) => {
        const url = new URL(channelHref(slug), "http://localhost");
        expect(url.pathname).toBe("/chatbot");
        expect(resolveChannelSlug(url.searchParams.get("channel"))).toBe(slug);
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Shared session generators (reused by Properties 3, 4, and 5)
// ---------------------------------------------------------------------------

/** Any one of the five community slugs. */
const communitySlugArb: fc.Arbitrary<CommunitySlug> = fc.constantFrom(...COMMUNITY_SLUGS);

/**
 * Single code units that String.prototype.trim removes: ASCII whitespace,
 * line terminators, and the Unicode Space_Separator / BOM characters.
 */
const TRIMMABLE_WHITESPACE: readonly string[] = [
  " ",
  "\t",
  "\n",
  "\r",
  "\v",
  "\f",
  "\u00a0",
  "\u1680",
  "\u2000",
  "\u2001",
  "\u2002",
  "\u2003",
  "\u2004",
  "\u2005",
  "\u2006",
  "\u2007",
  "\u2008",
  "\u2009",
  "\u200a",
  "\u2028",
  "\u2029",
  "\u202f",
  "\u205f",
  "\u3000",
  "\ufeff",
];

/** One trimmable whitespace code unit. */
const whitespaceCharArb = fc.constantFrom(...TRIMMABLE_WHITESPACE);

/** Whitespace-only strings (possibly empty) that trim() reduces to "". */
const whitespaceArb = fc.string({ unit: whitespaceCharArb, maxLength: 20 });

/**
 * One code unit that trim() keeps (BMP, below the surrogate range, so each
 * unit is exactly one UTF-16 code unit and never a lone surrogate).
 */
const nonWhitespaceCharArb = fc
  .integer({ min: 0x21, max: 0xd7ff })
  .map((code) => String.fromCharCode(code))
  .filter((char) => char.trim() === char);

/** Interior code units: mostly visible text, with spaces, tabs, and newlines mixed in. */
const interiorCharArb = fc.oneof(
  { arbitrary: nonWhitespaceCharArb, weight: 3 },
  { arbitrary: fc.constantFrom(" ", "\n", "\t", "\r"), weight: 1 },
);

/**
 * The trimmed core of a valid post: 1..1000 code units with non-whitespace at
 * both ends, so `(lead + core + trail).trim() === core`. One branch pins the
 * length to exactly 1000 to cover the upper boundary.
 */
const validCoreTextArb = fc.oneof(
  nonWhitespaceCharArb,
  fc
    .tuple(
      nonWhitespaceCharArb,
      fc.string({ unit: interiorCharArb, maxLength: 998 }),
      nonWhitespaceCharArb,
    )
    .map(([first, middle, last]) => first + middle + last),
  fc
    .tuple(
      nonWhitespaceCharArb,
      fc.string({ unit: interiorCharArb, minLength: 998, maxLength: 998 }),
      nonWhitespaceCharArb,
    )
    .map(([first, middle, last]) => first + middle + last),
);

/** Raw text whose trimmed form is a valid post, plus the expected trimmed text. */
const validRawTextArb = fc
  .tuple(whitespaceArb, validCoreTextArb, whitespaceArb)
  .map(([lead, core, trail]) => ({ raw: lead + core + trail, core }));

/** Message ids as produced by crypto.randomUUID(), plus arbitrary strings. */
const messageIdArb = fc.oneof(fc.uuid(), fc.string({ minLength: 1 }));

/** ISO 8601 timestamps between 2000 and 2100. */
const isoTimestampArb = fc
  .date({
    min: new Date("2000-01-01T00:00:00.000Z"),
    max: new Date("2100-01-01T00:00:00.000Z"),
    noInvalidDate: true,
  })
  .map((date) => date.toISOString());

/** Post actions with a mix of valid, whitespace-only, and arbitrary text. */
const postActionArb: fc.Arbitrary<SessionAction> = fc.record({
  type: fc.constant("post" as const),
  channel: communitySlugArb,
  text: fc.oneof(
    validRawTextArb.map(({ raw }) => raw),
    whitespaceArb,
    fc.string({ maxLength: 50 }),
  ),
  id: messageIdArb,
  timestamp: isoTimestampArb,
});

/** Folds actions through the reducer, starting from the initial state. */
function buildReachableState(actions: readonly SessionAction[]): SessionState {
  return actions.reduce<SessionState>(
    (state, action) => sessionReducer(state, action),
    createInitialSessionState(),
  );
}

/** A session state reachable from createInitialSessionState() via post actions. */
const reachableStateArb: fc.Arbitrary<SessionState> = fc
  .array(postActionArb, { maxLength: 20 })
  .map(buildReachableState);

// ---------------------------------------------------------------------------
// Session reducer: valid posts
// ---------------------------------------------------------------------------

describe("sessionReducer valid posts", () => {
  // Feature: community-channels-layout, Property 3: Valid posts append one prepared visitor message
  // **Validates: Requirements 6.2, 6.8**
  it("appends exactly one trimmed visitor message to the target channel only", () => {
    fc.assert(
      fc.property(
        reachableStateArb,
        communitySlugArb,
        messageIdArb,
        isoTimestampArb,
        validRawTextArb,
        (prev, channel, id, timestamp, { raw, core }) => {
          const next = sessionReducer(prev, { type: "post", channel, text: raw, id, timestamp });

          expect(raw.trim()).toBe(core);
          expect(next[channel]).toEqual([
            ...prev[channel],
            { id, author: "You", timestamp, text: core },
          ]);

          for (const other of COMMUNITY_SLUGS) {
            if (other !== channel) {
              expect(next[other]).toBe(prev[other]);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Session reducer: invalid posts
// ---------------------------------------------------------------------------

/** Whitespace-only text: the common set from the task plus the full trimmable set. */
const whitespaceOnlyTextArb = fc.oneof(
  fc.string({ unit: fc.constantFrom(" ", "\t", "\n", "\r", "\u00a0", "\u2003"), minLength: 1 }),
  fc.string({ unit: whitespaceCharArb, minLength: 1, maxLength: 200 }),
  whitespaceArb,
);

/**
 * Text whose trimmed length is 1001..3000: non-whitespace at both ends of a
 * core of that length, optionally wrapped in whitespace. One branch pins the
 * core to exactly 1001 to cover the lower boundary.
 */
const tooLongCoreArb = fc.oneof(
  fc
    .tuple(
      nonWhitespaceCharArb,
      fc.string({ unit: interiorCharArb, minLength: 999, maxLength: 2998 }),
      nonWhitespaceCharArb,
    )
    .map(([first, middle, last]) => first + middle + last),
  fc
    .tuple(
      nonWhitespaceCharArb,
      fc.string({ unit: interiorCharArb, minLength: 999, maxLength: 999 }),
      nonWhitespaceCharArb,
    )
    .map(([first, middle, last]) => first + middle + last),
);

const tooLongTextArb = fc
  .tuple(whitespaceArb, tooLongCoreArb, whitespaceArb)
  .map(([lead, core, trail]) => lead + core + trail);

/** Raw text that prepareMessageText must reject. */
const invalidRawTextArb = fc.oneof(fc.constant(""), whitespaceOnlyTextArb, tooLongTextArb);

describe("sessionReducer invalid posts", () => {
  // Feature: community-channels-layout, Property 4: Invalid text is rejected without changing state
  // **Validates: Requirements 6.4, 6.5**
  it("rejects empty, whitespace-only, and over-length text and returns the same state", () => {
    fc.assert(
      fc.property(
        reachableStateArb,
        communitySlugArb,
        messageIdArb,
        isoTimestampArb,
        invalidRawTextArb,
        (state, channel, id, timestamp, raw) => {
          const trimmedLength = raw.trim().length;
          expect(trimmedLength === 0 || trimmedLength > 1000).toBe(true);

          expect(prepareMessageText(raw)).toBeNull();
          expect(sessionReducer(state, { type: "post", channel, text: raw, id, timestamp })).toBe(
            state,
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Channel messages: demo-then-posted model
// ---------------------------------------------------------------------------

/** A visitor post as tracked by the independent model below. */
interface ModelPost {
  id: string;
  author: "You";
  timestamp: string;
  text: string;
}

/** Model validity check, written independently of prepareMessageText. */
function modelAccepts(raw: string): boolean {
  const trimmed = raw.trim();
  return trimmed.length > 0 && trimmed.length <= 1000;
}

describe("getChannelMessages", () => {
  // Feature: community-channels-layout, Property 5: Channel messages match the demo-then-posted model
  // **Validates: Requirements 5.1, 6.6**
  it("returns demo messages in order followed by valid posts in dispatch order", () => {
    fc.assert(
      fc.property(fc.array(postActionArb, { maxLength: 50 }), (actions) => {
        let state: SessionState = createInitialSessionState();
        const model = Object.fromEntries(
          COMMUNITY_SLUGS.map((slug) => [slug, [] as ModelPost[]]),
        ) as Record<CommunitySlug, ModelPost[]>;

        for (const action of actions) {
          state = sessionReducer(state, action);
          if (modelAccepts(action.text)) {
            model[action.channel].push({
              id: action.id,
              author: "You",
              timestamp: action.timestamp,
              text: action.text.trim(),
            });
          }
        }

        for (const slug of COMMUNITY_SLUGS) {
          expect(getChannelMessages(slug, state)).toEqual([
            ...DEMO_MESSAGES[slug].map((message) => ({ ...message, kind: "demo" })),
            ...model[slug].map((post) => ({ ...post, kind: "session" })),
          ]);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Message metadata helpers
// ---------------------------------------------------------------------------

/**
 * Reference avatar initial, written independently of authorInitial: split
 * into code points with Array.from, take the first one that is not Unicode
 * whitespace (same /\s/u definition), and uppercase it; "?" if none exists.
 */
function referenceInitial(name: string): string {
  const firstVisible = Array.from(name).find((codePoint) => !/\s/u.test(codePoint));
  return firstVisible === undefined ? "?" : firstVisible.toUpperCase();
}

/** Author names: arbitrary, grapheme (incl. non-BMP), binary, empty, and whitespace-only. */
const authorNameArb = fc.oneof(
  fc.string(),
  fc.string({ unit: "grapheme" }),
  fc.string({ unit: "binary" }),
  fc.constant(""),
  whitespaceArb,
);

describe("message metadata helpers", () => {
  // Feature: community-channels-layout, Property 6: Message metadata rendering helpers are total and deterministic
  // **Validates: Requirements 5.3**
  it("authorInitial matches the reference and formatMessageTime is non-empty and stable", () => {
    fc.assert(
      fc.property(authorNameArb, isoTimestampArb, (name, iso) => {
        expect(authorInitial(name)).toBe(referenceInitial(name));

        const first = formatMessageTime(iso);
        expect(first.length).toBeGreaterThan(0);
        expect(formatMessageTime(iso)).toBe(first);
      }),
      { numRuns: 100 },
    );
  });
});
