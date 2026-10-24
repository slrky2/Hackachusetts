import { SignIn } from "@clerk/nextjs";
import { Suspense } from "react";

// Clerk's prebuilt sign-in. Wrapped in <Suspense> because Clerk reads the
// URL at runtime, which `cacheComponents: true` requires to be suspended.
export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense>
        <SignIn signUpUrl="/sign-up" />
      </Suspense>
    </div>
  );
}
