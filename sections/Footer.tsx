import { Music2, Instagram } from "lucide-react";

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

export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 text-right">
        <div className="space-y-8">
          <div
            dir="ltr"
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span className="text-2xl font-black uppercase tracking-tighter">
              Rotem Baruch
            </span>
            <span className="text-[12px] font-bold tracking-[0.18em] text-white-300">
              dance tutorials
            </span>
          </div>

          <div className="mx-auto max-w-sm text-center md:flex md:flex-col md:items-center">
            <h4 className="text-blue-500 font-bold text-s mb-4">
              להרשמה לקבלת עדכונים על תכנים חדשים .{" "}
            </h4>
            <div className="flex gap-2 md:justify-center">
              <input
                type="email"
                placeholder="אימייל"
                className="bg-slate-900 border border-slate-800 px-4 py-2 text-white w-full text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 rounded-lg"
              />
              <button className="bg-transparent border border-blue-600 text-blue-500 px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-colors rounded-lg whitespace-nowrap">
                הרשמה
              </button>
            </div>
          </div>

          <p className="text-center text-sm text-slate-500">
            ליצירת קשר שלחו אימייל{" "}
            <a
              href="mailto:rbdtonline@gmail.com"
              className="text-slate-400 hover:text-blue-400 transition-colors underline underline-offset-2"
            >
              rbdtonline@gmail.com
            </a>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="text-xs uppercase font-bold tracking-widest text-blue-400">
              עקבו אחרי
            </span>
            {socialLinks.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/20 text-blue-400 transition hover:border-blue-400 hover:bg-blue-500/30 hover:text-blue-300"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 flex w-full justify-center">
        <ul className="space-y-4 text-sm font-medium text-slate-300 text-center">
          <li>
            <a
              href="/"
              className="hover:text-blue-500 transition-colors tracking-wide"
            >
              בית
            </a>
          </li>
          <li>
            <a
              href="/#styles"
              className="hover:text-blue-500 transition-colors tracking-wide"
            >
              שיעורים מלאים
            </a>
          </li>
          <li>
            <a
              href="/#faq"
              className="hover:text-blue-500 transition-colors tracking-wide"
            >
              שאלות נפוצות
            </a>
          </li>
        </ul>
      </div>
      <p className="mt-16 text-center text-slate-600 text-xs tracking-wider px-6">
        כל הזכויות שמורות © ROTEM BARUCH dance tutorials
      </p>
    </footer>
  );
};
