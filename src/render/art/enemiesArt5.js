// The secret bestiary's art. Standard enemy layout: 0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet, stride } from './bossesArt4.js';

export function stdAnims(walkFps = 7) {
  return {
    idle: { start: 0, count: 2, fps: 2.5, loop: true },
    walk: { start: 2, count: 4, fps: walkFps, loop: true },
    windup: { start: 6, count: 1, fps: 1, loop: true },
    attack: { start: 7, count: 1, fps: 1, loop: true },
    death: { start: 8, count: 3, fps: 6, loop: false },
  };
}

const DROWN = ['#1a2422', '#2a3a36', '#3e524c', '#56706a', '#74908a'];
const WEED = ['#14301e', '#1e4a2a', '#2e6a38', '#48904c'];
const EEL = ['#0e1a1e', '#16282e', '#203a42', '#2e525a', '#427076', '#5e9094'];
const NUN = ['#08060c', '#120e18', '#1e1828', '#2c2438', '#3c324a'];
const WIMPLE = ['#8a8494', '#b4aec0', '#dcd6e6', '#f6f2fa'];
const ROBE_R = ['#1a080a', '#2e0e12', '#46161a', '#601e24'];
const BRASS = ['#4a3410', '#8a6420', '#c49a38', '#ecd078'];
const IMP = ['#2a0e06', '#4a1a0a', '#702a10', '#9a3e18', '#c45a24'];
const SOOT = ['#100c0a', '#1c1612', '#2a221c', '#3a3028', '#4e4236'];
const IRONK = ['#121214', '#1e1e22', '#2e2e34', '#424248', '#5a5a62', '#76767e'];
const FIRE = ['#a03008', '#e05a10', '#ff9a30', '#ffe080'];

// Drowned Pilgrim (30 x 34): bloated, weed-hung, water dribbling from its mouth
export const drownedFrame = makeSheet(30, 34, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    p.ellipse(15, 30, 11 + pose.i, 3, DROWN, 3);
    p.ellipse(15, 32, 12 + pose.i * 2, 1.6, ['#0e3442', '#1a5266'], 1, false);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const b = pose.bob;
  limb(p, 12, 22 + b, 11 + bl, 32, 2.6, 2.2, DROWN, 4);
  limb(p, 18, 22 + b, 19 + fl, 32, 2.6, 2.2, DROWN, 4.4);
  p.ellipse(15, 18 + b, 8, 8, DROWN, 7); // a swollen body in a sodden habit
  for (let s = 0; s < 5; s++) limb(p, 9 + s * 3, 12 + b, 8 + s * 3 + (s % 2), 26 + b, 0.8, 0.5, WEED, 7.4); // hanging weed
  const reach = k === 'windup' ? -3 : k === 'attack' ? 2 : 0;
  limb(p, 8, 14 + b, 4, 22 + b + reach, 2, 1.6, DROWN, 6.8);
  limb(p, 22, 14 + b, 26, 22 + b + reach, 2, 1.6, DROWN, 7.6);
  const hy = 8 + b;
  p.ellipse(15, hy, 5, 5, DROWN.slice(1), 8);
  glowEye(p, 13, hy, '#a0e0d0', 8.4, 1);
  glowEye(p, 17, hy, '#a0e0d0', 8.4, 1);
  const open = k === 'windup' || k === 'attack';
  p.ellipse(15, hy + 3, open ? 2 : 1.2, open ? 1.6 : 0.8, ['#061016', '#0e2a34'], 8.2);
  if (k === 'attack') for (let s = 0; s < 4; s++) p.lit(18 + s * 2, hy + 3 + s, '#3a8aa2', 8, 0.6); // a gout of water
  spots(p, 6, 2, 18, 28, ['#0e3442', WEED[2]], 0.04, 202);
}, '#5a807a');

// Cistern Eel (36 x 28): a slick serpent rearing out of the water, a fanged maw
export const eelFrame = makeSheet(36, 28, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 6; s++) p.ellipse(6 + s * 5, 25 - (s % 2), 3, 2.4, EEL, 3);
    return;
  }
  const rear = k === 'attack' ? 4 : k === 'windup' ? -2 : pose.bob;
  // coils on the water, then the neck rising
  p.ellipse(18, 25, 14, 3, ['#0e3442', '#1a5266', '#3a8aa2'], 1, false); // ripples
  limb(p, 4, 24, 12, 22, 3, 3.6, EEL, 4);
  limb(p, 12, 22, 20, 14 - rear, 3.6, 3.2, EEL, 6);
  limb(p, 20, 14 - rear, 26, 8 - rear, 3.2, 3, EEL, 7);
  for (let s = 0; s < 4; s++) p.px(14 + s * 3, 16 - s * 2 - rear, '#7ab0b0', 7.4); // a pale belly line
  shape(p, [[18, 8 - rear], [20, 2 - rear], [22, 9 - rear]], EEL.slice(2), 7.2); // a dorsal fin
  // the head and its jaws
  const hx = 28;
  const hy = 8 - rear;
  p.ellipse(hx, hy, 5, 3.6, EEL, 8);
  glowEye(p, hx, hy - 2, '#e0ff60', 8.6, 1);
  const open = k === 'attack' || k === 'windup';
  if (open) {
    shape(p, [[hx + 1, hy], [hx + 8, hy - 3], [hx + 8, hy + 4], [hx + 1, hy + 2]], ['#2a0608', '#4a0c10'], 8.4, { flat: 0.6 });
    for (let x = hx + 3; x <= hx + 7; x += 2) {
      p.px(x, hy - 1, '#e8e0c8', 8.8);
      p.px(x, hy + 3, '#e8e0c8', 8.8);
    }
  } else p.hline(hx + 1, hx + 5, hy + 1, '#06080a', 8.4);
}, '#6aa0a0');

