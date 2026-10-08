// Enemies of chapters 2-4. Every sheet uses the same column layout:
//   0-1 idle, 2-5 walk, 6 wind-up (the telegraph pose), 7 attack, 8-10 death, 11+ extras
// Row 0 faces right, row 1 faces left (mirrored, so lighting stays correct).
// Glowing parts (eyes, flames, magic) use the Painter's glow layer.

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CREATURES as C, CHAPTERS } from '../../data/palettes.js';

const IRON = S.iron;
const BONE = CHAPTERS.catacombs.bone;
const H = CHAPTERS.hollow;
const HA = CHAPTERS.halls;
const DARK = ['#0a0a0c', '#16161a', '#24242a', '#34343c', '#4a4a54'];
const CLOTH = ['#141210', '#221e1a', '#322c26', '#443c34'];

function poseFor(col) {
  if (col < 2) return { k: 'idle', i: col, bob: col, step: -1 };
  if (col < 6) return { k: 'walk', i: col - 2, bob: (col - 2) % 2 ? -1 : 0, step: col - 2 };
  if (col === 6) return { k: 'windup', bob: 0, step: -1 };
  if (col === 7) return { k: 'attack', bob: 0, step: -1 };
  if (col < 11) return { k: 'death', i: col - 8, bob: 0, step: -1 };
  return { k: 'extra', i: col - 11, bob: 0, step: -1 };
}

/** legs alternate: returns [leftLift, rightLift] for a walk step */
function lifts(pose) {
  if (pose.step < 0) return [0, 0];
  return [[1, 0], [0, 0], [0, 1], [0, 0]][pose.step];
}

function makeSheet(w, h, draw) {
  return (col, row) => {
    const p = new Painter(w, h);
    draw(p, poseFor(col));
    p.outline(S.outline);
    return row === 0 ? p : p.mirrored();
  };
}

/** animation table in the standard layout; extras: { name: [startExtra, count, fps, loop] } */
function stdAnims(walkFps = 8, extras = {}, deathFps = 6) {
  const a = {
    idle: { start: 0, count: 2, fps: 2.5, loop: true },
    walk: { start: 2, count: 4, fps: walkFps, loop: true },
    windup: { start: 6, count: 1, fps: 1, loop: true },
    attack: { start: 7, count: 1, fps: 1, loop: true },
    death: { start: 8, count: 3, fps: deathFps, loop: false },
  };
  for (const [name, [s, n, fps, loop]] of Object.entries(extras)) a[name] = { start: 11 + s, count: n, fps, loop: loop !== false };
  return a;
}

function skull(p, cx, cy, h, r = 3.4) {
  p.ellipse(cx, cy, r, r * 0.95, BONE, h);
  p.px(cx - 1, cy, '#0e0a06', h - 1);
  p.px(cx + 1, cy, '#0e0a06', h - 1);
  p.px(cx, cy + 2, '#2a2218', h - 0.5);
  p.hline(cx - 1, cx + 1, cy + 3, BONE[1], h - 0.5);
}

function limb(p, x0, y0, x1, y1, ramp, h, thick = 2) {
  p.line(x0, y0, x1, y1, ramp[Math.min(ramp.length - 1, 2)], h);
  if (thick > 1) p.line(x0 + 1, y0, x1 + 1, y1, ramp[1], h - 0.2);
}

function eyes(p, x, y, color, h, gap = 2) {
  p.lit(x, y, color, h, 1.4);
  p.lit(x + gap, y, color, h, 1.4);
}

function erode(p, seed, amount) {
  const rng = new Rng(seed);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.filled(x, y) && rng.chance(amount)) p.px(x, y, '#000000', 0, 0);
}

// =============================================================================================
// CHAPTER 2: THE CATACOMBS
// =============================================================================================

function skeletonBody(p, pose, b, { shield = true, hood = false }) {
  const [ll, rl] = lifts(pose);
  // legs + pelvis
  limb(p, 14, 21 + b, 13, 29 - ll, BONE, 2);
  limb(p, 17, 21 + b, 18, 29 - rl, BONE, 2);
  p.hline(12, 14, 29 - ll, BONE[2], 2);
  p.hline(17, 19, 29 - rl, BONE[2], 2);
  p.ellipse(15.5, 20 + b, 3.5, 1.6, BONE, 3);
  // spine + ribs
  p.vline(15, 12 + b, 19 + b, BONE[2], 3.5);
  for (let r = 0; r < 4; r++) p.hline(12, 19 - (r === 3 ? 1 : 0), 12 + b + r * 2, BONE[r % 2 ? 1 : 2], 4);
  p.hline(13, 18, 13 + b, '#0e0a06', 3.6);
  if (hood) {
    p.ellipse(16, 7 + b, 5, 5, CLOTH, 5);
    for (let x = 11; x < 21; x += 2) p.px(x, 15 + b, CLOTH[1], 4);
  }
  skull(p, 16, 7 + b, 6);
  if (hood) p.ellipse(16, 4 + b, 5, 3, CLOTH, 6.5);
  p.lit(15, 7 + b, CHAPTERS.catacombs.moss[3], 6.2, 0.9);
  p.lit(17, 7 + b, CHAPTERS.catacombs.moss[3], 6.2, 0.9);
}

function shieldAt(p, x, y, h) {
  p.ellipse(x, y, 4.5, 6, S.wood.slice(1, 5), h);
  for (let a = 0; a < 20; a++) {
    const t = (a / 20) * Math.PI * 2;
    p.px(x + Math.cos(t) * 4.5, y + Math.sin(t) * 6, IRON[3], h + 0.3);
  }
  p.ellipse(x, y, 1.4, 1.4, IRON.slice(2, 6), h + 0.5);
}

export const skeletonFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    if (pose.i === 0) skeletonBody(p, pose, 3, {});
    for (let i = 0; i < (pose.i === 0 ? 0 : 6); i++) limb(p, 6 + i * 3, 27 - (i % 2) * 2, 10 + i * 3, 29 - (i % 3), BONE, 1.5);
    if (pose.i > 0) {
      skull(p, 22, 26, 3);
      shieldAt(p, 8, 26, 1.5);
    }
    return;
  }
  // sword in the back hand
  const swordUp = pose.k === 'windup';
  const swordFwd = pose.k === 'attack';
  if (swordUp) limb(p, 13, 12 + b, 9, 4, IRON, 2.5, 1);
  else if (!swordFwd) limb(p, 12, 13 + b, 9, 22 + b, IRON, 2.5, 1);
  skeletonBody(p, pose, b, {});
  if (swordUp) {
    p.line(9, 4, 8, -2, IRON[4], 3);
    p.line(8, 4, 7, -2, IRON[3], 3);
  }
  if (swordFwd) {
    limb(p, 17, 13, 24, 15, BONE, 7);
    p.line(24, 15, 31, 16, IRON[4], 7);
    p.line(24, 16, 31, 17, IRON[2], 7);
    for (let a = -0.9; a < 0.6; a += 0.12) p.px(16 + Math.cos(a) * 14, 15 + Math.sin(a) * 12, '#c8c0a8', 7.5);
  }
  if (pose.k !== 'attack') shieldAt(p, 21, 16 + b, 7);
});
export const SKELETON_ANIMS = stdAnims(7);

