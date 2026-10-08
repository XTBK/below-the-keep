// Pattern bosses (chapters 2-4, the Mad King, the Hollow Crown, the Forgotten Keeper).
// Column layout: 0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death, 11 cast. Row 1 = mirrored.

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CHAPTERS } from '../../data/palettes.js';

const IRON = S.iron;
const BONE = CHAPTERS.catacombs.bone;
const H = CHAPTERS.hollow;
const HA = CHAPTERS.halls;
const PLATE = ['#08080a', '#141418', '#22222a', '#34343e', '#4c4c58', '#6a6a78'];
const SKIN = ['#3a2218', '#6a3e2c', '#986048', '#bc8466', '#d8a486'];
const PALE = ['#4a4a44', '#76766a', '#a4a090', '#cac6b4', '#ecead8'];

export const BOSS2_COLS = 12;

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

export function boss2Anims() {
  return {
    idle: { start: 0, count: 2, fps: 2, loop: true },
    walk: { start: 2, count: 4, fps: 6, loop: true },
    windup: { start: 6, count: 1, fps: 1, loop: true },
    attack: { start: 7, count: 1, fps: 1, loop: true },
    death: { start: 8, count: 3, fps: 3, loop: false },
    cast: { start: 11, count: 1, fps: 1, loop: true },
  };
}

function limb(p, x0, y0, x1, y1, ramp, h, thick = 3) {
  for (let t = 0; t < thick; t++) p.line(x0 + t - 1, y0, x1 + t - 1, y1, ramp[Math.min(ramp.length - 1, 1 + (t === 1 ? 1 : 0))], h);
}

function skull(p, cx, cy, h, r = 4) {
  p.ellipse(cx, cy, r, r * 0.95, BONE, h);
  p.px(cx - 1, cy, '#0e0a06', h - 1);
  p.px(cx + 1, cy, '#0e0a06', h - 1);
  p.hline(cx - 1, cx + 1, cy + Math.round(r * 0.7), BONE[1], h - 0.5);
}

function crumble(p, seed, amount) {
  const rng = new Rng(seed);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.filled(x, y) && rng.chance(amount)) p.px(x, y, '#000000', 0, 0);
}

function deathPile(p, w, h, ramp, i) {
  p.ellipse(w / 2, h - 6, w * 0.38 - i * 2, 5, ramp, 3);
}

// ---------------------------------------------------------------------------------------------
export const gravediggerFrame = makeSheet(56, 56, (p, pose) => {
  const b = pose.bob;
  const COAT = ['#1a1410', '#2a2018', '#3a2e22', '#4e3e2e'];
  if (pose.k === 'death') {
    deathPile(p, 56, 56, COAT, pose.i);
    p.line(8, 50, 40, 46, S.wood[2], 2); // the shovel
    p.ellipse(44, 46, 5, 3, IRON.slice(1, 5), 2.5);
    return;
  }
  const [ll, rl] = lifts(pose);
  const kneel = pose.k === 'cast' ? 8 : 0;
  p.cyl(20, 38 + b + kneel, 6, 15 - ll - kneel, COAT, 3);
  p.cyl(30, 38 + b + kneel, 6, 15 - rl - kneel, COAT, 3);
  // hunched, mud-caked coat
  p.ellipse(27, 30 + b + kneel, 13, 12, COAT, 8);
  for (let i = 0; i < 16; i++) p.dot(15 + ((i * 7) % 24), 22 + ((i * 5) % 18) + kneel, H.earth[2], 8.2);
  // the lantern at his hip
  p.rect(16, 36 + b + kneel, 6, 7, IRON[2], 9);
  p.ellipse(19, 39 + b + kneel, 2, 2.5, S.fire.slice(3), 9.5);
  p.glow(19, 39 + b + kneel, S.fire[4], 1.6);
  // head: grey stubble under a wide-brimmed hat, one glinting eye
  p.ellipse(33, 15 + b + kneel, 6, 6, PALE, 10);
  p.lit(35, 15 + b + kneel, '#ffcf5a', 10.5, 1.2);
  p.hline(24, 42, 10 + b + kneel, COAT[1], 11);
  p.ellipse(33, 7 + b + kneel, 6, 4, COAT, 11.5);
  // the shovel
  const pose2 = pose.k === 'windup' ? 'up' : pose.k === 'attack' ? 'down' : pose.k === 'cast' ? 'planted' : 'rest';
  if (pose2 === 'up') {
    limb(p, 36, 24 + b, 40, 6, SKIN, 10);
    p.line(40, 6, 30, -2, S.wood[3], 11);
    p.ellipse(28, 1, 5, 4, IRON.slice(1, 6), 11.5);
  } else if (pose2 === 'down') {
    limb(p, 36, 26, 46, 40, SKIN, 10);
    p.line(46, 40, 52, 50, S.wood[3], 11);
    p.ellipse(52, 51, 4, 5, IRON.slice(1, 6), 11.5);
    for (let i = 0; i < 6; i++) p.px(44 + i * 2, 48 - (i % 2) * 3, H.earth[3], 12); // flung dirt
  } else {
    limb(p, 37, 26 + b + kneel, 44, 36 + b + kneel, SKIN, 10);
    p.line(44, 20 + b, 47, 53, S.wood[3], 9);
    p.ellipse(47, 52, 4, 3, IRON.slice(1, 6), 9.5);
  }
});

