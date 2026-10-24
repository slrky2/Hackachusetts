"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { timeAgo } from "@/lib/utils";
import { severityBadgeClass } from "@/lib/utils/severity";
import type { CityReport } from "@/types";

interface ReportCardProps {
  report: CityReport;
  isSelected: boolean;
  /** Toggle selection (focuses the pin and expands comments). */
  onSelect: () => void;
  onToggleUpvote: () => void;
  /** Should throw on failure so the card can show an error. */
  onAddComment: (text: string) => Promise<void>;
}

/** A reported problem with upvote and an expandable comment thread. */
export default function ReportCard({
  report,
  isSelected,
  onSelect,
  onToggleUpvote,
  onAddComment,
}: ReportCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const uid = useId();
  const commentsId = `${uid}-comments`;
  const inputId = `${uid}-input`;

  // Bring the card into view when it's selected from the map.
  useEffect(() => {
    if (isSelected) cardRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isSelected]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAddComment(text);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post your comment.");
    } finally {
      setSubmitting(false);
    }
  }

  const commentCount = report.comments.length;

  return (
    <article
      ref={cardRef}
      className={`rounded-2xl border bg-white p-4 shadow-sm transition-colors dark:bg-zinc-900 ${
        isSelected
          ? "border-emerald-500 ring-2 ring-emerald-500/30"
          : "border-black/5 dark:border-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Upvote: raises the community priority of this report */}
        <button
          type="button"
          onClick={onToggleUpvote}
          aria-pressed={report.hasUpvoted}
          aria-label={`Upvote "${report.title}", ${report.upvotes} upvotes`}
          className={`flex w-12 shrink-0 flex-col items-center rounded-xl border py-1.5 text-sm font-bold transition-colors ${
            report.hasUpvoted
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-black/10 text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 dark:border-white/15 dark:text-zinc-300"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 4 3 15h6v5h6v-5h6L12 4Z" />
          </svg>
          {report.upvotes}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${severityBadgeClass(report.severity)}`}>
              {report.severity} priority
            </span>
            <span>{report.category}</span>
            <span aria-hidden="true">•</span>
            <span>{report.location}</span>
          </div>

          <button
            type="button"
            onClick={onSelect}
            className="mt-1.5 text-left text-sm font-semibold leading-snug hover:text-emerald-600 hover:underline"
          >
            {report.title}
          </button>

          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onSelect}
              aria-expanded={isSelected}
              aria-controls={commentsId}
              className="text-xs font-medium text-zinc-500 hover:text-emerald-600"
            >
              💬 {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </button>
            <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              🏛 City crew
            </span>
          </div>
        </div>
      </div>

      {isSelected && (
        <div id={commentsId} className="mt-4 border-t border-black/5 pt-3 dark:border-white/10">
          {commentCount === 0 ? (
            <p className="text-xs text-zinc-500">No comments yet. Add what you&apos;ve seen.</p>
          ) : (
            <ul className="space-y-2.5">
              {report.comments.map((comment) => (
                <li key={comment.id} className="text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">
                      {comment.isMine ? "You" : comment.authorName}
                    </span>
                    <span className="text-xs text-zinc-400">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300">{comment.text}</p>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
            <label htmlFor={inputId} className="sr-only">
              Add a comment
            </label>
            <input
              id={inputId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              placeholder="Add a comment…"
              className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/15 dark:bg-zinc-950"
            />
            <button
              type="submit"
              disabled={submitting || !draft.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Posting…" : "Post"}
            </button>
          </form>
          {error && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
