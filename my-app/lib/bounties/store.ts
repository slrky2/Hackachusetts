/**
 * Bounty store: the rules for small paid jobs that move one way through
 *
 *   open → claimed → done → paid
 *
 * Bounties are household chores and favors between neighbors (mow a lawn,
 * rake leaves, carry a couch), plus light community work the city posts
 * (park cleanup). Repairs that need city equipment, like potholes or
 * streetlights, stay city tickets for city crews and can't be posted here.
 *
 * | Step    | Who                              | Checks                                  |
 * |---------|----------------------------------|-----------------------------------------|
 * | post    | any signed-in user, or the city  | title and place set; not a city repair; |
 * |         |                                  | $0 < reward ≤ $1,000; funds             |
 * | claim   | anyone except the poster         | still open; you didn't post it          |
 * | done    | only the claimer                 | claimed, and by you                     |
 * | approve | only the poster (city: staff)    | you posted it; it is marked done        |
 *
 * Every step is checked here against the signed-in Clerk user (`Actor`),
 * never against names sent by the browser. Each function runs synchronously
 * from check to write, so two requests can't both claim the same job.
 *
 * Money is simulated and kept in whole cents. A neighbor's reward is held
 * (taken from their wallet) when they post and paid to the worker on
 * approval. The city has no wallet and never runs out.
 *
 * POC only: in-memory, resets on server restart. Swap for a real DB behind
 * the same exported functions.
 */

import { randomBytes, randomUUID } from "node:crypto";
import type { Bounty, BountyAction, BountyStatus, BountyViewer, PosterProfile } from "@/types";
import type { StoredImage } from "./image";

/** The signed-in user, resolved on the server from the Clerk session. */
export interface Actor {
  id: string;
  name: string;
  isCityStaff: boolean;
}

/** Poster id used for city jobs. Can't collide with Clerk ids ("user_..."). */
const CITY_ID = "city";
const CITY_NAME = "City of Lowell";
const MAX_REWARD_CENTS = 100_000; // $1,000
/** Simulated money every new account starts with, so anyone can try posting. */
const STARTING_WALLET_CENTS = 3_500; // $35

/**
 * Work that needs city equipment or is unsafe for a neighbor: roads, lights,
 * signs, sewers, utilities. A keyword check on the title and details; it
 * catches the obvious cases, not every phrasing.
 */
const CITY_REPAIR_PATTERN =
  /\b(pot ?holes?|asphalt|manholes?|sewers?|storm drains?|water mains?|(fire )?hydrants?|street ?lights?|traffic (lights?|signals?)|stop signs?|crosswalks?|power lines?|(downed|live) wires?|utility poles?|gas leaks?)\b/i;

/** A rule violation, carrying the HTTP status the route should return. */
export class BountyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "BountyError";
    this.status = status;
  }
}

interface BountyRow {
  id: number;
  title: string;
  details: string;
  rewardCents: number;
  posterId: string;
  posterName: string;
  claimerId: string | null;
  claimerName: string | null;
  lat: number | null;
  lng: number | null;
  place: string;
  imageId: string | null;
  status: BountyStatus;
  createdAt: string;
}

interface Person {
  /** Internal id: Clerk user id, "city", or "seed:<name>". Never sent to the client. */
  internalId: string;
  name: string;
}

interface Store {
  bounties: Map<number, BountyRow>;
  wallets: Map<string, number>; // Clerk user id → cents
  images: Map<string, StoredImage>; // random image id → photo
  /** Public profile id → person, and the reverse lookup. */
  people: Map<string, Person>;
  publicIds: Map<string, string>;
  lastId: number;
}

// Kept on globalThis so dev hot-reloads don't wipe the data. Bump the key
// when the Store shape changes, so a running dev server starts fresh
// instead of reading an old object.
const STORE_KEY = "__cityLandBounties_v3";
const globalForStore = globalThis as typeof globalThis & { [STORE_KEY]?: Store };

