import { redirect } from "next/navigation";

// Account creation is handled by Clerk at /sign-up.
// This keeps any old links to /register working.
export default function RegisterPage() {
  redirect("/sign-up");
}
