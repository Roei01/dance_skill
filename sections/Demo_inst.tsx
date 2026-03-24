"use client";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";

const INSTAGRAM_URL =
  "https://www.instagram.com/reel/DVxwwKfiCgU/?igsh=aHJ0eDN3ZWswc28w";
const DEMO_POSTER_URL =
  "https://res.cloudinary.com/ddcdws24e/video/upload/so_0/9F67D997-37AB-423E-9BB1-D12FB8D53455_2_hh0lu8.jpg";

const Demo_inst = () => {
  return (
    <section
      id="demo"
      className="relative overflow-hidden bg-gradient-to-br from-[#f8fbff] via-white to-[#fff4ef] py-12 text-slate-900 md:py-16"
    >
      <div className="absolute inset-0">
        <div className="absolute left-0 top-10 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-orange-100/60 blur-3xl" />
      </div>
      <div className="mx-auto grid max-w-5xl items-center gap-8 px-6 md:gap-10">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 text-center"
        >
          <h2 className="mx-auto max-w-xl text-[clamp(2rem,5vw,4.25rem)] font-black leading-[1.02] tracking-[-0.04em] text-slate-900">
            <span className="block">סרטון מלא של הריקוד</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="relative aspect-[10/16] overflow-hidden rounded-[2rem] border border-white/80 bg-white px-2.5 pb-3 pt-2.5 shadow-[0_30px_80px_rgba(15,23,42,0.14)] transition-transform duration-500 hover:rotate-0 sm:p-2.5">
            <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-slate-900">
              <img
                src={DEMO_POSTER_URL}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-slate-950/20" />
              <div className="relative flex h-full w-full flex-col items-center justify-center px-6 py-8 text-center text-white">
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-[#f9b3d1]"
                >
                  למעבר לאינסטגרם
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-6 top-8 -z-10 h-full w-full rounded-[2rem] border border-blue-100/80 bg-white/40 transform rotate-6" />
        </motion.div>
      </div>
    </section>
  );
};

export { Demo_inst };
