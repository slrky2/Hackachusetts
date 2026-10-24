"use client";

import { useState } from "react";
import type { ChatMessage } from "@/types";
import { APP_CONFIG } from "@/config/app";
import MarkdownMessage from "./MarkdownMessage";

/**
 * Full-page chat UI for the city assistant.
 * Sends messages to POST /api/chatbot and appends the assistant reply.
 */
export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    const history = messages;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.reply || "Request failed");
      }

      const assistantMsg: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: data.reply ?? "(no response)",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-zinc-400 text-sm text-center pt-12">
            Ask anything about {APP_CONFIG.defaultCity}!
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-md rounded-xl px-4 py-2 text-sm ${
              msg.role === "user"
                ? "ml-auto whitespace-pre-wrap bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
            }`}
          >
            {msg.role === "assistant" ? (
              <MarkdownMessage content={msg.content} />
            ) : (
              msg.content
            )}
          </div>
        ))}
        {loading && (
          <div className="max-w-md rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm text-zinc-500">
            Thinking…
          </div>
        )}
        {error && (
          <div className="max-w-md rounded-xl bg-red-50 dark:bg-red-950 px-4 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
      <div className="border-t border-black/5 dark:border-white/10 p-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
          placeholder={`Ask something about ${APP_CONFIG.defaultCity}…`}
          className="flex-1 rounded-full border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-full bg-emerald-600 font-semibold shadow-sm text-white text-sm hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