export const archerFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    for (let i = 0; i < (pose.i === 0 ? 3 : 7); i++) limb(p, 5 + i * 3, 27 - (i % 2) * 2, 9 + i * 3, 29, BONE, 1.5);
    skull(p, 22, 26 - (pose.i === 0 ? 4 : 0), 3);
    p.ellipse(12, 28, 6, 2, CLOTH, 1);
    return;
  }
  skeletonBody(p, pose, b, { hood: true });
  // bow
  const drawn = pose.k === 'windup';
  const bx = drawn ? 24 : 22;
  for (let y = -7; y <= 7; y++) p.px(bx + Math.round((1 - (y * y) / 49) * 3), 14 + b + y, S.wood[3], 6);
  p.line(bx, 7 + b, drawn ? 17 : bx, 14 + b, '#d0c8b0', 6.5);
  p.line(bx, 21 + b, drawn ? 17 : bx, 14 + b, '#d0c8b0', 6.5);
  if (drawn) {
    p.line(17, 14 + b, 28, 14 + b, S.wood[4], 7);
    p.px(29, 14 + b, IRON[5], 7);
  }
  limb(p, 17, 13 + b, bx, 14 + b, BONE, 6);
  if (pose.k === 'attack') p.line(bx + 4, 14, bx + 8, 14, '#d0c8b0', 6);
});
export const ARCHER_ANIMS = stdAnims(7);

const WRAITH = ['#1a2a28', '#3a5a54', '#6a9a8c', '#a8d8c8', '#e0fff4'];
export const wraithFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.k === 'walk' || pose.k === 'idle' ? Math.round(Math.sin((pose.i || 0) * 1.6) * 1) : 0;
  // flowing tattered body (no legs)
  for (let y = 12; y < 30; y++) {
    const w = 4 + (y - 12) * 0.35;
    const sway = Math.sin(y * 0.6 + (pose.i || 0)) * 1.2;
    for (let x = Math.round(16 - w + sway); x <= Math.round(16 + w + sway); x++) {
      if (y > 26 && (x + y) % 3 === 0) continue;
      p.px(x, y + b, WRAITH[y < 18 ? 2 : y < 24 ? 1 : 0], 3);
    }
  }
  p.ellipse(16, 9 + b, 4.5, 5, WRAITH, 5); // hood
  p.ellipse(16, 10 + b, 2.8, 3, '#0a1210', 4); // dark face
  eyes(p, 15, 10 + b, '#a0ffe0', 5);
  // a crown of melted candles
  for (const [x, hgt] of [[13, 3], [16, 4], [19, 3]]) {
    p.rect(x, 5 + b - hgt, 1, hgt, S.wax[2], 6);
    p.lit(x, 4 + b - hgt, S.fire[4], 6.5, 1.5);
  }
  if (pose.k === 'windup' || pose.k === 'attack') {
    const fx = pose.k === 'windup' ? 0 : 6;
    limb(p, 12, 15 + b, 8 + fx, 10 + b, WRAITH, 4, 1);
    limb(p, 20, 15 + b, 24 + fx, 10 + b, WRAITH, 4, 1);
    p.ellipse(16 + fx, 6 + b, 2.6, 2.6, ['#2a8a7a', '#6af0d8', '#e0fff8'], 7);
    p.glow(16 + fx, 6 + b, '#6af0d8', 1.4);
  } else {
    limb(p, 12, 15 + b, 10, 21 + b, WRAITH, 4, 1);
    limb(p, 20, 15 + b, 22, 21 + b, WRAITH, 4, 1);
  }
  if (pose.k === 'death') erode(p, 70 + pose.i, 0.25 + pose.i * 0.3);
  if (pose.k === 'extra') erode(p, 80 + pose.i, 0.55); // flickering in / out between candles
});
export const WRAITH_ANIMS = stdAnims(5, { fade: [0, 1, 1] });

export const golemFrame = makeSheet(44, 40, (p, pose) => {
  const b = pose.bob;
  const rng = new Rng(4400);
  const crouch = pose.k === 'windup' ? 3 : pose.k === 'extra' ? 6 : 0;
  if (pose.k === 'death') {
    p.ellipse(22, 34, 17 - pose.i, 5, BONE.slice(0, 3), 3);
    for (let i = 0; i < 18; i++) limb(p, rng.int(6, 36), rng.int(28, 37), rng.int(6, 38), rng.int(28, 38), BONE, 2.5, 1);
    for (let i = 0; i < 4; i++) skull(p, rng.int(10, 34), rng.int(28, 34), 3.5, 2.6);
    return;
  }
  const [ll, rl] = lifts(pose);
  // thick legs of bundled bones
  p.cyl(13, 28 + b + crouch, 7, 10 - ll - crouch, BONE.slice(0, 3), 3);
  p.cyl(25, 28 + b + crouch, 7, 10 - rl - crouch, BONE.slice(0, 3), 3);
  // massive hunched torso: a heap of bones and skulls
  p.ellipse(22, 20 + b + crouch, 15, 11, BONE.slice(0, 3), 7);
  for (let i = 0; i < 14; i++) limb(p, rng.int(9, 34), rng.int(12, 28) + crouch, rng.int(9, 35), rng.int(12, 28) + crouch, BONE, 8, 1);
  for (let i = 0; i < 5; i++) skull(p, rng.int(11, 33), rng.int(14, 26) + b + crouch, 8.5, 2.6);
  // head: a big skull with glowing green eyes
  skull(p, 30, 10 + b + crouch, 10, 4.2);
  eyes(p, 29, 10 + b + crouch, '#7aff6a', 10.5);
  // long arms with huge knuckles
  const fistY = pose.k === 'windup' ? 6 + crouch : pose.k === 'attack' ? 24 : 32;
  const fistX = pose.k === 'attack' ? 40 : 36;
  limb(p, 32, 16 + b + crouch, fistX, fistY, BONE, 7, 3);
  p.ellipse(fistX, fistY + 2, 4, 3.5, BONE, 8);
  limb(p, 12, 16 + b + crouch, 6, pose.k === 'windup' ? 6 + crouch : 32, BONE, 6, 3);
  p.ellipse(6, (pose.k === 'windup' ? 6 + crouch : 32) + 2, 4, 3.5, BONE.slice(0, 3), 6.5);
  if (pose.k === 'extra') {
    // stunned: dazed, cracked
    p.px(28, 9 + crouch, '#000000', 11);
    p.px(32, 9 + crouch, '#000000', 11);
  }
});
export const GOLEM_ANIMS = stdAnims(5, { stunned: [0, 1, 1] });

