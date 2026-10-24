"use client";

// import useSWR from "swr";
// import { api } from "@/lib/api/client";
// import type { User } from "@/types";

export function useAuth() {
  // const { data: user, error, isLoading, mutate } = useSWR<User>("/api/auth/session", api.get);
  // return { user, isAuthenticated: !!user, error, isLoading, mutate };
  return { user: null, isAuthenticated: false, error: null, isLoading: false, mutate: () => {} };
}
