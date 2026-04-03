"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";

const Demo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleOpenFullscreen = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    try {
      if (video.requestFullscreen) {
        await video.requestFullscreen();
        return;
      }

      (
        video as HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        }
      ).webkitEnterFullscreen?.();
    } catch {
      // Ignore fullscreen failures and keep the inline player available.
    }
  };

  const handleStartPlayback = async () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    try {
      setIsStarting(true);
      await video.play();
      setHasStarted(true);
    } catch {
      // If autoplay-like play fails, keep native controls available.
    } finally {
      setIsStarting(false);
    }
  };

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
          <div className="relative aspect-[10/16] overflow-hidden rounded-[2rem] border border-white/80 bg-white px-2.5 pb-5 pt-2.5 shadow-[0_30px_80px_rgba(15,23,42,0.14)] transition-transform duration-500 hover:rotate-0 sm:p-2.5">
            <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-slate-900 pb-1.4 sm:pb-0">
              <button
                type="button"
                onClick={handleOpenFullscreen}
                className="absolute left-3 top-3 z-10 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur transition hover:bg-black/70"
              >
                מסך מלא
              </button>
              <video
                ref={videoRef}
                className="h-full w-full bg-black object-cover"
                src="/api/video/preview"
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                onPlay={() => setHasStarted(true)}
              >
                הדפדפן שלך לא תומך בניגון הווידאו.
              </video>

              {!hasStarted && (
                <button
                  type="button"
                  onClick={handleStartPlayback}
                  className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-t from-black/55 via-black/15 to-black/35 transition hover:bg-black/35"
                  aria-label="ניגון הסרטון"
                >
                  <div className="flex items-center gap-3 rounded-full border border-white/20 bg-black/45 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
                    <PlayCircle className="h-6 w-6" />
                    <span className="text-sm font-bold">
                      {isStarting ? "טוען..." : "לצפייה בסרטון"}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -right-6 top-8 -z-10 h-full w-full rounded-[2rem] border border-blue-100/80 bg-white/40 transform rotate-6" />
        </motion.div>
      </div>
    </section>
  );
};

export { Demo };
