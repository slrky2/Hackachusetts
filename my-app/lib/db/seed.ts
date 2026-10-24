import type { Bounty, CityMarker, CityPost, CityReport, CityTicket, IssueComment } from "@/types";

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

// ─── Feed posts ───────────────────────────────────────────────────────────────
// Mock content for the demo. Photos are openly licensed from Wikimedia Commons;
// the credit + license are shown on each post as their licenses require.

const CITY_HALL = { name: "City of Lowell", type: "city", subtitle: "City Hall" } as const;
const DPW = { name: "Lowell DPW", type: "city", subtitle: "Public Works" } as const;
const PARKS = { name: "Lowell Parks & Recreation", type: "city", subtitle: "Parks & Recreation" } as const;
const LIBRARY = { name: "Pollard Memorial Library", type: "city", subtitle: "Public Library" } as const;
const resident = (name: string, neighborhood: string) =>
  ({ name, type: "resident", subtitle: neighborhood }) as const;

type SeedPost = Omit<CityPost, "postedAt" | "hasReacted"> & { postedHoursAgo: number };

const SEED_POSTS: SeedPost[] = [
  {
    id: 1,
    author: CITY_HALL,
    kind: "announcement",
    title: "City Council meeting Tuesday, 6:30pm",
    caption:
      "Public comment is open on the Merrimack St repaving plan. Join in person at City Hall or watch the livestream.",
    location: "City Hall",
    coords: { lat: 42.6466, lng: -71.3115 },
    postedHoursAgo: 2,
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/38/Pollard_Memorial_Library_with_Lowell_City_Hall_in_background%3B_Lowell%2C_MA%3B_west_side%3B_2011-08-20.JPG/960px-Pollard_Memorial_Library_with_Lowell_City_Hall_in_background%3B_Lowell%2C_MA%3B_west_side%3B_2011-08-20.JPG",
      alt: "Pollard Memorial Library with the Lowell City Hall clock tower behind it",
      credit: "Emw",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Pollard_Memorial_Library_with_Lowell_City_Hall_in_background;_Lowell,_MA;_west_side;_2011-08-20.JPG",
    },
    reactions: 18,
  },
  {
    id: 2,
    author: resident("market_regular", "Downtown"),
    kind: "community",
    caption: "Farmers market at Market Mills is open until 6pm. Apple cider donuts are back.",
    location: "Market Mills",
    coords: { lat: 42.6446, lng: -71.3122 },
    postedHoursAgo: 3,
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Visitor_Center%2C_Market_Mills%2C_Lowell_MA.jpg/960px-Visitor_Center%2C_Market_Mills%2C_Lowell_MA.jpg",
      alt: "Brick Market Mills building that houses the Lowell visitor center",
      credit: "John Phelan",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Visitor_Center,_Market_Mills,_Lowell_MA.jpg",
    },
    reactions: 22,
  },
  {
    id: 3,
    author: DPW,
    kind: "alert",
    title: "Broadway down to one lane",
    caption:
      "Water main work between Dummer St and Cabot St, 7am to 4pm through Friday. Expect delays and use Market St if you can.",
    location: "The Acre",
    coords: { lat: 42.6472, lng: -71.3218 },
    postedHoursAgo: 4,
    reactions: 25,
  },
  {
    id: 4,
    author: resident("riverwalk_runner", "Centralville"),
    kind: "community",
    caption: "Lower Locks this morning. Foliage is peaking along the canals, worth a walk before it's gone.",
    location: "Lower Locks",
    coords: { lat: 42.6425, lng: -71.3065 },
    postedHoursAgo: 5,
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Lower_Locks_Lowell_National_Park.jpg/960px-Lower_Locks_Lowell_National_Park.jpg",
      alt: "Canal at the Lower Locks lined with autumn trees",
      credit: "Cscat9091",
      license: "CC0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Lower_Locks_Lowell_National_Park.jpg",
    },
    reactions: 31,
  },
  {
    id: 5,
    author: resident("acre_neighbor", "The Acre"),
    kind: "lost_found",
    title: "Found: gray tabby cat",
    caption:
      "Near Broadway & Fletcher St. Very friendly, no collar. Keeping her inside for now. Message me if she's yours.",
    location: "The Acre",
    coords: { lat: 42.6480, lng: -71.3230 },
    postedHoursAgo: 6,
    reactions: 14,
  },
  {
    id: 6,
    author: PARKS,
    kind: "volunteer",
    title: "Riverbank cleanup at Pawtucket Falls",
    caption: "Gloves, bags, and coffee provided. All ages welcome. Bring a friend and help keep the river clean.",
    location: "Pawtucket Falls",
    coords: { lat: 42.6540, lng: -71.3300 },
    postedHoursAgo: 8,
    when: "Sat · 9am – 12pm",
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Pawtucket_Falls_viewed_from_O%27Donnell_Bridge_near_Pawtucket_Gatehouse%3B_Lowell%2C_MA%3B_2012-05-19.JPG/960px-Pawtucket_Falls_viewed_from_O%27Donnell_Bridge_near_Pawtucket_Gatehouse%3B_Lowell%2C_MA%3B_2012-05-19.JPG",
      alt: "Pawtucket Falls on the Merrimack River seen from the O'Donnell Bridge",
      credit: "Emw",
      license: "CC BY-SA 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Pawtucket_Falls_viewed_from_O%27Donnell_Bridge_near_Pawtucket_Gatehouse;_Lowell,_MA;_2012-05-19.JPG",
    },
    reactions: 12,
  },
  {
    id: 7,
    author: DPW,
    kind: "announcement",
    title: "Curbside leaf collection starts Monday",
    caption: "Use paper yard-waste bags only, no plastic. Put bags out by 7am on your regular trash day.",
    location: "Citywide",
    postedHoursAgo: 11,
    reactions: 20,
  },
  {
    id: 8,
    author: LIBRARY,
    kind: "event",
    title: "Free tech help hours",
    caption: "Bring your phone or laptop and your questions. Volunteers can help with email, video calls, and city services online.",
    location: "Pollard Memorial Library",
    coords: { lat: 42.6461, lng: -71.3127 },
    postedHoursAgo: 20,
    when: "Wed · 3pm – 5pm",
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Exterior_of_public_library%2C_Lowell%2C_Massachusetts.jpg/960px-Exterior_of_public_library%2C_Lowell%2C_Massachusetts.jpg",
      alt: "Stone exterior of Pollard Memorial Library in Lowell",
      credit: "Kenneth C. Zirkel",
      license: "CC BY-SA 4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Exterior_of_public_library,_Lowell,_Massachusetts.jpg",
    },
    reactions: 9,
  },
  {
    id: 9,
    author: resident("downtown_bookworm", "Downtown"),
    kind: "community",
    caption: "Shoutout to whoever keeps the Kerouac Park benches clean. Best quiet lunch spot downtown.",
    location: "Kerouac Park",
    coords: { lat: 42.6470, lng: -71.3083 },
    postedHoursAgo: 26,
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/49/Sign_in_Kerouac_Park_-_Lowell_-_MA_-_USA_%2852482880919%29.jpg/960px-Sign_in_Kerouac_Park_-_Lowell_-_MA_-_USA_%2852482880919%29.jpg",
      alt: "Sign in Kerouac Park, Lowell",
      credit: "Adam Jones",
      license: "CC BY 2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Sign_in_Kerouac_Park_-_Lowell_-_MA_-_USA_(52482880919).jpg",
    },
    reactions: 17,
  },
  {
    id: 10,
    author: CITY_HALL,
    kind: "event",
    title: "Halloween on Merrimack St",
    caption:
      "Trick-or-treat with downtown businesses. Merrimack St is closed to cars from Central St to Kirk St during the event.",
    location: "Merrimack St",
    coords: { lat: 42.6450, lng: -71.3095 },
    postedHoursAgo: 28,
    when: "Sat, Oct 31 · 2pm – 5pm",
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Merrimack_Street%2C_Lowell_MA.jpg/960px-Merrimack_Street%2C_Lowell_MA.jpg",
      alt: "Storefronts along Merrimack Street in downtown Lowell",
      credit: "John Phelan",
      license: "CC BY 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Merrimack_Street,_Lowell_MA.jpg",
    },
    reactions: 46,
  },
  {
    id: 11,
    author: resident("belvidere_local", "Belvidere"),
    kind: "community",
    caption: "Pickup soccer at Shedd Park. All ages and skill levels, and I keep extra cleats in my trunk.",
    location: "Shedd Park",
    coords: { lat: 42.6338, lng: -71.2935 },
    postedHoursAgo: 30,
    when: "Sundays · 10am",
    reactions: 11,
  },
  {
    id: 12,
    author: resident("bridge_st_walker", "Centralville"),
    kind: "community",
    caption: "Sunset over the Merrimack from the Bridge St bridge tonight. Never gets old.",
    location: "Merrimack River",
    coords: { lat: 42.6510, lng: -71.3060 },
    postedHoursAgo: 33,
    image: {
      src: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4c/Lowell_merrimack_river_sunset.JPG/960px-Lowell_merrimack_river_sunset.JPG",
      alt: "Sunset over the Merrimack River in Lowell",
      credit: "Curran Kelleher",
      license: "Public domain",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Lowell_merrimack_river_sunset.JPG",
    },
    reactions: 38,
  },
  {
    id: 13,
    author: resident("mill_history_fan", "Lower Highlands"),
    kind: "community",
    caption: "Took the kids to the Boott Cotton Mills Museum. Hearing the weave room looms running is something else.",
    location: "Boott Mills",
    coords: { lat: 42.6475, lng: -71.3135 },
    postedHoursAgo: 48,
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Front_of_boott_mill.jpg",
      alt: "Front of the Boott Cotton Mills museum with a trolley out front",
      credit: "Jlpapple",
      license: "CC BY 3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Front_of_boott_mill.jpg",
    },
    reactions: 15,
  },
];