const SPIDER = ['#1a1814', '#2e2a24', '#4a443a', '#6a6252', '#8e8670'];
export const spiderFrame = makeSheet(32, 24, (p, pose) => {
  const b = pose.bob;
  const step = pose.step >= 0 ? pose.step : 0;
  if (pose.k === 'death') {
    p.ellipse(16, 18, 7, 4 - pose.i, SPIDER, 3);
    for (let i = 0; i < 4; i++) limb(p, 10 + i * 4, 16, 9 + i * 4 + (i < 2 ? -2 : 2), 11 + pose.i * 2, SPIDER, 3, 1); // legs curled up
    p.ellipse(18, 21, 6, 1.5, CHAPTERS.catacombs.moss.slice(1), 0.5, false); // ichor
    return;
  }
  // eight legs
  for (let i = 0; i < 4; i++) {
    const sw = ((i + step) % 2 ? 1 : -1) * (pose.k === 'walk' ? 1 : 0);
    const rearUp = pose.k === 'windup' && i >= 2 ? -5 : 0;
    limb(p, 12 + i * 3, 13 + b, 4 + i * 6 + sw, 6 + rearUp + (i % 2) * 2, SPIDER, 3, 1);
    limb(p, 12 + i * 3, 15 + b, 3 + i * 7 - sw, 22, SPIDER, 3, 1);
  }
  p.ellipse(11, 13 + b, 7, 6, SPIDER, 5); // abdomen
  skull(p, 11, 13 + b, 5.8, 2.6); // the skull marking
  p.ellipse(20, 14 + b, 4, 3.5, SPIDER, 6); // head
  for (const [x, y] of [[21, 12], [23, 13], [22, 15]]) p.lit(x, y + b, '#ff5a3a', 6.5, 1.2);
  if (pose.k === 'attack') {
    p.px(25, 15, '#e0e0d8', 6);
    p.px(26, 14, '#e0e0d8', 6);
  }
});
export const SPIDER_ANIMS = stdAnims(12);

const WORM = ['#3a2a28', '#6a4a44', '#9a7468', '#c8a094', '#e8c8bc'];
export const wormFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  // the dirt mound it bursts from
  p.ellipse(16, 27, 10, 4, H.earth.concat(['#4a3a2a']), 2);
  if (pose.k === 'extra') {
    for (let i = 0; i < 8; i++) p.px(10 + i * 2, 24 + (i % 3), '#5a4a3a', 2.5);
    return;
  }
  if (pose.k === 'death') {
    for (let i = 0; i < 10; i++) p.ellipse(8 + i * 2, 26 - Math.sin(i * 0.4) * 2 * (2 - pose.i), 3, 2.6, WORM, 2);
    return;
  }
  const rear = pose.k === 'windup' ? -3 : pose.k === 'attack' ? -5 : 0;
  const sway = Math.sin((pose.i || 0) * 1.5) * 2;
  for (let s = 0; s < 7; s++) {
    const y = 25 - s * 3 + (s > 3 ? rear : 0) + b;
    const x = 16 + Math.sin(s * 0.7) * sway;
    p.ellipse(x, y, 4 - s * 0.15, 2.6, WORM, 3 + s);
    p.hline(Math.round(x - 3), Math.round(x + 3), Math.round(y + 2), WORM[0], 3 + s); // segment rings
  }
  // ring mouth of teeth
  const my = 25 - 18 + rear + b;
  p.ellipse(16 + sway * 0.3, my, 4, 3, '#200808', 10, false);
  for (let a = 0; a < 10; a++) {
    const t = (a / 10) * Math.PI * 2;
    if (pose.k === 'attack' || a % 2 === 0) p.px(16 + sway * 0.3 + Math.cos(t) * 3.4, my + Math.sin(t) * 2.4, '#ece4cc', 10.5);
  }
});
export const WORM_ANIMS = stdAnims(4, { burrowed: [0, 1, 1] });

export const doctorFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  const [ll, rl] = lifts(pose);
  if (pose.k === 'death') {
    p.ellipse(15, 27, 10, 3.2, DARK, 2);
    p.ellipse(24, 27, 3.5, 2, BONE, 2.5); // the mask, fallen off
    p.px(27, 27, BONE[3], 2.5);
    if (pose.i < 2) for (let i = 0; i < 6; i++) p.lit(8 + i * 3, 20 - pose.i * 3 - (i % 2) * 2, C.goo[2], 1, 0.6);
    return;
  }
  p.cyl(12, 22 + b, 3, 7 - ll, DARK.slice(0, 3), 2);
  p.cyl(17, 22 + b, 3, 7 - rl, DARK.slice(0, 3), 2);
  // long black coat
  for (let y = 11; y < 25; y++) p.cyl(10 - Math.floor((y - 11) / 5), y + b, 12 + Math.floor((y - 11) / 5) * 2, 1, DARK, 4);
  p.vline(16, 12 + b, 24 + b, DARK[0], 4.2);
  // beaked mask + wide-brimmed hat
  p.ellipse(16, 8 + b, 3.6, 3.6, BONE, 6);
  for (let i = 0; i < 7; i++) p.hline(18, 18 + i, 9 + b + Math.floor(i / 2), BONE[i < 3 ? 2 : 1], 6.5 - i * 0.2);
  p.ellipse(17, 7 + b, 1.3, 1.3, ['#2a3a2a', '#8ac08a', '#e0ffe0'], 7);
  p.hline(9, 23, 4 + b, DARK[2], 7);
  p.hline(9, 23, 5 + b, DARK[1], 7);
  p.ellipse(16, 2 + b, 4, 2.6, DARK, 7.5);
  // flask raised / thrown, or cane
  if (pose.k === 'windup') {
    limb(p, 20, 13 + b, 24, 5 + b, DARK, 6);
    p.ellipse(24, 3 + b, 2.2, 2.6, ['#1a3a1a', '#3a8a3a', '#8af08a'], 7);
    p.glow(24, 3 + b, '#5ad05a', 1);
  } else if (pose.k === 'attack') limb(p, 20, 13, 27, 12, DARK, 6);
  else {
    p.line(21, 13 + b, 22, 29, S.wood[2], 5);
    p.px(22, 13 + b, IRON[4], 5);
  }
});
export const DOCTOR_ANIMS = stdAnims(6);

const SPECTRE = ['#1a2230', '#2e3e58', '#5a7498', '#9ab4d8', '#dcecff'];
export const spectreFrame = makeSheet(32, 32, (p, pose) => {
  const sway = pose.k === 'walk' ? Math.sin(pose.i * 1.5) * 1.5 : 0;
  for (let y = 9; y < 30; y++) {
    const w = 3 + (y - 9) * 0.32;
    for (let x = Math.round(16 - w + sway * (y / 30)); x <= Math.round(16 + w + sway * (y / 30)); x++) {
      if (y > 26 && (x * 3 + y) % 4 === 0) continue;
      p.px(x, y, SPECTRE[y < 14 ? 3 : y < 22 ? 2 : 1], 3);
    }
  }
  // veiled head, long hair, glowing tears
  p.ellipse(16, 7, 4, 4.5, SPECTRE, 5);
  p.vline(12, 5, 16, '#1a1e28', 4.5);
  p.vline(20, 5, 15, '#1a1e28', 4.5);
  p.lit(15, 8, '#dcecff', 5.5, 1.2);
  p.lit(17, 8, '#dcecff', 5.5, 1.2);
  p.lit(15, 10, '#9ab4d8', 5.4, 0.8);
  p.lit(17, 11, '#9ab4d8', 5.4, 0.8);
  if (pose.k === 'windup' || pose.k === 'attack') {
    const r = pose.k === 'attack' ? 10 : 6;
    limb(p, 18, 13, 18 + r, 11, SPECTRE, 5, 1);
    limb(p, 14, 13, 14 + r, 15, SPECTRE, 5, 1);
  }
  erode(p, 90 + (pose.i || 0), pose.k === 'death' ? 0.3 + pose.i * 0.3 : 0.08);
});
export const SPECTRE_ANIMS = stdAnims(5);

