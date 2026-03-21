import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, PlayCircle } from "lucide-react";
import { Demo } from "@/sections/Demo";
import { Purchase } from "@/sections/Purchase";
import { Footer } from "@/sections/Footer";
import { DEFAULT_VIDEO_PRICE_ILS } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default function ModernDancePage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf7f1_0%,#ffffff_38%,#f7fbff_100%)] text-slate-900">
      <section className="relative overflow-hidden px-6 py-10 lg:py-14">
        <div className="absolute inset-0">
          <div className="absolute left-10 top-10 h-64 w-64 rounded-full bg-amber-100/70 blur-3xl" />
          <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>חזרה לעמוד הבית</span>
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                  מודרני פיוז׳ן
                </p>

                <h1 className="max-w-3xl text-[clamp(2rem,6vw,4.5rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-900">
                  <span className="block">שיעור לשיר אהבת השם של בן צור.</span>
                  <span className="mt-2 block text-[0.82em] leading-[1.08] text-slate-700">
                    רמת בינוני מתקדמים
                  </span>
                </h1>
                <p className="max-w-xl text-lg font-medium leading-6 text-slate-600">
                  כדי לצפות בקומבו לחצו ״לצפייה״
                  <br />
                  כדי לרכוש את השיעור בעלות של{" "}
                  <span className="font-bold text-slate-900">45</span> לחצו
                  ״לרכישה״
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition hover:bg-blue-700"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>לצפייה</span>
                </a>
                <a
                  href="#purchase"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-[#ffe08f] px-6 py-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-800 transition hover:border-slate-300 hover:bg-[#f0efeb]"
                >
                  לרכישה לחצו כאן
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Demo />
      <Purchase />
      <Footer />
    </main>
  );
}
