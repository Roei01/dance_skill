export const Footer = () => {
  return (
    <footer className="bg-slate-950 text-white py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
        <div className="col-span-2 space-y-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white font-black text-xl flex items-center justify-center rounded-lg">DS</div>
            <span className="text-2xl font-black uppercase tracking-tighter">Dance Skill</span>
          </div>
          
          <div className="max-w-sm">
            <h4 className="text-blue-500 font-bold text-sm mb-2">Subscribe</h4>
            <p className="text-slate-400 text-sm mb-4">Get the latest dance content & news.</p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="Email" 
                className="bg-slate-900 border border-slate-800 px-4 py-2 text-white w-full text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 rounded-lg"
              />
              <button className="bg-transparent border border-blue-600 text-blue-500 px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-colors rounded-lg whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
          
          <p className="text-slate-600 text-xs tracking-wider">
            © {new Date().getFullYear()} Dance Skill. All rights reserved.
          </p>
        </div>
        
        <div>
          <h4 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Explore</h4>
          <ul className="space-y-4 text-sm font-medium text-slate-300">
            {['Styles', 'Levels', 'Reviews', 'Blog'].map(item => (
              <li key={item}><a href="#" className="hover:text-blue-500 transition-colors tracking-wide">{item}</a></li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="text-slate-500 font-bold uppercase text-xs tracking-widest mb-6">Company</h4>
          <ul className="space-y-4 text-sm font-medium text-slate-300">
            {['About Us', 'Careers', 'Support', 'Terms', 'Privacy'].map(item => (
              <li key={item}><a href="#" className="hover:text-blue-500 transition-colors tracking-wide">{item}</a></li>
            ))}
          </ul>
          
          <div className="mt-8 flex gap-4 text-slate-500">
            <span className="text-xs uppercase font-bold tracking-widest">Follow Us</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
