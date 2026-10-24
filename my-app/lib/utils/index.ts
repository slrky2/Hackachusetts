import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date string to a human-readable relative time */
export function timeAgo(dateStr: string, now: number = Date.now()): string {
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Format dollars for display: 20 → "$20", 12.5 → "$12.50". */
export function formatDollars(amount: number): string {
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

/** Truncate a string to a given length */
export function truncate(str: string, maxLength: number): string {
  return str.length <= maxLength ? str : `${str.slice(0, maxLength)}…`;
}

/** Capitalize the first letter of a string */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Convert snake_case category keys to display labels */
export function formatCategory(key: string): string {
  return key.split("_").map(capitalize).join(" ");
}
