"use client";

import { useReducer, useRef } from "react";
import { useSearchParams } from "next/navigation";
import ChatInterface from "@/components/chatbot/ChatInterface";
import { APP_CONFIG } from "@/config/app";
import {
  createInitialSessionState,
  getChannel,
  getChannelMessages,
  resolveChannelSlug,
  sessionReducer,
} from "@/lib/channels/state";
import { cn } from "@/lib/utils";
import ChannelSidebar from "./ChannelSidebar";
import CommunityChannelPane from "./CommunityChannelPane";

/**
 * Client island for /chatbot: reads `?channel=` (must render inside <Suspense>),
 * owns session-only community messages, and lays out sidebar + pane.
 *
 * ChatInterface is always mounted and only hidden when another channel is
 * selected, so the AI conversation survives channel switches (Requirement 4.4).
 * Session messages live here, so community panes can remount per channel
 * (`key={slug}`) without losing posts (Requirement 6.6). Nothing is sent to a
 * server (Requirement 6.7).
 */
export default function ChannelsView() {
  const slug = resolveChannelSlug(useSearchParams().get("channel"));
  const [session, dispatch] = useReducer(sessionReducer, undefined, createInitialSessionState);
  // Read only inside the post handler (never during render).
  const nextId = useRef(0);

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 md:flex-row">
      <ChannelSidebar selected={slug} />
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-zinc-900">
        <div className={cn("flex min-h-0 flex-1 flex-col", slug !== "chatbot" && "hidden")}>
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-3 dark:border-white/10">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">CivicBot</h2>
              <span className="rounded-full bg-emerald-100 px-1.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                AI
              </span>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {APP_CONFIG.defaultCity}
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <ChatInterface />
          </div>
        </div>
        {slug !== "chatbot" && (
          <CommunityChannelPane
            key={slug}
            channel={getChannel(slug)}
            messages={getChannelMessages(slug, session)}
            onPost={(text) =>
              dispatch({
                type: "post",
                channel: slug,
                text,
                id: `session-${nextId.current++}`,
                timestamp: new Date().toISOString(),
              })
            }
          />
        )}
      </section>
    </div>
  );
}
