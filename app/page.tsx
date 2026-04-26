'use client';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Lang } from './lib/i18n';
import Landing from './components/Landing';
import Register from './components/Register';
import Verify from './components/Verify';
import Dashboard from './components/Dashboard';

export default function Home() {
  const [screen, setScreen] = useState<'splash'|'landing'|'register'|'verify'|'dashboard'>('splash');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('he');

  useEffect(() => {
    // Show splash for at least 2 seconds
    const splashTimer = setTimeout(() => {
      if (loading) return; // Still loading auth
      setScreen(profile ? 'dashboard' : 'landing');
    }, 2000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
      else { setLoading(false); setTimeout(() => setScreen('landing'), 1500); }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id); }
    });

    return () => clearTimeout(splashTimer);
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) { setProfile(data); setScreen('dashboard'); }
      else { setScreen('register'); }
    } catch { setScreen('register'); }
    setLoading(false);
  };

  const refreshProfile = async () => { if (user) await loadProfile(user.id); };

  // Splash Screen with logo
  if (screen === 'splash' || (loading && screen !== 'dashboard')) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <img src="/splash-logo.png" alt="LingoQuest" className="w-80 h-80 mb-6 animate-pulse rounded-3xl" style={{ filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.5))' }} />
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-3 h-3 rounded-full animate-bounce" style={{ background: '#6366f1', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4">Loading...</p>
    </div>
  );

  return (
    <>
      {screen === 'landing' && <Landing onStart={() => setScreen('register')} lang={lang} setLang={setLang} />}
      {screen === 'register' && (
        <Register
          user={user}
          onRegistered={(p: any) => { setProfile(p); setScreen('dashboard'); }}
          onNeedAuth={() => setScreen('verify')}
          setUser={setUser}
          lang={lang}
          setLang={setLang}
        />
      )}
      {screen === 'verify' && <Verify email={user?.email} onVerified={() => loadProfile(user.id)} />}
      {screen === 'dashboard' && profile && (
        <Dashboard
          profile={profile}
          userId={user.id}
          refreshProfile={refreshProfile}
          lang={lang}
          setLang={setLang}
          onLogout={async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); setScreen('landing'); }}
        />
      )}
    </>
  );
}