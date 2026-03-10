"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-black text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-4 text-base font-medium text-slate-600">
          Please try again. If the problem continues, contact support.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
