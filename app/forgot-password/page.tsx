"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { api, getApiErrorCode, getApiErrorMessage } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await api.post("/auth/forgot-password", { email });
      setSuccessMessage(response.data.message);
    } catch (error: unknown) {
      const code = getApiErrorCode(error);
      if (code === "RATE_LIMITED") {
        setError(
          getApiErrorMessage(
            error,
            "בוצעו יותר מדי בקשות איפוס. נסה שוב בעוד כמה דקות.",
          ),
        );
      } else {
        setError("לא הצלחנו לשלוח קישור לאיפוס סיסמה. נסה שוב.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="איפוס סיסמה"
      subtitle="אפשר לבקש כאן קישור ליצירת סיסמה חדשה עבור החשבון שלך."
    >
      <div className="mx-auto mt-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-5 text-center text-sm font-medium leading-6 text-slate-600">
            נשלח למייל שלך קישור מאובטח ליצירת סיסמה חדשה. אם קיים אצלנו חשבון עם
            המייל הזה, המייל יישלח תוך רגע.
          </div>

          <div className="space-y-2 text-right">
            <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              כתובת אימייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none md:px-5 md:py-3.5"
              placeholder="name@example.com"
              required
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-base font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>שולחים קישור...</span>
              </>
            ) : (
              "שליחת קישור לאיפוס"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
          >
            חזרה להתחברות
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
