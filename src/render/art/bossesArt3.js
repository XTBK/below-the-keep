// The second boss roster. Same layout as bossesArt2.js:
//   0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death, 11 cast. Row 1 = mirrored. y points DOWN.

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CREATURES as C, CHAPTERS } from '../../data/palettes.js';

const IRON = S.iron;
const BONE = CHAPTERS.catacombs.bone;
const H = CHAPTERS.hollow;
const HA = CHAPTERS.halls;
const FUR = ['#16120e', '#2a221c', '#40342a', '#5a4a3c', '#786454'];
const ROBE = ['#16100c', '#2a1e16', '#40301f', '#58432c'];
const BLACK = ['#08060a', '#140e18', '#221828', '#32243a'];
const LINEN = C.linen;
const TOAD = ['#1a2410', '#2e3e18', '#4a5c24', '#6a7e34', '#94a858'];
const MOTH = ['#2a2418', '#4a4030', '#7a6a4c', '#a8946c', '#d8c8a0'];
const STONE = ['#1a1a1e', '#2c2c32', '#42424a', '#5a5a64', '#76767f'];
const MOLTEN = ['#120806', '#2a120a', '#44200e', '#5e2c14'];
const ASH = ['#1a1614', '#2e2824', '#46403a', '#625a52', '#857c72'];

function poseFor(col) {
  if (col < 2) return { k: 'idle', i: col, bob: col };
  if (col < 6) return { k: 'walk', i: col - 2, bob: (col - 2) % 2 ? -1 : 0 };
  if (col === 6) return { k: 'windup', bob: 0 };
  if (col === 7) return { k: 'attack', bob: 0 };
  if (col < 11) return { k: 'death', i: col - 8, bob: 0 };
  return { k: 'cast', bob: 0 };
}
function lifts(pose) {
  if (pose.k !== 'walk') return [0, 0];
  return [[2, 0], [0, 0], [0, 2], [0, 0]][pose.i];
}
function makeSheet(w, h, draw) {
  return (col, row) => {
    const p = new Painter(w, h);
    draw(p, poseFor(col));
    p.outline(S.outline);
    return row === 0 ? p : p.mirrored();
  };
}
function limb(p, x0, y0, x1, y1, ramp, h, thick = 3) {
  for (let t = 0; t < thick; t++) p.line(x0 + t - 1, y0, x1 + t - 1, y1, ramp[Math.min(ramp.length - 1, 1 + (t === 1 ? 1 : 0))], h);
}
function eyes(p, x, y, c, h, gap = 3, s = 1.5) {
  p.lit(x, y, c, h, s);
  p.lit(x + gap, y, c, h, s);
}
function crumble(p, seed, amount) {
  const rng = new Rng(seed);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.filled(x, y) && rng.chance(amount)) p.px(x, y, '#000000', 0, 0);
}
function pile(p, w, h, ramp, i) {
  p.ellipse(w / 2, h - 6, w * 0.36 - i * 2, 5, ramp, 3);
}
function skull(p, cx, cy, h, r = 3.4) {
  p.ellipse(cx, cy, r, r * 0.95, BONE, h);
  p.px(cx - 1, cy, '#0e0a06', h - 1);
  p.px(cx + 1, cy, '#0e0a06', h - 1);
  p.hline(cx - 1, cx + 1, cy + Math.round(r * 0.7), BONE[1], h - 0.5);
}
function castRing(p, cx, cy, rx, ry, c, h) {
  for (let a = 0; a < 28; a++) {
    const t = (a / 28) * Math.PI * 2;
    p.lit(cx + Math.cos(t) * rx, cy + Math.sin(t) * ry, c, h, 1.2);
  }
}
function robeShape(p, cx, top, bottom, w0, slope, ramp, h, b) {
  for (let y = top; y < bottom; y++) {
    const w = w0 + (y - top) * slope;
    for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) p.px(x, y + (y > bottom - 3 ? 0 : b), ramp[1 + ((x + y) % 7 === 0 ? 1 : 0)], h);
  }
}
const up = (pose) => pose.k === 'windup' || pose.k === 'cast';

// ===================== THE CELLS =====================

export const mastiffFrame = makeSheet(64, 44, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(32, 38, 22 - pose.i * 2, 5, FUR, 3);
    p.ellipse(34, 41, 12 + pose.i * 4, 2.5, C.blood, 2);
    return;
  }
  const crouch = pose.k === 'windup' ? 5 : 0;
  const lunge = pose.k === 'attack' ? 6 : 0;
  for (const [x, ph] of [[14, 0], [20, 2], [38, 1], [44, 3]]) {
    const sw = pose.k === 'walk' ? ((pose.i + ph) % 4 < 2 ? 3 : -3) : 0;
    limb(p, x, 26 + b + crouch, x + sw, 42, FUR, 4);
  }
  p.ellipse(30 + lunge / 2, 22 + b + crouch, 20 + lunge, 11, FUR, 8);
  for (const x of [18, 24, 31, 37]) p.line(x, 14 + b + crouch, x + 3, 19 + b + crouch, C.blood[3], 8.4); // old scars
  const hx = 50 + lunge;
  const hy = 16 + b + crouch;
  p.ellipse(hx, hy, 9, 8, FUR, 9);
  p.ellipse(hx + 7, hy + 4, 5, 4, FUR.slice(1), 9);
  p.px(hx + 11, hy + 2, '#0a0a0a', 9.4);
  eyes(p, hx - 1, hy - 3, '#ff9a20', 9.6, 5);
  p.line(hx - 6, hy - 6, hx - 5, hy - 12, FUR[3], 9.2);
  for (let x = hx - 8; x <= hx + 2; x++) p.px(x, hy + 7, x % 2 ? IRON[5] : IRON[2], 9.6); // the iron collar
  p.line(hx - 3, hy + 8, hx - 3, hy + 13, IRON[3], 9.6); // a broken chain
  if (pose.k !== 'idle' && pose.k !== 'walk') {
    p.hline(hx + 3, hx + 11, hy + 8, '#200808', 9.4);
    for (let x = hx + 4; x < hx + 11; x += 2) p.px(x, hy + 7, C.teeth[2], 9.6);
  }
  if (pose.k === 'cast') for (let i = 0; i < 5; i++) p.lit(hx + 12 + i * 2, hy - 2 - i, '#d8d0c0', 9, 0.6); // a howl
  limb(p, 10, 20 + b + crouch, 3, 12 + b, FUR, 7);
});

