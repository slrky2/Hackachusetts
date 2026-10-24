import { NextRequest, NextResponse } from "next/server";
import { toggleUpvote } from "@/lib/db/store";
import { upvoteSchema } from "@/lib/validators/issue";

// POST /api/issues/:issueId/upvote  { viewerId } — toggles the viewer's upvote
export async function POST(req: NextRequest, ctx: RouteContext<"/api/issues/[issueId]/upvote">) {
  const { issueId } = await ctx.params;
  const id = Number(issueId);
  const parsed = upvoteSchema.safeParse(await req.json().catch(() => null));

  if (!Number.isInteger(id) || !parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const report = toggleUpvote(id, parsed.data.viewerId);
  if (!report) {
    return NextResponse.json({ message: "Report not found" }, { status: 404 });
  }
  return NextResponse.json({ report });
}
