'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck, Smartphone, BadgeDollarSign } from 'lucide-react';
import { api, getApiErrorCode, isNetworkError } from '@/lib/api-client';
import { PaymentErrorCard } from '@/components/errors/PaymentErrorCard';
import { DEFAULT_VIDEO_FEATURES, DEFAULT_VIDEO_PRICE_ILS } from '@/lib/catalog';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const faqItems = [
  {
    question: 'איך מקבלים גישה לשיעור?',
    answer: 'אחרי התשלום יישלח אלייך מייל עם פרטי ההתחברות וקישור מאובטח לצפייה.',
  },
  {
    question: 'אפשר לצפות גם מהטלפון?',
    answer: 'כן. הנגן מותאם למובייל, טאבלט ומחשב ועובד בצורה מלאה בכל המכשירים.',
  },
  {
    question: 'מה קורה אחרי הרכישה?',
    answer: 'התשלום מאושר, פרטי הגישה מוכנים אוטומטית ונשלחים אלייך במייל.',
  },
] as const;

export const Purchase = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!emailPattern.test(email.trim())) {
      setError('נא להזין כתובת אימייל תקינה.');
      return;
    }

    setLoading(true);
    setStatusMessage('מכינים עבורך תשלום מאובטח...');

    try {
      const response = await api.post('/purchase/create', {
        email: email.trim(),
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (error: unknown) {
      const code = getApiErrorCode(error);

      if (code === 'ALREADY_OWNED') {
        setError('השיעור הזה כבר נרכש בעבר. אפשר לבדוק את המייל לקבלת הגישה.');
      } else if (isNetworkError(error)) {
        setError('לא הצלחנו להתחיל את התשלום. נסי שוב.');
      } else {
        setError('לא הצלחנו להתחיל את התשלום. נסי שוב.');
      }
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  return (
    <section id="purchase" className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-orange-50/60 py-24 text-slate-900">
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-pink-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 space-y-6 text-right"
        >
          <span className="mb-4 inline-block rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
            הצעה מיוחדת
          </span>
          <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9] text-slate-900">
            גישה מלאה<br/>
            לשיעור<br/>
            המלא
          </h2>
          <p className="max-w-lg text-xl font-medium leading-snug text-slate-600 md:text-2xl">
            מקבלים גישה מיידית לשיעור המלא, עם צפייה נוחה מכל מקום ובכל זמן.
          </p>
          
          <ul className="mt-8 space-y-3 font-medium text-slate-600">
            {DEFAULT_VIDEO_FEATURES.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md">✓</div>
                {item}
              </li>
            ))}
          </ul>

          <div className="grid gap-4 pt-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800">תשלום מאובטח דרך GreenInvoice</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <BadgeDollarSign className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800">אחריות שביעות רצון ל־7 ימים</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm">
              <Smartphone className="h-5 w-5 text-rose-500" />
              <p className="mt-3 text-sm font-semibold text-slate-800">צפייה במובייל, טאבלט או מחשב</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-10 text-center shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl"
        >
          <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 bg-orange-200 blur-[100px] opacity-70" />
          
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">תשלום חד־פעמי</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl font-black tracking-tighter text-slate-900">₪{DEFAULT_VIDEO_PRICE_ILS}</span>
              <span className="text-2xl font-bold text-slate-400 line-through decoration-2 decoration-rose-400">₪360</span>
            </div>
          </div>

          <form onSubmit={handlePurchase} className="space-y-4">
            <div className="space-y-1 text-right">
              <label htmlFor="email" className="mr-1 block text-xs font-bold uppercase tracking-wider text-slate-500">כתובת אימייל</label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-medium text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-400 focus:outline-none"
              />
            </div>

            {error ? (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <PaymentErrorCard message={error} />
              </motion.div>
            ) : null}
            
            {statusMessage ? (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold uppercase tracking-wide text-emerald-600"
              >
                {statusMessage}
              </motion.div>
            ) : null}

            <button
              disabled={loading}
              className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-5 text-lg font-black text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
            >
              <span className="relative z-10">
                {loading ? 'מכינים תשלום מאובטח...' : 'להמשך רכישה'}
              </span>
              {loading && <Loader2 className="w-5 h-5 animate-spin relative z-10" />}
            </button>
          </form>
          
          <div className="mt-6 flex justify-center gap-4 transition-all duration-300">
             <span className="text-xs font-bold uppercase tracking-wider text-slate-400">תשלום מאובטח דרך GreenInvoice</span>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 mx-auto mt-16 max-w-5xl px-6">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <h3 className="text-2xl font-black text-slate-900">שאלות נפוצות</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {faqItems.map((item) => (
              <div key={item.question} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <p className="text-base font-bold text-slate-800">{item.question}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
