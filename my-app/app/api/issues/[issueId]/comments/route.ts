import { NextRequest, NextResponse } from "next/server";
import { addComment } from "@/lib/db/store";
import { commentSchema } from "@/lib/validators/issue";

// POST /api/issues/:issueId/comments  { viewerId, text } — adds a comment
export async function POST(req: NextRequest, ctx: RouteContext<"/api/issues/[issueId]/comments">) {
  const { issueId } = await ctx.params;
  const id = Number(issueId);
  const parsed = commentSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ message }, { status: 400 });
  }
  if (!Number.isInteger(id)) {
    return NextResponse.json({ message: "Invalid report id" }, { status: 400 });
  }

  const result = addComment(id, parsed.data.viewerId, parsed.data.text);
  if (!result.ok) {
    return result.reason === "not_found"
      ? NextResponse.json({ message: "Report not found" }, { status: 404 })
      : NextResponse.json({ message: "This report has reached its comment limit" }, { status: 409 });
  }
  return NextResponse.json({ report: result.report }, { status: 201 });
}
