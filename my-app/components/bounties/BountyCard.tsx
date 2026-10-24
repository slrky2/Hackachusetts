import type { Bounty } from "@/types";
import { formatCategory, timeAgo } from "@/lib/utils";

interface Props {
  bounty: Bounty;
}

export default function BountyCard({ bounty }: Props) {
  return (
    <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
          {formatCategory(bounty.category)}
        </span>
        <span className="font-semibold text-amber-600">
          {bounty.reward} {bounty.rewardType === "points" ? "pts" : bounty.rewardType}
        </span>
      </div>
      <h3 className="font-semibold">{bounty.title}</h3>
      <p className="text-sm text-zinc-500 line-clamp-2">{bounty.description}</p>
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span className="capitalize">{bounty.status}</span>
        <span>{timeAgo(bounty.createdAt)}</span>
      </div>
    </article>
  );
}
