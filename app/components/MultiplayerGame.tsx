'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import { WORD_MATCH_CONTENT } from '../lib/content';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const TOTAL_Q = 8;
const Q_TIME = 10;

export default function MultiplayerGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const [phase, setPhase] = useState<'lobby' | 'select' | 'waiting' | 'playing' | 'result'>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const [isP1, setIsP1] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(Q_TIME);
  const [searching, setSearching] = useState(false);
  const [waitingRooms, setWaitingRooms] = useState<any[]>([]);
  const [disconnectWarn, setDisconnectWarn] = useState(false);
  const [showWaShare, setShowWaShare] = useState(false);

  // Refs for callbacks
  const phaseRef = useRef('lobby');
  const roomIdRef = useRef<string | null>(null);
  const roomRef = useRef<any>(null);
  const isP1Ref = useRef(false);
  const answeredRef = useRef(false);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancingRef = useRef(false);

  const sync = (p: string, rid: string | null, r: any, p1: boolean, ans: boolean) => {
    phaseRef.current = p; setPhase(p as any);
    roomIdRef.current = rid; setRoomId(rid);
    roomRef.current = r; setRoom(r);
    isP1Ref.current = p1; setIsP1(p1);
    answeredRef.current = ans; setAnswered(ans);
  };

  useEffect(() => { return () => cleanup(); }, []);

  const cleanup = () => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    advancingRef.current = false;
  };

  const fullReset = () => {
    cleanup();
    setSelected(null); setAnswered(false); answeredRef.current = false;
    setShowResult(null); setTimer(Q_TIME); setDisconnectWarn(false);
    setRoom(null); roomRef.current = null;
    setRoomId(null); roomIdRef.current = null;
    advancingRef.current = false;
    phaseRef.current = 'lobby'; setPhase('lobby');
  };

  const genQs = () => {
    const track = profile.track || 'explorers';
    return shuffle(WORD_MATCH_CONTENT[track] || WORD_MATCH_CONTENT.explorers).slice(0, TOTAL_Q).map(q => ({
      emoji: q.emoji, word: q.word, wordHe: q.wordHe, options: shuffle([...q.options]),
    }));
  };

  // Polling
  const startPoll = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.from('game_rooms').select('*').eq('id', id).single();
        if (data) onRoomUpdate(data);
        else if (phaseRef.current === 'playing') onDisconnect();
      } catch (_) {}
    }, 1500);
  };

  const onDisconnect = () => {
    if (phaseRef.current !== 'playing') return;
    setDisconnectWarn(true);
    setTimeout(async () => {
      if (!roomIdRef.current || phaseRef.current === 'result') return;
      try { await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomIdRef.current); } catch (_) {}
      phaseRef.current = 'result'; setPhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    }, 5000);
  };

  const onRoomUpdate = useCallback((nr: any) => {
    if (!nr) return;
    roomRef.current = nr; setRoom(nr);
    setDisconnectWarn(false);

    if (nr.status === 'playing' && phaseRef.current === 'waiting') {
      phaseRef.current = 'playing'; setPhase('playing');
      startQTimer(); sounds.correct();
    }

    if (nr.player1_answered && nr.player2_answered && phaseRef.current === 'playing' && !advancingRef.current) {
      advancingRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => advance(nr), 1500);
    }

    if (nr.status === 'finished' && phaseRef.current !== 'result') {
      phaseRef.current = 'result'; setPhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      sounds.gameOver();
    }
  }, []);

  const subscribe = (id: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = supabase.channel(`r-${id}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${id}` },
        (p: any) => onRoomUpdate(p.new))
      .subscribe();
    startPoll(id);
  };

  const startQTimer = () => {
    setTimer(Q_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { autoSkip(); return Q_TIME; } return t - 1; });
    }, 1000);
  };

  const autoSkip = async () => {
    if (answeredRef.current || !roomIdRef.current) return;
    answeredRef.current = true; setAnswered(true);
    const f = isP1Ref.current ? 'player1_answered' : 'player2_answered';
    await supabase.from('game_rooms').update({ [f]: true }).eq('id', roomIdRef.current);
  };

  const advance = async (cr: any) => {
    if (!roomIdRef.current) { advancingRef.current = false; return; }
    const next = (cr.current_question || 0) + 1;
    if (next >= TOTAL_Q) {
      await supabase.from('game_rooms').update({ status: 'finished', current_question: next }).eq('id', roomIdRef.current);
      advancingRef.current = false;
      return;
    }
    if (isP1Ref.current) {
      await supabase.from('game_rooms').update({ current_question: next, player1_answered: false, player2_answered: false }).eq('id', roomIdRef.current);
    }
    setSelected(null); answeredRef.current = false; setAnswered(false); setShowResult(null);
    setTimer(Q_TIME); startQTimer();
    advancingRef.current = false;
  };

  // Actions
  const quickMatch = async () => {
    setSearching(true); sounds.gameStart();
    await supabase.from('game_rooms').delete().eq('player1_id', userId).eq('status', 'waiting');
    const { data: rooms } = await supabase.from('game_rooms').select('*').eq('status', 'waiting').neq('player1_id', userId).order('created_at').limit(1);
    if (rooms && rooms.length > 0) { await joinRoom(rooms[0]); }
    else { await createRoom(); }
    setSearching(false);
  };

  const findOpponents = async () => {
    setSearching(true); sounds.tap();
    await supabase.from('game_rooms').delete().eq('player1_id', userId).eq('status', 'waiting');
    const { data } = await supabase.from('game_rooms').select('*').eq('status', 'waiting').neq('player1_id', userId).order('created_at').limit(10);
    setWaitingRooms(data || []);
    setSearching(false);
    phaseRef.current = 'select'; setPhase('select');
  };

  const joinRoom = async (target: any) => {
    const { data, error } = await supabase.from('game_rooms').update({ player2_id: userId, player2_name: profile.nickname, status: 'playing' }).eq('id', target.id).eq('status', 'waiting').select().single();
    if (data && !error) {
      sync('playing', data.id, data, false, false);
      subscribe(data.id); startQTimer(); sounds.correct();
    } else { sounds.wrong(); findOpponents(); }
  };

  const createRoom = async () => {
    const qs = genQs();
    const { data, error } = await supabase.from('game_rooms').insert({ player1_id: userId, player1_name: profile.nickname, track: profile.track || 'explorers', questions: qs, status: 'waiting' }).select().single();
    if (data && !error) {
      sync('waiting', data.id, data, true, false);
      subscribe(data.id);
    }
  };

  const answer = async (option: string) => {
    if (answeredRef.current || !roomRef.current || !roomIdRef.current) return;
    setSelected(option); answeredRef.current = true; setAnswered(true);
    const q = roomRef.current.questions[roomRef.current.current_question];
    const ok = option === q.word;
    setShowResult(ok);
    if (ok) sounds.correct(); else sounds.wrong();
    const sf = isP1Ref.current ? 'player1_score' : 'player2_score';
    const af = isP1Ref.current ? 'player1_answered' : 'player2_answered';
    const cs = isP1Ref.current ? roomRef.current.player1_score : roomRef.current.player2_score;
    const u: any = { [af]: true }; if (ok) u[sf] = cs + 1;
    await supabase.from('game_rooms').update(u).eq('id', roomIdRef.current);
  };

  const finish = async () => {
    const my = isP1Ref.current ? (roomRef.current?.player1_score || 0) : (roomRef.current?.player2_score || 0);
    const op = isP1Ref.current ? (roomRef.current?.player2_score || 0) : (roomRef.current?.player1_score || 0);
    const won = my > op;
    try { await supabase.from('profiles').update({ xp: profile.xp + (won ? 50 : 20), lingos: profile.lingos + (won ? 100 : 30), games_played: profile.games_played + 1, arena_wins: profile.arena_wins + (won ? 1 : 0), arena_losses: profile.arena_losses + (won ? 0 : 1) }).eq('id', userId); } catch (_) {}
    if (roomIdRef.current) try { await supabase.from('game_rooms').delete().eq('id', roomIdRef.current); } catch (_) {}
    cleanup(); onFinish();
  };

  const cancel = async () => {
    if (roomIdRef.current) try { await supabase.from('game_rooms').delete().eq('id', roomIdRef.current); } catch (_) {}
    fullReset();
  };

  const rematch = () => { fullReset(); setTimeout(() => quickMatch(), 100); };

  const waLink = (biz: boolean) => {
    const t = `⚔️ בוא לשחק נגדי ב-LingoQuest!\n🎮 https://lingoquest-75vj.onrender.com\n💪 ${profile.nickname} מחכה לך!`;
    return `https://${biz ? 'api' : 'api'}.whatsapp.com/send?text=${encodeURIComponent(t)}`;
  };

  // ─── LOBBY ───
  if (phase === 'lobby') return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <h2 className="text-xl font-black text-white mb-1">🌐 מולטיפלייר</h2>
      <p className="text-xs mb-5 text-slate-400">שחק מול שחקן אמיתי!</p>
      <div className="rounded-2xl p-5 text-center mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-5xl mb-2">⚔️</div>
        <h3 className="text-lg font-black text-white">1 VS 1</h3>
        <p className="text-xs text-slate-400">{TOTAL_Q} שאלות | {Q_TIME} שניות</p>
      </div>
      <div className="rounded-xl p-3 mb-4 text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>🏆 ניצחון: +50 XP +100💰</p>
      </div>
      <button onClick={quickMatch} disabled={searching} className="w-full py-4 rounded-2xl text-white font-black text-lg mb-3 transition-all hover:scale-[1.02] disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
        {searching ? '🔍...' : '⚡ משחק מהיר'}
      </button>
      <button onClick={findOpponents} disabled={searching} className="w-full py-3 rounded-2xl text-white font-bold text-sm mb-3" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>🎯 בחר יריב</button>
      <button onClick={createRoom} className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#34d399' }}>🏠 צור חדר וחכה</button>
    </div>
  );

  // ─── SELECT ───
  if (phase === 'select') return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-white">🎯 בחר יריב</h2>
        <button onClick={fullReset} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
      </div>
      {waitingRooms.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="text-4xl mb-3">😴</div><p className="text-sm text-white font-bold mb-2">אין יריבים</p>
          <button onClick={createRoom} className="px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>🏠 צור חדר</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {waitingRooms.map(r => (
            <div key={r.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: 'rgba(99,102,241,0.2)' }}>
                {r.track === 'explorers' ? '🧭' : r.track === 'voyagers' ? '🚀' : '👑'}
              </div>
              <div className="flex-1"><div className="font-black text-white">{r.player1_name}</div><div className="text-xs text-slate-400">{r.track}</div></div>
              <button onClick={() => joinRoom(r)} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>⚔️</button>
            </div>
          ))}
          <button onClick={findOpponents} className="w-full py-2 text-xs text-indigo-400">🔄 רענן</button>
        </div>
      )}
    </div>
  );

  // ─── WAITING ───
  if (phase === 'waiting') return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md text-center" dir="rtl">
        <div className="rounded-3xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-5xl mb-4 animate-bounce">🔍</div>
          <h2 className="text-xl font-black text-white mb-2">ממתין ליריב...</h2>
          <div className="flex justify-center gap-1 mb-5">{[0,1,2].map(i => <div key={i} className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#6366f1', animationDelay: `${i*0.3}s` }} />)}</div>
          <p className="text-xs text-slate-400 mb-4">שלח לחבר הזמנה!</p>
          {/* Share & Copy buttons */}
          <div className="flex gap-2 mb-4">
            <button onClick={async () => {
              const shareText = `⚔️ בוא לשחק נגדי ב-LingoQuest!\n🎮 https://lingoquest-75vj.onrender.com\n💪 ${profile.nickname} מחכה לך בזירה!`;
              try {
                if (navigator.share) {
                  await navigator.share({ title: 'LingoQuest - אתגר למשחק!', text: shareText, url: 'https://lingoquest-75vj.onrender.com' });
                } else {
                  window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
                }
              } catch (_) {}
              sounds.coin();
            }} className="flex-1 py-2.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-1.5" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              📤 הזמן שחקנים
            </button>
            <button onClick={() => {
              const t = `⚔️ בוא לשחק נגדי ב-LingoQuest!\n🎮 https://lingoquest-75vj.onrender.com\n💪 ${profile.nickname} מחכה לך בזירה!`;
              navigator.clipboard.writeText(t).catch(() => {});
              sounds.coin();
            }} className="px-4 py-2.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)' }}>
              📋 העתק
            </button>
          </div>
          <button onClick={cancel} className="px-6 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>✕ ביטול</button>
        </div>
      </div>
    </div>
  );

  // ─── RESULT ───
  if (phase === 'result' && room) {
    const my = isP1 ? room.player1_score : room.player2_score;
    const op = isP1 ? room.player2_score : room.player1_score;
    const opN = isP1 ? room.player2_name : room.player1_name;
    const won = my > op, tie = my === op;
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
        <div className="w-full max-w-md text-center" dir="rtl">
          <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-6xl mb-3">{won ? '🏆' : tie ? '🤝' : '😤'}</div>
            <h2 className="text-2xl font-black text-white mb-2">{won ? 'ניצחון!' : tie ? 'תיקו!' : 'הפסד'}</h2>
            {disconnectWarn && <p className="text-xs text-yellow-400 mb-2">⚠️ היריב התנתק</p>}
            <div className="flex items-center justify-center gap-4 my-5">
              <div><div className="text-3xl font-black" style={{ color: won ? '#34d399' : '#f87171' }}>{my}</div><div className="text-xs text-slate-400">{profile.nickname}</div></div>
              <div className="text-2xl font-black text-slate-500">VS</div>
              <div><div className="text-3xl font-black" style={{ color: !won && !tie ? '#34d399' : '#f87171' }}>{op}</div><div className="text-xs text-slate-400">{opN || '?'}</div></div>
            </div>
            <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <div className="flex justify-center gap-5"><div>⭐ <span className="font-black text-white">+{won ? 50 : 20}</span></div><div>💰 <span className="font-black text-white">+{won ? 100 : 30}</span></div></div>
            </div>
            <div className="flex gap-2">
              <button onClick={finish} className="flex-1 py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>🏠 המשך</button>
              <button onClick={rematch} className="flex-1 py-3.5 rounded-xl font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399', border: '1px solid rgba(34,197,94,0.3)' }}>🔄 שוב!</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───
  if (!room || !room.questions || room.current_question >= room.questions.length) return null;
  const q = room.questions[room.current_question];
  const opN = isP1 ? (room.player2_name || '?') : room.player1_name;
  const my = isP1 ? room.player1_score : room.player2_score;
  const op = isP1 ? room.player2_score : room.player1_score;
  const opAns = isP1 ? room.player2_answered : room.player1_answered;

  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full">
        {disconnectWarn && <div className="mb-3 p-2 rounded-xl text-center text-xs font-bold animate-pulse" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>⚠️ היריב התנתק...</div>}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center"><div className="text-sm font-black text-white">{profile.nickname}</div><div className="text-2xl font-black" style={{ color: '#34d399' }}>{my}</div></div>
          <div className="text-center"><div className="text-xs text-slate-400">{room.current_question + 1}/{TOTAL_Q}</div><div className="text-3xl font-black" style={{ color: timer <= 3 ? '#ef4444' : '#fbbf24' }}>{timer}</div></div>
          <div className="flex-1 text-center"><div className="text-sm font-black text-white">{opN}</div><div className="text-2xl font-black" style={{ color: '#f87171' }}>{op}</div>{opAns && !answered && <div className="text-xs text-yellow-400 animate-pulse">ענה! ⚡</div>}</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.1)' }}><div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(timer/Q_TIME)*100}%`, background: timer <= 3 ? '#ef4444' : 'linear-gradient(90deg,#6366f1,#a78bfa)' }} /></div>
        <div className="text-center mb-5">
          <div className="rounded-2xl inline-flex items-center justify-center p-5 mb-2" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: 120, height: 120 }}><span style={{ fontSize: 56 }}>{q.emoji}</span></div>
          <p className="text-sm font-semibold text-indigo-300">מה זה? 🤔</p>
          {q.wordHe && <p className="text-xs text-slate-500">({q.wordHe})</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o: string, i: number) => {
            const isSel = selected === o, isAns = o === q.word, show = answered;
            let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
            if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
            else if (show && isSel && !isAns) { bg = 'rgba(239,68,68,0.2)'; brd = '2px solid #ef4444'; col = '#f87171'; }
            return <button key={i} onClick={() => answer(o)} disabled={answered} className="py-4 px-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] disabled:hover:scale-100" style={{ background: bg, border: brd, color: col }}>{o}{show && isAns && ' ✅'}{show && isSel && !isAns && ' ❌'}</button>;
          })}
        </div>
        {answered && <div className="text-center mt-4"><p className="text-lg font-black" style={{ color: showResult ? '#34d399' : '#f87171' }}>{showResult ? '🎉 נכון!' : `❌ ${q.word} = ${q.wordHe}`}</p>{!opAns && <p className="text-xs text-slate-400 mt-1 animate-pulse">ממתין ליריב...</p>}</div>}
      </div>
    </div>
  );
}