import { NextRequest, NextResponse } from "next/server";

// GET /api/channels
export async function GET() {
  return NextResponse.json({ channels: [] });
}

// POST /api/channels — create a channel
export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("POST /api/channels", body);
  return NextResponse.json({ message: "Channel created" }, { status: 201 });
}
