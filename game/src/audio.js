// Lantern Paws — every sound is synthesised with WebAudio: no audio files,
// no network. Short oscillator/noise blips for actions, and a slow music-box
// arpeggio loop underneath that can be muted with M or the speaker button.

const MELODY = [523.25, 659.25, 783.99, 659.25, 587.33, 659.25, 880.0, 783.99,
  523.25, 659.25, 783.99, 1046.5, 880.0, 783.99, 659.25, 587.33];

export class SoundKit {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = 0;
    this.musicStep = 0;
    this.musicOn = false;
  }

  // Browsers only allow audio after a gesture, so the context is created
  // lazily from the first key press or click that reaches the game.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.15, delay = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  pickup() { this.tone(1180, 0.09, 'sine', 0.16); this.tone(1560, 0.12, 'sine', 0.12, null, 0.05); }
  dash() { this.noise(0.16, 0.12); this.tone(300, 0.16, 'sine', 0.06, 700); }
  bump() { this.tone(180, 0.12, 'square', 0.14, 90); this.noise(0.08, 0.1); }
  hurt() { this.tone(220, 0.3, 'sawtooth', 0.16, 70); }
  deposit() { this.tone(880, 0.08, 'triangle', 0.14); }
  lantern() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.14, null, i * 0.07)); }
  powerup() { [660, 880, 990].forEach((f, i) => this.tone(f, 0.12, 'sine', 0.13, null, i * 0.05)); }
  waveClear() { [523.25, 587.33, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.15, null, i * 0.09)); }
  gameOver() { [392, 329.63, 261.63, 196].forEach((f, i) => this.tone(f, 0.34, 'triangle', 0.15, null, i * 0.16)); }
  victory() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.15, null, i * 0.11)); }
  uiMove() { this.tone(700, 0.05, 'sine', 0.07); }

  startMusic() {
    this.musicOn = true;
  }

  stopMusic() {
    this.musicOn = false;
  }

  // Called once per frame; schedules the next music-box note when due.
  update(dt) {
    if (!this.ctx || this.muted || !this.musicOn) return;
    this.musicTimer -= dt;
    if (this.musicTimer <= 0) {
      this.musicTimer = 0.42;
      const f = MELODY[this.musicStep % MELODY.length];
      this.musicStep++;
      this.tone(f, 0.5, 'triangle', 0.045);
      if (this.musicStep % 4 === 0) this.tone(f / 2, 0.9, 'sine', 0.035);
    }
  }
}