// ---------------------------------------------------------------------------------------------
export const colossusFrame = makeSheet(96, 96, (p, pose) => {
  const b = pose.bob;
  const rng = new Rng(9696);
  if (pose.k === 'death') {
    deathPile(p, 96, 96, BONE.slice(0, 3), pose.i);
    for (let i = 0; i < 40; i++) p.line(rng.int(14, 82), rng.int(78, 92), rng.int(14, 82), rng.int(78, 92), BONE[rng.int(1, 3)], 3);
    for (let i = 0; i < 8; i++) skull(p, rng.int(20, 76), rng.int(76, 88), 4, 3);
    if (pose.i < 2) p.lit(48, 80, CHAPTERS.catacombs.moss[3], 5, 1.5 - pose.i * 0.6); // the heart fading
    return;
  }
  const [ll, rl] = lifts(pose);
  // legs: columns of bundled bones
  p.cyl(30, 62 + b, 12, 30 - ll, BONE.slice(0, 3), 5);
  p.cyl(54, 62 + b, 12, 30 - rl, BONE.slice(0, 3), 5);
  for (let y = 64; y < 90; y += 5) {
    p.hline(31, 41, y + b, BONE[2], 5.5);
    p.hline(55, 65, y + b, BONE[2], 5.5);
  }
  // ribcage with a sickly glowing heart
  p.ellipse(48, 46 + b, 22, 18, ['#1a1610', '#2a2418', '#3a3224'], 8);
  for (let r = 0; r < 6; r++) {
    for (let x = 28; x <= 68; x++) {
      const y = 34 + r * 5 + Math.round(Math.abs(x - 48) * 0.25) + b;
      if ((x - 48) ** 2 / 441 + ((y - 46 - b) ** 2) / 324 <= 1) p.px(x, y, BONE[2 + (r % 2)], 10);
    }
  }
  p.vline(48, 30 + b, 62 + b, BONE[3], 10.5);
  p.ellipse(48, 46 + b, 5, 5, ['#1a4a10', '#3a8a20', '#7aff6a'], 9);
  for (let y = 41; y < 52; y++) for (let x = 43; x < 54; x++) if (p.filled(x, y + b) && (x - 48) ** 2 + (y - 46) ** 2 < 20) p.glow(x, y + b, '#7aff6a', 1.1);
  // shoulders and the many skulls
  for (let i = 0; i < 9; i++) skull(p, 24 + i * 6, 28 + (i % 2) * 3 + b, 11, 3.2);
  // head: a huge skull crowned with bone
  skull(p, 48, 16 + b, 13, 9);
  for (const x of [41, 45, 48, 51, 55]) p.line(x, 8 + b, x + (x - 48) * 0.3, 2 + b, BONE[3], 14);
  p.lit(44, 16 + b, '#7aff6a', 14, 1.5);
  p.lit(52, 16 + b, '#7aff6a', 14, 1.5);
  // arms ending in fists made of skulls
  const fistsUp = pose.k === 'windup';
  const slam = pose.k === 'attack';
  const spread = pose.k === 'cast';
  const fy = fistsUp ? 4 : slam ? 84 : spread ? 26 : 68;
  const fxL = spread ? 4 : 14;
  const fxR = spread ? 92 : 82;
  limb(p, 28, 34 + b, fxL, fy, BONE, 12, 4);
  limb(p, 68, 34 + b, fxR, fy, BONE, 12, 4);
  for (const fx of [fxL, fxR]) {
    p.ellipse(fx, fy, 7, 6, BONE, 13);
    skull(p, fx - 2, fy, 13.5, 2.6);
    skull(p, fx + 3, fy + 1, 13.5, 2.6);
  }
});

