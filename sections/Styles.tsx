"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import modernDanceImage from "../server/assets/IMG_5427.png";

type StyleCard = {
  name: string;
  image: string;
  description?: string;
  featured?: boolean;
  muted?: boolean;
  comingSoon?: boolean;
  href?: string;
  cta?: string;
};

const categories: StyleCard[] = [
  {
    name: "מחול מודרני",
    image: modernDanceImage.src,
    featured: true,
    href: "/modern-dance",
    cta: "לפרטי השיעור",
  },
  {
    name: "פריסטייל",
    image:
      "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=1000",
    muted: true,
    comingSoon: true,
  },
  {
    name: "קונטמפוררי",
    image:
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=1000",
    muted: true,
    comingSoon: true,
  },
] as const;

export const Styles = () => {
  return (
    <section
      id="styles"
      className="relative overflow-hidden bg-slate-50 py-24 text-slate-900"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-black leading-none text-slate-900 md:text-5xl">
            סגנונות ריקוד
            <br /> במקום אחד
          </h2>
          <p className="mx-auto max-w-2xl text-xl font-medium text-slate-600">
            תוכלי להתחיל ממחול מודרני ולהתקדם בהמשך לעוד סגנונות, עם דגש
            על ביטוי, טכניקה ונוכחות.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {categories.map((style, i) => (
            <motion.div
              key={style.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col items-center"
            >
              {style.href ? (
                <Link
                  href={style.href}
                  className={`relative block w-full overflow-hidden rounded-[1.8rem] bg-white ${
                    style.featured
                      ? "ring-1 ring-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
                      : "shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
                  }`}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div
                      className={`absolute inset-0 ${
                        style.muted ? "opacity-55 grayscale" : "opacity-100"
                      }`}
                    >
                      <Image
                        src={style.image}
                        alt={style.name}
                        fill
                        className={`object-cover transition duration-500 ${
                          style.muted ? "scale-100" : "group-hover:scale-105"
                        }`}
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>

                    <div
                      className={`absolute inset-0 transition duration-300 ${
                        style.muted
                          ? "bg-slate-950/30"
                          : "bg-gradient-to-t from-slate-950/60 via-slate-900/15 to-transparent group-hover:from-slate-950/72 group-hover:via-slate-900/28"
                      }`}
                    />

                    {!style.muted && (
                      <div className="absolute inset-0 bg-white/0 backdrop-blur-0 transition duration-300 group-hover:bg-white/5 group-hover:backdrop-blur-[2px]" />
                    )}

                    {style.featured && (
                      <div className="absolute left-4 top-4 rounded-full bg-[#f2cf88] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-950 shadow-lg">
                        מומלץ
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center p-5">
                      <div className="text-center">
                        <h3 className="text-xl font-black tracking-tight text-white md:text-2xl">
                          {style.name}
                        </h3>
                        <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-white/85">
                          {style.description}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition group-hover:bg-white/18">
                          <span>{style.cta}</span>
                          <ArrowUpRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative block w-full overflow-hidden rounded-[1.8rem] bg-white shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <div
                      className={`absolute inset-0 ${
                        style.muted ? "opacity-55 grayscale" : "opacity-100"
                      }`}
                    >
                      <Image
                        src={style.image}
                        alt={style.name}
                        fill
                        className={`object-cover transition duration-500 ${
                          style.muted ? "scale-100" : "group-hover:scale-105"
                        }`}
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="absolute inset-0 bg-slate-950/30" />
                    <div className="absolute inset-0 flex items-center justify-center p-5">
                      <div className="text-center">
                        <h3 className="text-xl font-black tracking-tight text-white md:text-2xl">
                          {style.name}
                        </h3>
                        <p className="mx-auto mt-2 max-w-xs text-sm font-medium leading-6 text-white/85">
                          {style.description}
                        </p>
                      </div>
                    </div>
                    {style.comingSoon && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700 shadow-lg backdrop-blur">
                          בקרוב
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
