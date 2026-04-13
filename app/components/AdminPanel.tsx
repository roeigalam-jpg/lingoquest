'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_PASSWORD = 'LingoAdmin2026!';

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, games: 0, avgLevel: 0 });
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  const login = () => {
    if (password === ADMIN_PASSWORD) { setAuthenticated(true); setError(''); loadUsers(); }
    else { setError('סיסמה שגויה'); }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        setUsers(data);
        const totalGames = data.reduce((sum: number, u: any) => sum + (u.games_played || 0), 0);
        const avgLvl = data.length > 0 ? Math.round(data.reduce((sum: number, u: any) => sum + (u.level || 1), 0) / data.length * 10) / 10 : 0;
        setStats({ total: data.length, games: totalGames, avgLevel: avgLvl });
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const deleteUser = async (userId: string, nickname: string) => {
    if (!confirm(`למחוק את ${nickname} לצמיתות? פעולה זו בלתי הפיכה!`)) return;
    try {
      // Use the admin function that deletes from both profiles and auth
      const { error } = await supabase.rpc('admin_delete_user', { user_id: userId });
      if (error) {
        // Fallback: delete just from profiles
        await supabase.from('profiles').delete().eq('id', userId);
      }
      setUsers(users.filter(u => u.id !== userId));
      setMsg(`✅ ${nickname} נמחק בהצלחה`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { console.error(e); }
  };

  const startEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      nickname: user.nickname || '',
      email: user.email || '',
      track: user.track || 'explorers',
      level: user.level || 1,
      xp: user.xp || 0,
      lingos: user.lingos || 500,
      tickets: user.tickets || 1,
      games_played: user.games_played || 0,
      arena_wins: user.arena_wins || 0,
      arena_losses: user.arena_losses || 0,
      referral_count: user.referral_count || 0,
    });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      const { error } = await supabase.from('profiles').update({
        nickname: editForm.nickname,
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
      if (error) throw error;
      setEditUser(null);
      setMsg(`✅ ${editForm.nickname} עודכן בהצלחה`);
      setTimeout(() => setMsg(''), 3000);
      loadUsers();
    } catch (e: any) { setMsg(`❌ שגיאה: ${e.message}`); }
  };

  const resetUserStats = async (userId: string, nickname: string) => {
    if (!confirm(`לאפס את כל הסטטיסטיקות של ${nickname}?`)) return;
    try {
      await supabase.from('profiles').update({
        level: 1, xp: 0, lingos: 500, tickets: 1, games_played: 0, arena_wins: 0, arena_losses: 0,
        inventory: [], equipped: { skin: null, hat: null, pet: null }, quests_completed: [],
      }).eq('id', userId);
      setMsg(`🔄 ${nickname} אופס בהצלחה`);
      setTimeout(() => setMsg(''), 3000);
      loadUsers();
    } catch (e) { console.error(e); }
  };

  const giveBonus = async (userId: string, nickname: string) => {
    const amount = prompt(`כמה Lingos לתת ל-${nickname}?`, '500');
    if (!amount) return;
    const num = parseInt(amount);
    if (isNaN(num)) return;
    try {
      const user = users.find(u => u.id === userId);
      await supabase.from('profiles').update({ lingos: (user?.lingos || 0) + num }).eq('id', userId);
      setMsg(`🎁 ${nickname} קיבל ${num} Lingos`);
      setTimeout(() => setMsg(''), 3000);
      loadUsers();
    } catch (e) { console.error(e); }
  };

  const filteredUsers = users.filter(u =>
    u.nickname?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Login screen
  if (!authenticated) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-sm">
        <div className="rounded-3xl p-7 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="text-xl font-black text-white mb-4">Admin Panel</h2>
          {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
          <input type="password" placeholder="Admin Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            className="w-full px-4 py-3 rounded-xl text-sm mb-3 text-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
          <button onClick={login} className="w-full py-3 rounded-xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>כניסה</button>
        </div>
      </div>
    </div>
  );

  // Admin dashboard
  return (
    <div className="min-h-screen px-4 py-6" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-4xl mx-auto" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">🔐 פאנל ניהול</h1>
            <p className="text-xs text-slate-400">LingoQuest Management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadUsers} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>🔄 רענן</button>
            <a href="/" className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>🏠 חזרה</a>
          </div>
        </div>

        {/* Toast message */}
        {msg && (
          <div className="mb-4 p-3 rounded-xl text-center text-sm font-bold" style={{ background: msg.startsWith('✅') || msg.startsWith('🔄') || msg.startsWith('🎁') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: msg.startsWith('❌') ? '#f87171' : '#34d399' }}>
            {msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl font-black text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">👥 משתמשים</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl font-black text-white">{stats.games}</div>
            <div className="text-xs text-slate-400">🎮 משחקים</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl font-black text-white">{stats.avgLevel}</div>
            <div className="text-xs text-slate-400">📊 רמה ממוצעת</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input type="text" placeholder="🔍 חפש לפי כינוי או אימייל..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
        </div>

        {/* Users */}
        {loading ? (
          <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <div key={user.id} className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Info */}
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{user.track === 'explorers' ? '🧭' : user.track === 'voyagers' ? '🚀' : '👑'}</span>
                      <span className="font-black text-white text-base">{user.nickname}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>Lv.{user.level}</span>
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                    <div className="text-xs text-slate-500">📅 {new Date(user.created_at).toLocaleDateString('he-IL')} | מסלול: {user.track}</div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⭐{user.xp} XP</span>
                    <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.15)', color: '#34d399' }}>💰{user.lingos}</span>
                    <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>🎫{user.tickets}</span>
                    <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>🎮{user.games_played}</span>
                    <span className="px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>⚔️{user.arena_wins}W/{user.arena_losses}L</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <button onClick={() => startEdit(user)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>✏️ ערוך</button>
                  <button onClick={() => giveBonus(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>🎁 בונוס</button>
                  <button onClick={() => resetUserStats(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>🔄 אפס</button>
                  <button onClick={() => deleteUser(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️ מחק</button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-center text-slate-500 py-8">לא נמצאו משתמשים</p>}
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 100 }} onClick={() => setEditUser(null)}>
            <div className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-white mb-4">✏️ עריכת {editUser.nickname}</h3>
              <div className="space-y-3">
                {/* Nickname */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">🎭 כינוי</label>
                  <input type="text" value={editForm.nickname} onChange={e => setEditForm((p: any) => ({ ...p, nickname: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                </div>

                {/* Track */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">🎯 מסלול</label>
                  <select value={editForm.track} onChange={e => setEditForm((p: any) => ({ ...p, track: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }}>
                    <option value="explorers">🧭 Explorers (5-7)</option>
                    <option value="voyagers">🚀 Voyagers (8-11)</option>
                    <option value="masters">👑 Masters (12-14)</option>
                  </select>
                </div>

                {/* Level & XP */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">📊 רמה</label>
                    <input type="number" value={editForm.level} onChange={e => setEditForm((p: any) => ({ ...p, level: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">⭐ XP</label>
                    <input type="number" value={editForm.xp} onChange={e => setEditForm((p: any) => ({ ...p, xp: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                </div>

                {/* Lingos & Tickets */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">💰 Lingos</label>
                    <input type="number" value={editForm.lingos} onChange={e => setEditForm((p: any) => ({ ...p, lingos: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">🎫 Tickets</label>
                    <input type="number" value={editForm.tickets} onChange={e => setEditForm((p: any) => ({ ...p, tickets: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                </div>

                {/* Games & Arena */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">🎮 משחקים</label>
                    <input type="number" value={editForm.games_played} onChange={e => setEditForm((p: any) => ({ ...p, games_played: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">⚔️ ניצחונות</label>
                    <input type="number" value={editForm.arena_wins} onChange={e => setEditForm((p: any) => ({ ...p, arena_wins: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">💀 הפסדים</label>
                    <input type="number" value={editForm.arena_losses} onChange={e => setEditForm((p: any) => ({ ...p, arena_losses: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                </div>

                {/* Referrals */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">🤝 הפניות</label>
                  <input type="number" value={editForm.referral_count} onChange={e => setEditForm((p: any) => ({ ...p, referral_count: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                </div>

                {/* User ID (readonly) */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-slate-500">🔑 User ID</label>
                  <div className="text-xs text-slate-600 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>{editUser.id}</div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 mt-5">
                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>💾 שמור שינויים</button>
                <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>ביטול</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}