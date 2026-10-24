import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/bounties/actor";
import { MAX_IMAGE_DATA_URL_LENGTH, parseImageDataUrl } from "@/lib/bounties/image";
import { BountyError, getViewer, listBounties, postBounty } from "@/lib/bounties/store";
import { createBountySchema } from "@/lib/validators/bounty";
import type { BountiesResponse } from "@/types";

/** Room for a max-size photo plus the text fields. */
const MAX_BODY_BYTES = MAX_IMAGE_DATA_URL_LENGTH + 64 * 1024;

// GET /api/bounties — every bounty, newest first, plus the signed-in viewer
// (name, wallet, role). Readable when signed out; viewer is then null.
export async function GET() {
  const actor = await getActor();
  const body: BountiesResponse = {
    bounties: listBounties(actor),
    viewer: actor ? getViewer(actor) : null,
  };
  return NextResponse.json(body);
}

// POST /api/bounties — post a job as the signed-in user (or as the city, for staff).
export async function POST(req: NextRequest) {
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ message: "Sign in to post a job." }, { status: 401 });
  }

  // Reject oversized bodies before reading them.
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ message: "That photo is too large (2 MB max)." }, { status: 413 });
  }

  const parsed = createBountySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid request";
    return NextResponse.json({ message }, { status: 422 });
  }

  let image = null;
  if (parsed.data.image) {
    const result = parseImageDataUrl(parsed.data.image);
    if (!result.ok) return NextResponse.json({ message: result.message }, { status: 422 });
    image = result.image;
  }

  try {
    const bounty = postBounty(actor, { ...parsed.data, image });
    return NextResponse.json({ bounty }, { status: 201 });
  } catch (err) {
    if (err instanceof BountyError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    throw err;
  }
}