// ---------------------------------------------------------------------------------------------
const WOLF = ['#141418', '#26262e', '#3a3a44', '#55555f', '#76767f'];
export const briarhoundFrame = makeSheet(72, 48, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(34, 40, 26, 6 - pose.i, WOLF, 4);
    for (let i = 0; i < 10; i++) p.line(14 + i * 4, 36, 15 + i * 4, 32 + (i % 3), H.bark[2], 5);
    return;
  }
  const crouch = pose.k === 'windup' ? 5 : 0;
  const stretch = pose.k === 'attack' ? 6 : 0;
  const step = pose.k === 'walk' ? pose.i : 0;
  for (const [x, ph] of [[18, 0], [24, 2], [44, 1], [50, 3]]) {
    const swing = pose.k === 'walk' ? ((step + ph) % 4 < 2 ? 3 : -3) : 0;
    const sx = stretch ? (x < 34 ? -10 : 10) : 0;
    limb(p, x, 26 + b + crouch, x + swing + sx, 46, WOLF, 4);
  }
  p.ellipse(35, 22 + b + crouch, 22 + stretch, 11, WOLF, 9);
  // briars wound all through its coat, thorns jutting from its back
  const rng = new Rng(3131);
  for (let i = 0; i < 7; i++) {
    let x = 16 + i * 5;
    let y = 14 + crouch + b;
    for (let k = 0; k < 9; k++) {
      p.px(x, y, H.bark[1 + (k % 2)], 10);
      x += rng.int(0, 1);
      y += rng.int(0, 2);
    }
  }
  for (let i = 0; i < 9; i++) p.line(18 + i * 4, 13 + crouch + b, 17 + i * 4 + (pose.k === 'cast' ? 0 : -1), 6 + crouch + b - (pose.k === 'cast' ? 4 : 0), '#c8c0a0', 10.5);
  // head
  const hx = 58 + stretch;
  const hy = pose.k === 'cast' ? 8 + b : 16 + b + crouch;
  p.ellipse(hx, hy, 8, 7, WOLF, 11);
  p.ellipse(hx + 8, hy + 3, 5, 3.5, WOLF.slice(1), 11);
  p.px(hx + 12, hy + 2, '#0a0a0a', 11.5);
  p.line(hx - 4, hy - 6, hx - 3, hy - 12, WOLF[3], 11);
  p.line(hx + 1, hy - 6, hx + 3, hy - 12, WOLF[2], 11);
  p.lit(hx + 3, hy - 2, '#ffd040', 11.5, 1.5);
  if (pose.k !== 'idle' && pose.k !== 'walk') {
    p.hline(hx + 4, hx + 12, hy + 6, '#200808', 11);
    for (let x = hx + 5; x < hx + 12; x += 2) p.px(x, hy + 5, '#ece4cc', 11.4);
  }
  limb(p, 14, 18 + b + crouch, 4, 12 + b, WOLF, 9, 3); // tail
});

