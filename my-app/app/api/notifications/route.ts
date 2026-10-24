import { NextResponse } from "next/server";

// GET /api/notifications — current user's notifications
export async function GET() {
  // TODO: get userId from session, query DB
  return NextResponse.json({ notifications: [] });
}
