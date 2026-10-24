"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // TODO: wire up real authentication here.
    console.log("Sign in attempt", { email });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-emerald-50 px-4 text-zinc-900 dark:from-zinc-950 dark:via-black dark:to-zinc-950 dark:text-zinc-50">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-xl font-black text-white shadow-sm">
            C
          </span>
          <span className="text-2xl font-extrabold tracking-tight">
            City Land
          </span>
        </Link>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <h1 className="mb-6 text-center text-xl font-bold">Sign in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-zinc-800"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-white/15 dark:bg-zinc-800"
              />
            </label>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-95"
            >
              Sign in with email and password
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
            <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
            <span>or</span>
            <span className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          </div>

          <Link
            href="/sign-up"
            className="flex w-full items-center justify-center rounded-full border border-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-50 active:scale-95 dark:hover:bg-emerald-500/10"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
