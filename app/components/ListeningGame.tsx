'use client';
import { useState, useEffect, useRef } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';
import { LISTENING_CONTENT as CONTENT } from '../lib/content';

const ROUNDS = 8; const XP_PER = 10; const LINGO_PER = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function ListeningGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const track = profile.track || 'explorers';
  const [questions] = useState(() => shuffle(CONTENT[track] || CONTENT.explorers).slice(0, ROUNDS).map((q) => ({ ...q, options: shuffle([...q.options]) })));
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { timerRef.current = setInterval(() => setTimer(t => t + 1), 1000); sounds.gameStart(); return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);
  useEffect(() => { if (questions[idx]) setTimeout(() => sounds.speak(questions[idx].word), 400); }, [idx, questions]);

  const pick = (ans: string) => {
    if (selected !== null) return; setSelected(ans);
    const ok = ans === questions[idx].word; setCorrect(ok);
    if (ok) { setStreak(s => s + 1); setScore(s => ({ ...s, c: s.c + 1 })); sounds.correct(); } else { setStreak(0); setScore(s => ({ ...s, w: s.w + 1 })); sounds.wrong(); }
    setTimeout(() => { if (idx + 1 >= questions.length) { if (timerRef.current) clearInterval(timerRef.current); setDone(true); } else { setIdx(i => i + 1); setSelected(null); setCorrect(null); } }, ok ? 700 : 1000);
  };

  const handleFinish = async () => { setSaving(true); try { await completeGame(userId, score.c * XP_PER, score.c * LINGO_PER, score.c === ROUNDS ? 1 : 0); } catch (e) { console.error(e); } onFinish(); };
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pct = (score.c + score.w) > 0 ? Math.round((score.c / (score.c + score.w)) * 100) : 0;
  const grade = pct === 100 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gc: Record<string,string> = { S: '#f59e0b', A: '#22c55e', B: '#6366f1', C: '#3b82f6', D: '#ef4444' };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md"><div className="rounded-3xl p-7 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-5xl mb-2">{pct === 100 ? '🏆' : pct >= 70 ? '🌟' : '💪'}</div>
        <h2 className="text-2xl font-black text-white mb-3">{pct === 100 ? 'PERFECT!' : pct >= 70 ? 'Great Job!' : 'Keep Going!'}</h2>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: `${gc[grade]}20`, border: `3px solid ${gc[grade]}` }}><span className="text-3xl font-black" style={{ color: gc[grade] }}>{grade}</span></div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)' }}><div className="text-xl font-black" style={{ color: '#34d399' }}>{score.c}</div><div className="text-xs" style={{ color: '#6ee7b7' }}>Correct ✅</div></div>
          <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)' }}><div className="text-xl font-black" style={{ color: '#f87171' }}>{score.w}</div><div className="text-xs" style={{ color: '#fca5a5' }}>Missed ❌</div></div>
        </div>
        <button onClick={handleFinish} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{saving ? '⚡ Saving...' : '🏠 Continue'}</button>
      </div></div>
    </div>
  );

  const q = questions[idx];
  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full mb-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>✕ Quit</button>
          <div className="flex items-center gap-3"><span className="text-xs font-bold text-indigo-300">⏱️ {formatTime(timer)}</span><span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⭐ {score.c * XP_PER}</span></div>
        </div>
        <div className="flex items-center gap-2"><div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(idx / questions.length) * 100}%`, background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)' }} /></div><span className="text-xs font-bold text-slate-400">{idx}/{questions.length}</span></div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <button onClick={() => sounds.speak(q.word)} className="w-28 h-28 rounded-full flex items-center justify-center text-5xl mb-4 transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 40px rgba(99,102,241,0.4)' }}>🔊</button>
        <p className="text-sm font-semibold mb-6 text-indigo-300">Tap to listen again 👂</p>
        <div className="grid grid-cols-2 gap-3 w-full">
          {q.options.map((o, i) => {
            const isSel = selected === o, isAns = o === q.word, show = selected !== null;
            let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
            if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
            else if (show && isSel) { bg = 'rgba(239,68,68,0.2)'; brd = '2px solid #ef4444'; col = '#f87171'; }
            return <button key={i} onClick={() => pick(o)} disabled={selected !== null} className="py-4 px-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] disabled:hover:scale-100" style={{ background: bg, border: brd, color: col }}>{o}{show && isAns && ' ✅'}{show && isSel && !isAns && ' ❌'}</button>;
          })}
        </div>
        {correct !== null && <p className="mt-4 text-lg font-black" style={{ color: correct ? '#34d399' : '#f87171' }}>{correct ? '🎧 Perfect Ear!' : `It was: ${q.word}`}</p>}
      </div>
    </div>
  );
}