export const friarFrame = makeSheet(64, 64, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    pile(p, 64, 64, ROBE, pose.i);
    p.ellipse(32, 60, 14 + pose.i * 4, 3, C.goo, 2);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(22, 50 + b, 7, 13 - ll, ROBE, 4);
  p.cyl(36, 50 + b, 7, 13 - rl, ROBE, 4);
  const swell = pose.k === 'windup' ? 3 : 0;
  p.ellipse(32, 34 + b, 20 + swell, 18 + swell, ROBE.concat(['#6a5238']), 8); // the vast belly
  p.ellipse(32, 38 + b, 12 + swell, 10 + swell, C.jailerSkin, 8.6); // bare where the habit won't close
  p.hline(14, 50, 28 + b, '#a8946a', 8.8); // a straining rope belt
  for (const [x, y] of [[26, 40], [37, 36], [31, 44]]) p.ellipse(x, y + b, 1.5, 1.2, C.goo, 8.8); // stains
  p.ellipse(32, 13 + b, 9, 9, C.jailerSkin, 10); // jowly face
  p.ellipse(32, 6 + b, 5, 2, C.jailerSkin.slice(2), 10.4); // tonsure
  p.ellipse(32, 9 + b, 10, 4, ROBE, 10.2);
  eyes(p, 28, 12 + b, '#ffe080', 10.6, 8, 1.1);
  const open = pose.k === 'attack' || pose.k === 'cast';
  p.ellipse(32, 18 + b, open ? 4 : 3, open ? 3 : 1, ['#2a0a08', '#4a1410'], 10.4, false);
  if (open) for (let i = 0; i < 6; i++) p.px(30 + i, 22 + i * 2, C.goo[2 + (i % 2)], 10.6);
  for (const s of [-1, 1]) limb(p, 32 + s * 17, 28 + b, 32 + s * (up(pose) ? 25 : 22), up(pose) ? 10 : 44 + b, C.jailerSkin, 9, 4);
  p.ellipse(44, 46 + b, 4, 4, S.wood, 9.2); // a tankard
});

export const ratkingFrame = makeSheet(64, 48, (p, pose) => {
  const b = pose.bob;
  const rng = new Rng(700);
  if (pose.k === 'death') {
    for (let i = 0; i < 12 - pose.i * 3; i++) p.ellipse(rng.int(10, 54), rng.int(36, 44), 3, 2, C.ratFur, 3);
    return;
  }
  const writhe = pose.k === 'walk' ? pose.i : pose.i || 0;
  // a knot of rats, tails tangled into one crown
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + writhe * 0.3;
    const x = 32 + Math.cos(a) * 15;
    const y = 30 + b + Math.sin(a) * 9;
    p.ellipse(x, y, 7, 4.5, C.ratFur, 6 + Math.sin(a) * 2);
    p.ellipse(x + Math.cos(a) * 6, y + Math.sin(a) * 3, 2.5, 2, C.ratPink, 7 + Math.sin(a) * 2);
    p.lit(x + Math.cos(a) * 4, y - 2, '#ff3a2a', 8.5, 0.9);
  }
  p.ellipse(32, 30 + b, 12, 9, C.ratFur, 8);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    p.line(32 + Math.cos(a) * 3, 30 + b + Math.sin(a) * 2, 32 + Math.cos(a) * 11, 30 + b + Math.sin(a) * 7, C.ratPink[(i % 2) + 1], 8.6); // the knotted tails
  }
  // the biggest rat on top, wearing a tin crown
  const hy = up(pose) ? 6 : 12;
  p.ellipse(32, hy + 6 + b, 8, 6, C.ratFur, 10);
  p.ellipse(39, hy + 8 + b, 4, 3, C.ratPink, 10.2);
  eyes(p, 30, hy + 4 + b, '#ff3a2a', 10.6, 5);
  for (const x of [26, 29, 32, 35, 38]) p.vline(x, hy - 3 + b, hy + b, x === 32 ? HA.gold[3] : HA.gold[2], 11);
  p.hline(26, 38, hy + 1 + b, HA.gold[1], 11);
  if (pose.k === 'attack') for (let x = 42; x < 50; x++) p.px(x, hy + 10 + b, C.teeth[2], 10);
});

export const headsmanFrame = makeSheet(72, 80, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    pile(p, 72, 80, C.jailerSkin, pose.i);
    p.line(10, 74, 50, 70, S.wood[3], 3.4);
    p.ellipse(52, 69, 7, 5, IRON.slice(2, 6), 3.6);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(24, 54 + b, 9, 24 - ll, ['#100c0a', '#1e1814', '#2c241e'], 4);
  p.cyl(38, 54 + b, 9, 24 - rl, ['#100c0a', '#1e1814', '#2c241e'], 4);
  p.ellipse(35, 38 + b, 19, 17, C.jailerSkin, 8); // bare chest
  p.hline(18, 52, 52 + b, S.leather[1], 8.2);
  p.hline(18, 52, 53 + b, S.leather[2], 8.2);
  p.ellipse(35, 16 + b, 10, 11, ['#08060a', '#14100e', '#201a16'], 10); // black executioner's hood
  p.ellipse(35, 8 + b, 5, 4, ['#08060a', '#14100e'], 10.4);
  eyes(p, 31, 16 + b, '#ff4a2a', 10.6, 7, 1.4);
  // the great axe
  const raise = pose.k === 'windup';
  const chop = pose.k === 'attack';
  const hx = raise ? 52 : chop ? 64 : 58;
  const hy = raise ? 4 : chop ? 60 : 42 + b;
  limb(p, 50, 30 + b, hx, hy, C.jailerSkin, 9, 4);
  const ax = raise ? hx - 4 : hx;
  const ay = raise ? hy - 2 : hy;
  p.line(ax, ay, raise ? ax - 10 : ax + 4, raise ? ay - 4 : ay + 18, S.wood[3], 10);
  const bx = raise ? ax - 14 : ax + 2;
  const by = raise ? ay - 8 : ay + 16;
  for (let dy = -8; dy <= 8; dy++) {
    const w = Math.round(Math.sqrt(64 - dy * dy) * 0.9);
    for (let dx = 0; dx <= w; dx++) p.px(bx + dx, by + dy, dx === w ? IRON[5] : IRON[2 + (dx > w - 2 ? 1 : 0)], 10.5);
  }
  if (pose.k === 'cast') castRing(p, 35, 40, 26, 10, HA.lava[2], 11);
  limb(p, 20, 30 + b, 12, 50 + b, C.jailerSkin, 9, 4);
});

