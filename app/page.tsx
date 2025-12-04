"use client";

import Link from "next/link";
import { useStore } from "@/app/context/AuthContext";

export default function Home() {
  const { user, loading } = useStore();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-50">
        <div className="text-neutral-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-50">
      <div className="flex flex-col items-center gap-6 px-4 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">KamsPOS</h1>
        <p className="max-w-md text-base text-neutral-300">
          Internal pizzeria point-of-sale for staff. Use the buttons below to sign
          in and enter the touchscreen POS dashboard.
        </p>

        {!user ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="min-w-[220px] rounded-xl bg-emerald-500 px-6 py-3 text-base font-semibold text-black shadow-lg hover:bg-emerald-400 active:scale-95 transition-transform"
            >
              Sign in to Store
            </Link>
            <Link
              href="/signup"
              className="min-w-[220px] rounded-xl border border-neutral-600 px-6 py-3 text-base font-semibold text-neutral-50 hover:bg-neutral-800 active:scale-95 transition-transform"
            >
              Create Store Account
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/select-profile"
              className="min-w-[260px] rounded-2xl bg-emerald-500 px-8 py-4 text-lg font-semibold text-black shadow-lg hover:bg-emerald-400 active:scale-95 transition-transform"
            >
              Select Profile
            </Link>
            <div className="flex items-center gap-3 text-sm text-neutral-300">
              <span>Store Active: {user.email}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