// Hollow Nun (26 x 36): a floating habit, a white wimple, no face at all - two pinpricks of violet
export const nunFrame = makeSheet(26, 36, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    shape(p, [[3, 32], [23, 32], [20, 34 - (2 - pose.i) * 3], [6, 34 - (2 - pose.i) * 3]], NUN, 3);
    return;
  }
  const b = Math.round(Math.sin((pose.i || 0) * 1.6 + pose.bob) * 1.5);
  for (let s = 0; s < 4; s++) limb(p, 7 + s * 4, 28 + b, 6 + s * 4 + (s % 2 ? 1 : -1), 35, 1.6, 0.4, NUN.slice(0, 3), 3); // a hem of smoke
  shape(p, [[8, 12 + b], [18, 12 + b], [22, 30 + b], [4, 30 + b]], NUN, 7, { folds: 1 });
  const raise = k === 'windup' ? -8 : k === 'attack' ? -4 : 0;
  limb(p, 8, 15 + b, 4, 22 + b + raise, 1.6, 1.2, NUN, 6.6);
  limb(p, 18, 15 + b, 22, 22 + b + raise, 1.6, 1.2, NUN, 7.4);
  for (const hx of [4, 22]) p.ellipse(hx, 23 + b + raise, 1.4, 1.4, WIMPLE, 7.6); // pale hands
  // the wimple and a void where the face should be
  p.ellipse(13, 8 + b, 6, 6.4, WIMPLE, 8);
  p.ellipse(13, 9 + b, 3.6, 4, ['#000000', '#06040a'], 8.4);
  p.lit(12, 8 + b, '#c070ff', 8.6, 1.4);
  p.lit(14, 8 + b, '#c070ff', 8.6, 1.4);
  for (let y = 12; y <= 22; y += 2) p.px(13, y + b, BRASS[2], 7.2); // a rosary of gold
  if (k === 'windup') for (let a = 0; a < 8; a++) p.lit(13 + Math.cos(a * 0.8) * 9, 16 + b + Math.sin(a * 0.8) * 9, '#c070ff', 6, 0.6);
}, '#8a70a0');

// Censer Acolyte (28 x 34): a hooded red robe, a brass censer swinging on its chain, smoke curling
export const acolyteFrame = makeSheet(28, 34, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    shape(p, [[3, 30], [24, 29], [25, 33], [2, 33]], ROBE_R, 3);
    p.ellipse(22, 31, 2.6, 2.4, BRASS, 4);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const b = pose.bob;
  limb(p, 11, 24 + b, 10 + bl, 32, 2, 1.6, ROBE_R.slice(0, 3), 3.6);
  limb(p, 16, 24 + b, 17 + fl, 32, 2, 1.6, ROBE_R.slice(0, 3), 4);
  shape(p, [[9, 10 + b], [19, 10 + b], [22, 28 + b], [6, 28 + b]], ROBE_R, 7, { folds: 1 });
  for (let y = 14; y < 28; y += 4) p.px(14, y + b, BRASS[2], 7.4);
  // the censer: swung out wide when it spins
  const swing = k === 'windup' ? 9 : k === 'attack' ? -9 : Math.sin((pose.i || 0) * 1.6) * 4;
  limb(p, 19, 14 + b, 22, 18 + b, 1.6, 1.2, ROBE_R, 7.6);
  const cx = 22 + swing * 0.5;
  const cy = 26 + b - Math.abs(swing) * 0.4;
  for (let t = 0; t <= 1; t += 0.2) p.px(22 + (cx - 22) * t, 18 + b + (cy - 18 - b) * t, BRASS[1], 7.8);
  p.ellipse(cx, cy, 2.6, 2.4, BRASS, 8);
  p.lit(cx, cy, '#a0ff60', 8.4, 0.8);
  for (let s = 0; s < 3; s++) p.lit(cx + Math.sin(s * 2) * 2, cy - 3 - s * 2, '#7a9a6a', 7, 0.3); // smoke
  // the hood, a shadowed face, sickly eyes
  shape(p, [[9, 4 + b], [14, 0 + b], [19, 4 + b], [20, 12 + b], [8, 12 + b]], ROBE_R, 8.4);
  p.ellipse(14, 8 + b, 3.4, 3, ['#060406', '#100a0c'], 8.6);
  glowEye(p, 12, 8 + b, '#a0ff60', 8.8, 1);
  glowEye(p, 16, 8 + b, '#a0ff60', 8.8, 1);
}, '#a04a40');

