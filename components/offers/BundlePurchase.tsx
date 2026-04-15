"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  TicketPercent,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  api,
  getApiErrorCode,
  getApiErrorMessage,
  isNetworkError,
} from "@/lib/api-client";
import { PaymentErrorCard } from "@/components/errors/PaymentErrorCard";
import { type OfferRecord, type OfferQuoteRecord } from "@/lib/offer-types";
import { getOfferQuote } from "@/lib/client-offer-cache";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUICK_PAYMENT_URL = "https://mrng.to/AyhSygH2e1";
const QUICK_PAYMENT_DISCOUNT_URL = "https://mrng.to/NmMyG22l1r";

type BundlePurchaseProps = {
  offer: OfferRecord;
};

export function BundlePurchase({ offer }: BundlePurchaseProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [quote, setQuote] = useState<OfferQuoteRecord | null>(null);

  const summary = useMemo(() => {
    if (quote?.appliedCode) {
      return quote;
    }

    return {
      offerSlug: offer.slug,
      originalPrice: offer.price,
      finalPrice: offer.price,
      discountAmount: 0,
    };
  }, [offer.price, offer.slug, quote]);

  const quickPaymentUrl = quote?.appliedCode
    ? QUICK_PAYMENT_DISCOUNT_URL
    : QUICK_PAYMENT_URL;

  const validateCustomerFields = () => {
    if (!emailPattern.test(email.trim())) {
      setError("נא להזין כתובת אימייל תקינה.");
      return false;
    }

    if (fullName.trim().length < 2) {
      setError("נא להזין שם מלא.");
      return false;
    }

    if (phone.trim().length < 9) {
      setError("נא להזין מספר טלפון תקין.");
      return false;
    }

    return true;
  };

  const handleApplyDiscount = async () => {
    setError("");
    setStatusMessage("");

    if (!discountCode.trim()) {
      setError("יש להזין קוד קופון כדי לבדוק הנחה.");
      return;
    }

    if (email.trim() && !emailPattern.test(email.trim())) {
      setError("כדי לבדוק קופון אישי יש להזין קודם אימייל תקין.");
      return;
    }

    setQuoteLoading(true);

    try {
      const nextQuote = await getOfferQuote({
        slug: offer.slug,
        email: email.trim() || undefined,
        discountCode: discountCode.trim(),
      });

      setQuote(nextQuote);
      setStatusMessage(nextQuote.message || "קוד ההנחה הופעל בהצלחה.");
    } catch (error: unknown) {
      setQuote(null);
      setError(
        getApiErrorMessage(error, "לא הצלחנו לבדוק את קוד ההנחה. נסי שוב."),
      );
    } finally {
      setQuoteLoading(false);
    }
  };

  const handlePurchase = async (
    event: React.FormEvent | React.MouseEvent,
    method: "credit_card" | "hosted" = "credit_card",
  ) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");

    if (!validateCustomerFields()) {
      return;
    }

    if (!acceptedTerms) {
      setError("יש לאשר את התנאים והתקנון לפני המעבר לתשלום.");
      return;
    }

    setLoading(true);
    setStatusMessage(
      method === "hosted"
        ? "מעבירים אותך לתשלום מהיר..."
        : "מכינים עבורך תשלום מאובטח לחבילה...",
    );

    try {
      if (method === "hosted") {
        window.location.href = quickPaymentUrl;
        return;
      }

      const response = await api.post("/purchase/create", {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        offerSlug: offer.slug,
        discountCode: discountCode.trim() || undefined,
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
        setError("כבר קיימת אצלך גישה לכל הסרטונים שבחבילה הזו.");
      } else if (code === "INVALID_DISCOUNT_CODE") {
        setError("קוד ההנחה לא תקין, לא פעיל או שכבר נוצל.");
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
      id="bundle-purchase"
      className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-6 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl md:p-10"
    >
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 bg-orange-200 blur-[100px] opacity-70" />

      <div className="relative z-10 mb-6 md:mb-8">
        <p className="font-display mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 md:text-xs md:tracking-widest">
          <Sparkles className="h-3.5 w-3.5" />
          תשלום חד-פעמי לחבילה
        </p>
        <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-[2.2rem]">
          {offer.title}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
          {offer.description}
        </p>
      </div>

      <div className="relative z-10 mb-6 rounded-[2rem] border border-slate-200 bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:mb-8 md:p-6">
        <p className="font-display mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 md:text-xs md:tracking-widest">
          גישה מלאה לכל השיעורים
        </p>
        <div className="flex items-baseline justify-center gap-2">
          {summary.originalPrice > summary.finalPrice ? (
            <span className="text-lg font-bold text-slate-400 line-through decoration-1">
              ₪{summary.originalPrice}
            </span>
          ) : null}
          <span className="font-display text-5xl font-black tracking-tight text-slate-900 md:text-6xl">
            ₪{summary.finalPrice}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-slate-500 md:text-base">
          {summary.discountAmount > 0
            ? `כולל הנחה של ₪${summary.discountAmount}`
            : "תשלום חד-פעמי עבור כל הסרטונים שבחבילה"}
        </p>
      </div>

      <form
        onSubmit={handlePurchase}
        className="relative z-10 space-y-3 text-right"
      >
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-right text-sm font-medium text-slate-600">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>לפני המעבר לתשלום יש למלא פרטי לקוח כאן.</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-0.5 text-right">
            <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              שם מלא
            </label>
            <input
              type="text"
              placeholder="שם פרטי ושם משפחה"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
            />
          </div>
          <div className="space-y-0.5 text-right">
            <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              טלפון
            </label>
            <input
              type="tel"
              placeholder="05x-xxx-xxxx"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
            />
          </div>
        </div>

        <div className="space-y-0.5 text-right">
          <label className="mr-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
            אימייל
          </label>
          <input
            type="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5">
          <div className="mb-2 text-right">
            <p className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              קוד קופון
            </p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <TicketPercent className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="קוד קופון חד-פעמי"
                value={discountCode}
                onChange={(event) =>
                  setDiscountCode(event.target.value.toUpperCase())
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pl-11 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 md:px-5 md:py-3.5"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyDiscount}
              disabled={quoteLoading}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-70"
            >
              {quoteLoading ? "בודקים..." : "הפעלת קופון"}
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
          />
          <span className="text-sm font-normal leading-6 text-slate-600">
            אני מאשר/ת את{" "}
            <Link href="/terms" className="font-bold text-slate-900 underline">
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
          onClick={(event) => handlePurchase(event, "hosted")}
          disabled={loading || !acceptedTerms}
          className="font-display relative flex w-full flex-wrap items-center justify-center gap-2.5 overflow-hidden rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:py-3.5 md:text-lg"
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
          type="submit"
          disabled={loading || !acceptedTerms}
          className="font-display relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-4 text-base font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 md:py-5 md:text-lg"
        >
          <span className="relative z-10">
            {loading ? "מכינים תשלום מאובטח..." : "להמשך רכישת החבילה"}
          </span>
          {loading ? (
            <Loader2 className="relative z-10 h-5 w-5 animate-spin" />
          ) : null}
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 transition-all duration-300">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-display text-xs font-bold uppercase tracking-wider">
            תשלום מאובטח דרך GreenInvoice
          </span>
        </div>
      </form>
    </section>
  );
}
