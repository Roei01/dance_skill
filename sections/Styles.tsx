"use client";
import { motion } from "framer-motion";

const Styles = () => {
  const categories = [
    {
      name: "Modern Dance",
      image:
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=1000",
      description: "Expression, flow, technique, and emotional movement.",
      featured: true,
    },
    {
      name: "Freestyle",
      image:
        "https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=1000",
      description: "Freedom, rhythm, and personal style on every beat.",
      muted: true,
      comingSoon: true,
    },
    {
      name: "Contemporary",
      image:
        "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?q=80&w=1000",
      description: "Creative choreography with softness, power, and control.",
      muted: true,
      comingSoon: true,
    },
  ];

  return (
    <section
      id="styles"
      className="py-24 bg-slate-50 relative overflow-hidden text-slate-900"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-none text-slate-900">
            Learn A Variety
            <br /> of Dance Styles
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
            Explore multiple genres with a strong focus on modern dance,
            expression, technique, and stage presence.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((style, i) => (
            <motion.div
              key={style.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group flex flex-col items-center"
            >
              <div
                className={`relative w-full aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1 bg-white ${
                  style.featured
                    ? "ring-2 ring-blue-500 shadow-xl md:col-span-2"
                    : "shadow-sm hover:shadow-xl"
                }`}
              >
                <div
                  className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 ${
                    style.muted
                      ? "scale-100 grayscale opacity-55"
                      : "group-hover:scale-105"
                  }`}
                  style={{ backgroundImage: `url(${style.image})` }}
                />
                <div
                  className={`absolute inset-0 transition-colors duration-300 ${
                    style.featured
                      ? "bg-gradient-to-t from-blue-950/70 via-blue-900/10 to-transparent"
                      : style.muted
                        ? "bg-slate-900/25"
                        : "bg-black/0 group-hover:bg-black/10"
                  }`}
                />
                {style.comingSoon && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full border border-white/70 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-700 shadow-lg backdrop-blur">
                      Coming Soon
                    </div>
                  </div>
                )}
                {style.featured && (
                  <div className="absolute top-4 left-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                    Featured
                  </div>
                )}
              </div>

              <h3
                className={`mt-4 text-sm md:text-base font-bold transition-colors tracking-wide text-center ${
                  style.featured
                    ? "text-blue-700"
                    : style.muted
                      ? "text-slate-500"
                      : "text-slate-900 group-hover:text-blue-600"
                }`}
              >
                {style.name}
              </h3>
              <p
                className={`mt-1 max-w-xs text-center text-sm ${style.muted ? "text-slate-400" : "text-slate-500"}`}
              >
                {style.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export { Styles };
