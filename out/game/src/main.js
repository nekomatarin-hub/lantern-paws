// Lantern Paws — boot and the frame loop. A fixed 1280x720 stage is scaled
// by CSS to the window; the world updates with a clamped delta so a slow
// tab can never teleport the cat. With ?shot=<scene> the game renders one
// seeded scene from shots.js instead of playing (the maker's screenshots).

import { World } from './world.js';
import { Input } from './input.js';
import { SoundKit } from './audio.js';
import { render } from './render.js';
import { setupShot } from './shots.js';
import { updateParticles, updateTexts } from './entities.js';
import { VIEW_W, VIEW_H } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sound = new SoundKit();
const input = new Input(canvas);
const world = new World(sound);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const status = document.getElementById('status');

if (shot) {
  setupShot(world, shot, Number(params.get('seed') || 7));
}

let last = performance.now();
let announced = '';

function frame(now) {
  const rawDt = (now - last) / 1000;
  last = now;
  const dt = Math.min(rawDt, 1 / 30);
  const t = now / 1000;

  if (shot) {
    // Screenshot scenes stay alive (fireflies, particles, glow) but the
    // game itself does not advance.
    world.updateFireflies(dt);
    updateParticles(world.particles, dt);
    updateTexts(world.texts, dt);
  } else {
    if (input.confirmQueued || input.pointerDown) sound.unlock();
    world.update(dt, input);
    sound.update(dt);
    const line = `${world.state} wave ${world.wave + 1} score ${world.score} hearts ${world.hearts}`;
    if (line !== announced) {
      announced = line;
      if (status) status.textContent = `Lantern Paws: ${line}`;
    }
  }

  render(ctx, world, t);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
