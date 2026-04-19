'use client';
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';

const AVATARS = [
  { id: 'default', emoji: '🧭', name: 'חוקר' },
  { id: 'ninja', emoji: '🥷', name: 'נינג\'ה' },
  { id: 'astronaut', emoji: '👩‍🚀', name: 'אסטרונאוט' },
  { id: 'pirate', emoji: '🏴‍☠️', name: 'פיראט' },
  { id: 'fairy', emoji: '🧚', name: 'פיה' },
  { id: 'robot', emoji: '🤖', name: 'רובוט' },
  { id: 'wizard', emoji: '🧙‍♂️', name: 'קוסם' },
  { id: 'superhero', emoji: '🦸', name: 'גיבור על' },
  { id: 'dragon', emoji: '🐲', name: 'דרקון' },
  { id: 'alien', emoji: '👽', name: 'חייזר' },
  { id: 'princess', emoji: '👸', name: 'נסיכה' },
  { id: 'knight', emoji: '🛡️', name: 'אביר' },
];

const SHOP_EMOJI: Record<string, string> = {
  skin_blue: '🔵', skin_fire: '🔴', skin_gold: '🟡', skin_purple: '🟣', skin_rainbow: '🌈',
  hat_crown: '👑', hat_wizard: '🧙', hat_cap: '🧢', hat_pirate: '🏴‍☠️', hat_helmet: '⛑️', hat_party: '🎉',
  pet_cat: '🐱', pet_dog: '🐶', pet_dragon: '🐉', pet_owl: '🦉', pet_unicorn: '🦄', pet_phoenix: '🔥',
  avatar_ninja: '🥷', avatar_astronaut: '👩‍🚀', avatar_pirate: '🏴‍☠️', avatar_fairy: '🧚', avatar_robot: '🤖',
  avatar_wizard: '🧙‍♂️', avatar_superhero: '🦸', avatar_dragon: '🐲',
  costume_knight: '🛡️', costume_princess: '👸', costume_alien: '👽', costume_zombie: '🧟', costume_ghost: '👻',
};

const TRACK_INFO: Record<string, { name: string; emoji: string; color: string }> = {
  explorers: { name: 'חוקרים', emoji: '🧭', color: '#22c55e' },
  voyagers: { name: 'מגלים', emoji: '🚀', color: '#6366f1' },
  masters: { name: 'מומחים', emoji: '👑', color: '#f59e0b' },
};

