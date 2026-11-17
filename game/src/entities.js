// Lantern Paws — the things that live in the garden: the cat, the Glooms
// (drifter, chaser, splitter and the minis a splitter breaks into), fallen
// stars, lanterns, pickups, particles and floating score text. Factories and
// per-frame movement live here; rules (collisions, scoring) live in world.js.

import { ARENA, CAT } from './config.js';

export function makeCat() {
  return {
    x: ARENA.x + ARENA.w / 2,
    y: ARENA.y + ARENA.h / 2 + 60,
    vx: 0,
    vy: 0,
    r: CAT.radius,
    face: 1,           // 1 faces right, -1 faces left (drawing flips on it)
    moving: false,
    walkPhase: 0,      // drives the little trot bob and tail wag
    dashT: 0,          // seconds of dash left
    dashCd: 0,         // seconds until the next dash is allowed
    dashDirX: 1,
    dashDirY: 0,
    graceT: 0,         // invincibility timer after a hurt or a dash bump
    carried: 0,        // stars currently carried (see CAT.starCapacity)
    frozen: false,
  };
}

const GLOOM_STATS = {
  drifter: { r: 21, hp: 1, wobble: 1.6 },
  chaser: { r: 22, hp: 1, wobble: 2.2 },
  splitter: { r: 27, hp: 1, wobble: 1.2 },
  mini: { r: 13, hp: 1, wobble: 3.0 },
};

export function makeGloom(kind, x, y, rng, speedScale = 1) {
  const stats = GLOOM_STATS[kind];
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    r: stats.r,
    hp: stats.hp,
    speedScale,
    wobbleSeed: rng.range(0, Math.PI * 2),
    wanderA: rng.range(0, Math.PI * 2),
    wanderT: rng.range(0.5, 1.6),
    knockT: 0,         // while > 0 the gloom slides from a dash bump
    knockVx: 0,
    knockVy: 0,
    defeated: false,   // a dash bump sets this: the gloom fades away and is gone
    gone: false,       // set when a splitter has split / a defeated gloom faded
    fade: 1,           // 1 = solid; defeated glooms fade from 1 to 0
  };
}

export function makeStar(x, y, rng) {
  return {
    x,
    y,
    r: 11,
    phase: rng.range(0, Math.PI * 2),
    vx: 0,
    vy: 0,
    gone: false,
  };
}

export function makeLantern(x, y, needed, isGreat = false) {
  return {
    x,
    y,
    needed,
    filled: 0,
    lit: false,
    isGreat,
    depositCd: 0,      // small pause between deposits so they read one by one
    glowPhase: Math.random() * Math.PI * 2,
  };
}

export function makePickup(kind, x, y, lifeTime) {
  return { kind, x, y, r: 15, age: 0, lifeTime, gone: false, phase: Math.random() * Math.PI * 2 };
}

export function burst(list, x, y, color, count, speed, life, rng) {
  for (let i = 0; i < count; i++) {
    const a = rng.range(0, Math.PI * 2);
    const s = rng.range(speed * 0.3, speed);
    list.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 30,
      age: 0,
      life: rng.range(life * 0.5, life),
      color,
      size: rng.range(2, 4.5),
    });
  }
}

export function floatText(list, x, y, text, color = '#ffd94d') {
  list.push({ x, y, text, color, age: 0, life: 1.1 });
}

// Keep a point inside the arena ellipse (with a margin for the body radius).
export function clampToArena(e, margin = 0) {
  const cx = ARENA.x + ARENA.w / 2;
  const cy = ARENA.y + ARENA.h / 2;
  const rx = ARENA.w / 2 - margin;
  const ry = ARENA.h / 2 - margin;
  const dx = (e.x - cx) / rx;
  const dy = (e.y - cy) / ry;
  const d2 = dx * dx + dy * dy;
  if (d2 > 1) {
    const d = Math.sqrt(d2);
    e.x = cx + (dx / d) * rx;
    e.y = cy + (dy / d) * ry;
  }
}