function getStore(): Store {
  globalForStore[STORE_KEY] ??= createStore();
  return globalForStore[STORE_KEY];
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

// Fixed base time keeps seed timestamps stable (matches lib/db/seed.ts).
const SEED_BASE_TIME = Date.parse("2026-10-24T08:00:00-04:00");
const hoursAgo = (hours: number) => new Date(SEED_BASE_TIME - hours * 3_600_000).toISOString();

interface SeedJob {
  title: string;
  details: string;
  dollars: number;
  /** Demo neighbor's name, or null for a city job. */
  poster: string | null;
  place: string;
  at: { lat: number; lng: number } | null;
  hoursAgo: number;
  /** Optional starting state, to show every stage on the board. */
  takenBy?: { name: string; status: "claimed" | "done" };
}

// Household chores and favors around Lowell, plus one light city job.
// Demo neighbors aren't real accounts and never had money held, since the
// seed skips the posting rules.
const SEED_JOBS: SeedJob[] = [
  {
    title: "Mow my front and back lawn",
    details: "Mower and gas can are in the shed. About an hour.",
    dollars: 30,
    poster: "Maria",
    place: "Westford St",
    at: { lat: 42.6402, lng: -71.329 },
    hoursAgo: 2,
  },
  {
    title: "Rake leaves and bag them",
    details: "Corner lot with two big maples. Bags and rakes provided.",
    dollars: 25,
    poster: "Tom",
    place: "Belvidere",
    at: { lat: 42.6365, lng: -71.2985 },
    hoursAgo: 4,
  },
  {
    title: "Help carry a couch to the curb",
    details: "Second floor, no elevator. About 20 minutes with two people.",
    dollars: 25,
    poster: "Luis",
    place: "Lawrence St",
    at: { lat: 42.6418, lng: -71.317 },
    hoursAgo: 6,
  },
  {
    title: "Clean out the gutters on a one-story house",
    details: "Ladder is in the garage. Bring gloves.",
    dollars: 40,
    poster: "Ray",
    place: "Centralville",
    at: { lat: 42.652, lng: -71.303 },
    hoursAgo: 9,
  },
  {
    title: "Pick up groceries for me this week",
    details: "I'm recovering from knee surgery. List and cash ready, Market Basket on Chelmsford St.",
    dollars: 15,
    poster: "Edna",
    place: "Back Central",
    at: { lat: 42.634, lng: -71.3045 },
    hoursAgo: 11,
  },
  {
    title: "Help clean up Shedd Park after the fall festival",
    details: "Trash bags and grabbers provided at the pavilion. About 2 hours.",
    dollars: 40,
    poster: null,
    place: "Shedd Park",
    at: { lat: 42.6338, lng: -71.2935 },
    hoursAgo: 14,
  },
  {
    title: "Walk my dog Mon to Fri",
    details: "Friendly golden retriever, 30-minute walk each afternoon.",
    dollars: 75,
    poster: "June",
    place: "Highlands",
    at: null,
    hoursAgo: 20,
    takenBy: { name: "Sam", status: "claimed" },
  },
  {
    title: "Put together a flat-pack bookshelf",
    details: "All parts and the instructions are here. I just don't have the patience.",
    dollars: 35,
    poster: "Priya",
    place: "The Acre",
    at: { lat: 42.647, lng: -71.3205 },
    hoursAgo: 26,
    takenBy: { name: "Kim", status: "done" },
  },
];

function createStore(): Store {
  const store: Store = {
    bounties: new Map(),
    wallets: new Map(),
    images: new Map(),
    people: new Map(),
    publicIds: new Map(),
    lastId: 100, // first id is 101
  };

  for (const job of SEED_JOBS) {
    const posterId = job.poster ? `seed:${job.poster.toLowerCase()}` : CITY_ID;
    const posterName = job.poster ?? CITY_NAME;
    remember(store, posterId, posterName);
    const row = insert(store, {
      title: job.title,
      details: job.details,
      rewardCents: job.dollars * 100,
      posterId,
      posterName,
      lat: job.at?.lat ?? null,
      lng: job.at?.lng ?? null,
      place: job.place,
      imageId: null,
      createdAt: hoursAgo(job.hoursAgo),
    });
    if (job.takenBy) {
      row.status = job.takenBy.status;
      row.claimerId = `seed:${job.takenBy.name.toLowerCase()}`;
      row.claimerName = job.takenBy.name;
      remember(store, row.claimerId, row.claimerName);
    }
  }
  return store;
}

// ─── People ───────────────────────────────────────────────────────────────────

/**
 * Record someone's current name and return their public profile id. Real
 * users get a random id, so Clerk user ids never reach the browser; demo
 * neighbors and the city get readable ones ("tom", "city").
 */
function remember(store: Store, internalId: string, name: string): string {
  let publicId = store.publicIds.get(internalId);
  if (!publicId) {
    if (internalId === CITY_ID) publicId = "city";
    else if (internalId.startsWith("seed:")) publicId = internalId.slice("seed:".length);
    else publicId = `u-${randomBytes(6).toString("hex")}`;
    store.publicIds.set(internalId, publicId);
  }
  store.people.set(publicId, { internalId, name });
  return publicId;
}

function publicIdOf(store: Store, internalId: string): string {
  return store.publicIds.get(internalId) ?? remember(store, internalId, "Neighbor");
}

type NewRow = Omit<BountyRow, "id" | "status" | "claimerId" | "claimerName">;

/** Store a new open bounty. No rules or money here; `postBounty` owns those. */
function insert(store: Store, row: NewRow): BountyRow {
  store.lastId += 1;
  const created: BountyRow = { ...row, id: store.lastId, status: "open", claimerId: null, claimerName: null };
  store.bounties.set(created.id, created);
  return created;
}

// ─── Wallets ──────────────────────────────────────────────────────────────────

function walletCents(store: Store, userId: string): number {
  let cents = store.wallets.get(userId);
  if (cents === undefined) {
    cents = STARTING_WALLET_CENTS;
    store.wallets.set(userId, cents);
  }
  return cents;
}

/** Add (or, if negative, take out) cents. The city has no wallet. */
function pay(store: Store, userId: string, cents: number): void {
  if (userId === CITY_ID) return;
  store.wallets.set(userId, walletCents(store, userId) + cents);
}

// ─── Rules ────────────────────────────────────────────────────────────────────

/** Whether the actor stands in for the poster: they posted it, or it's a city job and they're staff. */
function isPosterSide(row: BountyRow, actor: Actor): boolean {
  return row.posterId === actor.id || (row.posterId === CITY_ID && actor.isCityStaff);
}

/**
 * The single source of truth for who may take which step. Returns the error
 * to raise, or null if the step is allowed. The UI's buttons come from this
 * too (via `viewerCan`), so they can't drift from what the server enforces.
 */
function checkStep(row: BountyRow, actor: Actor, step: BountyAction): BountyError | null {
  const cityJob = row.posterId === CITY_ID;
  switch (step) {
    case "claim":
      if (row.status === "done" || row.status === "paid") {
        return new BountyError(409, "This job is already finished.");
      }
      if (row.status !== "open") return new BountyError(409, "Someone already claimed this job.");
      if (isPosterSide(row, actor)) {
        return new BountyError(
          409,
          cityJob ? "City staff can't claim city jobs." : "You can't claim your own bounty.",
        );
      }
      return null;
    case "done":
      if (row.status !== "claimed" || row.claimerId !== actor.id) {
        return new BountyError(409, "Only the person who claimed this job can mark it done.");
      }
      return null;
    case "approve":
      if (!isPosterSide(row, actor)) {
        return new BountyError(
          403,
          cityJob ? "Only city staff can approve city jobs." : "Only the poster can approve the payout.",
        );
      }
      if (row.status !== "done") return new BountyError(409, "The job isn't marked done yet.");
      return null;
  }
}

const STEPS: BountyAction[] = ["claim", "done", "approve"];

/** Shape a row for one viewer. Never exposes user ids. */
function toBounty(row: BountyRow, actor: Actor | null): Bounty {
  let mine: Bounty["mine"] = null;
  if (actor && isPosterSide(row, actor)) mine = "posted";
  else if (actor && row.claimerId === actor.id) mine = "claimed";

  return {
    id: row.id,
    title: row.title,
    details: row.details,
    reward: row.rewardCents / 100,
    posterName: row.posterName,
    posterProfileId: publicIdOf(getStore(), row.posterId),
    imageUrl: row.imageId ? `/api/bounty-images/${row.imageId}` : null,
    postedByCity: row.posterId === CITY_ID,
    claimerName: actor && row.claimerId === actor.id ? "you" : row.claimerName,
    lat: row.lat,
    lng: row.lng,
    place: row.place,
    status: row.status,
    createdAt: row.createdAt,
    mine,
    viewerCan: actor ? (STEPS.find((step) => checkStep(row, actor, step) === null) ?? null) : null,
  };
}

function getRow(store: Store, id: number): BountyRow {
  const row = store.bounties.get(id);
  if (!row) throw new BountyError(404, "That bounty doesn't exist.");
  return row;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/** All bounties, newest first, shaped for the viewer (null when signed out). */
export function listBounties(actor: Actor | null): Bounty[] {
  return [...getStore().bounties.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map((row) => toBounty(row, actor));
}

export function getViewer(actor: Actor): BountyViewer {
  return {
    name: actor.name,
    isCityStaff: actor.isCityStaff,
    wallet: walletCents(getStore(), actor.id) / 100,
  };
}

/** Public profile for a poster, or null if no one has that profile id. */
export function getProfile(publicId: string): PosterProfile | null {
  const store = getStore();
  const person = store.people.get(publicId);
  if (!person) return null;
  const rows = [...store.bounties.values()];
  return {
    id: publicId,
    name: person.name,
    isCity: person.internalId === CITY_ID,
    jobsPosted: rows.filter((r) => r.posterId === person.internalId).length,
    jobsCompleted: rows.filter((r) => r.claimerId === person.internalId && r.status === "paid").length,
  };
}

/** A job photo by its random id, or null. */
export function getImage(imageId: string): StoredImage | null {
  return getStore().images.get(imageId) ?? null;
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export interface PostBountyInput {
  title: string;
  details: string;
  /** Dollars. */
  reward: number;
  place: string;
  lat: number | null;
  lng: number | null;
  /** Already-validated photo (see ./image.ts), or null. */
  image: StoredImage | null;
  /** Post as the city (staff only): paid by the city, approved by staff. */
  asCity: boolean;
}

/** Post a job. It starts `open`; a neighbor's reward is held from their wallet. */
export function postBounty(actor: Actor, input: PostBountyInput): Bounty {
  const store = getStore();

  if (input.asCity && !actor.isCityStaff) {
    throw new BountyError(403, "Only city staff can post city bounties.");
  }
  const title = input.title.trim();
  if (!title) throw new BountyError(422, "Give the job a title.");
  const details = input.details.trim();
  if (CITY_REPAIR_PATTERN.test(`${title} ${details}`)) {
    throw new BountyError(
      422,
      "That sounds like a city repair, not a bounty. City crews handle roads, streetlights, signs and utilities.",
    );
  }
  const place = input.place.trim();
  if (!place) throw new BountyError(422, "Say where the job is, like a street or neighborhood.");
  const rewardCents = Math.round(input.reward * 100);
  if (!(rewardCents > 0)) throw new BountyError(422, "The reward must be more than $0.");
  if (rewardCents > MAX_REWARD_CENTS) throw new BountyError(422, "The reward can be at most $1,000.");

  const posterId = input.asCity ? CITY_ID : actor.id;
  const posterName = input.asCity ? CITY_NAME : actor.name;
  // Every check runs before money moves, so a rejected post holds nothing.
  if (posterId !== CITY_ID && walletCents(store, posterId) < rewardCents) {
    throw new BountyError(422, "Not enough in your wallet to fund this bounty.");
  }
  pay(store, posterId, -rewardCents);

  let imageId: string | null = null;
  if (input.image) {
    imageId = randomUUID();
    store.images.set(imageId, input.image);
  }
  remember(store, posterId, posterName);
  const row = insert(store, {
    title,
    details,
    rewardCents,
    posterId,
    posterName,
    lat: input.lat,
    lng: input.lng,
    place,
    imageId,
    createdAt: new Date().toISOString(),
  });
  return toBounty(row, actor);
}

/** Take a step on a bounty, after checking the actor is allowed to. */
export function takeStep(actor: Actor, id: number, step: BountyAction): Bounty {
  const store = getStore();
  const row = getRow(store, id);
  const error = checkStep(row, actor, step);
  if (error) throw error;

  switch (step) {
    case "claim":
      row.status = "claimed";
      row.claimerId = actor.id;
      row.claimerName = actor.name;
      remember(store, actor.id, actor.name);
      break;
    case "done":
      row.status = "done";
      break;
    case "approve":
      row.status = "paid";
      if (row.claimerId) pay(store, row.claimerId, row.rewardCents);
      break;
  }
  return toBounty(row, actor);
}
