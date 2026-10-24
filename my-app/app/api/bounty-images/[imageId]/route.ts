import { NextResponse } from "next/server";
import { getImage } from "@/lib/bounties/store";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// GET /api/bounty-images/:imageId — a job photo. Ids are random UUIDs and a
// photo never changes, so it can be cached for good.
export async function GET(_req: Request, ctx: RouteContext<"/api/bounty-images/[imageId]">) {
  const { imageId } = await ctx.params;
  const image = UUID.test(imageId) ? getImage(imageId) : null;
  if (!image) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return new NextResponse(image.bytes, {
    headers: {
      // Type comes from the file signature checked on upload, not the client.
      "Content-Type": image.contentType,
      "Content-Length": String(image.bytes.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
