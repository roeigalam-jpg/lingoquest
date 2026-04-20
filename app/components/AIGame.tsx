'use client';
import { useState, useRef, useEffect } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const SCENARIOS = [
  { id: 'restaurant', emoji: '🍕', titleHe: 'מסעדה', titleEn: 'Restaurant', system: 'You are a friendly waiter at a pizza restaurant. Help the student order food. Ask what they want to eat, drink, and for dessert.', starter: 'Welcome to LingoQuest Pizza! 🍕 What would you like to eat today?\n(ברוכים הבאים לפיצה לינגווקווסט! מה תרצו לאכול היום?)', suggestions: ['I want pizza', 'Can I have water?', 'What do you have?'] },
  { id: 'pet_shop', emoji: '🐶', titleHe: 'חנות חיות', titleEn: 'Pet Shop', system: 'You are a friendly pet shop owner. Help the student choose a pet. Ask what animal they like, what name they will give it.', starter: 'Hello! Welcome to my pet shop! 🐾 We have dogs, cats, birds and fish. What pet do you want?\n(שלום! ברוכים הבאים! יש לנו כלבים, חתולים, ציפורים ודגים. מה תרצו?)', suggestions: ['I want a dog', 'How much is the cat?', 'Can I see the birds?'] },
  { id: 'school', emoji: '🏫', titleHe: 'יום ראשון בבית ספר', titleEn: 'First Day at School', system: 'You are a friendly teacher meeting a new student. Ask about their name, age, favorite subjects, and hobbies.', starter: 'Good morning! 😊 I am your English teacher, Ms. Luna. What is your name?\n(בוקר טוב! אני המורה לאנגלית, גברת לונה. מה השם שלך?)', suggestions: ['My name is...', 'I am 8 years old', 'I like math'] },
  { id: 'park', emoji: '🌳', titleHe: 'פארק', titleEn: 'Playing at the Park', system: 'You are a friendly kid at the park. You want to play together. Suggest games, sports, activities. Be very enthusiastic!', starter: 'Hi there! ⚽ Do you want to play with me? I have a ball and a frisbee!\n(היי! רוצה לשחק איתי? יש לי כדור ופריזבי!)', suggestions: ['Yes! Let\'s play!', 'I like football', 'What games do you know?'] },
  { id: 'space', emoji: '🚀', titleHe: 'תחנת חלל', titleEn: 'Space Station', system: 'You are Captain Luna, a friendly astronaut on a space station. Teach the student space words (stars, moon, planet, rocket, astronaut, Earth, sun, galaxy). Make it exciting!', starter: 'Welcome aboard the Space Station! 🚀 I am Captain Luna. Look out the window - can you see the stars?\n(ברוכים הבאים לתחנת החלל! אני קפטן לונה. תסתכלו מהחלון - רואים את הכוכבים?)', suggestions: ['Wow! I see stars!', 'What is that planet?', 'Can we go to the Moon?'] },
  { id: 'supermarket', emoji: '🛒', titleHe: 'סופרמרקט', titleEn: 'Supermarket', system: 'You are a friendly cashier at a supermarket. Help the student buy fruits, vegetables, drinks. Teach food vocabulary.', starter: 'Hello! Welcome to LingoMart! 🛒 What would you like to buy today?\n(שלום! ברוכים הבאים ללינגומרט! מה תרצו לקנות?)', suggestions: ['I need apples', 'Where is the milk?', 'How much is this?'] },
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
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const speakText = (text: string) => {
    try {
      // Extract just the English part (before Hebrew in parentheses)
      const englishPart = text.split('\n').filter(l => !l.startsWith('(') && !l.startsWith('כ') && !l.startsWith('ב') && !l.startsWith('ש') && !l.startsWith('א') && !l.startsWith('ה') && !l.startsWith('ת') && !l.startsWith('מ') && !l.startsWith('נ') && !l.startsWith('ע') && !l.startsWith('ל') && !l.startsWith('ר')  && !l.startsWith('ד') && !l.startsWith('ג') && !l.startsWith('י') && !l.startsWith('ז') && !l.startsWith('ק') && !l.startsWith('ו') && !l.startsWith('פ')).join(' ');
      const clean = englishPart.replace(/[\u0590-\u05FF()]/g, '').replace(/[🍕🐾😊⚽🌟🥤📏🍰😋💰🐕🐱🏷️🎂📚📖🎮👋🦵💨🎢🌞🌙☀️🔴🪐🌍🚀✏️✅🛒]/g, '').trim();
      if (!clean) return;
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'en-US'; u.rate = 0.8; u.pitch = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  };

  const startScenario = (s: typeof SCENARIOS[0]) => {
    setScenario(s);
    setMessages([{ role: 'assistant', content: s.starter }]);
    setMsgCount(0); setFinished(false); setScore(0);
    sounds.mystery();
    setTimeout(() => speakText(s.starter), 500);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !scenario || finished) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setMsgCount(c => c + 1);
    setScore(s => s + 1);
    setLoading(true);
    sounds.tap();

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

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        sounds.correct();
        speakText(data.reply);
      } else {
        throw new Error('no reply');
      }
    } catch (_) {
      // Fallback
      const fallbacks = [
        `Great job, ${profile.nickname}! 🌟 Can you tell me more?\n(כל הכבוד! ספר/י לי עוד)`,
        `Excellent English! 👏 What else would you like to say?\n(אנגלית מצוינת! מה עוד תרצו להגיד?)`,
        `Very good! 😊 Keep going, you are doing amazing!\n(מצוין! המשיכו, אתם מדהימים!)`,
        `Wonderful! ✨ I love talking with you! Tell me more!\n(נפלא! אני אוהב/ת לדבר איתך! ספרו עוד!)`,
        `You are learning so fast! 🚀 What is your next question?\n(אתם לומדים מהר! מה השאלה הבאה?)`,
      ];
      const fb = fallbacks[msgCount % fallbacks.length];
      setMessages(prev => [...prev, { role: 'assistant', content: fb }]);
      sounds.correct();
      speakText(fb);
    }

    if (msgCount + 1 >= 10) {
      setFinished(true);
      setTimeout(() => sounds.perfect(), 500);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFinish = async () => {
    setSaving(true);
    const xp = Math.min(score * 12, 120);
    const lingos = Math.min(score * 8, 80);
    try { await completeGame(userId, xp, lingos, 0); } catch (_) {}
    onFinish();
  };

  // Scenario selection
  if (!scenario) return (
    <div className="min-h-screen px-4 py-5 pb-24" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-lg mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">🤖 שיחה חיה עם AI</h2>
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
        </div>
        <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(99,102,241,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}>
          <p className="text-sm font-bold text-white">🔊 דבר באנגלית עם רובוט חכם!</p>
          <p className="text-xs text-slate-400">הוא ינהל איתך שיחה אמיתית, יתקן שגיאות, ויעזור לך ללמוד</p>
        </div>
        <div className="space-y-3">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => startScenario(s)}
              className="w-full rounded-2xl p-4 text-right transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-3">
                <div className="text-3xl">{s.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-sm font-black text-white">{s.titleHe}</h3>
                  <p className="text-xs text-slate-400">{s.titleEn}</p>
                </div>
                <span className="text-xl">▶</span>
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
      <div className="flex items-center justify-between px-4 py-3" dir="rtl">
        <div className="flex items-center gap-2">
          <button onClick={onFinish} className="text-sm px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>←</button>
          <span className="text-lg">{scenario.emoji}</span>
          <span className="text-sm font-bold text-white">{scenario.titleHe}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>💬 {msgCount}/10</div>
          {msgCount >= 5 && !finished && (
            <button onClick={() => { setFinished(true); sounds.perfect(); }} className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(34,197,94,0.2)', color: '#34d399' }}>✅ סיים</button>
          )}
        </div>
      </div>

      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3" dir="ltr">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
            {m.role === 'assistant' && <div className="text-lg mb-1">🤖</div>}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'assistant' ? 'cursor-pointer' : ''}`}
              onClick={() => m.role === 'assistant' && speakText(m.content)}
              style={{
                background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
              }}>
              <p className="text-sm text-white whitespace-pre-line leading-relaxed">{m.content}</p>
              {m.role === 'assistant' && <div className="text-right mt-1 opacity-60"><span className="text-[10px]">🔊 לחץ לשמוע</span></div>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start items-end gap-2">
            <div className="text-lg mb-1">🤖</div>
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6366f1', animationDelay: `${i*0.2}s` }} />)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {msgCount < 2 && !loading && scenario.suggestions && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto" dir="rtl">
          {scenario.suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.3)' }}>
              💡 {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-3 flex gap-2" style={{ background: 'rgba(15,12,41,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <input ref={inputRef} type="text" placeholder={finished ? '✅ סיימת!' : 'Write in English... ✍️'} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading || finished} className="flex-1 px-4 py-3 rounded-xl text-sm" dir="ltr"
          style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
        <button onClick={sendMessage} disabled={!input.trim() || loading || finished}
          className="px-5 py-3 rounded-xl font-bold text-white disabled:opacity-40 transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {loading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}