"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";

// Instagram-style icons built as inline SVGs so we have no extra dependencies.
function HomeIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14" />
      <path d="M15 6v14" />
    </svg>
  );
}

function BountyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14.5 7 22l5-3 5 3-1.5-7.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

interface NavItem {
  label: string;
  icon: (active: boolean) => ReactNode;
  /** Items without an href are not wired up yet. */
  href?: string;
  big?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: (active) => <HomeIcon active={active} /> },
  { label: "Map", href: "/map", icon: () => <MapIcon /> },
  { label: "Report", big: true, icon: () => <PlusIcon /> },
  { label: "Bounties", href: "/bounties", icon: () => <BountyIcon /> },
  { label: "Chat", href: "/chatbot", icon: () => <ChatIcon /> },
];

const BIG_CLASS =
  "flex items-center gap-1.5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 px-3 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105 active:scale-95 sm:px-4";

const itemClass = (active: boolean) =>
  `flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10 sm:px-3 ${
    active ? "text-emerald-600" : "text-zinc-600 dark:text-zinc-300"
  }`;

/** Top bar shared by every dashboard page: title left, nav center, sign in right. */
export default function TopNav() {
  return (
    <header className="z-20 flex shrink-0 items-center justify-between gap-4 border-b border-black/5 bg-white/70 px-4 py-3 backdrop-blur-md sm:px-6 dark:border-white/10 dark:bg-black/40">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-black text-white shadow-sm">
          C
        </span>
        <span className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">City Land</span>
      </Link>

      <nav className="flex flex-1 items-center justify-center gap-1 sm:gap-3" aria-label="Main">
        {/* usePathname is dynamic on param routes under Cache Components, so the
            active highlight streams in; the fallback renders the same links unhighlighted. */}
        <Suspense fallback={<NavItems pathname={null} />}>
          <ActiveNavItems />
        </Suspense>
      </nav>

      <div className="flex min-w-0 shrink-0 justify-end">
        <AuthControl />
      </div>
    </header>
  );
}

/** Clerk avatar menu when signed in, otherwise a link to /sign-in. */
function AuthControl() {
  // Clerk tells us whether someone is signed in.
  const { isSignedIn } = useAuth();

  return isSignedIn ? (
    // Clerk's avatar menu (profile, sign out)
    <UserButton />
  ) : (
    <Link
      href="/sign-in"
      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95 sm:px-5"
    >
      Sign in
    </Link>
  );
}

function ActiveNavItems() {
  return <NavItems pathname={usePathname()} />;
}

function NavItems({ pathname }: { pathname: string | null }) {
  return (
    <>
        {NAV_ITEMS.map((item) => {
          const active = item.href === pathname;
          const content = (
            <>
              {item.icon(active)}
              <span className={item.big ? "hidden text-sm sm:inline" : "text-[10px] font-medium"}>
                {item.label}
              </span>
            </>
          );
          const className = item.big ? BIG_CLASS : itemClass(active);

          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <button key={item.label} type="button" aria-label={item.label} className={className}>
              {content}
            </button>
          );
        })}
    </>
  );
}
