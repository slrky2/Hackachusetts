"use client";

interface Props {
  count?: number;
}

export default function NotificationBell({ count = 0 }: Props) {
  return (
    <button className="relative p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Notifications">
      <span className="text-xl">🔔</span>
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