// =============================================================================================
// CHAPTER 3: THE HOLLOW
// =============================================================================================
const HAG = ['#2a3020', '#46503a', '#66705a', '#8a9478'];
const SHAWL = ['#1e0e28', '#341848', '#4e2468', '#6a3488'];

export const witchFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  const [ll, rl] = lifts(pose);
  if (pose.k === 'death') {
    p.ellipse(15, 27, 10, 3, SHAWL, 2);
    p.line(4, 28, 26, 26, S.wood[2], 2);
    if (pose.i < 2) for (let i = 0; i < 8; i++) p.lit(6 + i * 3, 18 - pose.i * 4 - (i % 3) * 2, H.glowPurple[2], 1, 0.8); // moths of light
    return;
  }
  p.cyl(13, 23 + b, 2, 6 - ll, HAG, 2);
  p.cyl(17, 23 + b, 2, 6 - rl, HAG, 2);
  // hunched, in a ragged purple shawl
  for (let y = 11; y < 24; y++) p.cyl(10 + (y > 18 ? -1 : 0), y + b, 12 + (y > 18 ? 2 : 0), 1, SHAWL, 4);
  for (let x = 9; x < 24; x += 2) p.px(x, 24 + b, SHAWL[0], 3);
  p.ellipse(18, 9 + b, 3.5, 3.5, HAG, 5.5); // face, pushed forward
  p.px(21, 10 + b, HAG[3], 6); // long nose
  p.px(22, 11 + b, HAG[2], 6);
  p.lit(19, 8 + b, '#e0ff60', 6, 1.2);
  // pointed, crooked hat
  p.hline(11, 24, 6 + b, '#1a1410', 6.5);
  for (let i = 0; i < 7; i++) p.hline(14 + Math.floor(i / 2), 20 - i, 5 + b - i, '#241c14', 7);
  p.px(12, -2 + b, '#241c14', 7);
  // staff with a glowing purple tip
  const up = pose.k === 'windup';
  const sx = pose.k === 'attack' ? 27 : 24;
  const top = up ? 0 : 6;
  p.line(sx, top + b, sx - 2, 29, S.wood[2], 6);
  p.ellipse(sx, top - 1 + b, up ? 2.6 : 1.8, up ? 2.6 : 1.8, H.glowPurple, 7);
  p.glow(sx, top - 1 + b, H.glowPurple[2], up ? 1.6 : 1);
  if (pose.k === 'extra') {
    limb(p, 12, 13 + b, 8, 3 + b, HAG, 6);
    limb(p, 20, 13 + b, 25, 3 + b, HAG, 6);
    for (let a = 0; a < 16; a++) p.lit(16 + Math.cos(a * 0.4) * 12, 28 + Math.sin(a * 0.4) * 3, H.glowPurple[2], 0.5, 0.8); // summoning circle
  }
});
export const WITCH_ANIMS = stdAnims(6, { summon: [0, 1, 1] });

export const thornlingFrame = makeSheet(32, 32, (p, pose) => {
  const swell = pose.k === 'windup' ? 2 : pose.k === 'attack' ? 1 : 0;
  const wither = pose.k === 'death' ? pose.i + 1 : 0;
  const ramp = wither ? ['#1a140c', '#3a2c18', '#5a4426', '#7a5e34'] : H.moss.concat(['#4a9a60']);
  p.ellipse(16, 18, 11 + swell - wither, 9 + swell - wither, ramp, 7);
  const rng = new Rng(1717);
  for (let i = 0; i < 26; i++) p.dot(rng.int(6, 26), rng.int(10, 26), rng.pick(ramp), 7.5);
  // thorns all around (longer when bristling)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = 10 + swell - wither;
    const r1 = r0 + 3 + swell * 2;
    p.line(16 + Math.cos(a) * r0, 18 + Math.sin(a) * r0 * 0.8, 16 + Math.cos(a) * r1, 18 + Math.sin(a) * r1 * 0.8, wither ? '#3a2c18' : '#c8c0a0', 6);
  }
  if (!wither) {
    eyes(p, 13, 17, pose.k === 'windup' ? '#ffd040' : '#e0c040', 8, 5);
    p.hline(14, 18, 21, '#0a1008', 7.6); // a crooked mouth
  }
  if (pose.k === 'idle' && pose.i === 1) p.px(9, 12, ramp[3], 8); // sway
});
export const THORNLING_ANIMS = stdAnims(2);

const WOLF = ['#141418', '#26262e', '#3a3a44', '#55555f', '#76767f'];
export const direwolfFrame = makeSheet(44, 30, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(20, 23, 15, 4.5 - pose.i * 0.5, WOLF, 4);
    p.ellipse(34, 23, 5, 4, WOLF, 4.5);
    for (const x of [14, 20, 26]) limb(p, x, 20, x + 2, 15 + pose.i, WOLF, 4, 1);
    return;
  }
  const crouch = pose.k === 'windup' ? 3 : 0;
  const stretch = pose.k === 'attack' ? 4 : 0;
  const step = pose.step >= 0 ? pose.step : 0;
  // legs
  const legs = [[11, 0], [15, 2], [27, 1], [31, 3]];
  for (const [x, ph] of legs) {
    const swing = pose.k === 'walk' ? ((step + ph) % 4 < 2 ? 2 : -2) : 0;
    const sx = stretch ? (x < 20 ? -6 : 6) : 0;
    limb(p, x, 16 + b + crouch, x + swing + sx, 27, WOLF, 3);
  }
  // body, ruff, tail
  p.ellipse(21, 14 + b + crouch, 13 + stretch, 6, WOLF, 7);
  p.ellipse(29 + stretch, 12 + b + crouch, 6, 6.5, WOLF.slice(1), 7.5); // shaggy ruff
  limb(p, 8, 12 + b + crouch, 2, 8 + b + (pose.k === 'windup' ? -3 : 2), WOLF, 6, 2);
  // head + snout + glowing eyes
  const hx = 35 + stretch;
  const hy = 10 + b + crouch * 1.5;
  p.ellipse(hx, hy, 5, 4.5, WOLF, 8);
  p.ellipse(hx + 5, hy + 2, 3.5, 2.2, WOLF.slice(1), 8);
  p.px(hx + 8, hy + 1, '#0a0a0a', 8.5);
  p.line(hx - 2, hy - 4, hx - 1, hy - 7, WOLF[3], 8); // ears
  p.line(hx + 1, hy - 4, hx + 2, hy - 7, WOLF[2], 8);
  p.lit(hx + 2, hy - 1, '#ffd040', 8.5, 1.4);
  if (pose.k === 'attack' || pose.k === 'windup') {
    p.hline(hx + 3, hx + 8, hy + 4, '#200808', 8); // jaws open
    p.px(hx + 4, hy + 3, '#ece4cc', 8.4);
    p.px(hx + 7, hy + 3, '#ece4cc', 8.4);
  }
});
export const DIREWOLF_ANIMS = stdAnims(10);

