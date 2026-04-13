'use client';
import { useState, useEffect, useRef } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const CONTENT: Record<string, Array<{emoji: string, word: string, wordHe: string}>> = {
  explorers: [
    { emoji: '🐱', word: 'Cat', wordHe: 'חתול' }, { emoji: '🐶', word: 'Dog', wordHe: 'כלב' },
    { emoji: '🐟', word: 'Fish', wordHe: 'דג' }, { emoji: '🍎', word: 'Apple', wordHe: 'תפוח' },
    { emoji: '🌞', word: 'Sun', wordHe: 'שמש' }, { emoji: '🏠', word: 'House', wordHe: 'בית' },
    { emoji: '🚗', word: 'Car', wordHe: 'מכונית' }, { emoji: '🌺', word: 'Flower', wordHe: 'פרח' },
    { emoji: '⭐', word: 'Star', wordHe: 'כוכב' }, { emoji: '🐸', word: 'Frog', wordHe: 'צפרדע' },
    { emoji: '🍌', word: 'Banana', wordHe: 'בננה' }, { emoji: '🐦', word: 'Bird', wordHe: 'ציפור' },
    { emoji: '🌙', word: 'Moon', wordHe: 'ירח' }, { emoji: '🐘', word: 'Elephant', wordHe: 'פיל' },
    { emoji: '🍕', word: 'Pizza', wordHe: 'פיצה' }, { emoji: '🎂', word: 'Cake', wordHe: 'עוגה' },
    { emoji: '🐢', word: 'Turtle', wordHe: 'צב' }, { emoji: '🦊', word: 'Fox', wordHe: 'שועל' },
    { emoji: '🌳', word: 'Tree', wordHe: 'עץ' }, { emoji: '🦁', word: 'Lion', wordHe: 'אריה' },
  ],
  voyagers: [
    { emoji: '🏔️', word: 'Mountain', wordHe: 'הר' }, { emoji: '🌊', word: 'Ocean', wordHe: 'אוקיינוס' },
    { emoji: '🏰', word: 'Castle', wordHe: 'טירה' }, { emoji: '🌋', word: 'Volcano', wordHe: 'הר געש' },
    { emoji: '🦅', word: 'Eagle', wordHe: 'נשר' }, { emoji: '🦈', word: 'Shark', wordHe: 'כריש' },
    { emoji: '🎻', word: 'Violin', wordHe: 'כינור' }, { emoji: '⚡', word: 'Lightning', wordHe: 'ברק' },
    { emoji: '🦉', word: 'Owl', wordHe: 'ינשוף' }, { emoji: '🦜', word: 'Parrot', wordHe: 'תוכי' },
    { emoji: '🔭', word: 'Telescope', wordHe: 'טלסקופ' }, { emoji: '🏜️', word: 'Desert', wordHe: 'מדבר' },
    { emoji: '🧊', word: 'Ice', wordHe: 'קרח' }, { emoji: '🌴', word: 'Palm', wordHe: 'דקל' },
    { emoji: '🎯', word: 'Target', wordHe: 'מטרה' }, { emoji: '🦋', word: 'Butterfly', wordHe: 'פרפר' },
  ],
  masters: [
    { emoji: '🏛️', word: 'Parliament', wordHe: 'פרלמנט' }, { emoji: '🔬', word: 'Microscope', wordHe: 'מיקרוסקופ' },
    { emoji: '🛰️', word: 'Satellite', wordHe: 'לוויין' }, { emoji: '🧬', word: 'DNA', wordHe: 'דנ"א' },
    { emoji: '🌐', word: 'Globe', wordHe: 'גלובוס' }, { emoji: '⚖️', word: 'Justice', wordHe: 'צדק' },
    { emoji: '🎓', word: 'Graduate', wordHe: 'בוגר' }, { emoji: '🏗️', word: 'Construction', wordHe: 'בנייה' },
    { emoji: '🧪', word: 'Chemistry', wordHe: 'כימיה' }, { emoji: '📡', word: 'Antenna', wordHe: 'אנטנה' },
    { emoji: '🏺', word: 'Archaeology', wordHe: 'ארכיאולוגיה' }, { emoji: '🎭', word: 'Drama', wordHe: 'דרמה' },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const PAIRS_PER_ROUND = 4;
const TOTAL_ROUNDS = 3;
const XP_PER = 15;
const LINGO_PER = 8;

export default function DragMatchGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const track = profile.track || 'explorers';
  const allItems = shuffle(CONTENT[track] || CONTENT.explorers);
  const [round, setRound] = useState(0);
  const [items, setItems] = useState(() => allItems.slice(0, PAIRS_PER_ROUND));
  const [shuffledWords, setShuffledWords] = useState(() => shuffle(items.map(i => i.word)));
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [score, setScore] = useState({ c: 0, w: 0 });
  const [done, setDone] = useState(false);
  const [timer, setTimer] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    sounds.gameStart();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const selectWord = (word: string) => {
    if (results[word]) return;
    sounds.tap();
    setSelectedWord(word);
  };

  const selectEmoji = (item: typeof items[0]) => {
    if (!selectedWord || results[selectedWord]) return;
    const correct = selectedWord === item.word;
    setResults(r => ({ ...r, [selectedWord]: correct }));
    setMatches(m => ({ ...m, [selectedWord]: item.emoji }));

    if (correct) {
      sounds.correct();
      setScore(s => ({ ...s, c: s.c + 1 }));
      setShowFeedback(`✅ ${item.word} = ${item.wordHe}`);
      sounds.speak(item.word);
    } else {
      sounds.wrong();
      setScore(s => ({ ...s, w: s.w + 1 }));
      setShowFeedback(`❌ ${selectedWord} ≠ ${item.emoji}`);
    }
    setSelectedWord(null);

    setTimeout(() => setShowFeedback(null), 1500);

    // Check if round complete
    const newResults = { ...results, [selectedWord]: correct };
    const answeredCount = Object.keys(newResults).length;
    if (answeredCount >= PAIRS_PER_ROUND) {
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          if (timerRef.current) clearInterval(timerRef.current);
          setDone(true);
        } else {
          const nextRound = round + 1;
          const nextItems = allItems.slice(nextRound * PAIRS_PER_ROUND, (nextRound + 1) * PAIRS_PER_ROUND);
          setRound(nextRound);
          setItems(nextItems);
          setShuffledWords(shuffle(nextItems.map(i => i.word)));
          setMatches({});
          setResults({});
        }
      }, 1000);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    const isPerfect = score.w === 0;
    try { await completeGame(userId, score.c * XP_PER, score.c * LINGO_PER, isPerfect ? 1 : 0); } catch (e) { console.error(e); }
    onFinish();
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const totalCorrect = score.c;
  const totalWrong = score.w;
  const pct = (totalCorrect + totalWrong) > 0 ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : 0;
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
            <div className="rounded-xl p-3" style={{ background: 'rgba(34,197,94,0.1)' }}><div className="text-xl font-black" style={{ color: '#34d399' }}>{totalCorrect}</div><div className="text-xs" style={{ color: '#6ee7b7' }}>Correct ✅</div></div>
            <div className="rounded-xl p-3" style={{ background: 'rgba(239,68,68,0.1)' }}><div className="text-xl font-black" style={{ color: '#f87171' }}>{totalWrong}</div><div className="text-xs" style={{ color: '#fca5a5' }}>Missed ❌</div></div>
          </div>
          <div className="rounded-xl p-3 mb-4" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(245,158,11,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="flex justify-center gap-5">
              <div><span>⭐</span><span className="font-black text-white ml-1">+{totalCorrect * XP_PER}</span></div>
              <div><span>💰</span><span className="font-black text-white ml-1">+{totalCorrect * LINGO_PER}</span></div>
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
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((round * PAIRS_PER_ROUND + Object.keys(results).length) / (TOTAL_ROUNDS * PAIRS_PER_ROUND)) * 100}%`, background: 'linear-gradient(90deg,#22c55e,#16a34a)' }} />
          </div>
          <span className="text-xs font-bold text-slate-400">R{round + 1}/{TOTAL_ROUNDS}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
        <div className="text-3xl mb-1">🎯</div>
        <h3 className="text-lg font-black text-white mb-1">Match Word to Picture!</h3>
        <p className="text-xs text-indigo-300 mb-4">חבר מילה לתמונה הנכונה</p>

        {/* Feedback */}
        {showFeedback && (
          <div className="mb-3 px-4 py-2 rounded-xl text-sm font-bold animate-bounce" style={{
            background: showFeedback.startsWith('✅') ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            color: showFeedback.startsWith('✅') ? '#34d399' : '#f87171',
          }}>{showFeedback}</div>
        )}

        {/* Emojis (targets) */}
        <div className="grid grid-cols-4 gap-3 mb-6 w-full">
          {items.map((item, i) => {
            const matched = Object.entries(matches).find(([w, e]) => e === item.emoji && results[w]);
            return (
              <button key={i} onClick={() => selectEmoji(item)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all ${selectedWord ? 'hover:scale-105 cursor-pointer' : 'cursor-default'} ${matched ? 'opacity-40' : ''}`}
                style={{
                  background: selectedWord && !matched ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${selectedWord && !matched ? '#6366f1' : matched ? '#22c55e40' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: selectedWord && !matched ? '0 0 15px rgba(99,102,241,0.2)' : 'none',
                }}
                disabled={!!matched}>
                <span className="text-4xl">{item.emoji}</span>
                {matched && <span className="text-[10px] text-green-400 mt-1">✅</span>}
              </button>
            );
          })}
        </div>

        {/* Words (draggable/selectable) */}
        <div className="flex flex-wrap gap-2 justify-center">
          {shuffledWords.map((word, i) => {
            const isMatched = results[word] === true;
            const isFailed = results[word] === false;
            const isSelected = selectedWord === word;
            return (
              <button key={i} onClick={() => selectWord(word)}
                className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${isMatched ? 'opacity-30' : 'hover:scale-105 active:scale-95'}`}
                style={{
                  background: isSelected ? 'rgba(99,102,241,0.4)' : isMatched ? 'rgba(34,197,94,0.1)' : isFailed ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
                  border: isSelected ? '2px solid #6366f1' : isMatched ? '1px solid #22c55e40' : '1px solid rgba(255,255,255,0.12)',
                  color: isSelected ? '#c7d2fe' : isMatched ? '#22c55e60' : '#e2e8f0',
                  boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                }}
                disabled={isMatched}>
                {word}
                {isSelected && <span className="ml-1">👆</span>}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-500 mt-4">
          {selectedWord ? '👆 עכשיו לחץ על התמונה המתאימה!' : '👇 בחר מילה ואז לחץ על התמונה'}
        </p>
      </div>
    </div>
  );
}