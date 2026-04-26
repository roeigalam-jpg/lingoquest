'use client';
import { useState, useEffect } from 'react';
import { completeGame } from '../lib/api';
import { sounds } from '../lib/sounds';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a;
}

interface StoryNode {
  id: string; character: string; characterEmoji: string; textHe: string; textEn: string;
  type: 'dialog' | 'question' | 'reward' | 'ending';
  question?: { word: string; wordHe: string; options: string[]; hint: string };
  choices?: Array<{ label: string; labelHe: string; next: string }>;
  next?: string; reward?: { xp: number; lingos: number };
}

const STORIES: Record<string, { title: string; titleHe: string; emoji: string; nodes: Record<string, StoryNode> }> = {
  lost_pet: {
    title: 'The Lost Pet', titleHe: 'חיית המחמד האבודה', emoji: '🐾',
    nodes: {
      start: { id: 'start', character: 'Luna', characterEmoji: '👧', textHe: 'שלום! אני לונה. חיית המחמד שלי נעלמה! תעזור לי למצוא אותה?', textEn: 'Hi! I\'m Luna. My pet disappeared! Help me?', type: 'dialog', choices: [{ label: 'Yes!', labelHe: 'כן!', next: 'q1' }, { label: 'What pet?', labelHe: 'איזו חיה?', next: 'what_pet' }] },
      what_pet: { id: 'what_pet', character: 'Luna', characterEmoji: '👧', textHe: 'חתולה בשם Whiskers. היא אוהבת עצים!', textEn: 'A cat named Whiskers. She loves trees!', type: 'dialog', next: 'q1' },
      q1: { id: 'q1', character: 'Luna', characterEmoji: '👧', textHe: 'ראיתי אותה ליד ה... 🌳', textEn: 'I saw her near the... 🌳', type: 'question', question: { word: 'Tree', wordHe: 'עץ', options: ['Tree', 'House', 'Car', 'Door'], hint: '🌳 Tall and green' } },
      q1_correct: { id: 'q1_correct', character: 'Luna', characterEmoji: '👧', textHe: 'נכון! Tree! בואו נלך!', textEn: 'Yes! Tree! Let\'s go!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Luna', characterEmoji: '👧', textHe: 'לא... Tree = עץ. ננסה שוב', textEn: 'No... it\'s Tree!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Ranger Sam', characterEmoji: '🧑‍🌾', textHe: 'שלום! ראיתי חתולה רצה לכיוון ה... 🌉', textEn: 'Hello! A cat ran toward the... 🌉', type: 'question', question: { word: 'Bridge', wordHe: 'גשר', options: ['Bridge', 'Mountain', 'River', 'School'], hint: '🌉 Walk over water' } },
      q2_correct: { id: 'q2_correct', character: 'Ranger Sam', characterEmoji: '🧑‍🌾', textHe: 'Bridge = גשר! היא רצה לשם!', textEn: 'Bridge! She ran there!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Ranger Sam', characterEmoji: '🧑‍🌾', textHe: 'Bridge = גשר. ננסה!', textEn: 'It\'s Bridge!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Old Fisher', characterEmoji: '🧓', textHe: 'ראיתי חתולה אוכלת... 🐟', textEn: 'A cat was eating... 🐟', type: 'question', question: { word: 'Fish', wordHe: 'דג', options: ['Fish', 'Bread', 'Cake', 'Rice'], hint: '🐟 Swims in water' } },
      q3_correct: { id: 'q3_correct', character: 'Old Fisher', characterEmoji: '🧓', textHe: 'Fish = דג! היא רצה ל...', textEn: 'Fish! She ran to...', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Old Fisher', characterEmoji: '🧓', textHe: 'Fish = דג. ננסה!', textEn: 'It\'s Fish!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Luna', characterEmoji: '👧', textHe: 'היא הלכה ל... 🏠', textEn: 'She went to the... 🏠', type: 'question', question: { word: 'House', wordHe: 'בית', options: ['House', 'Store', 'School', 'Park'], hint: '🏠 Where you live' } },
      q4_correct: { id: 'q4_correct', character: 'Luna', characterEmoji: '👧', textHe: 'House = בית! נרוץ!', textEn: 'House! Let\'s run!', type: 'dialog', next: 'q5' },
      q4_wrong: { id: 'q4_wrong', character: 'Luna', characterEmoji: '👧', textHe: 'House = בית!', textEn: 'It\'s House!', type: 'dialog', next: 'q4' },
      q5: { id: 'q5', character: 'Mom', characterEmoji: '👩', textHe: 'Whiskers ישנה על ה... 🛏️', textEn: 'Whiskers sleeping on... 🛏️', type: 'question', question: { word: 'Bed', wordHe: 'מיטה', options: ['Bed', 'Table', 'Chair', 'Floor'], hint: '🛏️ Sleep on it' } },
      q5_correct: { id: 'q5_correct', character: 'Mom', characterEmoji: '👩', textHe: 'Bed = מיטה! מצאנו!', textEn: 'Bed! Found her!', type: 'dialog', next: 'ending' },
      q5_wrong: { id: 'q5_wrong', character: 'Mom', characterEmoji: '👩', textHe: 'Bed = מיטה!', textEn: 'It\'s Bed!', type: 'dialog', next: 'q5' },
      ending: { id: 'ending', character: 'Luna', characterEmoji: '👧', textHe: '🎉 מצאנו את Whiskers! תודה! למדנו: Tree, Bridge, Fish, House, Bed!', textEn: 'We found Whiskers! Thanks!', type: 'ending', reward: { xp: 80, lingos: 50 } },
    },
  },
  treasure_hunt: {
    title: 'Treasure Island', titleHe: 'אי המטמון', emoji: '🏴‍☠️',
    nodes: {
      start: { id: 'start', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'אהוי! אני קפטן רקס! מצאתי מפת מטמון!', textEn: 'Ahoy! I found a treasure map!', type: 'dialog', choices: [{ label: 'Adventure!', labelHe: 'הרפתקה!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'המפה אומרת: לכיוון ה... 🌊', textEn: 'Map says: toward the... 🌊', type: 'question', question: { word: 'Ocean', wordHe: 'אוקיינוס', options: ['Ocean', 'Desert', 'Forest', 'City'], hint: '🌊 Big blue water' } },
      q1_correct: { id: 'q1_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Ocean! מפליגים!', textEn: 'Ocean! Sail!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Ocean = אוקיינוס!', textEn: 'It\'s Ocean!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Parrot Pete', characterEmoji: '🦜', textHe: 'סקוואק! המטמון ב... 🏝️', textEn: 'Squawk! Treasure on... 🏝️', type: 'question', question: { word: 'Island', wordHe: 'אי', options: ['Island', 'Mountain', 'Cave', 'Lake'], hint: '🏝️ Land in water' } },
      q2_correct: { id: 'q2_correct', character: 'Parrot Pete', characterEmoji: '🦜', textHe: 'Island = אי! סקוואק!', textEn: 'Island! Squawk!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Parrot Pete', characterEmoji: '🦜', textHe: 'Island = אי!', textEn: 'It\'s Island!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'חפרו ליד ה... 🌴', textEn: 'Dig near the... 🌴', type: 'question', question: { word: 'Palm', wordHe: 'דקל', options: ['Palm', 'Pine', 'Oak', 'Flower'], hint: '🌴 Tropical tree' } },
      q3_correct: { id: 'q3_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Palm = דקל!', textEn: 'Palm!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Palm = דקל!', textEn: 'It\'s Palm!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'מצאנו תיבה! צריך... 🔑', textEn: 'Found chest! Need... 🔑', type: 'question', question: { word: 'Key', wordHe: 'מפתח', options: ['Key', 'Lock', 'Door', 'Box'], hint: '🔑 Opens locks' } },
      q4_correct: { id: 'q4_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Key = מפתח!', textEn: 'Key!', type: 'dialog', next: 'q5' },
      q4_wrong: { id: 'q4_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Key = מפתח!', textEn: 'It\'s Key!', type: 'dialog', next: 'q4' },
      q5: { id: 'q5', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'בתיבה יש... ✨', textEn: 'Inside... ✨', type: 'question', question: { word: 'Gold', wordHe: 'זהב', options: ['Gold', 'Silver', 'Stone', 'Wood'], hint: '✨ Shiny yellow' } },
      q5_correct: { id: 'q5_correct', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Gold = זהב!', textEn: 'Gold!', type: 'dialog', next: 'ending' },
      q5_wrong: { id: 'q5_wrong', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: 'Gold = זהב!', textEn: 'It\'s Gold!', type: 'dialog', next: 'q5' },
      ending: { id: 'ending', character: 'Captain Rex', characterEmoji: '🏴‍☠️', textHe: '🏴‍☠️ מצאנו מטמון! למדנו: Ocean, Island, Palm, Key, Gold!', textEn: 'Found treasure! You\'re a pirate!', type: 'ending', reward: { xp: 100, lingos: 70 } },
    },
  },
  space_mission: {
    title: 'Space Mission', titleHe: 'משימה בחלל', emoji: '🚀',
    nodes: {
      start: { id: 'start', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'שלום טייס! אני מפקדת זארה. משימה בחלל!', textEn: 'Hello pilot! Space mission!', type: 'dialog', choices: [{ label: 'Ready!', labelHe: 'מוכן!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'נטיס מעבר ל... ⭐', textEn: 'Fly past the... ⭐', type: 'question', question: { word: 'Stars', wordHe: 'כוכבים', options: ['Stars', 'Clouds', 'Birds', 'Trees'], hint: '⭐ Shiny in night sky' } },
      q1_correct: { id: 'q1_correct', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'Stars = כוכבים! המראה!', textEn: 'Stars! Liftoff!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'Stars = כוכבים!', textEn: 'It\'s Stars!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Robot Beep', characterEmoji: '🤖', textHe: 'ביפ! נוחתים על ה... 🌙', textEn: 'Beep! Landing on... 🌙', type: 'question', question: { word: 'Moon', wordHe: 'ירח', options: ['Moon', 'Sun', 'Mars', 'Venus'], hint: '🌙 Earth\'s neighbor' } },
      q2_correct: { id: 'q2_correct', character: 'Robot Beep', characterEmoji: '🤖', textHe: 'Moon = ירח!', textEn: 'Moon!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Robot Beep', characterEmoji: '🤖', textHe: 'Moon = ירח!', textEn: 'It\'s Moon!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Alien Zix', characterEmoji: '👽', textHe: 'שלום! אני זיקס! תביאו... 💎', textEn: 'Hello! Bring me... 💎', type: 'question', question: { word: 'Diamond', wordHe: 'יהלום', options: ['Diamond', 'Rock', 'Glass', 'Ice'], hint: '💎 Precious sparkle' } },
      q3_correct: { id: 'q3_correct', character: 'Alien Zix', characterEmoji: '👽', textHe: 'Diamond = יהלום!', textEn: 'Diamond!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Alien Zix', characterEmoji: '👽', textHe: 'Diamond = יהלום!', textEn: 'It\'s Diamond!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'חוזרים ל... 🌍', textEn: 'Return to... 🌍', type: 'question', question: { word: 'Earth', wordHe: 'כדור הארץ', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], hint: '🌍 Our home' } },
      q4_correct: { id: 'q4_correct', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'Earth! חוזרים!', textEn: 'Earth! Home!', type: 'dialog', next: 'ending' },
      q4_wrong: { id: 'q4_wrong', character: 'Zara', characterEmoji: '👩‍🚀', textHe: 'Earth = כדור הארץ!', textEn: 'It\'s Earth!', type: 'dialog', next: 'q4' },
      ending: { id: 'ending', character: 'Zara', characterEmoji: '👩‍🚀', textHe: '🚀 משימה הושלמה! למדנו: Stars, Moon, Diamond, Earth!', textEn: 'Mission complete!', type: 'ending', reward: { xp: 100, lingos: 70 } },
    },
  },
  underwater: {
    title: 'Underwater World', titleHe: 'העולם שמתחת למים', emoji: '🐠',
    nodes: {
      start: { id: 'start', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'שלום! אני מרינה בת הים! בוא נצלול ביחד!', textEn: 'Hi! I\'m Marina the mermaid! Let\'s dive together!', type: 'dialog', choices: [{ label: 'Let\'s dive!', labelHe: 'יאללה צוללים!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'תראה! זה... 🐠', textEn: 'Look! It\'s a... 🐠', type: 'question', question: { word: 'Fish', wordHe: 'דג', options: ['Fish', 'Bird', 'Cat', 'Dog'], hint: '🐠 Swims in water' } },
      q1_correct: { id: 'q1_correct', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'Fish = דג! יפה!', textEn: 'Fish! Beautiful!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'Fish = דג!', textEn: 'It\'s Fish!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Coral', characterEmoji: '🐚', textHe: 'היי! אני קורל! תראו את ה... 🐚', textEn: 'Hi! I\'m Coral! See the... 🐚', type: 'question', question: { word: 'Shell', wordHe: 'צדפה', options: ['Shell', 'Stone', 'Pearl', 'Sand'], hint: '🐚 Found on the beach' } },
      q2_correct: { id: 'q2_correct', character: 'Coral', characterEmoji: '🐚', textHe: 'Shell = צדפה!', textEn: 'Shell!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Coral', characterEmoji: '🐚', textHe: 'Shell = צדפה!', textEn: 'It\'s Shell!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'היזהרו מה... 🦈', textEn: 'Watch out for the... 🦈', type: 'question', question: { word: 'Shark', wordHe: 'כריש', options: ['Shark', 'Whale', 'Dolphin', 'Seal'], hint: '🦈 Scary ocean predator' } },
      q3_correct: { id: 'q3_correct', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'Shark = כריש! ברחנו!', textEn: 'Shark! We escaped!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'Shark = כריש!', textEn: 'It\'s Shark!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'מצאנו... 💎', textEn: 'We found... 💎', type: 'question', question: { word: 'Pearl', wordHe: 'פנינה', options: ['Pearl', 'Diamond', 'Gold', 'Ruby'], hint: '💎 Inside an oyster' } },
      q4_correct: { id: 'q4_correct', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'Pearl = פנינה!', textEn: 'Pearl!', type: 'dialog', next: 'ending' },
      q4_wrong: { id: 'q4_wrong', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: 'Pearl = פנינה!', textEn: 'It\'s Pearl!', type: 'dialog', next: 'q4' },
      ending: { id: 'ending', character: 'Marina', characterEmoji: '🧜‍♀️', textHe: '🐠 הרפתקה מדהימה! למדנו: Fish, Shell, Shark, Pearl!', textEn: 'Amazing adventure!', type: 'ending', reward: { xp: 90, lingos: 60 } },
    },
  },
  magic_school: {
    title: 'Magic School', titleHe: 'בית ספר לקסמים', emoji: '🧙',
    nodes: {
      start: { id: 'start', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'שלום תלמיד! אני הקוסם אוז! מוכן ללמוד קסמים?', textEn: 'Hello student! I\'m Wizard Oz! Ready to learn magic?', type: 'dialog', choices: [{ label: 'Yes, master!', labelHe: 'כן, מורה!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'הקסם הראשון: הפוך את ה... ✨ לזהב!', textEn: 'First spell: turn the... ✨ to gold!', type: 'question', question: { word: 'Stone', wordHe: 'אבן', options: ['Stone', 'Wood', 'Metal', 'Glass'], hint: '🪨 Hard and gray' } },
      q1_correct: { id: 'q1_correct', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'Stone = אבן! קסם מושלם!', textEn: 'Stone! Perfect spell!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'Stone = אבן!', textEn: 'It\'s Stone!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Fairy Bell', characterEmoji: '🧚', textHe: 'אני הפיה בל! צריך... 🪄', textEn: 'I\'m Fairy Bell! We need a... 🪄', type: 'question', question: { word: 'Wand', wordHe: 'שרביט', options: ['Wand', 'Stick', 'Sword', 'Staff'], hint: '🪄 Magic stick' } },
      q2_correct: { id: 'q2_correct', character: 'Fairy Bell', characterEmoji: '🧚', textHe: 'Wand = שרביט! ✨', textEn: 'Wand! Sparkle!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Fairy Bell', characterEmoji: '🧚', textHe: 'Wand = שרביט!', textEn: 'It\'s Wand!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'עכשיו נלמד על... 📚', textEn: 'Now let\'s learn about... 📚', type: 'question', question: { word: 'Potion', wordHe: 'שיקוי', options: ['Potion', 'Poison', 'Water', 'Soup'], hint: '🧪 Magic drink' } },
      q3_correct: { id: 'q3_correct', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'Potion = שיקוי! נפלא!', textEn: 'Potion! Wonderful!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'Potion = שיקוי!', textEn: 'It\'s Potion!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'הקסם האחרון! צריך... 🐉', textEn: 'Final spell! Summon a... 🐉', type: 'question', question: { word: 'Dragon', wordHe: 'דרקון', options: ['Dragon', 'Lion', 'Eagle', 'Wolf'], hint: '🐉 Fire-breathing creature' } },
      q4_correct: { id: 'q4_correct', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'Dragon = דרקון!', textEn: 'Dragon!', type: 'dialog', next: 'ending' },
      q4_wrong: { id: 'q4_wrong', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: 'Dragon = דרקון!', textEn: 'It\'s Dragon!', type: 'dialog', next: 'q4' },
      ending: { id: 'ending', character: 'Wizard Oz', characterEmoji: '🧙‍♂️', textHe: '🧙 סיימת את בית הספר לקסמים! למדנו: Stone, Wand, Potion, Dragon!', textEn: 'You graduated magic school!', type: 'ending', reward: { xp: 90, lingos: 60 } },
    },
  },
  safari: {
    title: 'Safari Adventure', titleHe: 'הרפתקת ספארי', emoji: '🦁',
    nodes: {
      start: { id: 'start', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'שלום! אני ג\'ק השומר! מוכנים לספארי באפריקה?', textEn: 'Hi! I\'m Ranger Jack! Ready for an African safari?', type: 'dialog', choices: [{ label: 'Let\'s go!', labelHe: 'יאללה!', next: 'q1' }] },
      q1: { id: 'q1', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'תראו! מלך החיות! 🦁', textEn: 'Look! The king of animals! 🦁', type: 'question', question: { word: 'Lion', wordHe: 'אריה', options: ['Lion', 'Tiger', 'Bear', 'Wolf'], hint: '🦁 King of the jungle' } },
      q1_correct: { id: 'q1_correct', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Lion = אריה! מלך!', textEn: 'Lion! The king!', type: 'dialog', next: 'q2' },
      q1_wrong: { id: 'q1_wrong', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Lion = אריה!', textEn: 'It\'s Lion!', type: 'dialog', next: 'q1' },
      q2: { id: 'q2', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'ו... החיה הכי גבוהה! 🦒', textEn: 'And the tallest animal! 🦒', type: 'question', question: { word: 'Giraffe', wordHe: 'ג\'ירפה', options: ['Giraffe', 'Elephant', 'Horse', 'Camel'], hint: '🦒 Very long neck' } },
      q2_correct: { id: 'q2_correct', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Giraffe = ג\'ירפה!', textEn: 'Giraffe!', type: 'dialog', next: 'q3' },
      q2_wrong: { id: 'q2_wrong', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Giraffe = ג\'ירפה!', textEn: 'It\'s Giraffe!', type: 'dialog', next: 'q2' },
      q3: { id: 'q3', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'זהירות! הכי גדול! 🐘', textEn: 'Careful! The biggest! 🐘', type: 'question', question: { word: 'Elephant', wordHe: 'פיל', options: ['Elephant', 'Rhino', 'Hippo', 'Bear'], hint: '🐘 Big ears, long trunk' } },
      q3_correct: { id: 'q3_correct', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Elephant = פיל! ענק!', textEn: 'Elephant! Huge!', type: 'dialog', next: 'q4' },
      q3_wrong: { id: 'q3_wrong', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Elephant = פיל!', textEn: 'It\'s Elephant!', type: 'dialog', next: 'q3' },
      q4: { id: 'q4', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'ולסיום, מפוספס! 🦓', textEn: 'And finally, striped! 🦓', type: 'question', question: { word: 'Zebra', wordHe: 'זברה', options: ['Zebra', 'Horse', 'Donkey', 'Cow'], hint: '🦓 Black and white stripes' } },
      q4_correct: { id: 'q4_correct', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Zebra = זברה!', textEn: 'Zebra!', type: 'dialog', next: 'ending' },
      q4_wrong: { id: 'q4_wrong', character: 'Ranger Jack', characterEmoji: '🤠', textHe: 'Zebra = זברה!', textEn: 'It\'s Zebra!', type: 'dialog', next: 'q4' },
      ending: { id: 'ending', character: 'Ranger Jack', characterEmoji: '🤠', textHe: '🦁 ספארי מדהים! למדנו: Lion, Giraffe, Elephant, Zebra!', textEn: 'Amazing safari!', type: 'ending', reward: { xp: 90, lingos: 60 } },
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
  const [displayOptions, setDisplayOptions] = useState<string[]>([]);

  useEffect(() => { if (selectedStory) { setTyping(true); setTimeout(() => setTyping(false), 600); } }, [currentNode, selectedStory]);

  // Shuffle options when question changes
  useEffect(() => {
    if (selectedStory) {
      const story = STORIES[selectedStory];
      const node = story?.nodes[currentNode];
      if (node?.question?.options) {
        setDisplayOptions(shuffle([...node.question.options]));
      }
    }
  }, [currentNode, selectedStory]);

  // Story selection screen
  if (!selectedStory) return (
    <div className="min-h-screen px-4 py-5 pb-24" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-lg mx-auto" dir="rtl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black text-white">📖 הרפתקאות</h2>
          <button onClick={onFinish} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
        </div>
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
                  <p className="text-xs text-indigo-300 mt-1">🎯 5 מילים | ⭐ 80-100 XP</p>
                </div>
                <span className="text-2xl">▶</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const story = STORIES[selectedStory];
  const node = story.nodes[currentNode];
  if (!node) return null;

  const handleAnswer = (option: string) => {
    if (answered || !node.question) return;
    setAnswered(true);
    const correct = option === node.question.word;
    setWasCorrect(correct); setTotalQ(t => t + 1);
    if (correct) { setScore(s => s + 1); sounds.correct(); sounds.speak(node.question!.word); }
    else sounds.wrong();
    setTimeout(() => { setAnswered(false); setWasCorrect(null); setCurrentNode(correct ? currentNode + '_correct' : currentNode + '_wrong'); }, 1200);
  };

  const handleFinishStory = async () => {
    setSaving(true);
    const reward = node.reward || { xp: 50, lingos: 30 };
    try { await completeGame(userId, reward.xp, reward.lingos, score === totalQ ? 1 : 0); } catch (_) {}
    onFinish();
  };

  // Ending
  if (node.type === 'ending') {
    const reward = node.reward || { xp: 50, lingos: 30 };
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
        <div className="w-full max-w-md text-center" dir="rtl">
          <div className="rounded-3xl p-7" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-2xl font-black text-white mb-2">{story.titleHe}</h2>
            <p className="text-sm text-indigo-300 mb-4">{node.textHe}</p>
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(34,197,94,0.1)' }}><div className="text-sm font-bold text-green-400">✅ {score}/{totalQ} נכון</div></div>
            <div className="rounded-xl p-3 mb-5" style={{ background: 'rgba(99,102,241,0.1)' }}>
              <div className="flex justify-center gap-5"><div>⭐ <span className="font-black text-white">+{reward.xp}</span></div><div>💰 <span className="font-black text-white">+{reward.lingos}</span></div></div>
            </div>
            <button onClick={handleFinishStory} disabled={saving} className="w-full py-3.5 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{saving ? '⚡...' : '🏠 המשך'}</button>
          </div>
        </div>
      </div>
    );
  }

  // Playing
  return (
    <div className="min-h-screen flex flex-col px-4 py-5" style={{ background: 'linear-gradient(135deg,#0f0c29,#302b63,#24243e)' }}>
      <div className="max-w-md mx-auto w-full">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { if (selectedStory) { setSelectedStory(null); } else onFinish(); }} className="text-sm px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>← חזרה</button>
          <div className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>📖 {story.titleHe} | ✅ {score}</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center" dir="rtl">
          <div className="mb-4 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-2" style={{ background: 'rgba(99,102,241,0.2)', border: '3px solid rgba(99,102,241,0.4)' }}>{node.characterEmoji}</div>
            <p className="text-sm font-bold text-indigo-300">{node.character}</p>
          </div>
          <div className="w-full rounded-2xl p-5 mb-4" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <p className="text-base text-white leading-relaxed">{typing ? '...' : node.textHe}</p>
            <p className="text-xs text-slate-400 mt-2 italic">{typing ? '' : node.textEn}</p>
          </div>
          {node.type === 'question' && node.question && !typing && (
            <div className="w-full">
              <p className="text-center text-xs text-indigo-300 mb-3">💡 {node.question.hint}</p>
              <div className="grid grid-cols-2 gap-3">
                {displayOptions.map((o, i) => {
                  const isAns = o === node.question!.word, show = answered;
                  let bg = 'rgba(255,255,255,0.06)', brd = '1px solid rgba(255,255,255,0.12)', col = '#e2e8f0';
                  if (show && isAns) { bg = 'rgba(34,197,94,0.2)'; brd = '2px solid #22c55e'; col = '#34d399'; }
                  else if (show && !isAns) { bg = 'rgba(239,68,68,0.1)'; col = '#94a3b8'; }
                  return <button key={i} onClick={() => handleAnswer(o)} disabled={answered} className="py-3.5 px-3 rounded-2xl font-bold text-sm transition-all hover:scale-[1.03] disabled:hover:scale-100" style={{ background: bg, border: brd, color: col }}>{o}{show && isAns && ' ✅'}</button>;
                })}
              </div>
              {wasCorrect !== null && <p className="text-center mt-3 text-lg font-black" style={{ color: wasCorrect ? '#34d399' : '#f87171' }}>{wasCorrect ? '🎉 נכון!' : `❌ ${node.question.word} = ${node.question.wordHe}`}</p>}
            </div>
          )}
          {node.choices && !typing && (
            <div className="w-full space-y-2">{node.choices.map((c, i) => (
              <button key={i} onClick={() => { sounds.tap(); setCurrentNode(c.next); }} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#c7d2fe' }}>{c.labelHe} <span className="text-xs text-slate-400">({c.label})</span></button>
            ))}</div>
          )}
          {node.type === 'dialog' && node.next && !node.choices && !typing && (
            <button onClick={() => { sounds.tap(); setCurrentNode(node.next!); }} className="mt-4 px-8 py-3 rounded-xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>▶ המשך</button>
          )}
        </div>
      </div>
    </div>
  );
}