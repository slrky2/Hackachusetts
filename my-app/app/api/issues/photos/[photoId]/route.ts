import { NextResponse } from "next/server";
import { z } from "zod";
import { getPhoto } from "@/lib/db/store";

// GET /api/issues/photos/:photoId — a report photo (JPEG)
export async function GET(_req: Request, ctx: RouteContext<"/api/issues/photos/[photoId]">) {
  const { photoId } = await ctx.params;
  const bytes = z.uuid().safeParse(photoId).success ? getPhoto(photoId) : null;
  if (!bytes) {
    return NextResponse.json({ message: "Photo not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "image/jpeg",
      // Photo ids are random and never reused, so the bytes never change.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
