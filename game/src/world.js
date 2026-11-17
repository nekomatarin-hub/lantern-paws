// Lantern Paws — the rules of the game. The World owns the state machine
// (title -> playing -> waveclear -> ... -> victory / gameover), spawning,
// collisions, the star economy and scoring. Drawing is render.js's job and
// movement primitives are entities.js's; this file decides what happens.
//
// The loop in one breath: stars fall in the moonlit garden. Carry up to five
// of them to an unlit lantern to light it — but every star you carry raises
// your combo multiplier, so the greedy route pays more and risks more: a
// Gloom's touch while you are not dashing costs a heart and spills the lot.
// Dash through a Gloom to bump it away for points. Light every lantern to
// clear the wave; clear wave 5 and its Great Lantern to win.

import { ARENA, CAT, STAR, WAVES, GREAT_LANTERN_STARS, PICKUPS, SCORE, COMBO_PER_STAR } from './config.js';
import {
  makeCat, makeGloom, makeStar, makeLantern, makePickup,
  burst, floatText, updateCat, updateGloom, updateParticles, updateTexts, clampToArena,
} from './entities.js';
import { Rng } from './random.js';

const LANTERN_SPOTS = [
  { x: 250, y: 220 }, { x: 1030, y: 220 }, { x: 250, y: 540 }, { x: 1030, y: 540 },
];
const GREAT_SPOT = { x: 640, y: 300 };

export class World {
  constructor(sound) {
    this.sound = sound;
    this.rng = new Rng((Math.random() * 1e9) | 0);
    this.state = 'title'; // title | playing | waveclear | victory | gameover
    this.paused = false;
    this.resetRun();
    this.buildAmbient();
  }

  resetRun() {
    this.cat = makeCat();
    this.hearts = CAT.maxHearts;
    this.score = 0;
    this.wave = 0; // index into WAVES
    this.timePlayed = 0;
    this.starsLitTotal = 0;
    this.bumpsTotal = 0;
    this.glooms = [];
    this.stars = [];
    this.pickups = [];
    this.particles = [];
    this.texts = [];
    this.lanterns = [];
    this.freezeT = 0;
    this.magnetT = 0;
    this.starTimer = 0;
    this.pickupTimers = { milk: 9, bell: 6, yarn: 12 };
    this.bannerT = 0;
    this.shakeT = 0;
  }

  // A gentle scene behind the title: two lit lanterns, drifting fireflies.
  buildAmbient() {
    this.ambientLanterns = [
      { ...makeLantern(250, 540, 1), lit: true, filled: 1 },
      { ...makeLantern(1030, 220, 1), lit: true, filled: 1 },
    ];
    this.fireflies = [];
    for (let i = 0; i < 26; i++) {
      this.fireflies.push({
        x: this.rng.range(ARENA.x, ARENA.x + ARENA.w),
        y: this.rng.range(ARENA.y, ARENA.y + ARENA.h),
        phase: this.rng.range(0, Math.PI * 2),
        speed: this.rng.range(4, 11),
      });
    }
  }

  startGame() {
    this.resetRun();
    this.state = 'playing';
    this.setupWave(0);
    this.sound.startMusic();
  }

  setupWave(index) {
    const def = WAVES[index];
    this.wave = index;
    this.lanterns = [];
    const spots = LANTERN_SPOTS.slice(0, def.lanterns);
    for (const s of spots) this.lanterns.push(makeLantern(s.x, s.y, def.starsPerLantern));
    if (def.greatLantern) {
      this.lanterns.push(makeLantern(GREAT_SPOT.x, GREAT_SPOT.y, GREAT_LANTERN_STARS, true));
    }
    this.glooms = [];
    const spawn = (kind, count) => {
      for (let i = 0; i < count; i++) {
        // Glooms fade in at the garden's edge, away from the cat.
        let x = 0;
        let y = 0;
        for (let tries = 0; tries < 12; tries++) {
          const a = this.rng.range(0, Math.PI * 2);
          x = ARENA.x + ARENA.w / 2 + Math.cos(a) * ARENA.w * 0.38;
          y = ARENA.y + ARENA.h / 2 + Math.sin(a) * ARENA.h * 0.36;
          if (Math.hypot(x - this.cat.x, y - this.cat.y) > 240) break;
        }
        this.glooms.push(makeGloom(kind, x, y, this.rng));
      }
    };
    spawn('drifter', def.glooms.drifter);
    spawn('chaser', def.glooms.chaser);
    spawn('splitter', def.glooms.splitter);
    this.stars = [];
    for (let i = 0; i < 4; i++) this.spawnStar();
    this.starTimer = STAR.spawnEvery;
    this.bannerT = 2.2; // "WAVE n" banner
  }

