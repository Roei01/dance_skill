"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Clock3 } from "lucide-react";

type StyleCard = {
  name: string;
  image: string;
  description?: string;
  featured?: boolean;
  muted?: boolean;
  comingSoon?: boolean;
  href?: string;
  cta?: string;
  mediaClassName?: string;
  imageClassName?: string;
};

const categories: StyleCard[] = [
  {
    name: "השיעור הפעיל",
    image: "https://myrbdt.b-cdn.net/IMG_2051.jpeg",
    featured: true,
    href: "/modern-dance",
    description: "מחול מודרני עם שילוב של נוכחות, זרימה, טכניקה והבעה.",
    cta: "לצפייה בפרטי השיעור",
    mediaClassName:
      "aspect-[11/14] min-[294px]:aspect-[5/6] min-[600px]:aspect-[5/6]",
    imageClassName:
      "object-cover object-bottom transition duration-500 group-hover:scale-105",
  },
  {
    name: "שיעורים מלאים נוספים",
    image: "https://myrbdt.b-cdn.net/addition_qzopu3.jpeg",
    muted: true,
    comingSoon: true,
    description:
      "שיעורים באורך של 15-30 דקות של כוראוגרפיות מלאות מוכרות וגם חדשות!",
    mediaClassName:
      "aspect-[11/10] min-[294px]:aspect-[12/10] min-[600px]:aspect-[5/6]",
    imageClassName:
      "object-cover object-[center_80%] grayscale opacity-80 scale-[1.2] translate-y-[6%] min-[600px]:object-[center_26%] min-[600px]:scale-100 min-[600px]:translate-y-0",
  },
] as const;

export const Styles = () => {
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
          <p className="text-[15px] font-medium leading-7 text-slate-600 min-[360px]:text-base sm:text-lg sm:leading-8">
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
          <p className="mt-3 text-[15px] font-medium leading-7 text-slate-600 min-[360px]:text-base sm:mt-4 sm:text-lg sm:leading-8">
            הגיע הזמן לתת לכולם את ההזדמנות לרקוד איתי, בקצב שלכם,
            <span className="hidden sm:inline">
              <br />
            </span>{" "}
            בכל מקום ובכל זמן.
            <span className="block">בשם השם נעשה ונצליח. 🙏🏻</span>
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2 md:gap-6">
          {categories.map((style, i) => {
            return (
              <motion.div
                key={style.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="min-w-0"
              >
                {style.href ? (
                  <Link
                    href={style.href}
                    className="group block h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] transition hover:-translate-y-1 hover:shadow-[0_25px_70px_rgba(15,23,42,0.14)]"
                  >
                    <div
                      className={`relative ${style.mediaClassName ?? "aspect-[4/5] md:aspect-[16/10]"}`}
                    >
                      <Image
                        src={style.image}
                        alt={style.name}
                        fill
                        unoptimized
                        priority={Boolean(style.featured)}
                        className={
                          style.imageClassName ??
                          "object-cover object-bottom transition duration-500 group-hover:scale-105"
                        }
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                      <div className="absolute right-3 top-3 rounded-full bg-[#f2cf88] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-950 shadow-lg min-[294px]:right-4 min-[294px]:top-4 min-[294px]:px-3 min-[294px]:text-[11px] min-[294px]:tracking-[0.18em]">
                        עכשיו באתר
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-2.5 min-[294px]:p-3 min-[370px]:p-4 md:p-5">
                        <div className="rounded-[1.3rem] border border-white/10 bg-black/25 p-2.5 text-right backdrop-blur-md min-[294px]:rounded-[1.5rem] min-[294px]:p-3 min-[370px]:p-4 md:p-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f2cf88] min-[294px]:text-[11px] min-[294px]:tracking-[0.22em] md:text-xs">
                            שיעור מלא זמין
                          </p>
                          <h3 className="mt-1 text-base font-black tracking-tight text-white min-[294px]:mt-1.5 min-[294px]:text-lg min-[370px]:mt-2 min-[370px]:text-xl md:text-[1.9rem]">
                            אהבת השם - 20 דק'
                          </h3>
                          <p className="mt-1.5 max-w-md text-[12px] font-medium leading-4 text-white/90 min-[294px]:mt-2 min-[294px]:text-[13px] min-[294px]:leading-5 min-[370px]:mt-3 min-[370px]:text-sm min-[370px]:leading-6 md:text-[15px] md:leading-6">
                            שיעור מודרני פיוז׳ן לשיר אהבת השם
                            <br />
                            של בן צור. (רמת בינוני מתקדמים)
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/12 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-md transition group-hover:bg-white/20 min-[294px]:mt-3 min-[294px]:gap-1.5 min-[294px]:px-3 min-[294px]:text-[10px] min-[294px]:tracking-[0.16em] min-[370px]:mt-4 min-[370px]:gap-2 min-[370px]:px-4 min-[370px]:py-2 min-[370px]:text-[11px] min-[370px]:tracking-[0.18em] md:px-5 md:py-1 md:text-xs">
                            <span>{style.cta}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 min-[294px]:h-4 min-[294px]:w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="h-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                    <div
                      className={`relative ${style.mediaClassName ?? "aspect-[16/10]"}`}
                    >
                      <Image
                        src={style.image}
                        alt={style.name}
                        fill
                        unoptimized
                        className={
                          style.imageClassName ??
                          "object-cover object-bottom grayscale opacity-60"
                        }
                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-slate-950/45" />

                      <div className="absolute inset-x-0 top-3 flex justify-center min-[294px]:top-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/85 px-3 py-1.5 text-[10px] font-bold text-slate-700 shadow-lg backdrop-blur min-[294px]:gap-2 min-[294px]:px-4 min-[294px]:py-2 min-[294px]:text-[11px] sm:text-xs">
                          <Clock3 className="h-4 w-4" />
                          <span>יעלה בקרוב</span>
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-2.5 min-[294px]:p-3 min-[370px]:p-4 md:p-5">
                        <div className="rounded-[1.3rem] border border-white/10 bg-black/15 p-2.5 text-right backdrop-blur-sm min-[294px]:rounded-[1.5rem] min-[294px]:p-3 min-[370px]:p-4 md:p-5">
                          <h3 className="text-sm font-black tracking-tight text-white min-[294px]:text-base min-[370px]:text-lg sm:text-xl md:text-[1.8rem]">
                            {style.name}
                          </h3>
                          <p className="mt-1.5 text-[12px] font-medium leading-4 text-white/85 min-[294px]:mt-2 min-[294px]:text-[13px] min-[294px]:leading-5 min-[370px]:mt-3 min-[370px]:text-sm min-[370px]:leading-6 md:text-[15px] md:leading-6">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