export default function ProfileCard({ profile, userId, refreshProfile, onClose }: { profile: any; userId: string; refreshProfile: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<'card' | 'settings' | 'inventory' | 'gift'>('card');
  const [editName, setEditName] = useState(profile.nickname);
  const [editTrack, setEditTrack] = useState(profile.track);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.equipped?.avatar || 'default');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [giftTarget, setGiftTarget] = useState('');
  const [giftItem, setGiftItem] = useState<string | null>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [searchingPlayers, setSearchingPlayers] = useState(false);

  const track = TRACK_INFO[profile.track] || TRACK_INFO.explorers;
  const inventory = profile.inventory || [];
  const equipped = profile.equipped || {};
  const avatarEmoji = AVATARS.find(a => a.id === (equipped.avatar || 'default'))?.emoji || '🧭';

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const saveSettings = async () => {
    setSaving(true);
    // Check unique name
    if (editName !== profile.nickname) {
      const { data } = await supabase.from('profiles').select('id').eq('nickname', editName.trim());
      if (data && data.filter(u => u.id !== userId).length > 0) { showMsg('❌ השם תפוס!'); setSaving(false); return; }
    }
    const newEquipped = { ...equipped, avatar: selectedAvatar };
    const { error } = await supabase.from('profiles').update({
      nickname: editName.trim(), track: editTrack, equipped: newEquipped,
    }).eq('id', userId);
    if (error) showMsg('❌ שגיאה'); else { showMsg('✅ נשמר!'); sounds.coin(); refreshProfile(); }
    setSaving(false);
  };

  const searchPlayers = async () => {
    if (!giftTarget.trim()) return;
    setSearchingPlayers(true);
    const { data } = await supabase.from('profiles').select('id,nickname,track').ilike('nickname', `%${giftTarget}%`).neq('id', userId).limit(5);
    setPlayers(data || []);
    setSearchingPlayers(false);
  };

  const sendGift = async (targetId: string, targetName: string) => {
    if (!giftItem) return;
    // Remove from my inventory
    const newInv = inventory.filter((i: string) => i !== giftItem);
    // Unequip if equipped
    const newEquipped = { ...equipped };
    Object.keys(newEquipped).forEach(k => { if (newEquipped[k] === giftItem) newEquipped[k] = null; });
    await supabase.from('profiles').update({ inventory: newInv, equipped: newEquipped }).eq('id', userId);
    // Add to target inventory
    const { data: target } = await supabase.from('profiles').select('inventory').eq('id', targetId).single();
    if (target) {
      const targetInv = [...(target.inventory || []), giftItem];
      await supabase.from('profiles').update({ inventory: targetInv }).eq('id', targetId);
    }
    sounds.coin();
    showMsg(`🎁 ${SHOP_EMOJI[giftItem] || '🎁'} נשלח ל-${targetName}!`);
    setGiftItem(null);
    setGiftTarget('');
    setPlayers([]);
    refreshProfile();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl max-h-[90vh] overflow-y-auto" style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)' }} dir="rtl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-white">🪪 הפרופיל שלי</h2>
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>✕</button>
        </div>

        {msg && <div className="mx-5 mb-3 p-2 rounded-xl text-center text-sm font-bold" style={{ background: msg.startsWith('✅') || msg.startsWith('🎁') ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: msg.startsWith('❌') ? '#f87171' : '#34d399' }}>{msg}</div>}

        {/* Tabs */}
        <div className="flex gap-1.5 px-5 mb-4">
          {[{ id: 'card', l: '🪪 כרטיס' }, { id: 'settings', l: '⚙️ הגדרות' }, { id: 'inventory', l: '🎒 פריטים' }, { id: 'gift', l: '🎁 מתנה' }].map(t => (
            <button key={t.id} onClick={() => { sounds.tap(); setTab(t.id as any); }}
              className="flex-1 py-2 rounded-xl text-xs font-bold"
              style={{ background: tab === t.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: tab === t.id ? '#a5b4fc' : '#94a3b8' }}>{t.l}</button>
          ))}
        </div>

        <div className="px-5 pb-5">
          {/* ID Card */}
          {tab === 'card' && (
            <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(168,85,247,0.1))', border: '2px solid rgba(99,102,241,0.3)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: `${track.color}30`, border: `3px solid ${track.color}` }}>{avatarEmoji}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-white">{profile.nickname}</h3>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: `${track.color}25`, color: track.color }}>{track.emoji} {track.name}</span>
                  <div className="text-xs text-slate-400 mt-1">רמה {profile.level} | ⭐ {profile.xp} XP</div>
                </div>
              </div>
              <div className="h-px mb-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div><div className="text-lg font-black" style={{ color: '#fbbf24' }}>💰 {profile.lingos}</div><div className="text-[10px] text-slate-400">מטבעות</div></div>
                <div><div className="text-lg font-black" style={{ color: '#a5b4fc' }}>🎫 {profile.tickets}</div><div className="text-[10px] text-slate-400">כרטיסים</div></div>
                <div><div className="text-lg font-black text-white">🎮 {profile.games_played}</div><div className="text-[10px] text-slate-400">משחקים</div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div><div className="text-lg font-black" style={{ color: '#34d399' }}>⚔️ {profile.arena_wins}</div><div className="text-[10px] text-slate-400">ניצחונות</div></div>
                <div><div className="text-lg font-black" style={{ color: '#c084fc' }}>🛍️ {inventory.length}</div><div className="text-[10px] text-slate-400">פריטים</div></div>
              </div>
              <div className="h-px my-3" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="text-center">
                <div className="text-[10px] text-slate-500">קוד הזמנה</div>
                <div className="text-sm font-black text-indigo-300">{profile.referral_code}</div>
                <div className="text-[10px] text-slate-500">{profile.referral_count} חברים הוזמנו</div>
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-indigo-300">🎭 כינוי</label>
                <input type="text" value={editName} onChange={e => setEditName(e.target.value)} maxLength={20}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-indigo-300">🎯 מסלול</label>
                <select value={editTrack} onChange={e => setEditTrack(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }}>
                  <option value="explorers">🧭 חוקרים (5-7)</option>
                  <option value="voyagers">🚀 מגלים (8-11)</option>
                  <option value="masters">👑 מומחים (12-14)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2 text-indigo-300">🦸 בחר אווטאר</label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATARS.map(a => (
                    <button key={a.id} onClick={() => { sounds.tap(); setSelectedAvatar(a.id); }}
                      className="p-2 rounded-xl text-center transition-all hover:scale-105"
                      style={{ background: selectedAvatar === a.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', border: `2px solid ${selectedAvatar === a.id ? '#6366f1' : 'rgba(255,255,255,0.08)'}` }}>
                      <div className="text-2xl">{a.emoji}</div>
                      <div className="text-[9px] text-slate-400">{a.name}</div>
                    </button>
                  ))}
                </div>
              </div>
              {profile.level >= 5 && (
                <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="text-xs text-green-400">📸 הגעת לרמה 5! ניתן להעלות תמונת פרופיל בגרסה הבאה</div>
                </div>
              )}
              <button onClick={saveSettings} disabled={saving}
                className="w-full py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                {saving ? '⏳...' : '💾 שמור שינויים'}
              </button>
            </div>
          )}

          {/* Inventory */}
          {tab === 'inventory' && (
            <div>
              {inventory.length === 0 ? (
                <div className="text-center py-8"><div className="text-4xl mb-3">🛍️</div><p className="text-sm text-white font-bold">אין פריטים עדיין</p><p className="text-xs text-slate-400">קנה פריטים בחנות!</p></div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {inventory.map((itemId: string, i: number) => {
                    const isEquipped = Object.values(equipped).includes(itemId);
                    return (
                      <div key={i} className="rounded-xl p-3 text-center" style={{ background: isEquipped ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isEquipped ? '#6366f1' : 'rgba(255,255,255,0.08)'}` }}>
                        <div className="text-2xl">{SHOP_EMOJI[itemId] || '🎁'}</div>
                        <div className="text-[9px] text-slate-400 mt-1">{itemId.split('_').pop()}</div>
                        {isEquipped && <div className="text-[9px] text-indigo-300 font-bold">מצויד ✅</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Gift */}
          {tab === 'gift' && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-3xl mb-1">🎁</div>
                <p className="text-sm font-bold text-white">שלח מתנה לחבר!</p>
                <p className="text-xs text-slate-400">בחר פריט מהאינוונטורי ושלח לשחקן אחר</p>
              </div>

              {/* Select item */}
              <div>
                <label className="block text-xs font-bold mb-2 text-indigo-300">1. בחר פריט לשליחה:</label>
                {inventory.length === 0 ? <p className="text-xs text-slate-500">אין פריטים</p> : (
                  <div className="flex flex-wrap gap-2">
                    {inventory.map((itemId: string, i: number) => (
                      <button key={i} onClick={() => { sounds.tap(); setGiftItem(giftItem === itemId ? null : itemId); }}
                        className="px-3 py-2 rounded-xl text-sm transition-all hover:scale-105"
                        style={{ background: giftItem === itemId ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)', border: `2px solid ${giftItem === itemId ? '#22c55e' : 'rgba(255,255,255,0.08)'}`, color: '#e2e8f0' }}>
                        {SHOP_EMOJI[itemId] || '🎁'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search player */}
              {giftItem && (
                <div>
                  <label className="block text-xs font-bold mb-1 text-indigo-300">2. חפש שחקן:</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="שם השחקן..." value={giftTarget} onChange={e => setGiftTarget(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
                    <button onClick={searchPlayers} disabled={searchingPlayers}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      {searchingPlayers ? '⏳' : '🔍'}
                    </button>
                  </div>
                  {players.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {players.map(p => (
                        <div key={p.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span className="text-lg">{TRACK_INFO[p.track]?.emoji || '🧭'}</span>
                          <span className="flex-1 text-sm font-bold text-white">{p.nickname}</span>
                          <button onClick={() => sendGift(p.id, p.nickname)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
                            🎁 שלח
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}