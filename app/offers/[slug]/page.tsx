"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);

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

  useEffect(() => {
    setActiveVideoIndex(0);
    cardRefs.current = [];
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

  const scrollToVideo = (index: number) => {
    const card = cardRefs.current[index];
    if (!card) {
      return;
    }

    setActiveVideoIndex(index);
    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  };

  const handleCarouselScroll = () => {
    const container = carouselRef.current;
    if (!container || cardRefs.current.length === 0) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;

    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((card, index) => {
      if (!card) {
        return;
      }

      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const distance = Math.abs(cardCenter - containerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveVideoIndex(closestIndex);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#faf7f1_0%,#ffffff_38%,#f7fbff_100%)] text-slate-900">
      <section className="relative overflow-hidden px-4 py-8 sm:px-6 xl:py-12">
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

          <div className="mt-0 grid gap-2 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:items-start xl:gap-8">
            <div className="min-w-0 space-y-6">
              <div className="relative px-2 pb-6 pt-1 md:px-8 md:pb-8 md:pt-1">
                <div className="pointer-events-none absolute left-0 top-0 h-40 w-40 rounded-full bg-amber-100/50 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl" />

                <div className="relative space-y-6 text-right md:pr-0">
                  <div className="w-full space-y-4">
                    <h1 className="max-w-none text-[clamp(2rem,6vw,4.5rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-900">
                      {offer.title}
                    </h1>
                    <p className="mr-0 max-w-xl text-lg font-medium leading-6 text-slate-600">
                      {offer.description}
                    </p>
                  </div>

                  <div>
                    <div className="space-y-6">
                      <div className="w-full space-y-4 text-right">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                          השיעורים הכלולים בחבילה
                        </p>
                        <h2 className="max-w-none text-[clamp(2rem,6vw,4.5rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-900">
                          <span className="block">
                            כל שיעור זמין לצפייה בתקציר
                          </span>
                        </h2>
                        <p className="mr-0 max-w-xl text-lg font-medium leading-6 text-slate-600">
                          אפשר לעבור בין שלושת השיעורים, לראות את התקציר של כל
                          אחד מהם, ואז לחזור לרכישת החבילה כולה.
                        </p>
                      </div>
                    </div>
                    <div
                      id="bundle-videos"
                      className="relative mt-10 -mx-6 sm:-mx-2 lg:mx-0"
                    >
                      <div
                        ref={carouselRef}
                        onScroll={handleCarouselScroll}
                        className="flex gap-3 overflow-x-auto pb-6 pr-3 pl-1 [scrollbar-width:none] snap-x snap-mandatory scroll-px-3 scroll-smooth sm:gap-5 sm:px-2 lg:px-0 [&::-webkit-scrollbar]:hidden"
                      >
                        {offer.videos.map((video, index) => (
                          <div
                            key={video.id}
                            ref={(element) => {
                              cardRefs.current[index] = element;
                            }}
                            className="w-[min(70vw,17.25rem)] shrink-0 snap-start sm:w-[19rem] lg:w-[31.5%]"
                          >
                            <Link
                              href={`/video/${video.slug}`}
                              className="group block h-full overflow-hidden rounded-[1.8rem] border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] ring-1 ring-slate-300/55 transition hover:-translate-y-1 hover:border-slate-300 hover:ring-slate-400/55 hover:shadow-[0_25px_70px_rgba(15,23,42,0.14)]"
                            >
                              <article className="flex h-full flex-col">
                                <div className="relative h-[310px] w-full overflow-hidden sm:h-[340px]">
                                  <Image
                                    src={video.imageUrl}
                                    alt={video.title}
                                    fill
                                    unoptimized
                                    className="object-cover object-center transition duration-500 group-hover:scale-105"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-slate-950/10 to-transparent" />

                                  <div className="absolute inset-x-0 top-3 flex items-center justify-between px-3 min-[294px]:top-4 min-[294px]:px-4">
                                    <div className="font-display inline-flex items-center rounded-full border border-[#f2cf88]/80 bg-[#f2cf88]/92 px-3 py-1.5 text-[10px] font-bold text-slate-950 shadow-lg backdrop-blur min-[294px]:px-4 min-[294px]:py-2 min-[294px]:text-[11px] sm:text-xs">
                                      <span>
                                        {index === 0
                                          ? "חדש בחבילה"
                                          : "זמין לצפייה"}
                                      </span>
                                    </div>
                                    <div className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-white/88 px-2.5 text-[11px] font-black text-slate-900 shadow-md">
                                      {String(index + 1).padStart(2, "0")}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-1 flex-col bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-2.5 text-right min-[294px]:p-3 min-[370px]:p-3.5">
                                  <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700 min-[294px]:text-[11px] min-[294px]:tracking-[0.22em] md:text-xs">
                                    שיעור מלא
                                  </p>
                                  <h2 className="mt-px min-h-[3rem] text-[1.45rem] font-black leading-[0.98] tracking-tight text-slate-900 min-[294px]:text-[1.55rem] min-[370px]:mt-0.5 min-[370px]:text-[1.7rem]">
                                    {video.title}
                                  </h2>
                                  <p className="mt-px h-[3.7rem] overflow-hidden text-[11px] font-normal leading-[1.35] text-slate-600 min-[294px]:text-[12px] min-[370px]:mt-1 min-[370px]:text-[13px] min-[370px]:leading-[1.38] md:text-[14px] md:leading-5">
                                    {video.description}
                                  </p>
                                  <div className="font-display mt-1.5 inline-flex items-center gap-1 self-start rounded-full border border-slate-200 bg-slate-950 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition group-hover:bg-slate-800 min-[294px]:gap-1.5 min-[294px]:px-4 min-[294px]:text-[10px] min-[370px]:gap-2 min-[370px]:px-5 min-[370px]:py-2.5 min-[370px]:text-[11px] md:text-xs">
                                    <span>לצפייה בתקציר</span>
                                    <ArrowUpLeft className="h-3.5 w-3.5 min-[294px]:h-4 min-[294px]:w-4" />
                                  </div>
                                </div>
                              </article>
                            </Link>
                          </div>
                        ))}
                      </div>

                      {offer.videos.length > 1 ? (
                        <div className="relative mt-[-1.7rem] px-6 pb-8 pt-3 sm:px-3 lg:px-0">
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(248,250,252,0.88)_34%,rgba(241,245,249,0.92)_68%,rgba(255,255,255,0.78)_100%)] blur-xl" />
                          <div className="relative flex items-center justify-center gap-2">
                            {offer.videos.map((video, index) => {
                              const isActive = index === activeVideoIndex;

                              return (
                                <button
                                  key={`${video.id}-nav`}
                                  type="button"
                                  onClick={() => scrollToVideo(index)}
                                  aria-label={`מעבר לשיעור ${index + 1}`}
                                  aria-pressed={isActive}
                                  className={`h-2.5 rounded-full transition-all duration-300 ${
                                    isActive
                                      ? "w-8 bg-slate-900"
                                      : "w-2.5 bg-slate-300 hover:bg-slate-400"
                                  }`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
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
