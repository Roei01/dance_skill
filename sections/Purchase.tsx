"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  Smartphone,
  BadgeDollarSign,
} from "lucide-react";
import {
  api,
  getApiErrorCode,
  getApiErrorMessage,
  isNetworkError,
} from "@/lib/api-client";
import { PaymentErrorCard } from "@/components/errors/PaymentErrorCard";
import { PurchaseFaq } from "@/components/purchase/PurchaseFaq";
import {
  DEFAULT_VIDEO_PRICE_ILS,
  DEFAULT_VIDEO_SLUG,
  DEFAULT_VIDEO_TITLE,
} from "@/lib/catalog";
import {
  BUSINESS_ADDRESS,
  BUSINESS_CONTACT_EMAIL,
  BUSINESS_CONTACT_PHONE,
  MINIMUM_PURCHASE_AGE,
} from "@/lib/business-info";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PurchaseProps = {
  videoSlug?: string;
  price?: number;
  title?: string;
};

export const Purchase = ({
  videoSlug = DEFAULT_VIDEO_SLUG,
  price = DEFAULT_VIDEO_PRICE_ILS,
  title = DEFAULT_VIDEO_TITLE,
}: PurchaseProps) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handlePurchase = async (
    e: React.FormEvent | React.MouseEvent,
    method: "credit_card" | "hosted" = "credit_card",
  ) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (!emailPattern.test(email.trim())) {
      setError("נא להזין כתובת אימייל תקינה.");
      return;
    }

    if (fullName.trim().length < 2) {
      setError("נא להזין שם מלא.");
      return;
    }

    if (phone.trim().length < 9) {
      setError("נא להזין מספר טלפון תקין.");
      return;
    }

    if (!acceptedTerms) {
      setError("יש לאשר את התנאים והתקנון לפני המעבר לתשלום.");
      return;
    }

    setLoading(true);
    setStatusMessage("מכינים עבורך תשלום מאובטח...");

    try {
      const response = await api.post("/purchase/create", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        videoSlug,
        paymentMethod: method,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: unknown) {
      const code = getApiErrorCode(error);

      if (code === "ALREADY_OWNED") {
        setError("השיעור הזה כבר נרכש בעבר. אפשר לבדוק את המייל לקבלת הגישה.");
      } else if (code === "PAYMENT_TERMINAL_INACTIVE") {
        setError(
          getApiErrorMessage(
            error,
            "אין מסוף סליקה פעיל בחשבון GreenInvoice שמחובר לאתר.",
          ),
        );
      } else if (isNetworkError(error)) {
        setError("לא הצלחנו להתחיל את התשלום. נסי שוב.");
      } else {
        setError(
          getApiErrorMessage(error, "לא הצלחנו להתחיל את התשלום. נסי שוב."),
        );
      }
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  };

  return (
    <section
      id="purchase"
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50/60 py-16 text-slate-900 md:py-24"
    >
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-pink-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 space-y-4 md:space-y-6 text-right"
        >
          <h2 className="text-3xl font-black uppercase tracking-tight leading-[0.95] text-slate-900 sm:text-4xl md:text-7xl md:tracking-tighter md:leading-[0.9]">
            גישה לשיעור המלא
          </h2>
          <p className="max-w-lg text-base font-normal leading-7 text-slate-600 sm:text-lg md:text-2xl md:leading-snug">
            לאחר התשלום מקבלים גישה מיידית לשיעור המלא, עם צפייה נוחה הסברים
            ברורים וקצב למידה נוח, מכל מקום ובכל זמן.
          </p>

          <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3 md:gap-4 md:pt-6">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-3 text-right shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm md:block md:p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 md:h-10 md:w-10">
                <ShieldCheck className="h-4 w-4 text-emerald-600 md:h-5 md:w-5" />
              </div>
              <p className="text-xs font-medium leading-5 text-slate-800 md:mt-3 md:text-sm">
                תשלום מאובטח דרך GreenInvoice
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-3 text-right shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm md:block md:p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-50 md:h-10 md:w-10">
                <Smartphone className="h-4 w-4 text-rose-500 md:h-5 md:w-5" />
              </div>
              <p className="text-xs font-medium leading-5 text-slate-800 md:mt-3 md:text-sm">
                צפייה במובייל, טאבלט או מחשב
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/75 px-3.5 py-3 text-right shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur-sm md:block md:p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 md:h-10 md:w-10">
                <BadgeDollarSign className="h-4 w-4 text-amber-500 md:h-5 md:w-5" />
              </div>
              <p className="text-xs font-medium leading-5 text-slate-800 md:mt-3 md:text-sm">
                אישור תקנון לפני המעבר לתשלום
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 bg-orange-200 blur-[100px] opacity-70" />

          <div className="mb-6 md:mb-8">
            <p className="font-display mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 md:text-xs md:tracking-widest">
              תשלום חד־פעמי
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-display text-5xl font-black tracking-tight text-slate-900 sm:text-6xl md:text-7xl md:tracking-tighter">
                ₪{price}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-500 md:text-base">
              {title}
            </p>
          </div>

          <form onSubmit={handlePurchase} className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right text-sm font-medium text-slate-600">
              לפני המעבר לתשלום יש למלא פרטי לקוח ולאשר את התנאים והתקנון.
            </div>

            <div className="space-y-0.5 text-right">
              <label
                htmlFor="fullName"
                className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                שם מלא
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="שם פרטי ושם משפחה"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
              />
            </div>

            <div className="space-y-0.5 text-right">
              <label
                htmlFor="phone"
                className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                טלפון ליצירת קשר
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="05x-xxx-xxxx"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="rtl"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
              />
            </div>

            <div className="space-y-0.5 text-right">
              <label
                htmlFor="email"
                className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                כתובת אימייל
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
              />
              <span className="text-sm font-normal leading-6 text-slate-600">
                אני מאשר/ת את{" "}
                <Link
                  href="/terms"
                  className="font-bold text-slate-900 underline"
                >
                  התנאים והתקנון
                </Link>{" "}
                ואת{" "}
                <Link
                  href="/terms#privacy"
                  className="font-bold text-slate-900 underline"
                >
                  מדיניות הפרטיות
                </Link>
                .
              </span>
            </label>

            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <PaymentErrorCard message={error} />
              </motion.div>
            ) : null}

            {statusMessage ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-[11px] font-bold uppercase tracking-wide text-emerald-600 md:text-xs"
                role="status"
                aria-live="polite"
              >
                {statusMessage}
              </motion.div>
            ) : null}

            <button
              type="button"
              onClick={(e) => handlePurchase(e, "hosted")}
              disabled={loading || !acceptedTerms}
              className="font-display relative flex w-full flex-wrap items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white py-3 px-4 text-base font-black text-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:py-3.5 md:text-lg"
            >
              <span className="relative z-10 pt-1">תשלום מהיר ב-</span>
              <div className="flex items-center justify-center gap-3">
                <img
                  src="/assets/bit.svg"
                  alt="Bit"
                  className="h-6 w-auto object-contain"
                />
                <img
                  src="/assets/google-pay.svg"
                  alt="Google Pay"
                  className="h-9 w-auto object-contain"
                />
                <img
                  src="/assets/apple-pay.svg"
                  alt="Apple Pay"
                  className="h-9 w-auto object-contain"
                />
              </div>
            </button>

            <button
              disabled={loading || !acceptedTerms}
              className="font-display relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-4 text-base font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:py-5 md:text-lg"
            >
              <span className="relative z-10">
                {loading ? "מכינים תשלום מאובטח..." : "להמשך רכישה"}
              </span>
              {loading && (
                <Loader2 className="w-5 h-5 animate-spin relative z-10" />
              )}
            </button>
          </form>

          <div className="mt-6 flex justify-center gap-4 transition-all duration-300">
            <span className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
              תשלום מאובטח דרך GreenInvoice
            </span>
          </div>
        </motion.div>
      </div>

      <PurchaseFaq />
    </section>
  );
};
