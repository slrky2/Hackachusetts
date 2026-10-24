"use client";

interface Props {
  onSend: (content: string) => void;
}

export default function MessageInput({ onSend }: Props) {
  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
      <input
        placeholder="Message #channel"
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value.trim()) {
            onSend(e.currentTarget.value);
            e.currentTarget.value = "";
          }
        }}
      />
    </div>
  );
}