// ---------------------------------------------------------------------------------------------
export const thornwitchFrame = makeSheet(64, 64, (p, pose) => {
  const b = pose.bob;
  const DRESS = H.moss.concat(['#4a9a60']);
  if (pose.k === 'death') {
    deathPile(p, 64, 64, DRESS, pose.i);
    for (let i = 0; i < 8; i++) p.lit(16 + i * 4, 40 - pose.i * 6 - (i % 3) * 3, H.glowPurple[2], 3, 1);
    return;
  }
  // a dress of living vines flaring to the floor
  for (let y = 28; y < 62; y++) {
    const w = 7 + (y - 28) * 0.42;
    for (let x = Math.round(32 - w); x <= Math.round(32 + w); x++) p.px(x, y + (y > 58 ? 0 : b), DRESS[1 + ((x + y) % 3 === 0 ? 1 : 0) + (y > 50 ? -1 : 0)], 5);
  }
  for (let i = 0; i < 8; i++) p.line(24 + i * 2, 30 + b, 18 + i * 4, 62, H.bark[2], 5.5);
  // pale body, long black hair
  p.cyl(26, 18 + b, 12, 12, PALE, 8);
  p.ellipse(32, 12 + b, 6, 7, PALE, 10);
  p.vline(25, 8 + b, 26 + b, '#0a0a0c', 9.5);
  p.vline(39, 8 + b, 24 + b, '#0a0a0c', 9.5);
  p.lit(30, 12 + b, H.glowPurple[3], 10.5, 1.5);
  p.lit(34, 12 + b, H.glowPurple[3], 10.5, 1.5);
  p.hline(30, 34, 16 + b, '#2a0a1a', 10.2);
  // crown of thorny antlers
  for (const s of [-1, 1]) {
    p.line(32 + s * 3, 6 + b, 32 + s * 12, -2 + b, H.bark[3], 11);
    p.line(32 + s * 8, 2 + b, 32 + s * 9, -6 + b, H.bark[3], 11);
    p.line(32 + s * 11, 0 + b, 32 + s * 16, 2 + b, H.bark[2], 11);
  }
  // the staff of twisted root
  const staffY = pose.k === 'windup' ? 0 : 14;
  const staffX = pose.k === 'attack' ? 56 : 48;
  limb(p, 38, 22 + b, staffX - 2, staffY + 8 + b, PALE, 9, 2);
  p.line(staffX, staffY + b, staffX - 4, 62, H.bark[3], 9);
  p.ellipse(staffX, staffY - 2 + b, 3.5, 3.5, H.glowPurple, 10);
  for (let y = -6; y < 3; y++) for (let x = -4; x < 5; x++) if (x * x + y * y < 14) p.glow(staffX + x, staffY + y + b, H.glowPurple[2], 1.3);
  if (pose.k === 'cast') {
    for (let a = 0; a < 24; a++) {
      const t = (a / 24) * Math.PI * 2;
      p.line(32 + Math.cos(t) * 20, 30 + Math.sin(t) * 8, 32 + Math.cos(t) * 24, 30 + Math.sin(t) * 9.6, '#c8c0a0', 12);
    }
  }
});

// ---------------------------------------------------------------------------------------------
export const pyrebishopFrame = makeSheet(56, 64, (p, pose) => {
  const b = pose.bob;
  const VEST = HA.crimson;
  if (pose.k === 'death') {
    deathPile(p, 56, 64, VEST, pose.i);
    for (let i = 0; i < 10; i++) p.lit(10 + i * 4, 56 - (i % 3), HA.lava[1 + (i % 3)], 3, 1.3);
    return;
  }
  // robes: crimson vestments with a gold stole
  for (let y = 26; y < 62; y++) {
    const w = 9 + (y - 26) * 0.3;
    for (let x = Math.round(28 - w); x <= Math.round(28 + w); x++) p.px(x, y + (y > 58 ? 0 : b), VEST[1 + ((x + 3) % 7 === 0 ? 1 : 0) + (y > 52 ? -1 : 0)], 6);
  }
  p.rect(25, 26 + b, 6, 34, HA.gold[2], 6.5);
  p.vline(28, 28 + b, 58 + b, HA.gold[1], 6.6);
  p.hline(18, 38, 60, HA.gold[2], 6.4);
  // face and a tall gilded mitre
  p.ellipse(28, 20 + b, 6, 6.5, SKIN, 9);
  p.lit(26, 20 + b, '#ffb040', 9.5, 1.3);
  p.lit(30, 20 + b, '#ffb040', 9.5, 1.3);
  for (let i = 0; i < 12; i++) p.hline(23 + Math.floor(i / 3), 33 - Math.floor(i / 3), 14 + b - i, i % 4 === 0 ? HA.gold[3] : '#e0d8c8', 10);
  p.vline(28, 3 + b, 13 + b, HA.gold[2], 10.5);
  // burning hands; the censer on its chain
  const up = pose.k === 'windup';
  const swing = pose.k === 'attack';
  const cx = up ? 44 : swing ? 52 : 44;
  const cy = up ? 4 : swing ? 30 : 46;
  limb(p, 34, 30 + b, cx - 2, cy - 4 + b * 0, VEST, 8, 2);
  for (let i = 0; i < 8; i++) p.px(cx - 2 + (i % 2), cy - 4 + i - 4, IRON[3], 9);
  p.ellipse(cx, cy + 4, 4, 4.5, HA.gold, 10);
  for (let y = -3; y < 4; y++) for (let x = -3; x < 4; x++) if (x * x + y * y < 9) p.lit(cx + x, cy + 4 + y, y < 0 ? HA.lava[3] : HA.lava[2], 10.5, 1.4);
  limb(p, 22, 30 + b, 14, pose.k === 'cast' ? 10 : 42, VEST, 8, 2);
  p.lit(14, pose.k === 'cast' ? 9 : 43, HA.lava[3], 9, 1.6);
  if (pose.k === 'cast') {
    for (let a = 0; a < 20; a++) {
      const t = Math.PI + (a / 19) * Math.PI;
      p.lit(28 + Math.cos(t) * 18, 16 + Math.sin(t) * 12, HA.lava[a % 2 ? 2 : 3], 11, 1.4); // a halo of fire
    }
  }
});

