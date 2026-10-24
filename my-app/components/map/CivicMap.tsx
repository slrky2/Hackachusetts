"use client";

import { useEffect } from "react";
import {
  APIProvider,
  AdvancedMarker,
  ColorScheme,
  InfoWindow,
  Map,
  Pin,
  useAdvancedMarkerRef,
  useMap,
} from "@vis.gl/react-google-maps";
import { APP_CONFIG, MAP_CONFIG } from "@/config/app";
import type { LatLng } from "@/lib/maps";
import { POST_COLOR, SEVERITY_COLORS } from "@/lib/utils/severity";
import type { CityMarker } from "@/types";

interface CivicMapProps {
  markers: CityMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  defaultZoom?: number;
  /** When set, shows a "you are here" dot and pans to it. */
  userLocation?: LatLng | null;
}

/**
 * Google Map with a pin for every issue and post. Selecting a pin (here or
 * from a list beside the map) opens its info window and pans to it.
 */
export default function CivicMap({
  markers,
  selectedId,
  onSelect,
  defaultZoom = APP_CONFIG.defaultMapZoom,
  userLocation = null,
}: CivicMapProps) {
  if (!MAP_CONFIG.apiKey) {
    return (
      <div className="grid h-full place-items-center p-6 text-center text-sm text-zinc-500">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to my-app/.env.local and restart the dev server.
      </div>
    );
  }

  const selected = markers.find((m) => m.id === selectedId) ?? null;

  return (
    <APIProvider apiKey={MAP_CONFIG.apiKey}>
      <Map
        className="h-full w-full"
        mapId={MAP_CONFIG.mapId}
        defaultCenter={APP_CONFIG.defaultMapCenter}
        defaultZoom={defaultZoom}
        colorScheme={ColorScheme.FOLLOW_SYSTEM}
        // "cooperative" so the page still scrolls when the map is stacked on mobile
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
        onClick={() => onSelect(null)}
      >
        {markers.map((marker) => (
          <MarkerWithInfo
            key={marker.id}
            marker={marker}
            isSelected={marker.id === selectedId}
            onSelect={onSelect}
          />
        ))}

        {userLocation && (
          <AdvancedMarker position={userLocation} title="You are here" zIndex={500}>
            <span className="block h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md ring-4 ring-blue-500/30" />
          </AdvancedMarker>
        )}

        <PanTo position={userLocation} />
        <PanTo position={selected} />
      </Map>
    </APIProvider>
  );
}

function MarkerWithInfo({
  marker,
  isSelected,
  onSelect,
}: {
  marker: CityMarker;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const [markerRef, markerEl] = useAdvancedMarkerRef();
  const color = marker.kind === "issue" ? SEVERITY_COLORS[marker.report.severity] : POST_COLOR;
  const label =
    marker.kind === "issue" ? marker.report.title : `Post by ${marker.post.author.name}`;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: marker.lat, lng: marker.lng }}
        title={label}
        zIndex={isSelected ? 1000 : undefined}
        onClick={() => onSelect(marker.id)}
      >
        <Pin
          background={color}
          borderColor="#ffffff"
          glyphColor="#ffffff"
          scale={isSelected ? 1.3 : marker.kind === "post" ? 0.85 : 1}
        />
      </AdvancedMarker>

      {isSelected && markerEl && (
        <InfoWindow anchor={markerEl} onCloseClick={() => onSelect(null)} headerDisabled>
          <MarkerDetails marker={marker} />
        </InfoWindow>
      )}
    </>
  );
}

function MarkerDetails({ marker }: { marker: CityMarker }) {
  // Info windows always render on a white background, so use fixed dark text.
  if (marker.kind === "issue") {
    const { report } = marker;
    return (
      <div className="max-w-[220px] space-y-1 text-zinc-900">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Issue · {report.category}
        </p>
        <p className="text-sm font-semibold leading-snug">{report.title}</p>
        <p className="text-xs text-zinc-600">{report.location}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-medium text-white"
            style={{ background: SEVERITY_COLORS[report.severity] }}
          >
            {report.severity}
          </span>
          <span className="text-zinc-600">
            ▲ {report.upvotes} · 💬 {report.comments.length}
          </span>
          <span className="font-bold text-emerald-700">Bounty {report.reward}</span>
        </div>
      </div>
    );
  }

  const { post } = marker;
  return (
    <div className="max-w-[220px] space-y-1 text-zinc-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {post.author.type === "city" ? "City update" : "Post"} · {post.location}
      </p>
      {post.title && <p className="text-sm font-semibold leading-snug">{post.title}</p>}
      <p className="text-sm">
        <span className="font-semibold">{post.author.name}</span> {post.caption}
      </p>
      {post.when && <p className="text-xs font-medium text-violet-700">{post.when}</p>}
    </div>
  );
}

/**
 * Pans the map when the target coordinates change. Keyed on lat/lng (not the
 * object) so data refreshes like upvotes don't yank the map back.
 */
function PanTo({ position }: { position: LatLng | null }) {
  const map = useMap();
  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (map && lat !== undefined && lng !== undefined) map.panTo({ lat, lng });
  }, [map, lat, lng]);
  return null;
}
