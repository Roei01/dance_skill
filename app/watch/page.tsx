'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api, getApiErrorCode } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AuthErrorCard } from '@/components/errors/AuthErrorCard';
import { DEFAULT_VIDEO_ID } from '@/lib/catalog';

function WatchContent() {
  const { access, refreshAuth } = useAuth();
  const [authChecking, setAuthChecking] = useState(true);
  const [error, setError] = useState('');
  const [videoReady, setVideoReady] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        await refreshAuth();
        await api.get(`/video/access/${DEFAULT_VIDEO_ID}`);
      } catch (error: unknown) {
        const code = getApiErrorCode(error);

        if (code === 'PURCHASE_REQUIRED') {
          setError('Access denied. This tutorial requires purchase.');
        } else if (code === 'TOKEN_EXPIRED') {
          setError('Your session expired. Please login again.');
        } else {
          setError('Access denied. This tutorial requires purchase.');
        }
      } finally {
        setAuthChecking(false);
      }
    };

    void checkAccess();
  }, [refreshAuth]);

  const handleVideoError = () => {
    setError('Unable to load video. Please refresh the page.');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && (key === 's' || key === 'p')) {
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const classBreakdown = useMemo(
    () => ['Intro & Warm Up', 'Drills & Foundation', 'Choreography Part 1', 'Choreography Part 2', 'Full Out'],
    []
  );

  if (authChecking) {
    return <LoadingSpinner fullScreen label="Checking your tutorial access..." />;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded-lg shadow-sm">
                  Beginner
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Hip Hop • 45 Mins
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-2 text-white uppercase tracking-tight">Master Dance<br/>Tutorial</h1>
              <p className="text-slate-400 font-medium text-lg">with John Doe</p>
            </motion.div>
            
            {error ? (
              <AuthErrorCard title="Access denied" message={error} />
            ) : (
              <motion.div 
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 group"
              >
                {!videoReady ? (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800" />
                ) : null}
                <video
                  className="w-full h-full object-contain"
                  controls
                  controlsList="nodownload"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  onError={handleVideoError}
                  onLoadedData={() => setVideoReady(true)}
                  src="/api/video/stream/video_001"
                >
                  Your browser does not support the video tag.
                </video>
                
                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white/70 text-[10px] font-bold uppercase tracking-widest pointer-events-none select-none rounded-full backdrop-blur-sm">
                  Protected Content - Dance Skill
                </div>
              </motion.div>
            )}

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Class Breakdown</h3>
              <div className="space-y-2">
                {classBreakdown.map((section, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 transition-colors rounded-xl cursor-pointer group border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded-full text-xs font-bold text-slate-500 group-hover:text-white group-hover:bg-blue-600 transition-colors">{i + 1}</span>
                      <span className="font-bold text-slate-300 group-hover:text-white transition-colors text-sm uppercase tracking-wide">{section}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-400">10:00</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700/50 shadow-lg">
              <h3 className="text-xl font-bold mb-6 text-white uppercase tracking-tight">Instructor</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-700 rounded-full overflow-hidden border-2 border-slate-600">
                  {/* Instructor Image Placeholder */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-500" />
                </div>
                <div>
                  <h4 className="font-bold text-lg leading-none mb-1 text-white">John Doe</h4>
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">World Champion</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium mb-6">
                John has toured with major artists and brings over 15 years of teaching experience. His style focuses on musicality and clean execution.
              </p>
              <button className="w-full py-3 border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest rounded-xl">
                View Profile
              </button>
            </div>
            
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-2xl text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 blur-[50px] pointer-events-none" />
              <h3 className="text-2xl font-black mb-2 text-white uppercase tracking-tight">Go Premium</h3>
              <p className="text-sm font-medium text-blue-100 mb-6 leading-relaxed opacity-90">
                Unlock 1500+ classes and advanced features like loop mode and speed control.
              </p>
              <button className="w-full py-4 bg-white text-blue-600 font-bold text-sm hover:bg-blue-50 transition-colors rounded-xl shadow-md uppercase tracking-wider">
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Watch() {
  const { access } = useAuth();

  return (
    <ProtectedRoute>
      {access.defaultVideo ? (
        <WatchContent />
      ) : (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
          <div className="w-full max-w-xl">
            <AuthErrorCard
              title="Access denied"
              message="Access denied. This tutorial requires purchase."
            />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