// ---------------------------------------------------------------------------------------------
export const championFrame = makeSheet(72, 72, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    deathPile(p, 72, 72, PLATE, pose.i);
    p.line(6, 66, 60, 60, IRON[4], 3);
    p.ellipse(56, 58, 9, 6, PLATE, 3.5);
    return;
  }
  const [ll, rl] = lifts(pose);
  // red cape behind
  p.ellipse(34, 40 + b, 16, 24, HA.crimson, 4);
  p.cyl(24, 44 + b, 8, 26 - ll, PLATE, 5);
  p.cyl(38, 44 + b, 8, 26 - rl, PLATE, 5);
  p.cyl(20, 24 + b, 30, 22, PLATE, 8);
  p.hline(20, 49, 34 + b, PLATE[5], 8.4);
  p.hline(20, 49, 44 + b, HA.gold[1], 8.4);
  p.ellipse(18, 26 + b, 6, 5, PLATE, 9);
  p.ellipse(51, 26 + b, 6, 5, PLATE, 9);
  // horned great helm
  p.cyl(27, 6 + b, 16, 18, PLATE, 10);
  p.hline(29, 41, 14 + b, '#020203', 10.4);
  p.lit(32, 14 + b, '#ff3a20', 10.6, 1.4);
  p.lit(38, 14 + b, '#ff3a20', 10.6, 1.4);
  for (const s of [-1, 1]) {
    p.line(35 + s * 8, 8 + b, 35 + s * 15, 2 + b, BONE[2], 11);
    p.line(35 + s * 15, 2 + b, 35 + s * 16, -4 + b, BONE[3], 11);
  }
  // greatsword + tower shield
  const up = pose.k === 'windup';
  const slash = pose.k === 'attack';
  if (up) {
    limb(p, 48, 28 + b, 54, 6, PLATE, 11);
    p.line(54, 6, 62, -10, IRON[4], 12);
    p.line(55, 6, 63, -10, IRON[2], 12);
  } else if (slash) {
    limb(p, 48, 30, 62, 46, PLATE, 11);
    p.line(62, 46, 70, 66, IRON[4], 12);
    p.line(63, 46, 71, 66, IRON[2], 12);
    for (let a = -1.4; a < 0.8; a += 0.08) p.px(40 + Math.cos(a) * 30, 40 + Math.sin(a) * 28, '#e0d0c0', 12.5);
  } else {
    limb(p, 48, 30 + b, 56, 44 + b, PLATE, 11);
    p.line(56, 44 + b, 60, 70, IRON[4], 10);
  }
  const shieldUp = pose.k === 'cast';
  p.bevelRect(shieldUp ? 6 : 8, shieldUp ? 18 : 30 + b, 14, 26, PLATE.slice(1, 6), 10, 2);
  p.vline(shieldUp ? 13 : 15, shieldUp ? 22 : 34 + b, shieldUp ? 40 : 52 + b, HA.gold[2], 10.4);
});

