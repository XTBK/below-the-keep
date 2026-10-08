// The Deep's creatures (floors 10-19). Standard enemy layout: 0-1 idle, 2-5 walk, 6 wind-up,
// 7 attack, 8-10 death. Frames face right (row 1 is the mirror). y points DOWN.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet, stride } from './bossesArt4.js';

const ROOT = ['#140a04', '#24140a', '#3a2212', '#56341c', '#744a28', '#946436'];
const SAP = ['#5a2a06', '#a0600a', '#ffb030', '#fff0a8'];
const ICE = ['#1a2a3c', '#2a4460', '#466a8c', '#6e96b8', '#9ec0dc', '#d8ecfa'];
const VERD = ['#0c1e1a', '#163430', '#22504a', '#337066', '#4a8e82', '#6eb0a2'];
const BRONZE = ['#2a2010', '#4a3a1a', '#6e5a2a', '#968040', '#c0a860'];
const PALE = ['#3a4a50', '#5a6e74', '#8296a0', '#acc2ca', '#d8eaf0'];
const AMETH = ['#1e0a30', '#3a1458', '#5a2486', '#8040b8', '#b070e0', '#e0b0ff'];
const ROBE = ['#120a1a', '#1e1228', '#2c1c3a', '#3e2850'];
const FLESH = ['#1a0408', '#30080e', '#4a0e18', '#6a1624', '#8e2032', '#b83448'];
const SHADOW = ['#050206', '#0c0610', '#160c1c', '#22142a', '#2e1c38'];

const deathPile = (p, cx, base, ramp, i, n = 4) => {
  for (let s = 0; s < n - Math.floor(i / 2); s++) p.ellipse(cx - 8 + s * 5, base - (s % 2), 3 + i * 0.4, 2, ramp, 3);
};

// ---------------------------------------------------------------- the Rootdeep
// Root Hound (36 x 26): a hound woven of roots, sap glowing in its eyes and joints
export const roothoundFrame = makeSheet(36, 26, (p, pose) => {
  const k = pose.k;
  if (k === 'death') return deathPile(p, 18, 23, ROOT, pose.i, 6);
  const b = pose.bob;
  const crouch = k === 'windup' ? 3 : 0;
  const leap = k === 'attack' ? -4 : 0;
  const [fl, bl] = stride(pose, 3);
  for (const [x, o, h] of [[10, bl, 3.6], [14, -bl, 4], [24, fl, 3.8], [28, -fl, 4.2]]) limb(p, x, 15 + b + crouch + leap, x + o, 24, 1.6, 1.2, ROOT, h);
  limb(p, 7, 14 + b + crouch + leap, 30, 13 + b + crouch + leap, 5, 4.2, ROOT, 6); // a body of twisted roots
  for (let s = 0; s < 6; s++) limb(p, 9 + s * 4, 10 + b + crouch + leap, 10 + s * 4, 16 + b + crouch + leap, 0.7, 0.4, ROOT.slice(2), 6.4);
  for (const x of [12, 20, 27]) p.lit(x, 14 + b + crouch + leap, SAP[2], 6.6, 0.7); // sap in the knots
  limb(p, 7, 13 + b + crouch + leap, 2, 7 + b + crouch + leap, 1.2, 0.5, ROOT, 6.2); // a tail of roots
  const hx = 32;
  const hy = 10 + b + crouch + leap;
  p.ellipse(hx, hy, 4.4, 3.6, ROOT, 7);
  limb(p, hx + 2, hy + 1, hx + 6, hy + 2, 1.6, 1.2, ROOT, 7.1);
  glowEye(p, hx, hy - 1, SAP[2], 7.6, 1.2);
  if (k === 'attack') for (let x = hx + 2; x <= hx + 6; x += 2) p.px(x, hy + 3, '#e8d8a0', 7.4);
}, '#c08a40');

// Sap Bulb (26 x 24): a swollen amber pod on a root stalk; it sinks into the floor and sprays sap
export const sapbulbFrame = makeSheet(26, 24, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    p.ellipse(13, 21, 9 + pose.i, 2.4, SAP.slice(0, 3), 2);
    return;
  }
  const swell = k === 'windup' ? 2 : k === 'attack' ? -1 : pose.bob * 0.5;
  limb(p, 13, 23, 13, 15, 2.2, 1.8, ROOT, 3);
  for (const s of [-1, 1]) limb(p, 13, 22, 13 + s * 7, 23, 1.2, 0.8, ROOT, 2.5); // roots spreading
  p.ellipse(13, 10, 7 + swell, 7 + swell, SAP, 6);
  for (let s = 0; s < 4; s++) limb(p, 8 + s * 3, 4, 7 + s * 3 + (s % 2), 16, 0.5, 0.4, ['#6a3a0a', '#8a4e10'], 6.4); // veins
  p.lit(11, 7, SAP[3], 6.8, 1.2);
  if (k === 'attack') for (let a = 0; a < 6; a++) p.lit(13 + Math.cos(a) * 10, 10 + Math.sin(a) * 8, SAP[2], 6.5, 0.6);
}, '#e0a040');

