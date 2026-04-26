'use client';
import { useState, useEffect, useRef } from 'react';
import { sounds } from '../lib/sounds';
import { t, Lang } from '../lib/i18n';
import { supabase } from '../lib/supabase';
import WorldMap from './WorldMap';
import WordMatchGame from './WordMatchGame';
import SpellingGame from './SpellingGame';
import SentenceGame from './SentenceGame';
import ListeningGame from './ListeningGame';
import ArenaGame from './ArenaGame';
import DragMatchGame from './DragMatchGame';
import MultiplayerGame from './MultiplayerGame';
import Shop from './Shop';
import Leaderboard from './Leaderboard';
import Tournament from './Tournament';
import StoryGame from './StoryGame';
import ProfileCard from './ProfileCard';
import Tutorial from './Tutorial';
import AIGame from './AIGame';
import ParentalGate from './ParentalGate';
import PremiumPage from './PremiumPage';
import Paywall from './Paywall';
import OfflineBanner from './OfflineBanner';

const TRACKS: any = {
  explorers: { name: 'Explorers', nameHe: 'חוקרים', emoji: '🧭', color: '#22c55e' },
  voyagers: { name: 'Voyagers', nameHe: 'מגלים', emoji: '🚀', color: '#6366f1' },
  masters: { name: 'Masters', nameHe: 'מומחים', emoji: '👑', color: '#f59e0b' },
};

const SHOP_EMOJI: Record<string, string> = {
  skin_blue: '🔵', skin_fire: '🔴', skin_gold: '🟡', skin_purple: '🟣',
  hat_crown: '👑', hat_wizard: '🧙', hat_cap: '🧢', hat_pirate: '🏴‍☠️',
  pet_cat: '🐱', pet_dog: '🐶', pet_dragon: '🐉', pet_owl: '🦉',
};

const SKIN_COLORS: Record<string, string> = {
  skin_blue: '#3b82f6', skin_fire: '#ef4444', skin_gold: '#f59e0b', skin_purple: '#8b5cf6',
};

const DAILY_QUESTS = [
  { id: 'play3', titleHe: 'שחק 3 משחקים', titleEn: 'Play 3 games', target: 3, field: 'games_played', reward: 100, emoji: '🎮' },
  { id: 'win1', titleHe: 'נצח בזירה', titleEn: 'Win in Arena', target: 1, field: 'arena_wins', reward: 150, emoji: '⚔️' },
  { id: 'spell5', titleHe: 'שחק 5 משחקים', titleEn: 'Play 5 games', target: 5, field: 'games_played', reward: 200, emoji: '🐝' },
];

const ACHIEVEMENTS = [
  { id: 'first_game', emoji: '🎯', titleHe: 'משחק ראשון', titleEn: 'First Game', check: (p: any) => p.games_played >= 1 },
  { id: 'ten_games', emoji: '🔟', titleHe: '10 משחקים', titleEn: '10 Games', check: (p: any) => p.games_played >= 10 },
  { id: 'first_win', emoji: '🏆', titleHe: 'ניצחון ראשון', titleEn: 'First Win', check: (p: any) => p.arena_wins >= 1 },
  { id: 'five_wins', emoji: '⚔️', titleHe: '5 ניצחונות', titleEn: '5 Wins', check: (p: any) => p.arena_wins >= 5 },
  { id: 'level5', emoji: '⭐', titleHe: 'רמה 5', titleEn: 'Level 5', check: (p: any) => p.level >= 5 },
  { id: 'level10', emoji: '🌟', titleHe: 'רמה 10', titleEn: 'Level 10', check: (p: any) => p.level >= 10 },
  { id: 'rich', emoji: '💰', titleHe: '1000 מטבעות', titleEn: '1000 Lingos', check: (p: any) => p.lingos >= 1000 },
  { id: 'shopper', emoji: '🛍️', titleHe: '3 פריטים', titleEn: '3 Items', check: (p: any) => (p.inventory || []).length >= 3 },
  { id: 'inviter', emoji: '🤝', titleHe: 'הזמן חבר', titleEn: 'Invite Friend', check: (p: any) => p.referral_count >= 1 },
];