// ---------------------------------------------------------------------------------------------
// The Mad King, in three phases
const ROBE = ['#2a0a1a', '#46122a', '#661c3a', '#8a2a4c'];
const ERMINE = ['#a8a090', '#d0c8b4', '#f0ece0'];
function madKing(p, pose, phase) {
  const b = pose.bob;
  const float = phase === 3 ? -4 + Math.round(Math.sin((pose.i || 0) * 1.4) * 2) : 0;
  if (pose.k === 'death') {
    deathPile(p, 64, 72, ROBE, pose.i);
    p.ellipse(44, 66, 6, 3, HA.gold, 3.5); // the crown rolls away
    if (phase === 3) crumble(p, 77 + pose.i, 0.2);
    return;
  }
  const [ll, rl] = lifts(pose);
  // robe (burning hem in phase 2, dissolving into shadow in phase 3)
  for (let y = 30; y < 68; y++) {
    const w = 10 + (y - 30) * 0.32;
    for (let x = Math.round(32 - w); x <= Math.round(32 + w); x++) {
      if (phase === 3 && y > 56 && (x * 7 + y * 3) % 5 < 2) continue;
      let c = ROBE[1 + ((x + y) % 9 === 0 ? 1 : 0)];
      if (phase === 3) c = ['#0e0614', '#1a0c26', '#26123a'][(x + y) % 3];
      p.px(x, y + b + float, c, 6);
    }
  }
  if (phase === 2) for (let x = 20; x < 46; x++) p.lit(x, 66 - ((x * 7) % 4), HA.lava[(x % 3) + 1], 6, 1.4);
  if (phase === 3) for (let x = 22; x < 44; x += 2) p.lit(x, 64 + float - ((x * 5) % 6), H.glowPurple[2], 5, 1);
  if (phase !== 3) {
    p.cyl(26, 60 + b, 5, 8 - ll, ROBE, 4);
    p.cyl(34, 60 + b, 5, 8 - rl, ROBE, 4);
  }
  // ermine mantle
  p.ellipse(32, 30 + b + float, 15, 6, ERMINE, 8);
  for (let x = 20; x < 46; x += 4) p.px(x, 30 + b + float, '#1a1a1a', 8.5);
  // face: wild white beard, mad eyes
  const fy = 18 + b + float;
  p.ellipse(32, fy, 7, 8, phase === 3 ? ['#2a2236', '#3e3450', '#544868'] : SKIN, 10);
  if (phase !== 3) {
    p.ellipse(32, fy + 8, 6, 6, ERMINE, 10.5); // beard
    p.lit(29, fy - 1, '#ffffff', 10.8, 0.6);
    p.px(29, fy - 1, '#1a0a0a', 11);
    p.px(35, fy - 1, '#1a0a0a', 11);
    p.hline(29, 35, fy + 3, phase === 2 ? '#3a0a0a' : '#ece4cc', 11); // the grin (a snarl when unthroned)
  } else {
    p.lit(29, fy, H.glowPurple[3], 11, 1.8);
    p.lit(35, fy, H.glowPurple[3], 11, 1.8);
  }
  // the crown: gold, then askew, then blazing purple
  const tilt = phase === 2 ? 2 : 0;
  const crownC = phase === 3 ? H.glowPurple : HA.gold;
  p.hline(25 + tilt, 39 + tilt, fy - 6, crownC[2], 12);
  p.hline(25 + tilt, 39 + tilt, fy - 7, crownC[1], 12);
  for (const x of [25, 29, 32, 35, 39]) p.vline(x + tilt, fy - (x === 32 ? 14 : 11) + Math.abs(x - 32) * 0.2, fy - 8, crownC[x === 32 ? 3 : 2], 12);
  for (const x of [29, 35]) p.px(x + tilt, fy - 6, '#c02634', 12.5);
  if (phase === 3) for (let y = fy - 16; y < fy - 5; y++) for (let x = 24; x < 41; x++) if (p.filled(x, y)) p.glow(x, y, H.glowPurple[2], 1.3);
  // arms + scepter (phase 1) / sword (phase 2) / shadow hands (phase 3)
  const up = pose.k === 'windup' || pose.k === 'cast';
  const fwd = pose.k === 'attack';
  const hx = fwd ? 58 : up ? 50 : 48;
  const hy = up ? 4 + float : fwd ? 30 + float : 44 + b + float;
  limb(p, 42, 32 + b + float, hx, hy, phase === 3 ? ['#0e0614', '#1a0c26', '#26123a'] : ROBE, 10, 3);
  if (phase === 1) {
    p.line(hx, hy, hx + 2, hy - 14, HA.gold[2], 11);
    p.ellipse(hx + 2, hy - 15, 3, 3, HA.gold, 11.5);
    p.lit(hx + 2, hy - 16, '#ff4060', 12, 1.2);
  } else if (phase === 2) {
    p.line(hx, hy, hx + 10, hy - (fwd ? 0 : 16), IRON[4], 11);
    p.line(hx + 1, hy, hx + 11, hy - (fwd ? 0 : 16), IRON[2], 11);
  } else {
    for (let k = 0; k < 4; k++) p.lit(hx + k, hy - k, H.glowPurple[2], 11, 1.2);
  }
  if (pose.k === 'cast') {
    for (let a = 0; a < 28; a++) {
      const t = (a / 28) * Math.PI * 2;
      p.lit(32 + Math.cos(t) * 26, 34 + float + Math.sin(t) * 9, phase === 3 ? H.glowPurple[2] : HA.gold[3], 12, 1.3);
    }
  }
}
export const madking1Frame = makeSheet(64, 72, (p, pose) => madKing(p, pose, 1));
export const madking2Frame = makeSheet(64, 72, (p, pose) => madKing(p, pose, 2));
export const madking3Frame = makeSheet(64, 72, (p, pose) => madKing(p, pose, 3));

