"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            <h2 className="text-2xl font-black text-slate-900">
              משהו השתבש
            </h2>
            <button
              onClick={() => reset()}
              className="mt-6 rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              לנסות שוב
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
