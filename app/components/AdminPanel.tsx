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
  const [editForm, setEditForm] = useState({ nickname: '', level: 0, xp: 0, lingos: 0, tickets: 0 });
  const [search, setSearch] = useState('');

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
    if (!confirm(`למחוק את ${nickname}? פעולה זו בלתי הפיכה!`)) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
      setUsers(users.filter(u => u.id !== userId));
    } catch (e) { console.error(e); }
  };

  const startEdit = (user: any) => {
    setEditUser(user);
    setEditForm({ nickname: user.nickname, level: user.level, xp: user.xp, lingos: user.lingos, tickets: user.tickets });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    try {
      await supabase.from('profiles').update({
        nickname: editForm.nickname,
        level: editForm.level,
        xp: editForm.xp,
        lingos: editForm.lingos,
        tickets: editForm.tickets,
      }).eq('id', editUser.id);
      setEditUser(null);
      loadUsers();
    } catch (e) { console.error(e); }
  };

  const resetUserStats = async (userId: string) => {
    if (!confirm('לאפס את הסטטיסטיקות של המשתמש?')) return;
    try {
      await supabase.from('profiles').update({
        level: 1, xp: 0, lingos: 500, tickets: 1, games_played: 0, arena_wins: 0, arena_losses: 0,
        inventory: [], equipped: { skin: null, hat: null, pet: null }, quests_completed: [],
      }).eq('id', userId);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-white">🔐 Admin Panel</h1>
            <p className="text-xs text-slate-400">LingoQuest Management</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadUsers} className="px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>🔄 רענן</button>
            <a href="/" className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>🏠 חזרה</a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl font-black text-white">{stats.total}</div>
            <div className="text-xs text-slate-400">משתמשים</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl font-black text-white">{stats.games}</div>
            <div className="text-xs text-slate-400">משחקים שהושלמו</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-3xl font-black text-white">{stats.avgLevel}</div>
            <div className="text-xs text-slate-400">רמה ממוצעת</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input type="text" placeholder="🔍 חפש לפי כינוי או אימייל..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} dir="rtl" />
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map(user => (
              <div key={user.id} className="rounded-2xl p-4 flex items-center gap-3 flex-wrap"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {/* User Info */}
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{user.track === 'explorers' ? '🧭' : user.track === 'voyagers' ? '🚀' : '👑'}</span>
                    <span className="font-black text-white">{user.nickname}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>Lv.{user.level}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                  <div className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString('he-IL')}</div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-xs">
                  <div className="text-center"><div className="font-bold text-yellow-400">⭐{user.xp}</div><div className="text-slate-500">XP</div></div>
                  <div className="text-center"><div className="font-bold text-green-400">💰{user.lingos}</div><div className="text-slate-500">Lingos</div></div>
                  <div className="text-center"><div className="font-bold text-white">🎮{user.games_played}</div><div className="text-slate-500">Games</div></div>
                  <div className="text-center"><div className="font-bold text-purple-400">⚔️{user.arena_wins}</div><div className="text-slate-500">Wins</div></div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5">
                  <button onClick={() => startEdit(user)} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>✏️ ערוך</button>
                  <button onClick={() => resetUserStats(user.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>🔄 אפס</button>
                  <button onClick={() => deleteUser(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold"
                    style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️ מחק</button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 && <p className="text-center text-slate-500 py-8">לא נמצאו משתמשים</p>}
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)', zIndex: 100 }}>
            <div className="w-full max-w-sm rounded-3xl p-6" style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)' }} dir="rtl">
              <h3 className="text-lg font-black text-white mb-4">✏️ עריכת {editUser.nickname}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">כינוי</label>
                  <input type="text" value={editForm.nickname} onChange={e => setEditForm(p => ({ ...p, nickname: e.target.value }))}
                    className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">רמה</label>
                    <input type="number" value={editForm.level} onChange={e => setEditForm(p => ({ ...p, level: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">XP</label>
                    <input type="number" value={editForm.xp} onChange={e => setEditForm(p => ({ ...p, xp: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">💰 Lingos</label>
                    <input type="number" value={editForm.lingos} onChange={e => setEditForm(p => ({ ...p, lingos: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">🎫 Tickets</label>
                    <input type="number" value={editForm.tickets} onChange={e => setEditForm(p => ({ ...p, tickets: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={saveEdit} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>💾 שמור</button>
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