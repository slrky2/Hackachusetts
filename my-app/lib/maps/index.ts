/**
 * Utility helpers for Google Maps integration.
 * Wraps the Maps JS API loader and exposes typed helpers
 * for geocoding, reverse-geocoding, and pin management.
 */

import { APP_CONFIG } from "@/config/app";

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Convert a human-readable address to coordinates using the Maps Geocoding API.
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to be set.
 */
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  // TODO: implement using @googlemaps/google-maps-services-js or the REST API
  console.warn("geocodeAddress: not yet implemented", address);
  return null;
}

/**
 * Convert lat/lng coordinates to a human-readable address.
 */
export async function reverseGeocode(coords: LatLng): Promise<string | null> {
  // TODO: implement
  console.warn("reverseGeocode: not yet implemented", coords);
  return null;
}

/**
 * Google Maps turn-by-turn directions to a place, starting from the user's
 * current location. Opens the Google Maps app on phones, the website on
 * desktop. Uses exact coordinates when known, otherwise searches the place
 * name within the city.
 */
export function directionsUrl(coords: LatLng | null, place: string): string {
  const destination = coords ? `${coords.lat},${coords.lng}` : `${place}, ${APP_CONFIG.defaultCity}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

/**
 * Return the Google Maps embed URL for a given location.
 */
export function staticMapUrl(coords: LatLng, zoom = 15): string {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  return (
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${coords.lat},${coords.lng}&zoom=${zoom}&size=600x300&key=${key}`
  );
}

/** Great-circle distance between two points in kilometers (haversine). */
export function distanceKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
