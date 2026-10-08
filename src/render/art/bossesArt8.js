// The secret bosses: the Cistern Leviathan, the Mirror Queen, the First King's Shade,
// the Bone Organist and the Faceless Saint. Same layout as the other boss sheets.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet } from './bossesArt4.js';

const SEA = ['#08141a', '#0e2028', '#163038', '#20444c', '#2e5c62', '#427a7c', '#5e9a96'];
const BELLY = ['#3a5a4a', '#5a7e66', '#7ea488', '#a8c8a8'];
const WATER = ['#0e3442', '#1a5266', '#3a8aa2', '#7ac0d0'];
const GLASS = ['#3a4a5a', '#5a7088', '#88a4c0', '#c0d8f0', '#f0f8ff'];
const GOWN = ['#1a1428', '#2a2240', '#3e3258', '#544672', '#6e5e8e'];
const GOLD = ['#4a3410', '#8a6420', '#c49a38', '#ecd078', '#fff0b0'];
const GHOST = ['#1a2a3a', '#2a4058', '#3e5a7a', '#5a7a9e', '#80a0c4', '#b0d0f0'];
const BONE = ['#4a4232', '#7a6e54', '#a89a78', '#d0c4a0', '#ece2c4'];
const ROBE = ['#0e0a0e', '#1a141a', '#281e28', '#382a38'];
const SAINT = ['#8a8070', '#b0a690', '#d4cab0', '#efe6d0', '#fffaf0'];
const HOLY = '#fff0a0';

// ===================== THE CISTERN LEVIATHAN (96 x 80) =====================
export const leviathanFrame = makeSheet(96, 80, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(48, 74, 40, 5, WATER, 2, false);
    for (let s = 0; s < 6 - i * 2; s++) p.ellipse(16 + s * 13, 70 - (s % 2) * 3 + i * 2, 7, 5, SEA, 5);
    return;
  }
  const rise = k === 'windup' ? -6 : k === 'attack' ? 4 : k === 'cast' ? -8 : Math.round(Math.sin((pose.i || pose.bob) * 1.4) * 2);
  // the black water it rises from, with coils breaking the surface
  p.ellipse(48, 72, 44, 7, WATER, 1, false);
  for (const [x, w] of [[12, 9], [80, 8]]) {
    p.ellipse(x, 70, w, 6, SEA, 4);
    for (let f = -1; f <= 1; f++) p.px(x + f * 3, 63, SEA[6], 4.4);
  }
  // the great neck, scaled, with a pale belly
  limb(p, 40, 74, 44, 46 + rise, 13, 11, SEA, 8);
  limb(p, 44, 46 + rise, 50, 26 + rise, 11, 9, SEA, 9);
  shape(p, [[44, 70], [52, 70], [52, 30 + rise], [46, 30 + rise]], BELLY, 9.4, { flat: 0.5 });
  for (let y = 34; y < 70; y += 5) p.hline(45, 52, y + (y < 50 ? rise : 0), BELLY[0], 9.6);
  spots(p, 30, 22, 30, 50, [SEA[1], SEA[5]], 0.05, 1201);
  // fins along its back
  for (let s = 0; s < 5; s++) shape(p, [[34 - s, 60 - s * 8 + rise * (s / 5)], [26 - s * 2, 56 - s * 9 + rise * (s / 5)], [36 - s, 52 - s * 8 + rise * (s / 5)]], SEA.slice(2), 8.6);
  // the head: long, crested, a jaw full of needles
  const hx = 54;
  const hy = 18 + rise;
  p.ellipse(hx, hy, 14, 10, SEA, 10);
  limb(p, hx + 6, hy + 2, hx + 20, hy + 6, 7, 3, SEA, 10.2);
  for (let s = 0; s < 4; s++) limb(p, hx - 6 + s * 4, hy - 8, hx - 12 + s * 3, hy - 18 - s * 2, 1.4, 0.4, SEA.slice(3), 10.4); // a crest of spines
  glowEye(p, hx + 2, hy - 3, '#e0ff60', 10.8, 2);
  glowEye(p, hx + 9, hy - 2, '#e0ff60', 10.8, 2);
  const open = k === 'attack' || k === 'cast' || k === 'windup';
  if (open) {
    shape(p, [[hx + 4, hy + 4], [hx + 22, hy + 4], [hx + 20, hy + 12], [hx + 6, hy + 10]], ['#200608', '#3a0a0e', '#5a1418'], 10.6, { flat: 0.6 });
    for (let x = hx + 6; x <= hx + 20; x += 2) {
      p.px(x, hy + 5, '#e8e0c8', 11);
      p.px(x + 1, hy + 10, '#e8e0c8', 11);
    }
  } else p.hline(hx + 4, hx + 20, hy + 6, '#06080a', 10.6);
  if (k === 'cast') for (let a = 0; a < 10; a++) p.lit(48 + Math.cos(a * 0.63) * 30, 60 + Math.sin(a * 0.63) * 8, WATER[3], 3, 0.7);
}, '#7ab0b0');

