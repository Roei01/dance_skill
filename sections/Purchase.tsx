'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

export const Purchase = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/purchase/create', {
        email,
      });

      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="purchase" className="py-24 bg-slate-900 text-white relative">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6 text-left"
        >
          <span className="inline-block py-1.5 px-3 bg-green-400 text-slate-900 text-xs font-bold uppercase tracking-widest rounded-full mb-4">
            Special Offer
          </span>
          <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.9] text-white">
            Unlimited<br/>
            Access<br/>
            Pass
          </h2>
          <p className="text-xl md:text-2xl text-white/85 font-medium max-w-lg leading-snug">
            Get instant access to the complete masterclass. Stream anytime, anywhere, on any device.
          </p>
          
          <ul className="space-y-3 mt-8 text-slate-300 font-medium">
            {['1500+ Online Classes', '10+ Beginner Programs', '150+ Top Instructors'].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-600 flex items-center justify-center rounded-full text-white text-xs font-bold">✓</div>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-slate-800 p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden text-center"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 blur-[100px] opacity-20 pointer-events-none" />
          
          <div className="mb-8">
            <p className="text-slate-500 uppercase tracking-widest text-xs font-bold mb-2">One-time Payment</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-7xl font-black text-white tracking-tighter">₪180</span>
              <span className="text-slate-500 text-2xl line-through font-bold decoration-2 decoration-red-500">₪360</span>
            </div>
          </div>

          <form onSubmit={handlePurchase} className="space-y-4">
            <div className="space-y-1 text-left">
              <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-700 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors rounded-xl font-medium"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/20 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wide text-center rounded-lg"
              >
                {error}
              </motion.div>
            )}
            
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-900/20 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wide text-center rounded-lg"
              >
                Redirecting to payment...
              </motion.div>
            )}

            <button
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg transition-all transform hover:-translate-y-1 shadow-lg rounded-xl flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <span className="relative z-10">{loading ? 'Processing...' : 'Get Started'}</span>
              {loading && <Loader2 className="w-5 h-5 animate-spin relative z-10" />}
            </button>
          </form>
          
          <div className="mt-6 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
             <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Secure Payment</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
