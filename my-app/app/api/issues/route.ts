import { NextRequest, NextResponse } from "next/server";

// GET /api/issues — list issues (supports ?status=open&category=pothole)
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  // TODO: query DB with filters
  console.log("GET /api/issues", { status, category });
  return NextResponse.json({ issues: [] });
}

// POST /api/issues — create a new issue report
export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: validate with createIssueSchema, persist to DB, award points
  console.log("POST /api/issues", body);
  return NextResponse.json({ message: "Issue created" }, { status: 201 });
}
