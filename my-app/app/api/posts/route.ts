import { NextRequest, NextResponse } from "next/server";
import { listPosts } from "@/lib/db/store";
import { viewerIdSchema } from "@/lib/validators/issue";

// GET /api/posts?viewerId=<uuid> — feed posts, newest first, with that viewer's reaction state
export async function GET(req: NextRequest) {
  const parsed = viewerIdSchema.safeParse(req.nextUrl.searchParams.get("viewerId"));
  const viewerId = parsed.success ? parsed.data : null;
  return NextResponse.json({ posts: listPosts(viewerId) });
}
