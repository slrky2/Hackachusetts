import { NextResponse } from "next/server";
import { getProfile } from "@/lib/bounties/store";

// GET /api/profiles/:profileId — public profile of someone who posts or does jobs.
export async function GET(_req: Request, ctx: RouteContext<"/api/profiles/[profileId]">) {
  const { profileId } = await ctx.params;
  const profile = /^[a-z0-9-]{1,40}$/.test(profileId) ? getProfile(profileId) : null;
  if (!profile) return NextResponse.json({ message: "We couldn't find that person." }, { status: 404 });
  return NextResponse.json({ profile });
}
