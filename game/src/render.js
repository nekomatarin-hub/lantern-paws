// Lantern Paws — all drawing. A moonlit garden at night: indigo sky, a big
// moon, a hedge-ringed lawn, stone lanterns that glow gold as they light,
// a silver cat with pink-lined ears, and the purple Glooms that hunt her.
// Everything is drawn with canvas paths — no images, no fonts to load.

import { VIEW_W, VIEW_H, ARENA, COLORS, WAVES, CAT } from './config.js';

function ellipsePath(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function starPath(ctx, x, y, r, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawBackground(ctx, world, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(0.55, COLORS.skyMid);
  sky.addColorStop(1, COLORS.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Fixed sky stars (positions from a simple hash so they never move).
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  for (let i = 0; i < 60; i++) {
    const x = ((i * 197.3) % 1280);
    const y = ((i * 89.7) % 210);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.8 + i));
    ctx.globalAlpha = 0.25 + 0.5 * tw;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Moon, tucked into the top-right corner so it never sits under the
  // HUD's score readout, with a soft halo.
  const moonX = 1204;
  const moonY = 38;
  const halo = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, 64);
  halo.addColorStop(0, COLORS.moonGlow);
  halo.addColorStop(1, 'rgba(247,234,208,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(moonX - 64, moonY - 64, 128, 128);
  ctx.fillStyle = COLORS.moon;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(210,190,150,0.5)';
  ctx.beginPath();
  ctx.arc(moonX - 6, moonY - 4, 4, 0, Math.PI * 2);
  ctx.arc(moonX + 7, moonY + 6, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // Lawn: an ellipse of two-tone grass with mowing rings.
  const cx = ARENA.x + ARENA.w / 2;
  const cy = ARENA.y + ARENA.h / 2;
  ctx.save();
  ellipsePath(ctx, cx, cy, ARENA.w / 2 + 16, ARENA.h / 2 + 16);
  ctx.clip();
  ctx.fillStyle = COLORS.grassA;
  ctx.fillRect(ARENA.x - 20, ARENA.y - 20, ARENA.w + 40, ARENA.h + 40);
  ctx.fillStyle = COLORS.grassB;
  for (let i = 0; i < 5; i++) {
    ellipsePath(ctx, cx, cy, (ARENA.w / 2) * (0.28 + i * 0.18), (ARENA.h / 2) * (0.28 + i * 0.18));
    if (i % 2 === 0) ctx.fill();
  }
  // Grass tufts, hashed positions.
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 90; i++) {
    const x = ARENA.x + ((i * 131.7) % ARENA.w);
    const y = ARENA.y + ((i * 57.3) % ARENA.h);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 3, y - 7);
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 8, y - 6);
    ctx.stroke();
  }
  ctx.restore();

  // Stone rim and hedge ring.
  ellipsePath(ctx, cx, cy, ARENA.w / 2 + 16, ARENA.h / 2 + 16);
  ctx.strokeStyle = COLORS.stoneDark;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.fillStyle = COLORS.hedge;
  const hedgeCount = 46;
  for (let i = 0; i < hedgeCount; i++) {
    const a = (i / hedgeCount) * Math.PI * 2;
    const hx = cx + Math.cos(a) * (ARENA.w / 2 + 34);
    const hy = cy + Math.sin(a) * (ARENA.h / 2 + 34);
    const r = 24 + ((i * 37) % 13);
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.hedgeLight;
  for (let i = 0; i < hedgeCount; i += 2) {
    const a = (i / hedgeCount) * Math.PI * 2;
    const hx = cx + Math.cos(a) * (ARENA.w / 2 + 30);
    const hy = cy + Math.sin(a) * (ARENA.h / 2 + 30) - 8;
    ctx.beginPath();
    ctx.arc(hx, hy, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fireflies drift over the lawn in every state.
  for (const f of world.fireflies) {
    const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + f.phase * 3);
    ctx.fillStyle = `rgba(255, 230, 140, ${0.25 + 0.55 * tw})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLantern(ctx, l, t) {
  const scale = l.isGreat ? 1.5 : 1;
  const x = l.x;
  const y = l.y;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  // Ground shadow and stone base + post.
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 16, 22, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.stoneDark;
  roundRect(ctx, -13, 8, 26, 9, 3);
  ctx.fill();
  ctx.fillStyle = COLORS.stone;
  roundRect(ctx, -4.5, -16, 9, 26, 3);
  ctx.fill();

  if (l.lit) {
    const flicker = 0.9 + 0.1 * Math.sin(t * 7 + l.glowPhase);
    const glow = ctx.createRadialGradient(0, -26, 4, 0, -26, 64 * flicker);
    glow.addColorStop(0, 'rgba(255, 190, 85, 0.55)');
    glow.addColorStop(1, 'rgba(255, 190, 85, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-70, -96, 140, 140);
  }

  // Paper lamp box and roof.
  ctx.fillStyle = l.lit ? COLORS.lampPaper : COLORS.lampUnlit;
  roundRect(ctx, -13, -40, 26, 24, 5);
  ctx.fill();
  if (l.lit) {
    ctx.fillStyle = '#fff0c0';
    roundRect(ctx, -8, -35, 16, 14, 3);
    ctx.fill();
  } else {
    // Unlit lamps show their fill as little pips inside the glass.
    ctx.fillStyle = '#ffd94d';
    for (let i = 0; i < l.filled; i++) {
      ctx.beginPath();
      ctx.arc(-8 + i * 8, -24, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = COLORS.stoneDark;
  ctx.beginPath();
  ctx.moveTo(-18, -40);
  ctx.lineTo(0, -52);
  ctx.lineTo(18, -40);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Need pips under the lantern: filled gold, missing dim.
  if (!l.lit) {
    for (let i = 0; i < l.needed; i++) {
      const px = x + (i - (l.needed - 1) / 2) * 13;
      ctx.fillStyle = i < l.filled ? '#ffd94d' : 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(px, y + 30 * scale, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawStarItem(ctx, s, t) {
  const bob = Math.sin(t * 3 + s.phase) * 3;
  ctx.save();
  ctx.translate(s.x, s.y + bob);
  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
  glow.addColorStop(0, 'rgba(255, 217, 77, 0.5)');
  glow.addColorStop(1, 'rgba(255, 217, 77, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-24, -24, 48, 48);
  starPath(ctx, 0, 0, s.r, Math.sin(t * 2 + s.phase) * 0.25);
  ctx.fillStyle = COLORS.star;
  ctx.fill();
  starPath(ctx, 0, 0, s.r * 0.55, Math.sin(t * 2 + s.phase) * 0.25);
  ctx.fillStyle = COLORS.starCore;
  ctx.fill();
  ctx.restore();
}

function drawPickup(ctx, p, t) {
  const bob = Math.sin(t * 3.4 + p.phase) * 3;
  const expiring = p.lifeTime - p.age < 2.5;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  if (expiring && Math.sin(t * 14) > 0) ctx.globalAlpha = 0.35;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 14 - bob, 13, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  if (p.kind === 'milk') {
    ctx.fillStyle = '#f4f6fb';
    roundRect(ctx, -8, -13, 16, 24, 4);
    ctx.fill();
    ctx.fillStyle = '#ff8fa0';
    roundRect(ctx, -8, -3, 16, 8, 2);
    ctx.fill();
    ctx.fillStyle = '#dfe5f2';
    roundRect(ctx, -4, -18, 8, 6, 2);
    ctx.fill();
  } else if (p.kind === 'bell') {
    ctx.fillStyle = '#ffcf4d';
    ctx.beginPath();
    ctx.arc(0, 0, 12, Math.PI * 0.95, Math.PI * 0.05);
    ctx.quadraticCurveTo(0, 16, 0, 0);
    ctx.fill();
    roundRect(ctx, -13, 6, 26, 5, 2.5);
    ctx.fillStyle = '#e0a92e';
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(0, 13, 3.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Yarn ball with strand arcs.
    ctx.fillStyle = '#ff9ecb';
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e87bab';
    ctx.lineWidth = 2;
    for (const a of [-0.6, 0.2, 0.9]) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 3, Math.sin(a) * 3, 9, a, a + 1.9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawGloom(ctx, g, world, t) {
  const wob = Math.sin(t * 5 + g.wobbleSeed) * 0.08;
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.globalAlpha = g.fade;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, g.r * 0.85, g.r * 0.85, g.r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  const body = g.kind === 'chaser' ? COLORS.gloomBodyChaser
    : g.kind === 'mini' ? COLORS.gloomBodyMini : COLORS.gloomBody;
  ctx.fillStyle = world.freezeT > 0 ? '#4d5f8a' : body;
  ctx.beginPath();
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    const rr = g.r * (1 + Math.sin(a * 3 + t * 4 + g.wobbleSeed) * 0.05 + wob);
    const px = Math.cos(a) * rr;
    const py = Math.sin(a) * rr * 0.92;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  // Eyes track the cat; chasers get fangs, splitters a crack.
  const look = Math.atan2(world.cat.y - g.y, world.cat.x - g.x);
  const ex = Math.cos(look) * 3;
  const ey = Math.sin(look) * 2;
  ctx.fillStyle = COLORS.gloomEye;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(side * g.r * 0.34 + ex, -g.r * 0.12 + ey, g.r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#241a38';
    ctx.beginPath();
    ctx.arc(side * g.r * 0.34 + ex * 1.7, -g.r * 0.12 + ey * 1.7, g.r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.gloomEye;
  }
  if (g.kind === 'chaser') {
    ctx.fillStyle = '#fff';
    for (const fx of [-7, 0, 7]) {
      ctx.beginPath();
      ctx.moveTo(fx - 3, g.r * 0.34);
      ctx.lineTo(fx + 3, g.r * 0.34);
      ctx.lineTo(fx, g.r * 0.52);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (g.kind === 'splitter') {
    ctx.strokeStyle = 'rgba(255,233,168,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -g.r * 0.8);
    ctx.lineTo(2, -g.r * 0.2);
    ctx.lineTo(-2, g.r * 0.3);
    ctx.lineTo(3, g.r * 0.75);
    ctx.stroke();
  }
  if (world.freezeT > 0) {
    ctx.fillStyle = 'rgba(190, 225, 255, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, g.r * 1.02, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCat(ctx, cat, t) {
  ctx.save();
  ctx.translate(cat.x, cat.y);
  const dashing = cat.dashT > 0;
  if (dashing) {
    ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    for (const off of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(-cat.dashDirX * 18, -cat.dashDirY * 18 + off * 0.4);
      ctx.lineTo(-cat.dashDirX * 52, -cat.dashDirY * 52 + off);
      ctx.stroke();
    }
  }
  if (cat.graceT > 0 && !dashing && Math.sin(t * 26) > 0) ctx.globalAlpha = 0.45;

  const bob = cat.moving ? Math.abs(Math.sin(cat.walkPhase)) * 3 : Math.sin(t * 2.2) * 1.2;
  ctx.translate(0, -bob);
  ctx.scale(cat.face, 1);

  // Shadow (unflipped, under the body).
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 17 + bob, 19, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail: a wagging curve behind the body.
  const wag = Math.sin(cat.walkPhase * 0.9 + t * 2) * 5;
  ctx.strokeStyle = COLORS.catShade;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.quadraticCurveTo(-26, 2 + wag, -24, -10 + wag);
  ctx.stroke();
  ctx.strokeStyle = '#f4f5f9';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-24.6, -6 + wag);
  ctx.quadraticCurveTo(-24.6, -9 + wag, -24, -10 + wag);
  ctx.stroke();

  // Body and head.
  ctx.fillStyle = COLORS.catFur;
  ctx.beginPath();
  ctx.ellipse(0, 6, 17, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(3, -9, 14.5, 0, Math.PI * 2);
  ctx.fill();

  // Ears with pink linings.
  for (const side of [-1, 1]) {
    ctx.fillStyle = COLORS.catFur;
    ctx.beginPath();
    ctx.moveTo(3 + side * 12 - 6, -17);
    ctx.lineTo(3 + side * 13, -30);
    ctx.lineTo(3 + side * 12 + 6, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.catEarPink;
    ctx.beginPath();
    ctx.moveTo(3 + side * 12 - 2.5, -18.5);
    ctx.lineTo(3 + side * 12.6, -25.5);
    ctx.lineTo(3 + side * 12 + 3.4, -17.6);
    ctx.closePath();
    ctx.fill();
  }

  // Face: kind eyes, a tiny fang, whiskers.
  ctx.fillStyle = '#2c2f42';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(3 + side * 6, -10, 2.1, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e87b90';
  ctx.beginPath();
  ctx.moveTo(1.4, -5.4);
  ctx.lineTo(4.6, -5.4);
  ctx.lineTo(3, -3.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(5.4, -2.4);
  ctx.lineTo(8, -2.4);
  ctx.lineTo(6.6, 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,64,84,0.55)';
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    for (const dy of [-2, 1]) {
      ctx.beginPath();
      ctx.moveTo(3 + side * 10, -5 + dy);
      ctx.lineTo(3 + side * 19, -6 + dy * 2);
      ctx.stroke();
    }
  }

  // Collar and bell.
  ctx.strokeStyle = COLORS.catCollar;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(3, -1, 10.5, Math.PI * 0.25, Math.PI * 0.8);
  ctx.stroke();
  ctx.fillStyle = '#ffcf4d';
  ctx.beginPath();
  ctx.arc(9.5, 5.5, 3.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Carried stars orbit the cat's head.
  for (let i = 0; i < cat.carried; i++) {
    const a = t * 2.6 + (i * Math.PI * 2) / Math.max(1, cat.carried);
    const sx = cat.x + Math.cos(a) * 26;
    const sy = cat.y - 30 + Math.sin(a) * 6;
    starPath(ctx, sx, sy, 7, a);
    ctx.fillStyle = COLORS.star;
    ctx.fill();
  }
}

function drawHeart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-13, -3, -8, -13, 0, -6);
  ctx.bezierCurveTo(8, -13, 13, -3, 0, 7);
  ctx.closePath();
  ctx.fillStyle = filled ? COLORS.heart : 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.restore();
}

function drawHUD(ctx, world) {
  const cat = world.cat;
  // Top strip.
  ctx.fillStyle = 'rgba(10, 12, 28, 0.55)';
  roundRect(ctx, 14, 12, VIEW_W - 28, 52, 14);
  ctx.fill();

  for (let i = 0; i < CAT.maxHearts; i++) drawHeart(ctx, 48 + i * 34, 40, i < world.hearts);

  ctx.fillStyle = COLORS.textMain;
  ctx.font = '800 25px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${world.wave + 1} / ${WAVES.length}`, VIEW_W / 2, 47);

  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.accent;
  ctx.font = '800 27px system-ui, sans-serif';
  ctx.fillText(`${world.score}`, VIEW_W - 130, 47);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('SCORE', VIEW_W - 36, 47);

  // Lantern progress, left under the strip.
  let lx = 30;
  ctx.textAlign = 'left';
  ctx.font = '700 14px system-ui, sans-serif';
  ctx.fillStyle = COLORS.textDim;
  ctx.fillText('LANTERNS', 26, 92);
  lx = 112;
  for (const l of world.lanterns) {
    ctx.fillStyle = l.lit ? '#ffbe55' : 'rgba(255,255,255,0.22)';
    roundRect(ctx, lx, 78, 15, 19, 4);
    ctx.fill();
    lx += 22;
  }

  // Carried stars and combo, right under the strip.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '700 14px system-ui, sans-serif';
  const mult = world.multiplier().toFixed(1);
  ctx.fillText(`COMBO x${mult}`, VIEW_W - 26, 92);
  for (let i = 0; i < CAT.starCapacity; i++) {
    const sx = VIEW_W - 140 - (CAT.starCapacity - 1 - i) * 20;
    starPath(ctx, sx, 86, 8, 0);
    ctx.fillStyle = i < cat.carried ? COLORS.star : 'rgba(255,255,255,0.2)';
    ctx.fill();
  }

  // Dash readiness + active effects, bottom left.
  ctx.textAlign = 'left';
  ctx.font = '700 13px system-ui, sans-serif';
  const dashReady = cat.dashCd <= 0;
  ctx.fillStyle = dashReady ? '#a8e6ff' : 'rgba(255,255,255,0.35)';
  ctx.fillText(dashReady ? 'DASH READY (Space)' : 'DASH …', 26, VIEW_H - 16);
  let fx = 210;
  if (world.freezeT > 0) {
    ctx.fillStyle = '#a8d8ff';
    ctx.fillText(`FROZEN ${world.freezeT.toFixed(0)}s`, fx, VIEW_H - 16);
    fx += 110;
  }
  if (world.magnetT > 0) {
    ctx.fillStyle = '#ffb0e0';
    ctx.fillText(`MAGNET ${world.magnetT.toFixed(0)}s`, fx, VIEW_H - 16);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(245,241,230,0.5)';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText('Move WASD / Arrows · Dash Space · Pause P · Mute M', VIEW_W - 26, VIEW_H - 16);
}

function panel(ctx, w, h) {
  const x = (VIEW_W - w) / 2;
  const y = (VIEW_H - h) / 2;
  ctx.fillStyle = 'rgba(13, 15, 34, 0.88)';
  roundRect(ctx, x, y, w, h, 22);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 217, 77, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 22);
  ctx.stroke();
  return { x, y };
}

function drawTitle(ctx, world, t) {
  ctx.fillStyle = 'rgba(10, 11, 26, 0.35)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.star;
  ctx.font = '900 86px system-ui, sans-serif';
  ctx.save();
  ctx.shadowColor = 'rgba(255, 190, 85, 0.65)';
  ctx.shadowBlur = 34;
  ctx.fillText('LANTERN PAWS', VIEW_W / 2, 168);
  ctx.restore();
  ctx.fillStyle = COLORS.textMain;
  ctx.font = '600 24px system-ui, sans-serif';
  ctx.fillText('A Moonlit Garden Dash', VIEW_W / 2, 208);

  const { x, y } = panel(ctx, 620, 218);
  ctx.fillStyle = COLORS.textMain;
  ctx.font = '600 19px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const lines = [
    '★  Gather fallen stars — carry up to 5 at a time.',
    '★  Bring them to a stone lantern to light it.',
    '★  Carrying more stars raises your COMBO …',
    '     but a Gloom’s touch spills them all, and a heart.',
    '➤  Dash (Space) straight through Glooms to bump them!',
    '♥  Light every lantern in all 5 waves to win.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, x + 36, y + 48 + i * 29));

  // The start prompt pulses but never fully blinks away, so the title
  // screen always shows how to begin — screenshots included.
  ctx.save();
  ctx.globalAlpha = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(t * 3.4));
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accent;
  ctx.font = '800 27px system-ui, sans-serif';
  ctx.fillText('Press ENTER or CLICK to start', VIEW_W / 2, 632);
  ctx.restore();
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Move: WASD / Arrows / hold mouse · Dash: Space · Pause: P · Sound: M', VIEW_W / 2, 656);
}

function drawEndScreen(ctx, world, victory) {
  ctx.fillStyle = 'rgba(10, 11, 26, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const { x, y } = panel(ctx, 560, 330);
  ctx.textAlign = 'center';
  ctx.fillStyle = victory ? COLORS.star : '#c9a8ff';
  ctx.font = '900 47px system-ui, sans-serif';
  ctx.fillText(victory ? 'THE GARDEN GLOWS!' : 'THE GLOOMS GOT YOU', VIEW_W / 2, y + 76);
  ctx.fillStyle = COLORS.textMain;
  ctx.font = '600 20px system-ui, sans-serif';
  ctx.fillText(
    victory ? 'Every lantern is lit. Mochi can nap at last.' : `The dark crept in on wave ${world.wave + 1}…`,
    VIEW_W / 2, y + 112,
  );
  const mins = Math.floor(world.timePlayed / 60);
  const secs = Math.floor(world.timePlayed % 60).toString().padStart(2, '0');
  const stats = [
    ['Final score', `${world.score}`],
    ['Lanterns lit', `${world.starsLitTotal}`],
    ['Glooms bumped', `${world.bumpsTotal}`],
    ['Time in the garden', `${mins}:${secs}`],
  ];
  ctx.font = '600 20px system-ui, sans-serif';
  stats.forEach(([k, v], i) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.textDim;
    ctx.fillText(k, x + 70, y + 158 + i * 34);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.textMain;
    ctx.fillText(v, x + 490, y + 158 + i * 34);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.accent;
  ctx.font = '800 23px system-ui, sans-serif';
  ctx.fillText('Press ENTER or CLICK to play again', VIEW_W / 2, y + 158 + 4 * 34 + 6);
}

export function render(ctx, world, t) {
  ctx.save();
  if (world.shakeT > 0) {
    const s = world.shakeT * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx, world, t);

  const lanterns = world.state === 'title' ? world.ambientLanterns : world.lanterns;
  for (const l of lanterns) drawLantern(ctx, l, t);

  if (world.state !== 'title') {
    for (const s of world.stars) drawStarItem(ctx, s, t);
    for (const p of world.pickups) drawPickup(ctx, p, t);
    for (const g of world.glooms) drawGloom(ctx, g, world, t);
    drawCat(ctx, world.cat, t);

    for (const p of world.particles) {
      ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = '800 17px system-ui, sans-serif';
    for (const ft of world.texts) {
      ctx.globalAlpha = Math.max(0, 1 - ft.age / ft.life);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;

    drawHUD(ctx, world);

    if (world.bannerT > 0 && world.state === 'playing') {
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.textMain;
      ctx.font = '900 54px system-ui, sans-serif';
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 16;
      ctx.fillText(`WAVE ${world.wave + 1}`, VIEW_W / 2, 300);
      ctx.font = '600 21px system-ui, sans-serif';
      ctx.fillStyle = COLORS.star;
      ctx.fillText(
        WAVES[world.wave].greatLantern ? 'Light every lantern — and the Great Lantern!' : 'Light every lantern!',
        VIEW_W / 2, 336,
      );
      ctx.restore();
    }

    if (world.state === 'waveclear') {
      ctx.fillStyle = 'rgba(10, 11, 26, 0.35)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.star;
      ctx.font = '900 56px system-ui, sans-serif';
      ctx.fillText(`WAVE ${world.wave + 1} CLEAR!`, VIEW_W / 2, 330);
      ctx.fillStyle = COLORS.textMain;
      ctx.font = '600 22px system-ui, sans-serif';
      ctx.fillText(`+${300} wave bonus — the garden glows brighter…`, VIEW_W / 2, 368);
    }

    if (world.paused) {
      ctx.fillStyle = 'rgba(10, 11, 26, 0.6)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.textAlign = 'center';
      ctx.fillStyle = COLORS.textMain;
      ctx.font = '900 52px system-ui, sans-serif';
      ctx.fillText('PAUSED', VIEW_W / 2, 350);
      ctx.font = '600 20px system-ui, sans-serif';
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText('Press P to keep playing', VIEW_W / 2, 388);
    }

    if (world.state === 'victory') drawEndScreen(ctx, world, true);
    if (world.state === 'gameover') drawEndScreen(ctx, world, false);
  } else {
    drawCat(ctx, { ...world.cat, x: 640, y: 556, moving: false, carried: 0, dashT: 0, graceT: 0 }, t);
    drawTitle(ctx, world, t);
  }
  ctx.restore();
}
