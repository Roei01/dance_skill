"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";
import { Footer } from "@/sections/Footer";
import { BundlePurchase } from "@/components/offers/BundlePurchase";
import { type OfferRecord } from "@/lib/offer-types";
import { getCachedOfferBySlug } from "@/lib/client-offer-cache";

type OfferPageProps = {
  params: {
    slug: string;
  };
};

export default function OfferPage({ params }: OfferPageProps) {
  const [offer, setOffer] = useState<OfferRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getCachedOfferBySlug(params.slug)
      .then((response) => {
        if (!cancelled) {
          setOffer(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOffer(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#faf7f1_0%,#ffffff_38%,#f7fbff_100%)] px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-10 w-48 rounded-full bg-slate-200" />
          <div className="h-20 w-2/3 rounded-3xl bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-80 rounded-[2rem] bg-slate-100" />
            <div className="h-80 rounded-[2rem] bg-slate-100" />
            <div className="h-80 rounded-[2rem] bg-slate-100" />
          </div>
        </div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-slate-900">
        <div className="max-w-lg space-y-4">
          <h1 className="text-3xl font-black">החבילה לא נמצאה</h1>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>חזרה לעמוד הבית</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf7f1_0%,#ffffff_38%,#f7fbff_100%)] text-slate-900">
      <section className="relative overflow-hidden px-6 py-8 xl:py-12">
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-amber-100/60 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-slate-300 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>חזרה לעמוד הבית</span>
          </Link>

          <div className="mt-8 grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-[2.2rem] border border-white/70 bg-white/90 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="relative p-6 md:p-8">
                  <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl" />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl" />

                  <div className="relative">
                    <div className="space-y-4">
                      <h1 className="max-w-3xl text-[clamp(2.5rem,6vw,5.4rem)] font-black leading-[0.94] tracking-[-0.06em] text-slate-900">
                        {offer.title}
                      </h1>
                      <p className="max-w-2xl text-[1.02rem] leading-8 text-slate-600 md:text-lg">
                        {offer.description}
                      </p>
                    </div>

                    <div className="mt-8 border-t border-slate-200/80 pt-6">
                      <div className="space-y-6">
                        <div className="space-y-4 text-right">
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                            השיעורים הכלולים בחבילה
                          </p>
                          <h2 className="max-w-none text-[clamp(1.7rem,2.7vw,2.5rem)] font-black leading-[1.14] tracking-[-0.04em] text-slate-900">
                            כל שיעור זמין לצפייה בתקציר לפני הרכישה
                          </h2>
                          <p className="max-w-none text-[0.98rem] leading-8 text-slate-600 md:text-[1rem]">
                            אפשר לעבור בין שלושת השיעורים, לראות את התקציר של כל
                            אחד מהם, ואז לחזור לרכישת החבילה כולה.
                          </p>
                        </div>
                      </div>

                      <div id="bundle-videos" className="mt-8">
                        <div className="mt-4 grid gap-4 min-[560px]:grid-cols-2 xl:grid-cols-3">
                          {offer.videos.map((video) => (
                            <article
                              key={video.id}
                              className="group overflow-hidden rounded-[1.6rem] border border-slate-200/90 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                            >
                              <div className="relative aspect-[4/5] overflow-hidden">
                                <Image
                                  src={video.imageUrl}
                                  alt={video.title}
                                  fill
                                  unoptimized
                                  className="object-cover transition duration-500 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/10 to-transparent" />
                                <div className="absolute inset-x-0 bottom-0 p-4 text-right">
                                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f2cf88]">
                                    שיעור מלא זמין
                                  </p>
                                  <h2 className="mt-1 text-2xl font-black tracking-tight text-white md:text-[1.6rem]">
                                    {video.title}
                                  </h2>
                                </div>
                              </div>
                              <div className="space-y-1.5 p-4 text-right">
                                <p className="text-sm leading-6 text-slate-600">
                                  {video.description}
                                </p>
                                <Link
                                  href={`/video/${video.slug}`}
                                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 transition hover:border-slate-300 hover:bg-white"
                                >
                                  <span>לצפייה בתקציר בעמוד השיעור</span>
                                  <ArrowUpLeft className="h-4 w-4" />
                                </Link>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:sticky xl:top-8">
              <BundlePurchase offer={offer} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
