'use client';
import { useState, useEffect, useRef } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const CONTENT: any = {
  explorers: [
    { word: 'CAT', hint: '🐱 A furry pet' }, { word: 'DOG', hint: '🐶 Best friend' },
    { word: 'SUN', hint: '🌞 Bright in sky' }, { word: 'BIG', hint: '📏 Not small' },
    { word: 'RED', hint: '🔴 A color' }, { word: 'HAT', hint: '🎩 On your head' },
    { word: 'CUP', hint: '☕ Drink from it' }, { word: 'BUS', hint: '🚌 Big vehicle' },
    { word: 'PEN', hint: '🖊️ Write with it' }, { word: 'BED', hint: '🛏️ Sleep in it' },
  ],
  voyagers: [
    { word: 'TIGER', hint: '🐅 Striped big cat' }, { word: 'OCEAN', hint: '🌊 Vast blue water' },
    { word: 'BRAVE', hint: '🦁 Not afraid' }, { word: 'DREAM', hint: '💭 While sleeping' },
    { word: 'LIGHT', hint: '💡 Opposite of dark' }, { word: 'WORLD', hint: '🌍 The whole planet' },
    { word: 'MUSIC', hint: '🎵 You listen to it' }, { word: 'GREEN', hint: '🟢 Color of grass' },
    { word: 'HAPPY', hint: '😊 Feeling good' }, { word: 'RIVER', hint: '🏞️ Flowing water' },
  ],
  masters: [
    { word: 'ADVENTURE', hint: '🗺️ Exciting journey' }, { word: 'BEAUTIFUL', hint: '🌸 Very pretty' },
    { word: 'KNOWLEDGE', hint: '📚 What you learn' }, { word: 'MYSTERIOUS', hint: '🔮 Unknown & strange' },
    { word: 'BRILLIANT', hint: '✨ Very smart' }, { word: 'CHALLENGE', hint: '🎯 A difficult task' },
    { word: 'DANGEROUS', hint: '⚠️ Could be harmful' }, { word: 'EXCELLENT', hint: '🏆 Outstanding' },
    { word: 'INVISIBLE', hint: '👻 Cannot be seen' }, { word: 'WONDERFUL', hint: '🌟 Amazing' },
  ],
};

const ROUNDS = 8; const XP_PER = 10; const LINGO_PER = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function SpellingGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const track = profile.track || 'explorers';
  const [questions] = useState(() => shuffle(CONTENT[track] || CONTENT.explorers).slice(0, ROUNDS));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => { timerRef.current = setInterval(() => setTimer(t => t + 1), 1000); sounds.gameStart(); return () => clearInterval(timerRef.current); }, []);

  // Auto-speak the word
  useEffect(() => {
    if (questions[idx]) setTimeout(() => sounds.speak(questions[idx].word), 400);
  }, [idx]);

  const submit = () => {
    if (!input.trim() || result !== null) return;
    const ok = input.trim().toUpperCase() === questions[idx].word.toUpperCase();
    setResult(ok);
    if (ok) { setStreak(s => s + 1); setScore(s => ({ ...s, c: s.c + 1 })); sounds.correct(); }
    else { setStreak(0); setScore(s => ({ ...s, w: s.w + 1 })); sounds.wrong(); sounds.speak(questions[idx].word); }
    setTimeout(() => {
      if (idx + 1 >= questions.length) { clearInterval(timerRef.current); setDone(true); }
      else { setIdx(i => i + 1); setInput(''); setResult(null); }
    }, ok ? 700 : 1200);
  };

  const handleFinish = async () => {
    setSaving(true);
    try { await completeGame(userId, score.c * XP_PER, score.c * LINGO_PER, score.c === ROUNDS ? 1 : 0); } catch (e) { console.error(e); }
    onFinish();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pct = Math.round((score.c / (score.c + score.w)) * 100) || 0;
  const grade = pct === 100 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gc: any = { S: '#f59e0b', A: '#22c55e', B: '#6366f1', C: '#3b82f6', D: '#ef4444' };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md">
        <div className="rounded-3xl p-7 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-5xl mb-2">{pct === 100 ? '🏆' : pct >= 70 ? '🌟' : '💪'}</div>
          <h2 className="text-2xl font-black text-white mb-3">{pct === 100 ? 'PERFECT!' : pct >= 70 ? 'Great Job!' : 'Keep Going!'}</h2>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: `${gc[grade]}20`, border: `3px solid ${gc[grade]}` }}>
            <span className="text-3xl font-black" style={{ color: gc[grade] }}>{grade}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)' }}><div className="text-xl font-black" style={{ color: '#34d399' }}>{score.c}</div><div className="text-xs" style={{ color: '#6ee7b7' }}>Correct ✅</div></div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)' }}><div className="text-xl font-black" style={{ color: '#f87171' }}>{score.w}</div><div className="text-xs" style={{ color: '#fca5a5' }}>Missed ❌</div></div>
          </div>
          <div className="rounded-xl p-3 mb-4" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(245,158,11,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex justify-center gap-5">
              <div><span>⭐</span><span className="font-black text-white ml-1">+{score.c * XP_PER}</span></div>
              <div><span>💰</span><span className="font-black text-white ml-1">+{score.c * LINGO_PER}</span></div>
            </div>
          </div>
          <button onClick={handleFinish} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {saving ? '⚡ Saving...' : '🏠 Continue'}
          </button>
        </div>
      </div>
    </div>
  );

  const q = questions[idx];
  const progress = (idx / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full mb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>✕ Quit</button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-300">⏱️ {formatTime(timer)}</span>
            <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⭐ {score.c * XP_PER}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#f59e0b,#f97316)' }} />
          </div>
          <span className="text-xs font-bold text-slate-400">{idx}/{questions.length}</span>
          {streak >= 3 && <span className="text-xs font-bold animate-pulse" style={{ color: '#fbbf24' }}>🔥{streak}</span>}
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-5xl mb-3">🐝</div>
        <h3 className="text-xl font-black text-white mb-2">Spelling Bee</h3>
        
        <div className="rounded-2xl p-5 mb-4 text-center w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-sm mb-1 text-indigo-300">Spell this word:</p>
          <p className="text-lg mb-3" style={{ color: '#fbbf24' }}>{q.hint}</p>
          {/* Listen button */}
          <button onClick={() => sounds.speak(q.word)}
            className="px-6 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
            🔊 Listen
          </button>
        </div>

        <div className="w-full flex gap-2 mb-4">
          <input type="text" value={input} onChange={e => setInput(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && submit()}
            className="flex-1 px-4 py-3 rounded-xl text-center text-lg font-black tracking-widest"
            style={{ background: 'rgba(255,255,255,0.06)', border: result === true ? '2px solid #22c55e' : result === false ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }}
            placeholder="TYPE HERE" autoFocus />
          <button onClick={submit} className="px-6 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.03]" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>GO</button>
        </div>
        {result !== null && <p className="text-lg font-black" style={{ color: result ? '#34d399' : '#f87171' }}>{result ? (streak >= 3 ? '🔥 Streak!' : 'Correct! ✨') : `Answer: ${q.word}`}</p>}
      </div>
    </div>
  );
}