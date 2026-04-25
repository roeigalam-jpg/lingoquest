'use client';
import { useState, useEffect } from 'react';
import { sounds } from '../lib/sounds';
import { t, Lang } from '../lib/i18n';

const TRACKS = [
  { name: 'Explorers', nameHe: 'חוקרים', ages: '5-7', emoji: '🧭' },
  { name: 'Voyagers', nameHe: 'מגלים', ages: '8-11', emoji: '🚀' },
  { name: 'Masters', nameHe: 'מומחים', ages: '12-14', emoji: '👑' },
];

export default function Landing({ onStart, lang, setLang }: { onStart: () => void; lang: Lang; setLang: (l: Lang) => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  const handleStart = () => {
    sounds.gameStart();
    onStart();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      {/* Language Toggle */}
      <button onClick={() => { sounds.tap(); setLang(lang === 'he' ? 'en' : 'he'); }}
        className="absolute top-4 right-4 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
        style={{ background: 'rgba(255,255,255,0.1)', color: '#a5b4fc', border: '1px solid rgba(255,255,255,0.15)' }}>
        {t('lang.switch', lang)}
      </button>

      <div className={`text-center transition-all duration-1000 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        dir={lang === 'he' ? 'rtl' : 'ltr'}>
        <div className="mx-auto mb-8 w-48 h-48">
          <img src="/splash-logo.png" alt="LingoQuest" className="w-full h-full rounded-3xl" style={{ boxShadow: '0 0 60px rgba(99,102,241,0.5)' }} />
        </div>
        <p className="text-lg mb-1 font-semibold text-indigo-300">{t('landing.subtitle', lang)}</p>
        <p className="text-sm mb-10 text-slate-400">{t('landing.desc', lang)}</p>
        <button onClick={handleStart}
          className="group px-10 py-4 rounded-2xl text-white font-bold text-lg overflow-hidden relative transition-all hover:-translate-y-1 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 25px rgba(99,102,241,0.5)' }}>
          <span className="relative z-10">{t('landing.start', lang)}</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </button>
        <div className="flex gap-4 mt-12 justify-center flex-wrap">
          {TRACKS.map((tr) => (
            <div key={tr.name} className="rounded-xl px-5 py-3 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-2xl mb-1">{tr.emoji}</div>
              <div className="text-white font-bold text-sm">{lang === 'he' ? tr.nameHe : tr.name}</div>
              <div className="text-xs text-slate-400">{lang === 'he' ? `גילאי ${tr.ages}` : `Ages ${tr.ages}`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}