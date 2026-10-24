import { redirect } from "next/navigation";

// Sign-in is handled by Clerk at /sign-in (Google + email/password).
// This keeps any old links to /login working.
export default function LoginPage() {
  redirect("/sign-in");
}
