'use client';
import { useState, useEffect, useRef } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const CONTENT: any = {
  explorers: [
    { emoji: '🐱', word: 'Cat', options: ['Cat', 'Dog', 'Fish', 'Bird'] },
    { emoji: '🐶', word: 'Dog', options: ['Cat', 'Dog', 'Cow', 'Pig'] },
    { emoji: '🐟', word: 'Fish', options: ['Fish', 'Frog', 'Duck', 'Bee'] },
    { emoji: '🌈', word: 'Rainbow', options: ['Sun', 'Rainbow', 'Cloud', 'Star'] },
    { emoji: '🍎', word: 'Apple', options: ['Banana', 'Apple', 'Grape', 'Cherry'] },
    { emoji: '🌞', word: 'Sun', options: ['Moon', 'Star', 'Sun', 'Cloud'] },
    { emoji: '🏠', word: 'House', options: ['House', 'Tree', 'Car', 'Ball'] },
    { emoji: '🚗', word: 'Car', options: ['Bus', 'Bike', 'Car', 'Boat'] },
    { emoji: '🌺', word: 'Flower', options: ['Flower', 'Leaf', 'Tree', 'Grass'] },
    { emoji: '⭐', word: 'Star', options: ['Moon', 'Sun', 'Star', 'Cloud'] },
  ],
  voyagers: [
    { emoji: '🍳', word: 'Kitchen', options: ['Bedroom', 'Kitchen', 'Garden', 'Library'] },
    { emoji: '🏔️', word: 'Mountain', options: ['Valley', 'Mountain', 'River', 'Desert'] },
    { emoji: '🔬', word: 'Science', options: ['Science', 'History', 'Music', 'Sports'] },
    { emoji: '🌊', word: 'Ocean', options: ['Lake', 'River', 'Ocean', 'Pond'] },
    { emoji: '🎭', word: 'Theater', options: ['Cinema', 'Theater', 'Museum', 'Library'] },
    { emoji: '🦁', word: 'Brave', options: ['Scared', 'Brave', 'Tired', 'Lazy'] },
    { emoji: '🎨', word: 'Creative', options: ['Creative', 'Boring', 'Simple', 'Quiet'] },
    { emoji: '🏰', word: 'Castle', options: ['Tower', 'Castle', 'Bridge', 'Temple'] },
    { emoji: '🧭', word: 'Adventure', options: ['Journey', 'Adventure', 'Vacation', 'Mission'] },
    { emoji: '🦋', word: 'Beautiful', options: ['Ugly', 'Beautiful', 'Small', 'Dark'] },
  ],
  masters: [
    { emoji: '🧊', word: 'Break the ice', options: ['Break the ice', 'Cold shoulder', 'On thin ice', 'Chill out'] },
    { emoji: '📖', word: 'Once upon a time', options: ['Long time ago', 'Once upon a time', 'In the beginning', 'Way back when'] },
    { emoji: '🌧️', word: 'Under the weather', options: ['Under the weather', 'Raining cats', 'Storm coming', 'Cloudy mind'] },
    { emoji: '💡', word: 'Bright idea', options: ['Smart move', 'Bright idea', 'Light bulb', 'Quick thought'] },
    { emoji: '🎯', word: 'Hit the nail', options: ['Hit the nail', 'Strike while hot', 'Hammer time', 'Right on target'] },
    { emoji: '🍰', word: 'Piece of cake', options: ['Easy peasy', 'Piece of cake', 'Sweet deal', 'Cherry on top'] },
    { emoji: '⏰', word: 'Against the clock', options: ['Running late', 'Against the clock', 'Time flies', 'Clock ticking'] },
    { emoji: '🎭', word: 'Break a leg', options: ['Good luck', 'Break a leg', 'Take a bow', 'Steal the show'] },
  ],
};

const ROUNDS = 8; const XP_PER = 10; const LINGO_PER = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function WordMatchGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const track = profile.track || 'explorers';
  const [questions] = useState(() => {
    const pool = [...(CONTENT[track] || CONTENT.explorers)];
    // Double-shuffle for true randomness
    const shuffled = shuffle(shuffle(pool));
    return shuffled.slice(0, ROUNDS).map((q: any) => ({ ...q, options: shuffle([...q.options]) }));
  });
  const [idx, setIdx] = useState(0);
  const [displayOptions, setDisplayOptions] = useState<string[]>(() => []);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [streak, setStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<any>(null);

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
              {pct === 100 && <div><span>🎫</span><span className="font-black text-white ml-1">+1</span></div>}
            </div>
          </div>
          <p className="text-xs mb-4 text-slate-500">⏱️ {formatTime(timer)}</p>
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
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#a78bfa)' }} />
          </div>
          <span className="text-xs font-bold text-slate-400">{idx}/{questions.length}</span>
          {streak >= 3 && <span className="text-xs font-bold animate-pulse" style={{ color: '#fbbf24' }}>🔥{streak}</span>}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        {/* Emoji + Speak Button */}
        <div className="relative mb-6">
          <div className="rounded-3xl flex items-center justify-center transition-all duration-300"
            style={{
              width: 160, height: 160,
              background: 'rgba(255,255,255,0.05)', border: `2px solid ${correct === true ? '#22c55e' : correct === false ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: correct === true ? '0 0 40px rgba(34,197,94,0.4)' : correct === false ? '0 0 40px rgba(239,68,68,0.3)' : '0 10px 40px rgba(0,0,0,0.3)',
              transform: correct === true ? 'scale(1.05)' : correct === false ? 'scale(0.95)' : 'scale(1)',
            }}>
            <span style={{ fontSize: 72 }}>{q.emoji}</span>
          </div>
          {/* Speak button */}
          <button onClick={() => sounds.speak(q.word)}
            className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
            🔊
          </button>
        </div>

        <p className="text-sm font-semibold mb-5 text-indigo-300">{track === 'masters' ? 'Match the idiom! 💬' : 'What is this? 🤔'}</p>
        
        <div className="grid grid-cols-2 gap-3 w-full">
          {displayOptions.map((o: string, i: number) => {
            const isSel = selected === o, isAns = o === q.word, show = selected !== null;
            let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
            if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
            else if (show && isSel) { bg = 'rgba(239,68,68,0.2)'; brd = '2px solid #ef4444'; col = '#f87171'; }
            return (
              <button key={i} onClick={() => pick(o)} disabled={selected !== null}
                className="py-4 px-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] active:scale-[0.97] disabled:hover:scale-100 flex items-center justify-center gap-2"
                style={{ background: bg, border: brd, color: col }}>
                <span>{o}</span>
                {show && isAns && <span>✅</span>}
                {show && isSel && !isAns && <span>❌</span>}
                {!show && <span onClick={(e) => { e.stopPropagation(); e.preventDefault(); sounds.speak(o); }} className="text-base opacity-50 hover:opacity-100 cursor-pointer">🔊</span>}
              </button>
            );
          })}
        </div>
        {correct !== null && (
          <p className="mt-4 text-lg font-black" style={{ color: correct ? '#34d399' : '#f87171' }}>
            {correct ? (streak >= 3 ? '🔥 On Fire!' : 'Great! ⭐') : `Answer: ${q.word}`}
          </p>
        )}
      </div>
    </div>
  );
}