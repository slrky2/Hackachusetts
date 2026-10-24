import { NextRequest, NextResponse } from "next/server";
import { createReport, listReports } from "@/lib/db/store";
import { REPORT_LIMITS } from "@/lib/utils/report";
import { createReportSchema, viewerIdSchema } from "@/lib/validators/issue";

// GET /api/issues?viewerId=<uuid> — all reports with upvote/comment state for that viewer
export async function GET(req: NextRequest) {
  const parsed = viewerIdSchema.safeParse(req.nextUrl.searchParams.get("viewerId"));
  const viewerId = parsed.success ? parsed.data : null;
  return NextResponse.json({ reports: listReports(viewerId) });
}

/** Decode a validated JPEG data URL; null if the bytes aren't really a JPEG. */
function decodeJpeg(dataUrl: string): Buffer | null {
  const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return isJpeg && bytes.length <= REPORT_LIMITS.maxPhotoBytes ? bytes : null;
}

// POST /api/issues — file a new report from the Report page
export async function POST(req: NextRequest) {
  const parsed = createReportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid report";
    return NextResponse.json({ message }, { status: 400 });
  }

  const { viewerId, photos, ...fields } = parsed.data;
  const decoded = photos.map(decodeJpeg);
  if (decoded.some((p) => p === null)) {
    return NextResponse.json({ message: "One of the photos couldn't be read" }, { status: 400 });
  }

  const result = createReport({ ...fields, photos: decoded as Buffer[] }, viewerId);
  if (!result.ok) {
    return NextResponse.json(
      { message: "The demo server is full. Restart it to clear old reports." },
      { status: 507 },
    );
  }
  return NextResponse.json({ report: result.report, post: result.post }, { status: 201 });
}
