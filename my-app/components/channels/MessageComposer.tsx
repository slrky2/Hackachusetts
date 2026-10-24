"use client";

import { useId, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import type { CommunitySlug } from "@/lib/channels/data";
import { MAX_MESSAGE_LENGTH, prepareMessageText } from "@/lib/channels/state";

interface MessageComposerProps {
  channelSlug: CommunitySlug;
  onSubmit: (text: string) => void;
}

/**
 * Textarea + Send button for posting into a community channel.
 * Purely local: hands the prepared text to `onSubmit` and makes no network calls.
 * Enter submits; Shift+Enter inserts a newline; IME composition is respected.
 */
export default function MessageComposer({ channelSlug, onSubmit }: MessageComposerProps) {
  const [draft, setDraft] = useState("");
  const textareaId = useId();
  const prepared = prepareMessageText(draft);

  function submit() {
    if (prepared === null) return;
    onSubmit(prepared);
    setDraft("");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    submit();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
    // Shift+Enter falls through to the textarea default (newline).
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-black/5 p-4 dark:border-white/10"
    >
      <label htmlFor={textareaId} className="sr-only">
        Message #{channelSlug}
      </label>
      <textarea
        id={textareaId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={`Message #${channelSlug}`}
        className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-white/10 dark:bg-zinc-900"
      />
      <button
        type="submit"
        disabled={prepared === null}
        className="px-4 py-2 rounded-full bg-emerald-600 font-semibold shadow-sm text-white text-sm hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}
