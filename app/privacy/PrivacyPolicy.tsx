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
          <p className="text-xs text-slate-400">עדכון אחרון: אפריל 2026</p>

          <div>
            <h2 className="text-base font-black text-white mb-2">1. מבוא</h2>
            <p className="text-sm text-slate-300 leading-relaxed">LingoQuest הוא משחק לימוד אנגלית לילדים בגילאי 5-14. אנו מחויבים להגנה על פרטיות המשתמשים שלנו, במיוחד ילדים מתחת לגיל 13. מדיניות זו מתארת כיצד אנו אוספים, משתמשים ומגנים על מידע.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">2. מידע שאנו אוספים</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">אנו אוספים את המידע הבא בלבד:</p>
            <p className="text-sm text-slate-300 leading-relaxed">• כינוי (שם משחק) - לא שם אמיתי</p>
            <p className="text-sm text-slate-300 leading-relaxed">• תאריך לידה - לקביעת מסלול לימוד בלבד</p>
            <p className="text-sm text-slate-300 leading-relaxed">• נתוני משחק (ניקוד, רמה, פריטים)</p>
            <p className="text-sm text-slate-300 leading-relaxed mt-2">אנו <strong className="text-white">לא</strong> אוספים: שם אמיתי, כתובת, מספר טלפון, תמונות, מיקום, או כל מידע מזהה אישי אחר.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">3. שימוש במידע</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-2">המידע משמש אך ורק לצורך:</p>
            <p className="text-sm text-slate-300 leading-relaxed">• הפעלת המשחק ושמירת ההתקדמות</p>
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
            <p className="text-sm text-slate-300 leading-relaxed mb-2">הורים יכולים:</p>
            <p className="text-sm text-slate-300 leading-relaxed">• לבקש צפייה במידע של ילדם</p>
            <p className="text-sm text-slate-300 leading-relaxed">• לבקש מחיקת חשבון ומידע</p>
            <p className="text-sm text-slate-300 leading-relaxed">• ליצור קשר בכל שאלה</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">7. רכישות ותשלומים</h2>
            <p className="text-sm text-slate-300 leading-relaxed">LingoQuest מציע מנוי Premium אופציונלי בתשלום. כל רכישה מוגנת בשער הורים (שאלת חשבון) כדי לוודא שרק מבוגר מבצע את התשלום. אנו לא שומרים פרטי כרטיס אשראי או מידע פיננסי - התשלום מתבצע דרך Google Play Billing בלבד. ניתן לבטל מנוי בכל עת דרך הגדרות Google Play. אין רכישות נסתרות, פרסומות מוסתרות, או לחץ על ילדים לרכוש. כל כפתור שמוביל לרכישה מוגן בשער הורים.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">8. COPPA Compliance</h2>
            <p className="text-sm text-slate-300 leading-relaxed">LingoQuest תואם את חוק הגנת הפרטיות של ילדים באינטרנט (COPPA). אנו לא אוספים ביודעין מידע מזהה אישי מילדים מתחת לגיל 13 ללא הסכמת הורים. כל קישור חיצוני מוגן בשער הורים. אין פרסומות מכל סוג שהוא באפליקציה.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">9. שינויים במדיניות</h2>
            <p className="text-sm text-slate-300 leading-relaxed">אנו עשויים לעדכן מדיניות זו מעת לעת. שינויים מהותיים יפורסמו באפליקציה. המשך השימוש באפליקציה לאחר שינוי מהווה הסכמה למדיניות המעודכנת.</p>
          </div>

          <div>
            <h2 className="text-base font-black text-white mb-2">10. יצירת קשר</h2>
            <p className="text-sm text-slate-300 leading-relaxed">לשאלות בנוגע למדיניות פרטיות זו, ניתן לפנות אלינו:</p>
            <p className="text-sm text-indigo-300 mt-2">📧 privacy@lingoquest.game</p>
          </div>

          <div className="h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />

          <div>
            <h2 className="text-base font-black text-white mb-3">Privacy Policy (English)</h2>
            <div className="space-y-3" dir="ltr">
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">1. Introduction:</strong> LingoQuest is an English learning game for children ages 5-14. We are committed to protecting user privacy, especially for children under 13.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">2. Data We Collect:</strong> We only collect: a nickname (not real name), birth date (for difficulty level only), and game data (scores, level, items). We do NOT collect: real names, addresses, phone numbers, photos, location, or any personally identifiable information.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">3. Data Usage:</strong> Information is used solely for: operating the game, saving progress, adjusting difficulty to age, and displaying leaderboard (nickname only).</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">4. Data Sharing:</strong> We do NOT share, sell, or transfer personal information to third parties. We do NOT use advertisements or tracking tools that collect identifiable information.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">5. Data Security:</strong> Data is stored on secure Supabase servers with encryption. Access to data is restricted and secured.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">6. Parental Rights:</strong> Parents may request to view their child's data, request account and data deletion, and contact us with any questions.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">7. Purchases & Payments:</strong> LingoQuest offers an optional paid Premium subscription. All purchases are protected by a Parental Gate (math question) to ensure only adults make payments. We do NOT store credit card or financial information - payments are processed exclusively through Google Play Billing. Subscriptions can be cancelled at any time through Google Play settings. There are no hidden purchases, hidden ads, or pressure on children to buy.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">8. COPPA Compliance:</strong> LingoQuest complies with the Children's Online Privacy Protection Act (COPPA). We do not knowingly collect personally identifiable information from children under 13 without parental consent. All external links are protected by a Parental Gate. There are no advertisements of any kind in the app.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">9. Policy Changes:</strong> We may update this policy from time to time. Material changes will be announced in the app. Continued use after changes constitutes acceptance of the updated policy.</p>
              <p className="text-sm text-slate-300 leading-relaxed"><strong className="text-white">10. Contact:</strong> For questions regarding this privacy policy, contact us at: privacy@lingoquest.game</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-600">© 2026 LingoQuest. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}