"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import BountyCard from "@/components/bounties/BountyCard";
import PostBountyForm, { type PostBountyValues } from "@/components/bounties/PostBountyForm";
import { useBounties } from "@/lib/hooks/useBounties";
import { formatDollars } from "@/lib/utils";
import type { Bounty, BountyAction } from "@/types";

type Filter = "open" | "mine" | "paid";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "open", label: "Open jobs" },
  { key: "mine", label: "My jobs" },
  { key: "paid", label: "Paid out" },
];

const STEP_TOAST: Record<BountyAction, string> = {
  claim: "Job claimed. It's in My jobs.",
  done: "Marked done. Waiting for the poster to approve.",
  approve: "Paid out.",
};

const SIGN_IN_HREF = `/sign-in?redirect_url=${encodeURIComponent("/bounties")}`;

/** Bounty board: small paid jobs that move open → claimed → done → paid. */
export default function BountiesPage() {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* useSearchParams (?job=) must be suspended under Cache Components. */}
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading jobs…</p>}>
          <BountyBoard />
        </Suspense>
      </div>
    </div>
  );
}

function BountyBoard() {
  const { bounties, viewer, isLoading, error, takeStep, postBounty } = useBounties();
  const focusId = Number(useSearchParams().get("job")) || null;
  const [filter, setFilter] = useState<Filter>("open");
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(text: string, ok: boolean) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ text, ok });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  // A job opened from the map (?job=101) is pinned above the list.
  const focused = focusId ? bounties.find((b) => b.id === focusId) : undefined;
  const listed = useMemo(
    () =>
      bounties.filter((b) => {
        if (b.id === focused?.id) return false;
        if (filter === "open") return b.status === "open";
        if (filter === "paid") return b.status === "paid";
        return b.mine !== null; // you posted it or you claimed it, any status
      }),
    [bounties, filter, focused?.id],
  );
  const waitingOnYou = bounties.filter((b) => b.viewerCan === "approve").length;

  async function handleStep(bounty: Bounty, step: BountyAction) {
    setBusyId(bounty.id);
    try {
      await takeStep(bounty, step);
      flash(STEP_TOAST[step], true);
    } catch (err) {
      // The page hides steps you can't take, but the server re-checks; a
      // stale screen just gets the server's reason.
      flash(err instanceof Error ? err.message : "Something went wrong.", false);
    } finally {
      setBusyId(null);
    }
  }

  async function handlePost(values: PostBountyValues) {
    await postBounty(values);
    setShowForm(false);
    setFilter("mine");
    flash("Job posted. It's in My jobs.", true);
  }

  const card = (b: Bounty, highlighted = false) => (
    <BountyCard
      key={b.id}
      bounty={b}
      signedIn={viewer !== null}
      onStep={handleStep}
      busy={busyId === b.id}
      highlighted={highlighted}
    />
  );

  return (
    <>
      <h1 className="text-2xl font-bold">Bounties</h1>

      {/* Wallet / sign-in card */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
        {viewer ? (
          <>
            <div>
              <p className="text-xs text-zinc-500">
                {viewer.name}
                {viewer.isCityStaff && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    City staff
                  </span>
                )}
              </p>
              <p className="text-xl font-bold">
                {formatDollars(viewer.wallet)} <span className="text-sm font-medium text-zinc-500">in your wallet</span>
              </p>
              {waitingOnYou > 0 && (
                <p className="mt-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {waitingOnYou} {waitingOnYou === 1 ? "job is" : "jobs are"} waiting for your approval
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            >
              + Post a job
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {isLoading ? "Loading…" : "Sign in to claim jobs and post your own."}
            </p>
            {!isLoading && (
              <Link
                href={SIGN_IN_HREF}
                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                Sign in
              </Link>
            )}
          </>
        )}
      </section>

      {focused && (
        <section aria-label="Selected job" className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>From the map</span>
            <Link href="/bounties" className="hover:text-emerald-600 hover:underline">
              Clear
            </Link>
          </div>
          {card(focused, true)}
        </section>
      )}

      <div role="group" aria-label="Filter jobs" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f.key
                ? "bg-emerald-600 text-white"
                : "bg-black/5 text-zinc-600 hover:bg-black/10 dark:bg-white/10 dark:text-zinc-300 dark:hover:bg-white/15"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-400">
          Can&apos;t reach the server right now. Showing the last known jobs.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-zinc-500">Loading jobs…</p>
      ) : listed.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          {filter === "mine" && !viewer ? "Sign in to see your jobs." : "No jobs here right now."}
        </p>
      ) : (
        <div className="space-y-3">{listed.map((b) => card(b))}</div>
      )}

      <p className="pt-2 text-xs text-zinc-500">
        Bounties are household chores and favors between neighbors, like mowing a lawn or carrying a couch, plus light
        community work the city posts. Repairs to roads, streetlights, signs and utilities need city equipment, so they
        stay with city crews. Jobs move open → claimed → done → paid. A neighbor&apos;s reward is held from their
        wallet when they post and paid to the worker when they approve. Payments are simulated.
      </p>

      {showForm && viewer && (
        <PostBountyForm
          wallet={viewer.wallet}
          isCityStaff={viewer.isCityStaff}
          onClose={() => setShowForm(false)}
          onSubmit={handlePost}
        />
      )}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        {toast && (
          <p
            className={`rounded-lg px-4 py-2 text-sm text-white shadow-lg ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}
          >
            {toast.text}
          </p>
        )}
      </div>
    </>
  );
}
