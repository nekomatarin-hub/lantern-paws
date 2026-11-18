// Lantern Paws — central tuning: arena size, palette and the wave table.
// Everything visual or numeric that more than one module needs lives here,
// so the balance of the game can be read (and changed) in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The playable garden is an ellipse inscribed in this rectangle; hedges and
// a stone rim are drawn around it and the cat may not leave it.
export const ARENA = { x: 70, y: 96, w: 1140, h: 560 };

export const CAT = {
  radius: 20,
  speed: 265,          // px per second, keyboard steering
  pointerSpeed: 300,   // px per second, pointer steering
  dashSpeed: 760,      // px per second during a dash
  dashTime: 0.22,      // seconds of dash
  dashCooldown: 0.85,  // seconds before the next dash
  hurtGrace: 1.6,      // seconds of invincibility after losing a heart
  maxHearts: 3,
  starCapacity: 5,     // how many stars the cat can carry at once
};

export const STAR = { radius: 11, spawnEvery: 1.15, maxOnField: 9 };
export const COMBO_PER_STAR = 0.5; // multiplier = 1 + carried * this

export const SCORE = {
  starPickup: 10,
  gloomBump: 25,
  lanternLit: 150,
  waveClear: 300,
  victory: 1000,
};

export const COLORS = {
  skyTop: '#171c3d',
  skyMid: '#232a55',
  skyLow: '#2f3562',
  moon: '#f7ead0',
  moonGlow: 'rgba(247, 234, 208, 0.16)',
  grassA: '#2c4a34',
  grassB: '#24402c',
  hedge: '#16281c',
  hedgeLight: '#1e3826',
  stone: '#8d8fa3',
  stoneDark: '#5d5f73',
  lampPaper: '#ffd98a',
  lampLit: '#ffbe55',
  lampUnlit: '#4a4a63',
  catFur: '#d9dbe4',
  catShade: '#a9adc0',
  catEarPink: '#f2a7bb',
  catCollar: '#3f6fd8',
  gloomBody: '#3a2d55',
  gloomBodyChaser: '#552d49',
  gloomBodyMini: '#463a6e',
  gloomEye: '#ffe9a8',
  star: '#ffd94d',
  starCore: '#fff3b0',
  heart: '#ff6b81',
  textMain: '#f5f1e6',
  textDim: '#b9bdd6',
  accent: '#ffb84d',
};

// One entry per wave. lanterns: how many lanterns stand in the garden;
// starsPerLantern: deposits needed to light one; the great lantern of the
// last wave always needs GREAT_LANTERN_STARS. glooms lists spawn counts by
// kind: drifter (slow wanderer), chaser (hunts the cat), splitter (breaks
// into two minis when bumped).
export const WAVES = [
  { lanterns: 2, starsPerLantern: 2, glooms: { drifter: 2, chaser: 0, splitter: 0 }, gloomSpeed: 52 },
  { lanterns: 3, starsPerLantern: 2, glooms: { drifter: 3, chaser: 1, splitter: 0 }, gloomSpeed: 60 },
  { lanterns: 3, starsPerLantern: 3, glooms: { drifter: 3, chaser: 2, splitter: 1 }, gloomSpeed: 68 },
  { lanterns: 4, starsPerLantern: 3, glooms: { drifter: 4, chaser: 2, splitter: 2 }, gloomSpeed: 76 },
  { lanterns: 4, starsPerLantern: 3, glooms: { drifter: 4, chaser: 3, splitter: 2 }, gloomSpeed: 84, greatLantern: true },
];

export const GREAT_LANTERN_STARS = 6;

export const PICKUPS = {
  milkEvery: [14, 22],   // seconds between milk bottles (min, max)
  bellEvery: [11, 18],   // seconds between bells
  yarnEvery: [16, 24],   // seconds between yarn balls
  freezeTime: 4,         // bell: glooms freeze this long
  magnetTime: 6,         // yarn: stars drift to the cat this long
  lifeTime: 9,           // seconds a pickup waits before fading away
};