// ---------------------------------------------------------------------------------------------
export const crownwraithFrame = makeSheet(64, 64, (p, pose) => {
  const f = Math.round(Math.sin((pose.i || 0) * 1.3) * 2);
  if (pose.k === 'death') {
    p.ellipse(32, 56, 14 - pose.i * 3, 3, HA.gold, 3);
    crumble(p, 500 + pose.i, 0.3);
    return;
  }
  // shadow tendrils trailing below
  for (let k = 0; k < 7; k++) {
    let x = 20 + k * 4;
    for (let y = 30; y < 62; y++) {
      p.px(x, y + f, ['#0a0612', '#160c22', '#22123a'][(y + k) % 3], 3);
      if (y % 4 === 0) x += Math.sin(k + y * 0.3) > 0 ? 1 : -1;
    }
  }
  // the crown, wreathed in purple flame, an eye opening in its band
  const open = pose.k === 'windup' || pose.k === 'cast' || pose.k === 'attack';
  p.ellipse(32, 26 + f, 18, 7, HA.gold, 8);
  p.ellipse(32, 25 + f, 14, 4, '#0a0612', 7, false);
  for (const [x, hgt] of [[16, 10], [22, 14], [32, 18], [42, 14], [48, 10]]) {
    for (let y = 0; y < hgt; y++) p.hline(x - Math.max(0, 2 - Math.floor(y / 4)), x + Math.max(0, 2 - Math.floor(y / 4)), 22 + f - y, HA.gold[2 + (y > hgt - 3 ? 1 : 0)], 9);
    for (let y = hgt; y < hgt + 6; y++) p.lit(x + ((y * 3) % 3) - 1, 22 + f - y, H.glowPurple[y > hgt + 3 ? 3 : 2], 10, 1.5);
  }
  p.ellipse(32, 29 + f, open ? 4 : 3.5, open ? 3 : 0.8, ['#3a0a3a', '#d8c8ff', '#ffffff'], 10);
  if (open) p.lit(32, 29 + f, '#b04ae0', 10.5, 1.6);
  for (const x of [20, 26, 38, 44]) p.lit(x, 27 + f, '#c02634', 9.5, 0.9);
});

