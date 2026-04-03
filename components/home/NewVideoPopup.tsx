"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

const POPUP_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const POPUP_STORAGE_KEY = "new-video-popup-last-shown-at";

type NewVideoPopupProps = {
  href: string;
};

export function NewVideoPopup({ href }: NewVideoPopupProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const lastShownAt = window.localStorage.getItem(POPUP_STORAGE_KEY);
      const now = Date.now();

      if (lastShownAt) {
        const elapsedMs = now - Number(lastShownAt);
        if (Number.isFinite(elapsedMs) && elapsedMs < POPUP_COOLDOWN_MS) {
          return;
        }
      }

      window.localStorage.setItem(POPUP_STORAGE_KEY, String(now));
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:pb-6">
      <div className="mx-auto max-w-xl">
        <div
          className="absolute inset-x-0 bottom-0 h-70 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.24),rgba(15,23,42,0.10)_58%,transparent_100%)] backdrop-blur-[3px] sm:h-0"
          onClick={() => setOpen(false)}
        />
        <div className="relative w-full max-w-lg overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.94)_55%,rgba(255,245,239,0.96)_100%)] p-4 text-center shadow-[0_24px_60px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70 backdrop-blur-md sm:p-5">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 top-0 h-28 w-28 rounded-full bg-amber-100/60 blur-2xl" />
            <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-blue-100/60 blur-2xl" />
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute left-3 top-3 z-20 rounded-full border border-white/80 bg-white/95 p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="סגירת חלונית"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative z-10">
            <h2 className="mt-3 text-[1.65rem] font-black tracking-tight text-slate-900 sm:text-[1.8rem]">
              כולם גנבים - 30 דק'
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              שיעור חדש עלה עכשיו לאתר ואפשר לעבור אליו ישירות מכאן.
            </p>
          </div>

          <div className="relative z-10 mt-4 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
            <Link
              href={href}
              className="inline-flex min-w-[190px] items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:bg-emerald-600"
            >
              לצפייה בשיעור החדש
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-w-[190px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              אולי אחר כך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
