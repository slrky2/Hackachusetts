<<<<<<< Updated upstream
import type { ReactNode } from "react";
import TopNav from "@/components/layout/TopNav";
=======
import { Suspense, type ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
// import TopNav from "@/components/layout/TopNav";
>>>>>>> Stashed changes

/**
 * Shared layout for the dashboard routes (Home, Map, ...).
 * Full-height column: top nav, then the page fills the remaining space.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
<<<<<<< Updated upstream
    <div className="flex h-screen flex-col overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-emerald-50 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      <TopNav />
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
=======
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <Suspense
        fallback={
          <aside className="w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
        }
      >
        <Sidebar />
      </Suspense>
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* <TopNav /> */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
>>>>>>> Stashed changes
    </div>
  );
}
