"use client";
import { motion } from "framer-motion";

const Demo = () => {
  return (
    <section
      id="demo"
      className="py-24 bg-blue-600 text-white relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10 text-left"
        >
          <h2 className="text-5xl md:text-8xl font-black mb-8 leading-[0.9]">
            Not Your
            <br />
            Average
            <br />
            Online
            <br />
            Tutorial
          </h2>
          <p className="text-xl md:text-2xl text-blue-50/90 font-medium max-w-lg leading-snug">
            Our custom tools make your online learning experience just like a
            class at a physical studio – but better.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-12">
            {[
              {
                icon: "📷",
                title: "Camera Mode",
                desc: "Use your webcam as a virtual mirror",
              },
              {
                icon: "🪞",
                title: "Switch Views",
                desc: "Watch from front or back",
              },
              {
                icon: "⏱️",
                title: "Control Speed",
                desc: "Play video at whatever tempo works for you",
              },
              {
                icon: "🔁",
                title: "Loop Moves",
                desc: "Play any section on repeat",
              },
            ].map((feature, i) => (
              <div key={i} className="flex gap-4 text-left">
                <span className="text-3xl bg-white/10 w-12 h-12 flex items-center justify-center rounded-xl">
                  {feature.icon}
                </span>
                <div>
                  <h4 className="font-bold uppercase tracking-wider text-sm mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-blue-100/70 leading-tight">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative"
        >
          {/* Video Frame */}
          <div className="relative aspect-[16/9] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/p1MMaEHyIq8?rel=0&modestbranding=1"
              title="Dance Demo Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full object-cover"
            ></iframe>

            {/* UI Overlay Elements */}
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white">
              Loop Active
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -z-10 top-10 -right-10 w-full h-full border-4 border-white/20 rounded-3xl transform rotate-6" />
        </motion.div>
      </div>
    </section>
  );
};

export { Demo };
