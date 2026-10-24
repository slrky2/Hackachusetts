import Link from "next/link";
import type { ReactNode } from "react";

import Logo from "./Logo";
import {
  BountyIcon,
  ChatIcon,
  HomeIcon,
  MapIcon,
  PlusIcon,
} from "./NavIcons";

// Nav items that can be marked as the current page. `undefined` means none.
export type NavKey = "home" | "map" | "bounties" | "chat";

const NAV_ITEMS: {
  key: NavKey | "report";
  label: string;
  icon: (active?: NavKey) => ReactNode;
  big?: boolean;
  href?: string;
}[] = [
  {
    key: "home",
    label: "Home",
    icon: (active) => <HomeIcon active={active === "home"} />,
    href: "/",
  },
  { key: "map", label: "Map", icon: () => <MapIcon />, href: "/map" },
  { key: "report", label: "Report", icon: () => <PlusIcon />, big: true },
  {
    key: "bounties",
    label: "Bounties",
    icon: () => <BountyIcon />,
    href: "/bounties",
  },
  { key: "chat", label: "Chat", icon: () => <ChatIcon />, href: "/chatbot" },
];

// Shared top bar used by the homepage and the chatbot page.
// The active item is passed in as a prop, so this stays a server component.
export function SiteHeader({ active }: { active?: NavKey }) {
  return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-4 border-b border-black/5 bg-white/70 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-white/10 dark:bg-black/40">
      {/* Left: logo */}
      <Link href="/" aria-label="Town² home" className="flex shrink-0 items-center pt-1">
        <Logo className="text-[30px] sm:text-[36px]" />
      </Link>

      {/* Center: nav buttons */}
      <nav className="flex flex-1 items-center justify-center gap-1 sm:gap-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          const className = item.big
            ? "flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95 sm:px-4"
            : `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:px-3 ${
                isActive
                  ? "text-emerald-600"
                  : "text-zinc-600 dark:text-zinc-300"
              }`;

          const inner = (
            <>
              {item.icon(active)}
              <span
                className={
                  item.big
                    ? "hidden text-sm sm:inline"
                    : "text-[10px] font-medium"
                }
              >
                {item.label}
              </span>
            </>
          );

          // Items with a route render as links; the rest stay as buttons.
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={className}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              className={className}
            >
              {inner}
            </button>
          );
        })}
      </nav>

      {/* Right: sign in */}
      <div className="flex min-w-0 shrink-0 justify-end">
        <button
          type="button"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95 sm:px-5"
        >
          Sign in / Login
        </button>
      </div>
    </header>
  );
}
