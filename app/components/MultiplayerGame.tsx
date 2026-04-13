'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { sounds } from '../lib/sounds';
import { WORD_MATCH_CONTENT } from '../lib/content';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

const TOTAL_QUESTIONS = 8;
const QUESTION_TIME = 10;
const DISCONNECT_TIMEOUT = 15000; // 15 seconds

export default function MultiplayerGame({ profile, userId, onFinish, challengePlayer }: { profile: any; userId: string; onFinish: () => void; challengePlayer?: any }) {
  const [phase, setPhase] = useState<'lobby' | 'select' | 'waiting' | 'playing' | 'result'>('lobby');
  const phaseRef = useRef('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const [room, setRoom] = useState<any>(null);
  const roomRef = useRef<any>(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const isPlayer1Ref = useRef(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const answeredRef = useRef(false);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [timer, setTimer] = useState(QUESTION_TIME);
  const [searching, setSearching] = useState(false);
  const [waitingRooms, setWaitingRooms] = useState<any[]>([]);
  const [disconnectWarning, setDisconnectWarning] = useState(false);
  const channelRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOpActivityRef = useRef<number>(Date.now());

  const updatePhase = (p: string) => { phaseRef.current = p; setPhase(p as any); };
  const updateRoom = (r: any) => { roomRef.current = r; setRoom(r); };
  const updateRoomId = (id: string | null) => { roomIdRef.current = id; setRoomId(id); };
  const updateAnswered = (a: boolean) => { answeredRef.current = a; setAnswered(a); };

  useEffect(() => {
    // If challenged from leaderboard, auto-create room and wait
    if (challengePlayer) {
      createRoomAndWait();
    }
    return () => cleanup();
  }, []);

  const cleanup = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    if (disconnectRef.current) clearTimeout(disconnectRef.current);
  };

  const generateQuestions = () => {
    const track = profile.track || 'explorers';
    const content = WORD_MATCH_CONTENT[track] || WORD_MATCH_CONTENT.explorers;
    return shuffle(content).slice(0, TOTAL_QUESTIONS).map(q => ({
      emoji: q.emoji, word: q.word, wordHe: q.wordHe,
      options: shuffle([...q.options]),
    }));
  };

  // ─── POLLING ───
  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.from('game_rooms').select('*').eq('id', id).single();
        if (data) handleRoomUpdate(data);
        else if (phaseRef.current === 'playing') {
          // Room deleted = opponent disconnected
          handleOpponentDisconnect();
        }
      } catch (_) {}
    }, 1500);
  };

  // ─── DISCONNECT DETECTION ───
  const startDisconnectWatch = () => {
    lastOpActivityRef.current = Date.now();
  };

  const handleOpponentDisconnect = () => {
    if (phaseRef.current !== 'playing') return;
    setDisconnectWarning(true);
    sounds.gameOver();

    // Auto-win after timeout
    if (disconnectRef.current) clearTimeout(disconnectRef.current);
    disconnectRef.current = setTimeout(async () => {
      if (!roomIdRef.current) return;
      // Set as finished with current player winning
      const updates: any = { status: 'finished' };
      if (isPlayer1Ref.current) {
        updates.player2_score = 0;
      } else {
        updates.player1_score = 0;
      }
      try {
        await supabase.from('game_rooms').update(updates).eq('id', roomIdRef.current);
      } catch (_) {}
      updatePhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    }, 5000);
  };

  const handleRoomUpdate = useCallback((newRoom: any) => {
    if (!newRoom) return;
    updateRoom(newRoom);
    lastOpActivityRef.current = Date.now();
    setDisconnectWarning(false);
    if (disconnectRef.current) clearTimeout(disconnectRef.current);

    if (newRoom.status === 'playing' && phaseRef.current === 'waiting') {
      updatePhase('playing');
      startQuestionTimer();
      startDisconnectWatch();
      sounds.correct();
    }

    if (newRoom.player1_answered && newRoom.player2_answered && phaseRef.current === 'playing') {
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => advanceQuestion(newRoom), 1500);
    }

    if (newRoom.status === 'finished' && phaseRef.current !== 'result') {
      updatePhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
      sounds.gameOver();
    }
  }, []);

  const subscribeToRoom = (id: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`room-${id}-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_rooms', filter: `id=eq.${id}` },
        (payload: any) => { handleRoomUpdate(payload.new); })
      .subscribe();
    channelRef.current = channel;
    startPolling(id);
  };

  const startQuestionTimer = () => {
    setTimer(QUESTION_TIME);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { autoSkip(); return QUESTION_TIME; }
        return t - 1;
      });
    }, 1000);
  };

  const autoSkip = async () => {
    if (answeredRef.current || !roomIdRef.current) return;
    updateAnswered(true);
    const field = isPlayer1Ref.current ? 'player1_answered' : 'player2_answered';
    await supabase.from('game_rooms').update({ [field]: true }).eq('id', roomIdRef.current);
  };

  const advanceQuestion = async (currentRoom: any) => {
    if (!roomIdRef.current) return;
    const nextQ = (currentRoom.current_question || 0) + 1;
    if (nextQ >= TOTAL_QUESTIONS) {
      await supabase.from('game_rooms').update({ status: 'finished', current_question: nextQ }).eq('id', roomIdRef.current);
      return;
    }
    if (isPlayer1Ref.current) {
      await supabase.from('game_rooms').update({
        current_question: nextQ, player1_answered: false, player2_answered: false,
      }).eq('id', roomIdRef.current);
    }
    setSelected(null); updateAnswered(false); setShowResult(null); setTimer(QUESTION_TIME); startQuestionTimer();
  };

  // ─── FIND OPPONENTS ───
  const findOpponents = async () => {
    setSearching(true);
    sounds.tap();
    await supabase.from('game_rooms').delete().eq('player1_id', userId).eq('status', 'waiting');

    const { data } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('status', 'waiting')
      .neq('player1_id', userId)
      .order('created_at', { ascending: true })
      .limit(10);

    setWaitingRooms(data || []);
    setSearching(false);
    updatePhase('select');
  };

  // ─── JOIN SPECIFIC ROOM ───
  const joinRoom = async (targetRoom: any) => {
    sounds.gameStart();
    const { data, error } = await supabase
      .from('game_rooms')
      .update({ player2_id: userId, player2_name: profile.nickname, status: 'playing' })
      .eq('id', targetRoom.id)
      .eq('status', 'waiting')
      .select()
      .single();

    if (data && !error) {
      updateRoomId(data.id);
      updateRoom(data);
      isPlayer1Ref.current = false; setIsPlayer1(false);
      updatePhase('playing');
      subscribeToRoom(data.id);
      startQuestionTimer();
      startDisconnectWatch();
      sounds.correct();
    } else {
      // Room already taken
      sounds.wrong();
      findOpponents(); // Refresh list
    }
  };

  // ─── CREATE ROOM AND WAIT ───
  const createRoomAndWait = async () => {
    sounds.gameStart();
    await supabase.from('game_rooms').delete().eq('player1_id', userId).eq('status', 'waiting');

    const questions = generateQuestions();
    const { data: newRoom, error } = await supabase
      .from('game_rooms')
      .insert({
        player1_id: userId, player1_name: profile.nickname,
        track: profile.track || 'explorers', questions, status: 'waiting',
      })
      .select().single();

    if (newRoom && !error) {
      updateRoomId(newRoom.id);
      updateRoom(newRoom);
      isPlayer1Ref.current = true; setIsPlayer1(true);
      updatePhase('waiting');
      subscribeToRoom(newRoom.id);
    }
  };

  // ─── QUICK MATCH (auto find or create) ───
  const quickMatch = async () => {
    setSearching(true);
    sounds.gameStart();
    await supabase.from('game_rooms').delete().eq('player1_id', userId).eq('status', 'waiting');

    const { data: rooms } = await supabase
      .from('game_rooms').select('*')
      .eq('status', 'waiting').neq('player1_id', userId)
      .order('created_at', { ascending: true }).limit(1);

    if (rooms && rooms.length > 0) {
      await joinRoom(rooms[0]);
    } else {
      await createRoomAndWait();
    }
    setSearching(false);
  };

  const answer = async (option: string) => {
    if (answeredRef.current || !roomRef.current || !roomIdRef.current) return;
    setSelected(option); updateAnswered(true);
    const currentQ = roomRef.current.questions[roomRef.current.current_question];
    const correct = option === currentQ.word;
    setShowResult(correct);
    if (correct) sounds.correct(); else sounds.wrong();

    const scoreField = isPlayer1Ref.current ? 'player1_score' : 'player2_score';
    const answeredField = isPlayer1Ref.current ? 'player1_answered' : 'player2_answered';
    const currentScore = isPlayer1Ref.current ? roomRef.current.player1_score : roomRef.current.player2_score;
    const updates: any = { [answeredField]: true };
    if (correct) updates[scoreField] = currentScore + 1;
    await supabase.from('game_rooms').update(updates).eq('id', roomIdRef.current);
  };

  const handleFinish = async () => {
    const myScore = isPlayer1Ref.current ? (roomRef.current?.player1_score || 0) : (roomRef.current?.player2_score || 0);
    const opScore = isPlayer1Ref.current ? (roomRef.current?.player2_score || 0) : (roomRef.current?.player1_score || 0);
    const won = myScore > opScore;
    try {
      await supabase.from('profiles').update({
        xp: profile.xp + (won ? 50 : 20), lingos: profile.lingos + (won ? 100 : 30),
        games_played: profile.games_played + 1,
        arena_wins: profile.arena_wins + (won ? 1 : 0),
        arena_losses: profile.arena_losses + (won ? 0 : 1),
      }).eq('id', userId);
    } catch (_) {}
    if (roomIdRef.current) { try { await supabase.from('game_rooms').delete().eq('id', roomIdRef.current); } catch (_) {} }
    cleanup(); onFinish();
  };

  const cancelSearch = async () => {
    if (roomIdRef.current) { try { await supabase.from('game_rooms').delete().eq('id', roomIdRef.current); } catch (_) {} }
    cleanup(); updatePhase('lobby'); setSearching(false);
  };

  // ─── LOBBY ───
  if (phase === 'lobby') return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <h2 className="text-xl font-black text-white mb-1">🌐 מולטיפלייר</h2>
      <p className="text-xs mb-6 text-slate-400">שחק מול שחקן אמיתי בזמן אמת!</p>

      <div className="rounded-2xl p-6 text-center mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="text-6xl mb-3">⚔️</div>
        <h3 className="text-lg font-black text-white mb-2">1 VS 1</h3>
        <p className="text-xs text-slate-400">{TOTAL_QUESTIONS} שאלות | {QUESTION_TIME} שניות לכל שאלה</p>
      </div>

      <div className="rounded-xl p-3 mb-5 text-center" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="text-xs font-bold" style={{ color: '#fbbf24' }}>🏆 ניצחון: +50 XP, +100 Lingos</p>
      </div>

      {/* Quick Match */}
      <button onClick={quickMatch} disabled={searching}
        className="w-full py-4 rounded-2xl text-white font-black text-lg mb-3 transition-all hover:scale-[1.02] disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)', boxShadow: '0 4px 25px rgba(139,92,246,0.4)' }}>
        {searching ? '🔍 מחפש...' : '⚡ משחק מהיר'}
      </button>

      {/* Choose Opponent */}
      <button onClick={findOpponents} disabled={searching}
        className="w-full py-3 rounded-2xl text-white font-bold text-sm mb-3 transition-all hover:scale-[1.02] disabled:opacity-60"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
        🎯 בחר יריב מרשימה
      </button>

      {/* Create & Wait */}
      <button onClick={createRoomAndWait}
        className="w-full py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#34d399' }}>
        🏠 צור חדר וחכה לחבר
      </button>
    </div>
  );

  // ─── SELECT OPPONENT ───
  if (phase === 'select') return (
    <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-black text-white">🎯 בחר יריב</h2>
        <button onClick={() => updatePhase('lobby')} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
      </div>

      {waitingRooms.length === 0 ? (
        <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="text-4xl mb-3">😴</div>
          <p className="text-sm text-white font-bold mb-2">אין יריבים ממתינים כרגע</p>
          <p className="text-xs text-slate-400 mb-5">צור חדר משחק וחכה שמישהו יצטרף!</p>
          <button onClick={createRoomAndWait}
            className="px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>
            🏠 צור חדר וחכה
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {waitingRooms.map(r => (
            <div key={r.id} className="rounded-2xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ background: 'rgba(99,102,241,0.2)' }}>
                {r.track === 'explorers' ? '🧭' : r.track === 'voyagers' ? '🚀' : '👑'}
              </div>
              <div className="flex-1">
                <div className="font-black text-white">{r.player1_name}</div>
                <div className="text-xs text-slate-400">{r.track} • ממתין...</div>
              </div>
              <button onClick={() => joinRoom(r)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                ⚔️ הילחם!
              </button>
            </div>
          ))}
          <button onClick={findOpponents} className="w-full py-2 text-xs text-indigo-400 hover:text-white">🔄 רענן רשימה</button>
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
          <p className="text-sm text-slate-400 mb-4">שחקן נוסף צריך ללחוץ "מצא יריב"</p>
          <div className="flex justify-center gap-1 mb-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full animate-pulse" style={{ background: '#6366f1', animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mb-4">💡 שלח לחבר את הלינק למשחק!</p>
          <button onClick={cancelSearch}
            className="px-6 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>✕ ביטול</button>
        </div>
      </div>
    </div>
  );

  // ─── RESULT ───
  if (phase === 'result' && room) {
    const myScore = isPlayer1 ? room.player1_score : room.player2_score;
    const opScore = isPlayer1 ? room.player2_score : room.player1_score;
    const opName = isPlayer1 ? room.player2_name : room.player1_name;
    const won = myScore > opScore;
    const tie = myScore === opScore;
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
        <div className="w-full max-w-md text-center" dir="rtl">
          <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-6xl mb-3">{won ? '🏆' : tie ? '🤝' : '😤'}</div>
            <h2 className="text-2xl font-black text-white mb-2">{won ? 'ניצחון!' : tie ? 'תיקו!' : 'הפסד'}</h2>
            {disconnectWarning && <p className="text-xs text-yellow-400 mb-2">⚠️ היריב התנתק</p>}
            <div className="flex items-center justify-center gap-4 my-5">
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: won ? '#34d399' : '#f87171' }}>{myScore}</div>
                <div className="text-xs text-slate-400">{profile.nickname}</div>
              </div>
              <div className="text-2xl font-black text-slate-500">VS</div>
              <div className="text-center">
                <div className="text-3xl font-black" style={{ color: !won && !tie ? '#34d399' : '#f87171' }}>{opScore}</div>
                <div className="text-xs text-slate-400">{opName || 'יריב'}</div>
              </div>
            </div>
            <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex justify-center gap-5">
                <div><span>⭐</span><span className="font-black text-white ml-1">+{won ? 50 : 20}</span></div>
                <div><span>💰</span><span className="font-black text-white ml-1">+{won ? 100 : 30}</span></div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleFinish} className="flex-1 py-3.5 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>🏠 המשך</button>
              <button onClick={() => { cleanup(); updatePhase('lobby'); }} className="flex-1 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399', border: '1px solid rgba(34,197,94,0.3)' }}>🔄 שוב!</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── PLAYING ───
  if (!room || !room.questions || room.current_question >= room.questions.length) return null;
  const q = room.questions[room.current_question];
  const opName = isPlayer1 ? (room.player2_name || '???') : room.player1_name;
  const myScore = isPlayer1 ? room.player1_score : room.player2_score;
  const opScore = isPlayer1 ? room.player2_score : room.player1_score;
  const opAnswered = isPlayer1 ? room.player2_answered : room.player1_answered;

  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full">
        {/* Disconnect Warning */}
        {disconnectWarning && (
          <div className="mb-3 p-2 rounded-xl text-center text-xs font-bold animate-pulse" style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>
            ⚠️ נראה שהיריב התנתק... ניצחון אוטומטי בעוד רגע
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 text-center">
            <div className="text-sm font-black text-white">{profile.nickname}</div>
            <div className="text-2xl font-black" style={{ color: '#34d399' }}>{myScore}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">{room.current_question + 1}/{TOTAL_QUESTIONS}</div>
            <div className="text-3xl font-black" style={{ color: timer <= 3 ? '#ef4444' : '#fbbf24' }}>{timer}</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-sm font-black text-white">{opName}</div>
            <div className="text-2xl font-black" style={{ color: '#f87171' }}>{opScore}</div>
            {opAnswered && !answered && <div className="text-xs text-yellow-400 animate-pulse">ענה! ⚡</div>}
          </div>
        </div>

        <div className="h-2 rounded-full overflow-hidden mb-5" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all duration-1000" style={{
            width: `${(timer / QUESTION_TIME) * 100}%`,
            background: timer <= 3 ? '#ef4444' : 'linear-gradient(90deg,#6366f1,#a78bfa)',
          }} />
        </div>

        <div className="text-center mb-5">
          <div className="rounded-2xl inline-flex items-center justify-center p-5 mb-2"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', width: 120, height: 120 }}>
            <span style={{ fontSize: 56 }}>{q.emoji}</span>
          </div>
          <p className="text-sm font-semibold text-indigo-300">מה זה? 🤔</p>
          {q.wordHe && <p className="text-xs text-slate-500">({q.wordHe})</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((o: string, i: number) => {
            const isSel = selected === o, isAns = o === q.word, show = answered;
            let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
            if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
            else if (show && isSel && !isAns) { bg = 'rgba(239,68,68,0.2)'; brd = '2px solid #ef4444'; col = '#f87171'; }
            return <button key={i} onClick={() => answer(o)} disabled={answered}
              className="py-4 px-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] disabled:hover:scale-100"
              style={{ background: bg, border: brd, color: col }}>{o}{show && isAns && ' ✅'}{show && isSel && !isAns && ' ❌'}</button>;
          })}
        </div>

        {answered && (
          <div className="text-center mt-4">
            <p className="text-lg font-black" style={{ color: showResult ? '#34d399' : '#f87171' }}>
              {showResult ? '🎉 נכון!' : `❌ ${q.word} = ${q.wordHe}`}
            </p>
            {!opAnswered && <p className="text-xs text-slate-400 mt-1 animate-pulse">ממתין ליריב...</p>}
          </div>
        )}
      </div>
    </div>
  );
}