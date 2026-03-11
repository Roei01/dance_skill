'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api, getApiErrorCode } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuth } = useAuth();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setError(message);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/login', { username, password });
      await refreshAuth();
      router.push('/watch');
    } catch (error: unknown) {
      const code = getApiErrorCode(error);

      if (code === 'INVALID_CREDENTIALS') {
        setError('שם המשתמש או הסיסמה שגויים.');
      } else if (code === 'IP_MISMATCH') {
        setError('אפשר להיכנס לחשבון הזה רק מהמכשיר המקורי.');
      } else if (code === 'TOKEN_EXPIRED') {
        setError('פג תוקף ההתחברות. יש להתחבר מחדש.');
      } else {
        setError('שם המשתמש או הסיסמה שגויים.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden text-right">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-800 p-12 rounded-2xl shadow-2xl border border-slate-700 relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">התחברות</h1>
          <p className="text-slate-400 text-sm font-medium">ברוכה הבאה חזרה.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">שם משתמש</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-5 py-4 bg-slate-700 border border-slate-600 text-white focus:border-blue-500 focus:outline-none transition-colors rounded-xl font-medium"
              placeholder="שם המשתמש שלך"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-700 border border-slate-600 text-white focus:border-blue-500 focus:outline-none transition-colors rounded-xl font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-900/20 border border-red-500/20 text-red-400 text-xs font-bold tracking-wide text-center rounded-lg"
            >
              {error}
            </motion.div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>מאמתים...</span>
              </>
            ) : (
              'להתחברות'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