// ---------------------------------------------------------------- the Frozen Deep
// Rime Wraith (26 x 32): an icy ghost, its hem trailing frost
export const rimewraithFrame = makeSheet(26, 32, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 10 - pose.i * 3; s++) p.lit(6 + ((s * 7) % 14), 26 - ((s * 5) % 14) - pose.i * 3, ICE[5], 3, 0.8);
    return;
  }
  const b = pose.bob;
  const lean = k === 'attack' ? 3 : 0;
  shape(p, [[9 + lean, 10 + b], [17 + lean, 10 + b], [20, 28], [6, 28]], ICE.slice(0, 5), 6, { folds: 1 });
  for (let s = 0; s < 4; s++) limb(p, 8 + s * 4, 27, 7 + s * 4 + (s % 2 ? 2 : -1), 31, 1, 0.3, ICE.slice(2), 5); // frost trails
  const reach = k === 'windup' ? -4 : k === 'attack' ? 4 : 0;
  limb(p, 16 + lean, 14 + b, 22 + lean + reach, 18 + b, 1.2, 0.8, ICE.slice(2), 7);
  for (const dy of [-1, 1]) p.px(23 + lean + reach, 18 + b + dy, ICE[5], 7.2); // icicle claws
  const hy = 7 + b;
  p.ellipse(13 + lean, hy, 4.4, 5, ICE.slice(1), 8);
  shape(p, [[8 + lean, hy - 3], [13 + lean, hy - 9], [18 + lean, hy - 3]], ICE.slice(3), 8.2); // a hood of frost
  glowEye(p, 12 + lean, hy, '#e0f8ff', 8.6, 1);
  glowEye(p, 15 + lean, hy, '#e0f8ff', 8.6, 1);
}, '#b0d8ff');

// Ice Golem (38 x 38): a hulk of blue ice, frost-white at its edges
export const icegolemFrame = makeSheet(38, 38, (p, pose) => {
  const k = pose.k;
  if (k === 'death') return deathPile(p, 19, 35, ICE, pose.i, 6);
  const b = pose.bob;
  const [fl, bl] = stride(pose, 2);
  limb(p, 13, 26 + b, 12 + bl, 36, 4, 3.4, ICE, 4);
  limb(p, 25, 26 + b, 26 + fl, 36, 4, 3.4, ICE, 4.4);
  shape(p, [[8, 10 + b], [30, 9 + b], [33, 28 + b], [5, 28 + b]], ICE, 7, { flat: 0.6 });
  for (const [x, y] of [[11, 13], [22, 16], [16, 22], [27, 12]]) shape(p, [[x, y + b], [x + 3, y - 4 + b], [x + 5, y + b]], ICE.slice(3), 7.4); // frost crystals
  const swing = k === 'windup' ? -8 : k === 'attack' ? 6 : 0;
  limb(p, 7, 13 + b, 3, 26 + b + swing * 0.3, 3.6, 4.4, ICE, 7.6);
  limb(p, 31, 13 + b, 36, 22 + b + swing, 3.6, 4.6, ICE, 7.8);
  const hy = 7 + b;
  p.ellipse(19, hy, 6, 5, ICE.slice(1), 8);
  glowEye(p, 17, hy, '#9ad8ff', 8.6, 1.2);
  glowEye(p, 22, hy, '#9ad8ff', 8.6, 1.2);
}, '#c8e8ff');

