"use client";

// import useSWR from "swr";
// import { api } from "@/lib/api/client";
// import type { Bounty } from "@/types";

export function useBounties() {
  // const { data, error, isLoading, mutate } = useSWR<Bounty[]>("/api/bounties", api.get);
  // return { bounties: data, error, isLoading, mutate };
  return { bounties: [], error: null, isLoading: false, mutate: () => {} };
}
