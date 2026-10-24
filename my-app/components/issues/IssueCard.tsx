import type { Issue } from "@/types";
import { formatCategory, timeAgo } from "@/lib/utils";

interface Props {
  issue: Issue;
}

export default function IssueCard({ issue }: Props) {
  return (
    <article className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
          {formatCategory(issue.category)}
        </span>
        <span className="text-xs text-zinc-400">{timeAgo(issue.createdAt)}</span>
      </div>
      <h3 className="font-semibold">{issue.title}</h3>
      <p className="text-sm text-zinc-500 line-clamp-2">{issue.description}</p>
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <span>👍 {issue.upvotes}</span>
        <span className="capitalize">{issue.status.replace("_", " ")}</span>
        {issue.location.address && <span>{issue.location.address}</span>}
      </div>
    </article>
  );
}
