"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type BundleOfferBannerProps = {
  className?: string;
};

export function BundleOfferBanner({ className = "" }: BundleOfferBannerProps) {
  return (
    <Link
      href="/bundle"
      className={`group block overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[linear-gradient(135deg,rgba(250,247,241,0.98),rgba(255,250,240,0.96),rgba(247,250,252,0.94))] p-5 text-right shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] md:p-6 ${className}`.trim()}
    >
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full border border-[#ead9b5] bg-[#fff9ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#9a6a18] shadow-sm">
            חבילה מיוחדת
          </span>
          <div className="space-y-1.5">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              כל 3 השיעורים ב-99 ש"ח
            </h3>
            <p className="max-w-xl text-sm leading-6 text-slate-600">
              גישה לכל השיעורים במקום אחד, במחיר מיוחד ובמעבר ישיר לחבילה.
            </p>
          </div>
        </div>

        <div className="font-display inline-flex items-center gap-2 self-start rounded-full border border-[#d7c39a] bg-[#f3d487] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900 shadow-[0_8px_20px_rgba(242,207,136,0.28)] transition group-hover:border-[#ccb178] group-hover:bg-[#efcc74] md:px-5 md:py-2.5 md:text-xs">
          <span>לצפייה בפרטי השיעורים</span>
          <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
