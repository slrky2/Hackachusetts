import type { CityMarker, CityPost, CityReport, CityTicket, IssueComment } from "@/types";

/**
 * In-memory seed data for the POC, placed around Lowell, MA
 * (APP_CONFIG.defaultMapCenter). Coordinates are approximate.
 * Swap for real DB queries later; the shapes match what the UI consumes.
 */

// Fixed base time keeps seed timestamps deterministic between server and client.
const SEED_BASE_TIME = Date.parse("2026-10-24T08:00:00-04:00");
const hoursAgo = (hours: number) =>
  new Date(SEED_BASE_TIME - hours * 3_600_000).toISOString();

function seedComment(
  issueId: number,
  index: number,
  authorName: string,
  text: string,
  hoursBefore: number,
): IssueComment {
  return { id: `seed-${issueId}-${index}`, authorName, text, createdAt: hoursAgo(hoursBefore) };
}

export interface SeedIssue {
  ticket: CityTicket;
  reportedAt: string;
  upvotes: number;
  comments: IssueComment[];
}

export const SEED_ISSUES: SeedIssue[] = [
  {
    ticket: {
      id: 1,
      title: "Pothole on Merrimack St near City Hall",
      category: "Roads",
      severity: "High",
      reward: "$120",
      location: "Downtown",
      lat: 42.6461,
      lng: -71.3105,
    },
    reportedAt: hoursAgo(30),
    upvotes: 14,
    comments: [
      seedComment(1, 0, "downtown_commuter", "Blew a tire here last week. It's deep.", 20),
      seedComment(1, 1, "acre_neighbor", "Saw a city truck mark it yesterday.", 6),
    ],
  },
  {
    ticket: {
      id: 2,
      title: "Broken streetlight on the canalway by Boott Mills",
      category: "Lighting",
      severity: "Medium",
      reward: "$60",
      location: "Boott Mills",
      lat: 42.6472,
      lng: -71.3138,
    },
    reportedAt: hoursAgo(52),
    upvotes: 6,
    comments: [seedComment(2, 0, "riverwalk_runner", "Really dark on evening runs.", 40)],
  },
  {
    ticket: {
      id: 3,
      title: "Overflowing trash bins at Kearney Square",
      category: "Sanitation",
      severity: "Medium",
      reward: "$45",
      location: "Kearney Square",
      lat: 42.6441,
      lng: -71.3076,
    },
    reportedAt: hoursAgo(10),
    upvotes: 4,
    comments: [],
  },
  {
    ticket: {
      id: 4,
      title: "Graffiti on the Bridge St underpass",
      category: "Vandalism",
      severity: "Low",
      reward: "$30",
      location: "Centralville",
      lat: 42.6505,
      lng: -71.3058,
    },
    reportedAt: hoursAgo(72),
    upvotes: 2,
    comments: [],
  },
  {
    ticket: {
      id: 5,
      title: "Fallen tree blocking the Pawtucket Blvd bike path",
      category: "Parks",
      severity: "High",
      reward: "$150",
      location: "Pawtucket Falls",
      lat: 42.6545,
      lng: -71.3310,
    },
    reportedAt: hoursAgo(5),
    upvotes: 9,
    comments: [seedComment(5, 0, "umass_cyclist", "Had to walk my bike around it on the grass.", 3)],
  },
  {
    ticket: {
      id: 6,
      title: "Faded crosswalk at Broadway & Dummer St",
      category: "Roads",
      severity: "Low",
      reward: "$40",
      location: "The Acre",
      lat: 42.6462,
      lng: -71.3195,
    },
    reportedAt: hoursAgo(96),
    upvotes: 3,
    comments: [],
  },
  {
    ticket: {
      id: 7,
      title: "Flooded sidewalk on Gorham St after rain",
      category: "Drainage",
      severity: "Medium",
      reward: "$70",
      location: "Back Central",
      lat: 42.6350,
      lng: -71.3060,
    },
    reportedAt: hoursAgo(18),
    upvotes: 5,
    comments: [],
  },
  {
    ticket: {
      id: 8,
      title: "Missing stop sign at Westford & Stevens St",
      category: "Traffic",
      severity: "High",
      reward: "$90",
      location: "Highlands",
      lat: 42.6385,
      lng: -71.3330,
    },
    reportedAt: hoursAgo(14),
    upvotes: 11,
    comments: [seedComment(8, 0, "highlands_parent", "Kids cross here for school. Please prioritize.", 12)],
  },
];

/** Seed issues as the client-facing report shape (used as SWR fallback). */
export function seedReports(): CityReport[] {
  return SEED_ISSUES.map((seed) => ({
    ...seed.ticket,
    reportedAt: seed.reportedAt,
    upvotes: seed.upvotes,
    hasUpvoted: false,
    comments: seed.comments,
  }));
}

export const CITY_POSTS: CityPost[] = [
  {
    id: 1,
    author: "city_resident",
    location: "Market Mills",
    caption: "Farmers market at Market Mills is open until 6pm today.",
    lat: 42.6446,
    lng: -71.3122,
  },
  {
    id: 2,
    author: "acre_neighbor",
    location: "The Acre",
    caption: "Heads up: Broadway is down to one lane for water main work.",
    lat: 42.6472,
    lng: -71.3218,
  },
  {
    id: 3,
    author: "riverwalk_runner",
    location: "Merrimack Riverwalk",
    caption: "Riverwalk is clear and the foliage is peaking. Great morning run.",
    lat: 42.6497,
    lng: -71.3090,
  },
  {
    id: 4,
    author: "belvidere_local",
    location: "Shedd Park",
    caption: "Pickup soccer at Shedd Park every Sunday at 10am. All welcome.",
    lat: 42.6338,
    lng: -71.2935,
  },
];

export const issueMarkerId = (id: number) => `issue-${id}`;
export const postMarkerId = (id: number) => `post-${id}`;

/** Flatten reports and posts into the marker list the map renders. */
export function buildMarkers(reports: CityReport[], posts: CityPost[]): CityMarker[] {
  return [
    ...reports.map((report) => ({
      id: issueMarkerId(report.id),
      kind: "issue" as const,
      lat: report.lat,
      lng: report.lng,
      report,
    })),
    ...posts.map((post) => ({
      id: postMarkerId(post.id),
      kind: "post" as const,
      lat: post.lat,
      lng: post.lng,
      post,
    })),
  ];
}
