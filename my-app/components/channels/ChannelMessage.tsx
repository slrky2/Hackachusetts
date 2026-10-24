import {
  authorInitial,
  formatMessageTime,
  type DisplayMessage,
} from "@/lib/channels/state";

interface ChannelMessageProps {
  message: DisplayMessage;
}

/**
 * One row in a community channel log: avatar, author, time, and text.
 * Text is rendered as plain React text (escaped, no Markdown) with line
 * breaks preserved (Requirements 5.3, 6.8). Demo messages carry a small
 * DEMO tag (Requirement 7.8).
 */
export default function ChannelMessage({ message }: ChannelMessageProps) {
  const isSession = message.kind === "session";
  const avatarColor = isSession
    ? "bg-zinc-700"
    : "bg-gradient-to-br from-emerald-500 to-teal-600";

  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${avatarColor} text-sm font-bold text-white`}
      >
        {authorInitial(message.author)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold">{message.author}</span>
          <time
            dateTime={message.timestamp}
            className="text-xs text-zinc-600 dark:text-zinc-400"
          >
            {formatMessageTime(message.timestamp)}
          </time>
          {message.kind === "demo" && (
            <span className="text-[10px] font-semibold uppercase text-amber-800 dark:text-amber-300">
              DEMO
            </span>
          )}
        </div>
        <p className="whitespace-pre-wrap break-words text-sm text-zinc-800 dark:text-zinc-200">
          {message.text}
        </p>
      </div>
    </div>
  );
}
