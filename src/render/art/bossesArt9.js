// The Deep's bosses: the World-Root, the Rime Queen, the Sunken King, the Crystal Wyrm and the
// Hollow. Same layout as the other boss sheets (0-1 idle, 2-5 walk, 6 windup, 7 attack, 8-10 death,
// 11 cast). Frames face right. y points DOWN.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet } from './bossesArt4.js';

const ROOT = ['#140a04', '#24140a', '#3a2212', '#56341c', '#744a28', '#946436'];
const SAP = ['#5a2a06', '#a0600a', '#ffb030', '#fff0a8'];
const ICE = ['#1a2a3c', '#2a4460', '#466a8c', '#6e96b8', '#9ec0dc', '#d8ecfa', '#ffffff'];
const GOWN = ['#0e1828', '#18283e', '#243a58', '#345276', '#4a6e96'];
const VERD = ['#0c1e1a', '#163430', '#22504a', '#337066', '#4a8e82', '#6eb0a2'];
const BRONZE = ['#2a2010', '#4a3a1a', '#6e5a2a', '#968040', '#c0a860', '#e8d48a'];
const WEED = ['#0e2a1a', '#1a4228', '#2a6038'];
const AMETH = ['#1e0a30', '#3a1458', '#5a2486', '#8040b8', '#b070e0', '#e0b0ff', '#fff0ff'];
const VOID = ['#030104', '#08040c', '#100816', '#1a0e22', '#26142e'];
const CRIMSON = '#ff3a50';
const IRON = ['#141418', '#24242a', '#38383f', '#505058'];

// ===================== THE WORLD-ROOT (96 x 80): a colossal knot of roots round a glowing amber heart
export const worldrootFrame = makeSheet(96, 80, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 9 - i * 3; s++) limb(p, 10 + s * 9, 76, 14 + s * 9, 70 - (s % 3) * 4 + i * 3, 3, 1.4, ROOT, 3);
    p.lit(48, 70, SAP[2], 3.4, 1 - i * 0.3);
    return;
  }
  const pulse = k === 'cast' || k === 'windup' ? 1 : 0;
  const lift = k === 'attack' ? -4 : Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.3));
  // roots spreading into the floor
  for (let s = 0; s < 8; s++) {
    const x = 6 + s * 12;
    limb(p, 48 + (x - 48) * 0.3, 60, x, 79, 3.4, 1.4, ROOT, 3 + (s % 2) * 0.4);
  }
  // the great knot: many twisted roots wound into a mass
  for (let s = 0; s < 10; s++) {
    const a = (s / 10) * Math.PI * 2;
    limb(p, 48 + Math.cos(a) * 26, 40 + lift + Math.sin(a) * 20, 48 + Math.cos(a + 2) * 18, 40 + lift + Math.sin(a + 2) * 14, 5, 4, ROOT, 6 + (s % 3) * 0.4);
  }
  p.ellipse(48, 40 + lift, 24, 20, ROOT.slice(1), 6.2);
  spots(p, 26, 22, 44, 36, [ROOT[0], ROOT[4]], 0.05, 1301);
  // the heart, glowing through a split in the bark
  shape(p, [[44, 30 + lift], [52, 30 + lift], [55, 46 + lift], [41, 46 + lift]], ['#2a1206', '#3e1c0a'], 7);
  p.ellipse(48, 38 + lift, 5 + pulse, 7 + pulse, SAP, 7.4);
  p.lit(48, 36 + lift, SAP[3], 7.8, 2 + pulse);
  // two root arms, reaching
  const reach = k === 'windup' ? -10 : k === 'attack' ? 10 : 0;
  limb(p, 26, 34 + lift, 8, 18 + lift - reach * 0.5, 5, 2.2, ROOT, 7.6);
  limb(p, 70, 34 + lift, 88, 18 + lift + reach * 0.5, 5, 2.2, ROOT, 7.8);
  for (const [x, y] of [[8, 18], [88, 18]]) for (let f = -1; f <= 1; f++) limb(p, x, y + lift, x + f * 4, y - 7 + lift, 1.2, 0.4, ROOT, 7.9);
  // a crown of little glowing shoots
  for (let s = 0; s < 5; s++) p.lit(36 + s * 6, 16 + lift - (s % 2) * 3, SAP[2], 8, 0.8);
}, '#d09040');

