'use client';

class SoundSystem {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private playNote(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.01);
    } catch (_) {}
  }

  private playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.08, delay = 0) {
    freqs.forEach(f => this.playNote(f, duration, type, volume, delay));
  }

  // ─── CORRECT - Happy sparkle melody ───
  correct() {
    this.playNote(523, 0.12, 'sine', 0.15, 0);      // C5
    this.playNote(659, 0.12, 'sine', 0.15, 0.08);   // E5
    this.playNote(784, 0.12, 'sine', 0.15, 0.16);   // G5
    this.playNote(1047, 0.25, 'sine', 0.12, 0.24);  // C6
    // Sparkle
    this.playNote(1568, 0.08, 'sine', 0.06, 0.35);
    this.playNote(2093, 0.08, 'sine', 0.04, 0.4);
  }

  // ─── WRONG - Gentle "nope" ───
  // ─── WRONG - Gentle soft "oops" (kid-friendly, not scary) ───
  wrong() {
    this.playNote(350, 0.12, 'sine', 0.06, 0);
    this.playNote(300, 0.15, 'sine', 0.05, 0.1);
  }

  // ─── CLICK - Soft pop ───
  click() {
    this.playNote(880, 0.04, 'sine', 0.08);
    this.playNote(1320, 0.04, 'sine', 0.06, 0.02);
  }

  // ─── TAP - Quick tick ───
  tap() {
    this.playNote(600, 0.03, 'sine', 0.05);
  }

  // ─── TICK - Timer countdown ───
  tick() {
    this.playNote(1000, 0.04, 'sine', 0.06);
  }

  // ─── URGENT TICK - Last seconds ───
  urgentTick() {
    this.playNote(1200, 0.06, 'square', 0.08, 0);
    this.playNote(1200, 0.06, 'square', 0.08, 0.1);
  }

  // ─── COIN - Ka-ching! ───
  coin() {
    this.playNote(1319, 0.06, 'sine', 0.1, 0);
    this.playNote(1568, 0.06, 'sine', 0.1, 0.05);
    this.playNote(2093, 0.12, 'sine', 0.08, 0.1);
  }

  // ─── STREAK - Fire! Rising excitement ───
  streak() {
    this.playNote(880, 0.08, 'sawtooth', 0.06, 0);
    this.playNote(1047, 0.08, 'sawtooth', 0.06, 0.06);
    this.playNote(1319, 0.08, 'sawtooth', 0.06, 0.12);
    this.playNote(1568, 0.12, 'sawtooth', 0.08, 0.18);
  }

  // ─── LEVEL UP - Epic fanfare ───
  levelUp() {
    // Fanfare
    this.playNote(523, 0.15, 'square', 0.08, 0);
    this.playNote(659, 0.15, 'square', 0.08, 0.15);
    this.playNote(784, 0.15, 'square', 0.08, 0.3);
    this.playNote(1047, 0.3, 'square', 0.1, 0.45);
    // Sparkles
    this.playNote(1568, 0.1, 'sine', 0.06, 0.6);
    this.playNote(2093, 0.1, 'sine', 0.06, 0.7);
    this.playNote(2637, 0.15, 'sine', 0.05, 0.8);
    // Victory chord
    this.playChord([1047, 1319, 1568], 0.5, 'sine', 0.05, 0.9);
  }

  // ─── PERFECT - Celebration! ───
  perfect() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319, 1568, 1319, 1568, 2093];
    melody.forEach((n, i) => this.playNote(n, 0.1, 'sine', 0.1, i * 0.07));
    // Fireworks
    setTimeout(() => {
      for (let i = 0; i < 5; i++) {
        this.playNote(2000 + Math.random() * 2000, 0.08, 'sine', 0.04, i * 0.1);
      }
    }, 800);
  }

  // ─── GAME START - Adventure begins ───
  gameStart() {
    this.playNote(392, 0.15, 'square', 0.07, 0);    // G4
    this.playNote(523, 0.15, 'square', 0.07, 0.15);  // C5
    this.playNote(659, 0.15, 'square', 0.07, 0.3);   // E5
    this.playNote(784, 0.3, 'square', 0.09, 0.45);   // G5
    this.playChord([523, 659, 784], 0.3, 'sine', 0.04, 0.6);
  }

  // ─── GAME OVER - Results ───
  gameOver() {
    this.playNote(784, 0.2, 'sine', 0.08, 0);
    this.playNote(659, 0.2, 'sine', 0.08, 0.15);
    this.playNote(523, 0.2, 'sine', 0.08, 0.3);
    this.playNote(392, 0.4, 'sine', 0.06, 0.45);
  }

  // ─── VICTORY - You won! ───
  victory() {
    this.playNote(523, 0.12, 'square', 0.08, 0);
    this.playNote(659, 0.12, 'square', 0.08, 0.1);
    this.playNote(784, 0.12, 'square', 0.08, 0.2);
    this.playNote(1047, 0.25, 'square', 0.1, 0.3);
    this.playNote(1319, 0.25, 'square', 0.1, 0.5);
    this.playNote(1568, 0.4, 'square', 0.08, 0.7);
    this.playChord([1047, 1319, 1568], 0.6, 'sine', 0.05, 0.9);
  }

  // ─── DEFEAT - Better luck ───
  defeat() {
    this.playNote(392, 0.3, 'triangle', 0.08, 0);
    this.playNote(330, 0.3, 'triangle', 0.06, 0.25);
    this.playNote(262, 0.5, 'triangle', 0.05, 0.5);
  }

  // ─── MYSTERY - Mysterious reveal ───
  mystery() {
    this.playNote(330, 0.2, 'sine', 0.08, 0);
    this.playNote(392, 0.2, 'sine', 0.08, 0.2);
    this.playNote(330, 0.2, 'sine', 0.08, 0.4);
    this.playNote(440, 0.3, 'sine', 0.1, 0.6);
    this.playNote(523, 0.4, 'sine', 0.08, 0.8);
  }

  // ─── POWER UP - Got an item ───
  powerUp() {
    for (let i = 0; i < 8; i++) {
      this.playNote(400 + i * 100, 0.08, 'square', 0.06, i * 0.05);
    }
    this.playNote(1200, 0.2, 'sine', 0.08, 0.4);
  }

  // ─── INVITE - Someone challenges you ───
  invite() {
    this.playNote(880, 0.1, 'sine', 0.1, 0);
    this.playNote(1047, 0.1, 'sine', 0.1, 0.15);
    this.playNote(880, 0.1, 'sine', 0.1, 0.3);
    this.playNote(1047, 0.1, 'sine', 0.1, 0.45);
    this.playNote(1319, 0.2, 'sine', 0.12, 0.6);
  }

  // ─── COUNTDOWN - 3, 2, 1... ───
  countdown(num: number) {
    const freq = num === 3 ? 523 : num === 2 ? 659 : num === 1 ? 784 : 1047;
    this.playNote(freq, num === 0 ? 0.4 : 0.15, 'square', 0.1);
    if (num === 0) this.playChord([523, 659, 784], 0.3, 'sine', 0.05, 0.2);
  }

  // ─── COMBO - Getting multiple right ───
  combo(count: number) {
    const baseFreq = 523 + count * 50;
    this.playNote(baseFreq, 0.08, 'sine', 0.1, 0);
    this.playNote(baseFreq * 1.25, 0.08, 'sine', 0.1, 0.05);
    this.playNote(baseFreq * 1.5, 0.12, 'sine', 0.08, 0.1);
  }

  // ─── WHOOSH - Page transition ───
  whoosh() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch (_) {}
  }

  // ─── SPEAK - Text to Speech ───
  speak(text: string, rate = 0.85) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = rate; u.pitch = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  speakQuestion(text: string) { this.speak(text, 0.8); }
}

export const sounds = new SoundSystem();