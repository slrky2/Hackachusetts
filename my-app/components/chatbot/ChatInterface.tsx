"use client";

import { useState } from "react";
import type { ChatMessage } from "@/types";

/**
 * Full-page chat UI for CivicBot.
 * TODO: connect to POST /api/chatbot with streaming support (useChat from ai/react)
 */
export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    // TODO: call POST /api/chatbot and append assistant reply
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-zinc-400 text-sm text-center pt-12">
            Ask CivicBot anything about {"{city name}"}!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-md rounded-xl px-4 py-2 text-sm ${
              msg.role === "user"
                ? "ml-auto bg-blue-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask something about the city…"
          className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
