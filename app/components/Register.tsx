'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createProfile, generateReferralCode, calculateTrack, processReferral } from '../lib/api';
import { sounds } from '../lib/sounds';
import { t, Lang } from '../lib/i18n';

export default function Register({ user, onRegistered, onNeedAuth, setUser, lang, setLang }: any) {
  const [mode, setMode] = useState<'quick' | 'email_register' | 'login'>('quick');
  const [form, setForm] = useState({ nickname: '', email: '', birthDate: '', password: '' });
  const [errors, setErrors] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'check_email'>('form');
  const [refCode, setRefCode] = useState<string | null>(null);
  const [nickAvailable, setNickAvailable] = useState<boolean | null>(null);
  const [nickSuggestion, setNickSuggestion] = useState<string | null>(null);
  const [checkingNick, setCheckingNick] = useState(false);
  const isHe = lang === 'he';

  useEffect(() => {
    try { const ref = new URLSearchParams(window.location.search).get('ref'); if (ref) setRefCode(ref); } catch (_) {}
  }, []);

  const update = (f: string, v: string) => {
    setForm(p => ({ ...p, [f]: v }));
    setErrors((p: any) => ({ ...p, [f]: null, general: null }));
    if (f === 'nickname') { setNickAvailable(null); setNickSuggestion(null); }
  };

  // Check nickname availability with debounce
  useEffect(() => {
    if (!form.nickname.trim() || form.nickname.trim().length < 2 || mode === 'login') { setNickAvailable(null); return; }
    const timer = setTimeout(async () => {
      setCheckingNick(true);
      const { data } = await supabase.from('profiles').select('id').eq('nickname', form.nickname.trim());
      const taken = data && data.length > 0;
      setNickAvailable(!taken);
      if (taken) {
        // Suggest alternative
        for (let i = 1; i <= 99; i++) {
          const suggestion = `${form.nickname.trim()}${i}`;
          const { data: d2 } = await supabase.from('profiles').select('id').eq('nickname', suggestion);
          if (!d2 || d2.length === 0) { setNickSuggestion(suggestion); break; }
        }
      } else { setNickSuggestion(null); }
      setCheckingNick(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [form.nickname, mode]);

  const handleReferral = async (newUserId: string) => {
    if (!refCode) return;
    try { await processReferral(newUserId, refCode); } catch (_) {}
  };

  const handleQuickSignup = async () => {
    const e: any = {};
    if (!form.nickname.trim() || form.nickname.trim().length < 2) e.nickname = isHe ? 'לפחות 2 תווים' : 'Min 2 chars';
    if (nickAvailable === false) e.nickname = isHe ? 'השם תפוס! נסה: ' + (nickSuggestion || '') : 'Name taken! Try: ' + (nickSuggestion || '');
    if (!form.birthDate) e.birthDate = isHe ? 'שדה חובה' : 'Required';
    else { const track = calculateTrack(form.birthDate); if (!track) e.birthDate = isHe ? 'גילאי 5-14' : 'Ages 5-14'; }
    if (form.password.length < 6) e.password = isHe ? 'לפחות 6 תווים' : 'Min 6 chars';
    setErrors(e); if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const fakeEmail = `${form.nickname.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}${Date.now()}@lingoquest.game`;
      const { data, error } = await supabase.auth.signUp({ email: fakeEmail, password: form.password });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        const track = calculateTrack(form.birthDate)!;
        const profile = await createProfile(data.user.id, {
          nickname: form.nickname.trim(), email: fakeEmail, birthDate: form.birthDate,
          track, referralCode: generateReferralCode(),
        });
        await handleReferral(data.user.id);
        sounds.gameStart(); onRegistered(profile);
      }
    } catch (err: any) { sounds.wrong(); setErrors({ general: err.message }); }
    setSubmitting(false);
  };

  const handleEmailRegister = async () => {
    const e: any = {};
    if (!form.nickname.trim() || form.nickname.trim().length < 2) e.nickname = isHe ? 'לפחות 2 תווים' : 'Min 2 chars';
    if (nickAvailable === false) e.nickname = isHe ? 'השם תפוס! נסה: ' + (nickSuggestion || '') : 'Name taken!';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = isHe ? 'אימייל לא תקין' : 'Invalid email';
    if (!form.birthDate) e.birthDate = isHe ? 'שדה חובה' : 'Required';
    else { if (!calculateTrack(form.birthDate)) e.birthDate = isHe ? 'גילאי 5-14' : 'Ages 5-14'; }
    if (form.password.length < 6) e.password = isHe ? 'לפחות 6 תווים' : 'Min 6 chars';
    setErrors(e); if (Object.keys(e).length > 0) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        const track = calculateTrack(form.birthDate)!;
        try {
          const profile = await createProfile(data.user.id, {
            nickname: form.nickname.trim(), email: form.email, birthDate: form.birthDate,
            track, referralCode: generateReferralCode(),
          });
          await handleReferral(data.user.id);
          if (data.session) { sounds.gameStart(); onRegistered(profile); } else { setStep('check_email'); }
        } catch (profileErr: any) {
          if (profileErr.message?.includes('duplicate')) {
            const { data: existing } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
            if (existing) { sounds.gameStart(); onRegistered(existing); }
          } else { setErrors({ general: profileErr.message }); }
        }
      }
    } catch (err: any) { sounds.wrong(); setErrors({ general: err.message }); }
    setSubmitting(false);
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) { setErrors({ general: isHe ? 'הכנס כינוי/אימייל וסיסמה' : 'Enter name/email & password' }); return; }
    setSubmitting(true);
    try {
      let loginEmail = form.email;
      if (!form.email.includes('@')) {
        const { data: profiles } = await supabase.from('profiles').select('email').eq('nickname', form.email).limit(1);
        if (profiles && profiles.length > 0) { loginEmail = profiles[0].email; }
        else { setErrors({ general: isHe ? 'משתמש לא נמצא' : 'User not found' }); setSubmitting(false); return; }
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: form.password });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (profile) { sounds.gameStart(); onRegistered(profile); }
      }
    } catch (err: any) { sounds.wrong(); setErrors({ general: err.message }); }
    setSubmitting(false);
  };

  const inputStyle = (f: string) => ({ background: 'rgba(255,255,255,0.06)', border: errors[f] ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' });

  if (step === 'check_email') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md text-center rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} dir={isHe ? 'rtl' : 'ltr'}>
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-black text-white mb-2">{isHe ? 'בדוק את המייל!' : 'Check Email!'}</h2>
        <button onClick={() => window.location.reload()} className="mt-4 px-8 py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{isHe ? 'אימתתי ✅' : 'Verified ✅'}</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <button onClick={() => { sounds.tap(); setLang(isHe ? 'en' : 'he'); }}
        className="absolute top-4 right-4 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: '#a5b4fc' }}>
        {t('lang.switch', lang)}
      </button>

      <div className="w-full max-w-md" dir={isHe ? 'rtl' : 'ltr'}>
        {refCode && mode !== 'login' && (
          <div className="mb-4 rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(99,102,241,0.15))', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="text-2xl mb-1">🎁</div>
            <p className="text-sm font-bold text-white">{isHe ? 'הוזמנת על ידי חבר!' : 'Invited by a friend!'}</p>
            <p className="text-xs text-green-300">{isHe ? '200 מטבעות בונוס בהרשמה! 💰' : '200 bonus Lingos! 💰'}</p>
          </div>
        )}

        <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center mb-5">
            <img src="/icon-192.png" alt="LingoQuest" className="w-16 h-16 rounded-xl mx-auto mb-2" />
            <div className="text-2xl mb-1">{mode === 'login' ? '🔑' : '⚔️'}</div>
            <h2 className="text-2xl font-black text-white">{mode === 'login' ? (isHe ? 'ברוך הבא!' : 'Welcome!') : (isHe ? 'צור את הגיבור שלך' : 'Create Hero')}</h2>
            {mode === 'quick' && <p className="text-xs text-slate-400 mt-1">{isHe ? '⚡ בלי אימייל!' : '⚡ No email!'}</p>}
          </div>

          {errors.general && <p className="text-sm text-red-400 text-center mb-3">{errors.general}</p>}

          <div className="space-y-3">
            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-bold mb-1 text-indigo-300">🎭 {isHe ? 'כינוי' : 'NICKNAME'}</label>
                <input type="text" placeholder={isHe ? 'שם הגיבור...' : 'Hero name...'} value={form.nickname}
                  onChange={e => update('nickname', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={inputStyle('nickname')} maxLength={20} />
                {/* Availability indicator */}
                {form.nickname.trim().length >= 2 && mode !== 'login' && (
                  <div className="mt-1 text-xs">
                    {checkingNick ? <span className="text-slate-400">⏳ {isHe ? 'בודק...' : 'Checking...'}</span> :
                      nickAvailable === true ? <span className="text-green-400">✅ {isHe ? 'השם פנוי!' : 'Available!'}</span> :
                      nickAvailable === false ? (
                        <div>
                          <span className="text-red-400">❌ {isHe ? 'השם תפוס!' : 'Taken!'}</span>
                          {nickSuggestion && (
                            <button onClick={() => update('nickname', nickSuggestion)} className="mr-2 text-indigo-400 hover:text-white underline">
                              {isHe ? `נסה: ${nickSuggestion}` : `Try: ${nickSuggestion}`}
                            </button>
                          )}
                        </div>
                      ) : null}
                  </div>
                )}
                {errors.nickname && <p className="text-xs mt-1 text-red-400">{errors.nickname}</p>}
              </div>
            )}

            {(mode === 'email_register' || mode === 'login') && (
              <div>
                <label className="block text-xs font-bold mb-1 text-indigo-300">{mode === 'login' ? '📧 ' + (isHe ? 'אימייל/כינוי' : 'Email/Name') : '📧 ' + (isHe ? 'אימייל' : 'EMAIL')}</label>
                <input type={mode === 'login' ? 'text' : 'email'} placeholder={mode === 'login' ? (isHe ? 'אימייל או כינוי' : 'Email or name') : 'email@example.com'}
                  value={form.email} onChange={e => update('email', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={inputStyle('email')} dir="ltr" />
                {errors.email && <p className="text-xs mt-1 text-red-400">{errors.email}</p>}
              </div>
            )}

            {mode !== 'login' && (
              <div>
                <label className="block text-xs font-bold mb-1 text-indigo-300">🎂 {isHe ? 'תאריך לידה' : 'BIRTH DATE'}</label>
                <input type="date" value={form.birthDate} onChange={e => update('birthDate', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={{ ...inputStyle('birthDate'), colorScheme: 'dark' }} max={new Date().toISOString().split('T')[0]} dir="ltr" />
                {errors.birthDate && <p className="text-xs mt-1 text-red-400">{errors.birthDate}</p>}
                {form.birthDate && calculateTrack(form.birthDate) && (
                  <div className="mt-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <span className="text-xs font-semibold text-indigo-300">{isHe ? 'מסלול:' : 'Track:'} {calculateTrack(form.birthDate)}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold mb-1 text-indigo-300">🔒 {isHe ? 'סיסמה' : 'PASSWORD'}</label>
              <input type="password" placeholder={isHe ? 'לפחות 6 תווים' : 'Min 6 chars'} value={form.password}
                onChange={e => update('password', e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm" style={inputStyle('password')} dir="ltr" />
              {errors.password && <p className="text-xs mt-1 text-red-400">{errors.password}</p>}
            </div>

            <button onClick={() => { sounds.click(); mode === 'quick' ? handleQuickSignup() : mode === 'email_register' ? handleEmailRegister() : handleLogin(); }}
              disabled={submitting || (mode !== 'login' && nickAvailable === false)}
              className="w-full py-4 rounded-xl text-white font-bold text-base mt-2 transition-all hover:scale-[1.02] disabled:opacity-60"
              style={{ background: submitting ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {submitting ? '⚡ ...' : mode === 'quick' ? (isHe ? '🚀 התחל!' : '🚀 Start!') : mode === 'email_register' ? (isHe ? '⚔️ צור!' : '⚔️ Create!') : (isHe ? '🔑 התחבר' : '🔑 Login')}
            </button>

            <div className="flex flex-col gap-1 pt-2">
              {mode === 'quick' && (<>
                <button onClick={() => { sounds.tap(); setMode('email_register'); setErrors({}); }} className="w-full py-2 text-xs text-indigo-400">{isHe ? '📧 עם אימייל?' : '📧 With email?'}</button>
                <button onClick={() => { sounds.tap(); setMode('login'); setErrors({}); }} className="w-full py-2 text-xs text-slate-500">{isHe ? 'יש חשבון? התחבר' : 'Have account? Login'}</button>
              </>)}
              {mode === 'email_register' && (<>
                <button onClick={() => { sounds.tap(); setMode('quick'); setErrors({}); }} className="w-full py-2 text-xs text-indigo-400">{isHe ? '⚡ הרשמה מהירה' : '⚡ Quick signup'}</button>
                <button onClick={() => { sounds.tap(); setMode('login'); setErrors({}); }} className="w-full py-2 text-xs text-slate-500">{isHe ? 'יש חשבון? התחבר' : 'Login'}</button>
              </>)}
              {mode === 'login' && <button onClick={() => { sounds.tap(); setMode('quick'); setErrors({}); }} className="w-full py-2 text-xs text-indigo-400">{isHe ? 'אין חשבון? הירשם' : 'Register'}</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}