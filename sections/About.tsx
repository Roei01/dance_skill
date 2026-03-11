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
          className="mb-16 max-w-4xl text-right"
        >
          <h2 className="text-5xl md:text-7xl font-black mb-6 leading-none">
            למידה מסודרת
            <br /> וברורה
            <br /> לכל רמה
          </h2>
          <p className="text-xl md:text-2xl text-slate-500 font-medium leading-tight max-w-2xl">
            בין אם זו ההתחלה שלך ובין אם כבר יש לך בסיס, השיעורים בנויים
            כדי לתת לך מסלול מדויק, נעים ומתקדם.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            level="חדשה לגמרי"
            color="bg-yellow-100" // Soft Yellow
            title="מתחילה מאפס?"
            description="תתחילי עם יסודות ברורים שיבנו קואורדינציה, קצב וביטחון כבר מהשלב הראשון."
          />
          <FeatureCard
            level="מתחילות"
            color="bg-green-100" // Soft Green
            title="יש לך כבר בסיס?"
            description="תעלי רמה עם תנועות חדשות, גרוב, חיבורים נקיים ומשפטי תנועה פשוטים."
          />
          <FeatureCard
            level="ביניים"
            color="bg-emerald-100" // Soft Emerald
            title="מרגישה בטוחה יותר?"
            description="תעמיקי בטכניקה, בביטוי ובכוריאוגרפיות ארוכות ומורכבות יותר."
          />
          <FeatureCard
            level="מתקדמות"
            color="bg-blue-100" // Soft Blue
            title="מחפשת דיוק ברמה גבוהה?"
            description="עבודה עמוקה על מוזיקליות, נוכחות ותנועה מורכבת שמרגישה מקצועית ובוגרת."
          />
        </div>
      </div>
    </section>
  );
};
