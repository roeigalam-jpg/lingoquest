'use client';
import { sounds } from '../lib/sounds';

export default function Paywall({ reason, onUpgrade, onClose }: { reason: string; onUpgrade: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: '#1e1b4b', border: '2px solid #8b5cf6' }} dir="rtl">
        <div className="text-5xl mb-3">🔒</div>
        <h3 className="text-lg font-black text-white mb-2">{reason}</h3>
        <p className="text-xs text-slate-400 mb-5">שדרג ל-Premium ותיהנה מהכל ללא הגבלה!</p>

        <div className="space-y-2 text-right mb-5">
          {['🎮 כל המשחקים', '🤖 AI ללא הגבלה', '🌐 מולטיפלייר', '📖 כל הסיפורים'].map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-slate-300"><span>✅</span><span>{f}</span></div>
          ))}
        </div>

        <button onClick={() => { sounds.gameStart(); onUpgrade(); }}
          className="w-full py-3.5 rounded-xl text-white font-bold mb-2 transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}>
          ⭐ שדרג ל-Premium - ₪9.90/חודש
        </button>

        <button onClick={onClose} className="w-full py-2 text-xs text-slate-500">אולי מחר</button>
      </div>
    </div>
  );
}