export function updateCat(cat, dt, move, pointer, dashWanted) {
  cat.dashCd = Math.max(0, cat.dashCd - dt);
  cat.graceT = Math.max(0, cat.graceT - dt);

  if (dashWanted && cat.dashCd <= 0 && cat.dashT <= 0) {
    let dx = move.x;
    let dy = move.y;
    if (dx === 0 && dy === 0 && pointer.active) {
      dx = pointer.x - cat.x;
      dy = pointer.y - cat.y;
    }
    if (dx === 0 && dy === 0) {
      dx = cat.face;
      dy = 0;
    }
    const len = Math.hypot(dx, dy) || 1;
    cat.dashDirX = dx / len;
    cat.dashDirY = dy / len;
    cat.dashT = CAT.dashTime;
    cat.dashCd = CAT.dashCooldown;
    cat.graceT = Math.max(cat.graceT, CAT.dashTime + 0.05);
    return true; // a dash started this frame (world plays the sound)
  }

  if (cat.dashT > 0) {
    cat.dashT -= dt;
    cat.vx = cat.dashDirX * CAT.dashSpeed;
    cat.vy = cat.dashDirY * CAT.dashSpeed;
  } else if (pointer.active) {
    const dx = pointer.x - cat.x;
    const dy = pointer.y - cat.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      const step = Math.min(dist, CAT.pointerSpeed * dt);
      cat.vx = (dx / dist) * (step / dt);
      cat.vy = (dy / dist) * (step / dt);
    } else {
      cat.vx = 0;
      cat.vy = 0;
    }
  } else {
    cat.vx = move.x * CAT.speed;
    cat.vy = move.y * CAT.speed;
  }

  cat.x += cat.vx * dt;
  cat.y += cat.vy * dt;
  clampToArena(cat, cat.r + 4);

  cat.moving = Math.abs(cat.vx) + Math.abs(cat.vy) > 12;
  if (cat.moving) {
    cat.walkPhase += dt * 11;
    if (Math.abs(cat.vx) > 4) cat.face = cat.vx > 0 ? 1 : -1;
  }
  return false;
}

export function updateGloom(g, dt, cat, baseSpeed, frozen, rng) {
  if (g.gone) return;
  if (g.knockT > 0) {
    g.knockT -= dt;
    g.x += g.knockVx * dt;
    g.y += g.knockVy * dt;
    g.knockVx *= Math.pow(0.02, dt);
    g.knockVy *= Math.pow(0.02, dt);
    clampToArena(g, g.r);
    if (g.defeated) {
      g.fade = Math.max(0, g.fade - dt * 1.5);
      if (g.fade <= 0) g.gone = true;
    }
    return;
  }
  if (frozen) return;

  const speed = baseSpeed * g.speedScale;
  if (g.kind === 'chaser' || g.kind === 'mini') {
    const dx = cat.x - g.x;
    const dy = cat.y - g.y;
    const d = Math.hypot(dx, dy) || 1;
    const wob = Math.sin(performance.now() / 1000 * g.wobbleSeed + g.wobbleSeed) * 0.35;
    const a = Math.atan2(dy, dx) + wob * 0.4;
    g.vx = Math.cos(a) * speed * (g.kind === 'mini' ? 1.25 : 1);
    g.vy = Math.sin(a) * speed * (g.kind === 'mini' ? 1.25 : 1);
  } else {
    g.wanderT -= dt;
    if (g.wanderT <= 0) {
      g.wanderT = rng.range(0.8, 2.0);
      g.wanderA = rng.range(0, Math.PI * 2);
    }
    g.vx = Math.cos(g.wanderA) * speed;
    g.vy = Math.sin(g.wanderA) * speed;
  }
  g.x += g.vx * dt;
  g.y += g.vy * dt;
  clampToArena(g, g.r);
}

export function updateParticles(list, dt) {
  for (const p of list) {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].age >= list[i].life) list.splice(i, 1);
  }
}

export function updateTexts(list, dt) {
  for (const t of list) {
    t.age += dt;
    t.y -= 34 * dt;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].age >= list[i].life) list.splice(i, 1);
  }
}