// ---------------------------------------------------------------- the Sunken Kingdom
// Drowned Knight (30 x 36): verdigris armour streaming weed, a long lance
export const drownedknightFrame = makeSheet(30, 36, (p, pose) => {
  const k = pose.k;
  if (k === 'death') return deathPile(p, 15, 33, VERD, pose.i, 5);
  const b = pose.bob;
  const [fl, bl] = stride(pose, 2);
  limb(p, 12, 24 + b, 11 + bl, 34, 2.6, 2.2, VERD, 4);
  limb(p, 18, 24 + b, 19 + fl, 34, 2.6, 2.2, VERD, 4.4);
  shape(p, [[9, 12 + b], [21, 12 + b], [22, 26 + b], [8, 26 + b]], VERD, 7, { flat: 0.4 });
  p.hline(9, 21, 18 + b, BRONZE[3], 7.4); // a bronze sword-belt
  for (let s = 0; s < 4; s++) limb(p, 10 + s * 3, 14 + b, 9 + s * 3, 28 + b, 0.6, 0.4, ['#1e4a2a', '#2e6a38'], 7.6); // weed
  const lance = k === 'windup' ? -6 : k === 'attack' ? 8 : 0;
  limb(p, 20, 18 + b, 30 + lance, 17 + b, 1, 0.8, BRONZE, 8);
  p.px(30 + lance, 17 + b, '#e8f0e8', 8.4);
  const hy = 8 + b;
  p.ellipse(15, hy, 5, 5.4, VERD, 8.2);
  p.hline(12, 18, hy, '#020604', 8.6); // the visor slit
  p.lit(14, hy, '#80fff0', 8.8, 0.9);
  p.lit(17, hy, '#80fff0', 8.8, 0.9);
  shape(p, [[13, hy - 5], [15, hy - 10], [17, hy - 5]], BRONZE, 8.4); // a crest
}, '#70c0b0');

// Tide Siren (26 x 34): a pale drowned singer, hair floating as if underwater
export const tidesirenFrame = makeSheet(26, 34, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    p.ellipse(13, 31, 9 + pose.i, 2.4, ['#0e3442', '#1a5266', '#3a8aa2'], 2);
    return;
  }
  const b = pose.bob;
  shape(p, [[9, 14 + b], [17, 14 + b], [21, 32], [5, 32]], PALE, 6, { folds: 1 }); // a sodden gown
  const sing = k === 'windup' || k === 'attack';
  for (const s of [-1, 1]) limb(p, 13 + s * 4, 16 + b, 13 + s * (sing ? 11 : 6), (sing ? 10 : 24) + b, 1, 0.7, PALE.slice(1), 7);
  const hy = 9 + b;
  for (let s = 0; s < 6; s++) limb(p, 9 + s * 1.6, hy - 3, 6 + s * 2.4 + Math.sin(s + b) * 2, hy - 9 - (s % 2) * 2, 0.8, 0.4, ['#1a4a4a', '#2a6a68', '#40908a'], 7.6); // floating hair
  p.ellipse(13, hy, 4.4, 5, PALE.slice(1), 8);
  glowEye(p, 11, hy - 1, '#80fff0', 8.4, 1);
  glowEye(p, 15, hy - 1, '#80fff0', 8.4, 1);
  p.ellipse(13, hy + 3, sing ? 1.6 : 0.8, sing ? 1.8 : 0.6, ['#04080a', '#0e2a2a'], 8.4); // singing
  if (k === 'attack') for (let a = 0; a < 8; a++) p.lit(13 + Math.cos(a * 0.8) * 11, hy + 4 + Math.sin(a * 0.8) * 6, '#60e0d0', 8, 0.6);
}, '#90e0d8');

// ---------------------------------------------------------------- the Amethyst Caverns
// Crystal Spider (26 x 20): a spider grown of violet crystal
export const crystalspiderFrame = makeSheet(26, 20, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 6 - pose.i; s++) shape(p, [[5 + s * 3, 18], [6 + s * 3, 13 - (s % 3)], [8 + s * 3, 18]], AMETH, 3);
    return;
  }
  const b = pose.bob;
  const w = pose.k === 'walk' ? pose.i : 0;
  for (let s = 0; s < 4; s++) {
    const o = ((s + w) % 2) * 2;
    limb(p, 10 + s * 2, 11 + b, 3 + s * 2 - o, 18, 0.8, 0.5, AMETH.slice(1), 4);
    limb(p, 12 + s * 2, 11 + b, 19 + s * 2 + o, 18, 0.8, 0.5, AMETH.slice(1), 4.4);
  }
  p.ellipse(10, 10 + b, 6, 5, AMETH, 6); // the abdomen: a cluster of crystal
  shape(p, [[6, 8 + b], [8, 2 + b], [10, 8 + b]], AMETH.slice(3), 6.4);
  shape(p, [[10, 7 + b], [12, 1 + b], [14, 7 + b]], AMETH.slice(2), 6.6);
  p.ellipse(18, 11 + b, 3.6, 3, AMETH, 6.8);
  for (const [x, y] of [[19, 10], [20, 12], [17, 10]]) p.lit(x, y + b, '#ffb0ff', 7.2, 0.8);
  if (k === 'attack' || k === 'windup') p.lit(22, 12 + b, '#ff80ff', 7.4, 1.2);
}, '#d090ff');

