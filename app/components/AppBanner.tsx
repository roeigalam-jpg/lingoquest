'use client';
import { useState, useEffect } from 'react';

export default function AppBanner({ playStoreUrl }: { playStoreUrl?: string }) {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Only show on mobile, not in PWA/standalone
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const wasDismissed = localStorage.getItem('lq_app_banner_dismissed');
    if (isMobile && !isStandalone && !wasDismissed && playStoreUrl) {
      setTimeout(() => setShow(true), 3000); // Show after 3 seconds
    }
  }, [playStoreUrl]);

  if (!show || dismissed || !playStoreUrl) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-3 py-2" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81)', borderBottom: '1px solid rgba(99,102,241,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <div className="flex items-center gap-3 max-w-lg mx-auto" dir="rtl">
        <img src="/icon-192.png" alt="LingoQuest" className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">LingoQuest זמין כאפליקציה!</p>
          <p className="text-[10px] text-slate-400">הורידו בחינם מגוגל פליי</p>
        </div>
        <a href={playStoreUrl} target="_blank" rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
          📥 הורד
        </a>
        <button onClick={() => { setDismissed(true); localStorage.setItem('lq_app_banner_dismissed', 'true'); }}
          className="text-slate-500 text-lg flex-shrink-0 hover:text-white">✕</button>
      </div>
    </div>
  );
}