"use client";

/**
 * Hook for fetching and mutating civic issues.
 * Uses SWR for data fetching with automatic revalidation.
 * TODO: install swr — `npm install swr`
 */

// import useSWR from "swr";
// import { api } from "@/lib/api/client";
// import type { Issue } from "@/types";

export function useIssues() {
  // const { data, error, isLoading, mutate } = useSWR<Issue[]>("/api/issues", api.get);
  // return { issues: data, error, isLoading, mutate };

  // Placeholder until SWR is installed
  return { issues: [], error: null, isLoading: false, mutate: () => {} };
}
