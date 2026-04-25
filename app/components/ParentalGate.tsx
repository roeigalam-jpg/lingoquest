'use client';
import { useState } from 'react';

export default function ParentalGate({ onPass, onCancel, action }: { onPass: () => void; onCancel: () => void; action: string }) {
  const [a] = useState(() => Math.floor(Math.random() * 8) + 3);
  const [b] = useState(() => Math.floor(Math.random() * 8) + 3);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);
  const correct = a * b;

  const check = () => {
    if (parseInt(answer) === correct) { onPass(); }
    else { setError(true); setAnswer(''); setTimeout(() => setError(false), 1500); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-[60]" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: '#1e1b4b', border: '2px solid #6366f1' }} dir="rtl">
        <div className="text-3xl mb-3">🔒</div>
        <h3 className="text-lg font-black text-white mb-1">שער הורים</h3>
        <p className="text-xs text-slate-400 mb-4">כדי {action}, פתור את התרגיל:</p>

        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <p className="text-2xl font-black text-white">{a} × {b} = ?</p>
        </div>

        {error && <p className="text-sm text-red-400 mb-2 animate-pulse">❌ תשובה שגויה, נסה שוב</p>}

        <input type="number" value={answer} onChange={e => setAnswer(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="הכנס תשובה..."
          className="w-full px-4 py-3 rounded-xl text-lg text-center mb-4"
          style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }}
          autoFocus />

        <div className="flex gap-2">
          <button onClick={check} disabled={!answer}
            className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>✅ אישור</button>
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>ביטול</button>
        </div>

        <p className="text-[10px] text-slate-600 mt-3">שער זה מבטיח שרק הורים יכולים לגשת לקישורים חיצוניים</p>
      </div>
    </div>
  );
}