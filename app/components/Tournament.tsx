'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';

export default function Tournament({ profile, userId, onPlay }: { profile: any; userId: string; onPlay: () => void }) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadTournaments();
    timerRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    const { data } = await supabase.from('tournaments').select('*').in('status', ['open', 'playing']).order('created_at', { ascending: false }).limit(10);
    if (data) {
      // Auto-expire old tournaments
      for (const t of data) {
        const age = Date.now() - new Date(t.created_at).getTime();
        if (t.status === 'open' && age > 3600000) { // 1 hour
          await supabase.from('tournaments').update({ status: 'finished' }).eq('id', t.id);
        }
      }
      setTournaments(data.filter(t => {
        const age = Date.now() - new Date(t.created_at).getTime();
        return !(t.status === 'open' && age > 3600000);
      }));
    }
    setLoading(false);
  };

  const getTimeLeft = (createdAt: string) => {
    const elapsed = now - new Date(createdAt).getTime();
    const left = Math.max(0, 3600000 - elapsed);
    const mins = Math.floor(left / 60000);
    const secs = Math.floor((left % 60000) / 1000);
    return { mins, secs, expired: left <= 0 };
  };

  const createTournament = async () => {
    if (profile.tickets < 1) { sounds.wrong(); return; }
    setCreating(true);
    const { data, error } = await supabase.from('tournaments').insert({
      name: `🏆 טורניר של ${profile.nickname}`,
      max_players: 8, entry_cost: 1, prize_lingos: 500, prize_xp: 100,
      players: [{ id: userId, name: profile.nickname, score: 0, track: profile.track }],
    }).select().single();
    if (data && !error) {
      await supabase.from('profiles').update({ tickets: profile.tickets - 1 }).eq('id', userId);
      sounds.gameStart();
      loadTournaments();
    }
    setCreating(false);
  };

  const joinTournament = async (t: any) => {
    if (profile.tickets < t.entry_cost) { sounds.wrong(); return; }
    const players = t.players || [];
    if (players.length >= t.max_players || players.find((p: any) => p.id === userId)) { sounds.wrong(); return; }
    const updated = [...players, { id: userId, name: profile.nickname, score: 0, track: profile.track }];
    await supabase.from('tournaments').update({ players: updated }).eq('id', t.id);
    await supabase.from('profiles').update({ tickets: profile.tickets - t.entry_cost }).eq('id', userId);
    sounds.coin();
    loadTournaments();
  };

  const deleteTournament = async (t: any) => {
    if (!confirm('למחוק את הטורניר?')) return;
    // Refund tickets to all players
    for (const p of (t.players || [])) {
      const { data: pData } = await supabase.from('profiles').select('tickets').eq('id', p.id).single();
      if (pData) await supabase.from('profiles').update({ tickets: pData.tickets + t.entry_cost }).eq('id', p.id);
    }
    await supabase.from('tournaments').delete().eq('id', t.id);
    sounds.tap();
    loadTournaments();
  };

  const shareTournament = async (t: any) => {
    const players = t.players || [];
    const text = `🏆 הצטרפו לטורניר ב-LingoQuest!\n\n⚔️ ${t.name}\n👥 ${players.length}/${t.max_players} שחקנים\n💰 פרס: ${t.prize_lingos} Lingos + ⭐ ${t.prize_xp} XP\n\n🌟 https://lingoquest-75vj.onrender.com`;
    try {
      if (navigator.share) {
        await navigator.share({ title: t.name, text, url: 'https://lingoquest-75vj.onrender.com' });
      } else {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } catch (_) {}
    sounds.coin();
  };

  const isInTournament = (t: any) => (t.players || []).some((p: any) => p.id === userId);
  const isCreator = (t: any) => (t.players || [])[0]?.id === userId;

  return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <h2 className="text-xl font-black text-white mb-1">🏆 טורנירים</h2>
      <p className="text-xs mb-5 text-slate-400">השתתף באליפות ונצח פרסים!</p>

      {/* Create */}
      <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
        <div className="text-4xl mb-2">🏟️</div>
        <h3 className="text-base font-black text-white mb-1">צור טורניר חדש!</h3>
        <p className="text-xs text-slate-400 mb-1">🎫 1 כרטיס | 💰 500 + ⭐ 100</p>
        <p className="text-xs text-slate-500 mb-3">⏰ טורניר מתבטל אחרי שעה אם לא מתחיל</p>
        <button onClick={createTournament} disabled={creating || profile.tickets < 1}
          className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>
          {profile.tickets < 1 ? '🎫 אין כרטיסים' : creating ? '⏳...' : '🏆 צור (🎫1)'}
        </button>
      </div>

      {loading ? <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div> : tournaments.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-4xl mb-3">😴</div>
          <p className="text-sm text-white font-bold">אין טורנירים פעילים</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => {
            const players = t.players || [];
            const isIn = isInTournament(t);
            const isMine = isCreator(t);
            const timeLeft = getTimeLeft(t.created_at);
            const canDelete = isMine && players.length <= 1;

            return (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: isIn ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isIn ? '#6366f1' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-black text-white">{t.name}</h4>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span style={{ color: '#34d399' }}>👥 {players.length}/{t.max_players}</span>
                      <span style={{ color: '#fbbf24' }}>💰{t.prize_lingos}</span>
                    </div>
                  </div>
                  {/* Countdown Timer */}
                  {t.status === 'open' && (
                    <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: timeLeft.mins < 10 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)' }}>
                      <div className="text-sm font-black" style={{ color: timeLeft.mins < 10 ? '#f87171' : '#fbbf24' }}>
                        ⏰ {timeLeft.mins}:{timeLeft.secs.toString().padStart(2, '0')}
                      </div>
                      <div className="text-[9px] text-slate-500">נותר</div>
                    </div>
                  )}
                </div>

                {/* Players */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {players.map((p: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-lg font-bold"
                      style={{ background: p.id === userId ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: p.id === userId ? '#c7d2fe' : '#94a3b8' }}>
                      {p.name} {i === 0 && '👑'}
                    </span>
                  ))}
                  {Array.from({ length: t.max_players - players.length }).map((_, i) => (
                    <span key={`e-${i}`} className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', color: '#334155' }}>❓</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {isIn ? (
                    <>
                      <button onClick={onPlay} className="flex-1 py-2 rounded-xl text-white font-bold text-xs" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>🎮 שחק</button>
                      <button onClick={() => shareTournament(t)} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white' }}>📤 הזמן</button>
                      <button onClick={() => {
                        const text = `🏆 הצטרפו לטורניר ב-LingoQuest!\n\n⚔️ ${t.name}\n👥 ${players.length}/${t.max_players}\n💰 ${t.prize_lingos} Lingos\n\n🌟 https://lingoquest-75vj.onrender.com`;
                        navigator.clipboard.writeText(text).catch(() => {}); sounds.coin();
                      }} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>📋</button>
                      {canDelete && <button onClick={() => deleteTournament(t)} className="px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️</button>}
                    </>
                  ) : t.status === 'open' ? (
                    <button onClick={() => joinTournament(t)} disabled={profile.tickets < t.entry_cost}
                      className="w-full py-2 rounded-xl text-white font-bold text-xs disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
                      ⚔️ הצטרף (🎫{t.entry_cost})
                    </button>
                  ) : <p className="text-xs text-slate-500 w-full text-center">⏳ בתהליך</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={loadTournaments} className="w-full mt-4 py-2 text-xs text-indigo-400">🔄 רענן</button>
    </div>
  );
}