'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getLeaderboard } from '../lib/api';
import { sounds } from '../lib/sounds';

const MEDALS = ['🥇', '🥈', '🥉'];
const TRACK_EMOJI: any = { explorers: '🧭', voyagers: '🚀', masters: '👑' };
const AVATAR_EMOJI: Record<string, string> = { ninja: '🥷', astronaut: '👩‍🚀', pirate: '🏴‍☠️', fairy: '🧚', robot: '🤖', wizard: '🧙‍♂️', superhero: '🦸', dragon: '🐲', alien: '👽', princess: '👸', knight: '🛡️' };

const getPlayerAvatar = (entry: any) => {
  const eq = entry.equipped || {};
  if (eq.pet) return eq.pet.includes('cat') ? '🐱' : eq.pet.includes('dog') ? '🐶' : eq.pet.includes('dragon') ? '🐉' : eq.pet.includes('owl') ? '🦉' : eq.pet.includes('unicorn') ? '🦄' : eq.pet.includes('phoenix') ? '🔥' : '🐾';
  if (eq.avatar && AVATAR_EMOJI[eq.avatar]) return AVATAR_EMOJI[eq.avatar];
  return TRACK_EMOJI[entry.track] || '🧭';
};

export default function Leaderboard({ profile, userId, onChallenge }: { profile: any; userId: string; onChallenge?: (player: any) => void }) {
  const [lb, setLb] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteSent, setInviteSent] = useState<string | null>(null);
  const [showInviteMenu, setShowInviteMenu] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: profileData } = await supabase.from('profiles').select('id,nickname,level,xp,track,equipped').order('xp', { ascending: false }).limit(50);
        let data = (profileData || []).map((p: any) => ({ ...p, total_xp: p.xp + ((p.level || 1) - 1) * 100 })).sort((a: any, b: any) => b.total_xp - a.total_xp).slice(0, 20);
        if (!data || data.length < 3) {
          const fakes = [
            { id: 'f1', nickname: 'StarKid', total_xp: 850, level: 9, track: 'explorers' },
            { id: 'f2', nickname: 'WordNinja', total_xp: 720, level: 7, track: 'voyagers' },
            { id: 'f3', nickname: 'LexiQueen', total_xp: 600, level: 6, track: 'masters' },
            { id: 'f4', nickname: 'GrammarBot', total_xp: 480, level: 5, track: 'explorers' },
            { id: 'f5', nickname: 'SpellHero', total_xp: 320, level: 3, track: 'voyagers' },
          ];
          data = [...(data || []), ...fakes].sort((a: any, b: any) => b.total_xp - a.total_xp);
        }
        setLb(data.slice(0, 15));
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, []);

  // Send in-game invite
  const sendInvite = async (player: any) => {
    try {
      await supabase.from('game_invites').insert({
        from_id: userId,
        from_name: profile.nickname,
        to_id: player.id,
        to_name: player.nickname,
        status: 'pending',
      });
      sounds.coin();
      setInviteSent(player.id);
      setTimeout(() => setInviteSent(null), 3000);
      setShowInviteMenu(null);
    } catch (e) { console.error(e); }
  };

  // WhatsApp invite text
  const getWhatsAppInvite = (player: any) => {
    const text = `⚔️ היי ${player.nickname}!\n\n🎮 אני מאתגר אותך למשחק ב-LingoQuest!\n\n🏆 בוא נראה מי טוב יותר באנגלית!\n\n🌟 היכנס עכשיו: https://lingoquest-75vj.onrender.com\n\n💪 ${profile.nickname} מחכה לך בזירה!`;
    return encodeURIComponent(text);
  };

  const getCopyInvite = (player: any) => {
    return `⚔️ היי ${player.nickname}!\n\n🎮 אני מאתגר אותך למשחק ב-LingoQuest!\n🏆 בוא נראה מי טוב יותר באנגלית!\n🌟 היכנס עכשיו: https://lingoquest-75vj.onrender.com\n\n💪 ${profile.nickname} מחכה לך בזירה!`;
  };

  return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <h2 className="text-xl font-black text-white mb-1">🏆 טבלת דירוג</h2>
      <p className="text-xs mb-5 text-slate-400">השחקנים הטובים ביותר</p>
      {loading ? (
        <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div>
      ) : (
        <div className="space-y-2.5">
          {lb.map((entry: any, i: number) => {
            const isMe = entry.id === userId;
            const isReal = !entry.id?.startsWith('f');
            return (
              <div key={entry.id || i}>
                <div className="rounded-2xl p-4 flex items-center gap-3 transition-all"
                  style={{
                    background: isMe ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isMe ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  <div className="w-8 text-center">
                    {i < 3 ? <span className="text-xl">{MEDALS[i]}</span> : <span className="text-sm font-black text-slate-500">{i + 1}</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ background: isMe ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)' }}>
                    {getPlayerAvatar(entry)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-white">
                      {entry.nickname} {isMe && <span className="text-xs text-indigo-300">(אתה)</span>}
                    </div>
                    <div className="text-xs text-slate-400">רמה {entry.level}</div>
                  </div>
                  <div className="text-sm font-black" style={{ color: '#fbbf24' }}>⭐ {entry.total_xp}</div>

                  {/* Challenge/Invite buttons */}
                  {!isMe && (
                    <button onClick={() => setShowInviteMenu(showInviteMenu === entry.id ? null : entry.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                      style={{ background: inviteSent === entry.id ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)', color: inviteSent === entry.id ? '#34d399' : '#f87171' }}>
                      {inviteSent === entry.id ? '✅ נשלח!' : '⚔️'}
                    </button>
                  )}
                </div>

                {/* Invite Menu Dropdown */}
                {showInviteMenu === entry.id && !isMe && (
                  <div className="rounded-xl p-3 mt-1 space-y-2" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <p className="text-xs font-bold text-indigo-300 text-center">⚔️ אתגר את {entry.nickname}</p>

                    {/* In-game challenge */}
                    {isReal && onChallenge && (
                      <button onClick={() => { sendInvite(entry); if (onChallenge) onChallenge(entry); }}
                        className="w-full py-2 rounded-lg text-xs font-bold text-white transition-all hover:scale-[1.02]"
                        style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                        🎮 אתגר עכשיו (במשחק)
                      </button>
                    )}

                    {/* Native Share */}
                    <button onClick={async () => {
                      const text = getCopyInvite(entry);
                      try {
                        if (navigator.share) { await navigator.share({ title: 'LingoQuest - אתגר!', text, url: 'https://lingoquest-75vj.onrender.com' }); }
                        else { navigator.clipboard.writeText(text).catch(() => {}); }
                      } catch (_) {}
                      sounds.coin(); setInviteSent(entry.id); setShowInviteMenu(null); setTimeout(() => setInviteSent(null), 3000);
                    }}
                      className="w-full py-2 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1 transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      📤 הזמן שחקן
                    </button>

                    {/* Copy invite */}
                    <button onClick={() => {
                      navigator.clipboard.writeText(getCopyInvite(entry)).catch(() => {});
                      sounds.coin(); setInviteSent(entry.id); setShowInviteMenu(null); setTimeout(() => setInviteSent(null), 3000);
                    }}
                      className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02]"
                      style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}>
                      📋 העתק הזמנה
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}