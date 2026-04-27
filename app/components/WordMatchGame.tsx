'use client';
import { useState, useEffect, useRef } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';
import { WORD_MATCH_CONTENT } from '../lib/content';

const ROUNDS = 8; const XP_PER = 10; const LINGO_PER = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function WordMatchGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const track = profile.track || 'explorers';
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [displayOptions, setDisplayOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Generate questions client-side only
  useEffect(() => {
    const pool = [...(WORD_MATCH_CONTENT[track] || WORD_MATCH_CONTENT.explorers)];
    const picked: any[] = [];
    const used = new Set<number>();
    while (picked.length < ROUNDS && picked.length < pool.length) {
      const r = Math.floor(Math.random() * pool.length);
      if (!used.has(r)) { used.add(r); picked.push({ ...pool[r], options: shuffle([...pool[r].options]) }); }
    }
    setQuestions(picked);
    setReady(true);
  }, []);

  // Reshuffle options every time question changes
  useEffect(() => {
    if (questions[idx]) {
      setDisplayOptions(shuffle([...questions[idx].options]));
    }
  }, [idx, questions]);

  useEffect(() => { 
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000); 
    sounds.gameStart();
    return () => clearInterval(timerRef.current); 
  }, []);

  // Auto-speak the word for each question
  useEffect(() => {
    if (questions[idx]) {
      setTimeout(() => sounds.speak(questions[idx].word), 300);
    }
  }, [idx]);

  const pick = (ans: string) => {
    if (selected !== null) return;
    setSelected(ans);
    const ok = ans === questions[idx].word;
    setCorrect(ok);
    if (ok) { setStreak(s => s + 1); setScore(s => ({ ...s, c: s.c + 1 })); sounds.correct(); if (streak >= 2) sounds.streak(); }
    else { setStreak(0); setScore(s => ({ ...s, w: s.w + 1 })); sounds.wrong(); }
    setTimeout(() => {
      if (idx + 1 >= questions.length) { clearInterval(timerRef.current); setDone(true); sounds.gameOver(); }
      else { setIdx(i => i + 1); setSelected(null); setCorrect(null); }
    }, ok ? 700 : 1000);
  };

  const handleFinish = async () => {
    setSaving(true);
    const isPerfect = score.c === ROUNDS;
    if (isPerfect) sounds.perfect(); else sounds.levelUp();
    try { await completeGame(userId, score.c * XP_PER, score.c * LINGO_PER, isPerfect ? 1 : 0); } catch (e) { console.error(e); }
    onFinish();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pct = Math.round((score.c / (score.c + score.w)) * 100) || 0;
  const grade = pct === 100 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gc: any = { S: '#f59e0b', A: '#22c55e', B: '#6366f1', C: '#3b82f6', D: '#ef4444' };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="rounded-3xl p-7 text-center card-glass">
          <div className="text-6xl mb-3 animate-bounce-in">{pct === 100 ? '🏆' : pct >= 70 ? '🌟' : '💪'}</div>
          <h2 className="text-2xl font-black text-white mb-3 animate-fade-in">{pct === 100 ? '🎉 PERFECT!' : pct >= 70 ? '🌟 Great Job!' : '💪 Keep Going!'}</h2>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 animate-pop" style={{ background: `${gc[grade]}20`, border: `3px solid ${gc[grade]}`, boxShadow: `0 0 20px ${gc[grade]}40` }}>
            <span className="text-4xl font-black" style={{ color: gc[grade] }}>{grade}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4 stagger-children">
            <div className="rounded-xl p-3 animate-fade-in" style={{ background: 'rgba(34,197,94,0.1)' }}><div className="text-2xl font-black" style={{ color: '#34d399' }}>{score.c}</div><div className="text-xs" style={{ color: '#6ee7b7' }}>Correct ✅</div></div>
            <div className="rounded-xl p-3 animate-fade-in" style={{ background: 'rgba(239,68,68,0.1)' }}><div className="text-2xl font-black" style={{ color: '#f87171' }}>{score.w}</div><div className="text-xs" style={{ color: '#fca5a5' }}>Missed ❌</div></div>
          </div>
          <div className="rounded-xl p-4 mb-4 animate-fade-in" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(245,158,11,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex justify-center gap-6">
              <div className="animate-pop" style={{ animationDelay: '0.2s' }}><span>⭐</span><span className="font-black text-white text-lg ml-1">+{score.c * XP_PER}</span></div>
              <div className="animate-pop" style={{ animationDelay: '0.4s' }}><span>💰</span><span className="font-black text-white text-lg ml-1">+{score.c * LINGO_PER}</span></div>
              {pct === 100 && <div className="animate-pop" style={{ animationDelay: '0.6s' }}><span>🎫</span><span className="font-black text-white text-lg ml-1">+1</span></div>}
            </div>
          </div>
          <p className="text-xs mb-4 text-slate-500">⏱️ {formatTime(timer)}</p>
          <button onClick={handleFinish} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold btn-game disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
            {saving ? '⚡ Saving...' : '🏠 Continue'}
          </button>
        </div>
      </div>
    </div>
  );

  const q = questions[idx];
  if (!ready || !q) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="text-3xl animate-spin">🎮</div>
    </div>
  );
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
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#a78bfa)' }} />
          </div>
          <span className="text-xs font-bold text-slate-400">{idx}/{questions.length}</span>
          {streak >= 3 && <span className="text-xs font-bold animate-pulse" style={{ color: '#fbbf24' }}>🔥{streak}</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Emoji + Speak Button */}
        <div className="relative mb-6 animate-fade-in-scale">
          <div className={`rounded-3xl flex items-center justify-center transition-all duration-300 ${correct === true ? 'answer-correct' : correct === false ? 'answer-wrong' : ''}`}
            style={{
              width: 160, height: 160,
              background: 'rgba(255,255,255,0.05)', border: `2px solid ${correct === true ? '#22c55e' : correct === false ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: correct === true ? '0 0 40px rgba(34,197,94,0.4)' : correct === false ? '0 0 40px rgba(239,68,68,0.3)' : '0 10px 40px rgba(0,0,0,0.3)',
            }}>
            <span className={correct === true ? 'animate-bounce' : ''} style={{ fontSize: 72 }}>{q.emoji}</span>
          </div>
          {correct === true && <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-confetti">⭐</div>}
          {/* Speak button */}
          <button onClick={() => sounds.speak(q.word)}
            className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-90 animate-glow"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
            🔊
          </button>
        </div>

        <p className="text-sm font-semibold mb-5 text-indigo-300">{track === 'masters' ? 'Match the idiom! 💬' : 'What is this? 🤔'}</p>
        
        <div className="grid grid-cols-2 gap-3 w-full stagger-children">
          {displayOptions.map((o: string, i: number) => {
            const isSel = selected === o, isAns = o === q.word, show = selected !== null;
            let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
            if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
            else if (show && isSel) { bg = 'rgba(239,68,68,0.2)'; brd = '2px solid #ef4444'; col = '#f87171'; }
            return (
              <button key={i} onClick={() => pick(o)} disabled={selected !== null}
                className={`py-4 px-3 rounded-2xl font-bold text-sm btn-game flex items-center justify-center gap-2 animate-fade-in ${show && isAns ? 'answer-correct' : ''} ${show && isSel && !isAns ? 'answer-wrong' : ''}`}
                style={{ background: bg, border: brd, color: col, animationDelay: `${i * 0.05}s` }}>
                <span>{o}</span>
                {show && isAns && <span className="animate-bounce-in">✅</span>}
                {show && isSel && !isAns && <span>❌</span>}
                {!show && <span onClick={(e) => { e.stopPropagation(); e.preventDefault(); sounds.speak(o); }} className="text-base opacity-50 hover:opacity-100 cursor-pointer">🔊</span>}
              </button>
            );
          })}
        </div>
        {correct !== null && (
          <p className="mt-4 text-lg font-black animate-pop" style={{ color: correct ? '#34d399' : '#f87171' }}>
            {correct ? (streak >= 3 ? '🔥 On Fire!' : '🎉 Great! ⭐') : `Answer: ${q.word}`}
          </p>
        )}
      </div>
    </div>
  );
}