// ---------------------------------------------------------------------------------------------
const RUNESTONE = ['#16161a', '#26262c', '#3a3a42', '#50505a', '#6a6a76', '#8a8a96'];
export const keeperFrame = makeSheet(64, 72, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    deathPile(p, 64, 72, RUNESTONE, pose.i);
    for (let i = 0; i < 12; i++) p.ellipse(10 + i * 4, 64 - (i % 3) * 2, 2.5, 2, RUNESTONE, 3);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(22, 52 + b, 8, 18 - ll, RUNESTONE, 4);
  p.cyl(34, 52 + b, 8, 18 - rl, RUNESTONE, 4);
  // a robed statue of ancient stone, carved with glowing runes
  p.cyl(18, 26 + b, 28, 28, RUNESTONE, 7);
  for (const [x, y] of [[24, 32], [30, 36], [36, 31], [26, 44], [34, 46], [30, 40]]) {
    p.lit(x, y + b, HA.gold[3], 7.5, 1.3);
    p.lit(x + 1, y + b, HA.gold[2], 7.5, 1.1);
  }
  p.ellipse(32, 16 + b, 9, 10, RUNESTONE, 9);
  p.hline(26, 38, 17 + b, '#08080a', 9.4);
  p.lit(29, 17 + b, HA.gold[3], 9.6, 1.6);
  p.lit(35, 17 + b, HA.gold[3], 9.6, 1.6);
  // the key-staff
  const up = pose.k === 'windup' || pose.k === 'cast';
  const sx = pose.k === 'attack' ? 58 : 50;
  const sy = up ? 2 : 16;
  limb(p, 44, 30 + b, sx - 2, sy + 14, RUNESTONE, 9);
  p.line(sx, sy + b, sx - 2, 70, HA.gold[1], 9.5);
  p.ellipse(sx, sy - 2 + b, 4, 4, HA.gold, 10);
  p.px(sx, sy - 2 + b, '#08080a', 10.5);
  p.hline(sx - 2, sx + 3, sy + 8 + b, HA.gold[2], 10);
  if (up) for (let y = -6; y < 2; y++) for (let x = -5; x < 6; x++) if (x * x + y * y < 20 && p.filled(sx + x, sy + y + b)) p.glow(sx + x, sy + y + b, HA.gold[3], 1.2);
});

/** Orbs extended: 13 frames, 12 x 12 (0 glob, 1 shard, 2 key, 3 bone, 4 wisp, 5 thorn, 6 curse, 7 coin, 8 fire, 9 web, 10 shadow, 11 iron ball, 12 rune). */
export function orbFrame2(k, base) {
  if (k <= 2) return base(k);
  const p = new Painter(12, 12);
  const glowBall = (ramp, strength = 1.3) => {
    p.ellipse(6, 6, 3.6, 3.6, ramp, 2);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) if (p.filled(x, y)) p.glow(x, y, ramp[Math.min(ramp.length - 1, 2)], strength);
  };
  if (k === 3) {
    p.line(3, 8, 9, 4, BONE[2], 2);
    p.ellipse(3, 8, 1.4, 1.4, BONE, 2.5);
    p.ellipse(9, 4, 1.4, 1.4, BONE, 2.5);
  } else if (k === 4) glowBall(H.glowTeal);
  else if (k === 5) {
    p.line(2, 6, 10, 6, H.bark[3], 2);
    p.px(10, 6, '#e0d8b8', 3);
    p.px(5, 5, H.bark[2], 2);
    p.px(7, 7, H.bark[2], 2);
  } else if (k === 6) glowBall(H.glowPurple);
  else if (k === 7) {
    p.ellipse(6, 6, 3.4, 3.4, HA.gold, 2);
    p.px(5, 5, '#fff4c8', 2.5);
    p.glow(6, 6, HA.gold[3], 0.6);
  } else if (k === 8) glowBall([HA.lava[0], HA.lava[1], HA.lava[2], HA.lava[3]], 1.6);
  else if (k === 9) {
    for (let a = 0; a < 6; a++) p.line(6, 6, 6 + Math.cos(a) * 4, 6 + Math.sin(a) * 4, '#e0e0d8', 1);
    p.ellipse(6, 6, 2, 2, ['#a8a8a0', '#d8d8d0', '#ffffff'], 1.5);
  } else if (k === 10) glowBall(['#0a0612', '#2a1040', '#6a2a9a', '#c08aff'], 1.2);
  else if (k === 11) {
    p.ellipse(6, 6, 4, 4, IRON.slice(1, 6), 3);
    p.px(4, 4, IRON[5], 3.5);
  } else glowBall([HA.gold[0], HA.gold[1], HA.gold[3], '#fff4c8'], 1.4);
  p.outline(S.outline);
  return p;
}