const SAC = ['#2a1a2a', '#4a2a48', '#6a3a62', '#8a5a7a', '#aa7a90'];
export const bloaterFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  const swell = pose.k === 'windup' ? 3 : 0;
  if (pose.k === 'death') {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      p.ellipse(16 + Math.cos(a) * (6 + pose.i * 4), 20 + Math.sin(a) * (4 + pose.i * 2), 2, 1.6, SAC, 2);
    }
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(11, 25 + b, 3, 4 - ll, SAC, 2);
  p.cyl(18, 25 + b, 3, 4 - rl, SAC, 2);
  p.ellipse(16, 17 + b, 10 + swell, 10 + swell, SAC, 8);
  // glowing spore spots
  for (const [x, y] of [[11, 14], [20, 12], [17, 21], [9, 20], [22, 19], [14, 9]]) p.lit(x, y + b, swell ? H.glowTeal[3] : H.glowTeal[2], 8.5, swell ? 1.4 : 0.8);
  // a small sad face
  p.px(14, 17 + b, '#0a060a', 8.6);
  p.px(18, 17 + b, '#0a060a', 8.6);
  p.hline(15, 17, 20 + b, '#0a060a', 8.6);
});
export const BLOATER_ANIMS = stdAnims(4);

export const wispFrame = makeSheet(16, 16, (p, pose) => {
  const bright = pose.k === 'windup' ? 1 : 0;
  const G = H.glowTeal;
  const flick = (pose.i || 0) % 2;
  // a flame-like tail of light
  for (let i = 0; i < 5; i++) p.lit(7 - i + flick, 9 + i * 0.6, G[1 + (i < 2 ? 1 : 0)], 1, 0.8 - i * 0.12);
  p.ellipse(9, 8, 4 + bright, 4 + bright, G, 2);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (p.filled(x, y) && (x - 9) ** 2 + (y - 8) ** 2 < 14) p.glow(x, y, G[2 + bright], 1.2);
  p.px(9, 7, '#0a2a28', 3);
  p.px(11, 7, '#0a2a28', 3);
  if (pose.k === 'death') erode(p, 140 + pose.i, 0.3 + pose.i * 0.3);
});
export const WISP_ANIMS = stdAnims(8);

export const scarecrowFrame = makeSheet(32, 40, (p, pose) => {
  const jerk = pose.k === 'windup' ? 2 : 0;
  const fall = pose.k === 'death' ? pose.i * 5 : 0;
  p.vline(16, 14 + fall, 39, S.wood[2], 3); // post
  p.vline(17, 14 + fall, 39, S.wood[1], 3);
  p.line(5, 15 + fall, 27, 15 + fall, S.wood[3], 4); // crossbar
  // tattered coat
  for (let y = 15; y < 30; y++) for (let x = 8 - (y > 24 ? 1 : 0); x <= 24 + (y > 24 ? 1 : 0); x++) if (!((x + y) % 6 === 0 && y > 25)) p.px(x, y + fall, y % 5 === 0 ? '#3a2e22' : '#4e3e2c', 5);
  p.vline(16, 16 + fall, 29 + fall, '#2a2018', 5.2);
  for (const [x, y] of [[6, 17], [26, 17], [10, 30], [21, 30]]) p.px(x, y + fall, CHAPTERS.cells.straw[3], 5);
  // sack head with a stitched face
  p.ellipse(16 + jerk, 9 + fall, 5.5, 5, ['#4a3a24', '#6a5636', '#8a7450', '#a8906a'], 7);
  p.lit(14 + jerk, 9 + fall, '#ff8a2a', 7.5, pose.k === 'windup' ? 1.6 : 0.9);
  p.lit(18 + jerk, 9 + fall, '#ff8a2a', 7.5, pose.k === 'windup' ? 1.6 : 0.9);
  for (let x = 13; x <= 19; x += 2) p.px(x + jerk, 12 + fall, '#1a1208', 7.4); // stitched mouth
  p.hline(10 + jerk, 22 + jerk, 5 + fall, '#2a2018', 8); // floppy hat
  p.ellipse(16 + jerk, 3 + fall, 4, 2.5, ['#1a140e', '#2a2018', '#3a2c20'], 8.5);
  if (pose.k === 'idle' && pose.i === 1) p.px(4, 14, '#101012', 5); // a crow's tail peeking
});
export const SCARECROW_ANIMS = stdAnims(2);

export const crowFrame = makeSheet(16, 12, (p, pose) => {
  const up = (pose.i || 0) % 2 === 0;
  p.ellipse(8, 7, 3.5, 2.2, DARK, 3);
  p.ellipse(11, 6, 1.8, 1.6, DARK, 3.5);
  p.px(13, 6, '#c8a030', 3.5); // beak
  p.lit(11, 5, '#ffdd60', 4, 0.8);
  if (up) {
    p.line(6, 6, 3, 1, DARK[2], 3);
    p.line(8, 6, 7, 1, DARK[3], 3);
  } else {
    p.line(6, 8, 2, 10, DARK[2], 3);
    p.line(8, 8, 6, 11, DARK[3], 3);
  }
  p.line(4, 7, 2, 8, DARK[1], 2.5); // tail
});
export const CROW_ANIMS = stdAnims(12);

export const saplingFrame = makeSheet(32, 36, (p, pose) => {
  const b = pose.bob;
  const B = H.bark;
  if (pose.k === 'death') {
    p.line(8, 32, 24, 30 - pose.i, B[2], 3);
    p.line(8, 33, 24, 31 - pose.i, B[1], 3);
    for (let i = 0; i < 6; i++) p.px(10 + i * 3, 28 - (i % 2), H.leaf[2], 3.5);
    return;
  }
  const [ll, rl] = lifts(pose);
  const dug = pose.k === 'windup' ? 3 : 0;
  // root legs
  limb(p, 14, 26 + b + dug, 10, 35 - ll, B, 3);
  limb(p, 18, 26 + b + dug, 22, 35 - rl, B, 3);
  limb(p, 16, 27 + b + dug, 16, 35, B, 2.5, 1);
  // trunk body with a face in the bark
  p.cyl(11, 12 + b + dug, 10, 15, B, 6);
  for (let y = 14; y < 26; y += 3) p.px(13 + (y % 2), y + b + dug, B[0], 6.2);
  p.lit(14, 17 + b + dug, '#d0ff60', 6.6, 1.1);
  p.lit(18, 17 + b + dug, '#d0ff60', 6.6, 1.1);
  p.hline(14, 18, 21 + b + dug, '#0a0806', 6.4);
  // twig arms
  const armY = pose.k === 'windup' ? 6 : pose.k === 'attack' ? 26 : 14;
  limb(p, 11, 15 + b + dug, 4, armY + b, B, 6, 1);
  limb(p, 21, 15 + b + dug, 28, armY + b, B, 6, 1);
  // leafy crown
  const L = H.moss.concat([H.leaf[2]]);
  p.ellipse(16, 7 + b + dug, 9, 6, L, 8);
  p.ellipse(10, 9 + b + dug, 4, 3.5, L, 7.5);
  p.ellipse(22, 9 + b + dug, 4, 3.5, L, 7.5);
  p.lit(19, 4 + b + dug, H.glowPurple[2], 8.6, 0.8); // a glowing berry
});
export const SAPLING_ANIMS = stdAnims(5);

