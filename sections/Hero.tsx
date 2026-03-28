import { motion } from "framer-motion";
import { Instagram, Music2 } from "lucide-react";
import { BUSINESS_NAME } from "@/lib/business-info";

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
];

export const Hero = () => {
  const brandTitle = BUSINESS_NAME.replace(" dance tutorials", "");
  const brandSubtitle = "dance tutorials";

  return (
    <section className="bg-[#f8f7f4] px-4 py-6 text-slate-900 sm:px-6 lg:px-10 lg:py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.10)] xl:max-w-6xl 2xl:max-w-[72rem]"
      >
        <div className="relative h-[600px] min-[478px]:h-auto min-[478px]:aspect-[5/6] min-[638px]:aspect-[5/6] lg:aspect-[4/5] xl:aspect-[5/4] 2xl:aspect-[4/3]">
          {" "}
          <video
            className="hero-video pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
            src="https://myrbdt.b-cdn.net/start.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            tabIndex={-1}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-black/15" />
          <div
            dir="ltr"
            className="absolute left-1/2 top-6 z-20 w-[min(92%,26rem)] -translate-x-1/2 px-4 text-center sm:top-8 sm:px-6"
          >
            <p className="font-display text-sm font-black uppercase tracking-[0.24em] text-white drop-shadow-[0_8px_24px_rgba(15,23,42,0.55)] sm:text-base md:text-lg">
              {brandTitle}
            </p>
            <p className="font-display mt-1 text-[0.68rem] font-semibold tracking-[0.36em] text-[#f7d98f] drop-shadow-[0_6px_18px_rgba(15,23,42,0.45)] sm:text-xs md:text-sm">
              {brandSubtitle}
            </p>
          </div>
          <div className="relative z-10 flex h-full items-end px-6 py-7 sm:px-6 lg:px-10">
            <div className="w-full space-y-6 text-white sm:space-y-0">
              <div
                dir="ltr"
                className="mr-auto max-w-[18rem] self-start text-left sm:absolute sm:bottom-32 sm:left-6 sm:mr-0 sm:max-w-[26rem] lg:bottom-36 lg:left-10 lg:max-w-[34rem]"
              >
                <h1 className="mt-4 font-black uppercase leading-[0.95] tracking-[-0.05em] text-white">
                  <span className="block text-1xl sm:text-3xl lg:text-4xl">
                    Dance is for everyone.
                  </span>
                  <span className="block text-[#ffe08f] text-4xl sm:text-6xl lg:text-7xl">
                    Everywhere.
                  </span>
                </h1>
              </div>

              <div className="ml-auto max-w-md text-right">
                <p className="text-base font-medium leading-7 text-white/90 sm:mt-4 sm:text-lg">
                  פיוז׳ן עם רותם ברוך
                  <br />
                  בואו לרקוד איתי בכל מקום, בכל זמן.
                </p>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      const el = document.getElementById("styles");
                      if (!el) return;

                      const y =
                        el.getBoundingClientRect().top + window.scrollY + 290;
                      window.scrollTo({ top: y, behavior: "smooth" });
                    }}
                    className="rounded-xl bg-[#ffe08f] px-7 py-4 text-sm font-bold uppercase tracking-[0.12em] text-slate-950 shadow-[0_14px_30px_rgba(143,214,255,0.35)] transition hover:bg-[#ffc42b]"
                  >
                    לצפייה בשיעורים
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
