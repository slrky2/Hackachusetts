"use client";

import { useEffect, useRef } from "react";
import type { ChannelDef } from "@/lib/channels/data";
import type { DisplayMessage } from "@/lib/channels/state";
import ChannelMessage from "./ChannelMessage";
import MessageComposer from "./MessageComposer";

interface CommunityChannelPaneProps {
  /** A community channel definition (group === "community"). */
  channel: ChannelDef;
  /** Demo messages followed by session messages, from getChannelMessages. */
  messages: readonly DisplayMessage[];
  /** Receives already-prepared text from the composer. */
  onPost: (text: string) => void;
}

/**
 * Pane for one community channel: header, DEMO / FICTIONAL banner, scrolling
 * message log, and composer. Render with `key={slug}` so the log scrolls to
 * the bottom on channel change (Requirement 5.6).
 *
 * `channel.slug` is a ChannelSlug, but MessageComposer needs a CommunitySlug.
 * Rather than casting, the slug is narrowed with `!== "chatbot"`; if this pane
 * is ever handed the chatbot channel it renders nothing.
 */
export default function CommunityChannelPane({
  channel,
  messages,
  onPost,
}: CommunityChannelPaneProps) {
  const logRef = useRef<HTMLDivElement>(null);

  // Scroll the log container itself (not scrollIntoView) so the page never
  // scrolls. Runs on mount (channel change via key) and on each new message.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const slug = channel.slug;
  if (slug === "chatbot") return null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-black/5 px-4 py-3 dark:border-white/10">
        <h2 className="text-lg font-bold">#{slug}</h2>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {channel.description}
        </p>
      </div>

      <p className="mx-4 mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
        <strong>DEMO / FICTIONAL</strong>: sample messages for illustration only. Not from the
        City of Lowell, and not real reports, closures, or emergencies.
      </p>

      <div
        ref={logRef}
        role="log"
        aria-label={`Messages in #${slug}`}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.map((message) => (
          <ChannelMessage key={message.id} message={message} />
        ))}
      </div>

      <MessageComposer channelSlug={slug} onSubmit={onPost} />
    </div>
  );
}