export const maidenFrame = makeSheet(56, 72, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    pile(p, 56, 72, IRON.slice(0, 5), pose.i);
    for (let i = 0; i < 6; i++) p.line(10 + i * 7, 66, 12 + i * 7, 60, IRON[4], 4);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(18, 60 + b, 7, 11 - ll, IRON.slice(0, 4), 3);
  p.cyl(30, 60 + b, 7, 11 - rl, IRON.slice(0, 4), 3);
  // the iron casket, shaped like a woman, rivets and a painted face
  const open = up(pose) || pose.k === 'attack' ? 5 : 0;
  for (const side of [-1, 1]) {
    for (let y = 14; y < 62; y++) {
      const w = 13 - Math.abs(y - 34) * 0.18;
      for (let x = 0; x <= w; x++) p.px(28 + side * (x + (open ? open : 0)), y + b, IRON[1 + (x > w - 2 ? 2 : 1)], 8 - x * 0.1);
    }
  }
  if (open) {
    // inside: rows of spikes
    for (let y = 18; y < 58; y += 4) for (let x = 28 - open + 1; x < 28 + open; x += 2) p.px(x, y + b, IRON[5], 7);
    p.lit(28, 36 + b, C.blood[3], 7.5, 0.8);
  }
  for (let y = 18; y < 60; y += 6) for (const s of [-1, 1]) p.px(28 + s * (11 + open), y + b, IRON[5], 8.4);
  p.ellipse(28, 10 + b, 8, 9, IRON.slice(1, 6), 10); // the iron face
  p.ellipse(28, 10 + b, 5, 6, ['#c8c0b0', '#e0d8cc', '#f0ece4'], 10.4); // painted serene face
  p.px(26, 9 + b, '#1a1a1a', 10.6);
  p.px(30, 9 + b, '#1a1a1a', 10.6);
  p.hline(27, 29, 13 + b, '#a02020', 10.6);
  p.lit(26, 10 + b, C.blood[3], 10.6, 0.5); // a tear of blood
  for (const x of [22, 25, 28, 31, 34]) p.vline(x, 1 + b, 3 + b, IRON[4], 10.8); // a crown of nails
  if (pose.k === 'cast') castRing(p, 28, 40, 24, 9, '#c0c8d8', 11);
});

// ===================== THE CATACOMBS =====================

export const choirFrame = makeSheet(64, 56, (p, pose) => {
  const f = Math.round(Math.sin((pose.i || 0) * 1.4) * 2);
  if (pose.k === 'death') {
    for (let i = 0; i < 7 - pose.i * 2; i++) skull(p, 10 + i * 7, 48 - (i % 2) * 2, 3, 3);
    return;
  }
  // a ring of floating skulls around a shroud of grave-mist, singing
  for (let y = 18; y < 52; y++) for (let x = 20; x < 44; x++) if ((x - 32) ** 2 / 144 + (y - 32) ** 2 / 300 < 1 && (x + y) % 3) p.px(x, y + f, ['#22303a', '#344652', '#4a5e6a'][(x * y) % 3], 3);
  const open = up(pose) || pose.k === 'attack';
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (pose.i || 0) * 0.2;
    const x = 32 + Math.cos(a) * 22;
    const y = 26 + f + Math.sin(a) * 12;
    const h = 6 + Math.sin(a) * 3;
    skull(p, x, y, h, 4.2);
    if (open) p.ellipse(x, y + 3, 1.6, 1.2, ['#020203'], h + 0.2, false);
    p.lit(x - 1, y, H.glowTeal[3], h + 0.4, 1);
    p.lit(x + 1, y, H.glowTeal[3], h + 0.4, 1);
  }
  skull(p, 32, 22 + f, 11, 7); // the choirmaster
  p.lit(30, 22 + f, H.glowTeal[3], 11.4, 1.6);
  p.lit(34, 22 + f, H.glowTeal[3], 11.4, 1.6);
  if (open) for (let k = 0; k < 3; k++) castRing(p, 32, 26 + f, 10 + k * 8, 5 + k * 4, '#c0f0ff', 12);
});

export const gravemotherFrame = makeSheet(72, 48, (p, pose) => {
  const b = pose.bob;
  const SPIDER = ['#0e0c0a', '#1c1814', '#2c2620', '#3e362c', '#544a3e'];
  if (pose.k === 'death') {
    p.ellipse(36, 40, 18 - pose.i * 2, 5, SPIDER, 3);
    for (let i = 0; i < 8; i++) p.line(36, 40, 12 + i * 7, 44 - (i % 2) * 4, SPIDER[2], 3.4);
    return;
  }
  const rear = pose.k === 'windup' ? -6 : 0;
  for (let k = 0; k < 4; k++) {
    for (const s of [-1, 1]) {
      const sw = pose.k === 'walk' ? ((pose.i + k) % 2 ? 3 : -3) : 0;
      const kx = 36 + s * (14 + k * 3);
      const ky = 18 + b + k * 2 + (k === 0 ? rear : 0);
      p.line(36 + s * 6, 26 + b, kx, ky, SPIDER[3], 5);
      p.line(kx, ky, kx + s * 8 + sw, 44, SPIDER[2], 5);
    }
  }
  p.ellipse(24, 26 + b, 16, 12, SPIDER, 7); // the swollen abdomen, a skull pattern on it
  skull(p, 22, 25 + b, 7.4, 4);
  p.ellipse(44, 24 + b + rear / 2, 9, 7, SPIDER, 8);
  for (const [x, y] of [[46, 21], [49, 22], [45, 24], [50, 25], [47, 26], [51, 20]]) p.lit(x, y + b + rear / 2, '#ff2a2a', 8.6, 1);
  p.line(50, 28 + b, 54, 32 + b, BONE[3], 8.8); // fangs
  p.line(47, 29 + b, 49, 33 + b, BONE[3], 8.8);
  if (pose.k === 'attack' || pose.k === 'cast') for (let i = 0; i < 6; i++) p.px(56 + i * 2, 30 + (i % 2), '#e0e0d8', 9);
});

