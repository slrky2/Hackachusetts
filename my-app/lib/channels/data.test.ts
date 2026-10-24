import { describe, expect, it } from "vitest";
import {
  CHANNEL_GROUPS,
  CHANNELS,
  COMMUNITY_SLUGS,
  DEMO_MESSAGES,
} from "./data";

const slugsInGroup = (group: "community" | "assistant") =>
  CHANNELS.filter((c) => c.group === group).map((c) => c.slug);

describe("channel definitions", () => {
  // Requirements 2.1, 2.2
  it("defines the Community and Assistant groups in order", () => {
    expect(CHANNEL_GROUPS.map((g) => g.id)).toEqual(["community", "assistant"]);
    expect(CHANNEL_GROUPS.map((g) => g.label)).toEqual(["Community", "Assistant"]);
  });

  it("lists community channels in the required order", () => {
    const expected = [
      "general",
      "new-food-places",
      "events",
      "lost-and-found",
      "road-reports",
    ];
    expect(slugsInGroup("community")).toEqual(expected);
    expect([...COMMUNITY_SLUGS]).toEqual(expected);
  });

  it("puts only #chatbot in the Assistant group", () => {
    expect(slugsInGroup("assistant")).toEqual(["chatbot"]);
  });

  // Requirement 2.3
  it("uses unique lowercase hyphen-separated slugs", () => {
    const slugs = CHANNELS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z]+(-[a-z]+)*$/);
    }
  });

  // Requirement 3.6
  it("gives every channel a non-empty, single-line description", () => {
    for (const { slug, description } of CHANNELS) {
      expect(description.trim(), slug).not.toBe("");
      expect(description, slug).not.toMatch(/[\r\n]/);
    }
  });
});

describe("demo messages", () => {
  const allMessages = COMMUNITY_SLUGS.flatMap((slug) => DEMO_MESSAGES[slug]);

  // Requirement 5.2
  it("provides at least 3 demo messages for every community channel", () => {
    for (const slug of COMMUNITY_SLUGS) {
      expect(DEMO_MESSAGES[slug].length, slug).toBeGreaterThanOrEqual(3);
    }
  });

  it("uses ids that are unique across all channels", () => {
    const ids = allMessages.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("orders timestamps strictly ascending within each channel", () => {
    for (const slug of COMMUNITY_SLUGS) {
      const times = DEMO_MESSAGES[slug].map((m) => Date.parse(m.timestamp));
      for (const t of times) {
        expect(Number.isNaN(t), slug).toBe(false);
      }
      for (let i = 1; i < times.length; i++) {
        expect(times[i], `${slug} message ${i + 1}`).toBeGreaterThan(times[i - 1]);
      }
    }
  });

  // Requirement 5.5: backstop to manual review against data/Lowell.md Section 9.
  it("contains no wording implying emergencies, closures, or official notices", () => {
    const denylist = [
      "emergency",
      "closed today",
      "evacuat",
      "city of lowell announces",
      "official notice",
    ];
    for (const message of allMessages) {
      const haystack = `${message.author} ${message.text}`.toLowerCase();
      for (const term of denylist) {
        expect(haystack.includes(term), `${message.id} contains "${term}"`).toBe(false);
      }
    }
  });
});
