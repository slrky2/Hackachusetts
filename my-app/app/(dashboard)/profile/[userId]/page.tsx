import { Suspense } from "react";
import PosterProfileView from "@/components/bounties/PosterProfileView";

// Public profile of any community member. The id is the opaque public
// profile id from a bounty's "Posted by" link, never a Clerk user id.
export default function UserProfilePage({ params }: PageProps<"/profile/[userId]">) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Route params are request-time data under Cache Components. */}
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading profile…</p>}>
          <ProfileFromParams params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function ProfileFromParams({ params }: Pick<PageProps<"/profile/[userId]">, "params">) {
  const { userId } = await params;
  return <PosterProfileView profileId={userId} />;
}
