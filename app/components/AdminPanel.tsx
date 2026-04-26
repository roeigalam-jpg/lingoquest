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
  const [stats, setStats] = useState({ total: 0, games: 0, avgLevel: 0, premium: 0 });
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'tournaments' | 'announce' | 'premium'>('users');
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceMsg, setAnnounceMsg] = useState('');
  const [announceEmoji, setAnnounceEmoji] = useState('📢');
  const [playStoreUrl, setPlayStoreUrl] = useState('');

  const login = () => { if (password === ADMIN_PASSWORD) { setAuthenticated(true); setError(''); loadAll(); } else setError('סיסמה שגויה'); };
  const loadAll = () => { loadUsers(); loadTournaments(); };
  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) {
      setUsers(data);
      setStats({
        total: data.length,
        games: data.reduce((s: number, u: any) => s + (u.games_played || 0), 0),
        avgLevel: data.length > 0 ? Math.round(data.reduce((s: number, u: any) => s + (u.level || 1), 0) / data.length * 10) / 10 : 0,
        premium: data.filter((u: any) => u.is_premium).length,
      });
    }
    setLoading(false);
  };

  const loadTournaments = async () => { const { data } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false }).limit(20); setTournaments(data || []); };

  const deleteUser = async (uid: string, name: string) => {
    if (!confirm(`למחוק את ${name}?`)) return;
    try { const { error } = await supabase.rpc('admin_delete_user', { user_id: uid }); if (error) await supabase.from('profiles').delete().eq('id', uid); } catch (_) {}
    setUsers(users.filter(u => u.id !== uid)); showMsg(`✅ ${name} נמחק`);
  };

  const startEdit = (user: any) => {
    setEditUser(user);
    setEditForm({ nickname: user.nickname || '', track: user.track || 'explorers', level: String(user.level || 1), xp: String(user.xp || 0), lingos: String(user.lingos || 0), tickets: String(user.tickets || 0), games_played: String(user.games_played || 0), arena_wins: String(user.arena_wins || 0) });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    if (editForm.nickname !== editUser.nickname) {
      const { data } = await supabase.from('profiles').select('id').eq('nickname', editForm.nickname.trim());
      if (data && data.filter((u: any) => u.id !== editUser.id).length > 0) { showMsg('❌ השם תפוס!'); return; }
    }
    await supabase.from('profiles').update({ nickname: editForm.nickname.trim(), track: editForm.track, level: parseInt(editForm.level) || 1, xp: parseInt(editForm.xp) || 0, lingos: parseInt(editForm.lingos) || 0, tickets: parseInt(editForm.tickets) || 0, games_played: parseInt(editForm.games_played) || 0, arena_wins: parseInt(editForm.arena_wins) || 0 }).eq('id', editUser.id);
    setEditUser(null); showMsg(`✅ ${editForm.nickname} עודכן`); loadUsers();
  };

  const togglePremium = async (uid: string, name: string, current: boolean) => {
    const updates: any = { is_premium: !current };
    if (!current) {
      updates.premium_plan = 'admin_granted';
      updates.premium_started = new Date().toISOString();
      updates.premium_expires = new Date(Date.now() + 365 * 86400000).toISOString();
    }
    await supabase.from('profiles').update(updates).eq('id', uid);
    showMsg(`${!current ? '⭐' : '❌'} ${name} ${!current ? 'קיבל Premium' : 'הוסר Premium'}`);
    loadUsers();
  };

  const giveBonus = async (uid: string, name: string) => {
    const amount = prompt(`כמה Lingos ל-${name}?`, '500'); if (!amount) return;
    const user = users.find(u => u.id === uid);
    await supabase.from('profiles').update({ lingos: (user?.lingos || 0) + parseInt(amount) }).eq('id', uid);
    showMsg(`🎁 ${name} קיבל ${amount}`); loadUsers();
  };

  const deleteTournament = async (tId: string, name: string) => {
    if (!confirm(`למחוק "${name}"?`)) return;
    await supabase.from('tournaments').delete().eq('id', tId); showMsg('✅ נמחק'); loadTournaments();
  };

  const sendAnnouncement = async () => {
    if (!announceTitle.trim() || !announceMsg.trim()) { showMsg('❌ מלא כותרת ותוכן'); return; }
    await supabase.from('announcements').insert({ title: announceTitle, message: announceMsg, emoji: announceEmoji });
    showMsg('✅ הודעה נשלחה!'); setAnnounceTitle(''); setAnnounceMsg(''); setAnnounceEmoji('📢');
  };

  const getWhatsAppBlast = () => {
    const storeUrl = playStoreUrl || 'https://lingoquest-75vj.onrender.com';
    return `🎉 חדשות מרגשות מ-LingoQuest!\n\n📱 המשחק עכשיו זמין כאפליקציה!\nהורידו בחינם מגוגל פליי:\n\n🔗 ${storeUrl}\n\n🎮 למדו אנגלית דרך משחקים, הרפתקאות ותחרויות!\n⭐ כל הפיצ'רים החדשים מחכים לכם!`;
  };

  const filteredUsers = users.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

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

        {msg && <div className="mb-4 p-3 rounded-xl text-center text-sm font-bold" style={{ background: msg.startsWith('✅') || msg.startsWith('⭐') || msg.startsWith('🎁') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: msg.startsWith('❌') ? '#f87171' : '#34d399' }}>{msg}</div>}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[{ v: stats.total, l: '👥 משתמשים' }, { v: stats.premium, l: '⭐ Premium' }, { v: stats.games, l: '🎮 משחקים' }, { v: stats.avgLevel, l: '📊 ממוצע' }].map((s, i) => (
            <div key={i} className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xl font-black text-white">{s.v}</div>
              <div className="text-[10px] text-slate-400">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto">
          {([['users', '👥 משתמשים'], ['tournaments', '🏆 טורנירים'], ['announce', '📢 הודעות'], ['premium', '⭐ Premium']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} className="py-2 px-3 rounded-xl text-xs font-bold whitespace-nowrap"
              style={{ background: activeTab === id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: activeTab === id ? '#a5b4fc' : '#94a3b8' }}>{label}</button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <input type="text" placeholder="🔍 חפש..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
            {loading ? <div className="text-center py-10"><span className="text-3xl animate-spin inline-block">⏳</span></div> : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div key={user.id} className="rounded-2xl p-4" style={{ background: user.is_premium ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${user.is_premium ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-[150px]">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{user.track === 'explorers' ? '🧭' : user.track === 'voyagers' ? '🚀' : '👑'}</span>
                          <span className="font-black text-white">{user.nickname}</span>
                          {user.is_premium && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>⭐</span>}
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>Lv.{user.level}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{user.email}</div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span style={{ color: '#fbbf24' }}>⭐{user.xp}</span>
                        <span style={{ color: '#34d399' }}>💰{user.lingos}</span>
                        <span style={{ color: '#94a3b8' }}>🎮{user.games_played}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      <button onClick={() => startEdit(user)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>✏️</button>
                      <button onClick={() => togglePremium(user.id, user.nickname, user.is_premium)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: user.is_premium ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)', color: user.is_premium ? '#f87171' : '#fbbf24' }}>{user.is_premium ? '❌ Premium' : '⭐ Premium'}</button>
                      <button onClick={() => giveBonus(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>🎁</button>
                      <button onClick={() => deleteUser(user.id, user.nickname)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️</button>
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
              <div key={t.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h4 className="text-sm font-black text-white">{t.name}</h4>
                  <div className="text-xs text-slate-400">👥 {(t.players || []).length}/{t.max_players} | {t.status}</div>
                </div>
                <button onClick={() => deleteTournament(t.id, t.name)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>🗑️</button>
              </div>
            ))}
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announce' && (
          <div className="space-y-4">
            {/* Quick Templates */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-bold text-indigo-300 mb-2">⚡ הודעות מוכנות:</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { emoji: '🎉', title: 'עדכון חדש!', msg: 'המשחק שודרג! משחקים חדשים, דמויות חדשות ופיצ\'רים מטורפים מחכים לכם!' },
                  { emoji: '🏆', title: 'טורניר חדש!', msg: 'טורניר אליפות חדש נפתח! הצטרפו והתחרו על פרסים ענקיים!' },
                  { emoji: '📱', title: 'הורידו את האפליקציה!', msg: 'LingoQuest זמין עכשיו בגוגל פליי! הורידו בחינם ושחקו בכל מקום!' },
                  { emoji: '🎁', title: 'מבצע מטורף!', msg: 'בונוס כפול על כל משחק! שחקו כמה שיותר וצברו XP ומטבעות!' },
                  { emoji: '⭐', title: 'Premium חדש!', msg: 'מסלול Premium חדש! שיחות AI, מולטיפלייר, וטורנירים ללא הגבלה!' },
                  { emoji: '🔥', title: 'אתגר שבועי!', msg: 'מי ישיג הכי הרבה XP השבוע? הפרס: 500 Lingos!' },
                ].map((tpl, i) => (
                  <button key={i} onClick={() => { setAnnounceEmoji(tpl.emoji); setAnnounceTitle(tpl.title); setAnnounceMsg(tpl.msg); }}
                    className="py-2 px-3 rounded-xl text-xs font-bold text-right"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0' }}>
                    {tpl.emoji} {tpl.title}
                  </button>
                ))}
              </div>

              <div className="h-px mb-4" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <p className="text-xs font-bold text-indigo-300 mb-2">✏️ או כתוב הודעה:</p>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <select value={announceEmoji} onChange={e => setAnnounceEmoji(e.target.value)}
                    className="px-3 py-2 rounded-xl text-lg" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none', width: 60 }}>
                    {['📢', '🎉', '🔥', '⚡', '🏆', '🎮', '🛒', '⚠️', '💡', '🎁', '📱', '⭐'].map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <input type="text" placeholder="כותרת..." value={announceTitle} onChange={e => setAnnounceTitle(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                </div>
                <textarea placeholder="תוכן ההודעה..." value={announceMsg} onChange={e => setAnnounceMsg(e.target.value)} rows={3}
                  className="w-full px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none', resize: 'none' }} />
                {announceTitle && (
                  <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(99,102,241,0.1)', border: '1px dashed rgba(99,102,241,0.3)' }}>
                    <div className="text-[10px] text-slate-500 mb-1">תצוגה מקדימה:</div>
                    <div className="text-2xl mb-1">{announceEmoji}</div>
                    <div className="text-sm font-black text-white">{announceTitle}</div>
                    <div className="text-xs text-slate-300 mt-1">{announceMsg}</div>
                  </div>
                )}
                <button onClick={sendAnnouncement} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>📢 שלח לכולם</button>
              </div>
            </div>
          </div>
        )}

        {/* Premium Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-xl font-black" style={{ color: '#fbbf24' }}>{stats.premium}</div>
                <div className="text-[10px] text-slate-400">⭐ Premium</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-xl font-black text-white">{stats.total - stats.premium}</div>
                <div className="text-[10px] text-slate-400">Free</div>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
                <div className="text-xl font-black" style={{ color: '#34d399' }}>{stats.total > 0 ? Math.round(stats.premium / stats.total * 100) : 0}%</div>
                <div className="text-[10px] text-slate-400">המרה</div>
              </div>
            </div>

            {/* Give all premium */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-sm font-black text-white mb-3">⭐ ניהול Premium</h3>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={async () => {
                  if (!confirm('לתת Premium לכל המשתמשים?')) return;
                  await supabase.from('profiles').update({ is_premium: true, premium_plan: 'admin_granted', premium_started: new Date().toISOString(), premium_expires: new Date(Date.now() + 365 * 86400000).toISOString() }).neq('id', '');
                  showMsg('⭐ כולם קיבלו Premium!'); loadUsers();
                }} className="py-3 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}>⭐ Premium לכולם</button>
                <button onClick={async () => {
                  if (!confirm('להסיר Premium מכולם?')) return;
                  await supabase.from('profiles').update({ is_premium: false }).neq('id', '');
                  showMsg('❌ Premium הוסר מכולם'); loadUsers();
                }} className="py-3 rounded-xl text-xs font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>❌ הסר מכולם</button>
              </div>
              <p className="text-[10px] text-slate-500 text-center">שימוש זה לטסטינג ומשתמשים מיוחדים</p>
            </div>

            {/* WhatsApp Blast */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <h3 className="text-sm font-black text-white mb-3">📱 הודעת WhatsApp לכולם</h3>
              <p className="text-xs text-slate-400 mb-3">צור הודעת WhatsApp עם לינק לגוגל פליי</p>
              <input type="text" placeholder="קישור לגוגל פליי (אופציונלי)..." value={playStoreUrl} onChange={e => setPlayStoreUrl(e.target.value)}
                className="w-full px-4 py-2 rounded-xl text-sm mb-3" dir="ltr"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />

              {/* Preview */}
              <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <p className="text-xs text-slate-300 whitespace-pre-line">{getWhatsAppBlast()}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => {
                  const text = getWhatsAppBlast();
                  navigator.clipboard.writeText(text).catch(() => {});
                  showMsg('✅ הועתק!');
                }} className="flex-1 py-2.5 rounded-xl text-xs font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}>📋 העתק הודעה</button>
                <button onClick={async () => {
                  const text = getWhatsAppBlast();
                  try {
                    if (navigator.share) { await navigator.share({ title: 'LingoQuest', text }); }
                    else { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); }
                  } catch (_) {}
                }} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>📤 שתף</button>
              </div>
            </div>

            {/* Premium Users List */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h3 className="text-sm font-black text-white mb-3">⭐ משתמשי Premium ({stats.premium})</h3>
              {users.filter(u => u.is_premium).length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">אין משתמשי Premium</p>
              ) : (
                <div className="space-y-1.5">
                  {users.filter(u => u.is_premium).map(u => (
                    <div key={u.id} className="flex items-center justify-between rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-bold text-white">{u.nickname}</span>
                        <span className="text-[10px] text-slate-400">Lv.{u.level}</span>
                      </div>
                      <button onClick={() => togglePremium(u.id, u.nickname, true)} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>הסר</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setEditUser(null)}>
            <div className="w-full max-w-md rounded-3xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-black text-white mb-4">✏️ {editUser.nickname}</h3>
              <div className="space-y-3">
                {[{ k: 'nickname', l: '🎭 כינוי', t: 'text' }, { k: 'level', l: '📊 רמה', t: 'number' }, { k: 'xp', l: '⭐ XP', t: 'number' }, { k: 'lingos', l: '💰 Lingos', t: 'number' }, { k: 'tickets', l: '🎫 Tickets', t: 'number' }, { k: 'games_played', l: '🎮 משחקים', t: 'number' }, { k: 'arena_wins', l: '⚔️ ניצחונות', t: 'number' }].map(f => (
                  <div key={f.k}>
                    <label className="block text-xs font-bold mb-1 text-indigo-300">{f.l}</label>
                    <input type={f.t} value={editForm[f.k]} onChange={e => setEditForm((p: any) => ({ ...p, [f.k]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">🎯 מסלול</label>
                  <select value={editForm.track} onChange={e => setEditForm((p: any) => ({ ...p, track: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }}>
                    <option value="explorers">🧭 Explorers</option><option value="voyagers">🚀 Voyagers</option><option value="masters">👑 Masters</option>
                  </select>
                </div>
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