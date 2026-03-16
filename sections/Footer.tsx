export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-right">
        <div className="col-span-2 space-y-8">
          <div
            dir="ltr"
            className="flex flex-col items-start gap-1.5 text-left"
          >
            <span className="text-2xl font-black uppercase tracking-tighter">
              Rotem Baruch
            </span>
            <span className="text-[12px] font-bold tracking-[0.18em] text-white-300">
              dance tutorials
            </span>
          </div>

          <div className="max-w-sm">
            <h4 className="text-blue-500 font-bold text-s mb-4">
              להרשמה לקבלת עדכונים על תכנים חדשים .{" "}
            </h4>
            <div className="flex gap-2">
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

          <p className="text-slate-600 text-xs tracking-wider">
            © {new Date().getFullYear()} Dance Skill. כל הזכויות שמורות.
          </p>
        </div>

        <div>
          <h4 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">
            ניווט
          </h4>
          <ul className="space-y-4 text-sm font-medium text-slate-300">
            {["סגנונות", "רמות", "ביקורות", "בלוג"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="hover:text-blue-500 transition-colors tracking-wide"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">
            האתר
          </h4>
          <ul className="space-y-4 text-sm font-medium text-slate-300">
            {["עלינו", "קריירה", "תמיכה", "תנאים", "פרטיות"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="hover:text-blue-500 transition-colors tracking-wide"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex gap-4 text-slate-500">
            <span className="text-xs uppercase font-bold tracking-widest">
              עקבו אחרינו
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
