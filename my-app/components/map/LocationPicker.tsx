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
import type { LatLng } from "@/lib/maps";

interface LocationPickerProps {
  value: LatLng | null;
  onChange: (position: LatLng) => void;
  /** Map pans here when it changes (e.g. after "Use my location"). */
  focus?: LatLng | null;
}

/**
 * Map for choosing where a problem is. Click anywhere to drop a pin,
 * then drag the pin to fine-tune it.
 */
export default function LocationPicker({ value, onChange, focus = null }: LocationPickerProps) {
  if (!MAP_CONFIG.apiKey) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-zinc-500">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to my-app/.env.local and restart the dev server.
      </div>
    );
  }

  return (
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
        <PanTo position={focus} />
      </Map>
    </APIProvider>
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
