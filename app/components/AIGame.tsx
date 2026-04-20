'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const SCENARIOS = [
  { id: 'restaurant', emoji: '🍕', titleHe: 'מסעדה', titleEn: 'Restaurant', system: 'You are Marco, a warm friendly waiter at an Italian restaurant. Be playful about food.', starter: 'Hey there! Welcome to Marco\'s Pizza! 🍕 I\'m Marco. What are you in the mood for?\n(היי! ברוכים הבאים! אני מרקו. מה בא לכם?)', suggestions: ['I want pizza please', 'What\'s good here?', 'Can I see the menu?'] },
  { id: 'pet_shop', emoji: '🐶', titleHe: 'חנות חיות', titleEn: 'Pet Shop', system: 'You are Lily, a cheerful pet shop owner who loves animals.', starter: 'Hi! I\'m Lily! 🐾 Welcome to my pet shop! We have the cutest puppies today. Do you like dogs?\n(היי! אני לילי! ברוכים הבאים! יש לנו גורים חמודים. אוהבים כלבים?)', suggestions: ['Yes I love dogs!', 'Do you have cats?', 'I want a small pet'] },
  { id: 'school', emoji: '🏫', titleHe: 'בית ספר', titleEn: 'School', system: 'You are Ms. Sarah, a kind patient English teacher who makes learning fun.', starter: 'Good morning! ☀️ I\'m Ms. Sarah, your English teacher. I\'m so happy to meet you! What\'s your name?\n(בוקר טוב! אני גברת שרה. שמחה לפגוש אותכם! מה השם שלכם?)', suggestions: ['My name is...', 'Nice to meet you!', 'I like English'] },
  { id: 'park', emoji: '🌳', titleHe: 'פארק', titleEn: 'Park', system: 'You are Tommy, an energetic 10-year-old kid at the park who loves games. Talk like a real kid!', starter: 'Hey hey! ⚽ I\'m Tommy! Wanna play? I\'ve got a soccer ball!\n(היי! אני טומי! רוצה לשחק? יש לי כדורגל!)', suggestions: ['Let\'s play soccer!', 'What games do you know?', 'Sure! I love games'] },
  { id: 'space', emoji: '🚀', titleHe: 'תחנת חלל', titleEn: 'Space Station', system: 'You are Captain Luna, an adventurous astronaut amazed by space. Share cool facts!', starter: 'Welcome aboard, space cadet! 🚀 I\'m Captain Luna! Look - those tiny lights are billions of stars!\n(ברוכים הבאים! אני קפטן לונה! תראו - האורות הקטנים הם מיליארדי כוכבים!)', suggestions: ['Wow so cool!', 'What is that planet?', 'Are we on the Moon?'] },
  { id: 'supermarket', emoji: '🛒', titleHe: 'סופרמרקט', titleEn: 'Supermarket', system: 'You are Sam, a helpful funny supermarket worker who loves fresh products.', starter: 'Welcome to FreshMart! 🛒 I\'m Sam! We have amazing strawberries today. Need help?\n(ברוכים הבאים! אני סאם! יש לנו תותים מדהימים. צריכים עזרה?)', suggestions: ['Where are the apples?', 'I need milk please', 'How much are the strawberries?'] },
];

interface Message { role: 'user' | 'assistant'; content: string; }

