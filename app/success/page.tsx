import Link from "next/link";
import { BUSINESS_CONTACT_EMAIL } from "@/lib/business-info";
import { HostedPurchaseConfirmation } from "@/components/purchase/HostedPurchaseConfirmation";

export const dynamic = "force-dynamic";

type SuccessPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  const email = Array.isArray(searchParams?.email)
    ? searchParams?.email[0]
    : searchParams?.email;
  const method = Array.isArray(searchParams?.method)
    ? searchParams?.method[0]
    : searchParams?.method;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_45%,#fff5ef_100%)] px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/80 bg-white/95 p-10 text-center shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🎉
        </div>
        <h1 className="mt-6 text-4xl font-black text-slate-900">
          התשלום עבר בהצלחה
        </h1>
        <p className="mt-4 text-lg font-medium text-slate-600">
          תודה שרכשת את השיעור.
        </p>
        <p className="mt-3 text-base leading-7 text-slate-500">
          בתוך כמה דקות יישלח אלייך מייל עם פרטי ההתחברות וקישור הגישה.
        </p>

        {email ? (
          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            פרטי ההתחברות נשלחו לכתובת: {email}
          </div>
        ) : null}

        <HostedPurchaseConfirmation email={email} method={method} />

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-600">
          אם לא קיבלת מייל בתוך 5 דקות, כדאי לבדוק גם בספאם או ליצור קשר.
        </div>

        <p className="mt-4 text-sm text-slate-500">
          ליצירת קשר:{" "}
          <a
            href={`mailto:${BUSINESS_CONTACT_EMAIL}`}
            className="font-semibold text-slate-700 underline underline-offset-4"
          >
            {BUSINESS_CONTACT_EMAIL}
          </a>
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/login"
            className="rounded-2xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            לעמוד ההתחברות
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-300"
          >
            חזרה לעמוד הבית
          </Link>
        </div>
      </div>
    </main>
  );
}