  spawnStar() {
    const x = this.rng.range(ARENA.x + 50, ARENA.x + ARENA.w - 50);
    const y = this.rng.range(ARENA.y + 46, ARENA.y + ARENA.h - 46);
    const star = makeStar(x, y, this.rng);
    clampToArena(star, 20);
    this.stars.push(star);
  }

  multiplier() {
    return 1 + this.cat.carried * COMBO_PER_STAR;
  }

  addScore(base, x, y, label) {
    const pts = Math.round(base * this.multiplier());
    this.score += pts;
    floatText(this.texts, x, y, `${label || '+' + pts}`, '#ffd94d');
  }

  startNextWave() {
    if (this.wave + 1 >= WAVES.length) return;
    this.state = 'playing';
    this.cat.carried = 0;
    this.setupWave(this.wave + 1);
  }

  winGame() {
    this.state = 'victory';
    this.score += SCORE.victory;
    this.sound.victory();
    this.sound.stopMusic();
    burst(this.particles, this.cat.x, this.cat.y - 10, '#ffd94d', 42, 260, 1.4, this.rng);
    burst(this.particles, this.cat.x, this.cat.y - 10, '#ff9ecb', 26, 200, 1.2, this.rng);
  }

  loseGame() {
    this.state = 'gameover';
    this.sound.gameOver();
    this.sound.stopMusic();
  }

  // --- per-frame -----------------------------------------------------------

  update(dt, input) {
    this.updateFireflies(dt);
    updateParticles(this.particles, dt);
    updateTexts(this.texts, dt);
    if (this.bannerT > 0) this.bannerT -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;

    if (input.takeMute()) {
      this.sound.setMuted(!this.sound.muted);
    }

    if (this.state === 'title') {
      if (input.takeConfirm()) {
        this.sound.unlock();
        this.sound.uiMove();
        this.startGame();
      }
      return;
    }

    if (this.state === 'victory' || this.state === 'gameover') {
      if (input.takeConfirm()) {
        this.sound.unlock();
        this.startGame();
      }
      return;
    }

    if (this.state === 'waveclear') {
      this.waveClearT -= dt;
      this.updateCatOnly(dt, input);
      if (this.waveClearT <= 0) this.startNextWave();
      return;
    }

    // playing
    if (input.takePause()) this.paused = !this.paused;
    if (this.paused) return;

    this.timePlayed += dt;
    this.freezeT = Math.max(0, this.freezeT - dt);
    this.magnetT = Math.max(0, this.magnetT - dt);

    const dashed = this.updateCatOnly(dt, input);
    if (dashed) this.sound.dash();

    this.updateStars(dt);
    this.updatePickups(dt);
    this.updateGlooms(dt);
    this.updateLanterns(dt);
    this.checkWaveClear();
  }

  updateCatOnly(dt, input) {
    const move = input.moveVector();
    const pointer = input.pointerDown
      ? { active: true, x: input.pointerX, y: input.pointerY }
      : { active: false, x: 0, y: 0 };
    const dashWanted = input.takeDash() || (input.pointerDown && input.dashQueued);
    return updateCat(this.cat, dt, move, pointer, dashWanted);
  }

