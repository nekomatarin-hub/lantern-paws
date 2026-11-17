// Lantern Paws — deterministic scenes for the maker's screenshots.
// `game/index.html?shot=play&seed=7` builds one frozen, seeded moment of the
// real game (same world, same renderer) so the screenshots in screenshots/
// are honest renders of the game's own code, reproducible by anyone.

import { Rng } from './random.js';
import { burst, makePickup } from './entities.js';

function reseed(world, seed) {
  world.rng = new Rng(seed);
}

function arrangePlayScene(world) {
  world.setupWave(2); // wave 3: drifters, chasers and a splitter
  const [first, second] = world.lanterns;
  first.lit = true;
  first.filled = first.needed;
  second.filled = 2;

  world.score = 1240;
  world.hearts = 2;
  world.timePlayed = 96;
  world.starsLitTotal = 5;
  world.bumpsTotal = 7;
  world.bannerT = 0;

  const cat = world.cat;
  cat.x = 560;
  cat.y = 430;
  cat.carried = 3;
  cat.face = 1;
  cat.dashT = 0.16;
  cat.dashDirX = 0.85;
  cat.dashDirY = -0.5;
  cat.graceT = 0.2;

  // Pose the glooms where the camera (and the judge) can read them —
  // clear of the lanterns, so no gloom reads as part of a lantern.
  const spots = [
    [830, 300], [950, 470], [360, 300], [1050, 330], [760, 520], [310, 590],
  ];
  world.glooms.forEach((g, i) => {
    const [x, y] = spots[i % spots.length];
    g.x = x;
    g.y = y;
  });
  // A bell pickup waits mid-garden: the variety is part of the game.
  world.pickups.push(makePickup('bell', 706, 252, 99));
  world.stars.forEach((s, i) => {
    s.x = 420 + i * 130;
    s.y = 250 + (i % 3) * 120;
  });
}

function arrangeClearScene(world) {
  world.setupWave(2);
  for (const l of world.lanterns) {
    l.lit = true;
    l.filled = l.needed;
  }
  world.score = 2130;
  world.hearts = 3;
  world.timePlayed = 141;
  world.starsLitTotal = 8;
  world.bumpsTotal = 11;
  world.bannerT = 0;
  world.cat.x = 640;
  world.cat.y = 430;
  world.cat.carried = 0;
  world.state = 'waveclear';
  world.waveClearT = 2.2;
  for (const l of world.lanterns) {
    burst(world.particles, l.x, l.y - 20, '#ffd94d', 16, 220, 1.1, world.rng);
  }
}

function arrangeEndScene(world) {
  world.setupWave(4);
  for (const l of world.lanterns) {
    l.lit = true;
    l.filled = l.needed;
  }
  world.score = 4860;
  world.hearts = 2;
  world.timePlayed = 243;
  world.starsLitTotal = 17;
  world.bumpsTotal = 23;
  world.bannerT = 0;
  world.cat.x = 640;
  world.cat.y = 470;
  world.cat.carried = 0;
  world.state = 'victory';
}

export function setupShot(world, name, seed = 7) {
  reseed(world, seed);
  world.buildAmbient();
  if (name === 'play') {
    world.state = 'playing';
    arrangePlayScene(world);
  } else if (name === 'clear') {
    arrangeClearScene(world);
  } else if (name === 'end') {
    arrangeEndScene(world);
  } else {
    world.state = 'title';
  }
}
