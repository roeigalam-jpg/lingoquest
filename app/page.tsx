'use client';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Lang } from './lib/i18n';
import Landing from './components/Landing';
import Register from './components/Register';
import Verify from './components/Verify';
import Dashboard from './components/Dashboard';

export default function Home() {
  const [screen, setScreen] = useState<'landing'|'register'|'verify'|'dashboard'>('landing');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>('he');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user.id);
      }
    });
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) { setProfile(data); setScreen('dashboard'); }
      else { setScreen('register'); }
    } catch { setScreen('register'); }
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user.id);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg,#0f0c29,#302b63,#24243e)'}}>
      <div className="text-4xl animate-spin">🌍</div>
    </div>
  );

  return (
    <>
      {screen === 'landing' && <Landing onStart={() => setScreen('register')} lang={lang} setLang={setLang} />}
      {screen === 'register' && <Register user={user} onRegistered={(p: any) => { setProfile(p); setScreen('dashboard'); }} onNeedAuth={() => setScreen('verify')} setUser={setUser} lang={lang} setLang={setLang} />}
      {screen === 'verify' && <Verify email={user?.email} onVerified={() => loadProfile(user.id)} />}
      {screen === 'dashboard' && profile && <Dashboard profile={profile} userId={user.id} refreshProfile={refreshProfile} lang={lang} setLang={setLang} onLogout={async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); setScreen('landing'); }} />}
    </>
  );
}