// Shard Magus (26 x 34): a robed caster, a crown of floating crystal shards
export const shardmagusFrame = makeSheet(26, 34, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 8 - pose.i * 2; s++) shape(p, [[5 + s * 2, 32], [6 + s * 2, 27 - (s % 3) * 2], [8 + s * 2, 32]], AMETH, 3);
    return;
  }
  const b = pose.bob;
  shape(p, [[9, 13 + b], [17, 13 + b], [21, 32], [5, 32]], ROBE, 6, { folds: 0.9 });
  shape(p, [[11, 14 + b], [15, 14 + b], [14, 30], [12, 30]], AMETH.slice(1, 4), 6.4, { flat: 0.4 }); // a stole
  const cast = k === 'windup' || k === 'attack';
  for (const s of [-1, 1]) limb(p, 13 + s * 4, 16 + b, 13 + s * (cast ? 9 : 5), (cast ? 9 : 24) + b, 1.1, 0.8, ROBE.slice(1), 7);
  const hy = 9 + b;
  p.ellipse(13, hy, 4, 4.6, ROBE.slice(1), 8);
  shape(p, [[9, hy - 2], [13, hy - 8], [17, hy - 2]], ROBE.slice(2), 8.2); // a deep hood
  glowEye(p, 12, hy, '#ff90ff', 8.6, 1);
  glowEye(p, 15, hy, '#ff90ff', 8.6, 1);
  // the shards, circling
  for (let s = 0; s < 4; s++) {
    const a = s * 1.57 + (pose.i || 0) * 0.4;
    const x = 13 + Math.cos(a) * 9;
    const y = hy - 6 + Math.sin(a) * 3;
    shape(p, [[x - 1, y + 2], [x, y - 2], [x + 1, y + 2]], AMETH.slice(3), 9);
  }
}, '#d0a0ff');

// ---------------------------------------------------------------- the Hollow Heart
// Heart Leech (22 x 18): a flying crimson leech, all mouth
export const heartleechFrame = makeSheet(22, 18, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    p.ellipse(11, 15, 6 + pose.i, 2, FLESH, 2);
    return;
  }
  const flap = pose.k === 'walk' ? [0, -2, 0, 2][pose.i] : pose.bob;
  for (const s of [-1, 1]) shape(p, [[11, 8], [11 + s * 9, 3 + flap], [11 + s * 7, 10]], ['#2a0a14', '#4a1222', '#6a1a30'], 4); // leathery wings
  p.ellipse(11, 9, 5, 4, FLESH, 6);
  for (let s = 0; s < 3; s++) p.hline(8, 14, 7 + s * 2, FLESH[2], 6.2); // ringed body
  const open = k === 'windup' || k === 'attack';
  p.ellipse(16, 9, open ? 2.4 : 1.4, open ? 2.4 : 1.2, ['#0a0204', '#3a0610'], 6.6);
  if (open) for (const [dx, dy] of [[0, -2], [2, 0], [0, 2], [-1, 1]]) p.px(16 + dx, 9 + dy, '#f0d0c0', 7);
}, '#ff6070');

// Hollowborn (38 x 40): a hulking shadow, one crimson eye, arms like tree trunks
export const hollowbornFrame = makeSheet(38, 40, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    for (let s = 0; s < 14 - pose.i * 4; s++) p.lit(6 + ((s * 7) % 26), 36 - ((s * 5) % 18) - pose.i * 4, '#ff3a50', 3, 0.6);
    p.ellipse(19, 37, 14 - pose.i * 3, 3, SHADOW, 2);
    return;
  }
  const b = pose.bob;
  const [fl, bl] = stride(pose, 2);
  limb(p, 14, 28 + b, 13 + bl, 38, 4, 3.4, SHADOW, 4);
  limb(p, 24, 28 + b, 25 + fl, 38, 4, 3.4, SHADOW, 4.4);
  shape(p, [[7, 12 + b], [31, 12 + b], [33, 30 + b], [5, 30 + b]], SHADOW, 7, { folds: 0.8 });
  for (let s = 0; s < 5; s++) p.lit(10 + s * 5, 18 + b + (s % 2) * 4, '#5a1020', 7.2, 0.5); // veins of light under the skin
  const slam = k === 'windup' ? -12 : k === 'attack' ? 8 : 0;
  limb(p, 7, 15 + b, 3, 30 + b + slam * 0.4, 4.4, 5, SHADOW, 7.6);
  limb(p, 31, 15 + b, 36, 28 + b + slam, 4.4, 5.2, SHADOW, 7.8);
  const hy = 9 + b;
  p.ellipse(19, hy, 7, 6, SHADOW, 8);
  glowEye(p, 19, hy, '#ff3a50', 8.8, 2.2); // the one eye
  spots(p, 8, 4, 22, 28, [FLESH[1], SHADOW[3]], 0.03, 913);
}, '#ff4a60');
