"use client";

import { useEffect, useState } from "react";
import { distanceKm, type LatLng, type UserPosition } from "@/lib/maps";

export type UserLocation =
  | { status: "pending" }
  | { status: "unavailable" } // unsupported, denied, timed out, or insecure origin
  | { status: "in-area" | "outside-area"; coords: UserPosition };

/**
 * Follows the user's position (like Google Maps' blue dot) and classifies it
 * as inside or outside the city's local area (radiusKm around `center`).
 *
 * Two requests on purpose:
 *  - a quick one-off fix (Wi-Fi/cell is fine) so the dot shows up fast, and
 *  - a watch that keeps the dot moving and sharpens it when GPS is available.
 * High-accuracy-only requests can stall for a long time on laptops, so the
 * quick fix never asks for it. A failed later reading keeps the last spot.
 */
export function useUserLocation(center: LatLng, radiusKm: number): UserLocation {
  const [location, setLocation] = useState<UserLocation>({ status: "pending" });
  const { lat, lng } = center;

  useEffect(() => {
    let cancelled = false;
    let hasFix = false;

    if (!("geolocation" in navigator)) {
      queueMicrotask(() => {
        if (!cancelled) setLocation({ status: "unavailable" });
      });
      return () => {
        cancelled = true;
      };
    }

    const onPosition = (pos: GeolocationPosition) => {
      if (cancelled) return;
      hasFix = true;
      const coords = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      };
      const inArea = distanceKm(coords, { lat, lng }) <= radiusKm;
      setLocation({ status: inArea ? "in-area" : "outside-area", coords });
    };
    const onError = (err: GeolocationPositionError) => {
      // Denied is final. Otherwise only give up if we never got a position.
      if (cancelled || (hasFix && err.code !== err.PERMISSION_DENIED)) return;
      setLocation({ status: "unavailable" });
    };

    navigator.geolocation.getCurrentPosition(onPosition, onError, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60_000,
    });
    const watchId = navigator.geolocation.watchPosition(onPosition, () => {}, {
      enableHighAccuracy: true,
      maximumAge: 10_000,
    });

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, [lat, lng, radiusKm]);

  return location;
}

/** The user's coordinates if known, else null. */
export function coordsOf(location: UserLocation): UserPosition | null {
  return "coords" in location ? location.coords : null;
}
