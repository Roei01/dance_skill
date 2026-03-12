import { motion } from "framer-motion";
import { Facebook, Instagram, Music2, Youtube } from "lucide-react";

const socialLinks = [
  {
    href: "https://www.tiktok.com/@rotembaruch._?_r=1&_t=ZS-94Y4j0FFIKl",
    label: "TikTok",
    icon: Music2,
  },
  {
    href: "https://www.instagram.com/rotembaruch._?igsh=MWZncmEwOGplcXQ1aw==",
    label: "Instagram",
    icon: Instagram,
  },
  {
    href: "https://www.youtube.com/@rotembaruch5608",
    label: "YouTube",
    icon: Youtube,
  },
  {
    href: "https://www.facebook.com/share/1C3eYuVg5M/?mibextid=wwXIfr",
    label: "Facebook",
    icon: Facebook,
  },
];

export const Hero = () => {
  return (
    <section className="bg-[#f8f7f4] px-4 py-6 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)]"
      >
        <div className="relative min-h-[82vh] sm:min-h-[70vh] lg:min-h-[82vh]">
          {" "}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/api/video/hero"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-black/15" />
          <div className="relative z-10 flex min-h-[87vh] items-end px-4 py-8 sm:px-6 lg:px-10">
            {" "}
            <div className="max-w-xl text-right text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f7d98f] sm:text-sm">
                שיעור אונליין
              </p>

              <div dir="ltr" className="mt-4 text-left">
                <h1 className="font-black uppercase leading-[0.95] tracking-[-0.05em] text-white">
                  <span className="block text-2xl sm:text-3xl lg:text-4xl">
                    Dance is for everyone.
                  </span>
                  <span className="block text-[#ffe08f] text-4xl sm:text-6xl lg:text-7xl">
                    Everywhere.
                  </span>
                </h1>
              </div>

              <p className="mt-4 max-w-md text-base font-semibold leading-7 text-white/90 sm:text-lg">
                שיעור מחול מודרני ברור, מדויק ומלא השראה.
              </p>
              <div className="mt-8">
                <button
                  onClick={() =>
                    document
                      .getElementById("styles")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-xl bg-[#8fd6ff] px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 shadow-[0_14px_30px_rgba(143,214,255,0.35)] transition hover:bg-[#74cbff]"
                >
                  לצפייה בשיעורים
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