const GOB = ['#1e2e14', '#2e4a1e', '#46682c', '#62883c', '#82a850'];
export const cutpurseFrame = makeSheet(24, 24, (p, pose) => {
  const b = pose.bob;
  const [ll, rl] = lifts(pose);
  if (pose.k === 'death') {
    p.ellipse(11, 20, 7, 2.6, GOB, 2);
    p.ellipse(18, 20, 3, 2.4, S.leather, 2.5); // the dropped purse
    return;
  }
  limb(p, 10, 16 + b, 9, 22 - ll, GOB, 2, 1);
  limb(p, 13, 16 + b, 14, 22 - rl, GOB, 2, 1);
  p.ellipse(11.5, 13 + b, 4, 4, ['#2a1e14', '#3e2c1c', '#544028'], 4); // hooded tunic
  p.ellipse(13, 7 + b, 4, 3.6, GOB, 5); // head
  p.line(9, 6 + b, 5, 3 + b, GOB[3], 5); // big ears
  p.line(17, 6 + b, 21, 4 + b, GOB[2], 5);
  p.lit(14, 6 + b, '#ffe040', 5.5, 1.1);
  const grin = pose.k === 'windup';
  p.hline(13, 16, 9 + b, grin ? '#ece4cc' : '#0a1008', 5.4);
  if (pose.k === 'attack') limb(p, 15, 12, 22, 11, GOB, 5, 1); // grabbing
  if (pose.k === 'extra' || pose.k === 'attack') {
    p.ellipse(4, 12 + b, 3, 3.2, S.leather, 5); // a fat stolen purse on its back
    p.lit(4, 10 + b, S.silver[3], 5.5, 0.6);
  }
});
export const CUTPURSE_ANIMS = stdAnims(13, { flee: [0, 1, 1] });

// =============================================================================================
// CHAPTER 4: THE BURNING HALLS
// =============================================================================================
const PLATE = ['#08080a', '#141418', '#22222a', '#34343e', '#4c4c58', '#6a6a78'];
const PLUME = HA.crimson;

function armouredBody(p, pose, b, { visorGlow = '#ff6a3a', plume = true, empty = false }) {
  const [ll, rl] = lifts(pose);
  p.cyl(12, 21 + b, 4, 8 - ll, PLATE, 3);
  p.cyl(17, 21 + b, 4, 8 - rl, PLATE, 3);
  p.cyl(10, 11 + b, 12, 11, PLATE, 5);
  p.hline(10, 21, 16 + b, PLATE[5], 5.4); // breastplate ridge
  p.ellipse(10, 12 + b, 3, 2.5, PLATE, 6); // pauldrons
  p.ellipse(22, 12 + b, 3, 2.5, PLATE, 6);
  p.cyl(12, 3 + b, 8, 9, PLATE, 7); // helm
  p.hline(13, 19, 7 + b, '#020203', 7.2); // visor slit
  if (!empty || visorGlow) {
    p.lit(15, 7 + b, visorGlow, 7.4, 1.3);
    p.lit(17, 7 + b, visorGlow, 7.4, 1.3);
  }
  if (plume) for (let i = 0; i < 6; i++) p.px(13 - i, 2 + b + Math.floor(i / 2), PLUME[2 + (i % 2)], 7.5);
}

export const blackknightFrame = makeSheet(36, 32, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(16, 27, 12, 3.6, PLATE, 3);
    p.ellipse(28, 26, 4, 3, PLATE, 3.5);
    p.line(2, 29, 34, 25, S.wood[2], 2);
    return;
  }
  const lanceUp = pose.k === 'windup';
  const charging = pose.k === 'attack';
  armouredBody(p, pose, charging ? 1 : b, {});
  if (lanceUp) {
    p.line(20, 16 + b, 30, -2, S.wood[3], 8);
    p.line(21, 16 + b, 31, -2, S.wood[2], 8);
    p.px(31, -2, IRON[5], 8.5);
    for (let i = 0; i < 4; i++) p.px(28 - i, 3 + i, PLUME[2], 8.4); // pennant
  } else {
    const y = charging ? 15 : 18 + b;
    p.line(14, y, 36, y - (charging ? 0 : 3), S.wood[3], 8);
    p.line(14, y + 1, 36, y + 1 - (charging ? 0 : 3), S.wood[2], 8);
    p.px(35, y - (charging ? 0 : 3), IRON[5], 8.5);
  }
  if (pose.k === 'extra') p.tint(16, 7, '#000000', 0.6); // stunned: visor dark
});
export const BLACKKNIGHT_ANIMS = stdAnims(6, { stunned: [0, 1, 1] });

const SKIN = ['#3a2218', '#6a3e2c', '#986048', '#bc8466', '#d8a486'];
export const flailbruteFrame = makeSheet(40, 40, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(18, 34, 15, 4.5, SKIN, 3);
    p.ellipse(32, 34, 4, 3.6, IRON.slice(1, 5), 3.5); // the ball
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(13, 27 + b, 6, 11 - ll, ['#1a140e', '#2a2018', '#3a2c20'], 3);
  p.cyl(22, 27 + b, 6, 11 - rl, ['#1a140e', '#2a2018', '#3a2c20'], 3);
  p.ellipse(20, 19 + b, 12, 10, SKIN, 7); // huge bare torso
  p.hline(10, 30, 26 + b, S.leather[1], 7.2); // belt
  p.ellipse(20, 8 + b, 5, 5, ['#140e0a', '#24180e', '#342414'], 8.5); // iron-bound hood
  p.hline(16, 24, 8 + b, IRON[3], 8.8);
  p.lit(18, 7 + b, '#ff7a3a', 9, 1);
  p.lit(22, 7 + b, '#ff7a3a', 9, 1);
  // arms swinging the chain
  const up = pose.k === 'windup' || pose.k === 'attack';
  limb(p, 30, 14 + b, up ? 32 : 34, up ? 2 : 26, SKIN, 8, 3);
  limb(p, 10, 14 + b, 6, 26, SKIN, 6, 3);
  if (!up) {
    for (let i = 0; i < 6; i++) p.px(34 + (i % 2), 27 + i, IRON[3], 7); // chain
    p.ellipse(35, 35, 3.5, 3.2, IRON.slice(1, 5), 7); // ball resting
  }
});
export const FLAILBRUTE_ANIMS = stdAnims(5);

