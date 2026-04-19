'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'LingoAdmin2026!';

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, games: 0, avgLevel: 0 });
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'tournaments' | 'announce'>('users');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceEmoji, setAnnounceEmoji] = useState('📢');

  const login = () => {
    if (password === ADMIN_PASSWORD) { setAuthenticated(true); setError(''); loadAll(); }
    else { setError('סיסמה שגויה'); }
  };

  const loadAll = () => { loadUsers(); loadTournaments(); };

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) {
      setUsers(data);
      const totalGames = data.reduce((sum: number, u: any) => sum + (u.games_played || 0), 0);
      const avgLvl = data.length > 0 ? Math.round(data.reduce((sum: number, u: any) => sum + (u.level || 1), 0) / data.length * 10) / 10 : 0;
      setStats({ total: data.length, games: totalGames, avgLevel: avgLvl });
    }
    setLoading(false);
  };

  const loadTournaments = async () => {
    const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(20);
    setTournaments(data || []);
  };

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // Check nickname uniqueness
  const isNicknameAvailable = async (nickname: string, excludeId?: string): Promise<boolean> => {
    const { data } = await supabase.from('profiles').select('id').eq('nickname', nickname);
    if (!data) return true;
    return data.filter(u => u.id !== excludeId).length === 0;
  };

  const deleteUser = async (userId: string, nickname: string) => {
    if (!confirm(`למחוק את ${nickname} לצמיתות?`)) return;
    try {
      const { error } = await supabase.rpc('admin_delete_user', { user_id: userId });
      if (error) await supabase.from('profiles').delete().eq('id', userId);
      setUsers(users.filter(u => u.id !== userId));
      showMsg(`✅ ${nickname} נמחק`);
    } catch (e) { console.error(e); }
  };

  const startEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      nickname: user.nickname || '', track: user.track || 'explorers',
      level: String(user.level || 1), xp: String(user.xp || 0),
      lingos: String(user.lingos || 0), tickets: String(user.tickets || 0),
      games_played: String(user.games_played || 0),
      arena_wins: String(user.arena_wins || 0), arena_losses: String(user.arena_losses || 0),
      referral_count: String(user.referral_count || 0),
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    // Check unique nickname
    if (editForm.nickname !== editUser.nickname) {
      const available = await isNicknameAvailable(editForm.nickname, editUser.id);
      if (!available) { showMsg('❌ השם כבר תפוס! בחר שם אחר'); return; }
    }
    if (!editForm.nickname.trim() || editForm.nickname.trim().length < 2) { showMsg('❌ שם חייב להכיל לפחות 2 תווים'); return; }

    const { error } = await supabase.from('profiles').update({
      nickname: editForm.nickname.trim(),
      track: editForm.track,
      level: parseInt(editForm.level) || 1,
      xp: parseInt(editForm.xp) || 0,
      lingos: parseInt(editForm.lingos) || 0,
      tickets: parseInt(editForm.tickets) || 0,
      games_played: parseInt(editForm.games_played) || 0,
      arena_wins: parseInt(editForm.arena_wins) || 0,
      arena_losses: parseInt(editForm.arena_losses) || 0,
      referral_count: parseInt(editForm.referral_count) || 0,
    }).eq('id', editUser.id);

    if (error) { showMsg(`❌ שגיאה: ${error.message}`); return; }
    setEditUser(null);
    showMsg(`✅ ${editForm.nickname} עודכן`);
    loadUsers();
  };

  const resetUser = async (userId: string, nickname: string) => {
    if (!confirm(`לאפס את ${nickname}?`)) return;
    await supabase.from('profiles').update({
      level: 1, xp: 0, lingos: 500, tickets: 1, games_played: 0, arena_wins: 0, arena_losses: 0,
      inventory: [], equipped: { skin: null, hat: null, pet: null },
    }).eq('id', userId);
    showMsg(`🔄 ${nickname} אופס`);
    loadUsers();
  };

  const giveBonus = async (userId: string, nickname: string) => {
    const amount = prompt(`כמה Lingos ל-${nickname}?`, '500');
    if (!amount) return;
    const num = parseInt(amount);
    if (isNaN(num)) return;
    const user = users.find(u => u.id === userId);
    await supabase.from('profiles').update({ lingos: (user?.lingos || 0) + num }).eq('id', userId);
    showMsg(`🎁 ${nickname} קיבל ${num} Lingos`);
    loadUsers();
  };

  const deleteTournament = async (tId: string, name: string) => {
    if (!confirm(`למחוק את הטורניר "${name}"?`)) return;
    await supabase.from('tournaments').delete().eq('id', tId);
    showMsg(`✅ טורניר נמחק`);
    loadTournaments();
  };

  const filteredUsers = users.filter(u =>
    u.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (!authenticated) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-sm">
        <div className="rounded-3xl p-7 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-black text-white mb-4">Admin Panel</h2>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          <input type="password" placeholder="סיסמה" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full px-4 py-3 rounded-xl text-sm mb-3 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
          <button onClick={login} className="w-full py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>כניסה</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-4xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-white">🔐 פאנל ניהול</h1>
          <div className="flex gap-2">
            <button onClick={loadAll} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: 'rgba(99,102,241,0.3)' }}>🔄</button>
            <a href="/" className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400" style={{ background: 'rgba(255,255,255,0.05)' }}>🏠</a>
          </div>
        </div>

        {msg && <div className="mb-4 p-3 rounded-xl text-center text-sm font-bold" style={{ background: msg.startsWith('✅') || msg.startsWith('🔄') || msg.startsWith('🎁') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: msg.startsWith('❌') ? '#f87171' : '#34d399' }}>{msg}</div>}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[{ v: stats.total, l: '👥 משתמשים' }, { v: stats.games, l: '🎮 משחקים' }, { v: stats.avgLevel, l: '📊 רמה ממוצעת' }].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-2xl font-black text-white">{s.v}</div>
              <div className="text-xs text-slate-400">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab('users')} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: activeTab === 'users' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: activeTab === 'users' ? '#a5b4fc' : '#94a3b8' }}>👥 משתמשים</button>
          <button onClick={() => setActiveTab('tournaments')} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: activeTab === 'tournaments' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: activeTab === 'tournaments' ? '#a5b4fc' : '#94a3b8' }}>🏆 טורנירים</button>
          <button onClick={() => setActiveTab('announce')} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ background: activeTab === 'announce' ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: activeTab === 'announce' ? '#a5b4fc' : '#94a3b8' }}>📢 הודעות</button>
        </div>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <input type="text" placeholder="🔍 חפש..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
            {loading ? <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div> : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div key={user.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[180px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{user.track === 'explorers' ? '🧭' : user.track === 'voyagers' ? '🚀' : '👑'}</span>
                          <span className="font-black text-white">{user.nickname}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>Lv.{user.level}</span>
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                      <div className="flex gap-2 text-xs flex-wrap">
                        <span style={{ color: '#fbbf24' }}>⭐{user.xp}</span>
                        <span style={{ color: '#34d399' }}>💰{user.lingos}</span>
                        <span style={{ color: '#94a3b8' }}>🎮{user.games_played}</span>
                        <span style={{ color: '#c084fc' }}>⚔️{user.arena_wins}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <button onClick={() => startEdit(user)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>✏️ ערוך</button>
                      <button onClick={() => giveBonus(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>🎁 בונוס</button>
                      <button onClick={() => resetUser(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>🔄 אפס</button>
                      <button onClick={() => deleteUser(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️ מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-2">
            {tournaments.length === 0 ? <p className="text-center text-slate-500 py-8">אין טורנירים</p> : tournaments.map(t => (
              <div key={t.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-black text-white">{t.name}</h4>
                    <div className="flex gap-2 mt-1 text-xs">
                      <span style={{ color: t.status === 'open' ? '#34d399' : t.status === 'playing' ? '#fbbf24' : '#94a3b8' }}>{t.status === 'open' ? '🟢 פתוח' : t.status === 'playing' ? '🟡 בתהליך' : '⚫ הסתיים'}</span>
                      <span className="text-slate-400">👥 {(t.players || []).length}/{t.max_players}</span>
                      <span className="text-slate-400">💰 {t.prize_lingos}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteTournament(t.id, t.name)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️ מחק</button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(t.players || []).map((p: any, i: number) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>{p.name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announce' && (
          <div className="space-y-4">
            <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-sm font-black text-white mb-3">📢 שלח הודעה לכל המשתמשים</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select value={announceEmoji} onChange={e => setAnnounceEmoji(e.target.value)}
                    className="px-3 py-2 rounded-xl text-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none', width: 60 }}>
                    {['📢', '🎉', '🔥', '⚡', '🏆', '🎮', '🛒', '⚠️', '💡', '🎁'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input type="text" placeholder="כותרת ההודעה..." value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                </div>
                <textarea placeholder="תוכן ההודעה..." value={announceMsg} onChange={e => setAnnounceMsg(e.target.value)} rows={3}
                  className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none', resize: 'none' }} />
                <button onClick={async () => {
                  if (!announceTitle.trim() || !announceMsg.trim()) { showMsg('❌ מלא כותרת ותוכן'); return; }
                  await supabase.from('announcements').insert({ title: announceTitle, message: announceMsg, emoji: announceEmoji });
                  showMsg('✅ הודעה נשלחה לכל המשתמשים!');
                  setAnnounceTitle(''); setAnnounceMsg(''); setAnnounceEmoji('📢');
                }} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  📢 שלח הודעה
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 text-center">ההודעה תופיע כפופאפ לכל משתמש בכניסה הבאה</p>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setEditUser(null)}>
            <div className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-white mb-4">✏️ עריכת {editUser.nickname}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">🎭 כינוי</label>
                  <input type="text" value={editForm.nickname} onChange={e => setEditForm((p: any) => ({ ...p, nickname: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">🎯 מסלול</label>
                  <select value={editForm.track} onChange={e => setEditForm((p: any) => ({ ...p, track: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }}>
                    <option value="explorers">🧭 Explorers</option><option value="voyagers">🚀 Voyagers</option><option value="masters">👑 Masters</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ k: 'level', l: '📊 רמה' }, { k: 'xp', l: '⭐ XP' }, { k: 'lingos', l: '💰 Lingos' }, { k: 'tickets', l: '🎫 Tickets' }, { k: 'games_played', l: '🎮 משחקים' }, { k: 'arena_wins', l: '⚔️ ניצחונות' }, { k: 'arena_losses', l: '💀 הפסדים' }, { k: 'referral_count', l: '🤝 הפניות' }].map(f => (
                    <div key={f.k}>
                      <label className="block text-xs font-bold mb-1 text-indigo-300">{f.l}</label>
                      <input type="number" value={editForm[f.k]} onChange={e => setEditForm((p: any) => ({ ...p, [f.k]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-600 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>🔑 {editUser.id}</div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>💾 שמור</button>
                <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>ביטול</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}