// LingoQuest i18n - Hebrew & English

export type Lang = 'he' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Landing
  'landing.title': { en: 'LingoQuest', he: 'LingoQuest' },
  'landing.subtitle': { en: 'The Language Explorer', he: 'חוקר השפות' },
  'landing.desc': { en: 'Learn English through Epic Adventures! 🎮', he: 'למד אנגלית דרך הרפתקאות מטורפות! 🎮' },
  'landing.start': { en: '🚀 Start Your Quest!', he: '🚀 התחל את ההרפתקה!' },
  
  // Register
  'register.title': { en: 'Create Your Hero', he: 'צור את הגיבור שלך' },
  'register.nickname': { en: 'NICKNAME', he: 'כינוי' },
  'register.nickname_ph': { en: 'Hero name...', he: 'שם הגיבור...' },
  'register.email': { en: 'EMAIL', he: 'אימייל' },
  'register.birthdate': { en: 'BIRTH DATE', he: 'תאריך לידה' },
  'register.password': { en: 'PASSWORD', he: 'סיסמה' },
  'register.password_ph': { en: 'Min 6 characters', he: 'לפחות 6 תווים' },
  'register.submit': { en: '⚔️ Create My Hero!', he: '⚔️ צור את הגיבור שלי!' },
  'register.creating': { en: '⚡ Creating...', he: '⚡ יוצר...' },
  'register.has_account': { en: 'Already have an account? Login', he: 'כבר יש לך חשבון? התחבר' },
  'register.no_account': { en: "Don't have an account? Register", he: 'אין לך חשבון? הירשם' },
  
  // Login
  'login.title': { en: 'Welcome Back!', he: 'ברוך הבא!' },
  'login.submit': { en: '🔑 Login', he: '🔑 התחבר' },
  'login.loading': { en: '⚡ Loading...', he: '⚡ טוען...' },
  
  // Verify
  'verify.title': { en: 'Check Your Email!', he: 'בדוק את המייל שלך!' },
  'verify.desc': { en: 'We sent a verification link to', he: 'שלחנו לינק אימות ל-' },
  'verify.button': { en: 'I Verified My Email ✅', he: 'אימתתי את המייל ✅' },
  
  // Dashboard
  'dash.level': { en: 'Level', he: 'רמה' },
  'dash.stars': { en: 'Stars', he: 'כוכבים' },
  'dash.lingos': { en: 'Lingos', he: 'מטבעות' },
  'dash.tickets': { en: 'Tickets', he: 'כרטיסים' },
  'dash.play': { en: '🎮 Play Now!', he: '🎮 שחק עכשיו!' },
  'dash.stats': { en: 'STATS', he: 'סטטיסטיקות' },
  'dash.games': { en: 'Games', he: 'משחקים' },
  'dash.wins': { en: 'Wins', he: 'ניצחונות' },
  'dash.items': { en: 'Items', he: 'פריטים' },
  'dash.invite_title': { en: '🤝 Invite Friends = 200 Lingos!', he: '🤝 הזמן חברים = 200 מטבעות!' },
  'dash.invited': { en: 'friends invited', he: 'חברים הוזמנו' },
  'dash.logout': { en: 'Logout', he: 'התנתק' },
  
  // Map
  'map.title': { en: '🗺️ World Map', he: '🗺️ מפת העולם' },
  'map.desc': { en: 'Explore islands and conquer challenges!', he: 'חקור איים וכבוש אתגרים!' },
  'map.locked': { en: 'Level', he: 'רמה' },
  
  // Nav
  'nav.home': { en: 'Home', he: 'בית' },
  'nav.map': { en: 'Map', he: 'מפה' },
  'nav.arena': { en: 'Arena', he: 'זירה' },
  'nav.shop': { en: 'Shop', he: 'חנות' },
  'nav.board': { en: 'Board', he: 'דירוג' },
  
  // Games
  'game.quit': { en: '✕ Quit', he: '✕ יציאה' },
  'game.correct': { en: 'Correct', he: 'נכון' },
  'game.missed': { en: 'Missed', he: 'פספוס' },
  'game.continue': { en: '🏠 Continue', he: '🏠 המשך' },
  'game.saving': { en: '⚡ Saving...', he: '⚡ שומר...' },
  'game.perfect': { en: 'PERFECT!', he: 'מושלם!' },
  'game.great': { en: 'Great Job!', he: 'כל הכבוד!' },
  'game.keep': { en: 'Keep Going!', he: 'המשך להתאמן!' },
  'game.what': { en: 'What is this? 🤔', he: 'מה זה? 🤔' },
  'game.spell': { en: 'Spell this word:', he: 'אייתו את המילה:' },
  'game.build': { en: 'Build the Sentence!', he: 'בנה את המשפט!' },
  'game.listen': { en: 'Tap to listen again 👂', he: 'לחץ לשמוע שוב 👂' },
  'game.answer': { en: 'Answer:', he: 'תשובה:' },
  
  // Language
  'lang.switch': { en: 'עברית', he: 'English' },
};

export function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] || key;
}

export function isRTL(lang: Lang): boolean {
  return lang === 'he';
}