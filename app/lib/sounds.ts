'use client';

// LingoQuest Sound System - Fun sounds using Web Audio API
class SoundSystem {
  private ctx: AudioContext | null = null;
  private bgMusic: OscillatorNode | null = null;
  private bgGain: GainNode | null = null;
  private musicPlaying = false;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  // Play a note
  private playNote(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15, delay = 0) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    } catch (_) {}
  }

  // ─── GAME SOUNDS ───

  // Correct answer - happy ascending melody
  correct() {
    this.playNote(523, 0.15, 'sine', 0.2, 0);     // C5
    this.playNote(659, 0.15, 'sine', 0.2, 0.1);   // E5
    this.playNote(784, 0.25, 'sine', 0.2, 0.2);   // G5
    this.playNote(1047, 0.3, 'sine', 0.15, 0.3);  // C6
  }

  // Wrong answer - descending sad notes
  wrong() {
    this.playNote(400, 0.2, 'sawtooth', 0.08, 0);
    this.playNote(300, 0.3, 'sawtooth', 0.06, 0.15);
  }

  // Button click - short pop
  click() {
    this.playNote(800, 0.05, 'sine', 0.1);
    this.playNote(1200, 0.05, 'sine', 0.08, 0.03);
  }

  // Level up - triumphant fanfare
  levelUp() {
    this.playNote(523, 0.15, 'square', 0.1, 0);
    this.playNote(659, 0.15, 'square', 0.1, 0.15);
    this.playNote(784, 0.15, 'square', 0.1, 0.3);
    this.playNote(1047, 0.4, 'square', 0.12, 0.45);
    this.playNote(1047, 0.15, 'sine', 0.08, 0.7);
    this.playNote(1175, 0.15, 'sine', 0.08, 0.85);
    this.playNote(1319, 0.5, 'sine', 0.1, 1.0);
  }

  // Perfect round - celebration melody
  perfect() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319, 1568];
    notes.forEach((n, i) => this.playNote(n, 0.12, 'sine', 0.12, i * 0.08));
  }

  // Game start - adventure begin
  gameStart() {
    this.playNote(392, 0.2, 'square', 0.08, 0);    // G4
    this.playNote(523, 0.2, 'square', 0.08, 0.2);  // C5
    this.playNote(659, 0.2, 'square', 0.08, 0.4);  // E5
    this.playNote(784, 0.4, 'square', 0.1, 0.6);   // G5
  }

  // Game over
  gameOver() {
    this.playNote(784, 0.2, 'sine', 0.1, 0);
    this.playNote(659, 0.2, 'sine', 0.1, 0.2);
    this.playNote(523, 0.2, 'sine', 0.1, 0.4);
    this.playNote(392, 0.5, 'sine', 0.1, 0.6);
  }

  // Streak - exciting ascending
  streak() {
    this.playNote(880, 0.1, 'sine', 0.1, 0);
    this.playNote(1108, 0.1, 'sine', 0.1, 0.05);
    this.playNote(1320, 0.15, 'sine', 0.12, 0.1);
  }

  // Coin collect
  coin() {
    this.playNote(988, 0.08, 'sine', 0.1, 0);
    this.playNote(1319, 0.15, 'sine', 0.12, 0.08);
  }

  // Navigation tap
  tap() {
    this.playNote(600, 0.04, 'sine', 0.06);
  }

  // Countdown tick
  tick() {
    this.playNote(1000, 0.05, 'sine', 0.08);
  }

  // Speak text (TTS)
  speak(text: string, rate = 0.85) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = rate;
      u.pitch = 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (_) {}
  }

  // Speak question with intro
  speakQuestion(text: string) {
    this.speak(text, 0.8);
  }
}

// Singleton
export const sounds = new SoundSystem();