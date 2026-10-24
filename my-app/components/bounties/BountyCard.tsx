"use client";

import Image from "next/image";
import Link from "next/link";
import { directionsUrl } from "@/lib/maps";
import { formatDollars, timeAgo } from "@/lib/utils";
import type { Bounty, BountyAction } from "@/types";

interface Props {
  bounty: Bounty;
  /** Whether someone is signed in; signed-out viewers get a sign-in link. */
  signedIn: boolean;
  /** Take a step. Without it (e.g. on a profile page) the card links to the job instead. */
  onStep?: (bounty: Bounty, step: BountyAction) => void;
  busy?: boolean;
  highlighted?: boolean;
}

const STEP_LABEL: Record<BountyAction, (b: Bounty) => string> = {
  claim: () => "Claim job",
  done: () => "Mark done",
  approve: (b) => `Approve & pay ${formatDollars(b.reward)}`,
};

function statusPill(b: Bounty): { text: string; className: string } {
  switch (b.status) {
    case "open":
      return { text: "Open", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" };
    case "claimed":
      return {
        text: `Claimed by ${b.claimerName ?? "someone"}`,
        className: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
      };
    case "done":
      return {
        text: "Done · waiting for approval",
        className: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
      };
    case "paid":
      return { text: "Paid", className: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" };
  }
}

const LINK = "font-medium text-zinc-600 underline-offset-2 hover:text-emerald-600 hover:underline dark:text-zinc-300";

/** One job. Shows at most one action: the step the server says you can take. */
export default function BountyCard({ bounty, signedIn, onStep, busy, highlighted }: Props) {
  const pill = statusPill(bounty);
  const step = onStep ? bounty.viewerCan : null;
  const coords = bounty.lat !== null && bounty.lng !== null ? { lat: bounty.lat, lng: bounty.lng } : null;
  const posterLabel = bounty.mine === "posted" && !bounty.postedByCity ? "you" : bounty.posterName;

  return (
    <article
      id={`bounty-${bounty.id}`}
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-900 ${
        highlighted ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-black/5 dark:border-white/10"
      }`}
    >
      {bounty.imageUrl && (
        <div className="relative aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-800">
          {/* Already resized on upload and served from our own API, so skip optimization. */}
          <Image
            src={bounty.imageUrl}
            alt={`Photo for "${bounty.title}"`}
            fill
            unoptimized
            sizes="(min-width: 672px) 672px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug">{bounty.title}</h3>
          <span className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
            {formatDollars(bounty.reward)}
          </span>
        </div>

        {bounty.details && <p className="text-sm text-zinc-600 dark:text-zinc-400">{bounty.details}</p>}

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
          <span>
            Posted by{" "}
            <Link href={`/profile/${bounty.posterProfileId}`} className={LINK}>
              {posterLabel}
            </Link>
            {bounty.postedByCity && (
              <span className="ml-1 font-semibold text-emerald-600" title="Verified city account">
                ✓
              </span>
            )}
          </span>
          {bounty.place && (
            <>
              <span aria-hidden="true">•</span>
              <a
                href={directionsUrl(coords, bounty.place)}
                target="_blank"
                rel="noopener noreferrer"
                className={LINK}
                aria-label={`Directions to ${bounty.place} (opens Google Maps in a new tab)`}
                title="Get directions"
              >
                📍 {bounty.place}
              </a>
            </>
          )}
          <span aria-hidden="true">•</span>
          <span>{timeAgo(bounty.createdAt)}</span>
        </p>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${pill.className}`}>{pill.text}</span>

          {step ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => onStep?.(bounty, step)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Working…" : STEP_LABEL[step](bounty)}
            </button>
          ) : !onStep && bounty.status !== "paid" ? (
            <Link
              href={`/bounties?job=${bounty.id}`}
              className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              View job →
            </Link>
          ) : (
            !signedIn &&
            bounty.status === "open" && (
              <Link
                href={`/sign-in?redirect_url=${encodeURIComponent("/bounties")}`}
                className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Sign in to claim
              </Link>
            )
          )}
        </div>
      </div>
    </article>
  );
}
