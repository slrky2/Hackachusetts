import type { ReactNode } from "react";
// import Sidebar from "@/components/layout/Sidebar";
// import TopNav from "@/components/layout/TopNav";

/**
 * Shared layout for all authenticated dashboard routes.
 * Wraps pages with the sidebar and top navigation bar.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* <Sidebar /> */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* <TopNav /> */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
