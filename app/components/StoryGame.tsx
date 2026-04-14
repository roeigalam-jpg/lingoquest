'use client';
import { useState, useEffect } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

interface StoryNode {
  id: string;
  character: string;
  characterEmoji: string;
  textHe: string;
  textEn: string;
  type: 'dialog' | 'question' | 'reward' | 'ending';
  question?: { word: string; wordHe: string; options: string[]; hint: string };
  choices?: Array<{ label: string; labelHe: string; next: string }>;
  next?: string;
  reward?: { xp: number; lingos: number; item?: string };
}

const STORIES: Record<string, { title: string; titleHe: string; emoji: string; nodes: Record<string, StoryNode> }> = {
  lost_pet: {
    title: 'The Lost Pet', titleHe: 'חיית המחמד האבודה', emoji: '🐾',
    nodes: {
      start: { id: 'start', character: 'Luna', characterEmoji: '👧', textHe: 'שלום! אני לונה. חיית המחמד שלי נעלמה! תעזור לי למצוא אותה?', textEn: 'Hi! I\'m Luna. My pet disappeared! Will you help me find it?', type: 'dialog', choices: [{ label: 'Yes, let\'s go!', labelHe: 'כן, יאללה!', next: 'q1' }, { label: 'What pet?', labelHe: 'איזו חיה?', next: 'what_pet' }] },
      what_pet: { id: 'what_pet', character: 'Luna', characterEmoji: '👧', textHe: 'זו חתולה קטנה בשם Whiskers. היא אוהבת לטפס על עצים!', textEn: 'It\'s a small cat named Whiskers. She loves climbing trees!', type: 'dialog', next: 'q1' },
      q1: { id: 'q1', character: 'Luna', characterEmoji: '👧', textHe: 'ראיתי אותה ליד ה... מה זה באנגלית? 🌳', textEn: 'I saw her near the... what\'s this in English? 🌳', type: 'question', question: { word: 'Tree', wordHe: 'עץ', options: ['Tree', 'House', 'Car', 'Door'], hint: '🌳 It\'s tall and green' } },
      q1_correct: { id: 'q1_correct', character: 'Luna', characterEmoji: '👧', textHe: 'נכון! Tree! בואו נלך לעץ!', textEn: 'Yes! Tree! Let\'s go to the tree!', type: 'dialog', next: 'park' },
      q1_wrong: { id: 'q1_wrong', character: 'Luna', characterEmoji: '👧', textHe: 'לא... זה Tree! עץ. בוא ננסה שוב', textEn: 'No... it\'s Tree! Let\'s try again', type: 'dialog', next: 'q1' },
      park: { id: 'park', character: 'Ranger Sam', characterEmoji: '🧑‍🌾', textHe: 'שלום ילדים! אני שומר הפארק. ראיתי חתולה רצה לכיוון ה...', textEn: 'Hello kids! I\'m the park ranger. I saw a cat run toward the...', type: 'question', question: { word: 'Bridge', wordHe: 'גשר', options: ['Bridge', 'Mountain', 'River', 'School'], hint: '🌉 You walk over water on it' } },
      park_correct: { id: 'park_correct', character: 'Ranger Sam', characterEmoji: '🧑‍🌾', textHe: 'בדיוק! Bridge - גשר! היא רצה לשם!', textEn: 'Exactly! Bridge! She ran there!', type: 'dialog', next: 'bridge' },
      park_wrong: { id: 'park_wrong', character: 'Ranger Sam', characterEmoji: '🧑‍🌾', textHe: 'לא, זה Bridge - גשר. בוא ננסה!', textEn: 'No, it\'s Bridge. Try again!', type: 'dialog', next: 'park' },
      bridge: { id: 'bridge', character: 'Old Fisherman', characterEmoji: '🧓', textHe: 'אהה, ראיתי חתולה! היא אכלה... מה זה? 🐟', textEn: 'Ahh, I saw a cat! She was eating... what is it? 🐟', type: 'question', question: { word: 'Fish', wordHe: 'דג', options: ['Fish', 'Bread', 'Cake', 'Rice'], hint: '🐟 It swims in water' } },
      bridge_correct: { id: 'bridge_correct', character: 'Old Fisherman', characterEmoji: '🧓', textHe: 'Fish! נכון! היא אכלה דג ורצה לכיוון ה...', textEn: 'Fish! Correct! She ate fish and ran to the...', type: 'dialog', next: 'q4' },
      bridge_wrong: { id: 'bridge_wrong', character: 'Old Fisherman', characterEmoji: '🧓', textHe: 'לא, Fish! דג. ננסה שוב', textEn: 'No, Fish! Try again', type: 'dialog', next: 'bridge' },
      q4: { id: 'q4', character: 'Luna', characterEmoji: '👧', textHe: 'אני חושבת שהיא הלכה ל... 🏠', textEn: 'I think she went to the... 🏠', type: 'question', question: { word: 'House', wordHe: 'בית', options: ['House', 'Store', 'School', 'Park'], hint: '🏠 Where you live' } },
      q4_correct: { id: 'q4_correct', character: 'Luna', characterEmoji: '👧', textHe: 'House! בית! בואו נרוץ!', textEn: 'House! Home! Let\'s run!', type: 'dialog', next: 'q5' },
      q4_wrong: { id: 'q4_wrong', character: 'Luna', characterEmoji: '👧', textHe: 'לא, House! בוא ננסה', textEn: 'No, House! Try again', type: 'dialog', next: 'q4' },
      q5: { id: 'q5', character: 'Mom', characterEmoji: '👩', textHe: 'ילדים! Whiskers פה! היא ישנה על ה...', textEn: 'Kids! Whiskers is here! She\'s sleeping on the...', type: 'question', question: { word: 'Bed', wordHe: 'מיטה', options: ['Bed', 'Table', 'Chair', 'Floor'], hint: '🛏️ You sleep on it' } },
      q5_correct: { id: 'q5_correct', character: 'Mom', characterEmoji: '👩', textHe: 'Bed! המיטה! מצאנו אותה!', textEn: 'Bed! We found her!', type: 'dialog', next: 'ending' },
      q5_wrong: { id: 'q5_wrong', character: 'Mom', characterEmoji: '👩', textHe: 'לא, Bed! מיטה', textEn: 'No, Bed!', type: 'dialog', next: 'q5' },
      ending: { id: 'ending', character: 'Luna', characterEmoji: '👧', textHe: '🎉 מצאנו את Whiskers! תודה רבה שעזרת! למדנו הרבה מילים באנגלית!', textEn: '🎉 We found Whiskers! Thank you for helping! We learned many English words!', type: 'ending', reward: { xp: 80, lingos: 50 } },
    },
  },
  treasure_hunt: {
    title: 'Treasure Island', titleHe: 'אי המטמון', emoji: '🏴‍☠️',
    nodes: {
      start: { id: 'start', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'אהוי! אני קפטן רקס! מצאתי מפת מטמון! תצטרף אליי?', textEn: 'Ahoy! I\'m Captain Rex! I found a treasure map! Join me?', type: 'dialog', choices: [{ label: 'Adventure!', labelHe: 'הרפתקה!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'המפה אומרת ללכת לכיוון ה... 🌊', textEn: 'The map says go toward the... 🌊', type: 'question', question: { word: 'Ocean', wordHe: 'אוקיינוס', options: ['Ocean', 'Desert', 'Forest', 'City'], hint: '🌊 Big blue water' } },
      q1_correct: { id: 'q1_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Ocean! אוקיינוס! מפליגים!', textEn: 'Ocean! Let\'s sail!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'לא, Ocean! ננסה שוב', textEn: 'No, Ocean! Try again', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Parrot Pete', characterEmoji: '🦜', textHe: 'סקוואק! אני פיט התוכי! המטמון מוסתר ב... 🏝️', textEn: 'Squawk! I\'m Pete the parrot! Treasure hidden on... 🏝️', type: 'question', question: { word: 'Island', wordHe: 'אי', options: ['Island', 'Mountain', 'Cave', 'Lake'], hint: '🏝️ Land surrounded by water' } },
      q2_correct: { id: 'q2_correct', character: 'Parrot Pete', characterEmoji: '🦜', textHe: 'Island! אי! סקוואק!', textEn: 'Island! Squawk!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Parrot Pete', characterEmoji: '🦜', textHe: 'לא! Island! סקוואק!', textEn: 'No! Island! Squawk!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'חפרו ליד ה... 🌴', textEn: 'Dig near the... 🌴', type: 'question', question: { word: 'Palm', wordHe: 'דקל', options: ['Palm', 'Pine', 'Oak', 'Flower'], hint: '🌴 Tropical tree' } },
      q3_correct: { id: 'q3_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Palm! דקל! חופרים!', textEn: 'Palm! Dig!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'לא, Palm! ננסה', textEn: 'No, Palm!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'מצאנו תיבה! צריך... 🔑', textEn: 'Found a chest! Need a... 🔑', type: 'question', question: { word: 'Key', wordHe: 'מפתח', options: ['Key', 'Lock', 'Door', 'Box'], hint: '🔑 Opens locks' } },
      q4_correct: { id: 'q4_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Key! מפתח! פותחים!', textEn: 'Key! Open it!', type: 'dialog', next: 'q5' },
      q4_wrong: { id: 'q4_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'לא, Key!', textEn: 'No, Key!', type: 'dialog', next: 'q4' },
      q5: { id: 'q5', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'בתיבה יש... ✨ מה זה?', textEn: 'Inside the chest... ✨ What is it?', type: 'question', question: { word: 'Gold', wordHe: 'זהב', options: ['Gold', 'Silver', 'Stone', 'Wood'], hint: '✨ Shiny yellow metal' } },
      q5_correct: { id: 'q5_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Gold! זהב!', textEn: 'Gold!', type: 'dialog', next: 'ending' },
      q5_wrong: { id: 'q5_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'לא, Gold!', textEn: 'No, Gold!', type: 'dialog', next: 'q5' },
      ending: { id: 'ending', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: '🏴‍☠️ מצאנו את המטמון! אתה פיראט אמיתי! למדנו Ocean, Island, Palm, Key, Gold!', textEn: '🏴‍☠️ We found the treasure! You\'re a real pirate!', type: 'ending', reward: { xp: 100, lingos: 70 } },
    },
  },
  space_mission: {
    title: 'Space Mission', titleHe: 'משימה בחלל', emoji: '🚀',
    nodes: {
      start: { id: 'start', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'שלום טייס! אני מפקדת זארה. יש לנו משימה בחלל!', textEn: 'Hello pilot! I\'m Commander Zara. We have a space mission!', type: 'dialog', choices: [{ label: 'Ready!', labelHe: 'מוכן!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'נטיס מעבר ל... ⭐', textEn: 'We\'ll fly past the... ⭐', type: 'question', question: { word: 'Stars', wordHe: 'כוכבים', options: ['Stars', 'Clouds', 'Birds', 'Trees'], hint: '⭐ Shiny dots in the night sky' } },
      q1_correct: { id: 'q1_correct', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'Stars! כוכבים! המראה!', textEn: 'Stars! Liftoff!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'לא, Stars!', textEn: 'No, Stars!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Robot Beep', characterEmoji: '🤖', textHe: 'ביפ בופ! אני רובוט ביפ! נוחתים על ה... 🌙', textEn: 'Beep boop! I\'m Robot Beep! Landing on the... 🌙', type: 'question', question: { word: 'Moon', wordHe: 'ירח', options: ['Moon', 'Sun', 'Mars', 'Venus'], hint: '🌙 Earth\'s closest neighbor' } },
      q2_correct: { id: 'q2_correct', character: 'Robot Beep', characterEmoji: '🤖', textHe: 'Moon! ירח! ביפ!', textEn: 'Moon! Beep!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Robot Beep', characterEmoji: '🤖', textHe: 'שגיאה! Moon!', textEn: 'Error! Moon!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Alien Zix', characterEmoji: '👽', textHe: 'שלום אנושיים! אני זיקס! תביאו לי... 💎', textEn: 'Hello humans! I\'m Zix! Bring me... 💎', type: 'question', question: { word: 'Diamond', wordHe: 'יהלום', options: ['Diamond', 'Rock', 'Glass', 'Ice'], hint: '💎 Precious sparkling stone' } },
      q3_correct: { id: 'q3_correct', character: 'Alien Zix', characterEmoji: '👽', textHe: 'Diamond! יהלום! תודה!', textEn: 'Diamond! Thanks!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Alien Zix', characterEmoji: '👽', textHe: 'לא! Diamond!', textEn: 'No! Diamond!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'מהר! צריך לחזור ל... 🌍', textEn: 'Quick! Must return to... 🌍', type: 'question', question: { word: 'Earth', wordHe: 'כדור הארץ', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], hint: '🌍 Our home planet' } },
      q4_correct: { id: 'q4_correct', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'Earth! כדור הארץ! חוזרים הביתה!', textEn: 'Earth! Going home!', type: 'dialog', next: 'ending' },
      q4_wrong: { id: 'q4_wrong', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: 'לא, Earth!', textEn: 'No, Earth!', type: 'dialog', next: 'q4' },
      ending: { id: 'ending', character: 'Commander Zara', characterEmoji: '👩‍🚀', textHe: '🚀 משימה הושלמה! למדנו Stars, Moon, Diamond, Earth! אתה אסטרונאוט אמיתי!', textEn: '🚀 Mission complete! You\'re a real astronaut!', type: 'ending', reward: { xp: 100, lingos: 70 } },
    },
  },
};

const STORY_LIST = Object.entries(STORIES).map(([key, val]) => ({ key, ...val }));

export default function StoryGame({ profile, userId, onFinish }: { profile: any; userId: string; onFinish: () => void }) {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const [currentNode, setCurrentNode] = useState<string>('start');
  const [score, setScore] = useState(0);
  const [totalQ, setTotalQ] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    if (selectedStory) {
      setTyping(true);
      setTimeout(() => setTyping(false), 800);
    }
  }, [currentNode, selectedStory]);

  if (!selectedStory) {
    return (
      <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir="rtl">
        <h2 className="text-xl font-black text-white mb-1">📖 הרפתקאות</h2>
        <p className="text-xs mb-5 text-slate-400">בחר סיפור ולמד אנגלית דרך הרפתקה!</p>
        <div className="space-y-3">
          {STORY_LIST.map(story => (
            <button key={story.key} onClick={() => { sounds.mystery(); setSelectedStory(story.key); setCurrentNode('start'); setScore(0); setTotalQ(0); }}
              className="w-full rounded-2xl p-5 text-right transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{story.emoji}</div>
                <div className="flex-1">
                  <h3 className="text-base font-black text-white">{story.titleHe}</h3>
                  <p className="text-xs text-slate-400">{story.title}</p>
                  <p className="text-xs text-indigo-300 mt-1">🎯 5 מילים חדשות | ⭐ 80-100 XP</p>
                </div>
                <span className="text-2xl">▶</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const story = STORIES[selectedStory];
  const node = story.nodes[currentNode];
  if (!node) return null;

  const handleAnswer = (option: string) => {
    if (answered || !node.question) return;
    setAnswered(true);
    const correct = option === node.question.word;
    setWasCorrect(correct);
    setTotalQ(t => t + 1);
    if (correct) { setScore(s => s + 1); sounds.correct(); sounds.speak(node.question!.word); }
    else { sounds.wrong(); }
    setTimeout(() => {
      setAnswered(false); setWasCorrect(null);
      setCurrentNode(correct ? `${currentNode}_correct` : `${currentNode}_wrong`);
    }, 1200);
  };

  const handleChoice = (next: string) => { sounds.tap(); setCurrentNode(next); };
  const handleNext = () => { sounds.tap(); if (node.next) setCurrentNode(node.next); };

  const handleFinishStory = async () => {
    setSaving(true);
    const reward = node.reward || { xp: 50, lingos: 30 };
    try { await completeGame(userId, reward.xp, reward.lingos, score === totalQ ? 1 : 0); } catch (_) {}
    onFinish();
  };

  // Ending screen
  if (node.type === 'ending') {
    const reward = node.reward || { xp: 50, lingos: 30 };
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
        <div className="w-full max-w-md text-center" dir="rtl">
          <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-white mb-2">{story.titleHe}</h2>
            <p className="text-sm text-indigo-300 mb-4">{node.textHe}</p>
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="text-sm font-bold text-green-400">✅ {score}/{totalQ} תשובות נכונות</div>
            </div>
            <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="flex justify-center gap-5">
                <div><span>⭐</span><span className="font-black text-white ml-1">+{reward.xp}</span></div>
                <div><span>💰</span><span className="font-black text-white ml-1">+{reward.lingos}</span></div>
              </div>
            </div>
            <button onClick={handleFinishStory} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {saving ? '⚡...' : '🏠 המשך'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>✕ יציאה</button>
          <div className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
            📖 {story.titleHe} | ✅ {score}
          </div>
        </div>

        {/* Character dialog */}
        <div className="flex-1 flex flex-col items-center justify-center" dir="rtl">
          {/* Character */}
          <div className="mb-4 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-2"
              style={{ background: 'rgba(99,102,241,0.2)', border: '3px solid rgba(99,102,241,0.4)', boxShadow: '0 0 30px rgba(99,102,241,0.2)' }}>
              {node.characterEmoji}
            </div>
            <p className="text-sm font-bold text-indigo-300">{node.character}</p>
          </div>

          {/* Speech bubble */}
          <div className="w-full rounded-2xl p-5 mb-4 relative" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-base text-white leading-relaxed">{typing ? '...' : node.textHe}</p>
            <p className="text-xs text-slate-400 mt-2 italic">{typing ? '' : node.textEn}</p>
          </div>

          {/* Question */}
          {node.type === 'question' && node.question && !typing && (
            <div className="w-full">
              <p className="text-center text-xs text-indigo-300 mb-3">💡 {node.question.hint}</p>
              <div className="grid grid-cols-2 gap-3">
                {node.question.options.map((o, i) => {
                  const isAns = o === node.question!.word;
                  const show = answered;
                  let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
                  if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
                  else if (show && !isAns && answered) { bg = 'rgba(239,68,68,0.1)'; col = '#94a3b8'; }
                  return (
                    <button key={i} onClick={() => handleAnswer(o)} disabled={answered}
                      className="py-3.5 px-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] disabled:hover:scale-100"
                      style={{ background: bg, border: brd, color: col }}>{o}{show && isAns && ' ✅'}</button>
                  );
                })}
              </div>
              {wasCorrect !== null && (
                <p className="text-center mt-3 text-lg font-black" style={{ color: wasCorrect ? '#34d399' : '#f87171' }}>
                  {wasCorrect ? '🎉 נכון!' : `❌ התשובה: ${node.question.word} = ${node.question.wordHe}`}
                </p>
              )}
            </div>
          )}

          {/* Choices */}
          {node.choices && !typing && (
            <div className="w-full space-y-2">
              {node.choices.map((c, i) => (
                <button key={i} onClick={() => handleChoice(c.next)}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}>
                  {c.labelHe} <span className="text-xs text-slate-400">({c.label})</span>
                </button>
              ))}
            </div>
          )}

          {/* Next button for dialog */}
          {node.type === 'dialog' && node.next && !node.choices && !typing && (
            <button onClick={handleNext}
              className="mt-4 px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              ▶ המשך
            </button>
          )}
        </div>
      </div>
    </div>
  );
}