export default function Dashboard({ profile, userId, refreshProfile, onLogout, lang, setLang }: any) {
  const [tab, setTab] = useState('home');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(profile.level);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [showXPPopup, setShowXPPopup] = useState<number | null>(null);
  const [invite, setInvite] = useState<any>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [announcement, setAnnouncement] = useState<any>(null);
  const [parentalGate, setParentalGate] = useState<{ action: string; callback: () => void } | null>(null);
  const [showPremium, setShowPremium] = useState(false);
  const [showPaywall, setShowPaywall] = useState<string | null>(null);
  const inviteChannelRef = useRef<any>(null);
  const track = TRACKS[profile.track] || TRACKS.explorers;
  const xpToNext = profile.level * 100;
  const xpPct = Math.min((profile.xp / xpToNext) * 100, 100);
  const isHe = lang === 'he';

  const equipped = profile.equipped || {};
  const avatarColor = equipped.skin ? (SKIN_COLORS[equipped.skin] || track.color) : track.color;

  const AVATAR_MAP: Record<string, string> = { default: track.emoji, ninja: '🥷', astronaut: '👩‍🚀', pirate: '🏴‍☠️', fairy: '🧚', robot: '🤖', wizard: '🧙‍♂️', superhero: '🦸', dragon: '🐲', alien: '👽', princess: '👸', knight: '🛡️' };
  const avatarEmoji = equipped.pet ? (SHOP_EMOJI[equipped.pet] || '🐾') : AVATAR_MAP[equipped.avatar || 'default'] || track.emoji;

  // Premium status
  const isPremium = profile.is_premium === true;
  const trialEnd = profile.trial_end ? new Date(profile.trial_end) : null;
  const trialActive = trialEnd && trialEnd > new Date();
  const premiumExpires = profile.premium_expires ? new Date(profile.premium_expires) : null;
  const premiumActive = isPremium && (!premiumExpires || premiumExpires > new Date() || trialActive);

  // Free user limits
  const FREE_DAILY_GAMES = 3;
  const FREE_MAX_LEVEL = 5;
  const FREE_AI_CHATS = 3;

  const checkCanPlay = (gameType: string): boolean => {
    if (premiumActive) return true;
    // Free users: limited games per day
    const today = new Date().toDateString();
    const gamestoday = profile.last_game_date === today ? (profile.daily_games_today || 0) : 0;
    if (gamestoday >= FREE_DAILY_GAMES) {
      setShowPaywall(`הגעת למגבלת ${FREE_DAILY_GAMES} משחקים ביום!`);
      return false;
    }
    // Free users: limited game types
    if (['sentence', 'listening', 'drag-match'].includes(gameType)) {
      setShowPaywall('משחק זה זמין רק למשתמשי Premium!');
      return false;
    }
    // Free users: can't play multiplayer
    if (gameType === 'multi') {
      setShowPaywall('מולטיפלייר זמין רק למשתמשי Premium!');
      return false;
    }
    return true;
  };

  const trackGamePlayed = async () => {
    const today = new Date().toDateString();
    const gamesToday = profile.last_game_date === today ? (profile.daily_games_today || 0) + 1 : 1;
    await supabase.from('profiles').update({ daily_games_today: gamesToday, last_game_date: today }).eq('id', userId);
  };

  const referralLink = `https://lingoquest-75vj.onrender.com/?ref=${profile.referral_code}`;
  const shareText = isHe
    ? `🎮 היי! אני משחק ב-LingoQuest - משחק מגניב ללימוד אנגלית!\n\n🎁 הצטרף דרך הלינק שלי וקבל 200 מטבעות בונוס בחינם!\n\n🌟 ${referralLink}\n\n⭐ גם אני מקבל בונוס כשאתה מצטרף!`
    : `🎮 Hey! Join LingoQuest and get 200 bonus Lingos!\n\n🌟 ${referralLink}`;
  const whatsappMsg = encodeURIComponent(shareText);
  const [copied, setCopied] = useState(false);

  // Level up detection
  useEffect(() => {
    if (profile.level > prevLevel) {
      setShowLevelUp(true); sounds.levelUp();
      setTimeout(() => setShowLevelUp(false), 3000);
    }
    setPrevLevel(profile.level);
  }, [profile.level]);

  // Daily streak
  useEffect(() => {
    try {
      const today = new Date().toDateString();
      const stored = localStorage.getItem('lq_last_play');
      const streak = parseInt(localStorage.getItem('lq_streak') || '0');
      if (stored === today) { setDailyStreak(streak); }
      else {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = stored === yesterday ? streak + 1 : 1;
        localStorage.setItem('lq_streak', String(newStreak));
        localStorage.setItem('lq_last_play', today);
        setDailyStreak(newStreak);
      }
    } catch (_) {}
  }, []);

  // Check announcements
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0) {
          const lastSeen = localStorage.getItem('lq_last_announcement');
          if (lastSeen !== data[0].id) { setAnnouncement(data[0]); }
        }
      } catch (_) {}
    })();
  }, []);

  // Listen for game invites
  useEffect(() => {
    const channel = supabase
      .channel(`invites-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_invites', filter: `to_id=eq.${userId}` },
        (payload: any) => {
          if (payload.new && payload.new.status === 'pending') {
            setInvite(payload.new);
            sounds.streak();
          }
        })
      .subscribe();
    inviteChannelRef.current = channel;

    // Also poll for invites
    const pollInvites = setInterval(async () => {
      try {
        const { data } = await supabase.from('game_invites').select('*').eq('to_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0 && !invite) { setInvite(data[0]); sounds.streak(); }
      } catch (_) {}
    }, 5000);

    return () => { supabase.removeChannel(channel); clearInterval(pollInvites); };
  }, [userId]);

  const acceptInvite = async () => {
    if (!invite) return;
    await supabase.from('game_invites').update({ status: 'accepted' }).eq('id', invite.id);
    setInvite(null);
    sounds.gameStart();
    setTab('multi');
  };

  const declineInvite = async () => {
    if (!invite) return;
    await supabase.from('game_invites').update({ status: 'declined' }).eq('id', invite.id);
    setInvite(null);
    sounds.tap();
  };

  const NAV_ITEMS = [
    { id: 'home', icon: '🏠', label: t('nav.home', lang) },
    { id: 'map', icon: '🗺️', label: t('nav.map', lang) },
    { id: 'arena', icon: '⚔️', label: isHe ? 'זירה' : 'Arena' },
    { id: 'multi', icon: '🌐', label: isHe ? 'מולטי' : 'Multi' },
    { id: 'trophy', icon: '🏆', label: isHe ? 'טורניר' : 'Cup' },
    { id: 'shop', icon: '🛒', label: t('nav.shop', lang) },
    { id: 'board', icon: '📊', label: isHe ? 'דירוג' : 'Rank' },
  ];

  const onGameFinish = async () => {
    setActiveGame(null);
    await trackGamePlayed();
    await refreshProfile();
  };

  if (activeGame) {
    const gameProps = { profile, userId, onFinish: onGameFinish };
    switch (activeGame) {
      case 'word-match': return <WordMatchGame {...gameProps} />;
      case 'spelling': return <SpellingGame {...gameProps} />;
      case 'sentence': return <SentenceGame {...gameProps} />;
      case 'listening': return <ListeningGame {...gameProps} />;
      case 'arena': return <ArenaGame {...gameProps} />;
      case 'drag-match': return <DragMatchGame {...gameProps} />;
      case 'story': return <StoryGame {...gameProps} />;
      case 'ai-chat': return <AIGame {...gameProps} />;
      default: return <WordMatchGame {...gameProps} />;
    }
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(profile));
  const lockedAchievements = ACHIEVEMENTS.filter(a => !a.check(profile));

  return (
    <div style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', minHeight: '100vh' }}>
      <OfflineBanner />
      {/* Level Up */}
      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-7xl mb-3">🎉</div>
            <div className="text-3xl font-black text-white mb-1">LEVEL UP!</div>
            <div className="text-5xl font-black" style={{ color: '#fbbf24' }}>{profile.level}</div>
          </div>
        </div>
      )}

      {/* Invite Popup */}
      {invite && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: '#1e1b4b', border: '2px solid #6366f1' }} dir="rtl">
            <div className="text-5xl mb-3 animate-bounce">⚔️</div>
            <h3 className="text-xl font-black text-white mb-2">הזמנה למשחק!</h3>
            <p className="text-sm text-indigo-300 mb-5">{invite.from_name} מאתגר אותך!</p>
            <div className="flex gap-2">
              <button onClick={acceptInvite}
                className="flex-1 py-3 rounded-xl text-white font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}>✅ קבל!</button>
              <button onClick={declineInvite}
                className="flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>❌ דחה</button>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowAchievements(false)}>
          <div className="w-full max-w-md rounded-3xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)' }} dir="rtl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-black text-white mb-4">🎖️ {isHe ? 'הישגים' : 'Achievements'} ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</h3>
            <div className="space-y-2">
              {ACHIEVEMENTS.map(a => {
                const done = a.check(profile);
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${done ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`, opacity: done ? 1 : 0.5 }}>
                    <span className="text-2xl">{a.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white">{isHe ? a.titleHe : a.titleEn}</div>
                    </div>
                    <span className="text-lg">{done ? '✅' : '🔒'}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowAchievements(false)} className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>סגור</button>
          </div>
        </div>
      )}

      {/* Parental Gate */}
      {parentalGate && (
        <ParentalGate action={parentalGate.action} onPass={() => { parentalGate.callback(); setParentalGate(null); }} onCancel={() => setParentalGate(null)} />
      )}

      {/* Announcement Popup */}
      {announcement && (
        <div className="fixed inset-0 flex items-center justify-center px-4 z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: '#1e1b4b', border: '2px solid #6366f1' }} dir="rtl">
            <img src="/icon-192.png" alt="LingoQuest" className="w-12 h-12 rounded-xl mx-auto mb-2" />
            <div className="text-3xl mb-2">{announcement.emoji || '📢'}</div>
            <h3 className="text-xl font-black text-white mb-2">{announcement.title}</h3>
            <p className="text-sm text-slate-300 mb-5 whitespace-pre-line">{announcement.message}</p>
            <button onClick={() => { localStorage.setItem('lq_last_announcement', announcement.id); setAnnouncement(null); sounds.tap(); }}
              className="w-full py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>👍 הבנתי!</button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfile && <ProfileCard profile={profile} userId={userId} refreshProfile={refreshProfile} onClose={() => setShowProfile(false)} />}

      {/* Premium Page */}
      {showPremium && <PremiumPage profile={profile} userId={userId} onClose={() => setShowPremium(false)} refreshProfile={refreshProfile} />}

      {/* Paywall */}
      {showPaywall && <Paywall reason={showPaywall} onUpgrade={() => { setShowPaywall(null); setShowPremium(true); }} onClose={() => setShowPaywall(null)} />}

      {/* Tutorial Modal */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}

      {/* Top Bar */}
      <div className="px-4 pt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <img src="/icon-192.png" alt="LQ" className="w-7 h-7 rounded-lg" />
          <button onClick={() => { sounds.tap(); setLang(isHe ? 'en' : 'he'); }}
            className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#a5b4fc' }}>
            {t('lang.switch', lang)}
          </button>
          <button onClick={() => { sounds.mystery(); setShowTutorial(true); }}
            className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>
            ❓
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => { sounds.tap(); setShowPremium(true); }}
            className="text-[10px] px-2 py-1 rounded-lg font-bold"
            style={{ background: premiumActive ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(245,158,11,0.2))', color: premiumActive ? '#34d399' : '#fbbf24' }}>
            {premiumActive ? '⭐' : '⭐ שדרג'}
          </button>
          <button onClick={() => { sounds.tap(); setShowProfile(true); }}
            className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>🪪</button>
          <button onClick={() => setParentalGate({ action: isHe ? 'התנתקות' : 'logout', callback: onLogout })} className="text-[10px] px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#64748b' }}>🚪</button>
        </div>
      </div>

      {tab === 'home' && (
        <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir={isHe ? 'rtl' : 'ltr'}>
          {/* Profile */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="relative cursor-pointer" onClick={() => { sounds.tap(); setShowProfile(true); }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-105" style={{ background: `${avatarColor}30`, border: `3px solid ${avatarColor}`, boxShadow: `0 0 20px ${avatarColor}30` }}>
                  {avatarEmoji}
                </div>
                {equipped.hat && <span className="absolute -top-3 -right-1 text-xl">{SHOP_EMOJI[equipped.hat]}</span>}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{profile.nickname} {premiumActive && <span className="text-xs align-middle" style={{ color: '#fbbf24' }}>⭐</span>}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${track.color}25`, color: track.color }}>{track.emoji} {isHe ? track.nameHe : track.name}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">{t('dash.level', lang)}</div>
              <div className="text-2xl font-black text-white">{profile.level}</div>
            </div>
          </div>

          {/* Streak */}
          {dailyStreak > 0 && (
            <div className="rounded-2xl p-3 mb-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-3xl">🔥</div>
              <div className="flex-1">
                <div className="text-sm font-black text-white">{dailyStreak} {isHe ? 'ימים ברצף!' : 'Day Streak!'}</div>
                <div className="text-xs text-slate-400">{isHe ? 'תמשיך כל יום!' : 'Keep it up!'}</div>
              </div>
            </div>
          )}

          {/* XP */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-indigo-300">{t('dash.level', lang)} {profile.level}</span>
              <span className="text-xs text-slate-400">{profile.xp}/{xpToNext} XP</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg,${avatarColor},${avatarColor}aa)` }} />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[{ label: '⭐', value: profile.xp }, { label: '💰', value: profile.lingos }, { label: '🎫', value: profile.tickets }].map((s, i) => (
              <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-xl">{s.label}</div>
                <div className="text-lg font-black text-white">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Play */}
          <button onClick={() => { sounds.click(); setTab('map'); }}
            className="w-full py-5 rounded-2xl text-white font-black text-xl mb-4 transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 25px rgba(34,197,94,0.4)' }}>
            {t('dash.play', lang)}
          </button>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <button onClick={() => { sounds.tap(); setTab('multi'); }}
              className="rounded-xl p-3 text-center transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(99,102,241,0.15))', border: '1px solid rgba(139,92,246,0.3)' }}>
              <div className="text-2xl mb-1">🌐</div>
              <div className="text-xs font-bold text-white">{isHe ? 'מולטיפלייר' : 'Multiplayer'}</div>
            </button>
            <button onClick={() => { sounds.tap(); setTab('trophy'); }}
              className="rounded-xl p-3 text-center transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.3)' }}>
              <div className="text-2xl mb-1">🏆</div>
              <div className="text-xs font-bold text-white">{isHe ? 'טורנירים' : 'Tournaments'}</div>
            </button>
          </div>

          {/* Story Adventures Quick Action */}
          <button onClick={() => { sounds.mystery(); setActiveGame('story'); }}
            className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(236,72,153,0.1))', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div className="text-3xl">📖</div>
            <div className="flex-1 text-right">
              <div className="text-sm font-bold text-white">{isHe ? 'הרפתקאות וסיפורים' : 'Story Adventures'}</div>
              <div className="text-xs text-slate-400">{isHe ? 'למד אנגלית דרך סיפורים מרתקים!' : 'Learn through exciting stories!'}</div>
            </div>
            <span className="text-xl">▶</span>
          </button>

          {/* AI Chat Quick Action */}
          <button onClick={() => { sounds.gameStart(); setActiveGame('ai-chat'); }}
            className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(99,102,241,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="text-3xl">🤖</div>
            <div className="flex-1 text-right">
              <div className="text-sm font-bold text-white">{isHe ? 'שיחה עם AI באנגלית!' : 'AI English Chat!'}</div>
              <div className="text-xs text-slate-400">{isHe ? 'תרגל שיחה חופשית עם רובוט חכם' : 'Practice free conversation with AI'}</div>
            </div>
            <span className="text-xl animate-pulse">🔥</span>
          </button>

          {/* Daily Quests */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="text-xs font-bold mb-3 text-indigo-300">📋 {isHe ? 'משימות יומיות' : 'Daily Quests'}</div>
            <div className="space-y-2">
              {DAILY_QUESTS.map(quest => {
                const progress = Math.min((profile[quest.field] || 0), quest.target);
                const done = progress >= quest.target;
                return (
                  <div key={quest.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' }}>
                    <span className="text-xl">{quest.emoji}</span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white">{isHe ? quest.titleHe : quest.titleEn}</div>
                      <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                        <div className="h-full rounded-full" style={{ width: `${(progress / quest.target) * 100}%`, background: done ? '#22c55e' : '#6366f1' }} />
                      </div>
                    </div>
                    <span className="text-xs font-bold" style={{ color: done ? '#34d399' : '#94a3b8' }}>{done ? '✅' : `${progress}/${quest.target}`}</span>
                    <span className="text-xs" style={{ color: '#fbbf24' }}>💰{quest.reward}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievements */}
          <button onClick={() => { sounds.tap(); setShowAchievements(true); }}
            className="w-full rounded-2xl p-4 mb-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-2xl">🎖️</span>
            <div className="flex-1 text-right">
              <div className="text-sm font-bold text-white">{isHe ? 'הישגים' : 'Achievements'}</div>
              <div className="text-xs text-slate-400">{unlockedAchievements.length}/{ACHIEVEMENTS.length} {isHe ? 'הושלמו' : 'completed'}</div>
            </div>
            <div className="flex -space-x-1">
              {unlockedAchievements.slice(0, 5).map(a => <span key={a.id} className="text-lg">{a.emoji}</span>)}
            </div>
          </button>

          {/* Stats */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-black text-white">{profile.games_played}</div><div className="text-[10px] text-slate-400">{isHe ? 'משחקים' : 'Games'}</div></div>
              <div><div className="text-lg font-black text-white">{profile.arena_wins}</div><div className="text-[10px] text-slate-400">{isHe ? 'ניצחונות' : 'Wins'}</div></div>
              <div><div className="text-lg font-black text-white">{(profile.inventory || []).length}</div><div className="text-[10px] text-slate-400">{isHe ? 'פריטים' : 'Items'}</div></div>
            </div>
          </div>

          {/* Invite */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(99,102,241,0.1))', border: '1px solid rgba(34,197,94,0.2)' }}>
            <h3 className="text-sm font-black text-white mb-1">{t('dash.invite_title', lang)}</h3>
            <p className="text-xs text-slate-400 mb-3">{profile.referral_count} {t('dash.invited', lang)}</p>
            <div className="flex gap-2">
              <button onClick={() => {
                setParentalGate({ action: isHe ? 'שיתוף עם חברים' : 'share with friends', callback: async () => {
                  try {
                    if (navigator.share) { await navigator.share({ title: 'LingoQuest', text: shareText, url: referralLink }); }
                    else { window.open(`https://wa.me/?text=${whatsappMsg}`, '_blank'); }
                  } catch (_) {}
                  sounds.coin();
                }});
              }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', minHeight: 48 }}>📤 {isHe ? 'הזמן חברים' : 'Invite Friends'}</button>
              <button onClick={() => { navigator.clipboard.writeText(shareText).catch(() => {}); setCopied(true); sounds.coin(); setTimeout(() => setCopied(false), 2000); }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#34d399' : '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', minHeight: 48 }}>
                {copied ? '✅' : '📋'}
              </button>
            </div>
          </div>

          {/* Privacy Policy Link */}
          <div className="text-center mt-4">
            <button onClick={() => setParentalGate({ action: isHe ? 'צפייה במדיניות פרטיות' : 'view privacy policy', callback: () => window.open('/privacy', '_blank') })}
              className="text-[10px] text-slate-600 hover:text-slate-400">🔒 {isHe ? 'מדיניות פרטיות' : 'Privacy Policy'}</button>
          </div>
        </div>
      )}

      {tab === 'map' && <WorldMap profile={profile} onSelectGame={(game) => { if (checkCanPlay(game)) { sounds.gameStart(); setActiveGame(game); } }} />}
      {tab === 'arena' && <ArenaGame profile={profile} userId={userId} onFinish={async () => { setTab('home'); await refreshProfile(); }} />}
      {tab === 'multi' && premiumActive && <MultiplayerGame profile={profile} userId={userId} onFinish={async () => { setTab('home'); await refreshProfile(); }} />}
      {tab === 'multi' && !premiumActive && <div className="px-4 py-20 text-center" dir="rtl"><div className="text-5xl mb-4">🔒</div><h3 className="text-lg font-black text-white mb-2">מולטיפלייר זמין ב-Premium</h3><p className="text-xs text-slate-400 mb-5">שחק מול חברים אמיתיים בזמן אמת!</p><button onClick={() => setShowPremium(true)} className="px-8 py-3 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>⭐ שדרג עכשיו</button></div>}
      {tab === 'trophy' && <Tournament profile={profile} userId={userId} onPlay={() => { setTab('multi'); }} />}
      {tab === 'shop' && <Shop profile={profile} userId={userId} refreshProfile={refreshProfile} />}
      {tab === 'board' && <Leaderboard profile={profile} userId={userId} onChallenge={(player) => { sounds.gameStart(); setTab('multi'); }} />}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-2"
        style={{ background: 'rgba(15,12,41,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 50 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { sounds.tap(); setTab(item.id); }}
            className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-xl transition-all"
            style={{ background: tab === item.id ? 'rgba(99,102,241,0.2)' : 'transparent', transform: tab === item.id ? 'scale(1.1)' : 'scale(1)' }}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-[8px] font-bold" style={{ color: tab === item.id ? '#a5b4fc' : '#64748b' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}