// ===================== THE MIRROR QUEEN (56 x 72) =====================
export const mirrorqueenFrame = makeSheet(56, 72, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 1.5);
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 14 - i * 4; s++) shape(p, [[8 + ((s * 13) % 40), 66 - ((s * 7) % 10)], [11 + ((s * 13) % 40), 60 - ((s * 7) % 10) - i * 3], [13 + ((s * 13) % 40), 66 - ((s * 7) % 10)]], GLASS, 4);
    return;
  }
  // a gown of glass shards over violet silk
  shape(p, [[18, 24 + b], [38, 24 + b], [50, 68], [6, 68]], GOWN, 8, { folds: 0.8 });
  for (let s = 0; s < 16; s++) {
    const x = 10 + ((s * 17) % 36);
    const y = 34 + ((s * 11) % 30);
    shape(p, [[x, y + 3], [x + 2, y - 2], [x + 4, y + 3]], GLASS, 8.6);
  }
  // arms: one holds the hand mirror up to her face, one reaches
  const raise = k === 'cast' || k === 'windup' ? -10 : 0;
  limb(p, 20, 28 + b, 12, 40 + b + raise, 2, 1.6, GOWN, 8.4);
  p.ellipse(10, 42 + b + raise, 1.8, 1.6, ['#c8b8c8', '#f0e0f0'], 8.8);
  limb(p, 36, 28 + b, 42, 20 + b, 2, 1.6, GOWN, 9.4);
  limb(p, 42, 20 + b, 43, 10 + b, 0.8, 0.8, GOLD, 9.6); // the mirror's handle
  p.ellipse(43, 6 + b, 5, 6, GOLD, 9.8);
  p.ellipse(43, 6 + b, 3.6, 4.6, GLASS.slice(2), 10.2);
  p.lit(42, 4 + b, '#ffffff', 10.4, 1.2);
  // her face: beautiful and cold, a crown of glass spikes
  const hy = 16 + b;
  p.ellipse(28, hy, 6, 7, ['#8a8090', '#b0a6b6', '#d6ccdc', '#f2eaf6'], 10);
  glowEye(p, 25, hy - 1, '#a0e0ff', 10.4, 2);
  glowEye(p, 30, hy - 1, '#a0e0ff', 10.4, 2);
  p.hline(26, 30, hy + 4, '#5a2a4a', 10.4);
  for (let s = 0; s < 5; s++) shape(p, [[21 + s * 3, hy - 6], [22.5 + s * 3, hy - 12 - (s % 2) * 4], [24 + s * 3, hy - 6]], GLASS, 10.6);
}, '#a8b8e0');

