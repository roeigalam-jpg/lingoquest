'use client';

const ISLANDS = [
  { id: 'starter', name: 'Starter Island', emoji: '🏝️', unlockLevel: 1, color: '#22c55e', game: 'word-match', gameLabel: 'Word Match 🎯', desc: 'Begin your journey!', descHe: 'התחל את המסע!' },
  { id: 'animals', name: 'Animal Kingdom', emoji: '🦁', unlockLevel: 2, color: '#f59e0b', game: 'spelling', gameLabel: 'Spelling Bee 🐝', desc: 'Master animal words!', descHe: 'שלוט במילות חיות!' },
  { id: 'match', name: 'Match Valley', emoji: '🎯', unlockLevel: 3, color: '#ec4899', game: 'drag-match', gameLabel: 'Drag & Match 🖐️', desc: 'Connect words to pictures!', descHe: 'חבר מילים לתמונות!' },
  { id: 'food', name: 'Food Valley', emoji: '🍕', unlockLevel: 4, color: '#ef4444', game: 'sentence', gameLabel: 'Sentence Builder 🔧', desc: 'Build sentences!', descHe: 'בנה משפטים!' },
  { id: 'mystery', name: 'Mystery Island', emoji: '🔮', unlockLevel: 6, color: '#8b5cf6', game: 'listening', gameLabel: 'Listening 👂', desc: 'Train your ears!', descHe: 'אמן את האוזניים!' },
  { id: 'story', name: 'Story Land', emoji: '📖', unlockLevel: 2, color: '#ec4899', game: 'story', gameLabel: 'Adventures 📖', desc: 'Learn through stories!', descHe: 'למד דרך סיפורים!' },
  { id: 'ai', name: 'AI Island', emoji: '🤖', unlockLevel: 3, color: '#22c55e', game: 'ai-chat', gameLabel: 'AI Chat 🤖', desc: 'Talk with AI in English!', descHe: 'דבר עם AI באנגלית!' },
];

export default function WorldMap({ profile, onSelectGame }: { profile: any; onSelectGame: (game: string) => void }) {
  return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto">
      <h2 className="text-xl font-black text-white mb-1">🗺️ World Map</h2>
      <p className="text-xs mb-5 text-slate-400">Explore islands and conquer challenges!</p>
      <div className="space-y-3">
        {ISLANDS.map((island, idx) => {
          const locked = profile.level < island.unlockLevel;
          return (
            <div key={island.id}
              className={`rounded-2xl p-5 animate-fade-in card-glass-hover ${locked ? 'opacity-40' : 'cursor-pointer'}`}
              style={{
                background: locked ? 'rgba(255,255,255,0.02)' : `linear-gradient(135deg,${island.color}10,${island.color}05)`,
                border: `1px solid ${locked ? 'rgba(255,255,255,0.05)' : island.color + '40'}`,
                animationDelay: `${idx * 0.07}s`,
              }}
              onClick={() => !locked && onSelectGame(island.game)}>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${!locked ? 'animate-float' : ''}`}
                  style={{ background: locked ? 'rgba(255,255,255,0.05)' : `${island.color}20`, border: `2px solid ${locked ? 'rgba(255,255,255,0.1)' : island.color + '50'}`, animationDelay: `${idx * 0.3}s` }}>
                  {locked ? '🔒' : island.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-white">{island.name}</h3>
                  <p className="text-xs text-slate-400">{island.descHe}</p>
                  {locked
                    ? <p className="text-xs mt-1 font-semibold" style={{ color: '#f59e0b' }}>🔒 Level {island.unlockLevel}</p>
                    : <p className="text-xs mt-1 font-semibold" style={{ color: island.color }}>▶ {island.gameLabel}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}