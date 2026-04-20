'use client';
import { useState, useRef, useEffect } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const SCENARIOS = [
  { id: 'restaurant', emoji: '🍕', titleHe: 'מסעדה', titleEn: 'Restaurant', system: 'You are a warm, friendly waiter named Marco at an Italian restaurant. Be playful and enthusiastic about food.', starter: 'Hey there! Welcome to Marco\'s Pizza! 🍕 I\'m Marco, your waiter today. So, what are you in the mood for?\n(היי! ברוכים הבאים לפיצה של מרקו! אני מרקו, המלצר שלכם. אז מה בא לכם?)', suggestions: ['I want pizza please', 'What\'s good here?', 'Can I see the menu?'] },
  { id: 'pet_shop', emoji: '🐶', titleHe: 'חנות חיות', titleEn: 'Pet Shop', system: 'You are Lily, a cheerful pet shop owner who loves animals. You get excited when talking about pets.', starter: 'Oh hi! I\'m Lily! 🐾 Welcome to Lily\'s Pet Paradise! We have the cutest puppies today. Do you like dogs?\n(היי! אני לילי! ברוכים הבאים לגן עדן של לילי! יש לנו את הגורים הכי חמודים. אוהבים כלבים?)', suggestions: ['Yes I love dogs!', 'Do you have cats?', 'I want a small pet'] },
  { id: 'school', emoji: '🏫', titleHe: 'בית ספר', titleEn: 'School', system: 'You are Ms. Sarah, a kind and patient English teacher. You make learning fun with jokes and encouragement.', starter: 'Good morning, sunshine! ☀️ I\'m Ms. Sarah, your new English teacher. I\'m so happy to meet you! What\'s your name?\n(בוקר טוב! אני גברת שרה, המורה החדשה שלכם. שמחה לפגוש אותכם! מה השם שלכם?)', suggestions: ['My name is...', 'Nice to meet you!', 'I like English'] },
  { id: 'park', emoji: '🌳', titleHe: 'פארק', titleEn: 'Park', system: 'You are Tommy, an energetic 10-year-old kid at the park. You love games and sports. Talk like a real kid!', starter: 'Hey hey! ⚽ I\'m Tommy! Wanna play? I\'ve got a soccer ball and my dog Rex is here too! He\'s super friendly!\n(היי! אני טומי! רוצה לשחק? יש לי כדורגל והכלב שלי רקס פה! הוא סופר חברותי!)', suggestions: ['Let\'s play soccer!', 'Can I pet your dog?', 'What should we play?'] },
  { id: 'space', emoji: '🚀', titleHe: 'תחנת חלל', titleEn: 'Space Station', system: 'You are Captain Luna, an adventurous astronaut. You are amazed by everything in space and love sharing cool facts with kids.', starter: 'Welcome aboard, space cadet! 🚀 I\'m Captain Luna! Quick, look out the window - see those tiny lights? Those are billions of stars!\n(ברוכים הבאים, צוער חלל! אני קפטן לונה! מהר, תסתכלו מהחלון - רואים את האורות הקטנים? אלה מיליארדי כוכבים!)', suggestions: ['Wow so cool!', 'What is that planet?', 'Are we on the Moon?'] },
  { id: 'supermarket', emoji: '🛒', titleHe: 'סופרמרקט', titleEn: 'Supermarket', system: 'You are Sam, a helpful and funny supermarket worker. You know everything about the products and love helping customers.', starter: 'Welcome to FreshMart! 🛒 I\'m Sam! Need help finding anything? We have fresh fruits today - the strawberries are amazing!\n(ברוכים הבאים! אני סאם! צריכים עזרה? יש לנו פירות טריים - התותים מדהימים!)', suggestions: ['Where are the apples?', 'I need milk', 'What fruits do you have?'] },
];

