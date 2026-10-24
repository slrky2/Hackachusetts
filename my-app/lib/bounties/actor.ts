import { auth, currentUser } from "@clerk/nextjs/server";
import type { Actor } from "./store";

/**
 * Resolves who is making a bounty request from the Clerk session cookie.
 * The browser never gets to say who it is.
 *
 * City staff are the signed-in users whose verified email is listed in
 * CITY_STAFF_EMAILS (comma-separated). They act for the city: they approve
 * and can post city jobs.
 */

const PROFILE_TTL_MS = 5 * 60_000;

// currentUser() calls Clerk's Backend API (rate limited), and the bounty board
// polls, so keep each user's name/role for a few minutes.
const globalForProfiles = globalThis as typeof globalThis & {
  __cityLandProfiles?: Map<string, { profile: Omit<Actor, "id">; expires: number }>;
};
const profiles = (globalForProfiles.__cityLandProfiles ??= new Map());

function cityStaffEmails(): Set<string> {
  return new Set(
    (process.env.CITY_STAFF_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** The signed-in user, or null when signed out. */
export async function getActor(): Promise<Actor | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const cached = profiles.get(userId);
  if (cached && cached.expires > Date.now()) return { id: userId, ...cached.profile };

  const user = await currentUser();
  if (!user) return null;

  // Show first name + last initial ("Maria G."), falling back to the username
  // or the part of the email before the @.
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const name =
    [user.firstName, user.lastName ? `${user.lastName[0]}.` : null].filter(Boolean).join(" ") ||
    user.username ||
    email.split("@")[0] ||
    "Neighbor";

  const staff = cityStaffEmails();
  const isCityStaff = user.emailAddresses.some(
    (e) => e.verification?.status === "verified" && staff.has(e.emailAddress.toLowerCase()),
  );

  const profile = { name, isCityStaff };
  profiles.set(userId, { profile, expires: Date.now() + PROFILE_TTL_MS });
  return { id: userId, ...profile };
}
