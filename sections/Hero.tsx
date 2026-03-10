import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Facebook, Instagram, Music2, Youtube } from "lucide-react";
import heroImage from "@/server/assets/IMG_3544.jpeg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#fffdf8_0%,#ffffff_40%,#f7faff_100%)] text-slate-900">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(96,165,250,0.16),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(244,114,182,0.12),transparent_26%)]" />
        <div className="absolute inset-y-0 left-[8%] hidden w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent lg:block" />
        <div className="absolute inset-y-0 right-[10%] hidden w-px bg-gradient-to-b from-transparent via-slate-200 to-transparent lg:block" />
        <div className="absolute left-8 top-12 h-24 w-24 rounded-full border border-slate-200/80 bg-white/70 shadow-sm" />
        <div className="absolute bottom-16 right-12 h-40 w-40 rounded-full bg-orange-100/70 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8 text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="flex flex-wrap items-center gap-3"
          ></motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-4xl text-5xl font-black uppercase tracking-[-0.08em] leading-[0.86] text-slate-900 md:text-7xl lg:text-[6.5rem]"
          >
            Dance With
            <span className="block text-blue-600">Presence</span>
            <span className="block">Not Just Steps</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="max-w-2xl text-lg font-medium leading-relaxed text-slate-600 md:text-xl"
          >
            Learn modern dance, musicality, expression, and confidence through a
            class experience that feels artistic, emotional, and alive from the
            very first move.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="grid max-w-2xl gap-4 sm:grid-cols-3"
          >
            {[
              { value: "Modern", label: "Main Focus" },
              { value: "Stage", label: "Presence" },
              { value: "Flow", label: "Technique" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur"
              >
                <div className="text-lg font-black uppercase tracking-tight text-slate-900">
                  {item.value}
                </div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col items-start gap-4 pt-2 sm:flex-row sm:items-center"
          >
            <button
              onClick={() =>
                document
                  .getElementById("purchase")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-2xl bg-slate-900 px-10 py-4 text-lg font-bold text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] transition-all hover:scale-105 hover:bg-blue-600"
            >
              Start Dancing Now
            </button>
            <button
              onClick={() =>
                document
                  .getElementById("demo")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600"
            >
              Watch The Demo
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="relative hidden h-full lg:flex items-center justify-end"
        >
          <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="relative flex w-full max-w-[42rem] items-center justify-end gap-6">
            <div className="relative z-10 w-[14.5rem] -translate-y-10 rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Follow
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://www.tiktok.com/@rotembaruch._?_r=1&_t=ZS-94Y4j0FFIKl"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                >
                  <span>TikTok</span>
                  <Music2 className="h-4 w-4 text-slate-700" />
                </a>
                <a
                  href="https://www.instagram.com/rotembaruch._?igsh=MWZncmEwOGplcXQ1aw=="
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-pink-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md"
                >
                  <span>Instagram</span>
                  <Instagram className="h-4 w-4 text-pink-500" />
                </a>

                <a
                  href="https://www.youtube.com/@rotembaruch5608"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-red-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
                >
                  <span>YouTube</span>
                  <Youtube className="h-4 w-4 text-red-500" />
                </a>

                <a
                  href="https://www.facebook.com/share/1C3eYuVg5M/?mibextid=wwXIfr"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-blue-50 px-4 py-3 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <span>Facebook</span>
                  <Facebook className="h-4 w-4 text-blue-600" />
                </a>
              </div>
            </div>

            <div className="relative w-full max-w-[24rem] overflow-hidden rounded-[2.2rem] border border-white/70 bg-white p-3 shadow-[0_35px_90px_rgba(15,23,42,0.16)]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.7rem] bg-slate-100">
                <Image
                  src={heroImage}
                  alt="Dancer portrait"
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-100">
                    Featured Artist
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-white">
                    Rotem Baruch
                  </h3>
                  <p className="mt-1 text-sm text-white/85">
                    Replace this with a clean professional portrait or a strong
                    movement shot to make the hero feel fully custom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
