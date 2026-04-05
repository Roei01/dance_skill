"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { api, getApiErrorCode, getApiErrorMessage } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams?.get("token")?.trim() ?? "", [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setValidating(false);
      setValidToken(false);
      setError("קישור האיפוס לא תקין או שפג תוקפו.");
      return;
    }

    let cancelled = false;

    void api
      .get("/auth/reset-password/validate", { params: { token } })
      .then(() => {
        if (!cancelled) {
          setValidToken(true);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setValidToken(false);
          setError("קישור האיפוס לא תקין או שפג תוקפו.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setValidating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password.trim().length < 8) {
      setError("יש להזין סיסמה באורך 8 תווים לפחות.");
      return;
    }

    if (password !== confirmPassword) {
      setError("אימות הסיסמה אינו תואם.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password: password.trim(),
      });
      router.push(
        "/login?message=" +
          encodeURIComponent("הסיסמה עודכנה בהצלחה. אפשר להתחבר עם הסיסמה החדשה."),
      );
    } catch (error: unknown) {
      const code = getApiErrorCode(error);
      if (code === "RESET_TOKEN_INVALID") {
        setError("קישור האיפוס לא תקין או שפג תוקפו.");
      } else {
        setError(
          getApiErrorMessage(error, "לא הצלחנו לעדכן את הסיסמה. נסה שוב."),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="יצירת סיסמה חדשה"
      subtitle="כאן יוצרים סיסמה חדשה לחשבון שלך בצורה מאובטחת."
    >
      <div className="mx-auto mt-6 max-w-2xl">
        {validating ? (
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-8 text-center text-sm font-semibold text-slate-600">
            בודקים את קישור האיפוס...
          </div>
        ) : null}

        {!validating && !validToken ? (
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-5 text-center text-sm font-semibold text-red-600">
              {error}
            </div>
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
              >
                בקשת קישור חדש
              </Link>
            </div>
          </div>
        ) : null}

        {!validating && validToken ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-5 text-center text-sm font-medium leading-6 text-slate-600">
              לאחר שמירת הסיסמה החדשה, יהיה אפשר להתחבר איתה מיד לעמוד השיעורים.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-right">
                <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  סיסמה חדשה
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none md:px-5 md:py-3.5 md:pl-14"
                    placeholder="לפחות 8 תווים"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 transition hover:text-slate-700"
                    aria-label={showPassword ? "הסתרת סיסמה" : "הצגת סיסמה"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-right">
                <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  אימות סיסמה
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none md:px-5 md:py-3.5 md:pl-14"
                    placeholder="הקלדה חוזרת"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showConfirmPassword ? "הסתרת אימות סיסמה" : "הצגת אימות סיסמה"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                {error}
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
                  <span>שומרים סיסמה חדשה...</span>
                </>
              ) : (
                "שמירת סיסמה חדשה"
              )}
            </button>
          </form>
        ) : null}
      </div>
    </AuthShell>
  );
}