const GSTONE = ['#1a1a1c', '#2c2c30', '#404046', '#56565e', '#707078'];
export const gargoyleFrame = makeSheet(36, 32, (p, pose) => {
  const stone = pose.k === 'extra';
  const b = pose.bob;
  const R = GSTONE;
  if (pose.k === 'death') {
    for (let i = 0; i < 8; i++) p.ellipse(8 + i * 3, 27 - (i % 3), 2.4, 2, R, 2);
    return;
  }
  const wings = stone || pose.k === 'idle' ? 'folded' : pose.k === 'walk' ? (pose.i % 2 ? 'up' : 'down') : 'up';
  // wings
  if (wings === 'folded') {
    p.ellipse(9, 14 + b, 5, 8, R, 4);
    p.ellipse(25, 14 + b, 5, 8, R, 4);
  } else {
    const wy = wings === 'up' ? -6 : 4;
    for (const s of [-1, 1]) {
      for (let i = 0; i < 12; i++) p.line(18, 12 + b, 18 + s * (4 + i), 12 + wy + i * 0.6 + b, R[1 + (i % 3)], 4);
    }
  }
  // crouched body, horns, claws
  p.ellipse(18, 18 + b, 7, 7, R, 6);
  p.ellipse(19, 9 + b, 4.5, 4, R, 7);
  p.line(16, 6 + b, 14, 2 + b, R[3], 7.5);
  p.line(22, 6 + b, 24, 2 + b, R[3], 7.5);
  for (const x of [13, 16, 21, 24]) p.vline(x, 24 + b, 27, R[2], 4);
  if (stone) {
    p.px(18, 9, '#0e0e10', 7.5);
    p.px(21, 9, '#0e0e10', 7.5);
  } else {
    eyes(p, 18, 9 + b, '#ffb03a', 7.5, 3);
  }
  if (pose.k === 'attack') for (const x of [12, 25]) p.line(x, 20, x + (x < 18 ? -3 : 3), 26, R[4], 6); // claws out in the swoop
});
export const GARGOYLE_ANIMS = stdAnims(10, { stone: [0, 1, 1] });

const ROBE = ['#1a0e24', '#2e1a40', '#46285e', '#603a7c'];
export const magusFrame = makeSheet(32, 36, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death' || pose.k === 'extra') {
    if (pose.k === 'death') p.ellipse(16, 31, 9, 3, ROBE, 2);
    for (let i = 0; i < 12; i++) p.lit(8 + ((i * 7) % 16), 10 + ((i * 11) % 22) - (pose.i || 0) * 3, HA.gold[3], 3, 1);
    if (pose.k === 'death' && pose.i === 0) {
      p.ellipse(16, 22, 6, 9, ROBE, 4);
      erode(p, 300, 0.4);
    }
    return;
  }
  // flowing robe with gold hem
  for (let y = 12; y < 34; y++) p.cyl(11 - Math.floor((y - 12) / 6), y + b, 10 + Math.floor((y - 12) / 6) * 2, 1, ROBE, 4);
  p.hline(8, 23, 33 + b, HA.gold[2], 4.4);
  p.vline(16, 12 + b, 33 + b, HA.gold[1], 4.3);
  p.ellipse(16, 9 + b, 3.6, 3.6, SKIN.slice(1), 5.5); // face
  p.lit(15, 9 + b, '#b07aff', 6, 1);
  p.lit(17, 9 + b, '#b07aff', 6, 1);
  for (let i = 0; i < 8; i++) p.hline(13 + Math.floor(i / 2), 19 - Math.floor(i / 2), 5 + b - i, ROBE[2], 7); // tall hat
  p.px(16, -3 + b, HA.gold[3], 7.5);
  // hands raised for a spell, with a glowing ring
  if (pose.k === 'windup' || pose.k === 'attack') {
    limb(p, 12, 14 + b, 6, 6 + b, ROBE, 6);
    limb(p, 20, 14 + b, 26, 6 + b, ROBE, 6);
    for (let a = 0; a < 20; a++) {
      const t = (a / 20) * Math.PI * 2;
      p.lit(16 + Math.cos(t) * (pose.k === 'attack' ? 13 : 9), 6 + b + Math.sin(t) * 3, '#c08aff', 7, 1.2);
    }
  } else {
    p.line(23, 12 + b, 24, 33, S.wood[2], 5); // staff
    p.ellipse(23, 10 + b, 2, 2, ['#3a1a5a', '#8a4ae0', '#e0c0ff'], 6);
    p.glow(23, 10 + b, '#8a4ae0', 1.2);
  }
});
export const MAGUS_ANIMS = stdAnims(4, { blink: [0, 1, 1] });

export const livingarmourFrame = makeSheet(32, 32, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death' || pose.k === 'extra') {
    // a heap of empty armour (extras: 0 pile, 1 pile twitching back together)
    const twitch = pose.k === 'extra' && pose.i === 1 ? -3 : 0;
    p.ellipse(16, 27, 11, 3.5, PLATE, 3);
    p.cyl(18, 20 + twitch, 8, 6, PLATE, 4); // helm on top
    p.hline(19, 24, 23 + twitch, '#020203', 4.2);
    if (pose.k === 'extra') {
      p.lit(20, 23 + twitch, '#8ad0ff', 4.4, 1);
      p.lit(22, 23 + twitch, '#8ad0ff', 4.4, 1);
    }
    p.line(4, 28, 14, 25, IRON[4], 2);
    return;
  }
  armouredBody(p, pose, b, { visorGlow: '#8ad0ff', plume: false, empty: true });
  const up = pose.k === 'windup';
  if (up) {
    limb(p, 20, 12 + b, 23, 2, PLATE, 7);
    p.line(23, 2, 22, -6, IRON[4], 7.5);
  } else if (pose.k === 'attack') {
    p.line(20, 14, 31, 16, IRON[4], 7.5);
    for (let a = -0.9; a < 0.6; a += 0.12) p.px(16 + Math.cos(a) * 14, 15 + Math.sin(a) * 12, '#a8c8e8', 8);
  } else p.line(21, 14 + b, 25, 26 + b, IRON[4], 7);
});
export const LIVINGARMOUR_ANIMS = stdAnims(6, { pile: [0, 1, 1], reassemble: [1, 1, 1] });

const DRAKE = ['#1a0808', '#3a1010', '#5e1a14', '#842a1c', '#a8402a'];
export const drakeFrame = makeSheet(40, 32, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(18, 25, 12, 4, DRAKE, 3);
    p.ellipse(31, 25, 5, 3, DRAKE, 3.5);
    p.line(5, 25, 1, 28, DRAKE[2], 2);
    return;
  }
  const inhale = pose.k === 'windup';
  const breathe = pose.k === 'attack';
  const [ll, rl] = lifts(pose);
  limb(p, 14, 20 + b, 13, 28 - ll, DRAKE, 3);
  limb(p, 22, 20 + b, 23, 28 - rl, DRAKE, 3);
  limb(p, 9, 18 + b, 2, 22 + b, DRAKE, 3, 2); // tail
  p.px(1, 23 + b, HA.gold[2], 3);
  // wings
  for (let i = 0; i < 9; i++) p.line(17, 13 + b, 9 + i, 3 + b + (i % 3), DRAKE[1 + (i % 3)], 4);
  p.ellipse(18, 17 + b, 8 + (inhale ? 1 : 0), 6 + (inhale ? 1 : 0), DRAKE, 6);
  if (inhale) for (let y = 15; y < 21; y++) for (let x = 15; x < 22; x++) if (p.filled(x, y + b)) p.lit(x, y + b, HA.lava[1], 6.2, 0.7); // the fire building in its chest
  const hx = breathe ? 31 : inhale ? 27 : 29;
  const hy = 11 + b + (inhale ? -2 : 0);
  limb(p, 23, 15 + b, hx - 3, hy + 1, DRAKE, 7, 3);
  p.ellipse(hx, hy, 4.5, 3.5, DRAKE, 8);
  p.ellipse(hx + 4, hy + 1, 2.5, 1.8, DRAKE.slice(1), 8);
  p.line(hx - 2, hy - 3, hx - 4, hy - 6, HA.gold[2], 8.5); // horns
  p.lit(hx + 1, hy - 1, '#ffd040', 8.6, 1.3);
  if (breathe) {
    p.hline(hx + 3, hx + 7, hy + 2, '#200808', 8);
    for (let i = 0; i < 6; i++) p.lit(hx + 7 + i, hy + 2 + ((i % 3) - 1), HA.lava[3 - (i > 3 ? 1 : 0)], 8, 1.6);
  }
});
export const DRAKE_ANIMS = stdAnims(8);

