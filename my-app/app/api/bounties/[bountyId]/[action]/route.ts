import { NextRequest, NextResponse } from "next/server";
import { getActor } from "@/lib/bounties/actor";
import { BountyError, takeStep } from "@/lib/bounties/store";
import { bountyActionSchema } from "@/lib/validators/bounty";

const SIGNED_OUT_MESSAGE = {
  claim: "Sign in to claim this job.",
  done: "Sign in to mark this job done.",
  approve: "Sign in to approve this payout.",
} as const;

// POST /api/bounties/:bountyId/:action — action is claim | done | approve.
// The actor comes from the Clerk session; the store checks they may take the step.
export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/bounties/[bountyId]/[action]">,
) {
  const { bountyId, action } = await ctx.params;
  const step = bountyActionSchema.safeParse(action);
  const id = Number(bountyId);
  if (!step.success || !Number.isInteger(id)) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ message: SIGNED_OUT_MESSAGE[step.data] }, { status: 401 });
  }

  try {
    const bounty = takeStep(actor, id, step.data);
    return NextResponse.json({ bounty });
  } catch (err) {
    if (err instanceof BountyError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    throw err;
  }
}
