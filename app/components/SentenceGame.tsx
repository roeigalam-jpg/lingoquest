'use client';
import { useState, useEffect, useRef } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const CONTENT: Record<string, Array<{words: string[], correct: string}>> = {
  explorers: [
    { words: ['I', 'like', 'cats'], correct: 'I like cats' },
    { words: ['The', 'sun', 'is', 'big'], correct: 'The sun is big' },
    { words: ['She', 'has', 'a', 'dog'], correct: 'She has a dog' },
    { words: ['I', 'can', 'run', 'fast'], correct: 'I can run fast' },
    { words: ['The', 'bird', 'can', 'fly'], correct: 'The bird can fly' },
    { words: ['He', 'is', 'my', 'friend'], correct: 'He is my friend' },
    { words: ['We', 'play', 'at', 'school'], correct: 'We play at school' },
    { words: ['I', 'eat', 'an', 'apple'], correct: 'I eat an apple' },
  ],
  voyagers: [
    { words: ['The', 'children', 'are', 'playing', 'outside'], correct: 'The children are playing outside' },
    { words: ['She', 'always', 'reads', 'before', 'sleeping'], correct: 'She always reads before sleeping' },
    { words: ['We', 'went', 'to', 'the', 'beach'], correct: 'We went to the beach' },
    { words: ['My', 'mother', 'cooks', 'delicious', 'food'], correct: 'My mother cooks delicious food' },
    { words: ['They', 'will', 'visit', 'us', 'tomorrow'], correct: 'They will visit us tomorrow' },
    { words: ['The', 'movie', 'was', 'really', 'exciting'], correct: 'The movie was really exciting' },
    { words: ['I', 'have', 'been', 'studying', 'English'], correct: 'I have been studying English' },
    { words: ['He', 'does', 'not', 'like', 'rainy', 'days'], correct: 'He does not like rainy days' },
  ],
  masters: [
    { words: ['Despite', 'the', 'rain', 'they', 'continued', 'walking'], correct: 'Despite the rain they continued walking' },
    { words: ['She', 'would', 'have', 'arrived', 'earlier'], correct: 'She would have arrived earlier' },
    { words: ['The', 'scientist', 'discovered', 'an', 'incredible', 'phenomenon'], correct: 'The scientist discovered an incredible phenomenon' },
    { words: ['Having', 'finished', 'the', 'exam', 'she', 'felt', 'relieved'], correct: 'Having finished the exam she felt relieved' },
    { words: ['The', 'more', 'you', 'practice', 'the', 'better'], correct: 'The more you practice the better' },
    { words: ['If', 'I', 'had', 'known', 'I', 'would', 'have', 'helped'], correct: 'If I had known I would have helped' },
    { words: ['Not', 'only', 'did', 'he', 'win', 'but', 'also', 'broke'], correct: 'Not only did he win but also broke' },
    { words: ['Neither', 'the', 'students', 'nor', 'teacher', 'agreed'], correct: 'Neither the students nor teacher agreed' },
  ],
};

const ROUNDS = 8;
const XP_PER = 10;
const LINGO_PER = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function SentenceGame({ profile, userId, onFinish }: { profile: { track: string }; userId: string; onFinish: () => void }) {
  const track = profile.track || 'explorers';
  const [questions] = useState(() => shuffle(CONTENT[track] || CONTENT.explorers).slice(0, ROUNDS));
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [pool, setPool] = useState<string[]>(() => {
    const firstQ = shuffle(CONTENT[track] || CONTENT.explorers).slice(0, ROUNDS)[0];
    return firstQ ? shuffle([...firstQ.words]) : [];
  });
  const [result, setResult] = useState<boolean | null>(null);
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    sounds.gameStart();
    // Set pool from actual questions state
    if (questions[0]) setPool(shuffle([...questions[0].words]));
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Auto-speak the sentence
  useEffect(() => {
    if (questions[idx]) {
      setTimeout(() => sounds.speak(questions[idx].correct), 400);
    }
  }, [idx]);

  const addWord = (w: string, wi: number) => {
    if (result !== null) return;
    sounds.tap();
    setPlaced(p => [...p, w]);
    setPool(p => p.filter((_, i) => i !== wi));
  };

  const removeWord = (wi: number) => {
    if (result !== null) return;
    sounds.tap();
    setPool(p => [...p, placed[wi]]);
    setPlaced(p => p.filter((_, i) => i !== wi));
  };

  const check = () => {
    if (result !== null) return;
    const ok = placed.join(' ') === questions[idx].correct;
    setResult(ok);
    if (ok) { setStreak(s => s + 1); setScore(s => ({ ...s, c: s.c + 1 })); sounds.correct(); }
    else { setStreak(0); setScore(s => ({ ...s, w: s.w + 1 })); sounds.wrong(); sounds.speak(questions[idx].correct); }
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        setDone(true);
      } else {
        const next = idx + 1;
        setIdx(next);
        setPlaced([]);
        setPool(shuffle([...questions[next].words]));
        setResult(null);
      }
    }, ok ? 700 : 1500);
  };

  const handleFinish = async () => {
    setSaving(true);
    try { await completeGame(userId, score.c * XP_PER, score.c * LINGO_PER, score.c === ROUNDS ? 1 : 0); } catch (e) { console.error(e); }
    onFinish();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const pct = (score.c + score.w) > 0 ? Math.round((score.c / (score.c + score.w)) * 100) : 0;
  const grade = pct === 100 ? 'S' : pct >= 80 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D';
  const gc: Record<string, string> = { S: '#f59e0b', A: '#22c55e', B: '#6366f1', C: '#3b82f6', D: '#ef4444' };

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
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
          </div>
          <span className="text-xs font-bold text-slate-400">{idx}/{questions.length}</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-4xl mb-2">🔧</div>
        <h3 className="text-lg font-black text-white mb-2">Build the Sentence!</h3>

        {/* Listen button */}
        <button onClick={() => sounds.speak(questions[idx].correct)}
          className="mb-4 px-5 py-2 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
          🔊 Listen to sentence
        </button>

        <div className="w-full min-h-[56px] rounded-2xl p-3 mb-4 flex flex-wrap gap-2"
          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${result === true ? '#22c55e' : result === false ? '#ef4444' : 'rgba(255,255,255,0.1)'}` }}>
          {placed.length === 0 && <span className="text-xs text-slate-500">Tap words to build...</span>}
          {placed.map((w, i) => (
            <button key={i} onClick={() => removeWord(i)} className="px-3 py-1.5 rounded-lg text-sm font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(99,102,241,0.3)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.4)' }}>{w}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 justify-center mb-5">
          {pool.map((w, i) => (
            <button key={i} onClick={() => addWord(w, i)} className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>{w}</button>
          ))}
        </div>
        {pool.length === 0 && result === null && (
          <button onClick={check} className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' }}>✓ Check</button>
        )}
        {result !== null && <p className="mt-3 text-lg font-black" style={{ color: result ? '#34d399' : '#f87171' }}>{result ? 'Perfect! 🌟' : `"${questions[idx].correct}"`}</p>}
      </div>
    </div>
  );
}