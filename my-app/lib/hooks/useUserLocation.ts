"use client";

import { useEffect, useState } from "react";
import { distanceKm, type LatLng } from "@/lib/maps";

export type UserLocation =
  | { status: "pending" }
  | { status: "unavailable" } // unsupported, denied, timed out, or insecure origin
  | { status: "in-area" | "outside-area"; coords: LatLng };

/**
 * Asks the browser for the user's position once and classifies it as inside
 * or outside the city's local area (radiusKm around `center`).
 */
export function useUserLocation(center: LatLng, radiusKm: number): UserLocation {
  const [location, setLocation] = useState<UserLocation>({ status: "pending" });
  const { lat, lng } = center;

  useEffect(() => {
    let cancelled = false;
    const finish = (next: UserLocation) => {
      if (!cancelled) setLocation(next);
    };

    if (!("geolocation" in navigator)) {
      queueMicrotask(() => finish({ status: "unavailable" }));
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const inArea = distanceKm(coords, { lat, lng }) <= radiusKm;
          finish({ status: inArea ? "in-area" : "outside-area", coords });
        },
        () => finish({ status: "unavailable" }),
        { timeout: 10_000, maximumAge: 5 * 60_000 },
      );
    }

    return () => {
      cancelled = true;
    };
  }, [lat, lng, radiusKm]);

  return location;
}
