'use client';
import { useState } from 'react';
import { sounds } from '../lib/sounds';
import { t, Lang } from '../lib/i18n';
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

export default function Dashboard({ profile, userId, refreshProfile, onLogout, lang, setLang }: any) {
  const [tab, setTab] = useState('home');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const track = TRACKS[profile.track] || TRACKS.explorers;
  const xpToNext = profile.level * 100;
  const xpPct = Math.min((profile.xp / xpToNext) * 100, 100);
  const isHe = lang === 'he';
  const referralLink = `https://lingoquest-75vj.onrender.com/?ref=${profile.referral_code}`;
  const shareTextHe = `🎮 היי! אני משחק ב-LingoQuest - משחק מגניב ללימוד אנגלית!\n\n🎁 הצטרף דרך הלינק שלי וקבל 200 מטבעות בונוס בחינם!\n\n🌟 ${referralLink}\n\n⭐ גם אני מקבל בונוס כשאתה מצטרף - בוא נשחק ביחד!`;
  const shareTextEn = `🎮 Hey! I'm playing LingoQuest - an awesome game to learn English!\n\n🎁 Join with my link and get 200 bonus Lingos for FREE!\n\n🌟 ${referralLink}\n\n⭐ I also get a bonus when you join - let's play together!`;
  const shareText = isHe ? shareTextHe : shareTextEn;
  const whatsappMsg = encodeURIComponent(shareText);
  const [copied, setCopied] = useState(false);

  // Get equipped items
  const equipped = profile.equipped || {};
  const equippedSkin = equipped.skin;
  const equippedHat = equipped.hat;
  const equippedPet = equipped.pet;
  const avatarColor = equippedSkin ? (SKIN_COLORS[equippedSkin] || track.color) : track.color;

  const NAV_ITEMS = [
    { id: 'home', icon: '🏠', label: t('nav.home', lang) },
    { id: 'map', icon: '🗺️', label: t('nav.map', lang) },
    { id: 'arena', icon: '⚔️', label: t('nav.arena', lang) },
    { id: 'multi', icon: '🌐', label: isHe ? 'מולטי' : 'Multi' },
    { id: 'shop', icon: '🛒', label: t('nav.shop', lang) },
    { id: 'board', icon: '🏆', label: t('nav.board', lang) },
  ];

  if (activeGame) {
    const gameProps = { profile, userId, onFinish: async () => { setActiveGame(null); await refreshProfile(); } };
    switch (activeGame) {
      case 'word-match': return <WordMatchGame {...gameProps} />;
      case 'spelling': return <SpellingGame {...gameProps} />;
      case 'sentence': return <SentenceGame {...gameProps} />;
      case 'listening': return <ListeningGame {...gameProps} />;
      case 'arena': return <ArenaGame {...gameProps} />;
      case 'drag-match': return <DragMatchGame {...gameProps} />;
      default: return <WordMatchGame {...gameProps} />;
    }
  }

  return (
    <div style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)', minHeight: '100vh' }}>
      <div className="flex justify-between px-4 pt-3">
        <button onClick={() => { sounds.tap(); setLang(isHe ? 'en' : 'he'); }}
          className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: '#a5b4fc' }}>
          {t('lang.switch', lang)}
        </button>
        <button onClick={onLogout} className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#64748b' }}>{t('dash.logout', lang)}</button>
      </div>

      {tab === 'home' && (
        <div className="px-4 py-5 pb-24 max-w-lg mx-auto" dir={isHe ? 'rtl' : 'ltr'}>
          {/* Avatar + Profile */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Avatar with equipped items */}
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: `${avatarColor}30`, border: `3px solid ${avatarColor}`, boxShadow: `0 0 20px ${avatarColor}30` }}>
                  {equippedPet ? SHOP_EMOJI[equippedPet] : track.emoji}
                </div>
                {equippedHat && <span className="absolute -top-3 -right-1 text-xl">{SHOP_EMOJI[equippedHat]}</span>}
                {equippedSkin && <span className="absolute -bottom-1 -left-1 text-sm">{SHOP_EMOJI[equippedSkin]}</span>}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{profile.nickname}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${track.color}25`, color: track.color }}>
                  {track.emoji} {isHe ? track.nameHe : track.name}
                </span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400">{t('dash.level', lang)}</div>
              <div className="text-2xl font-black text-white">{profile.level}</div>
            </div>
          </div>

          {/* XP Bar */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-bold text-indigo-300">{t('dash.level', lang)} {profile.level}</span>
              <span className="text-xs text-slate-400">{profile.xp}/{xpToNext} XP</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${xpPct}%`, background: `linear-gradient(90deg,${avatarColor},${avatarColor}aa)` }} />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {[{ label: t('dash.stars', lang), value: profile.xp, icon: '⭐' }, { label: t('dash.lingos', lang), value: profile.lingos, icon: '💰' }, { label: t('dash.tickets', lang), value: profile.tickets, icon: '🎫' }].map(s => (
              <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-xl">{s.icon}</div>
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[10px] text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Play Button */}
          <button onClick={() => { sounds.click(); setTab('map'); }}
            className="w-full py-5 rounded-2xl text-white font-black text-xl tracking-wide mb-4 transition-all hover:scale-[1.02] active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 25px rgba(34,197,94,0.4)' }}>
            {t('dash.play', lang)}
          </button>

          {/* Stats */}
          <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-xs font-bold mb-2 text-indigo-300">📊 {t('dash.stats', lang)}</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="text-lg font-black text-white">{profile.games_played}</div><div className="text-[10px] text-slate-400">{t('dash.games', lang)}</div></div>
              <div><div className="text-lg font-black text-white">{profile.arena_wins}</div><div className="text-[10px] text-slate-400">{t('dash.wins', lang)}</div></div>
              <div><div className="text-lg font-black text-white">{(profile.inventory || []).length}</div><div className="text-[10px] text-slate-400">{t('dash.items', lang)}</div></div>
            </div>
          </div>

          {/* Equipped Items Display */}
          {(equippedSkin || equippedHat || equippedPet) && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xs font-bold mb-2 text-indigo-300">🎒 {isHe ? 'פריטים מצוידים' : 'Equipped Items'}</div>
              <div className="flex gap-3 justify-center">
                {equippedSkin && <div className="text-center"><div className="text-2xl">{SHOP_EMOJI[equippedSkin]}</div><div className="text-[10px] text-slate-400">{isHe ? 'צבע' : 'Skin'}</div></div>}
                {equippedHat && <div className="text-center"><div className="text-2xl">{SHOP_EMOJI[equippedHat]}</div><div className="text-[10px] text-slate-400">{isHe ? 'כובע' : 'Hat'}</div></div>}
                {equippedPet && <div className="text-center"><div className="text-2xl">{SHOP_EMOJI[equippedPet]}</div><div className="text-[10px] text-slate-400">{isHe ? 'חיה' : 'Pet'}</div></div>}
              </div>
            </div>
          )}

          {/* Invite */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(99,102,241,0.1))', border: '1px solid rgba(34,197,94,0.2)' }}>
            <h3 className="text-sm font-black text-white mb-1">{t('dash.invite_title', lang)}</h3>
            <p className="text-xs text-slate-400 mb-3">{profile.referral_count} {t('dash.invited', lang)}</p>
            <div className="flex gap-2">
              <a href={`https://wa.me/?text=${whatsappMsg}`} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-white text-sm"
                style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>📱 WhatsApp</a>
              <button onClick={() => { navigator.clipboard.writeText(shareText).catch(() => {}); setCopied(true); sounds.coin(); setTimeout(() => setCopied(false), 2000); }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.05)', color: copied ? '#34d399' : '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }}>
                {copied ? '✅' : '📋'} Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'map' && <WorldMap profile={profile} onSelectGame={(game) => { sounds.gameStart(); setActiveGame(game); }} />}
      {tab === 'arena' && <ArenaGame profile={profile} userId={userId} onFinish={async () => { setTab('home'); await refreshProfile(); }} />}
      {tab === 'multi' && <MultiplayerGame profile={profile} userId={userId} onFinish={async () => { setTab('home'); await refreshProfile(); }} />}
      {tab === 'shop' && <Shop profile={profile} userId={userId} refreshProfile={refreshProfile} />}
      {tab === 'board' && <Leaderboard profile={profile} userId={userId} onChallenge={(player) => { sounds.gameStart(); setTab('multi'); }} />}

      <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-2 px-1"
        style={{ background: 'rgba(15,12,41,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', zIndex: 50 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { sounds.tap(); setTab(item.id); }}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
            style={{ background: tab === item.id ? 'rgba(99,102,241,0.2)' : 'transparent', transform: tab === item.id ? 'scale(1.1)' : 'scale(1)' }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold" style={{ color: tab === item.id ? '#a5b4fc' : '#64748b' }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}