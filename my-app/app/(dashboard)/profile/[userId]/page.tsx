// Public profile of any community member
interface Props {
  params: { userId: string };
}

export default function UserProfilePage({ params }: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">User {params.userId}</h1>
      {/* TODO: render public UserProfile */}
    </div>
  );
}
