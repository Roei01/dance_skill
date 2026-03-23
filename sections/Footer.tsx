"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Music2, Instagram } from "lucide-react";
import { api, getApiErrorCode, getApiErrorMessage } from "@/lib/api-client";
import {
  BUSINESS_ADDRESS,
  BUSINESS_CONTACT_EMAIL,
  BUSINESS_CONTACT_PHONE,
  BUSINESS_NAME,
  MINIMUM_PURCHASE_AGE,
} from "@/lib/business-info";

const socialLinks = [
  {
    href: "https://www.tiktok.com/@rotembaruch._?_r=1&_t=ZS-94Y4j0FFIKl",
    label: "TikTok",
    icon: Music2,
  },
  {
    href: "https://www.instagram.com/rotembaruch._?igsh=MWZncmEwOGplcXQ1aw==",
    label: "Instagram",
    icon: Instagram,
  },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const handleNewsletterSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setMessageType(null);

    if (!email.trim()) {
      setMessage("נא להזין כתובת אימייל.");
      setMessageType("error");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post("/newsletter/subscribe", {
        email: email.trim(),
      });

      setMessage(response.data.message ?? "נרשמת בהצלחה לדיוור.");
      setMessageType("success");
      setEmail("");
    } catch (error) {
      const code = getApiErrorCode(error);
      const fallbackMessage =
        code === "RATE_LIMITED"
          ? "יש יותר מדי ניסיונות כרגע. נסי שוב בעוד כמה דקות."
          : "לא הצלחנו להשלים את ההרשמה כרגע. נסי שוב.";

      setMessage(getApiErrorMessage(error, fallbackMessage));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-10 text-white sm:py-12">
      <div className="max-w-7xl mx-auto px-6 text-right">
        <div className="space-y-6 sm:space-y-7">
          <div
            dir="ltr"
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span className="text-2xl font-black uppercase tracking-tighter">
              Rotem Baruch
            </span>
            <span className="text-[12px] font-bold tracking-[0.18em] text-white-300">
              dance tutorials
            </span>
          </div>

          <nav aria-label="ניווט תחתון" className="flex w-full justify-center">
            <ul className="space-y-3 text-center text-sm font-medium text-slate-300">
              <li>
                <a
                  href="/"
                  className="hover:text-blue-500 transition-colors tracking-wide"
                >
                  בית
                </a>
              </li>
              <li>
                <a
                  href="/#styles"
                  onClick={(e) => {
                    const el = document.getElementById("styles");
                    if (!el) return;

                    e.preventDefault();
                    const y =
                      el.getBoundingClientRect().top + window.scrollY + 290;
                    window.scrollTo({ top: y, behavior: "smooth" });
                  }}
                  className="hover:text-blue-500 transition-colors tracking-wide"
                >
                  שיעורים מלאים
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  className="hover:text-blue-500 transition-colors tracking-wide"
                >
                  שאלות נפוצות
                </a>
              </li>
            </ul>
          </nav>

          <div className="mx-auto max-w-sm text-center md:flex md:flex-col md:items-center">
            <h4 className="mb-3 text-s font-bold text-blue-500">
              להרשמה לקבלת עדכונים על תכנים חדשים .{" "}
            </h4>
            <form
              onSubmit={handleNewsletterSubmit}
              className="w-full space-y-2.5"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                כתובת אימייל להרשמה לעדכונים
              </label>
              <div className="flex gap-2 md:justify-center">
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="אימייל"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-white placeholder-slate-600 focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="whitespace-nowrap rounded-lg border border-blue-600 bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-wider text-blue-500 transition-colors hover:bg-blue-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "נרשם..." : "הרשמה"}
                </button>
              </div>
              {message ? (
                <p
                  role={messageType === "error" ? "alert" : "status"}
                  aria-live={messageType === "error" ? "assertive" : "polite"}
                  className={`text-center text-xs font-medium ${
                    messageType === "success"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </form>
          </div>

          <p className="text-center text-sm text-slate-500">
            ליצירת קשר שלחו אימייל{" "}
            <a
              href={`mailto:${BUSINESS_CONTACT_EMAIL}`}
              className="text-slate-400 hover:text-blue-400 transition-colors underline underline-offset-2"
            >
              {BUSINESS_CONTACT_EMAIL}
            </a>
          </p>

          <div className="mx-auto grid max-w-3xl gap-4 rounded-[1.75rem] border border-slate-800 bg-slate-900/80 p-5 text-right sm:grid-cols-2">
            <div className="space-y-2 text-sm text-slate-300">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                פרטי העסק
              </p>
              <p>{BUSINESS_NAME}</p>
              <p>טלפון: {BUSINESS_CONTACT_PHONE}</p>
              <p>אימייל: {BUSINESS_CONTACT_EMAIL}</p>
              <p className="leading-6">כתובת: {BUSINESS_ADDRESS}</p>
              <p>רכישה מגיל {MINIMUM_PURCHASE_AGE} ומעלה.</p>
            </div>

            <div className="space-y-2 text-sm text-slate-300">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                מידע משפטי
              </p>
              <Link href="/terms" className="block underline underline-offset-4 hover:text-blue-400">
                תקנון האתר
              </Link>
              <Link href="/terms#privacy" className="block underline underline-offset-4 hover:text-blue-400">
                מדיניות פרטיות
              </Link>
              <Link href="/terms#cancellation" className="block underline underline-offset-4 hover:text-blue-400">
                ביטול עסקה והחזרים
              </Link>
              <Link href="/terms#delivery" className="block underline underline-offset-4 hover:text-blue-400">
                מדיניות אספקה
              </Link>
              <Link href="/terms#responsibility" className="block underline underline-offset-4 hover:text-blue-400">
                אחריות המוצר והשירות
              </Link>
              <Link href="/accessibility" className="block underline underline-offset-4 hover:text-blue-400">
                הצהרת נגישות
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
              עקבו אחרי
            </span>
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/20 text-blue-400 transition hover:border-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 px-6 text-center text-xs tracking-wider text-slate-600 sm:mt-10">
        כל הזכויות שמורות © ROTEM BARUCH dance tutorials
      </p>
    </footer>
  );
};
