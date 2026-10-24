"use client";

import { AdvancedMarker, AdvancedMarkerAnchorPoint, Circle } from "@vis.gl/react-google-maps";
import type { UserPosition } from "@/lib/maps";

// Google Maps' "my location" blue.
const GOOGLE_BLUE = "#4285F4";
// Very rough fixes (e.g. Wi-Fi only) can report several km; don't paint the whole city.
const MAX_ACCURACY_M = 2000;

/**
 * Google Maps-style "you are here": a blue dot with a white border, plus a
 * light blue circle showing how accurate the browser's location is.
 * Must be rendered inside a <Map>.
 */
export default function UserLocationMarker({ position }: { position: UserPosition }) {
  const center = { lat: position.lat, lng: position.lng };
  const accuracy = position.accuracy;

  return (
    <>
      {accuracy !== undefined && accuracy > 0 && (
        <Circle
          center={center}
          radius={Math.min(accuracy, MAX_ACCURACY_M)}
          fillColor={GOOGLE_BLUE}
          fillOpacity={0.15}
          strokeColor={GOOGLE_BLUE}
          strokeOpacity={0.35}
          strokeWeight={1}
          clickable={false}
          zIndex={1}
        />
      )}
      <AdvancedMarker
        position={center}
        // Centered on the point, not sitting above it like a pin.
        anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
        title="You are here"
        zIndex={500}
        clickable={false}
      >
        <span
          aria-hidden="true"
          className="block h-[18px] w-[18px] rounded-full border-[3px] border-white shadow-[0_1px_4px_rgba(0,0,0,0.4)]"
          style={{ background: GOOGLE_BLUE }}
        />
      </AdvancedMarker>
    </>
  );
}
