'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import ParentalGate from './ParentalGate';

export default function PremiumPage({ profile, userId, onClose, refreshProfile }: { profile: any; userId: string; onClose: () => void; refreshProfile: () => void }) {
  const [showGate, setShowGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const isPremium = profile.is_premium === true;
  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
  const trialActive = trialEnd && trialEnd > new Date();
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / 86400000)) : 0;

  const gatedAction = (action: string, callback: () => void) => {
    setPendingAction(() => callback);
    setShowGate(true);
  };

  const handlePurchase = () => {
    gatedAction('רכישת Premium', async () => {
      setPurchasing(true);
      try {
        const updates: any = { is_premium: true, premium_plan: selectedPlan, premium_started: new Date().toISOString() };
        updates.premium_expires = new Date(Date.now() + (selectedPlan === 'yearly' ? 365 : 30) * 86400000).toISOString();
        await supabase.from('profiles').update(updates).eq('id', userId);
        sounds.perfect();
        setShowSuccess(true);
        refreshProfile();
      } catch (_) {}
      setPurchasing(false);
    });
  };

  const startTrial = () => {
    if (profile.trial_used) return;
    gatedAction('הפעלת ניסיון חינם', async () => {
      try {
        await supabase.from('profiles').update({ is_premium: true, trial_end: new Date(Date.now() + 7 * 86400000).toISOString(), trial_used: true }).eq('id', userId);
        sounds.perfect();
        setShowSuccess(true);
        refreshProfile();
      } catch (_) {}
    });
  };

  const handleBuyLingos = (amount: number) => {
    gatedAction('קניית Lingos', async () => {
      try {
        await supabase.from('profiles').update({ lingos: (profile.lingos || 0) + amount }).eq('id', userId);
        sounds.coin(); setShowSuccess(true); refreshProfile();
      } catch (_) {}
    });
  };

  // Success screen
  if (showSuccess) return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'radial-gradient(circle at 50% 30%, #312e81 0%, #0f0c29 70%)' }}>
      <div className="w-full max-w-sm text-center" dir="rtl">
        <div className="text-8xl mb-4 animate-bounce">🎉</div>
        <h2 className="text-3xl font-black text-white mb-2">ברוך הבא!</h2>
        <p className="text-lg font-bold mb-6" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⭐ Premium מופעל! ⭐</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {['🎮 כל המשחקים', '🤖 AI ללא הגבלה', '🌐 מולטיפלייר', '🏆 טורנירים', '📖 כל הסיפורים', '💰 500 Lingos'].map(f => (
            <span key={f} className="text-xs px-3 py-2 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399', border: '1px solid rgba(34,197,94,0.3)' }}>{f}</span>
          ))}
        </div>
        <button onClick={() => { setShowSuccess(false); onClose(); }}
          className="w-full py-4 rounded-2xl text-white font-black text-lg" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 30px rgba(34,197,94,0.4)' }}>🚀 יאללה לשחק!</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 overflow-y-auto z-50" style={{ background: 'radial-gradient(circle at 50% 20%, #312e81 0%, #0f0c29 60%)' }}>
      {showGate && pendingAction && (
        <ParentalGate action="רכישה" onPass={() => { setShowGate(false); pendingAction(); }} onCancel={() => { setShowGate(false); setPendingAction(null); }} />
      )}

      <div className="px-4 py-6 max-w-lg mx-auto pb-20" dir="rtl">
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center text-lg z-10" style={{ background: 'rgba(255,255,255,0.1)' }}>✕</button>

        {/* Hero with logo */}
        <div className="text-center pt-4 mb-6">
          <img src="/icon-512.png" alt="LingoQuest" className="w-24 h-24 rounded-2xl mx-auto mb-4" style={{ boxShadow: '0 0 40px rgba(99,102,241,0.4)' }} />
          <h2 className="text-3xl font-black mb-1" style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⭐ LingoQuest Premium</h2>
          <p className="text-sm text-slate-400">למידה בלי גבולות!</p>
        </div>

        {/* Already premium */}
        {isPremium && (
          <div className="rounded-2xl p-5 mb-6 text-center" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05))', border: '2px solid rgba(34,197,94,0.3)' }}>
            <div className="text-4xl mb-2">⭐</div>
            <p className="text-lg font-black text-green-400">אתה Premium!</p>
            {trialActive && <p className="text-xs text-slate-400 mt-1">ניסיון: {daysLeft} ימים נותרו</p>}
          </div>
        )}

        {!isPremium && (
          <>
            {/* Features grid */}
            <div className="rounded-3xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: '🎮', title: 'כל המשחקים', desc: '6 סוגים ללא הגבלה' },
                  { emoji: '🤖', title: 'שיחות AI', desc: 'דיבור באנגלית ללא הגבלה' },
                  { emoji: '🌐', title: 'מולטיפלייר', desc: 'שחק מול חברים!' },
                  { emoji: '📖', title: 'כל הסיפורים', desc: '6 הרפתקאות עם דמויות' },
                  { emoji: '🏆', title: 'טורנירים', desc: 'צור ותתחרה!' },
                  { emoji: '💰', title: '500 Lingos', desc: 'בונוס כל חודש!' },
                  { emoji: '🛒', title: 'חנות מלאה', desc: '30+ פריטים בלעדיים' },
                  { emoji: '📊', title: 'דוח להורים', desc: 'מעקב התקדמות' },
                ].map(f => (
                  <div key={f.emoji} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="text-2xl mb-1">{f.emoji}</div>
                    <div className="text-xs font-black text-white">{f.title}</div>
                    <div className="text-[10px] text-slate-500">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Free trial */}
            {!profile.trial_used && (
              <button onClick={startTrial}
                className="w-full py-5 rounded-2xl text-white font-black text-lg mb-5 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 30px rgba(34,197,94,0.4)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)', animation: 'shimmer 2s infinite' }} />
                🎁 7 ימי ניסיון חינם!
                <div className="text-xs font-normal mt-1 opacity-80">בלי התחייבות, בלי כרטיס אשראי</div>
              </button>
            )}

            {/* Plans */}
            <div className="space-y-3 mb-5">
              {/* Yearly - recommended */}
              <button onClick={() => setSelectedPlan('yearly')}
                className="w-full rounded-2xl p-4 text-right transition-all relative overflow-hidden"
                style={{ background: selectedPlan === 'yearly' ? 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.15))' : 'rgba(255,255,255,0.03)', border: `2px solid ${selectedPlan === 'yearly' ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-b-lg text-[10px] font-black" style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)', color: 'white' }}>🔥 הכי משתלם!</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedPlan === 'yearly' ? '#8b5cf6' : 'rgba(255,255,255,0.2)' }}>
                      {selectedPlan === 'yearly' && <div className="w-3 h-3 rounded-full" style={{ background: '#8b5cf6' }} />}
                    </div>
                    <div>
                      <div className="text-base font-black text-white">שנתי</div>
                      <div className="text-[10px] text-slate-400">₪7.49/חודש בלבד!</div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-black text-white">₪89.90</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>חיסכון 25%!</span>
                  </div>
                </div>
              </button>

              {/* Monthly */}
              <button onClick={() => setSelectedPlan('monthly')}
                className="w-full rounded-2xl p-4 text-right transition-all"
                style={{ background: selectedPlan === 'monthly' ? 'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(99,102,241,0.15))' : 'rgba(255,255,255,0.03)', border: `2px solid ${selectedPlan === 'monthly' ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedPlan === 'monthly' ? '#8b5cf6' : 'rgba(255,255,255,0.2)' }}>
                      {selectedPlan === 'monthly' && <div className="w-3 h-3 rounded-full" style={{ background: '#8b5cf6' }} />}
                    </div>
                    <div>
                      <div className="text-base font-black text-white">חודשי</div>
                      <div className="text-[10px] text-slate-400">גמישות מלאה</div>
                    </div>
                  </div>
                  <div className="text-lg font-black text-white">₪9.90<span className="text-xs text-slate-400 font-normal">/חודש</span></div>
                </div>
              </button>
            </div>

            {/* Purchase button */}
            <button onClick={handlePurchase} disabled={purchasing}
              className="w-full py-4 rounded-2xl text-white font-black text-lg mb-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', boxShadow: '0 4px 30px rgba(99,102,241,0.4)' }}>
              {purchasing ? '⏳ מעבד...' : `⭐ שדרג עכשיו - ${selectedPlan === 'yearly' ? '₪89.90/שנה' : '₪9.90/חודש'}`}
            </button>

            {/* Comparison */}
            <div className="rounded-2xl overflow-hidden mb-6" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="grid grid-cols-3 text-center text-[10px] font-bold py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="text-slate-400">תכונה</div>
                <div className="text-slate-400">Free</div>
                <div style={{ color: '#fbbf24' }}>⭐ Premium</div>
              </div>
              {[
                ['משחקים ביום', '3', '♾️'],
                ['סוגי משחקים', '3', '6'],
                ['סיפורי הרפתקה', '2', '6'],
                ['שיחות AI', '3/יום', '♾️'],
                ['מולטיפלייר', '❌', '✅'],
                ['טורנירים', '❌', '✅'],
                ['חנות מלאה', '❌', '✅'],
                ['פרסומות', '❌', '❌'],
                ['רמה מקסימלית', '5', '♾️'],
              ].map(([f, free, prem], i) => (
                <div key={i} className="grid grid-cols-3 text-center text-[10px] py-2" style={{ background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <div className="text-slate-400">{f}</div>
                  <div className="text-slate-500">{free}</div>
                  <div className="text-white font-bold">{prem}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Lingos packs */}
        <div className="mb-6">
          <h3 className="text-sm font-black text-white mb-3 text-center">💰 חבילות Lingos</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { amount: 500, price: '₪2.90', emoji: '💰' },
              { amount: 1000, price: '₪4.90', emoji: '💰💰', popular: true },
              { amount: 3000, price: '₪9.90', emoji: '💰💰💰' },
            ].map(pack => (
              <button key={pack.amount} onClick={() => handleBuyLingos(pack.amount)} disabled={purchasing}
                className="rounded-xl p-3 text-center transition-all hover:scale-105 active:scale-95 disabled:opacity-60 relative"
                style={{ background: 'rgba(245,158,11,0.08)', border: `1px solid ${pack.popular ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.15)'}` }}>
                {pack.popular && <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-bold" style={{ background: '#f59e0b', color: '#1e1b4b' }}>פופולרי</div>}
                <div className="text-lg mb-1">{pack.emoji}</div>
                <div className="text-sm font-black text-white">{pack.amount.toLocaleString()}</div>
                <div className="text-xs font-bold" style={{ color: '#fbbf24' }}>{pack.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pb-4">
          <p className="text-[10px] text-slate-600">המנוי מתחדש אוטומטית. ניתן לבטל בכל עת.</p>
          <button onClick={() => { window.open('/privacy', '_blank'); }} className="text-[10px] text-slate-600 underline">מדיניות פרטיות</button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}