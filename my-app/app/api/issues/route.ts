import { NextRequest, NextResponse } from "next/server";
import { listReports } from "@/lib/db/store";
import { viewerIdSchema } from "@/lib/validators/issue";

// GET /api/issues?viewerId=<uuid> — all reports with upvote/comment state for that viewer
export async function GET(req: NextRequest) {
  const parsed = viewerIdSchema.safeParse(req.nextUrl.searchParams.get("viewerId"));
  const viewerId = parsed.success ? parsed.data : null;
  return NextResponse.json({ reports: listReports(viewerId) });
}

// POST /api/issues — create a new issue report
export async function POST(req: NextRequest) {
  const body = await req.json();
  // TODO: validate with createIssueSchema, persist to the store, award points
  console.log("POST /api/issues", body);
  return NextResponse.json({ message: "Issue created" }, { status: 201 });
}