export const physicianFrame = makeSheet(56, 64, (p, pose) => {
  const b = pose.bob;
  const COAT = ['#0c0c0a', '#181814', '#26261e', '#36362a'];
  if (pose.k === 'death') {
    pile(p, 56, 64, COAT, pose.i);
    p.ellipse(32, 58, 5, 3, S.leather, 3.4); // the mask falls
    for (let i = 0; i < 5; i++) p.lit(14 + i * 6, 56 - pose.i * 4, C.goo[3], 3, 0.6);
    return;
  }
  const [ll, rl] = lifts(pose);
  robeShape(p, 28, 22, 60, 8, 0.38, COAT, 6, b);
  p.cyl(20, 56, 5, 7 - ll, COAT, 4);
  p.cyl(31, 56, 5, 7 - rl, COAT, 4);
  p.hline(18, 38, 34 + b, S.leather[2], 6.4);
  for (const x of [20, 24, 32]) p.rect(x, 35 + b, 3, 5, ['#2a4a1a', '#4a8a2a', '#8ac040'][x % 3], 6.6); // vials on the belt
  // the wide hat and the long beaked mask
  p.hline(14, 42, 6 + b, COAT[2], 10);
  p.ellipse(28, 3 + b, 8, 4, COAT, 10.4);
  p.ellipse(26, 12 + b, 6, 6, S.leather, 9.6);
  for (let i = 0; i < 14; i++) p.vline(30 + i, 12 + b + Math.floor(i / 2), 14 + b + Math.floor(i / 3), S.leather[1 + (i < 6 ? 1 : 0)], 9.8 - i * 0.2);
  p.ellipse(24, 11 + b, 2, 2, ['#2a3a2a', '#9af09a', '#e0ffe0'], 10);
  p.lit(24, 11 + b, '#9af09a', 10.2, 1.2);
  const raise = up(pose);
  const hx = raise ? 46 : pose.k === 'attack' ? 50 : 42;
  const hy = raise ? 8 : 26 + b;
  limb(p, 36, 22 + b, hx, hy + 4, COAT, 8);
  p.ellipse(hx, hy, 3, 4, ['#1a3a10', '#3a7a20', '#7aff6a'], 9); // a flask of plague
  p.lit(hx, hy - 1, '#7aff6a', 9.4, 1.4);
  limb(p, 20, 22 + b, 12, 38 + b, COAT, 8);
  p.line(12, 38 + b, 8, 30 + b, S.wood[3], 8); // the pointing cane
});

export const lichFrame = makeSheet(56, 72, (p, pose) => {
  const f = Math.round(Math.sin((pose.i || 0) * 1.3) * 2);
  if (pose.k === 'death') {
    pile(p, 56, 72, BLACK, pose.i);
    skull(p, 28, 64, 3.6, 5);
    crumble(p, 300 + pose.i, 0.15 * pose.i);
    return;
  }
  // a skeleton king in rotted robes, floating, its phylactery glowing at its chest
  robeShape(p, 28, 22, 66, 8, 0.32, BLACK, 6, f);
  for (let x = 16; x < 42; x += 3) p.lit(x, 64 + f - (x % 2), H.glowPurple[2], 6.4, 0.7);
  p.ellipse(28, 32 + f, 4, 5, ['#2a0a3a', '#6a2a9a', '#c08aff'], 7); // the phylactery
  for (let y = -5; y < 6; y++) for (let x = -4; x < 5; x++) if (x * x + y * y < 18) p.glow(28 + x, 32 + f + y, '#c08aff', 1.3);
  skull(p, 28, 14 + f, 10, 7);
  p.lit(25, 14 + f, '#c08aff', 10.6, 1.8);
  p.lit(31, 14 + f, '#c08aff', 10.6, 1.8);
  for (const x of [21, 24, 28, 32, 35]) p.vline(x, 4 + f + Math.abs(x - 28) * 0.3, 8 + f, IRON[x === 28 ? 5 : 4], 11); // a rusted iron crown
  const raise = up(pose) || pose.k === 'attack';
  for (const s of [-1, 1]) {
    const hx = 28 + s * (raise ? 22 : 16);
    const hy = raise ? 10 + f : 38 + f;
    p.line(28 + s * 7, 24 + f, hx, hy, BONE[2], 9);
    p.line(28 + s * 8, 24 + f, hx + s, hy, BONE[1], 9);
    for (let k = -1; k <= 1; k++) p.line(hx, hy, hx + s * 2 + k, hy - 3, BONE[3], 9.2);
    if (raise) p.lit(hx, hy - 2, '#c08aff', 9.6, 1.6);
  }
});

export const entombedFrame = makeSheet(56, 72, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    pile(p, 56, 72, LINEN, pose.i);
    for (let i = 0; i < 6; i++) p.line(8 + i * 7, 66, 12 + i * 7, 62, LINEN[3], 3.4);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(19, 54 + b, 7, 16 - ll, LINEN, 4);
  p.cyl(30, 54 + b, 7, 16 - rl, LINEN, 4);
  p.cyl(14, 22 + b, 28, 34, LINEN, 7);
  for (let y = 23; y < 56; y += 2) for (let x = 14; x < 42; x++) if ((x + y) % 6 < 2) p.px(x, y + b, LINEN[1], 7.2);
  // the bishop's rotting vestments over the linen
  p.rect(24, 22 + b, 8, 34, HA.crimson[1], 7.4);
  p.vline(28, 24 + b, 54 + b, HA.gold[1], 7.6);
  p.ellipse(28, 13 + b, 8, 9, LINEN, 9);
  for (let y = 6; y < 21; y += 2) p.hline(21, 35, y + b, LINEN[1], 9.2);
  eyes(p, 25, 13 + b, HA.gold[3], 9.6, 6, 1.6);
  for (let i = 0; i < 10; i++) p.hline(22 + Math.floor(i / 3), 34 - Math.floor(i / 3), 4 + b - i, i % 3 === 0 ? HA.gold[3] : '#c8c0a0', 10); // a tall mitre
  const raise = up(pose) || pose.k === 'attack';
  for (const s of [-1, 1]) {
    limb(p, 28 + s * 13, 26 + b, 28 + s * (raise ? 24 : 18), raise ? 12 : 46 + b, LINEN, 8);
    if (pose.k === 'attack') for (let x = 0; x < 10; x++) p.px(28 + s * (24 + x), 12 + Math.round(Math.sin(x)), LINEN[3], 8.2); // bandages lash out
  }
  if (pose.k === 'cast') castRing(p, 28, 40, 24, 9, HA.gold[3], 11);
});

