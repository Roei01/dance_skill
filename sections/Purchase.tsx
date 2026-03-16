"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  Smartphone,
  BadgeDollarSign,
} from "lucide-react";
import { api, getApiErrorCode, isNetworkError } from "@/lib/api-client";
import { PaymentErrorCard } from "@/components/errors/PaymentErrorCard";
import { PurchaseFaq } from "@/components/purchase/PurchaseFaq";
import { DEFAULT_VIDEO_FEATURES, DEFAULT_VIDEO_PRICE_ILS } from "@/lib/catalog";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Purchase = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMessage("");

    if (!emailPattern.test(email.trim())) {
      setError("נא להזין כתובת אימייל תקינה.");
      return;
    }

    setLoading(true);
    setStatusMessage("מכינים עבורך תשלום מאובטח...");

    try {
      const response = await api.post("/purchase/create", {
        email: email.trim(),
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: unknown) {
      const code = getApiErrorCode(error);

      if (code === "ALREADY_OWNED") {
        setError("השיעור הזה כבר נרכש בעבר. אפשר לבדוק את המייל לקבלת הגישה.");
      } else if (isNetworkError(error)) {
        setError("לא הצלחנו להתחיל את התשלום. נסי שוב.");
      } else {
        setError("לא הצלחנו להתחיל את התשלום. נסי שוב.");
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
          <span className="mb-2 inline-block rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 md:mb-4 md:px-3 md:py-1.5 md:text-xs md:tracking-widest">
            הצעה מיוחדת
          </span>
          <h2 className="text-3xl font-black uppercase tracking-tight leading-[0.95] text-slate-900 sm:text-4xl md:text-7xl md:tracking-tighter md:leading-[0.9]">
            גישה מלאה
            <br />
            לשיעור
            <br />
            המלא
          </h2>
          <p className="max-w-lg text-base font-medium leading-7 text-slate-600 sm:text-lg md:text-2xl md:leading-snug">
            מקבלים גישה מיידית לשיעור המלא, עם צפייה נוחה מכל מקום ובכל זמן.
          </p>

          <ul className="mt-5 space-y-2 text-sm font-medium text-slate-600 md:mt-8 md:space-y-3 md:text-base">
            {DEFAULT_VIDEO_FEATURES.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-md md:h-6 md:w-6 md:text-xs">
                  ✓
                </div>
                {item}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-3 md:gap-4 md:pt-6">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm md:p-4">
              <ShieldCheck className="h-4 w-4 text-emerald-600 md:h-5 md:w-5" />
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-800 md:mt-3 md:text-sm">
                תשלום מאובטח דרך GreenInvoice
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-3 shadow-sm md:p-4">
              <Smartphone className="h-4 w-4 text-rose-500 md:h-5 md:w-5" />
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-800 md:mt-3 md:text-sm">
                צפייה במובייל, טאבלט או מחשב
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
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 md:text-xs md:tracking-widest">
              תשלום חד־פעמי
            </p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-900 sm:text-6xl md:text-7xl md:tracking-tighter">
                ₪{DEFAULT_VIDEO_PRICE_ILS}
              </span>
              <span className="text-lg font-bold text-slate-400 line-through decoration-2 decoration-rose-400 md:text-2xl">
                80
              </span>
            </div>
          </div>

          <form onSubmit={handlePurchase} className="space-y-4">
            <div className="space-y-1 text-right">
              <label
                htmlFor="email"
                className="mr-1 block text-xs font-bold uppercase tracking-wider text-slate-500"
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
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none md:px-5 md:py-4"
              />
            </div>

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
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-[11px] font-bold uppercase tracking-wide text-emerald-600 md:text-xs"
              >
                {statusMessage}
              </motion.div>
            ) : null}

            <button
              disabled={loading}
              className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-4 text-base font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:py-5 md:text-lg"
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
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              תשלום מאובטח דרך GreenInvoice
            </span>
          </div>
        </motion.div>
      </div>

      <PurchaseFaq />
    </section>
  );
};
