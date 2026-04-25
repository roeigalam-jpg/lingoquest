'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-2xl mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">🔒 מדיניות פרטיות</h1>
          <a href="/" className="text-sm px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>🏠 חזרה</a>
        </div>

        <div className="rounded-2xl p-6 space-y-6" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <p className="text-xs text-slate-400 mb-4">עדכון אחרון: אפריל 2026</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">1. מבוא</h2>
            <p className="text-sm text-slate-300 leading-relaxed">LingoQuest הוא משחק לימוד אנגלית לילדים. אנו מחויבים להגנה על פרטיות המשתמשים שלנו, במיוחד ילדים מתחת לגיל 13. מדיניות זו מתארת כיצד אנו אוספים, משתמשים ומגנים על מידע.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">2. מידע שאנו אוספים</h2>
            <p className="text-sm text-slate-300 leading-relaxed">אנו אוספים את המידע הבא בלבד:</p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">• כינוי (שם משחק) - לא שם אמיתי</p>
            <p className="text-sm text-slate-300 leading-relaxed">• תאריך לידה - לקביעת מסלול לימוד בלבד</p>
            <p className="text-sm text-slate-300 leading-relaxed">• נתוני משחק (ניקוד, רמה, פריטים)</p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">אנו <strong className="text-white">לא</strong> אוספים: שם אמיתי, כתובת, מספר טלפון, תמונות, מיקום, או כל מידע מזהה אישי אחר.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">3. שימוש במידע</h2>
            <p className="text-sm text-slate-300 leading-relaxed">המידע משמש אך ורק לצורך:</p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">• הפעלת המשחק ושמירת ההתקדמות</p>
            <p className="text-sm text-slate-300 leading-relaxed">• התאמת רמת הקושי לגיל</p>
            <p className="text-sm text-slate-300 leading-relaxed">• הצגת טבלת דירוג (כינוי בלבד)</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">4. שיתוף מידע</h2>
            <p className="text-sm text-slate-300 leading-relaxed">אנו <strong className="text-white">לא</strong> משתפים, מוכרים או מעבירים מידע אישי לצדדים שלישיים. אנו לא משתמשים בפרסומות. אנו לא משתמשים בכלי מעקב או אנליטיקה שאוספים מידע מזהה.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">5. אבטחת מידע</h2>
            <p className="text-sm text-slate-300 leading-relaxed">המידע מאוחסן בשרתים מאובטחים של Supabase עם הצפנה. הגישה למידע מוגבלת ומאובטחת.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">6. זכויות הורים</h2>
            <p className="text-sm text-slate-300 leading-relaxed">הורים יכולים:</p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">• לבקש צפייה במידע של ילדם</p>
            <p className="text-sm text-slate-300 leading-relaxed">• לבקש מחיקת חשבון ומידע</p>
            <p className="text-sm text-slate-300 leading-relaxed">• ליצור קשר בכל שאלה</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">7. COPPA Compliance</h2>
            <p className="text-sm text-slate-300 leading-relaxed">LingoQuest תואם את חוק הגנת הפרטיות של ילדים באינטרנט (COPPA). אנו לא אוספים ביודעין מידע מזהה אישי מילדים מתחת לגיל 13 ללא הסכמת הורים.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">8. יצירת קשר</h2>
            <p className="text-sm text-slate-300 leading-relaxed">לשאלות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו:</p>
            <p className="text-sm text-indigo-300 mt-2">📧 privacy@lingoquest.game</p>
          </div>

          <div className="h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <h2 className="text-base font-black text-white mb-2">Privacy Policy (English)</h2>
            <p className="text-sm text-slate-300 leading-relaxed" dir="ltr">LingoQuest is an English learning game for children. We are committed to protecting user privacy, especially for children under 13. We do NOT collect: real names, addresses, phone numbers, photos, location, or any personally identifiable information. We only collect: a nickname (not real name), birth date (for difficulty level only), and game data (scores, level, items). We do NOT share, sell, or transfer personal information to third parties. We do NOT use advertisements or tracking tools. This app complies with COPPA. Parents may request to view or delete their child's data by contacting privacy@lingoquest.game.</p>
          </div>
        </div>
      </div>
    </div>
  );
}