// ===================== THE FIRST KING'S SHADE (64 x 72) =====================
export const firstkingFrame = makeSheet(64, 72, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 1.5);
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 12 - i * 4; s++) p.lit(14 + ((s * 9) % 36), 60 - ((s * 7) % 20) - i * 6, GHOST[5], 3, 0.8);
    for (let x = 24; x <= 40; x++) p.px(x, 66, GOLD[x % 2 ? 1 : 2], 4); // the old crown left behind
    return;
  }
  // a translucent knight in ancient armour, his legs fading into mist
  for (let s = 0; s < 5; s++) limb(p, 22 + s * 5, 50 + b, 20 + s * 6 + (s % 2 ? 2 : -2), 70, 3, 0.5, GHOST.slice(0, 4), 3);
  shape(p, [[18, 22 + b], [46, 22 + b], [48, 40 + b], [42, 54 + b], [22, 54 + b], [16, 40 + b]], GHOST, 9);
  for (const x of [26, 32, 38]) p.line(x, 26 + b, x, 50 + b, GHOST[1], 9.4);
  p.ellipse(16, 25 + b, 7, 5, GHOST, 10);
  p.ellipse(48, 25 + b, 7, 5, GHOST, 10.5);
  // a tattered royal cape of faded blue
  shape(p, [[20, 22 + b], [44, 22 + b], [50, 60], [14, 60]], ['#0a1430', '#121e44', '#1a2a5a'], 4, { folds: 1 });
  // the great sword of the first king
  const sw = { windup: [48, 6, 30, -4], attack: [54, 44, 64, 70], cast: [32, 4, 32, -6] }[k] || [50, 40, 56, 6];
  limb(p, 48, 28 + b, sw[0], sw[1] + b, 3.6, 3, GHOST, 11);
  limb(p, sw[0], sw[1] + b, sw[2], sw[3] + b, 2.6, 1.2, GHOST.slice(2), 11.6);
  const len = Math.hypot(sw[2] - sw[0], sw[3] - sw[1]) || 1;
  for (let t = 4; t < len; t += 2) p.lit(sw[0] + ((sw[2] - sw[0]) * t) / len, sw[1] + b + ((sw[3] - sw[1]) * t) / len, HOLY, 11.8, 0.5);
  limb(p, 14, 28 + b, 10, 44 + b, 3.4, 3, GHOST.slice(0, 5), 8.6);
  // the helm under a crown older than the Keep
  const hy = 12 + b;
  p.ellipse(32, hy, 8, 8.5, GHOST, 12);
  p.hline(26, 38, hy, '#000814', 12.4);
  for (let x = 27; x <= 37; x++) p.lit(x, hy, x === 29 || x === 35 ? '#ffffff' : GHOST[5], 12.6, x === 29 || x === 35 ? 2 : 0.8);
  for (let x = 24; x <= 40; x++) p.px(x, hy - 7, GOLD[x % 3 ? 2 : 3], 12.8);
  for (const x of [24, 28, 32, 36, 40]) {
    p.px(x, hy - 8, GOLD[3], 13);
    p.px(x, hy - 9, GOLD[4], 13.2);
  }
}, '#a0c8f0');

// ===================== THE BONE ORGANIST (80 x 72) =====================
export const organistFrame = makeSheet(80, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    for (let r = 0; r < 12 - i * 3; r++) p.ellipse(8 + r * 6, 66 - (r % 3) * 2, 3, 2.6, BONE, 4);
    return;
  }
  // the organ: pipes of bone rising behind him, each topped with a skull
  for (let s = 0; s < 9; s++) {
    const x = 8 + s * 8;
    const h = 40 - Math.abs(s - 4) * 6;
    limb(p, x, 50, x, 50 - h, 2.6, 2.4, BONE, 4 + (4 - Math.abs(s - 4)) * 0.3);
    p.ellipse(x, 48 - h, 3, 3, BONE, 5);
    p.px(x - 1, 48 - h, '#0a0806', 5.3);
    p.px(x + 1, 48 - h, '#0a0806', 5.3);
    if (k === 'cast' || k === 'attack' || k === 'windup') p.lit(x, 52 - h, '#9ad0ff', 5.4, 0.6);
  }
  // the keyboard and its frame of ribs
  shape(p, [[6, 48], [74, 48], [72, 62], [8, 62]], ROBE, 6, { flat: 0.4 });
  for (let x = 10; x < 70; x += 4) p.vline(x, 50, 54, BONE[3], 6.4);
  for (let x = 12; x < 70; x += 8) p.vline(x, 50, 52, '#0a0806', 6.6);
  // the organist, hunched at the keys, from behind - a skeletal player in a long black coat
  shape(p, [[30, 30 + b], [50, 30 + b], [54, 62], [26, 62]], ROBE, 8, { folds: 1 });
  const play = k === 'walk' || k === 'idle' ? Math.sin((pose.i || 0) * 2 + pose.bob) * 3 : k === 'cast' ? -8 : 0;
  limb(p, 30, 34 + b, 22, 50 + play, 2, 1.4, BONE, 8.4);
  limb(p, 50, 34 + b, 58, 50 - play, 2, 1.4, BONE, 8.4);
  for (const [x, y] of [[22, 51 + play], [58, 51 - play]]) for (let c = -1; c <= 1; c++) p.px(x + c * 2, y + 1, BONE[3], 8.6);
  // his skull, turned to look back at you
  const hy = 24 + b;
  p.ellipse(40, hy, 7, 7.5, BONE, 9);
  p.ellipse(37, hy, 2, 2.2, '#0a0806', 9.4);
  p.ellipse(43, hy, 2, 2.2, '#0a0806', 9.4);
  p.lit(37, hy, '#9ad0ff', 9.6, 1.6);
  p.lit(43, hy, '#9ad0ff', 9.6, 1.6);
  for (let x = 37; x <= 43; x += 2) p.px(x, hy + 5, BONE[1], 9.4);
  shape(p, [[32, hy - 6], [48, hy - 6], [46, hy - 10], [34, hy - 10]], ROBE.slice(1), 9.6); // a crushed tricorn
}, '#c8bca0');

