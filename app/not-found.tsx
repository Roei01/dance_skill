export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
        <h1 className="text-3xl font-black text-slate-900">404 - העמוד לא נמצא</h1>
      </div>
    </div>
  );
}
