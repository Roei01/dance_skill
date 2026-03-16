"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqItems = [
  {
    question: "איך מקבלים גישה לשיעור?",
    answer:
      "אחרי התשלום יישלח אלייך מייל עם פרטי ההתחברות וקישור מאובטח לצפייה.",
  },
  {
    question: "אפשר לצפות גם מהטלפון?",
    answer:
      "כן. הנגן מותאם למובייל, טאבלט ומחשב ועובד בצורה מלאה בכל המכשירים.",
  },
  {
    question: "מה קורה אחרי הרכישה?",
    answer: "התשלום מאושר, פרטי הגישה מוכנים אוטומטית ונשלחים אלייך במייל.",
  },
  {
    question: "איך השיעור בנוי?",
    answer:
      "השיעור בנוי שבסוף הסרטון יש הקלטה של הקומבינציה כולה עם הספירות בקצב איטי בינוני רגיל וגם עם המוזיקה.\nאני אלמד בקצב בינוני אבל אם תרגישו שצריכים להאט או להגביר קצב יש לכם את האופציה להעזר בהקלטות בסוף!\nוגם כמובן הפכתי כבר את הוידאו כדי שיהיה לכם נוח :)",
  },
] as const;

export const PurchaseFaq = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(faqItems[0].question);

  return (
    <div className="relative z-10 mx-auto mt-10 max-w-5xl px-6 md:mt-16">
      <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
        <h3 className="text-2xl font-black text-slate-900">שאלות נפוצות</h3>
        <div className="mt-4 grid gap-3 md:mt-6 md:gap-4 md:grid-cols-3">
          {faqItems.map((item) => (
            <button
              key={item.question}
              type="button"
              onClick={() =>
                setOpenQuestion((current) =>
                  current === item.question ? null : item.question
                )
              }
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-right transition hover:border-slate-200 hover:bg-white md:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-bold text-slate-800">
                  {item.question}
                </p>
                <ChevronDown
                  className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                    openQuestion === item.question ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openQuestion === item.question ? (
                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-6 text-slate-500">
                  {item.answer}
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
