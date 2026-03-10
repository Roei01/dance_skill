"use client";
import { motion } from "framer-motion";

const FeatureCard = ({
  level,
  color,
  title,
  description,
}: {
  level: string;
  color: string;
  title: string;
  description: string;
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`p-8 rounded-3xl ${color} shadow-sm hover:shadow-xl transition-all h-full relative overflow-hidden`}
  >
    <div className="relative z-10 text-slate-900">
      <span className="bg-white/90 px-4 py-1.5 rounded-full text-xs font-bold mb-6 inline-block shadow-sm">
        {level}
      </span>
      <h3 className="text-2xl font-black mb-4 leading-tight">{title}</h3>
      <p className="opacity-80 font-medium leading-relaxed max-w-sm">
        {description}
      </p>
    </div>

    {/* Decorative shape */}
    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-2xl transform rotate-12 pointer-events-none" />
  </motion.div>
);

export const About = () => {
  return (
    <section id="about" className="py-24 bg-white text-slate-900">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 max-w-4xl text-left"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-none">
            Step-by-Step
            <br /> Learning For
            <br /> All Levels
          </h2>
          <p className="text-xl md:text-2xl text-slate-500 font-medium leading-tight max-w-2xl">
            Whether you're just starting out or you've got some training under
            your belt – we got you covered.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            level="Brand New"
            color="bg-yellow-100" // Soft Yellow
            title="Got two left feet?"
            description="Start with our 10-day intro program to build coordination and rhythm from scratch."
          />
          <FeatureCard
            level="Beginner"
            color="bg-green-100" // Soft Green
            title="Got the basics down?"
            description="Level up with new moves, grooves, and simple routines."
          />
          <FeatureCard
            level="Intermediate"
            color="bg-emerald-100" // Soft Emerald
            title="Feel pretty confident?"
            description="Learn more challenging skills and longer pieces of choreography."
          />
          <FeatureCard
            level="Advanced"
            color="bg-blue-100" // Soft Blue
            title="Already killin' it?"
            description="Train with top choreographers in the game and master complex musicality."
          />
        </div>
      </div>
    </section>
  );
};
