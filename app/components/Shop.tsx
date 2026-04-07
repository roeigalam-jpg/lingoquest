'use client';
import { useState } from 'react';
import { sounds } from '../lib/sounds';
import { buyItem, updateProfile } from '../lib/api';

const SHOP_ITEMS = [
  { id: 'skin_blue', name: 'Ocean Blue', emoji: '🔵', type: 'skin', price: 200 },
  { id: 'skin_fire', name: 'Fire Red', emoji: '🔴', type: 'skin', price: 200 },
  { id: 'skin_gold', name: 'Golden Hero', emoji: '🟡', type: 'skin', price: 500 },
  { id: 'skin_purple', name: 'Royal Purple', emoji: '🟣', type: 'skin', price: 300 },
  { id: 'hat_crown', name: 'Crown', emoji: '👑', type: 'hat', price: 400 },
  { id: 'hat_wizard', name: 'Wizard Hat', emoji: '🧙', type: 'hat', price: 350 },
  { id: 'hat_cap', name: 'Cool Cap', emoji: '🧢', type: 'hat', price: 150 },
  { id: 'hat_pirate', name: 'Pirate Hat', emoji: '🏴‍☠️', type: 'hat', price: 300 },
  { id: 'pet_cat', name: 'Kitty', emoji: '🐱', type: 'pet', price: 600 },
  { id: 'pet_dog', name: 'Puppy', emoji: '🐶', type: 'pet', price: 600 },
  { id: 'pet_dragon', name: 'Baby Dragon', emoji: '🐉', type: 'pet', price: 1000 },
  { id: 'pet_owl', name: 'Wise Owl', emoji: '🦉', type: 'pet', price: 800 },
];

export default function Shop({ profile, userId, refreshProfile }: { profile: any; userId: string; refreshProfile: () => void }) {
  const [tab, setTab] = useState('skin');
  const [buying, setBuying] = useState<string | null>(null);
  const items = SHOP_ITEMS.filter(i => i.type === tab);

  const handleBuy = async (item: typeof SHOP_ITEMS[0]) => {
    const inventory = profile.inventory || [];
    if (inventory.includes(item.id)) {
      // Toggle equip
      const equipped = profile.equipped || {};
      const newEquipped = { ...equipped, [item.type]: equipped[item.type] === item.id ? null : item.id };
      try {
        await updateProfile(userId, { equipped: newEquipped });
        sounds.click();
        refreshProfile();
      } catch (e) { console.error(e); }
      return;
    }
    if (profile.lingos < item.price) { sounds.wrong(); return; }
    setBuying(item.id);
    try {
      await buyItem(userId, item.id, item.price, item.type);
      sounds.coin();
      refreshProfile();
    } catch (e) { console.error(e); }
    setBuying(null);
  };

  return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-white">🛒 Shop</h2>
        <span className="text-sm font-bold px-3 py-1.5 rounded-xl" style={{ background: 'rgba(34,197,94,0.15)', color: '#34d399' }}>💰 {profile.lingos}</span>
      </div>
      <div className="flex gap-2 mb-5">
        {[{ id: 'skin', label: '🎨 Skins' }, { id: 'hat', label: '🎩 Hats' }, { id: 'pet', label: '🐾 Pets' }].map(t => (
          <button key={t.id} onClick={() => { sounds.tap(); setTab(t.id); }}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all"
            style={{ background: tab === t.id ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', border: tab === t.id ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)', color: tab === t.id ? '#a5b4fc' : '#94a3b8' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map(item => {
          const owned = (profile.inventory || []).includes(item.id);
          const equipped = (profile.equipped || {})[item.type] === item.id;
          const canBuy = profile.lingos >= item.price;
          return (
            <div key={item.id} className="rounded-2xl p-4 text-center transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${equipped ? '#6366f1' : 'rgba(255,255,255,0.1)'}`, boxShadow: equipped ? '0 0 20px rgba(99,102,241,0.2)' : 'none' }}>
              <div className="text-4xl mb-2">{item.emoji}</div>
              <h4 className="text-sm font-black text-white mb-1">{item.name}</h4>
              {owned ? (
                <button onClick={() => handleBuy(item)} className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.03]"
                  style={{ background: equipped ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)', color: equipped ? '#a5b4fc' : '#94a3b8', border: equipped ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)' }}>
                  {equipped ? '✅ Equipped' : 'Equip'}
                </button>
              ) : (
                <button onClick={() => handleBuy(item)} disabled={!canBuy || buying === item.id}
                  className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.03] disabled:opacity-40"
                  style={{ background: canBuy ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.05)', color: 'white' }}>
                  {buying === item.id ? '...' : `💰 ${item.price}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}