// ===================== THE HOLLOW =====================

export const greattoadFrame = makeSheet(72, 56, (p, pose) => {
  if (pose.k === 'death') {
    p.ellipse(36, 48, 26 - pose.i * 2, 6, TOAD, 3);
    return;
  }
  const crouch = pose.k === 'windup' ? 4 : 0;
  const air = pose.k === 'walk' && (pose.i === 1 || pose.i === 2) ? -6 : 0;
  p.ellipse(16, 44 + air, 9, 6, TOAD, 4); // back legs
  p.ellipse(54, 44 + air, 9, 6, TOAD, 4);
  p.ellipse(36, 34 + crouch + air, 26, 17 - crouch / 2, TOAD, 8);
  p.ellipse(36, 40 + crouch + air, 18, 9, ['#8a9a50', '#b8c880', '#d8e0a8'], 8.4); // pale belly
  const rng = new Rng(77);
  for (let i = 0; i < 22; i++) p.ellipse(rng.int(14, 58), rng.int(22, 40) + crouch + air, 1.4, 1.2, TOAD.slice(2), 8.6); // warts
  for (const x of [26, 46]) {
    p.ellipse(x, 18 + crouch + air, 6, 5, TOAD, 9);
    p.ellipse(x, 17 + crouch + air, 3.5, 3.5, ['#4a4010', '#ffd040', '#fff0a0'], 9.4);
    p.vline(x, 15 + crouch + air, 19 + crouch + air, '#0a0a0a', 9.6);
  }
  for (const [x, y] of [[30, 13], [34, 11], [38, 11], [42, 13]]) p.px(x, y + crouch + air, HA.gold[2], 9.6); // a crown of bog-gold
  p.hline(20, 52, 30 + crouch + air, TOAD[0], 9);
  if (pose.k === 'attack') {
    for (let x = 52; x < 72; x++) p.px(x, 30, C.tongue[2], 9);
    p.ellipse(70, 30, 2.4, 2.4, C.tongue, 9.2);
  }
  if (pose.k === 'cast') p.ellipse(36, 34, 6, 4, ['#2a0a08', '#4a1410'], 9.4, false);
});

export const matronFrame = makeSheet(64, 64, (p, pose) => {
  const CAP = ['#24082a', '#40124a', '#62226e', '#8a3698'];
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(32, 58, 18 - pose.i * 3, 4, CAP, 3);
    for (let i = 0; i < 6; i++) p.lit(14 + i * 7, 56 - pose.i * 3, H.glowPurple[2], 3, 0.8);
    return;
  }
  const swell = up(pose) ? 3 : 0;
  // a stalk-woman: pale fungal body under a vast cap, glowing gills
  robeShape(p, 32, 30, 62, 7, 0.35, ['#4a4438', '#7a7262', '#a8a08c', '#cac2ae'], 6, b);
  for (let i = 0; i < 6; i++) p.line(24 + i * 3, 60, 22 + i * 4, 63, '#5a5040', 5.5); // root-feet
  p.ellipse(32, 26 + b, 6, 7, ['#7a7262', '#a8a08c', '#d8d0bc'], 8);
  eyes(p, 29, 26 + b, H.glowTeal[3], 8.6, 6, 1.4);
  p.ellipse(32, 15 + b, 26 + swell, 11 + swell, CAP, 10);
  for (let x = 10; x < 54; x += 3) p.lit(x, 22 + b + swell / 2, H.glowTeal[1], 9.6, 0.8); // the glowing gills
  const rng = new Rng(64);
  for (let i = 0; i < 9; i++) p.ellipse(rng.int(12, 52), rng.int(8, 20) + b, 2, 1.5, ['#d8c8e8', '#f0e8ff'], 10.4); // spots
  if (pose.k === 'attack' || pose.k === 'cast') castRing(p, 32, 20, 30, 14, H.glowPurple[2], 11);
  for (const s of [-1, 1]) limb(p, 32 + s * 6, 34 + b, 32 + s * (up(pose) ? 18 : 14), up(pose) ? 26 : 46 + b, ['#4a4438', '#7a7262', '#a8a08c'], 7);
});

export const stagFrame = makeSheet(72, 64, (p, pose) => {
  const HIDE = ['#14100c', '#261e16', '#3a2e22', '#52402e', '#6e5640'];
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(34, 56, 22 - pose.i * 2, 5, HIDE, 3);
    for (let i = 0; i < 8; i++) p.line(16 + i * 5, 54, 18 + i * 5, 48, H.bark[2], 4);
    return;
  }
  const crouch = pose.k === 'windup' ? 5 : 0;
  const stretch = pose.k === 'attack' ? 6 : 0;
  for (const [x, ph] of [[18, 0], [24, 2], [44, 1], [50, 3]]) {
    const sw = pose.k === 'walk' ? ((pose.i + ph) % 4 < 2 ? 4 : -4) : 0;
    limb(p, x, 40 + b + crouch, x + sw + (stretch ? (x < 34 ? -6 : 6) : 0), 62, HIDE, 4);
  }
  p.ellipse(34, 36 + b + crouch, 20 + stretch, 10, HIDE, 8);
  // thorny briars wound through the hide
  for (let i = 0; i < 10; i++) p.line(18 + i * 3.4, 30 + b + crouch, 17 + i * 3.4, 26 + b + crouch, '#c8c0a0', 8.4);
  const hx = 54 + stretch;
  const hy = 22 + b + crouch;
  p.line(48, 32 + b + crouch, hx, hy + 6, HIDE[3], 8.6); // neck
  p.ellipse(hx, hy, 6, 5, HIDE, 9);
  p.ellipse(hx + 5, hy + 3, 3.5, 2.4, HIDE.slice(1), 9);
  eyes(p, hx - 1, hy - 2, H.glowTeal[3], 9.4, 3, 1.3);
  // vast antlers, overgrown with briar and moss
  for (const s of [-1, 1]) {
    const bx = hx - 2 + s * 2;
    p.line(bx, hy - 4, bx - 4 + s * 4, hy - 14, H.bark[3], 10);
    p.line(bx - 4 + s * 4, hy - 14, bx - 10 + s * 8, hy - 22, H.bark[3], 10);
    p.line(bx - 4 + s * 4, hy - 14, bx + s * 10, hy - 18, H.bark[2], 10);
    p.line(bx - 10 + s * 8, hy - 22, bx - 14 + s * 8, hy - 20, H.bark[2], 10);
    p.lit(bx - 10 + s * 8, hy - 23, H.glowTeal[2], 10.4, 0.6);
  }
  if (pose.k === 'cast') castRing(p, 34, 40, 30, 10, '#c8c0a0', 11);
});

