'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';

export default function Tournament({ profile, userId, onPlay }: { profile: any; userId: string; onPlay: () => void }) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joined, setJoined] = useState<string | null>(null);

  useEffect(() => { loadTournaments(); }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('tournaments').select('*').in('status', ['open', 'playing']).order('created_at', { ascending: false }).limit(10);
      setTournaments(data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const createTournament = async () => {
    if (profile.tickets < 1) { sounds.wrong(); return; }
    setCreating(true);
    try {
      const { data, error } = await supabase.from('tournaments').insert({
        name: `🏆 טורניר של ${profile.nickname}`,
        max_players: 8,
        entry_cost: 1,
        prize_lingos: 500,
        prize_xp: 100,
        players: [{ id: userId, name: profile.nickname, score: 0, track: profile.track }],
      }).select().single();

      if (data && !error) {
        // Deduct ticket
        await supabase.from('profiles').update({ tickets: profile.tickets - 1 }).eq('id', userId);
        sounds.gameStart();
        setJoined(data.id);
        loadTournaments();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  };

  const joinTournament = async (t: any) => {
    if (profile.tickets < t.entry_cost) { sounds.wrong(); return; }
    const players = t.players || [];
    if (players.length >= t.max_players) { sounds.wrong(); return; }
    if (players.find((p: any) => p.id === userId)) { sounds.wrong(); return; }

    try {
      const updatedPlayers = [...players, { id: userId, name: profile.nickname, score: 0, track: profile.track }];
      await supabase.from('tournaments').update({ players: updatedPlayers }).eq('id', t.id);
      await supabase.from('profiles').update({ tickets: profile.tickets - t.entry_cost }).eq('id', userId);
      sounds.coin();
      setJoined(t.id);
      loadTournaments();
    } catch (e) { console.error(e); }
  };

  const isInTournament = (t: any) => (t.players || []).some((p: any) => p.id === userId);

  return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <h2 className="text-xl font-black text-white mb-1">🏆 טורנירים</h2>
      <p className="text-xs mb-5 text-slate-400">השתתף באליפות ונצח פרסים!</p>

      {/* Create Tournament */}
      <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="text-4xl mb-2">🏟️</div>
        <h3 className="text-base font-black text-white mb-1">צור טורניר חדש!</h3>
        <p className="text-xs text-slate-400 mb-3">עלות כניסה: 🎫 1 כרטיס | פרס: 💰 500 + ⭐ 100</p>
        <button onClick={createTournament} disabled={creating || profile.tickets < 1}
          className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          {profile.tickets < 1 ? '🎫 אין כרטיסים' : creating ? '⏳ יוצר...' : '🏆 צור טורניר (🎫 1)'}
        </button>
      </div>

      {/* Active Tournaments */}
      {loading ? (
        <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div>
      ) : tournaments.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-4xl mb-3">😴</div>
          <p className="text-sm text-white font-bold">אין טורנירים פעילים</p>
          <p className="text-xs text-slate-400">צור טורניר חדש ויזמין חברים!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => {
            const players = t.players || [];
            const isFull = players.length >= t.max_players;
            const isIn = isInTournament(t);
            return (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: isIn ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isIn ? '#6366f1' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-black text-white">{t.name}</h4>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                        {t.status === 'open' ? '🟢 פתוח' : '🔴 בתהליך'}
                      </span>
                      <span className="text-xs text-slate-400">👥 {players.length}/{t.max_players}</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>💰 {t.prize_lingos}</div>
                    <div className="text-xs font-bold" style={{ color: '#a5b4fc' }}>⭐ {t.prize_xp}</div>
                  </div>
                </div>

                {/* Players list */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {players.map((p: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: p.id === userId ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: p.id === userId ? '#c7d2fe' : '#94a3b8' }}>
                      {p.track === 'explorers' ? '🧭' : p.track === 'voyagers' ? '🚀' : '👑'} {p.name}
                    </span>
                  ))}
                  {Array.from({ length: t.max_players - players.length }).map((_, i) => (
                    <span key={`empty-${i}`} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', color: '#334155' }}>❓ פנוי</span>
                  ))}
                </div>

                {/* Action */}
                {isIn ? (
                  <div className="flex gap-2">
                    <button onClick={onPlay} className="flex-1 py-2.5 rounded-xl text-white font-bold text-xs transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>🎮 שחק עכשיו</button>
                    <button onClick={() => {
                      const text = `🏆 הצטרפו לטורניר ב-LingoQuest!\n\n⚔️ ${t.name}\n👥 ${players.length}/${t.max_players} שחקנים\n💰 פרס: ${t.prize_lingos} Lingos\n\n🌟 https://lingoquest-75vj.onrender.com`;
                      navigator.clipboard.writeText(text).catch(() => {});
                      sounds.coin();
                    }} className="px-3 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>📋 שתף</button>
                  </div>
                ) : t.status === 'open' && !isFull ? (
                  <button onClick={() => joinTournament(t)} disabled={profile.tickets < t.entry_cost}
                    className="w-full py-2.5 rounded-xl text-white font-bold text-xs transition-all hover:scale-[1.02] disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
                    {profile.tickets < t.entry_cost ? '🎫 אין כרטיסים' : `⚔️ הצטרף (🎫 ${t.entry_cost})`}
                  </button>
                ) : (
                  <p className="text-xs text-center text-slate-500">{isFull ? '🔒 מלא' : '⏳ בתהליך'}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={loadTournaments} className="w-full mt-4 py-2 text-xs text-indigo-400 hover:text-white">🔄 רענן רשימה</button>
    </div>
  );
}