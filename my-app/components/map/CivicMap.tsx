"use client";

/**
 * CivicMap — full-page Google Maps component with civic issue pins.
 *
 * Dependencies to install:
 *   npm install @vis.gl/react-google-maps
 *
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local
 */

// import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
// import { MAP_CONFIG, APP_CONFIG } from "@/config/app";
// import type { MapPin } from "@/types";

interface Props {
  pins?: unknown[]; // MapPin[]
  onPinClick?: (pin: unknown) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function CivicMap({ pins = [], onPinClick, onMapClick }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
      {/* TODO: replace with <APIProvider> + <Map> + <AdvancedMarker> */}
      Google Maps — install @vis.gl/react-google-maps and add API key
    </div>
  );
}