// ===================== THE RIME QUEEN (56 x 76): a tall ice monarch, a crown of icicles, a frozen cape
export const rimequeenFrame = makeSheet(56, 76, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 14 - pose.i * 4; s++) shape(p, [[6 + ((s * 13) % 40), 72], [9 + ((s * 13) % 40), 66 - ((s * 7) % 8) - pose.i * 3], [12 + ((s * 13) % 40), 72]], ICE, 4);
    return;
  }
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 1.5);
  // the cape, frozen stiff into shards at the hem
  shape(p, [[18, 24 + b], [38, 24 + b], [52, 72], [4, 72]], GOWN, 5, { folds: 1 });
  for (let s = 0; s < 8; s++) shape(p, [[6 + s * 6, 70], [9 + s * 6, 62 - (s % 3) * 4], [12 + s * 6, 70]], ICE.slice(2), 5.4);
  shape(p, [[20, 24 + b], [36, 24 + b], [40, 62], [16, 62]], ICE.slice(1, 6), 7, { folds: 0.6 }); // the gown
  const raise = k === 'cast' || k === 'windup' ? -12 : k === 'attack' ? 4 : 0;
  limb(p, 20, 28 + b, 10, 40 + b + raise, 2, 1.6, ICE.slice(2), 7.6);
  limb(p, 36, 28 + b, 46, 40 + b + raise, 2, 1.6, ICE.slice(2), 7.8);
  if (raise < 0) for (const x of [10, 46]) p.lit(x, 38 + b + raise, ICE[6], 8, 1.4);
  // her face, pale blue; a crown of icicles
  const hy = 16 + b;
  p.ellipse(28, hy, 6, 7, ICE.slice(3), 8.4);
  glowEye(p, 26, hy - 1, '#9adcff', 8.8, 1.4);
  glowEye(p, 31, hy - 1, '#9adcff', 8.8, 1.4);
  for (let s = 0; s < 7; s++) shape(p, [[19 + s * 3, hy - 6], [20.5 + s * 3, hy - 12 - (s === 3 ? 8 : (s % 2) * 4)], [22 + s * 3, hy - 6]], ICE.slice(3), 8.8);
}, '#c0e4ff');