// ===================== THE FACELESS SAINT (64 x 80) =====================
export const facelesssaintFrame = makeSheet(64, 80, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.3) * 2);
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 16 - i * 5; s++) p.lit(10 + ((s * 11) % 44), 70 - ((s * 7) % 30) - i * 8, HOLY, 3, 1);
    return;
  }
  const spread = k === 'cast' || k === 'windup' ? 1 : 0.6;
  // wings of pale feathers
  for (const side of [-1, 1]) {
    for (let f = 0; f < 5; f++) {
      const ang = -1.2 + f * 0.3;
      const len = 22 + f * 2;
      limb(p, 32 + side * 6, 30 + b, 32 + side * (8 + Math.cos(ang) * len * spread), 30 + b + Math.sin(ang) * len, 3.2, 1, SAINT.slice(0, 4), 4 + f * 0.1);
    }
  }
  // a halo, cracked
  for (let a = 0; a < 40; a++) {
    if (a > 30 && a < 34) continue; // the crack
    const t = (a / 40) * Math.PI * 2;
    p.lit(32 + Math.cos(t) * 11, 10 + b + Math.sin(t) * 4, HOLY, 12, 1.2);
  }
  // white robes, floating; a stole of gold
  for (let s = 0; s < 5; s++) limb(p, 22 + s * 5, 66 + b, 21 + s * 5 + (s % 2 ? 2 : -2), 78, 2.4, 0.5, SAINT.slice(0, 3), 4);
  shape(p, [[24, 24 + b], [40, 24 + b], [46, 68 + b], [18, 68 + b]], SAINT, 9, { folds: 0.9 });
  shape(p, [[29, 24 + b], [35, 24 + b], [34, 66 + b], [30, 66 + b]], GOLD, 9.4, { flat: 0.5 });
  // hands pressed together - or opened to give
  const open = k === 'cast' || k === 'attack' ? 8 : 0;
  limb(p, 24, 30 + b, 30 - open, 40 + b, 2.2, 1.8, SAINT, 10);
  limb(p, 40, 30 + b, 34 + open, 40 + b, 2.2, 1.8, SAINT, 10.2);
  if (open) {
    p.lit(30 - open, 41 + b, HOLY, 10.4, 2);
    p.lit(34 + open, 41 + b, HOLY, 10.4, 2);
  }
  // the face: smooth, blank, nothing at all
  const hy = 18 + b;
  p.ellipse(32, hy, 6, 7, SAINT, 11);
  p.ellipse(32, hy + 1, 3.6, 4, SAINT.slice(2), 11.4);
  shape(p, [[25, hy - 2], [32, hy - 9], [39, hy - 2], [40, hy + 6], [24, hy + 6]], SAINT.slice(0, 4), 10.6); // a veil
  p.ellipse(32, hy + 1, 4.6, 5.4, SAINT.slice(2), 11.6);
}, '#fff0c0');