// Bellows Imp (26 x 26): a squat ember-skinned imp with a bellows strapped to its back
export const bellowsFrame = makeSheet(26, 26, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    p.ellipse(13, 22, 7 - pose.i, 3, IMP, 3);
    for (let s = 0; s < 4 - pose.i; s++) p.lit(8 + s * 3, 20 - s, FIRE[2], 3.4, 1);
    return;
  }
  const b = pose.bob;
  // the bellows on its back
  shape(p, [[2, 8 + b], [10, 6 + b], [10, 18 + b], [2, 16 + b]], ['#2a1a0a', '#4a2e14', '#6a4220'], 4, { flat: 0.4 });
  p.vline(6, 8 + b, 16 + b, '#1a0e06', 4.4);
  limb(p, 9, 18 + b, 9, 24, 1.6, 1.4, IMP, 4);
  limb(p, 15, 18 + b, 15, 24, 1.6, 1.4, IMP, 4.4);
  p.ellipse(13, 14 + b, 6, 5.4, IMP, 6.5);
  // the snout, drawn up to blow
  const blow = k === 'windup' || k === 'attack';
  p.ellipse(15, 8 + b, 4.6, 4.2, IMP, 7);
  limb(p, 12, 4 + b, 10, 1 + b, 1, 0.4, ['#e8d8a0', '#fff0c0'], 7.2); // horns
  limb(p, 17, 4 + b, 19, 1 + b, 1, 0.4, ['#e8d8a0', '#fff0c0'], 7.2);
  glowEye(p, 14, 7 + b, FIRE[3], 7.6, 1);
  glowEye(p, 17, 7 + b, FIRE[3], 7.6, 1);
  if (blow) {
    p.ellipse(20, 9 + b, 1.8, 1.6, ['#1a0606', '#3a0a06'], 7.4);
    if (k === 'attack') for (let s = 0; s < 5; s++) p.lit(21 + s, 9 + b + (s % 2), FIRE[1 + (s % 3)], 7.6, 1.6);
  }
  spots(p, 7, 9, 12, 10, FIRE[1], 0.06, 66); // glowing cracks in its hide
}, '#e07040');

// Anvil Knight (36 x 40): squat, broad, armour like a smith's anvil, a hammer bigger than its head
export const anvilknightFrame = makeSheet(36, 40, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let r = 0; r < 5; r++) p.bevelRect(4 + r * 6, 32 - (r % 2) * 2 - (2 - pose.i) * 2, 6, 5, IRONK.slice(1, 5), 4, 1);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const b = pose.bob + (k === 'attack' ? 1 : 0);
  limb(p, 13, 28 + b, 12 + bl, 38, 3.4, 3, IRONK, 4);
  limb(p, 23, 28 + b, 24 + fl, 38, 3.4, 3, IRONK, 4.4);
  // the body: an anvil's horned shape
  shape(p, [[6, 12 + b], [30, 12 + b], [34, 16 + b], [28, 18 + b], [27, 30 + b], [9, 30 + b], [8, 18 + b], [2, 16 + b]], IRONK, 8, { flat: 0.3 });
  p.hline(6, 30, 12 + b, IRONK[5], 8.4);
  for (const [x, y] of [[12, 22], [24, 22], [18, 26]]) p.lit(x, y + b, FIRE[2], 8.2, 0.7); // the forge-glow between the plates
  // the hammer
  const sw = k === 'windup' ? [26, 4, 20, -4] : k === 'attack' ? [30, 22, 34, 34] : [30, 22, 33, 10];
  limb(p, 28, 16 + b, sw[0], sw[1] + b, 2.6, 2.2, IRONK, 8.6);
  limb(p, sw[0], sw[1] + b, sw[2], sw[3] + b, 1, 1, ['#2e1c10', '#4a2e18', '#6a4424'], 9);
  p.bevelRect(sw[2] - 4, sw[3] + b - 3, 8, 6, IRONK.slice(1, 6), 9.4, 1);
  // the helm: a bucket of iron with a slit of fire
  p.bevelRect(12, 2 + b, 12, 11, IRONK.slice(1, 6), 9, 1);
  p.hline(14, 21, 7 + b, '#0a0404', 9.4);
  for (let x = 14; x <= 21; x++) p.lit(x, 7 + b, FIRE[x % 2 ? 2 : 3], 9.6, 1.4);
}, '#9a8a7a');