// ===================== THE SUNKEN KING (64 x 76): a drowned monarch in verdigris, a trident, weed for a beard
export const sunkenkingFrame = makeSheet(64, 76, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 72, 22 - i * 4, 4, ['#0a2a2a', '#164242'], 2);
    for (let s = 0; s < 6 - i * 2; s++) p.ellipse(16 + s * 6, 68 - (s % 2) * 2, 4, 3, VERD, 3);
    return;
  }
  const b = pose.bob;
  const step = pose.k === 'walk' ? [2, 0, -2, 0][pose.i] : 0;
  limb(p, 26, 52 + b, 24 + step, 72, 4, 3.4, VERD, 4);
  limb(p, 38, 52 + b, 40 - step, 72, 4, 3.4, VERD, 4.4);
  shape(p, [[18, 24 + b], [46, 24 + b], [48, 54 + b], [16, 54 + b]], VERD, 7, { flat: 0.4 }); // armour
  for (let y = 30; y < 54; y += 6) p.hline(18, 46, y + b, BRONZE[2], 7.2); // bronze bands
  for (let s = 0; s < 6; s++) limb(p, 19 + s * 5, 26 + b, 18 + s * 5 + (s % 2), 46 + b, 0.8, 0.5, WEED, 7.4); // weed
  p.ellipse(14, 26 + b, 7, 5, VERD, 7.6);
  p.ellipse(50, 26 + b, 7, 5, VERD, 7.8);
  // the trident
  // held in his right hand: upright, raised high on the wind-up, thrust forward on the strike
  const t = k === 'windup' ? [50, 36, 58, 4] : k === 'attack' ? [44, 34, 64, 30] : [54, 50, 54, 8];
  limb(p, t[0], t[1] + b, t[2], t[3] + b, 1.2, 1, BRONZE, 8.4);
  for (const off of [-4, 0, 4]) {
    const dx = t[2] - t[0];
    const dy = t[3] - t[1];
    const l = Math.hypot(dx, dy) || 1;
    limb(p, t[2] - (dy / l) * off, t[3] + b + (dx / l) * off, t[2] - (dy / l) * off + (dx / l) * 6, t[3] + b + (dy / l) * 6 + (dx / l) * off, 0.8, 0.4, BRONZE.slice(2), 8.6);
  }
  limb(p, 14, 28 + b, 12, 44 + b, 3.4, 3, VERD, 8.2);
  limb(p, 50, 28 + b, t[0], t[1] + b - 2, 3.2, 2.8, VERD, 8.3); // the trident arm
  // the drowned face, the green crown
  const hy = 14 + b;
  p.ellipse(32, hy, 7, 7.5, VERD.slice(1), 9);
  glowEye(p, 29, hy - 1, '#80fff0', 9.4, 1.4);
  glowEye(p, 35, hy - 1, '#80fff0', 9.4, 1.4);
  for (let s = 0; s < 5; s++) limb(p, 27 + s * 2.5, hy + 4, 26 + s * 2.8, hy + 16 + (s % 2) * 3, 0.9, 0.4, WEED, 9.2); // weed beard
  for (let x = 24; x <= 40; x++) p.px(x, hy - 7, BRONZE[x % 3 ? 3 : 4], 9.6);
  for (const x of [24, 28, 32, 36, 40]) {
    p.px(x, hy - 8, BRONZE[4], 9.8);
    p.px(x, hy - 9, BRONZE[5], 10);
  }
}, '#70d0c0');

// ===================== THE CRYSTAL WYRM (96 x 64): a serpent of violet crystal, coiled, horned
export const crystalwyrmFrame = makeSheet(96, 64, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 16 - pose.i * 5; s++) shape(p, [[6 + ((s * 11) % 84), 62], [9 + ((s * 11) % 84), 54 - ((s * 7) % 8) - pose.i * 3], [12 + ((s * 11) % 84), 62]], AMETH, 3);
    return;
  }
  const w = (pose.i || 0) * 0.6 + pose.bob;
  const rear = k === 'windup' ? -6 : k === 'attack' ? 4 : 0;
  // the body coils along the ground, crystal spines down its back
  const pts = [];
  for (let s = 0; s <= 10; s++) pts.push([8 + s * 7, 50 + Math.sin(s * 0.9 + w) * 6]);
  for (let s = 0; s < 10; s++) {
    const [x0, y0] = pts[s];
    const [x1, y1] = pts[s + 1];
    limb(p, x0, y0, x1, y1, 5 - s * 0.15, 5 - (s + 1) * 0.15, AMETH.slice(0, 5), 4 + s * 0.1);
    shape(p, [[x0 + 1, y0 - 4], [x0 + 3, y0 - 11 - (s % 3) * 2], [x0 + 5, y0 - 4]], AMETH.slice(3), 4.6 + s * 0.1);
  }
  // the neck rising, the horned head
  const [nx, ny] = pts[10];
  const hx = 84;
  const hy = 20 + rear;
  limb(p, nx, ny, hx - 4, hy + 6, 5, 4, AMETH.slice(0, 5), 6);
  p.ellipse(hx, hy, 8, 6, AMETH.slice(0, 5), 7);
  for (const s of [-1, 1]) shape(p, [[hx - 4, hy - 3], [hx - 10, hy - 14 + s * 2], [hx - 1, hy - 5]], AMETH.slice(4), 7.4); // horns
  glowEye(p, hx + 2, hy - 2, '#ffd0ff', 7.8, 1.6);
  const open = k === 'attack' || k === 'windup' || k === 'cast';
  if (open) {
    shape(p, [[hx + 4, hy + 1], [hx + 13, hy - 2], [hx + 13, hy + 6], [hx + 4, hy + 4]], ['#2a0a3a', '#4a1468'], 7.6, { flat: 0.6 });
    p.lit(hx + 10, hy + 2, '#ffb0ff', 7.9, 1.6);
  }
  for (let s = 0; s < 6; s++) p.lit(14 + s * 12, 46 + Math.sin(s + w) * 4, AMETH[5], 5, 0.6); // light inside the crystal
}, '#e0a0ff');

