import type { ReactNode } from "react";
import TopNav from "@/components/layout/TopNav";

/**
 * Shared layout for the dashboard routes (Home, Map, ...).
 * Full-height column: top nav, then the page fills the remaining space.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      <TopNav />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
