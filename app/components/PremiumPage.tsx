'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import ParentalGate from './ParentalGate';

const PLANS = [
  { id: 'monthly', price: '₪9.90', priceNum: 9.90, period: 'חודשי', periodEn: 'Monthly', save: '', popular: false },
  { id: 'yearly', price: '₪89.90', priceNum: 89.90, period: 'שנתי', periodEn: 'Yearly', save: '25% חיסכון!', popular: true },
];

const LINGO_PACKS = [
  { id: 'lingos_500', amount: 500, price: '₪2.90' },
  { id: 'lingos_1000', amount: 1000, price: '₪4.90' },
  { id: 'lingos_3000', amount: 3000, price: '₪9.90' },
];

export default function PremiumPage({ profile, userId, onClose, refreshProfile }: { profile: any; userId: string; onClose: () => void; refreshProfile: () => void }) {
  const [showGate, setShowGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isPremium = profile.is_premium === true;
  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
  const trialActive = trialEnd && trialEnd > new Date();
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

  const handlePurchase = (planId: string) => {
    setShowGate(true);
    setPendingAction(() => async () => {
      setPurchasing(true);
      // In production: integrate with Google Play Billing or Stripe
      // For now: activate premium directly
      try {
        const updates: any = { is_premium: true, premium_plan: planId, premium_started: new Date().toISOString() };
        if (planId === 'yearly') {
          updates.premium_expires = new Date(Date.now() + 365 * 86400000).toISOString();
        } else {
          updates.premium_expires = new Date(Date.now() + 30 * 86400000).toISOString();
        }
        await supabase.from('profiles').update(updates).eq('id', userId);
        sounds.perfect();
        setShowSuccess(true);
        refreshProfile();
      } catch (_) {}
      setPurchasing(false);
    });
  };

  const handleBuyLingos = (pack: typeof LINGO_PACKS[0]) => {
    setShowGate(true);
    setPendingAction(() => async () => {
      setPurchasing(true);
      try {
        await supabase.from('profiles').update({ lingos: (profile.lingos || 0) + pack.amount }).eq('id', userId);
        sounds.coin();
        setShowSuccess(true);
        refreshProfile();
      } catch (_) {}
      setPurchasing(false);
    });
  };

  const startTrial = async () => {
    if (profile.trial_used) return;
    setShowGate(true);
    setPendingAction(() => async () => {
      try {
        await supabase.from('profiles').update({
          is_premium: true,
          trial_end: new Date(Date.now() + 7 * 86400000).toISOString(),
          trial_used: true,
        }).eq('id', userId);
        sounds.perfect();
        setShowSuccess(true);
        refreshProfile();
      } catch (_) {}
    });
  };

  if (showSuccess) return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-3xl p-8 text-center" style={{ background: '#1e1b4b', border: '2px solid #22c55e' }} dir="rtl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">ברוך הבא ל-Premium!</h2>
        <p className="text-sm text-slate-300 mb-6">כל המשחקים, ההרפתקאות והפיצ'רים פתוחים בשבילך!</p>
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['🎮 כל המשחקים', '🤖 AI ללא הגבלה', '🌐 מולטיפלייר', '🏆 טורנירים', '📖 כל הסיפורים', '💰 500 Lingos/חודש'].map(f => (
            <span key={f} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', color: '#34d399' }}>{f}</span>
          ))}
        </div>
        <button onClick={() => { setShowSuccess(false); onClose(); }}
          className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>🚀 יאללה לשחק!</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-y-auto z-50" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      {showGate && pendingAction && (
        <ParentalGate action="רכישה" onPass={() => { setShowGate(false); pendingAction(); }} onCancel={() => { setShowGate(false); setPendingAction(null); }} />
      )}

      <div className="px-4 py-6 max-w-lg mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">⭐ Premium</h2>
          <button onClick={onClose} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>✕ סגור</button>
        </div>

        {/* Current Status */}
        {isPremium && (
          <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="text-2xl mb-1">⭐</div>
            <p className="text-sm font-bold text-green-400">אתה משתמש Premium!</p>
            {trialActive && <p className="text-xs text-slate-400 mt-1">תקופת ניסיון: {daysLeft} ימים נותרו</p>}
          </div>
        )}

        {/* Hero */}
        {!isPremium && (
          <div className="rounded-3xl p-6 mb-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <img src="/icon-192.png" alt="LingoQuest" className="w-16 h-16 rounded-xl mx-auto mb-3" />
            <h3 className="text-xl font-black text-white mb-1">LingoQuest Premium</h3>
            <p className="text-xs text-slate-400 mb-4">הפוך את הלמידה לחוויה בלי גבולות!</p>

            {/* Features */}
            <div className="space-y-2 text-right mb-5">
              {[
                { emoji: '🎮', text: 'כל 6 סוגי המשחקים ללא הגבלה' },
                { emoji: '🤖', text: 'שיחות AI באנגלית ללא הגבלה' },
                { emoji: '🌐', text: 'מולטיפלייר ותחרויות' },
                { emoji: '📖', text: 'כל סיפורי ההרפתקה' },
                { emoji: '🏆', text: 'יצירת טורנירים' },
                { emoji: '🛒', text: 'כל החנות + פריטים בלעדיים' },
                { emoji: '📊', text: 'דוח התקדמות להורים' },
                { emoji: '💰', text: '500 Lingos בונוס כל חודש' },
                { emoji: '🚫', text: 'ללא רמה מקסימלית' },
              ].map(f => (
                <div key={f.emoji} className="flex items-center gap-3 rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span className="text-lg">{f.emoji}</span>
                  <span className="text-xs font-bold text-white">{f.text}</span>
                </div>
              ))}
            </div>

            {/* Trial */}
            {!profile.trial_used && (
              <button onClick={startTrial}
                className="w-full py-4 rounded-2xl text-white font-black text-base mb-3 transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 25px rgba(34,197,94,0.4)' }}>
                🎁 7 ימי ניסיון חינם!
              </button>
            )}
          </div>
        )}

        {/* Plans */}
        {!isPremium && (
          <div className="space-y-3 mb-6">
            <h3 className="text-sm font-black text-white mb-2">📋 בחר מסלול:</h3>
            {PLANS.map(plan => (
              <button key={plan.id} onClick={() => handlePurchase(plan.id)} disabled={purchasing}
                className="w-full rounded-2xl p-4 text-right transition-all hover:scale-[1.01] disabled:opacity-60 relative"
                style={{ background: plan.popular ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)', border: `2px solid ${plan.popular ? '#8b5cf6' : 'rgba(255,255,255,0.1)'}` }}>
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#8b5cf6', color: 'white' }}>הכי משתלם!</div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-white">{plan.price}</span>
                    <span className="text-xs text-slate-400 mr-2">/ {plan.period}</span>
                  </div>
                  <div className="text-left">
                    {plan.save && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>{plan.save}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Lingos Packs */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-white mb-3">💰 חבילות Lingos:</h3>
          <div className="grid grid-cols-3 gap-2">
            {LINGO_PACKS.map(pack => (
              <button key={pack.id} onClick={() => handleBuyLingos(pack)} disabled={purchasing}
                className="rounded-xl p-3 text-center transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-xl mb-1">💰</div>
                <div className="text-sm font-black text-white">{pack.amount}</div>
                <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>{pack.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Restore */}
        <div className="text-center space-y-2">
          <button onClick={onClose} className="text-xs text-slate-500">שחזר רכישה קודמת</button>
          <p className="text-[10px] text-slate-600">המנוי מתחדש אוטומטית. ניתן לבטל בכל עת.</p>
          <button onClick={() => window.open('/privacy', '_blank')} className="text-[10px] text-slate-600 underline">מדיניות פרטיות</button>
        </div>
      </div>
    </div>
  );
}