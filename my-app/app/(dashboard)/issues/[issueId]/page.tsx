// Issue detail view — map preview, status timeline, upvotes, city response
interface Props {
  params: { issueId: string };
}

export default function IssueDetailPage({ params }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Issue #{params.issueId}</h1>
      {/* TODO: render IssueDetail */}
    </div>
  );
}
