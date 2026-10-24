"use client";

import type { MapPin } from "@/types";

interface Props {
  pin: MapPin;
  onClick?: (pin: MapPin) => void;
}

// Renders a single colored map marker based on issue category and status
export default function IssueMarker({ pin, onClick }: Props) {
  return (
    <button
      onClick={() => onClick?.(pin)}
      title={pin.title}
      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
      style={{ background: statusColor(pin.status) }}
      aria-label={`${pin.category}: ${pin.title}`}
    />
  );
}

function statusColor(status: MapPin["status"]): string {
  const colors: Record<MapPin["status"], string> = {
    open: "#ef4444",
    in_progress: "#f59e0b",
    resolved: "#22c55e",
    closed: "#6b7280",
  };
  return colors[status];
}
