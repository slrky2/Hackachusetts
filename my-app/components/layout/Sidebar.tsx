"use client";

// Main navigation sidebar — links to all dashboard sections
// TODO: implement with active-link highlighting and collapsible groups
export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
      <div className="p-4 text-lg font-bold">CivicConnect</div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* TODO: render NavItem components */}
      </nav>
    </aside>
  );
}