interface Message { role: 'user' | 'assistant'; content: string; isVoice?: boolean; }

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
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [bestVoice, setBestVoice] = useState<SpeechSynthesisVoice | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Find best natural voice
  useEffect(() => {
    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer natural/premium voices
      const preferred = [
        'Google UK English Female', 'Google US English', 'Samantha', 'Karen',
        'Daniel', 'Moira', 'Tessa', 'Google UK English Male',
        'Microsoft Zira', 'Microsoft Mark', 'Rishi', 'Fiona',
      ];
      for (const name of preferred) {
        const v = voices.find(v => v.name.includes(name));
        if (v) { setBestVoice(v); return; }
      }
      // Fallback: any English voice that's not "Google US English" robotic
      const englishVoice = voices.find(v => v.lang.startsWith('en') && v.localService === false) || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) setBestVoice(englishVoice);
    };
    findVoice();
    window.speechSynthesis.onvoiceschanged = findVoice;

    // Check speech recognition support
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const recognition = new SR();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const speakText = (text: string) => {
    try {
      const lines = text.split('\n');
      const englishLines = lines.filter(l => !/[\u0590-\u05FF]/.test(l) && !l.startsWith('('));
      const clean = englishLines.join(' ').replace(/[🍕🐾😊⚽🌟🥤📏🍰😋💰🐕🐱🏷️🎂📚📖🎮👋🦵💨🎢🌞🌙☀️🔴🪐🌍🚀✏️✅🛒⭐💡☀️💬🎉✨👏]/g, '').trim();
      if (!clean) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US';
      u.rate = 0.9;
      u.pitch = 1.05;
      u.volume = 1;
      if (bestVoice) u.voice = bestVoice;
      window.speechSynthesis.speak(u);
    } catch (_) {}
  };

  const startRecording = () => {
    if (!recognitionRef.current || recording) return;
    setRecording(true);
    sounds.tap();

    recognitionRef.current.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      setRecording(false);
      sounds.coin();
    };
    recognitionRef.current.onerror = () => { setRecording(false); };
    recognitionRef.current.onend = () => { setRecording(false); };
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  };

  const startScenario = (s: typeof SCENARIOS[0]) => {
    setScenario(s);
    setMessages([{ role: 'assistant', content: s.starter }]);
    setMsgCount(0); setFinished(false); setScore(0);
    sounds.mystery();
    setTimeout(() => speakText(s.starter), 300);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !scenario || finished) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setMsgCount(c => c + 1);
    setScore(s => s + 1);
    setLoading(true);
    sounds.tap();

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMsg }].map(m => ({ role: m.role, content: m.content })),
          system: scenario.system,
          track: profile.track || 'explorers',
          nickname: profile.nickname,
        }),
      });
      const data = await resp.json();
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        sounds.correct();
        setTimeout(() => speakText(data.reply), 200);
      } else throw new Error('no reply');
    } catch (_) {
      const fallbacks = [
        `That's great, ${profile.nickname}! 👏 Tell me more about that!\n(מצוין! ספרו לי עוד על זה!)`,
        `Oh wow, really? That sounds awesome! 😊 What else?\n(וואו, באמת? נשמע מדהים! מה עוד?)`,
        `You're doing so well! 🌟 Keep speaking English - you're amazing!\n(אתם מדהימים! המשיכו לדבר אנגלית!)`,
        `Ha, that's cool! 😄 I love chatting with you! What's next?\n(הא, מגניב! אני אוהב/ת לדבר איתכם! מה הלאה?)`,
        `Wonderful answer! ✨ You're getting better every minute!\n(תשובה נפלאה! אתם משתפרים כל רגע!)`,
      ];
      const fb = fallbacks[msgCount % fallbacks.length];
      setMessages(prev => [...prev, { role: 'assistant', content: fb }]);
      sounds.correct();
      setTimeout(() => speakText(fb), 200);
    }

    if (msgCount + 1 >= 10) { setFinished(true); setTimeout(() => sounds.perfect(), 500); }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFinish = async () => {
    setSaving(true);
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
            <p className="text-sm font-bold text-white mb-1">🎤 דבר, הקלד, ושמע!</p>
            <p className="text-xs text-slate-400">הרובוט מדבר אליך באנגלית, מתקן שגיאות, ומתרגם לעברית</p>
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
          <p className="text-sm text-indigo-300 mb-1">{scenario.titleHe}</p>
          <p className="text-xs text-slate-400 mb-4">{score} הודעות באנגלית! 🌟</p>
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
          <button onClick={onFinish} className="text-sm px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>←</button>
          <span className="text-lg">{scenario.emoji}</span>
          <span className="text-sm font-bold text-white">{scenario.titleHe}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>💬 {msgCount}/10</div>
          {msgCount >= 5 && !finished && (
            <button onClick={() => { setFinished(true); sounds.perfect(); }} className="text-xs px-3 py-1 rounded-lg font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>✅ סיים</button>
          )}
        </div>
      </div>

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
              {m.role === 'assistant' && (
                <div className="flex items-center justify-end gap-1 mt-1.5 opacity-50">
                  <span className="text-[10px]">tap to hear</span>
                  <span className="text-xs">🔊</span>
                </div>
              )}
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
                <span className="text-xs text-slate-400">thinking</span>
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
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.25)' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="px-4 py-3 flex gap-2 items-center" style={{ background: 'rgba(15,12,41,0.98)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Mic button */}
        {voiceSupported && (
          <button onClick={recording ? stopRecording : startRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg transition-all ${recording ? 'animate-pulse' : 'hover:scale-110 active:scale-95'}`}
            style={{ background: recording ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)', border: `2px solid ${recording ? '#ef4444' : 'rgba(99,102,241,0.3)'}` }}>
            {recording ? '⏹️' : '🎤'}
          </button>
        )}
        <input ref={inputRef} type="text" placeholder={finished ? '✅ סיימת!' : recording ? '🎤 listening...' : 'Type or tap 🎤'} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading || finished || recording} className="flex-1 px-4 py-3 rounded-xl text-sm" dir="ltr"
          style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.1)', color: '#e2e8f0', outline: 'none' }} />
        <button onClick={sendMessage} disabled={!input.trim() || loading || finished}
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg disabled:opacity-30 transition-all hover:scale-110 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          📤
        </button>
      </div>
    </div>
  );
}