export const ancientoakFrame = makeSheet(88, 96, (p, pose) => {
  const b = pose.bob;
  const BARK = H.bark;
  if (pose.k === 'death') {
    p.ellipse(44, 88, 34 - pose.i * 3, 7, BARK, 4);
    for (let i = 0; i < 10; i++) p.line(12 + i * 7, 88, 14 + i * 7, 80 - (i % 3) * 2, BARK[2], 5);
    return;
  }
  const [ll, rl] = lifts(pose);
  for (const [x, l] of [[22, ll], [52, rl]]) {
    p.cyl(x, 68 + b, 14, 26 - l, BARK, 4);
    for (let k = 0; k < 3; k++) p.line(x + 7, 92 - l, x - 4 + k * 9, 95, BARK[1], 4);
  }
  p.cyl(18, 30 + b, 52, 42, BARK, 8);
  for (let x = 20; x < 70; x += 4) p.line(x, 32 + b, x + 2, 70 + b, BARK[1], 8.2);
  // the ancient face: a hollow mouth and deep-set glowing eyes
  p.ellipse(44, 54 + b, 9, 6, ['#060402', '#100a06'], 8.6, false);
  eyes(p, 34, 42 + b, '#a0ff60', 8.8, 20, 2);
  for (const x of [32, 54]) p.hline(x - 4, x + 4, 39 + b, BARK[0], 8.6); // heavy brows
  p.ellipse(44, 18 + b, 40, 18, H.moss, 10);
  for (let i = 0; i < 24; i++) p.lit(8 + i * 3, 10 + b + (i % 4) * 4, H.glowTeal[1], 10.2, 0.4);
  const raise = up(pose);
  const slam = pose.k === 'attack';
  for (const s of [-1, 1]) {
    const x1 = 44 + s * (raise ? 40 : slam ? 38 : 34);
    const y1 = raise ? 8 : slam ? 90 : 64 + b;
    limb(p, 44 + s * 24, 38 + b, x1, y1, BARK, 9, 5);
    for (let k = 0; k < 4; k++) p.line(x1, y1, x1 + s * (k - 1) * 3, y1 + (slam ? 5 : -5), BARK[3], 9.2);
  }
});

export const mothqueenFrame = makeSheet(80, 64, (p, pose) => {
  const f = Math.round(Math.sin((pose.i || 0) * 1.5) * 2);
  if (pose.k === 'death') {
    p.ellipse(40, 56, 14 - pose.i * 3, 3, MOTH, 2);
    for (let i = 0; i < 10; i++) p.px(14 + i * 5, 54 - (i % 3) * 3 - pose.i * 3, MOTH[3], 2.4);
    return;
  }
  const flap = pose.k === 'walk' ? [0, -6, -10, -6][pose.i] : up(pose) ? -12 : 0;
  // four great dusty wings with staring eye-spots
  for (const s of [-1, 1]) {
    for (let y = -16; y < 16; y++) {
      for (let x = 0; x < 30; x++) {
        const nx = x / 30;
        const ny = y / 16;
        if (nx * nx + ny * ny * (1.2 - nx) > 1) continue;
        const yy = 26 + f + y + Math.round(flap * nx * (y < 0 ? 1 : 0.4));
        p.px(40 + s * (6 + x), yy, MOTH[1 + ((x + y * 3) % 7 === 0 ? 2 : (x * 2 + y) % 5 === 0 ? 1 : 0)], 4 + nx);
      }
    }
    const ex = 40 + s * 22;
    const ey = 22 + f + Math.round(flap * 0.6);
    p.ellipse(ex, ey, 5, 4, ['#1a1410', '#5a4a30', '#d8c8a0'], 5.5);
    p.ellipse(ex, ey, 2.4, 2.2, ['#2a1a0a', '#e0a020'], 5.8);
    p.lit(ex, ey, '#ffd060', 6, 0.8);
  }
  p.ellipse(40, 30 + f, 5, 14, MOTH, 8); // the furred body
  for (let y = 20; y < 44; y += 3) p.hline(36, 44, y + f, MOTH[1], 8.2);
  p.ellipse(40, 14 + f, 5, 5, MOTH, 9);
  eyes(p, 37, 13 + f, '#ffd060', 9.6, 6, 1.6);
  for (const s of [-1, 1]) {
    p.line(40 + s * 2, 9 + f, 40 + s * 9, 1 + f, MOTH[3], 9.4); // feathery antennae
    for (let k = 0; k < 4; k++) p.px(40 + s * (4 + k * 1.6), 6 + f - k * 1.6 - 1, MOTH[4], 9.4);
  }
  if (pose.k === 'attack' || pose.k === 'cast') for (let i = 0; i < 14; i++) p.lit(20 + i * 3, 50 + f + (i % 3) * 3, MOTH[4], 6, 0.8); // dust falling
});

// ===================== THE BURNING HALLS =====================

