"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Forgot-password page powered by Clerk's useSignIn() hook.
// Clerk has no prebuilt reset component, so this is a custom 3-step flow:
//   1. Enter email  -> Clerk emails a reset code
//   2. Enter code   -> Clerk verifies it
//   3. New password -> user is signed in and sent home
export default function ForgotPasswordPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";
  // After a valid code, Clerk moves the sign-in to "needs_new_password".
  const needsNewPassword = signIn.status === "needs_new_password";

  // Step 1: send the reset code
  async function sendCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const { error: createError } = await signIn.create({ identifier: email });
    if (createError) return setMessage(createError.message);

    const { error } = await signIn.resetPasswordEmailCode.sendCode();
    if (error) return setMessage(error.message);

    setCodeSent(true);
  }

  // Step 2: verify the code
  async function verifyCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) setMessage(error.message);
  }

  // Step 3: set the new password and sign in
  async function submitPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });
    if (error) return setMessage(error.message);

    if (signIn.status !== "complete") {
      // e.g. the account has two-factor auth turned on
      setMessage("Password updated. Please sign in to finish.");
      return;
    }

    await signIn.finalize({
      navigate: async ({ decorateUrl }) => {
        const url = decorateUrl("/");
        if (url.startsWith("http")) window.location.href = url;
        else router.push(url);
      },
    });
  }

  function startOver() {
    signIn.reset();
    setCodeSent(false);
    setCode("");
    setPassword("");
    setMessage(null);
  }

  const inputClass =
    "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-zinc-800";
  const buttonClass =
    "w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60";

  const step = needsNewPassword ? 3 : codeSent ? 2 : 1;
  const heading = {
    1: "Forgot your password?",
    2: "Check your email",
    3: "Set a new password",
  }[step];
  const subheading = {
    1: "Enter your email and we'll send you a reset code.",
    2: `We sent a code to ${email}.`,
    3: "Choose a new password for your account.",
  }[step];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-4 py-10 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      {/* Brand */}
      <Link href="/" className="mb-8 flex items-center justify-center gap-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-black text-white shadow-sm">
          C
        </span>
        <span className="text-2xl font-extrabold tracking-tight">City Land</span>
      </Link>

      {/* Card styled to sit alongside Clerk's sign-in / sign-up cards */}
      <div className="w-full max-w-[400px] rounded-xl border border-black/5 bg-white p-8 shadow-lg dark:border-white/10 dark:bg-zinc-900">
        <h1 className="text-center text-lg font-bold">{heading}</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">{subheading}</p>

        <div className="mt-6">
          {step === 1 && (
            <form onSubmit={sendCode} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Email address</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
                {errors.fields.identifier && (
                  <span className="text-xs text-red-600">
                    {errors.fields.identifier.message}
                  </span>
                )}
              </label>
              <button type="submit" disabled={busy} className={buttonClass}>
                {busy ? "Sending…" : "Send reset code"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={verifyCode} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Reset code</span>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`${inputClass} tracking-widest`}
                />
                {errors.fields.code && (
                  <span className="text-xs text-red-600">
                    {errors.fields.code.message}
                  </span>
                )}
              </label>
              <button type="submit" disabled={busy} className={buttonClass}>
                {busy ? "Checking…" : "Verify code"}
              </button>
              <button
                type="button"
                onClick={startOver}
                className="text-sm font-medium text-emerald-600 hover:underline"
              >
                Use a different email
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={submitPassword} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">New password</span>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
                {errors.fields.password && (
                  <span className="text-xs text-red-600">
                    {errors.fields.password.message}
                  </span>
                )}
              </label>
              <button type="submit" disabled={busy} className={buttonClass}>
                {busy ? "Saving…" : "Reset password"}
              </button>
            </form>
          )}

          {message && (
            <p role="alert" className="mt-4 text-center text-sm text-red-600">
              {message}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Remembered it?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-emerald-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
