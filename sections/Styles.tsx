"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Clock3 } from "lucide-react";
import { type VideoCardRecord } from "@/lib/video-types";
import { getCachedVideoCards } from "@/lib/client-video-cache";

export const Styles = () => {
  const [videos, setVideos] = useState<VideoCardRecord[]>([]);

  useEffect(() => {
    let cancelled = false;

    void getCachedVideoCards()
      .then((response) => {
        if (!cancelled) {
          setVideos(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVideos([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      id="styles"
      className="relative overflow-hidden bg-slate-50 py-6 text-slate-900 md:py-8"
    >
      <div className="mx-auto max-w-7xl px-4 min-[294px]:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center md:mb-12"
        >
          <p className="text-[15px] font-normal leading-7 text-slate-600 min-[360px]:text-base sm:text-lg sm:leading-8">
            מאז שהתחלתי לרקוד, חלמתי לחלוק את התשוקה שלי עם כולם.
            <span className="hidden sm:inline">
              <br />
            </span>{" "}
            לאורך השנים, הרבה תלמידים ביקשו ללמוד את הכוריאוגרפיות שלי,
            <span className="hidden sm:inline">
              <br />
            </span>{" "}
            אבל לא תמיד יכולתי להגיע אליהם.
          </p>
          <p className="mt-3 text-[15px] font-normal leading-7 text-slate-600 min-[360px]:text-base sm:mt-4 sm:text-lg sm:leading-8">
            הגיע הזמן לתת לכולם את ההזדמנות לרקוד איתי, בקצב שלכם,
            <span className="hidden sm:inline">
              <br />
            </span>{" "}
            בכל מקום ובכל זמן.
            <span className="block">בשם השם נעשה ונצליח. 🙏🏻</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto mb-6 max-w-6xl md:mb-8"
        >
          <Link
            href="/bundle"
            className="group block overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,247,221,0.95),rgba(255,255,255,0.96),rgba(239,246,255,0.92))] p-6 text-right shadow-[0_20px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,23,42,0.12)] md:p-8"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-700">
                  הצעה מיוחדת באתר
                </p>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 md:text-4xl">
                  כל 3 השיעורים ב-99 ש"ח
                </h3>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-900/10 bg-white/90 px-4 py-2 text-sm font-bold text-slate-900 shadow-sm">
                <span>לצפייה בחבילה</span>
                <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 md:gap-6">
          {videos.map((video, i) => {
            return (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="min-w-0"
              >
                <Link
                  href={`/video/${video.slug}`}
                  className="group block h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] transition hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.14)]"
                >
                  <div className="relative aspect-[11/14] min-[294px]:aspect-[5/6] min-[600px]:aspect-[5/6]">
                    <Image
                      src={video.imageUrl}
                      alt={video.title}
                      fill
                      priority={i === 0}
                      unoptimized
                      sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 50vw"
                      className="object-cover object-center transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                    <div className="absolute inset-x-0 top-3 flex justify-center min-[294px]:top-4">
                      <div className="font-display inline-flex items-center rounded-full border border-[#f2cf88]/80 bg-[#f2cf88]/92 px-3 py-1.5 text-[10px] font-bold text-slate-950 shadow-lg backdrop-blur min-[294px]:px-4 min-[294px]:py-2 min-[294px]:text-[11px] sm:text-xs">
                        <span>{i === 0 ? "חדש באתר" : "עכשיו באתר"}</span>
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-2 min-[294px]:p-2.5 min-[370px]:p-3 md:p-4">
                      <div className="rounded-[1.2rem] border border-white/10 bg-black/16 p-2 text-right backdrop-blur-sm min-[294px]:rounded-[1.35rem] min-[294px]:p-2.5 min-[370px]:p-3 md:p-4">
                        <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2cf88] min-[294px]:text-[11px] min-[294px]:tracking-[0.22em] md:text-xs">
                          שיעור מלא זמין
                        </p>
                        <h3 className="mt-1 text-[15px] font-black tracking-tight text-white min-[294px]:text-base min-[370px]:mt-1.5 min-[370px]:text-lg md:text-[1.65rem]">
                          {video.title}
                        </h3>
                        <p className="mt-1 max-w-md text-[11px] font-normal leading-4 text-white/90 min-[294px]:text-[12px] min-[294px]:leading-5 min-[370px]:mt-2 min-[370px]:text-[13px] min-[370px]:leading-5 md:text-[14px] md:leading-6">
                          {video.description}
                        </p>
                        <div className="font-display mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition group-hover:bg-white/18 min-[294px]:gap-1.5 min-[294px]:px-3 min-[294px]:text-[10px] min-[294px]:tracking-[0.16em] min-[370px]:mt-3 min-[370px]:gap-2 min-[370px]:px-4 min-[370px]:py-2 min-[370px]:text-[11px] min-[370px]:tracking-[0.18em] md:px-5 md:py-1 md:text-xs">
                          <span>לצפייה בפרטי השיעור</span>
                          <ArrowUpRight className="h-3.5 w-3.5 min-[294px]:h-4 min-[294px]:w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: videos.length * 0.05 }}
            className="min-w-0"
          >
            <div className="h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="relative aspect-[11/10] min-[294px]:aspect-[12/10] min-[600px]:aspect-[5/6]">
                <Image
                  src="https://myrbdt.b-cdn.net/addition_qzopu3.jpeg"
                  alt="שיעורים מלאים נוספים"
                  fill
                  unoptimized
                  className="object-cover object-[center_80%] grayscale opacity-80 scale-[1.2] translate-y-[6%] min-[600px]:object-[center_26%] min-[600px]:scale-100 min-[600px]:translate-y-0"
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-slate-950/45" />

                <div className="absolute inset-x-0 top-3 flex justify-center min-[294px]:top-4">
                  <div className="font-display inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[10px] font-bold text-slate-700 shadow-lg backdrop-blur min-[294px]:gap-2 min-[294px]:px-4 min-[294px]:py-2 min-[294px]:text-[11px] sm:text-xs">
                    <Clock3 className="h-4 w-4" />
                    <span>יעלה בקרוב</span>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2 min-[294px]:p-2.5 min-[370px]:p-3 md:p-4">
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/12 p-2 text-right backdrop-blur-sm min-[294px]:rounded-[1.35rem] min-[294px]:p-2.5 min-[370px]:p-3 md:p-4">
                    <h3 className="text-sm font-black tracking-tight text-white min-[294px]:text-base min-[370px]:text-lg md:text-[1.6rem]">
                      שיעורים מלאים נוספים
                    </h3>
                    <p className="mt-1 text-[11px] font-normal leading-4 text-white/85 min-[294px]:text-[12px] min-[294px]:leading-5 min-[370px]:mt-2 min-[370px]:text-[13px] min-[370px]:leading-5 md:text-[14px] md:leading-6">
                      שיעורים באורך של 15-30 דקות של כוראוגרפיות מלאות מוכרות
                      וגם חדשות!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
