"use client";

import type { Message } from "@/types";
import { timeAgo } from "@/lib/utils";

interface Props {
  messages: Message[];
}

export default function MessageThread({ messages }: Props) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold">{msg.author.name}</span>
              <span className="text-xs text-zinc-400">{timeAgo(msg.createdAt)}</span>
            </div>
            <p className="text-sm mt-0.5">{msg.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
