'use client';
import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    setOffline(!navigator.onLine);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 text-center" style={{ background: 'rgba(239,68,68,0.9)' }}>
      <p className="text-xs font-bold text-white">📡 אין חיבור לאינטרנט - חלק מהמשחקים זמינים אופליין</p>
    </div>
  );
}