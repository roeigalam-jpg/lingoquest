'use client';
import { useState, useEffect } from 'react';
import { getLeaderboard } from '../lib/api';

const MEDALS = ['🥇', '🥈', '🥉'];
const TRACK_EMOJI: any = { explorers: '🧭', voyagers: '🚀', masters: '👑' };

export default function Leaderboard({ profile, userId, onChallenge }: { profile: any; userId: string; onChallenge?: (player: any) => void }) {
  const [lb, setLb] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        let data = await getLeaderboard(20);
        if (!data || data.length < 3) {
          const fakes = [
            { id: 'f1', nickname: 'StarKid', total_xp: 850, level: 9, track: 'explorers' },
            { id: 'f2', nickname: 'WordNinja', total_xp: 720, level: 7, track: 'voyagers' },
            { id: 'f3', nickname: 'LexiQueen', total_xp: 600, level: 6, track: 'masters' },
            { id: 'f4', nickname: 'GrammarBot', total_xp: 480, level: 5, track: 'explorers' },
            { id: 'f5', nickname: 'SpellHero', total_xp: 320, level: 3, track: 'voyagers' },
          ];
          data = [...(data || []), ...fakes].sort((a, b) => b.total_xp - a.total_xp);
        }
        setLb(data.slice(0, 15));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <h2 className="text-xl font-black text-white mb-1">🏆 טבלת דירוג</h2>
      <p className="text-xs mb-5 text-slate-400">השחקנים הטובים ביותר</p>
      {loading ? (
        <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div>
      ) : (
        <div className="space-y-2.5">
          {lb.map((entry, i) => {
            const isMe = entry.id === userId;
            const isReal = !entry.id?.startsWith('f');
            return (
              <div key={entry.id || i} className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                style={{
                  background: isMe ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isMe ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isMe ? '0 0 20px rgba(99,102,241,0.15)' : 'none',
                }}>
                <div className="w-8 text-center">
                  {i < 3 ? <span className="text-xl">{MEDALS[i]}</span> : <span className="text-sm font-black text-slate-500">{i + 1}</span>}
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ background: isMe ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)' }}>
                  {TRACK_EMOJI[entry.track] || '🧭'}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-white">
                    {entry.nickname} {isMe && <span className="text-xs text-indigo-300">(אתה)</span>}
                  </div>
                  <div className="text-xs text-slate-400">רמה {entry.level}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-left">
                    <div className="text-sm font-black" style={{ color: '#fbbf24' }}>⭐ {entry.total_xp}</div>
                  </div>
                  {/* Challenge button - only for real players, not self */}
                  {!isMe && isReal && onChallenge && (
                    <button onClick={() => onChallenge(entry)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                      ⚔️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}