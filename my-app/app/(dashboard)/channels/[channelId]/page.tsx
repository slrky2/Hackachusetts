// Individual channel view — message thread + member list
interface Props {
  params: { channelId: string };
}

export default function ChannelPage({ params }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Channel: {params.channelId}</h1>
      {/* TODO: render MessageThread and MessageInput */}
    </div>
  );
}
