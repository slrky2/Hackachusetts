"use client";

import useSWR from "swr";
import { api } from "@/lib/api/client";
import { fallbackPosts } from "@/lib/db/seed";
import type { CityPost } from "@/types";
import { useViewerId } from "./useIssues";

// Shown during SSR / before the first fetch so the feed never renders empty.
const FALLBACK_POSTS = fallbackPosts();

const fetchPosts = (url: string) => api.get<{ posts: CityPost[] }>(url).then((res) => res.posts);

const replacePost = (posts: CityPost[], updated: CityPost) =>
  posts.map((p) => (p.id === updated.id ? updated : p));

export function usePosts() {
  const viewerId = useViewerId();
  const key = viewerId ? `/api/posts?viewerId=${encodeURIComponent(viewerId)}` : null;

  const { data, error, mutate } = useSWR(key, fetchPosts, { refreshInterval: 15_000 });
  const posts = data ?? FALLBACK_POSTS;

  /** Optimistically toggle "Thanks" / "Going"; rolls back if the request fails. */
  async function toggleReaction(postId: number) {
    if (!viewerId) return;
    await mutate(
      async (current) => {
        const { post } = await api.post<{ post: CityPost }>(`/api/posts/${postId}/react`, { viewerId });
        return replacePost(current ?? FALLBACK_POSTS, post);
      },
      {
        optimisticData: (current) =>
          (current ?? FALLBACK_POSTS).map((p) =>
            p.id === postId
              ? { ...p, hasReacted: !p.hasReacted, reactions: p.reactions + (p.hasReacted ? -1 : 1) }
              : p,
          ),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  }

  // Timestamps in the fallback are placeholders; only trust them once live.
  return { posts, error, isLive: data !== undefined, toggleReaction };
}
