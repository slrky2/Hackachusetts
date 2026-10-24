// Bounty detail view — requirements, reward, claim button
interface Props {
  params: { bountyId: string };
}

export default function BountyDetailPage({ params }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Bounty #{params.bountyId}</h1>
      {/* TODO: render BountyDetail */}
    </div>
  );
}
