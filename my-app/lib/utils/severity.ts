import type { CityReport, TicketSeverity } from "@/types";

/** Highest priority first; also the display order for filters and legends. */
export const SEVERITY_LEVELS: TicketSeverity[] = ["High", "Medium", "Low"];

/** Pin/legend colors: issues by severity, posts in a single neutral color. */
export const SEVERITY_COLORS: Record<TicketSeverity, string> = {
  High: "#dc2626",
  Medium: "#d97706",
  Low: "#059669",
};
export const POST_COLOR = "#0284c7";
/** Bounty pins (chores and small jobs anyone can do). */
export const BOUNTY_COLOR = "#7c3aed";

/** Tailwind classes for the severity badge used in lists and cards. */
export function severityBadgeClass(severity: TicketSeverity): string {
  switch (severity) {
    case "High":
      return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
    case "Medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
    default:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  }
}

/** Sort by priority (High → Low), then by community upvotes. */
export function sortByPriority<T extends Pick<CityReport, "id" | "severity" | "upvotes">>(
  reports: T[],
): T[] {
  return [...reports].sort(
    (a, b) =>
      SEVERITY_LEVELS.indexOf(a.severity) - SEVERITY_LEVELS.indexOf(b.severity) ||
      b.upvotes - a.upvotes ||
      a.id - b.id,
  );
}
