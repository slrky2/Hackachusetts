import { NextRequest, NextResponse } from "next/server";

// GET /api/bounties — list bounties
export async function GET() {
  // TODO: query DB
  return NextResponse.json({ bounties: [] });
}

// POST /api/bounties — create a new bounty (admin / city official only)
export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: validate, check role, persist
  console.log("POST /api/bounties", body);
  return NextResponse.json({ message: "Bounty created" }, { status: 201 });
}