export default function AIGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const [scenario, setScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);
  const [recording, setRecording] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false); // Continuous voice mode
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [bestVoice, setBestVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [listening, setListening] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const voiceModeRef = useRef(false);
  const finishedRef = useRef(false);

  // Find best voice
  useEffect(() => {
    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = ['Samantha', 'Karen', 'Google UK English Female', 'Moira', 'Tessa', 'Daniel', 'Google US English', 'Fiona', 'Microsoft Zira'];
      for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name));
        if (v) { setBestVoice(v); return; }
      }
      const eng = voices.find(v => v.lang.startsWith('en') && !v.localService) || voices.find(v => v.lang.startsWith('en'));
      if (eng) setBestVoice(eng);
    };
    findVoice();
    window.speechSynthesis.onvoiceschanged = findVoice;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const r = new SR();
      r.lang = 'en-US'; r.continuous = false; r.interimResults = false; r.maxAlternatives = 1;
      recognitionRef.current = r;
    }
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    try {
      const lines = text.split('\n');
      const englishLines = lines.filter(l => !/[\u0590-\u05FF]/.test(l) && !l.startsWith('('));
      const clean = englishLines.join(' ').replace(/[\u0590-\u05FF()]/g, '').replace(/[^\w\s,.!?'-]/g, '').trim();
      if (!clean) { onEnd?.(); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US'; u.rate = 0.88; u.pitch = 1.05; u.volume = 1;
      if (bestVoice) u.voice = bestVoice;
      if (onEnd) u.onend = () => onEnd();
      window.speechSynthesis.speak(u);
    } catch (_) { onEnd?.(); }
  }, [bestVoice]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || finishedRef.current) return;
    setListening(true);
    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      setListening(false);
      // Auto-send in voice mode
      if (voiceModeRef.current) {
        setTimeout(() => {
          const fakeEvent = { trim: () => text };
          sendMessageDirect(text);
        }, 300);
      }
    };
    recognitionRef.current.onerror = () => setListening(false);
    recognitionRef.current.onend = () => setListening(false);
    try { recognitionRef.current.start(); } catch (_) {}
  }, []);

  const sendMessageDirect = async (text: string) => {
    if (!text.trim() || !scenario) return;
    setInput('');
    const userMsg = text.trim();
    const newMessages: Message[] = [...(messagesRef.current || []), { role: 'user' as const, content: userMsg }];
    setMessages(newMessages);
    messagesRef.current = newMessages;
    setMsgCount(c => c + 1);
    setScore(s => s + 1);
    setLoading(true);

    let aiReply = '';
    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          system: scenario.system,
          track: profile.track || 'explorers',
          nickname: profile.nickname,
        }),
      });
      const data = await resp.json();
      if (data.reply) aiReply = data.reply;
      else throw new Error('no reply');
    } catch (_) {
      const fbs = [
        `That's great, ${profile.nickname}! 👏 Tell me more!\n(מצוין! ספרו עוד!)`,
        `Oh wow, really? 😊 What else?\n(וואו, באמת? מה עוד?)`,
        `You're doing amazing! 🌟 Keep going!\n(אתם מדהימים! המשיכו!)`,
        `Ha, that's cool! 😄 What's next?\n(מגניב! מה הלאה?)`,
        `Wonderful! ✨ You're getting better!\n(נפלא! אתם משתפרים!)`,
      ];
      aiReply = fbs[msgCount % fbs.length];
    }

    const updatedMsgs = [...newMessages, { role: 'assistant' as const, content: aiReply }];
    setMessages(updatedMsgs);
    messagesRef.current = updatedMsgs;
    sounds.correct();
    setLoading(false);

    // In voice mode: speak, then auto-listen
    if (voiceModeRef.current && !finishedRef.current) {
      speakText(aiReply, () => {
        if (voiceModeRef.current && !finishedRef.current) {
          setTimeout(() => startListening(), 500);
        }
      });
    } else {
      speakText(aiReply);
    }

    if (msgCount + 1 >= 10) {
      setFinished(true);
      finishedRef.current = true;
      voiceModeRef.current = false;
      setVoiceMode(false);
      setTimeout(() => sounds.perfect(), 500);
    }
  };

  const messagesRef = useRef<Message[]>([]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !scenario || finished) return;
    await sendMessageDirect(input.trim());
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const toggleVoiceMode = () => {
    if (voiceMode) {
      // Turn off
      voiceModeRef.current = false;
      setVoiceMode(false);
      window.speechSynthesis.cancel();
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
      setListening(false);
    } else {
      // Turn on
      voiceModeRef.current = true;
      setVoiceMode(true);
      sounds.gameStart();
      startListening();
    }
  };

  const toggleRecord = () => {
    if (listening) {
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch (_) {}
      setListening(false);
    } else {
      startListening();
    }
  };

  const startScenario = (s: typeof SCENARIOS[0]) => {
    setScenario(s);
    const msgs: Message[] = [{ role: 'assistant', content: s.starter }];
    setMessages(msgs);
    messagesRef.current = msgs;
    setMsgCount(0); setFinished(false); finishedRef.current = false; setScore(0); setVoiceMode(false); voiceModeRef.current = false;
    sounds.mystery();
    setTimeout(() => speakText(s.starter), 300);
  };

  const handleFinish = async () => {
    setSaving(true);
    window.speechSynthesis.cancel();
    try { await completeGame(userId, Math.min(score * 12, 120), Math.min(score * 8, 80), 0); } catch (_) {}
    onFinish();
  };

  // Selection
  if (!scenario) return (
    <div className="min-h-screen px-4 py-5 pb-24" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-lg mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">🤖 שיחה חיה באנגלית</h2>
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
        </div>
        <div className="rounded-2xl p-4 mb-5" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(99,102,241,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="text-center">
            <p className="text-sm font-bold text-white mb-1">🎤 דבר באנגלית!</p>
            <p className="text-xs text-slate-400">הקלד, הקלט, או הפעל מצב שיחה רצופה</p>
            <p className="text-xs text-slate-400">הרובוט מתקן שגיאות ומתרגם לעברית</p>
          </div>
        </div>
        <div className="space-y-2.5">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => startScenario(s)}
              className="w-full rounded-2xl p-4 text-right transition-all hover:scale-[1.01] active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: 'rgba(99,102,241,0.2)' }}>{s.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white">{s.titleHe}</h3>
                  <p className="text-[11px] text-slate-400">{s.titleEn}</p>
                </div>
                <span className="text-lg" style={{ color: '#6366f1' }}>▶</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Finish
  if (finished) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md text-center" dir="rtl">
        <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">שיחה מעולה!</h2>
          <p className="text-xs text-slate-400 mb-4">{score} הודעות באנגלית!</p>
          <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div className="flex justify-center gap-5">
              <div>⭐ <span className="font-black text-white">+{Math.min(score * 12, 120)}</span></div>
              <div>💰 <span className="font-black text-white">+{Math.min(score * 8, 80)}</span></div>
            </div>
          </div>
          <button onClick={handleFinish} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{saving ? '⚡...' : '🏠 המשך'}</button>
        </div>
      </div>
    </div>
  );

  // Chat
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" dir="rtl" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => { window.speechSynthesis.cancel(); voiceModeRef.current = false; setVoiceMode(false); onFinish(); }} className="text-sm px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>←</button>
          <span className="text-lg">{scenario.emoji}</span>
          <span className="text-sm font-bold text-white">{scenario.titleHe}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs px-2 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>💬 {msgCount}/10</div>
          {msgCount >= 5 && (
            <button onClick={() => { setFinished(true); finishedRef.current = true; voiceModeRef.current = false; setVoiceMode(false); window.speechSynthesis.cancel(); sounds.perfect(); }} className="text-xs px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>✅</button>
          )}
        </div>
      </div>

      {/* Voice mode banner */}
      {voiceMode && (
        <div className="px-4 py-2 text-center" style={{ background: 'rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-xs font-bold" style={{ color: '#34d399' }}>
            {listening ? '🎤 מקשיב... דבר באנגלית!' : loading ? '🤖 חושב...' : '🔊 מדבר...'}
          </p>
        </div>
      )}

      {/* Messages */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" dir="ltr">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1" style={{ background: 'rgba(99,102,241,0.3)' }}>{scenario.emoji}</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'assistant' ? 'cursor-pointer active:opacity-80' : ''}`}
              onClick={() => m.role === 'assistant' && speakText(m.content)}
              style={{
                background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
              }}>
              <p className="text-sm text-white whitespace-pre-line leading-relaxed">{m.content}</p>
              {m.role === 'assistant' && <div className="flex items-center justify-end gap-1 mt-1.5 opacity-40"><span className="text-[10px]">🔊 tap</span></div>}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1" style={{ background: 'rgba(139,92,246,0.3)' }}>👤</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1" style={{ background: 'rgba(99,102,241,0.3)' }}>{scenario.emoji}</div>
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)', borderBottomLeftRadius: 4 }}>
              <div className="flex items-center gap-1.5">
                {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a5b4fc', animationDelay: `${i*0.3}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {msgCount < 2 && !loading && scenario.suggestions && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto" dir="rtl">
          {scenario.suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap active:scale-95"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.25)' }}>{s}</button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 flex flex-col gap-2" style={{ background: 'rgba(15,12,41,0.98)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Continuous voice mode button */}
        {voiceSupported && (
          <button onClick={toggleVoiceMode}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${voiceMode ? 'animate-pulse' : ''}`}
            style={{ background: voiceMode ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg,rgba(34,197,94,0.2),rgba(99,102,241,0.15))', border: `1px solid ${voiceMode ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.3)'}`, color: voiceMode ? '#f87171' : '#34d399' }}>
            {voiceMode ? '⏹️ עצור שיחה קולית' : '🎙️ התחל שיחה קולית רצופה'}
          </button>
        )}

        <div className="flex gap-2 items-center">
          {/* Single recording */}
          {voiceSupported && !voiceMode && (
            <button onClick={toggleRecord}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${listening ? 'animate-pulse' : 'hover:scale-110 active:scale-95'}`}
              style={{ background: listening ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)', border: `2px solid ${listening ? '#ef4444' : 'rgba(99,102,241,0.3)'}` }}>
              {listening ? '⏹️' : '🎤'}
            </button>
          )}
          <input ref={inputRef} type="text" placeholder={listening ? '🎤 מקשיב...' : 'Type in English...'} value={input}
            onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={loading || finished || voiceMode} className="flex-1 px-4 py-3 rounded-xl text-sm" dir="ltr"
            style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', color: '#e2e8f0', outline: 'none' }} />
          <button onClick={sendMessage} disabled={!input.trim() || loading || finished || voiceMode}
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>📤</button>
        </div>
      </div>
    </div>
  );
}