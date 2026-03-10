import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#fff8f5_0%,#ffffff_45%,#f8fbff_100%)] px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/80 bg-white/95 p-10 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
        <h1 className="text-4xl font-black text-slate-900">Payment Cancelled</h1>
        <p className="mt-4 text-lg font-medium text-slate-600">
          Your payment was cancelled. No charge was made.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/#purchase"
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
