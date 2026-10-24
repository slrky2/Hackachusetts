"use client";

import { useEffect } from "react";
import {
  APIProvider,
  AdvancedMarker,
  ColorScheme,
  Map,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";
import { APP_CONFIG, MAP_CONFIG } from "@/config/app";
import type { LatLng, UserPosition } from "@/lib/maps";
import MapErrorBoundary from "./MapErrorBoundary";
import { CenterOnceOn, MyLocationButton, PinMyLocationButton } from "./MapLocationControls";
import UserLocationMarker from "./UserLocationMarker";

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (position: LatLng) => void;
  /** Map pans here when it changes (e.g. after "Use my location" below the map). */
  focus?: LatLng | null;
  /** Shows Google's blue "you are here" dot and accuracy circle. */
  userLocation?: UserPosition | null;
  /** Still waiting on the browser's location (shows "Finding you…"). */
  locating?: boolean;
}

/**
 * Map for choosing where a problem is. Click anywhere to drop a pin, drag it
 * to fine-tune, or press "Pin my location" to drop it on the blue dot.
 */
export default function LocationPicker({
  value,
  onChange,
  focus = null,
  userLocation = null,
  locating = false,
}: LocationPickerProps) {
  if (!MAP_CONFIG.apiKey) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-zinc-500">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to my-app/.env.local and restart the dev server.
      </div>
    );
  }

  return (
    <MapErrorBoundary>
    <APIProvider apiKey={MAP_CONFIG.apiKey}>
      <Map
        className="h-full w-full"
        mapId={MAP_CONFIG.mapId}
        defaultCenter={APP_CONFIG.defaultMapCenter}
        defaultZoom={14}
        colorScheme={ColorScheme.FOLLOW_SYSTEM}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        onClick={(e) => {
          const p = e.detail.latLng;
          if (p) onChange({ lat: p.lat, lng: p.lng });
        }}
      >
        {value && (
          <AdvancedMarker
            position={value}
            title="Problem location (drag to adjust)"
            draggable
            onDragEnd={(e) => {
              const p = e.latLng;
              if (p) onChange({ lat: p.lat(), lng: p.lng() });
            }}
          >
            <Pin background="#dc2626" borderColor="#ffffff" glyphColor="#ffffff" scale={1.2} />
          </AdvancedMarker>
        )}
        {userLocation && <UserLocationMarker position={userLocation} />}
        {/* Start on the user, unless they already dropped a pin. */}
        <CenterOnceOn position={value ? null : userLocation} zoom={17} />
        <PanTo position={focus} />
        {/* Hidden when location is off; the note under the map explains why. */}
        {(userLocation || locating) && <PinMyLocationButton position={userLocation} onPin={onChange} />}
        <MyLocationButton position={userLocation} zoom={17} />
      </Map>
    </APIProvider>
    </MapErrorBoundary>
  );
}

function PanTo({ position }: { position: LatLng | null }) {
  const map = useMap();
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (map && lat !== undefined && lng !== undefined) {
      map.panTo({ lat, lng });
      map.setZoom(17);
    }
  }, [map, lat, lng]);
  return null;
}