// ===================== THE HOLLOW (96 x 96): the dark the crown was made to lock - a mountain of shadow,
// a crimson eye, tendrils, and on top of it all the Hollow Crown, worn at last
export const hollowFrame = makeSheet(96, 96, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 24 - i * 8; s++) p.lit(10 + ((s * 13) % 76), 90 - ((s * 7) % 50) - i * 8, CRIMSON, 3, 0.8);
    if (i < 2) {
      // the crown falls, and breaks
      for (let x = 38; x <= 58; x++) if ((x + i) % 4) p.px(x, 88, IRON[x % 2 ? 2 : 3], 4);
    }
    return;
  }
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.2) * 2);
  const surge = k === 'windup' || k === 'cast' ? -6 : k === 'attack' ? 4 : 0;
  // tendrils reaching out across the floor
  for (let s = 0; s < 8; s++) {
    const a = (s / 8) * Math.PI + Math.PI * 0.05;
    const len = 34 + (s % 3) * 6 + (k === 'attack' ? 8 : 0);
    limb(p, 48, 70 + b, 48 - Math.cos(a) * len, 90 - Math.sin(a) * 6, 4, 1, VOID, 3 + (s % 2) * 0.3);
  }
  // the mass: a heaving mountain of dark
  shape(p, [[12, 90], [20, 50 + b], [34, 30 + b + surge], [62, 30 + b + surge], [76, 50 + b], [84, 90]], VOID, 6, { folds: 1.2 });
  for (let s = 0; s < 10; s++) p.lit(22 + ((s * 17) % 52), 52 + ((s * 11) % 30) + b, '#5a0e1e', 6.4, 0.5); // veins of light under it
  // the eye
  const ey = 52 + b + surge * 0.5;
  p.ellipse(48, ey, 11, 8, ['#1a0408', '#3a0810', '#600c18'], 7);
  p.ellipse(48, ey, 7, 6, ['#8a0e20', '#c01830', CRIMSON], 7.4);
  p.ellipse(48, ey, 2, 5, ['#050102'], 7.8); // a slit pupil
  p.lit(45, ey - 3, '#ffd0d8', 8, 1.2);
  // the Hollow Crown, worn at last: black iron, its points glowing
  const cy = 30 + b + surge;
  for (let x = 34; x <= 62; x++) p.px(x, cy, IRON[x % 3 ? 2 : 3], 8.4);
  for (let x = 34; x <= 62; x++) p.px(x, cy + 1, IRON[1], 8.3);
  for (let s = 0; s < 7; s++) {
    const x = 35 + s * 4.5;
    const h = s === 3 ? 10 : 5 + (s % 2) * 3;
    shape(p, [[x - 1.5, cy], [x, cy - h], [x + 1.5, cy]], IRON, 8.6);
    p.lit(x, cy - h, '#c070ff', 8.8, 1.1);
  }
}, '#c04050');