/** Seed posts with timestamps relative to `now`, newest first. */
export function seedPosts(now: number): CityPost[] {
  return SEED_POSTS.map(({ postedHoursAgo, ...post }) => ({
    ...post,
    postedAt: new Date(now - postedHoursAgo * 3_600_000).toISOString(),
    hasReacted: false,
  })).sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

/** Deterministic posts for SSR / before the first fetch. */
export function fallbackPosts(): CityPost[] {
  return seedPosts(SEED_BASE_TIME);
}

export const issueMarkerId = (id: number) => `issue-${id}`;
export const postMarkerId = (id: number) => `post-${id}`;
export const bountyMarkerId = (id: number) => `bounty-${id}`;

/**
 * Flatten reports, located posts and bounties into the marker list the map
 * renders. Bounties get a pin when they have a location and aren't paid yet.
 */
export function buildMarkers(
  reports: CityReport[],
  posts: CityPost[],
  bounties: Bounty[] = [],
): CityMarker[] {
  const markers: CityMarker[] = [
    ...reports.map((report) => ({
      id: issueMarkerId(report.id),
      kind: "issue" as const,
      lat: report.lat,
      lng: report.lng,
      report,
    })),
    // Citywide posts have no coords, so they stay in the feed only.
    ...posts.flatMap((post) =>
      post.coords
        ? [{ id: postMarkerId(post.id), kind: "post" as const, ...post.coords, post }]
        : [],
    ),
  ];

  for (const bounty of bounties) {
    if (bounty.status === "paid" || bounty.lat === null || bounty.lng === null) continue;
    markers.push({
      id: bountyMarkerId(bounty.id),
      kind: "bounty",
      lat: bounty.lat,
      lng: bounty.lng,
      bounty,
    });
  }
  return markers;
}
