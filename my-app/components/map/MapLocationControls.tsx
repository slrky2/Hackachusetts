"use client";

import { useEffect, useRef } from "react";
import { ControlPosition, MapControl, useMap } from "@vis.gl/react-google-maps";
import type { LatLng } from "@/lib/maps";

const CONTROL_CLASS =
  "m-2.5 grid h-10 w-10 place-items-center rounded-sm bg-white text-zinc-700 shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-white";

/**
 * Google Maps-style "my location" button (bottom right, under the zoom
 * buttons). Pans the map back to the blue dot. Must be inside a <Map>.
 */
export function MyLocationButton({ position, zoom = 16 }: { position: LatLng | null; zoom?: number }) {
  const map = useMap();
  return (
    <MapControl position={ControlPosition.RIGHT_BOTTOM}>
      <button
        type="button"
        onClick={() => {
          if (!map || !position) return;
          map.panTo(position);
          if ((map.getZoom() ?? 0) < zoom) map.setZoom(zoom);
        }}
        disabled={!position}
        aria-label={position ? "Show my location" : "Your location isn't available"}
        title={position ? "Show my location" : "Your location isn't available"}
        className={CONTROL_CLASS}
      >
        <CrosshairIcon />
      </button>
    </MapControl>
  );
}

/** Report map only: drops the problem pin on the user's current spot. */
export function PinMyLocationButton({
  position,
  onPin,
}: {
  position: LatLng | null;
  onPin: (position: LatLng) => void;
}) {
  const map = useMap();
  return (
    <MapControl position={ControlPosition.TOP_LEFT}>
      <button
        type="button"
        onClick={() => {
          if (!position) return;
          onPin({ lat: position.lat, lng: position.lng });
          map?.panTo(position);
          if (map && (map.getZoom() ?? 0) < 17) map.setZoom(17);
        }}
        disabled={!position}
        className="m-2.5 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:bg-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        <span aria-hidden="true" className="block h-3 w-3 rounded-full border-2 border-white bg-[#4285F4] shadow" />
        {position ? "Pin my location" : "Finding you…"}
      </button>
    </MapControl>
  );
}

/**
 * Centers the map on `position` the first time it's known, then never again,
 * so a moving blue dot doesn't keep yanking the map around.
 */
export function CenterOnceOn({ position, zoom }: { position: LatLng | null; zoom?: number }) {
  const map = useMap();
  const done = useRef(false);
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (done.current || !map || lat === undefined || lng === undefined) return;
    done.current = true;
    map.panTo({ lat, lng });
    if (zoom !== undefined) map.setZoom(zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

function CrosshairIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}
