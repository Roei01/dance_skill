import type { Metadata } from "next";
import Link from "next/link";
import {
  BUSINESS_ADDRESS,
  BUSINESS_CONTACT_EMAIL,
  BUSINESS_CONTACT_PHONE,
  BUSINESS_NAME,
  MINIMUM_PURCHASE_AGE,
} from "@/lib/business-info";

export const metadata: Metadata = {
  title: "תקנון ומדיניות | ROTEM BARUCH dance tutorials",
  description: "תקנון האתר, מדיניות פרטיות, אספקה, ביטול ופרטי קשר.",
};

const sections = [
  {
    id: "privacy",
    title: "מדיניות פרטיות",
    paragraphs: [
      "האתר אוסף פרטים שמוזנים על ידי המשתמשים במהלך יצירת קשר, הרשמה או רכישה, לרבות שם מלא, טלפון, כתובת אימייל ופרטי שימוש בסיסיים הנדרשים לצורך תפעול האתר.",
      "המידע נשמר באמצעים מקובלים וסבירים, ומשמש לצורך תפעול האתר, טיפול ברכישות, אספקת גישה לתכנים דיגיטליים, שירות לקוחות, מניעת הונאות ועמידה בדרישות הדין.",
      "האתר אינו מוכר את פרטי המשתמשים לצדדים שלישיים. מידע עשוי להיות מועבר לספקים תפעוליים הנחוצים לצורך סליקה, דיוור, אחסון או תפעול השירות, ורק במידה הנדרשת לכך.",
    ],
  },
  {
    id: "responsibility",
    title: "אחריות",
    paragraphs: [
      "השירות באתר כולל תכני לימוד דיגיטליים בתחום המחול והריקוד. השימוש בתכנים, בתרגילים ובהסברים נעשה באחריות המשתמש בלבד ובהתאם ליכולותיו האישיות, מצבו הבריאותי ושיקול דעתו.",
      "האתר ו/או מי מטעמו לא יהיו אחראים לנזק ישיר או עקיף שייגרם עקב שימוש באתר, בתוכן, בהסתמכות על מידע שמופיע בו, או עקב תקלות שמקורן בגורמים שאינם בשליטת האתר.",
      "במקרה של תקלה טכנית בגישה לתוכן שנרכש, ניתן לפנות לשירות הלקוחות והאתר יעשה מאמץ סביר לטפל בפנייה בזמן סביר.",
    ],
  },
  {
    id: "age",
    title: "הגבלת גיל",
    paragraphs: [
      `רכישה באתר מותרת לבני ${MINIMUM_PURCHASE_AGE} ומעלה בלבד, או למי שרשאי לבצע רכישה בכפוף להסכמה, פיקוח ואחריות של הורה או אפוטרופוס כדין.`,
    ],
  },
  {
    id: "delivery",
    title: "מדיניות אספקת מוצרים ושירותים",
    paragraphs: [
      "המוצר הנמכר באתר הוא מוצר דיגיטלי. לאחר השלמת התשלום ואישורו, הגישה לשיעור נשלחת לכתובת האימייל שהוזנה בעת הרכישה.",
      "ברוב המקרים האספקה מתבצעת באופן מיידי או בתוך זמן קצר ממועד אישור התשלום. במקרים חריגים של בדיקה ידנית, עומס, תקלה טכנית או עיכוב מצד צד שלישי, האספקה עשויה להתעכב עד 24 שעות עסקים.",
      "אם לא התקבלה גישה למוצר בפרק הזמן האמור, יש ליצור קשר באמצעות פרטי ההתקשרות המופיעים באתר.",
    ],
  },
  {
    id: "cancellation",
    title: "מדיניות ביטול",
    paragraphs: [
      "בקשה לביטול עסקה תיעשה בכתב לכתובת האימייל של העסק, תוך ציון שם הרוכש, כתובת האימייל שבאמצעותה בוצעה הרכישה ופרטי ההזמנה ככל שישנם.",
      "מאחר שמדובר במוצר דיגיטלי ובמתן גישה לתוכן מקוון, בקשות ביטול והחזר ייבחנו בהתאם להוראות חוק הגנת הצרכן, תקנותיו והדין החל, ובהתחשב בשאלה אם הגישה כבר נמסרה או נוצלה.",
      "במקרה של חיוב שגוי, אי אספקה או תקלה מהותית בשירות, ניתן לפנות לשירות הלקוחות והפנייה תיבדק באופן ענייני ובתום לב.",
    ],
  },
] as const;

export default function TermsPage() {
  const hasPlaceholders =
    BUSINESS_CONTACT_PHONE.includes("יש לעדכן") ||
    BUSINESS_ADDRESS.includes("יש לעדכן");

  return (
    <main className="min-h-screen bg-[#f8f7f4] px-4 py-8 text-slate-900 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            תקנון ומדיניות
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
            תקנון האתר ומדיניות הרכישה
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            בעמוד זה מופיעים תנאי השימוש, מדיניות הפרטיות, האספקה,
            הביטולים ופרטי ההתקשרות של {BUSINESS_NAME}.
          </p>

          <div className="mt-6 grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-sm font-medium text-slate-600 md:grid-cols-2 md:p-5">
            <p>טלפון ליצירת קשר: {BUSINESS_CONTACT_PHONE}</p>
            <p>אימייל: {BUSINESS_CONTACT_EMAIL}</p>
            <p className="md:col-span-2">כתובת העסק: {BUSINESS_ADDRESS}</p>
            <p>רכישה מותרת מגיל {MINIMUM_PURCHASE_AGE} ומעלה.</p>
            <p>
              לעמוד הרכישה:{" "}
              <Link href="/modern-dance#purchase" className="font-bold underline">
                מעבר לרכישה
              </Link>
            </p>
          </div>

          {hasPlaceholders ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              יש לעדכן מספר טלפון וכתובת עסק אמיתיים לפני הגשת האתר לאישור
              סליקה.
            </div>
          ) : null}
        </section>

        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
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