export const courtjesterFrame = makeSheet(56, 64, (p, pose) => {
  const A = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
  const B = ['#3a2a08', '#7a5a14', '#d0aa40', '#f0d880'];
  const b = pose.bob;
  if (pose.k === 'death') {
    pile(p, 56, 64, A, pose.i);
    for (let i = 0; i < 3; i++) p.ellipse(16 + i * 12, 58, 2, 2, S.brass, 3.4);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(20, 40 + b, 6, 22 - ll, A, 4);
  p.cyl(30, 40 + b, 6, 22 - rl, B, 4);
  for (const [x, y] of [[19, 62], [35, 62]]) p.ellipse(x, y - (x < 28 ? ll : rl), 4, 2, A, 4.2); // curled shoes
  p.cyl(18, 20 + b, 10, 21, B, 7);
  p.cyl(28, 20 + b, 10, 21, A, 7);
  for (let x = 18; x < 38; x += 4) p.ellipse(x + 2, 41 + b, 2, 2, x % 8 ? A : B, 7.4); // the dagged hem
  p.ellipse(28, 13 + b, 7, 8, ['#c8c0b0', '#e8e0d4', '#ffffff'], 9);
  p.hline(24, 32, 17 + b, A[2], 9.4); // the painted grin
  p.px(23, 16 + b, A[2], 9.4);
  p.px(33, 16 + b, A[2], 9.4);
  eyes(p, 25, 11 + b, '#1a0a0a', 9.6, 6, 1);
  p.lit(25, 11 + b, '#ff3030', 9.8, 0.5); // something red in its eyes
  for (const [dx, c] of [[-10, A], [0, B], [10, A]]) {
    p.line(28, 6 + b, 28 + dx, b - 2 + Math.abs(dx) * 0.4, c[2], 10);
    p.ellipse(28 + dx, b - 2 + Math.abs(dx) * 0.4, 2, 2, S.brass, 10.4);
  }
  // juggling balls / knives
  const t = pose.i || 0;
  for (let i = 0; i < 3; i++) {
    const a = t * 1.2 + (i / 3) * Math.PI * 2;
    p.ellipse(28 + Math.cos(a) * 16, 4 + b + Math.sin(a) * 6 - 8, 2.4, 2.4, i % 2 ? A : B, 11);
  }
  const throwing = up(pose) || pose.k === 'attack';
  limb(p, 36, 24 + b, throwing ? 50 : 42, throwing ? 10 : 36 + b, B, 8);
  limb(p, 20, 24 + b, throwing ? 6 : 14, throwing ? 10 : 36 + b, A, 8);
  if (throwing) for (const x of [6, 50]) p.line(x, 10, x + (x < 28 ? -2 : 2), 3, IRON[5], 8.6);
});

export const moltenknightFrame = makeSheet(64, 72, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    pile(p, 64, 72, MOLTEN, pose.i);
    for (let i = 0; i < 10; i++) p.lit(10 + i * 4, 66 - (i % 3), HA.lava[2], 3.4, 1.4 - pose.i * 0.35);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(20, 46 + b, 9, 24 - ll, MOLTEN, 5);
  p.cyl(34, 46 + b, 9, 24 - rl, MOLTEN, 5);
  p.cyl(16, 22 + b, 32, 26, MOLTEN, 8);
  for (let y = 24; y < 48; y += 5) for (let x = 18; x < 46; x += 6) p.lit(x + (y % 2) * 3, y + b, HA.lava[1 + (x % 2)], 8.4, 1.2); // glowing seams in the plate
  p.ellipse(14, 24 + b, 7, 6, MOLTEN, 9);
  p.ellipse(50, 24 + b, 7, 6, MOLTEN, 9);
  p.cyl(24, 4 + b, 16, 18, MOLTEN, 10); // a great helm, the visor glowing
  p.hline(26, 38, 12 + b, HA.lava[3], 10.4);
  for (let x = 26; x <= 38; x++) p.glow(x, 12 + b, HA.lava[3], 1.4);
  for (let i = 0; i < 6; i++) p.lit(28 + i * 2, 2 + b - (i % 2) * 2, S.fire[3 + (i % 3)], 10.8, 1.6); // a crest of fire
  const raise = up(pose);
  const strike = pose.k === 'attack';
  const sx = raise ? 52 : strike ? 62 : 54;
  const sy = raise ? 2 : strike ? 54 : 40 + b;
  limb(p, 48, 28 + b, sx, sy + (raise ? 8 : -4), MOLTEN, 9, 4);
  // a sword still glowing from the forge
  const ex = raise ? sx - 2 : sx + 2;
  const ey = raise ? sy - 14 : sy + 14;
  p.line(sx, sy, ex, ey, HA.lava[3], 10.4);
  p.line(sx + 1, sy, ex + 1, ey, HA.lava[2], 10.4);
  for (let k = 0; k < 8; k++) p.glow(sx + ((ex - sx) * k) / 8, sy + ((ey - sy) * k) / 8, HA.lava[3], 1.2);
  if (pose.k === 'cast') castRing(p, 32, 44, 28, 10, HA.lava[3], 11);
});

export const gargoylelordFrame = makeSheet(80, 72, (p, pose) => {
  const f = Math.round(Math.sin((pose.i || 0) * 1.4) * 2);
  if (pose.k === 'death') {
    pile(p, 80, 72, STONE, pose.i);
    for (let i = 0; i < 10; i++) p.ellipse(10 + i * 6, 64 - (i % 3) * 2, 3, 2.4, STONE, 3.4);
    return;
  }
  const flap = pose.k === 'walk' ? [0, -6, -10, -6][pose.i] : up(pose) ? -12 : 0;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) p.line(40 + s * 10, 28 + f, 40 + s * (16 + i * 4), 10 + f + flap + i * 3 + (i % 2) * 6, STONE[2 + (i % 2)], 5);
    p.line(40 + s * 10, 28 + f, 40 + s * 38, 8 + f + flap, STONE[4], 5.5);
  }
  p.ellipse(40, 38 + f, 14, 16, STONE, 8); // hunched stone body
  for (let i = 0; i < 8; i++) p.px(30 + i * 3, 30 + f + (i % 3) * 5, STONE[1], 8.2); // cracks
  p.ellipse(40, 18 + f, 9, 8, STONE, 10);
  for (const s of [-1, 1]) p.line(40 + s * 5, 12 + f, 40 + s * 10, 2 + f, STONE[4], 10.4); // horns
  eyes(p, 35, 17 + f, HA.lava[3], 10.6, 10, 1.8);
  p.hline(34, 46, 23 + f, '#0a0a0c', 10.4);
  for (let x = 35; x < 46; x += 2) p.px(x, 22 + f, BONE[3], 10.6);
  const raise = up(pose) || pose.k === 'attack';
  for (const s of [-1, 1]) {
    limb(p, 40 + s * 10, 34 + f, 40 + s * (raise ? 20 : 16), raise ? 20 + f : 56 + f, STONE, 9);
    for (let k = 0; k < 3; k++) p.line(40 + s * (raise ? 20 : 16), (raise ? 20 : 56) + f, 40 + s * (raise ? 22 : 18) + k - 1, (raise ? 16 : 62) + f, STONE[4], 9.4);
  }
  p.cyl(30, 54 + f, 6, 12, STONE, 4);
  p.cyl(44, 54 + f, 6, 12, STONE, 4);
});

