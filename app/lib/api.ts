import { supabase } from './supabase';

// ─── AUTH ───
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// ─── PROFILE ───
export async function createProfile(userId: string, profile: {
  nickname: string; email: string; birthDate: string; track: string; referralCode: string;
}) {
  const { data, error } = await supabase.from('profiles').insert({
    id: userId, nickname: profile.nickname, email: profile.email,
    birth_date: profile.birthDate, track: profile.track, referral_code: profile.referralCode,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
  if (error) throw error;
  return data;
}

// ─── GAME ACTIONS ───
export async function completeGame(userId: string, xpEarned: number, lingosEarned: number, ticketBonus = 0) {
  const { error } = await supabase.rpc('complete_game', {
    user_id: userId, xp_earned: xpEarned, lingos_earned: lingosEarned, ticket_bonus: ticketBonus,
  });
  if (error) throw error;
}

export async function completeQuest(userId: string, islandId: string, xpReward: number, lingosReward: number) {
  const { error } = await supabase.rpc('complete_quest', {
    user_id: userId, island_id: islandId, xp_reward: xpReward, lingos_reward: lingosReward,
  });
  if (error) throw error;
}

export async function recordArena(userId: string, won: boolean) {
  const { error } = await supabase.rpc('record_arena', { user_id: userId, won });
  if (error) throw error;
}

export async function buyItem(userId: string, itemId: string, price: number, type: string) {
  const { data, error } = await supabase.rpc('buy_item', {
    user_id: userId, item_id: itemId, item_price: price, item_type: type,
  });
  if (error) throw error;
  return data;
}

export async function processReferral(newUserId: string, referralCode: string) {
  const { error } = await supabase.rpc('process_referral', {
    new_user_id: newUserId, referral_code_input: referralCode,
  });
  if (error) throw error;
}

// ─── LEADERBOARD ───
export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase.from('leaderboard').select('*').limit(limit);
  if (error) throw error;
  return data;
}

// ─── HELPERS ───
export function generateReferralCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function calculateTrack(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  if (age >= 5 && age <= 7) return 'explorers';
  if (age >= 8 && age <= 11) return 'voyagers';
  if (age >= 12 && age <= 14) return 'masters';
  return null;
}
