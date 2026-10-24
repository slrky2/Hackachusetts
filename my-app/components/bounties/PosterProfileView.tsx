"use client";

import Link from "next/link";
import useSWR from "swr";
import BountyCard from "@/components/bounties/BountyCard";
import { api } from "@/lib/api/client";
import { useBounties } from "@/lib/hooks/useBounties";
import type { PosterProfile } from "@/types";

const fetchProfile = (url: string) => api.get<{ profile: PosterProfile }>(url).then((r) => r.profile);

/** A poster's public page: who they are and the jobs they've posted. */
export default function PosterProfileView({ profileId }: { profileId: string }) {
  const { data: profile, error, isLoading } = useSWR(
    `/api/profiles/${encodeURIComponent(profileId)}`,
    fetchProfile,
    { refreshInterval: 15_000 },
  );
  const { bounties, viewer } = useBounties();
  const theirs = bounties.filter((b) => b.posterProfileId === profileId);
  const active = theirs.filter((b) => b.status !== "paid");
  const past = theirs.filter((b) => b.status === "paid");

  if (isLoading) return <p className="text-sm text-zinc-500">Loading profile…</p>;
  if (error || !profile) {
    return (
      <div className="space-y-2 py-8 text-center">
        <p className="text-sm text-zinc-500">We couldn&apos;t find that person.</p>
        <Link href="/bounties" className="text-sm font-semibold text-emerald-700 hover:underline">
          Back to bounties
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/bounties" className="text-xs text-zinc-500 hover:text-emerald-600 hover:underline">
        ← Bounties
      </Link>

      <section className="flex items-center gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <span
          aria-hidden="true"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-xl font-bold text-white"
        >
          {profile.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">
            {profile.name}
            {profile.isCity && (
              <span className="ml-2 text-base text-emerald-600" title="Verified city account">
                ✓
              </span>
            )}
          </h1>
          <p className="text-xs text-zinc-500">{profile.isCity ? "Verified city account" : "Neighbor"}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {profile.jobsPosted} {profile.jobsPosted === 1 ? "job" : "jobs"} posted · {profile.jobsCompleted}{" "}
            {profile.jobsCompleted === 1 ? "job" : "jobs"} completed
          </p>
        </div>
      </section>

      <section aria-labelledby="active-jobs" className="space-y-3">
        <h2 id="active-jobs" className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
          Current jobs
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-zinc-500">No current jobs.</p>
        ) : (
          active.map((b) => <BountyCard key={b.id} bounty={b} signedIn={viewer !== null} />)
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-jobs" className="space-y-3">
          <h2 id="past-jobs" className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
            Paid out
          </h2>
          {past.map((b) => (
            <BountyCard key={b.id} bounty={b} signedIn={viewer !== null} />
          ))}
        </section>
      )}
    </>
  );
}
