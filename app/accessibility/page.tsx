import type { Metadata } from "next";
import Link from "next/link";
import {
  BUSINESS_ADDRESS,
  BUSINESS_CONTACT_EMAIL,
  BUSINESS_CONTACT_PHONE,
  BUSINESS_NAME,
} from "@/lib/business-info";

export const metadata: Metadata = {
  title: "הצהרת נגישות | ROTEM BARUCH dance tutorials",
  description: "הצהרת הנגישות של האתר, פרטי קשר ופנייה בנושא נגישות.",
};

const sections = [
  {
    title: "מחויבות לנגישות",
    paragraphs: [
      `${BUSINESS_NAME} פועל כדי לאפשר חוויית גלישה נגישה, מכבדת ונוחה ככל האפשר לכלל המשתמשים, לרבות אנשים עם מוגבלויות.`,
      "נעשים מאמצים שוטפים לשיפור נגישות האתר והתכנים, תוך התאמות במבנה העמודים, בניווט במקלדת, בהודעות מערכת, בקישורים, בטפסים ובקריאות לקוראי מסך.",
    ],
  },
  {
    title: "התאמות שבוצעו באתר",
    paragraphs: [
      "באתר הוטמעו שיפורים כגון תמיכה בניווט מקלדת, סימון פוקוס ברור, שיוך תוויות לשדות טופס, קישורי דילוג לתוכן מרכזי, הודעות שגיאה וסטטוס הניתנות לזיהוי על ידי טכנולוגיות מסייעות, וקישורים ברורים למידע משפטי וליצירת קשר.",
      "האתר נבנה כך שיוכל לשמש במגוון מסכים ומכשירים, לרבות מחשב, טאבלט וטלפון נייד.",
    ],
  },
  {
    title: "תכנים ומגבלות אפשריות",
    paragraphs: [
      "למרות המאמצים המתמשכים, ייתכן שחלק מהתכנים או מהרכיבים באתר עדיין אינם נגישים באופן מיטבי בכל מצב, בכל דפדפן או מול כל טכנולוגיה מסייעת.",
      "אם נתקלת בקושי, נשמח לקבל פנייה ולבחון את הנושא בהקדם האפשרי.",
    ],
  },
  {
    title: "פנייה בנושא נגישות",
    paragraphs: [
      `לשאלות, הערות או בקשות בנושא נגישות ניתן לפנות ל-${BUSINESS_NAME}.`,
      `טלפון: ${BUSINESS_CONTACT_PHONE} | אימייל: ${BUSINESS_CONTACT_EMAIL} | כתובת: ${BUSINESS_ADDRESS}`,
    ],
  },
] as const;

export default function AccessibilityPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-slate-900 sm:px-6 lg:px-10 lg:py-12"
    >
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            נגישות האתר
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            הצהרת נגישות
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            עמוד זה מרכז את עקרונות הנגישות באתר, פרטי יצירת הקשר והדרך
            לפנות אלינו אם נתקלת בקושי בשימוש באתר.
          </p>
          <div className="mt-6">
            <Link href="/" className="font-semibold text-slate-900 underline underline-offset-4">
              חזרה לאתר
            </Link>
          </div>
        </section>

        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] md:p-8"
          >
            <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-base leading-7 text-slate-600">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
