import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Suspense } from "react";

// Sign-in page powered by Clerk. Shows "Continue with Google" plus
// email/password. The [[...sign-in]] catch-all lets Clerk handle its extra
// steps (e.g. /sign-in/factor-one, /sign-in/sso-callback) on the same route.
export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-4 py-10 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      {/* Brand */}
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-black text-white shadow-sm">
          C
        </span>
        <span className="text-2xl font-extrabold tracking-tight">City Land</span>
      </Link>

      {/* Suspense is required: Clerk reads the URL at runtime and
          `cacheComponents: true` in next.config.ts needs that suspended. */}
      <Suspense>
        <SignIn
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#059669", // emerald-600, matches the rest of the app
              borderRadius: "0.75rem",
            },
          }}
        />
      </Suspense>

      {/* Goes to our custom reset flow at /forgot-password */}
      <Link
        href="/forgot-password"
        className="mt-5 w-full max-w-[400px] rounded-xl border border-emerald-600 bg-white px-4 py-2.5 text-center text-sm font-semibold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 dark:bg-zinc-900 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
      >
        Forgot password?
      </Link>
    </main>
  );
}
