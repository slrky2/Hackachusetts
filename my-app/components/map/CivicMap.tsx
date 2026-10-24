"use client";

import { useEffect } from "react";
import Link from "next/link";
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
import { directionsUrl, type LatLng, type UserPosition } from "@/lib/maps";
import { formatDollars } from "@/lib/utils";
import { BOUNTY_COLOR, POST_COLOR, SEVERITY_COLORS } from "@/lib/utils/severity";
import type { Bounty, CityMarker } from "@/types";
import MapErrorBoundary from "./MapErrorBoundary";
import UserLocationMarker from "./UserLocationMarker";

interface CivicMapProps {
  markers: CityMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  defaultZoom?: number;
  /** When set, shows Google's blue "you are here" dot and pans to it. */
  userLocation?: UserPosition | null;
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
    <MapErrorBoundary>
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

        {userLocation && <UserLocationMarker position={userLocation} />}

        <PanTo position={userLocation} />
        <PanTo position={selected} />
      </Map>
    </APIProvider>
    </MapErrorBoundary>
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
  const color = pinColor(marker);
  const label =
    marker.kind === "issue"
      ? marker.report.title
      : marker.kind === "bounty"
        ? `Bounty: ${marker.bounty.title}`
        : `Post by ${marker.post.author.name}`;

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
          glyphText={marker.kind === "bounty" ? "$" : undefined}
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

function pinColor(marker: CityMarker): string {
  if (marker.kind === "post") return POST_COLOR;
  if (marker.kind === "bounty") return BOUNTY_COLOR;
  return SEVERITY_COLORS[marker.report.severity];
}

const BOUNTY_STATUS_TEXT: Record<Bounty["status"], string> = {
  open: "Open",
  claimed: "Claimed",
  done: "Done · awaiting approval",
  paid: "Paid",
};

/** Reward, status and a link to the job on the Bounties page. */
function BountyLine({ bounty }: { bounty: Bounty }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
      <span className="font-bold text-emerald-700">💰 Bounty {formatDollars(bounty.reward)}</span>
      <span className="text-zinc-600">{BOUNTY_STATUS_TEXT[bounty.status]}</span>
      <Link href={`/bounties?job=${bounty.id}`} className="font-semibold text-emerald-700 underline">
        View job
      </Link>
      <a
        href={directionsUrl(
          bounty.lat !== null && bounty.lng !== null ? { lat: bounty.lat, lng: bounty.lng } : null,
          bounty.place,
        )}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Directions to ${bounty.place} (opens Google Maps in a new tab)`}
        className="font-semibold text-emerald-700 underline"
      >
        Directions
      </a>
    </div>
  );
}

function MarkerDetails({ marker }: { marker: CityMarker }) {
  // Info windows always render on a white background, so use fixed dark text.
  if (marker.kind === "bounty") {
    const { bounty } = marker;
    return (
      <div className="max-w-[220px] space-y-1 text-zinc-900">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Bounty · {bounty.posterName}
        </p>
        <p className="text-sm font-semibold leading-snug">{bounty.title}</p>
        {bounty.place && <p className="text-xs text-zinc-600">{bounty.place}</p>}
        <BountyLine bounty={bounty} />
      </div>
    );
  }

  if (marker.kind === "issue") {
    const { report } = marker;
    return (
      <div className="max-w-[220px] space-y-1 text-zinc-900">
        {report.photoUrls[0] && (
          // eslint-disable-next-line @next/next/no-img-element -- served from our in-memory API
          <img
            src={report.photoUrls[0]}
            alt={`Photo of: ${report.title}`}
            className="mb-1 aspect-video w-full rounded-md object-cover"
          />
        )}
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Issue · {report.category}
        </p>
        <p className="text-sm font-semibold leading-snug">{report.title}</p>
        <p className="text-xs text-zinc-600">
          {report.location} · by {report.isMine ? "you" : report.authorName}
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span
            className="rounded-full px-2 py-0.5 font-medium text-white"
            style={{ background: pinColor(marker) }}
          >
            {report.severity}
          </span>
          <span className="text-zinc-600">
            ▲ {report.upvotes} · 💬 {report.comments.length}
          </span>
          <span className="font-semibold text-zinc-700">🏛 City crew job</span>
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