  updateStars(dt) {
    this.starTimer -= dt;
    if (this.starTimer <= 0 && this.stars.length < STAR.maxOnField) {
      this.starTimer = STAR.spawnEvery;
      this.spawnStar();
    }
    for (const s of this.stars) {
      if (this.magnetT > 0) {
        const dx = this.cat.x - s.x;
        const dy = this.cat.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 260) {
          s.x += (dx / d) * 190 * dt;
          s.y += (dy / d) * 190 * dt;
        }
      }
      if (!s.gone && Math.hypot(s.x - this.cat.x, s.y - this.cat.y) < s.r + this.cat.r) {
        if (this.cat.carried < CAT.starCapacity) {
          s.gone = true;
          this.cat.carried++;
          this.sound.pickup();
          this.addScore(SCORE.starPickup, s.x, s.y - 14);
          burst(this.particles, s.x, s.y, '#ffd94d', 7, 120, 0.5, this.rng);
        }
      }
    }
    this.stars = this.stars.filter((s) => !s.gone);
  }

  updatePickups(dt) {
    const kinds = [
      ['milk', PICKUPS.milkEvery],
      ['bell', PICKUPS.bellEvery],
      ['yarn', PICKUPS.yarnEvery],
    ];
    for (const [kind, every] of kinds) {
      this.pickupTimers[kind] -= dt;
      if (this.pickupTimers[kind] <= 0) {
        this.pickupTimers[kind] = this.rng.range(every[0], every[1]);
        if (kind === 'milk' && this.hearts >= CAT.maxHearts) continue;
        if (!this.pickups.some((p) => p.kind === kind)) {
          const x = this.rng.range(ARENA.x + 70, ARENA.x + ARENA.w - 70);
          const y = this.rng.range(ARENA.y + 60, ARENA.y + ARENA.h - 60);
          this.pickups.push(makePickup(kind, x, y, PICKUPS.lifeTime));
        }
      }
    }
    for (const p of this.pickups) {
      p.age += dt;
      if (p.age > p.lifeTime) p.gone = true;
      if (!p.gone && Math.hypot(p.x - this.cat.x, p.y - this.cat.y) < p.r + this.cat.r) {
        p.gone = true;
        this.sound.powerup();
        if (p.kind === 'milk') {
          this.hearts = Math.min(CAT.maxHearts, this.hearts + 1);
          floatText(this.texts, p.x, p.y - 16, '+1 HEART', '#ff8fa0');
        } else if (p.kind === 'bell') {
          this.freezeT = PICKUPS.freezeTime;
          floatText(this.texts, p.x, p.y - 16, 'GLOOMS FROZEN!', '#a8d8ff');
        } else if (p.kind === 'yarn') {
          this.magnetT = PICKUPS.magnetTime;
          floatText(this.texts, p.x, p.y - 16, 'STAR MAGNET!', '#ffb0e0');
        }
        burst(this.particles, p.x, p.y, '#ffffff', 10, 130, 0.6, this.rng);
      }
    }
    this.pickups = this.pickups.filter((p) => !p.gone);
  }

  updateGlooms(dt) {
    const baseSpeed = WAVES[this.wave].gloomSpeed;
    for (const g of this.glooms) {
      updateGloom(g, dt, this.cat, baseSpeed, this.freezeT > 0, this.rng);
      if (g.gone) continue;
      const d = Math.hypot(g.x - this.cat.x, g.y - this.cat.y);
      if (d >= g.r + this.cat.r - 4) continue;

      if (this.cat.dashT > 0) {
        this.bumpGloom(g);
      } else if (this.cat.graceT <= 0) {
        this.hurtCat(g);
      }
    }
    this.glooms = this.glooms.filter((g) => !g.gone);
  }

  bumpGloom(g) {
    this.sound.bump();
    this.bumpsTotal++;
    this.addScore(SCORE.gloomBump, g.x, g.y - 18);
    burst(this.particles, g.x, g.y, '#b9a8ff', 12, 190, 0.6, this.rng);
    if (g.kind === 'splitter') {
      // A bumped splitter bursts into two quick minis instead of fading.
      g.gone = true;
      for (const dir of [-1, 1]) {
        const mini = makeGloom('mini', g.x + dir * 16, g.y, this.rng);
        mini.knockVx = dir * 260;
        mini.knockVy = -120;
        mini.knockT = 0.3;
        this.glooms.push(mini);
      }
      return;
    }
    const dx = g.x - this.cat.x;
    const dy = g.y - this.cat.y;
    const d = Math.hypot(dx, dy) || 1;
    g.knockVx = (dx / d) * 520;
    g.knockVy = (dy / d) * 520;
    g.knockT = 0.5;
    g.defeated = true;
  }

  hurtCat(g) {
    this.hearts--;
    this.sound.hurt();
    this.shakeT = 0.35;
    this.cat.graceT = CAT.hurtGrace;
    if (this.cat.carried > 0) {
      // Carried stars spill back into the garden around the cat.
      for (let i = 0; i < this.cat.carried; i++) {
        const a = this.rng.range(0, Math.PI * 2);
        const s = makeStar(
          this.cat.x + Math.cos(a) * this.rng.range(36, 74),
          this.cat.y + Math.sin(a) * this.rng.range(36, 74),
          this.rng,
        );
        clampToArena(s, 20);
        this.stars.push(s);
      }
      floatText(this.texts, this.cat.x, this.cat.y - 34, 'STARS SPILLED!', '#ff8fa0');
      this.cat.carried = 0;
    }
    burst(this.particles, this.cat.x, this.cat.y, '#ff6b81', 14, 200, 0.7, this.rng);
    // Shove the gloom back so one touch costs exactly one heart.
    const dx = g.x - this.cat.x;
    const dy = g.y - this.cat.y;
    const d = Math.hypot(dx, dy) || 1;
    g.knockVx = (dx / d) * 380;
    g.knockVy = (dy / d) * 380;
    g.knockT = 0.4;
    if (this.hearts <= 0) this.loseGame();
  }

  updateLanterns(dt) {
    for (const l of this.lanterns) {
      l.depositCd = Math.max(0, l.depositCd - dt);
      if (l.lit || this.cat.carried <= 0 || l.depositCd > 0) continue;
      const reach = l.isGreat ? 64 : 52;
      if (Math.hypot(l.x - this.cat.x, l.y - this.cat.y) < reach) {
        this.cat.carried--;
        l.filled++;
        l.depositCd = 0.22;
        this.sound.deposit();
        burst(this.particles, l.x, l.y - 26, '#ffbe55', 6, 90, 0.5, this.rng);
        if (l.filled >= l.needed) {
          l.lit = true;
          this.starsLitTotal++;
          this.sound.lantern();
          this.score += SCORE.lanternLit;
          floatText(this.texts, l.x, l.y - 52, l.isGreat ? 'GREAT LANTERN LIT!' : 'LANTERN LIT! +150', '#ffbe55');
          burst(this.particles, l.x, l.y - 20, '#ffbe55', 22, 200, 0.9, this.rng);
        }
      }
    }
  }

  checkWaveClear() {
    if (this.state !== 'playing') return;
    if (!this.lanterns.every((l) => l.lit)) return;
    this.score += SCORE.waveClear;
    if (this.wave + 1 >= WAVES.length) {
      this.winGame();
      return;
    }
    this.state = 'waveclear';
    this.waveClearT = 2.6;
    this.sound.waveClear();
    for (const l of this.lanterns) {
      burst(this.particles, l.x, l.y - 20, '#ffd94d', 16, 220, 1.1, this.rng);
    }
  }

  updateFireflies(dt) {
    const list = this.state === 'title' ? this.fireflies : this.fireflies;
    for (const f of list) {
      f.x += Math.cos(f.phase) * f.speed * dt;
      f.y += Math.sin(f.phase * 1.7) * f.speed * 0.6 * dt;
      f.phase += dt * 0.7;
      if (f.x < ARENA.x) f.x = ARENA.x + ARENA.w;
      if (f.x > ARENA.x + ARENA.w) f.x = ARENA.x;
      if (f.y < ARENA.y) f.y = ARENA.y + ARENA.h;
      if (f.y > ARENA.y + ARENA.h) f.y = ARENA.y;
    }
  }
}
