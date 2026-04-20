'use client';
import { useState, useRef, useEffect } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

const SCENARIOS = [
  { id: 'restaurant', emoji: '🍕', titleHe: 'מסעדה', titleEn: 'At the Restaurant', prompt: 'You are a friendly waiter at a restaurant. The student is ordering food. Use simple English. After each student message, respond in character, then provide a Hebrew translation in parentheses. Keep sentences short (under 10 words). Ask follow-up questions to continue the conversation.', starter: 'Welcome to LingoQuest Restaurant! What would you like to eat today? 🍕\n(ברוכים הבאים למסעדת לינגווקווסט! מה תרצו לאכול היום?)' },
  { id: 'pet_shop', emoji: '🐶', titleHe: 'חנות חיות', titleEn: 'Pet Shop', prompt: 'You are a friendly pet shop owner. The student wants to buy a pet. Use simple English. After each student message, respond in character, then provide a Hebrew translation in parentheses. Keep sentences short. Ask about what pet they want.', starter: 'Hello! Welcome to my pet shop! We have dogs, cats, birds and fish. What pet do you want? 🐾\n(שלום! ברוכים הבאים לחנות החיות! יש לנו כלבים, חתולים, ציפורים ודגים. איזו חיה אתם רוצים?)' },
  { id: 'school', emoji: '🏫', titleHe: 'בית ספר', titleEn: 'First Day at School', prompt: 'You are a friendly teacher on the first day of school. The student is new. Use simple English. After each student message, respond in character, then provide a Hebrew translation in parentheses. Keep sentences short. Ask about their name, age, hobbies.', starter: 'Good morning! I am your English teacher. What is your name? 😊\n(בוקר טוב! אני המורה שלכם לאנגלית. מה השם שלכם?)' },
  { id: 'park', emoji: '🌳', titleHe: 'פארק', titleEn: 'At the Park', prompt: 'You are a friendly kid at the park. The student wants to play. Use very simple English. After each student message, respond in character, then provide a Hebrew translation in parentheses. Keep sentences very short (under 8 words). Suggest games and activities.', starter: 'Hi! Do you want to play with me? I have a ball! ⚽\n(היי! רוצה לשחק איתי? יש לי כדור!)' },
  { id: 'space', emoji: '🚀', titleHe: 'תחנת חלל', titleEn: 'Space Station', prompt: 'You are a friendly astronaut on a space station. The student just arrived. Use simple English with space vocabulary. After each student message, respond in character, then provide a Hebrew translation in parentheses. Keep sentences short. Teach space words.', starter: 'Welcome to the Space Station! I am Captain Luna. Can you see the Earth from here? 🌍\n(ברוכים הבאים לתחנת החלל! אני קפטן לונה. אתם יכולים לראות את כדור הארץ מפה?)' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const [scenario, setScenario] = useState<typeof SCENARIOS[0] | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const startScenario = (s: typeof SCENARIOS[0]) => {
    setScenario(s);
    setMessages([{ role: 'assistant', content: s.starter }]);
    setMsgCount(0);
    setFinished(false);
    sounds.mystery();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !scenario || finished) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setMsgCount(c => c + 1);
    setLoading(true);
    sounds.tap();

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: scenario.prompt + ` The student's name is ${profile.nickname}. Their English level is ${profile.track === 'explorers' ? 'beginner (ages 5-7)' : profile.track === 'voyagers' ? 'intermediate (ages 8-11)' : 'advanced (ages 12-14)'}. Keep responses appropriate for children. Be encouraging and fun!`,
          messages: [...messages.map(m => ({ role: m.role, content: m.content })), { role: 'user', content: userMsg }],
        }),
      });
      const data = await response.json();
      const aiText = data.content?.[0]?.text || 'Great job! Keep going! 🌟\n(כל הכבוד! המשיכו!)';
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
      sounds.correct();

      // Auto-finish after 8 messages
      if (msgCount + 1 >= 8) {
        setFinished(true);
        setTimeout(() => sounds.perfect(), 500);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Let\'s try again! Say something in English! 😊\n(אופס! בוא ננסה שוב! תגיד משהו באנגלית!)' }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleFinish = async () => {
    setSaving(true);
    const xp = Math.min(msgCount * 15, 120);
    const lingos = Math.min(msgCount * 10, 80);
    try { await completeGame(userId, xp, lingos, 0); } catch (_) {}
    onFinish();
  };

  // Scenario selection
  if (!scenario) return (
    <div className="min-h-screen px-4 py-5 pb-24" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-lg mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">🤖 שיחה עם AI</h2>
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
        </div>
        <p className="text-xs mb-5 text-slate-400">בחר סיטואציה ותרגל שיחה באנגלית עם רובוט חכם!</p>
        <div className="space-y-3">
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => startScenario(s)}
              className="w-full rounded-2xl p-5 text-right transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{s.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-white">{s.titleHe}</h3>
                  <p className="text-xs text-slate-400">{s.titleEn}</p>
                  <p className="text-xs text-indigo-300 mt-1">💬 תרגול שיחה חופשית | ⭐ עד 120 XP</p>
                </div>
                <span className="text-2xl">▶</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Finish screen
  if (finished && msgCount >= 8) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="w-full max-w-md text-center" dir="rtl">
        <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">שיחה מעולה!</h2>
          <p className="text-sm text-indigo-300 mb-4">{scenario.titleHe} - {msgCount} הודעות!</p>
          <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)' }}>
            <div className="flex justify-center gap-5">
              <div>⭐ <span className="font-black text-white">+{Math.min(msgCount * 15, 120)}</span></div>
              <div>💰 <span className="font-black text-white">+{Math.min(msgCount * 10, 80)}</span></div>
            </div>
          </div>
          <button onClick={handleFinish} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{saving ? '⚡...' : '🏠 המשך'}</button>
        </div>
      </div>
    </div>
  );

  // Chat screen
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" dir="rtl">
        <div className="flex items-center gap-2">
          <button onClick={onFinish} className="text-sm px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>←</button>
          <span className="text-lg">{scenario.emoji}</span>
          <span className="text-sm font-bold text-white">{scenario.titleHe}</span>
        </div>
        <div className="text-xs px-3 py-1 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>💬 {msgCount}/8</div>
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-3" dir="ltr">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-3"
              style={{
                background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.08)',
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
              }}>
              <p className="text-sm text-white whitespace-pre-line leading-relaxed">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6366f1', animationDelay: `${i * 0.2}s` }} />)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {msgCount < 3 && !loading && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto" dir="rtl">
          {(scenario.id === 'restaurant' ? ['I want pizza', 'Can I have water?', 'What do you have?'] :
            scenario.id === 'pet_shop' ? ['I want a dog', 'How much?', 'Can I see the cats?'] :
            scenario.id === 'school' ? ['My name is...', 'I am 8 years old', 'I like games'] :
            scenario.id === 'park' ? ['Yes! Let\'s play!', 'I like football', 'What games?'] :
            ['Wow, amazing!', 'What is that?', 'I see stars!']).map((s, i) => (
            <button key={i} onClick={() => { setInput(s); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:scale-105"
              style={{ background: 'rgba(99,102,241,0.2)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.3)' }}>
              💡 {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 flex gap-2" style={{ background: 'rgba(15,12,41,0.95)' }}>
        <input ref={inputRef} type="text" placeholder={finished ? '✅ סיימת!' : 'Type in English... ✍️'} value={input}
          onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
          disabled={loading || finished}
          className="flex-1 px-4 py-3 rounded-xl text-sm" dir="ltr"
          style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)', color: '#e2e8f0', outline: 'none' }} />
        <button onClick={sendMessage} disabled={!input.trim() || loading || finished}
          className="px-4 py-3 rounded-xl font-bold text-white disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
          {loading ? '⏳' : '📤'}
        </button>
      </div>

      {/* Finish button */}
      {finished && (
        <div className="px-4 py-2" style={{ background: 'rgba(15,12,41,0.95)' }}>
          <button onClick={handleFinish} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>🎉 סיים וקבל פרסים!</button>
        </div>
      )}
    </div>
  );
}