/** A crescent axe blade on the haft at (x, y), facing dir (1 right, -1 left). */
function axeBlade(p, x, y, dir, h) {
  for (let dy = -6; dy <= 6; dy++) {
    const w = Math.round(Math.sqrt(36 - dy * dy) * 0.9);
    for (let dx = 0; dx <= w; dx++) p.px(x + dir * dx, y + dy, dx === w ? IRON[5] : dx > w - 2 ? IRON[4] : IRON[2], h);
  }
  p.vline(x, y - 6, y + 6, IRON[1], h + 0.2);
}

export const executionerFrame = makeSheet(40, 44, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(18, 38, 14, 4, SKIN, 3);
    p.line(26, 40, 38, 34, S.wood[2], 3);
    axeBlade(p, 36, 34, 1, 3.5);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(13, 30 + b, 6, 13 - ll, ['#100c0a', '#1e1814', '#2c241e'], 3);
  p.cyl(22, 30 + b, 6, 13 - rl, ['#100c0a', '#1e1814', '#2c241e'], 3);
  p.ellipse(19, 22 + b, 11, 10, SKIN, 7); // bare chest
  p.hline(9, 29, 29 + b, S.leather[1], 7.2);
  p.ellipse(19, 10 + b, 6, 6.5, ['#0a0808', '#141010', '#201818'], 8.5); // black hood
  p.lit(17, 10 + b, '#ff4a2a', 9, 1);
  p.lit(21, 10 + b, '#ff4a2a', 9, 1);
  // the great axe
  const up = pose.k === 'windup';
  const down = pose.k === 'attack';
  if (up) {
    limb(p, 26, 16 + b, 24, 2, SKIN, 8, 3);
    p.line(24, 2, 22, -4, S.wood[3], 9);
    axeBlade(p, 21, 1, -1, 9.5);
  } else if (down) {
    limb(p, 26, 18, 34, 34, SKIN, 8, 3);
    p.line(34, 34, 38, 40, S.wood[3], 9);
    axeBlade(p, 35, 36, 1, 9.5);
    for (let a = -1.5; a < 0.5; a += 0.12) p.px(22 + Math.cos(a) * 16, 22 + Math.sin(a) * 18, '#d8c8b0', 9.6);
  } else {
    limb(p, 28, 18 + b, 32, 30 + b, SKIN, 8, 3);
    p.line(32, 30 + b, 33, 42, S.wood[3], 8);
    axeBlade(p, 33, 35, 1, 8.5);
  }
});
export const EXECUTIONER_ANIMS = stdAnims(5);

// =============================================================================================
// Hazard visuals: eruption sprites (32 x 32) and the web decal
// =============================================================================================
// eruptions: 0 root spike, 1 bone spike, 2 fire pillar, 3 dirt burst, 4 shockwave burst, 5 falling skull, 6 shadow spear
export function eruptionFrame(k) {
  const p = new Painter(32, 32);
  const rng = new Rng(7700 + k);
  if (k === 0 || k === 1) {
    const R = k === 0 ? H.bark : BONE;
    for (let i = 0; i < 4; i++) {
      const x = 8 + i * 5 + rng.int(-1, 1);
      const top = rng.int(4, 12);
      for (let y = top; y < 28; y++) {
        const w = Math.round((y - top) / 6);
        p.hline(x - w, x + w, y, R[Math.min(R.length - 1, 1 + (y < top + 4 ? 2 : 1))], 8 - (y - top) * 0.2);
      }
    }
    p.ellipse(16, 28, 12, 3, ['#1a1410', '#2a2018', '#3a2c20'], 1);
  } else if (k === 2) {
    for (let y = 2; y < 30; y++) {
      const w = 3 + Math.sin(y * 0.5) * 1.5 + (y / 30) * 4;
      for (let x = Math.round(16 - w); x <= Math.round(16 + w); x++) {
        const c = Math.abs(x - 16) < w * 0.4 ? HA.lava[3] : Math.abs(x - 16) < w * 0.75 ? HA.lava[2] : HA.lava[1];
        p.lit(x, y, c, 1, 1.6);
      }
    }
  } else if (k === 3) {
    for (let i = 0; i < 14; i++) p.ellipse(rng.int(5, 27), rng.int(8, 28), rng.float(1.5, 3), rng.float(1.2, 2.4), H.earth.concat(['#4a3a2a']), 3);
  } else if (k === 4) {
    for (let i = 0; i < 10; i++) p.line(16, 26, 16 + rng.int(-14, 14), rng.int(6, 22), HA.ash[3], 4);
    for (let i = 0; i < 8; i++) p.lit(rng.int(6, 26), rng.int(10, 26), HA.lava[2], 4, 1.2);
    p.ellipse(16, 27, 12, 3, HA.ash, 1);
  } else if (k === 5) {
    skull(p, 16, 14, 6, 6);
    for (let y = 0; y < 8; y++) p.px(16 + rng.int(-2, 2), y, BONE[1], 2);
  } else {
    for (let y = 0; y < 30; y++) {
      const w = Math.max(0, 4 - y / 10);
      for (let x = Math.round(16 - w); x <= Math.round(16 + w); x++) p.lit(x, y, y < 24 ? '#4a1a6a' : '#b04ae0', 6, 1.4);
    }
  }
  p.outline(S.outline);
  return p;
}

export function webDecal() {
  const p = new Painter(32, 32);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    p.line(16, 16, 16 + Math.cos(a) * 14, 16 + Math.sin(a) * 11, '#d8d8d0', 0.4);
  }
  for (const r of [4, 8, 12]) {
    for (let k = 0; k < 8; k++) {
      const a0 = (k / 8) * Math.PI * 2;
      const a1 = ((k + 1) / 8) * Math.PI * 2;
      p.line(16 + Math.cos(a0) * r, 16 + Math.sin(a0) * r * 0.8, 16 + Math.cos(a1) * r, 16 + Math.sin(a1) * r * 0.8, '#b8b8b0', 0.4);
    }
  }
  return p;
}
