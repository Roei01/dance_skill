"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api, getApiErrorCode, getApiErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { BUSINESS_CONTACT_EMAIL } from "@/lib/business-info";
import { AuthShell } from "@/components/auth/AuthShell";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshAuth } = useAuth();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!username.trim() || !password.trim()) {
      setNotice("יש להתחבר כדי להמשיך.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/login", { username, password });
      await refreshAuth();
      router.push("/watch");
    } catch (error: unknown) {
      const code = getApiErrorCode(error);

      if (code === "INVALID_CREDENTIALS") {
        setError("שם המשתמש או הסיסמה שגויים.");
      } else if (code === "RATE_LIMITED") {
        setError(
          getApiErrorMessage(
            error,
            "בוצעו יותר מדי ניסיונות התחברות. נסה שוב בעוד כמה דקות.",
          ),
        );
      } else if (code === "SESSION_ALREADY_ACTIVE") {
        setError(
          getApiErrorMessage(
            error,
            "לא ניתן להתחבר כעת. כבר יש משתמש אחד מחובר לחשבון הזה.",
          ),
        );
      } else if (code === "TOKEN_EXPIRED") {
        setError("פג תוקף ההתחברות. יש להתחבר מחדש.");
      } else {
        setError("שם המשתמש או הסיסמה שגויים.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="התחברות" subtitle="ברוכים הבאים.">
      <div className="mx-auto mt-6 max-w-2xl">
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 px-5 py-5 text-center">
            <p className="text-sm font-semibold leading-6 text-slate-700">
              לאחר השלמת התשלום יישלחו אלייך למייל שם המשתמש והסיסמה לעמוד
              ההתחברות.
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              אם כבר קיבלת את הפרטים במייל, אפשר להתחבר כאן עם אותם פרטים ולצפות
              בשיעור.
            </p>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              אפשר להיות מחובר לחשבון רק ממכשיר אחד בלבד בכל רגע.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-right">
              <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                שם משתמש
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none md:px-5 md:py-3.5"
                placeholder="שם משתמש "
              />
            </div>

            <div className="space-y-2 text-right">
              <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                סיסמה
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pl-12 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none md:px-5 md:py-3.5 md:pl-14"
                  placeholder="••••••••"
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
          </div>

          <div className="flex items-center justify-start">
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-slate-600 underline underline-offset-4 transition hover:text-slate-900"
            >
              שכחת סיסמה?
            </Link>
          </div>

          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600"
            >
              {error}
            </motion.div>
          ) : null}

          {notice ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700"
            >
              {notice}
            </motion.div>
          ) : null}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 py-4 text-base font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>מאמתים...</span>
              </>
            ) : (
              "להתחברות"
            )}
          </button>

          <p className="text-center text-xs text-slate-500">
            לא קיבלת מייל?{" "}
            <a
              href={`mailto:${BUSINESS_CONTACT_EMAIL}`}
              className="font-semibold text-slate-700 underline underline-offset-4"
            >
              {BUSINESS_CONTACT_EMAIL}
            </a>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
