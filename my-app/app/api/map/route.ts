import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/map/pins — returns all active map pins for the city map
 * Supports bounding-box queries: ?swLat=&swLng=&neLat=&neLng=
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const swLat = searchParams.get("swLat");
  const swLng = searchParams.get("swLng");
  const neLat = searchParams.get("neLat");
  const neLng = searchParams.get("neLng");

  // TODO: query DB for pins within bounding box
  console.log("GET /api/map pins", { swLat, swLng, neLat, neLng });
  return NextResponse.json({ pins: [] });
}
