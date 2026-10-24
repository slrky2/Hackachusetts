"use client";

import { useAuth } from "@clerk/nextjs";
import useSWR from "swr";
import { api } from "@/lib/api/client";
import type { BountiesResponse, Bounty, BountyAction } from "@/types";
import type { CreateBountyInput } from "@/lib/validators/bounty";

type PostInput = Partial<Omit<CreateBountyInput, "title" | "reward">> &
  Pick<CreateBountyInput, "title" | "reward">;

const fetchBounties = ([url]: [string, string | null]) => api.get<BountiesResponse>(url);

/**
 * Bounties plus the signed-in viewer (wallet, role). Polls so a claim on one
 * screen shows up on another. Keyed on the Clerk user id so signing in or out
 * refetches immediately instead of showing the previous user's buttons.
 */
export function useBounties() {
  const { isLoaded, userId } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    isLoaded ? (["/api/bounties", userId ?? null] as [string, string | null]) : null,
    fetchBounties,
    { refreshInterval: 5_000 },
  );

  /** Claim, mark done, or approve. Throws with the server's message on failure. */
  async function takeStep(bounty: Bounty, step: BountyAction) {
    await api.post<{ bounty: Bounty }>(`/api/bounties/${bounty.id}/${step}`, {});
    await mutate();
  }

  /** Post a job. Throws with the server's message on failure. */
  async function postBounty(input: PostInput) {
    const { bounty } = await api.post<{ bounty: Bounty }>("/api/bounties", input);
    await mutate();
    return bounty;
  }

  return {
    bounties: data?.bounties ?? [],
    viewer: data?.viewer ?? null,
    isLoading: !isLoaded || isLoading,
    error,
    takeStep,
    postBounty,
  };
}