export const ashwingFrame = makeSheet(96, 80, (p, pose) => {
  const SCALE = ['#1a0806', '#3a120a', '#5a1e10', '#7e2c16', '#a03c1e'];
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(48, 72, 34 - pose.i * 3, 6, SCALE, 3);
    for (let i = 0; i < 12; i++) p.lit(16 + i * 5, 70 - (i % 3), HA.lava[2], 3.4, 1.4 - pose.i * 0.4);
    return;
  }
  const flap = pose.k === 'walk' ? [0, -8, -14, -8][pose.i] : up(pose) ? -16 : 0;
  // vast tattered wings
  for (const s of [-1, 1]) {
    for (let i = 0; i < 7; i++) p.line(48 + s * 12, 34 + b, 48 + s * (20 + i * 4), 14 + b + flap + i * 4 + (i % 2) * 7, SCALE[1 + (i % 2)], 4);
    p.line(48 + s * 12, 34 + b, 48 + s * 46, 10 + b + flap, SCALE[3], 4.5);
  }
  const [ll, rl] = lifts(pose);
  p.cyl(34, 56 + b, 9, 22 - ll, SCALE, 5);
  p.cyl(54, 56 + b, 9, 22 - rl, SCALE, 5);
  p.ellipse(46, 46 + b, 20, 15, SCALE, 8);
  p.ellipse(46, 52 + b, 13, 8, ['#6a4a2a', '#9a7040', '#c89a58'], 8.4); // armoured belly
  for (let y = 46; y < 60; y += 3) p.hline(36, 56, y + b, '#5a3a20', 8.6);
  // the long neck and horned head
  const breathe = pose.k === 'attack';
  const hx = breathe ? 82 : 74;
  const hy = up(pose) ? 14 : 26 + b;
  for (let k = 0; k < 8; k++) p.ellipse(56 + ((hx - 56) * k) / 8, 38 + b + ((hy - 38 - b) * k) / 8, 6 - k * 0.2, 6 - k * 0.2, SCALE, 9);
  p.ellipse(hx, hy, 10, 7, SCALE, 10);
  p.ellipse(hx + 8, hy + 3, 6, 4, SCALE.slice(1), 10);
  eyes(p, hx - 2, hy - 3, '#ffe060', 10.6, 4, 1.8);
  for (const d of [-2, 2]) p.line(hx - 6, hy - 4 + d, hx - 14, hy - 12 + d * 2, BONE[3], 10.6); // horns
  if (breathe || pose.k === 'windup') for (let i = 0; i < 8; i++) p.lit(hx + 10 + i, hy + 3 + (i % 2), S.fire[3 + (i % 3)], 10.8, 1.6);
  for (let k = 0; k < 10; k++) p.ellipse(26 - k * 2, 52 + b + k, 4 - k * 0.3, 3 - k * 0.2, SCALE, 6); // tail
});

export const burnedqueenFrame = makeSheet(64, 72, (p, pose) => {
  const f = Math.round(Math.sin((pose.i || 0) * 1.3) * 2);
  const GOWN = ['#120608', '#24100c', '#3a1a12', '#542818'];
  if (pose.k === 'death') {
    p.ellipse(32, 64, 14 - pose.i * 3, 3, GOWN, 3);
    p.ellipse(40, 66, 4, 2.4, HA.gold, 3.4);
    crumble(p, 600 + pose.i, 0.3);
    return;
  }
  // a queen of ash and ember, her gown still burning at the hem, a crown of melted gold
  for (let y = 26; y < 68; y++) {
    const w = 7 + (y - 26) * 0.4;
    for (let x = Math.round(32 - w); x <= Math.round(32 + w); x++) {
      if (y > 60 && (x * 5 + y * 3) % 6 < 2) continue;
      p.px(x, y + f, GOWN[1 + ((x + y) % 5 === 0 ? 1 : 0)], 6);
    }
  }
  for (let x = 16; x < 50; x++) p.lit(x, 66 - ((x * 7) % 5) + f, HA.lava[(x % 3) + 1], 6.4, 1.4);
  for (let i = 0; i < 8; i++) p.lit(18 + i * 4, 58 - (i % 3) * 6 + f, S.fire[3 + (i % 3)], 6.6, 1.2); // flames climbing the gown
  p.ellipse(32, 18 + f, 6, 7, ASH, 9); // ash-grey face
  for (const s of [-1, 1]) p.line(32 + s * 6, 14 + f, 32 + s * 10, 34 + f, ASH[1], 8.6); // long ashen hair
  eyes(p, 29, 17 + f, '#ffe090', 9.6, 6, 1.6);
  p.hline(29, 35, 22 + f, '#2a0a06', 9.4);
  for (const x of [25, 28, 32, 36, 39]) p.vline(x, 6 + f + Math.abs(x - 32) * 0.3, 11 + f, HA.gold[x === 32 ? 3 : 2], 10.4);
  p.hline(25, 39, 11 + f, HA.gold[1], 10.4);
  p.lit(32, 7 + f, '#ff4060', 10.6, 1.2);
  const raise = up(pose) || pose.k === 'attack';
  for (const s of [-1, 1]) {
    const hx = 32 + s * (raise ? 22 : 16);
    const hy = raise ? 10 + f : 40 + f;
    limb(p, 32 + s * 7, 28 + f, hx, hy, ASH, 8, 2);
    p.lit(hx, hy - 1, S.fire[4], 8.6, 1.6);
  }
  if (pose.k === 'cast') castRing(p, 32, 36, 26, 10, S.fire[4], 11);
});
