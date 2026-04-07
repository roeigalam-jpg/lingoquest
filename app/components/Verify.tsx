'use client';

export default function Verify({ email, onVerified }: { email?: string; onVerified: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md text-center rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-black text-white mb-2">Check Your Email!</h2>
        <p className="text-sm text-slate-400 mb-4">We sent a verification link to <span className="text-indigo-300 font-semibold">{email}</span></p>
        <p className="text-xs text-slate-500 mb-6">Click the link in the email, then press the button below.</p>
        <button onClick={onVerified} className="px-8 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>I Verified My Email ✅</button>
      </div>
    </div>
  );
}
