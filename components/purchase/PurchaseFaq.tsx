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
    question: "איך אפשר לצפות בשיעור?",
    answer: "אפשר לצפות דרך הנייד, טאבלט ומחשב ועובד בצורה מלאה בכל המכשירים.",
  },
  {
    question: "מה קורה אחרי הרכישה?",
    answer: "התשלום מאושר, פרטי ההתחברות נשלחים אוטומטית למייל.",
  },
  {
    question: "איך השיעור בנוי?",
    answer:
      "השיעור בנוי שבסוף הסרטון יש הקלטה של הקומבינציה כולה עם הספירות בקצב איטי בינוני רגיל וגם עם המוזיקה.\nאני אלמד בקצב בינוני אבל אם תרגישו שצריכים להאט או להגביר קצב יש לכם את האופציה להעזר בהקלטות בסוף!\nוגם כמובן הפכתי כבר את הוידאו כדי שיהיה לכם נוח :)",
  },
] as const;

export const PurchaseFaq = () => {
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  return (
    <div
      id="faq"
      className="relative z-10 mx-auto mt-10 max-w-5xl px-6 md:mt-16"
    >
      <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:p-8">
        <h2 className="text-2xl font-black text-slate-900">שאלות נפוצות</h2>
        <div className="mt-4 grid gap-3 md:mt-6 md:gap-4 md:grid-cols-3">
          {faqItems.map((item, index) => {
            const isOpen = openQuestion === item.question;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div
                key={item.question}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-right transition hover:border-slate-200 hover:bg-white md:p-5"
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() =>
                    setOpenQuestion((current) =>
                      current === item.question ? null : item.question,
                    )
                  }
                  className="flex w-full items-start justify-between gap-3 text-right"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="text-base font-bold text-slate-800">
                    {item.question}
                  </span>
                  <ChevronDown
                    className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={isOpen ? "mt-3" : "hidden"}
                >
                  <p className="whitespace-pre-line text-sm font-medium leading-6 text-slate-600">
                    {item.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
