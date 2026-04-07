'use client';
import { useState, useEffect, useRef } from 'react';
import { sounds } from '../lib/sounds';
import { recordArena } from '../lib/api';

const BOT_NAMES = ['SpellMaster', 'WordWizard', 'LexiKnight', 'GrammarGuru', 'VocabViking', 'LingoNinja'];

const QUESTIONS: any = {
  explorers: [
    { emoji: '🐱', word: 'Cat', options: ['Cat', 'Dog', 'Fish', 'Bird'] },
    { emoji: '🐶', word: 'Dog', options: ['Cat', 'Dog', 'Cow', 'Pig'] },
    { emoji: '🌞', word: 'Sun', options: ['Moon', 'Star', 'Sun', 'Cloud'] },
    { emoji: '🍎', word: 'Apple', options: ['Banana', 'Apple', 'Grape', 'Cherry'] },
    { emoji: '🏠', word: 'House', options: ['House', 'Tree', 'Car', 'Ball'] },
    { emoji: '🚗', word: 'Car', options: ['Bus', 'Bike', 'Car', 'Boat'] },
    { emoji: '⭐', word: 'Star', options: ['Moon', 'Sun', 'Star', 'Cloud'] },
    { emoji: '🐟', word: 'Fish', options: ['Fish', 'Frog', 'Duck', 'Bee'] },
  ],
  voyagers: [
    { emoji: '🏔️', word: 'Mountain', options: ['Valley', 'Mountain', 'River', 'Desert'] },
    { emoji: '🌊', word: 'Ocean', options: ['Lake', 'River', 'Ocean', 'Pond'] },
    { emoji: '🦁', word: 'Brave', options: ['Scared', 'Brave', 'Tired', 'Lazy'] },
    { emoji: '🎨', word: 'Creative', options: ['Creative', 'Boring', 'Simple', 'Quiet'] },
    { emoji: '🏰', word: 'Castle', options: ['Tower', 'Castle', 'Bridge', 'Temple'] },
    { emoji: '🔬', word: 'Science', options: ['Science', 'History', 'Music', 'Sports'] },
    { emoji: '🎭', word: 'Theater', options: ['Cinema', 'Theater', 'Museum', 'Library'] },
    { emoji: '🦋', word: 'Beautiful', options: ['Ugly', 'Beautiful', 'Small', 'Dark'] },
  ],
  masters: [
    { emoji: '🧊', word: 'Break the ice', options: ['Break the ice', 'Cold shoulder', 'On thin ice', 'Chill out'] },
    { emoji: '💡', word: 'Bright idea', options: ['Smart move', 'Bright idea', 'Light bulb', 'Quick thought'] },
    { emoji: '🍰', word: 'Piece of cake', options: ['Easy peasy', 'Piece of cake', 'Sweet deal', 'Cherry on top'] },
    { emoji: '🎭', word: 'Break a leg', options: ['Good luck', 'Break a leg', 'Take a bow', 'Steal the show'] },
    { emoji: '🌍', word: 'Small world', options: ['Small world', 'Big picture', 'Wide open', 'Close call'] },
    { emoji: '🔥', word: 'On fire', options: ['Burning up', 'On fire', 'Hot stuff', 'Fired up'] },
    { emoji: '⏰', word: 'Against the clock', options: ['Running late', 'Against the clock', 'Time flies', 'Clock ticking'] },
    { emoji: '📖', word: 'Once upon a time', options: ['Long time ago', 'Once upon a time', 'In the beginning', 'Way back when'] },
  ],
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

export default function ArenaGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const [phase, setPhase] = useState<'lobby'|'countdown'|'battle'|'result'>('lobby');
  const [difficulty, setDifficulty] = useState('medium');
  const [botName] = useState(() => BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [playerHP, setPlayerHP] = useState(100);
  const [botHP, setBotHP] = useState(100);
  const [selected, setSelected] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const doneRef = useRef(false);

  const startBattle = () => {
    const track = profile.track || 'explorers';
    const qs = shuffle(QUESTIONS[track] || QUESTIONS.explorers).map((q: any) => ({ ...q, options: shuffle(q.options) }));
    setQuestions(qs);
    setPhase('countdown');
    doneRef.current = false;
    sounds.gameStart();
    let c = 3;
    const iv = setInterval(() => {
      c--;
      sounds.tick();
      setCountdown(c);
      if (c <= 0) { clearInterval(iv); setPhase('battle'); }
    }, 800);
  };

  const finishBattle = (pHP: number, bHP: number) => {
    if (doneRef.current) return;
    doneRef.current = true;
    const w = bHP <= 0 ? 'player' : pHP <= 0 ? 'bot' : pHP >= bHP ? 'player' : 'bot';
    setWinner(w);
    setPhase('result');
    if (w === 'player') sounds.perfect(); else sounds.gameOver();
  };

  const botSpeed: any = { easy: 3500, medium: 2200, hard: 1200 };

  useEffect(() => {
    if (phase !== 'battle' || idx >= questions.length || doneRef.current) return;
    const t = setTimeout(() => {
      if (selected !== null || doneRef.current) return;
      const botOk = Math.random() < (difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.6 : 0.85);
      if (botOk) {
        setPlayerHP(h => {
          const nh = Math.max(0, h - 15);
          if (nh <= 0) finishBattle(nh, botHP);
          return nh;
        });
        sounds.wrong();
      }
      setTimeout(() => {
        if (!doneRef.current) {
          if (idx + 1 >= questions.length) finishBattle(playerHP, botHP);
          else { setIdx(i => i + 1); setSelected(null); }
        }
      }, 800);
    }, botSpeed[difficulty] + Math.random() * 500);
    return () => clearTimeout(t);
  }, [phase, idx, selected]);

  const pick = (ans: string) => {
    if (selected !== null || phase !== 'battle' || doneRef.current) return;
    setSelected(ans);
    const ok = ans === questions[idx].word;
    if (ok) { setBotHP(h => { const nh = Math.max(0, h - 15); if (nh <= 0) setTimeout(() => finishBattle(playerHP, nh), 300); return nh; }); sounds.correct(); }
    else { setPlayerHP(h => { const nh = Math.max(0, h - 10); if (nh <= 0) setTimeout(() => finishBattle(nh, botHP), 300); return nh; }); sounds.wrong(); }
    setTimeout(() => {
      if (!doneRef.current) {
        if (idx + 1 >= questions.length) finishBattle(playerHP, botHP);
        else { setIdx(i => i + 1); setSelected(null); }
      }
    }, 800);
  };

  const handleFinish = async () => {
    setSaving(true);
    try { await recordArena(userId, winner === 'player'); } catch (e) { console.error(e); }
    onFinish();
  };

  if (phase === 'lobby') return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto">
      <h2 className="text-xl font-black text-white mb-1">⚔️ Arena</h2>
      <p className="text-xs mb-6 text-slate-400">Challenge a bot in a word duel!</p>
      <div className="rounded-2xl p-6 text-center mb-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-6xl mb-3">🤖</div>
        <h3 className="text-lg font-black text-white">{botName}</h3>
        <p className="text-xs text-slate-400">Your opponent</p>
      </div>
      <div className="mb-5">
        <p className="text-xs font-bold mb-2 text-indigo-300">DIFFICULTY</p>
        <div className="flex gap-2">
          {['easy', 'medium', 'hard'].map(d => (
            <button key={d} onClick={() => { sounds.tap(); setDifficulty(d); }}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm capitalize transition-all"
              style={{ background: difficulty === d ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', border: difficulty === d ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.1)', color: difficulty === d ? '#a5b4fc' : '#94a3b8' }}>
              {d === 'easy' ? '😊' : d === 'medium' ? '😤' : '🔥'} {d}
            </button>
          ))}
        </div>
      </div>
      <button onClick={startBattle}
        className="w-full py-4 rounded-2xl text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-[0.97]"
        style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 25px rgba(239,68,68,0.4)' }}>⚔️ FIGHT!</button>
    </div>
  );

  if (phase === 'countdown') return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="text-8xl font-black text-white animate-bounce">{countdown || 'GO!'}</div>
    </div>
  );

  if (phase === 'result') {
    const won = winner === 'player';
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
        <div className="w-full max-w-md text-center">
          <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-6xl mb-3">{won ? '🏆' : '😤'}</div>
            <h2 className="text-2xl font-black text-white mb-2">{won ? 'VICTORY!' : 'DEFEATED'}</h2>
            <p className="text-sm mb-5" style={{ color: won ? '#34d399' : '#f87171' }}>{won ? `You defeated ${botName}!` : `${botName} wins`}</p>
            <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex justify-center gap-5">
                <div><span>⭐</span><span className="font-black text-white ml-1">+{won ? 30 : 10}</span></div>
                <div><span>💰</span><span className="font-black text-white ml-1">+{won ? 50 : 10}</span></div>
              </div>
            </div>
            <button onClick={handleFinish} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {saving ? '⚡ Saving...' : '🏠 Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Battle
  const q = questions[idx]; if (!q) return null;
  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1"><span className="font-bold text-white">{profile.nickname}</span><span className="text-slate-400">{playerHP}%</span></div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${playerHP}%`, background: playerHP > 50 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : playerHP > 25 ? '#f59e0b' : '#ef4444' }} />
            </div>
          </div>
          <span className="text-xl font-black" style={{ color: '#f59e0b' }}>⚔️</span>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1"><span className="font-bold text-white">🤖 {botName}</span><span className="text-slate-400">{botHP}%</span></div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${botHP}%`, background: botHP > 50 ? 'linear-gradient(90deg,#ef4444,#dc2626)' : botHP > 25 ? '#f59e0b' : '#22c55e' }} />
            </div>
          </div>
        </div>
        <div className="text-center mb-5">
          <div className="rounded-2xl inline-flex items-center justify-center p-5 mb-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: 120, height: 120 }}>
            <span style={{ fontSize: 60 }}>{q.emoji}</span>
          </div>
          <p className="text-sm font-semibold text-indigo-300">Quick! ⚡</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o: string, i: number) => {
            const isSel = selected === o, isAns = o === q.word, show = selected !== null;
            let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
            if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
            else if (show && isSel && !isAns) { bg = 'rgba(239,68,68,0.2)'; brd = '2px solid #ef4444'; col = '#f87171'; }
            return <button key={i} onClick={() => pick(o)} disabled={selected !== null}
              className="py-4 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] disabled:hover:scale-100"
              style={{ background: bg, border: brd, color: col }}>{o}</button>;
          })}
        </div>
      </div>
    </div>
  );
}