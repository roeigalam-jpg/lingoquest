'use client';
import { useState } from 'react';
import { sounds } from '../lib/sounds';

const SLIDES = [
  { emoji: '🌍', titleHe: 'ברוכים הבאים ל-LingoQuest!', titleEn: 'Welcome to LingoQuest!', textHe: 'משחק לימוד אנגלית הכי כיפי בעולם! למד מילים חדשות דרך משחקים, הרפתקאות ותחרויות', textEn: 'The most fun English learning game! Learn through games, adventures & competitions', bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
  { emoji: '🗺️', titleHe: 'מפת העולם', titleEn: 'World Map', textHe: 'חקור איים שונים - כל אי הוא סוג משחק אחר! Word Match, Spelling, Listening ועוד. ככל שעולים רמה, נפתחים איים חדשים!', textEn: 'Explore islands - each one is a different game type!', bg: 'linear-gradient(135deg,#22c55e,#16a34a)' },
  { emoji: '🎮', titleHe: '6 סוגי משחקים', titleEn: '6 Game Types', textHe: '🎯 Word Match - חבר מילה לתמונה\n🐝 Spelling Bee - אייתו מילים\n🔧 Sentence Builder - בנה משפטים\n👂 Listening - זהה מילים בשמיעה\n🖐️ Drag & Match - גרור וחבר\n📖 הרפתקאות - סיפורים עם דמויות!', textEn: 'Word Match, Spelling, Sentence, Listening, Drag Match & Story Adventures!', bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  { emoji: '⚔️', titleHe: 'זירה ומולטיפלייר', titleEn: 'Arena & Multiplayer', textHe: 'שחק מול הבוט בזירה או מול חברים אמיתיים במולטיפלייר! מי עונה מהר יותר - מנצח! אפשר גם להזמין חברים דרך WhatsApp', textEn: 'Play vs bot or real players! Fastest answer wins!', bg: 'linear-gradient(135deg,#ef4444,#dc2626)' },
  { emoji: '🛒', titleHe: 'חנות ופרופיל', titleEn: 'Shop & Profile', textHe: 'צבור מטבעות (Lingos) ו-XP מכל משחק! קנה דמויות, כובעים, חיות מחמד ותחפושות בחנות. צור את הדמות המושלמת שלך!', textEn: 'Earn Lingos & XP! Buy avatars, hats, pets & costumes!', bg: 'linear-gradient(135deg,#8b5cf6,#ec4899)' },
  { emoji: '🏆', titleHe: 'טורנירים ואתגרים', titleEn: 'Tournaments & Challenges', textHe: 'צור או הצטרף לטורנירים! השלם משימות יומיות, פתח הישגים, ושמור על רצף ימים. אתגר חברים ונצח פרסים!', textEn: 'Create tournaments, complete daily quests, earn achievements!', bg: 'linear-gradient(135deg,#f59e0b,#22c55e)' },
  { emoji: '🤝', titleHe: 'הזמן חברים!', titleEn: 'Invite Friends!', textHe: 'שתף את הלינק שלך וקבל 200 מטבעות בונוס על כל חבר שמצטרף! גם החבר מקבל 200 מטבעות. שלח דרך WhatsApp, SMS, או כל אפליקציה!', textEn: 'Share your link & both get 200 bonus Lingos!', bg: 'linear-gradient(135deg,#25D366,#128C7E)' },
  { emoji: '🚀', titleHe: 'מוכנים? יאללה!', titleEn: 'Ready? Let\'s go!', textHe: 'התחל לשחק, למד אנגלית, והפוך לאלוף! כל משחק מלמד מילים חדשות עם תרגום לעברית ושמיעה בקול. בהצלחה! 🌟', textEn: 'Start playing, learn English & become a champion!', bg: 'linear-gradient(135deg,#6366f1,#22c55e)' },
];

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const s = SLIDES[slide];

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-md" dir="rtl">
        <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
          {/* Slide Content */}
          <div className="p-8 text-center" style={{ background: s.bg, minHeight: 320 }}>
            <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>{s.emoji}</div>
            <h2 className="text-2xl font-black text-white mb-2">{s.titleHe}</h2>
            <p className="text-xs text-white/70 mb-4">{s.titleEn}</p>
            <p className="text-sm text-white/90 leading-relaxed whitespace-pre-line">{s.textHe}</p>
          </div>

          {/* Controls */}
          <div className="p-4 flex items-center justify-between" style={{ background: '#1e1b4b' }}>
            {/* Dots */}
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full transition-all" style={{ background: i === slide ? '#a5b4fc' : 'rgba(255,255,255,0.2)', transform: i === slide ? 'scale(1.3)' : 'scale(1)' }} />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              {slide > 0 && (
                <button onClick={() => { sounds.tap(); setSlide(s => s - 1); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>← הקודם</button>
              )}
              {slide < SLIDES.length - 1 ? (
                <button onClick={() => { sounds.tap(); setSlide(s => s + 1); }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'rgba(99,102,241,0.5)' }}>הבא →</button>
              ) : (
                <button onClick={() => { sounds.gameStart(); onClose(); }}
                  className="px-6 py-2 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>🚀 התחל לשחק!</button>
              )}
            </div>
          </div>
        </div>

        {/* Skip */}
        {slide < SLIDES.length - 1 && (
          <button onClick={onClose} className="w-full mt-3 py-2 text-xs text-slate-500 hover:text-white">דלג ←</button>
        )}
      </div>
    </div>
  );
}