import { NextRequest, NextResponse } from "next/server";
import { toggleReaction } from "@/lib/db/store";
import { upvoteSchema } from "@/lib/validators/issue";

// POST /api/posts/:postId/react  { viewerId } — toggles the viewer's "Thanks" / "Going"
export async function POST(req: NextRequest, ctx: RouteContext<"/api/posts/[postId]/react">) {
  const { postId } = await ctx.params;
  const id = Number(postId);
  const parsed = upvoteSchema.safeParse(await req.json().catch(() => null));

  if (!Number.isInteger(id) || !parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }

  const post = toggleReaction(id, parsed.data.viewerId);
  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}
