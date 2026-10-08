// Redrawn bosses, part two: the Iron Maiden, the Lich, the Entombed Bishop, the Ancient Oak,
// the Gargoyle Lord and the Fungal Matron. Same layout and conventions as bossesArt4.js.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet, stride } from './bossesArt4.js';

const IRON = ['#0e0e12', '#1a1a20', '#2a2a32', '#3e3e48', '#565662', '#74747f', '#9a9aa6'];
const RUST = ['#2a1208', '#4a2210', '#6a3418'];
const ROBE_V = ['#08040c', '#120a18', '#1e1026', '#2c1838', '#3c224a'];
const BONE = ['#4a4232', '#7a6e54', '#a89a78', '#d0c4a0', '#ece2c4'];
const GOLD = ['#4a3410', '#8a6420', '#c49a38', '#ecd078'];
const MITRE = ['#4a3410', '#8a6420', '#c4a040', '#e8cc70', '#f6e4a0'];
const VIOLET = '#c070ff';
const LINEN = ['#3a3226', '#5a4e3a', '#7e7052', '#a29270', '#c4b48e', '#ddd0aa'];
const PURPLE = ['#1a0820', '#30103a', '#4a1a58', '#682478'];
const BARK = ['#120c08', '#20160e', '#302216', '#42301e', '#56402a', '#6c5236'];
const LEAF = ['#0a1408', '#142410', '#1e3416', '#2a461c', '#385a24', '#4a702e'];
const MOSS = ['#2a3a10', '#3e5218', '#566c22'];
const STONE = ['#141418', '#222228', '#32323a', '#46464e', '#5c5c66', '#76767f', '#92929a'];
const SHROOM = ['#2a0e1a', '#4a1830', '#6e2446', '#943262', '#b84a7e', '#d878a0'];
const GILL = ['#5a4a3a', '#8a7a5e', '#b8a882', '#ddd0aa'];
const MYCEL = ['#2a2620', '#46403a', '#665e52', '#8a8070', '#aca290'];
const SPORE = '#a8f070';

// ===================== THE IRON MAIDEN =====================
// A torture cabinet that walks: an iron coffin with a woman's stern face, bands and rivets, little
// clawed iron feet. When she attacks, her doors swing open on a mouth of spikes and red light.

export const maidenFrame = makeSheet(56, 72, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    // she topples, then falls apart
    shape(p, [[6, 56 + i], [50, 52 + i], [52, 66], [4, 68]], IRON, 7 - i * 2, { flat: 0.3 });
    if (i > 0) for (let s = 0; s < 6; s++) p.line(8 + s * 7, 60, 10 + s * 7, 54 - i * 2, IRON[5], 8);
    return;
  }
  const hop = k === 'walk' ? [0, 3, 0, 3][pose.i] : 0;
  const by = -hop + pose.bob;
  const open = k === 'attack' || k === 'cast' ? 1 : k === 'windup' ? 0.4 : 0;
  // little iron claw-feet
  for (const fx of [18, 36]) {
    limb(p, fx, 62 + by, fx + (k === 'walk' ? (pose.i % 2 ? 2 : -2) : 0), 69, 2.4, 2, IRON, 4);
    for (let c = -2; c <= 2; c += 2) p.px(fx + c, 70, IRON[4], 4.2);
  }
  // the coffin: broad shoulders, tapering to the feet, a peaked head
  const body = [[16, 8 + by], [28, 2 + by], [40, 8 + by], [46, 22 + by], [42, 64 + by], [14, 64 + by], [10, 22 + by]];
  if (open > 0) {
    // the open inside: spikes and a red glow
    shape(p, body, ['#1a0404', '#2e0808', '#420c0c'], 6, { flat: 0.8 });
    for (let y = 20; y < 60; y += 6) {
      for (let x = 16; x < 40; x += 6) {
        p.lit(x + ((y / 6) % 2) * 3, y + by, '#ff4030', 7, 0.6);
        p.px(x + ((y / 6) % 2) * 3, y + by - 1, IRON[6], 7.4);
      }
    }
    // the two doors swung wide
    const sw = Math.round(open * 12);
    shape(p, [[10 - sw, 22 + by], [16 - sw, 10 + by], [22 - sw, 22 + by], [20 - sw, 62 + by], [12 - sw, 62 + by]], IRON, 9, { flat: 0.3 });
    shape(p, [[34 + sw, 22 + by], [40 + sw, 10 + by], [46 + sw, 22 + by], [44 + sw, 62 + by], [36 + sw, 62 + by]], IRON, 9, { flat: 0.3 });
    for (let y = 26; y < 60; y += 8) {
      p.px(20 - sw, y + by, IRON[6], 9.4);
      p.px(40 + sw, y + by, IRON[6], 9.4);
    }
  } else {
    shape(p, body, IRON, 10, { soft: 8 });
    // iron bands and rivets
    for (const yy of [24, 40, 56]) {
      p.hline(12, 44, yy + by, IRON[2], 10.4);
      p.hline(12, 44, yy + by + 1, IRON[5], 10.4);
      for (let x = 14; x <= 42; x += 7) p.px(x, yy + by, IRON[6], 10.8);
    }
    p.vline(28, 30 + by, 62 + by, IRON[1], 10.4); // the seam between the doors
    spots(p, 10, 20 + by, 36, 44, RUST, 0.04, 515, 2);
  }
  // her face, cast in iron: stern, eyes shut... until the doors open
  const fy = 14 + by;
  p.ellipse(28, fy, 7, 8, IRON.slice(2), 11.5);
  p.hline(24, 26, fy - 2, IRON[1], 12);
  p.hline(30, 32, fy - 2, IRON[1], 12);
  if (open > 0) {
    glowEye(p, 24, fy, '#ff3a20', 12.2, 2);
    glowEye(p, 30, fy, '#ff3a20', 12.2, 2);
  } else {
    p.hline(24, 26, fy, IRON[0], 12.2);
    p.hline(30, 32, fy, IRON[0], 12.2);
  }
  p.vline(28, fy, fy + 3, IRON[3], 12.2);
  p.hline(26, 30, fy + 5, IRON[0], 12.2);
  for (let y = fy - 7; y < fy + 9; y++) {
    p.px(20, y, IRON[2], 11.8);
    p.px(36, y, IRON[4], 11.8);
  }
}, '#6a6a78');

// ===================== THE LICH =====================

export const lichFrame = makeSheet(56, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[8, 62], [48, 60], [50, 68], [6, 69]], ROBE_V, 4);
    if (i < 2) p.ellipse(30 - i * 4, 58 + i * 3, 6, 5.5, BONE, 7);
    for (let s = 0; s < 8 - i * 3; s++) p.lit(14 + s * 4, 50 - s * 3 - i * 6, VIOLET, 3, 0.6);
    return;
  }
  const float = Math.round(Math.sin((pose.i || 0) * 1.6) * 2) + (k === 'cast' ? -3 : 0);
  const y0 = float + b;
  // wisps of shadow where his feet should be
  for (let s = 0; s < 5; s++) limb(p, 16 + s * 6, 58 + y0, 14 + s * 6 + (s % 2 ? 2 : -2), 70, 2.5, 0.6, ROBE_V.slice(0, 3), 3);
  // the robe: tall, ragged at the hem
  const hem = [];
  for (let x = 10; x <= 46; x += 3) hem.push([x, 60 + y0 + ((x / 3) % 2 ? 4 : 0)]);
  shape(p, [[18, 20 + y0], [38, 20 + y0], [46, 58 + y0], ...hem.reverse(), [10, 58 + y0]], ROBE_V, 9, { folds: 0.7 });
  for (let y = 24; y < 58; y++) p.px(28 + Math.round(Math.sin(y * 0.3)), y + y0, GOLD[1 + (y % 3 === 0 ? 1 : 0)], 9.4);
  shape(p, [[14, 18 + y0], [42, 18 + y0], [46, 28 + y0], [10, 28 + y0]], ROBE_V.slice(1), 10); // the collar
  for (let x = 12; x <= 44; x++) p.px(x, 28 + y0, GOLD[2], 10.2);
  // bony arms: one lifts the phylactery, the other leans on a staff
  const raise = k === 'cast' || k === 'windup' ? -10 : 0;
  limb(p, 14, 24 + y0, 8, 38 + y0 + raise * 0.5, 2.6, 2.2, ROBE_V, 9.5);
  limb(p, 8, 38 + y0 + raise * 0.5, 9, 44 + y0 + raise, 1.2, 1, BONE, 10);
  limb(p, 2, 20 + y0, 11, 66 + y0, 1.2, 1.2, ['#1a1010', '#2e2018', '#4a3424'], 9.8);
  p.ellipse(2, 18 + y0, 3, 3, BONE, 10.5);
  p.lit(2, 18 + y0, VIOLET, 11, 1.2);
  limb(p, 42, 24 + y0, 48, 36 + y0 + raise, 2.6, 2.2, ROBE_V, 10);
  limb(p, 48, 36 + y0 + raise, 48, 40 + y0 + raise, 1.2, 1, BONE, 11);
  const gx = 48;
  const gy = 44 + y0 + raise;
  p.ellipse(gx, gy, 3.4, 4, ['#3a1060', '#6a20a0', VIOLET, '#e8b0ff'], 11.5);
  p.glow(gx, gy, VIOLET, 2);
  p.glow(gx - 1, gy - 1, '#e8b0ff', 2);
  for (const [dx, dy] of [[-3, 0], [3, 0], [0, -4], [0, 4]]) p.px(gx + dx, gy + dy, GOLD[2], 12);
  // the hood, then the crowned skull in it
  const hy = 12 + y0;
  shape(p, [[18, hy - 6], [28, hy - 12], [38, hy - 6], [40, hy + 8], [16, hy + 8]], ROBE_V, 10.5);
  p.ellipse(28, hy, 7, 7.5, BONE, 12);
  p.ellipse(28, hy + 6, 4.5, 2.5, BONE.slice(0, 4), 11.8);
  for (let x = 25; x <= 31; x += 2) p.px(x, hy + 6, '#1a1410', 12.2);
  p.ellipse(25, hy + 1, 2, 2, '#0a0610', 12.4);
  p.ellipse(31, hy + 1, 2, 2, '#0a0610', 12.4);
  p.lit(25, hy + 1, VIOLET, 12.8, 2);
  p.lit(31, hy + 1, VIOLET, 12.8, 2);
  p.px(28, hy + 4, '#0a0610', 12.4);
  for (let x = 21; x <= 35; x++) p.px(x, hy - 5, GOLD[x % 3 ? 2 : 3], 12.6);
  for (const x of [23, 28, 33]) p.px(x, hy - 7, GOLD[3], 12.8);
  p.lit(28, hy - 6, VIOLET, 13, 1.2);
  if (k === 'cast' || k === 'attack') for (let a = 0; a < 10; a++) p.lit(28 + Math.cos(a * 0.63) * 16, 36 + y0 + Math.sin(a * 0.63) * 10, VIOLET, 6, 0.8);
}, '#4a3060');

// ===================== THE ENTOMBED BISHOP =====================

export const entombedFrame = makeSheet(56, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[6, 60 + i], [48, 58 + i], [50, 68], [4, 69]], LINEN, 6 - i);
    p.ellipse(10, 62, 5, 4, MITRE, 7); // the mitre, fallen
    for (let s = 0; s < 4 - i; s++) p.line(14 + s * 9, 58, 20 + s * 9, 50 - s, LINEN[3], 7);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  limb(p, 22, 50 + b, 21 + bl, 68, 4, 3.4, LINEN, 5);
  limb(p, 33, 50 + b, 34 + fl, 68, 4, 3.4, LINEN, 5.5);
  // the far arm, behind
  limb(p, 16, 26 + b, 12, 42 + b, 3, 2.6, LINEN.slice(0, 5), 7);
  // the body, wound in linen, a purple stole over it
  shape(p, [[16, 22 + b], [40, 22 + b], [42, 54 + b], [14, 54 + b]], LINEN, 9);
  for (let y = 25; y < 54; y += 4) p.line(15, y + b, 41, y + b + 2, LINEN[2], 9.2);
  shape(p, [[22, 22 + b], [34, 22 + b], [32, 58 + b], [24, 58 + b]], PURPLE, 9.6, { flat: 0.4 });
  for (let y = 26; y < 58; y += 8) {
    p.px(28, y + b, GOLD[3], 10);
    p.hline(27, 29, y + b + 1, GOLD[2], 10);
    p.px(28, y + b + 2, GOLD[2], 10);
  }
  limb(p, 16, 40 + b, 10, 56 + b + (pose.i % 2 ? 2 : 0), 1.4, 0.8, LINEN, 8);
  limb(p, 40, 44 + b, 46, 60 + b, 1.4, 0.8, LINEN, 8);
  // the crozier in his near hand
  const raise = k === 'cast' || k === 'windup' ? -8 : 0;
  const sw = k === 'attack' ? 8 : 0;
  limb(p, 50 + sw, 8 + b + raise, 44 + sw, 66 + b + raise * 0.3, 1.2, 1.2, GOLD, 10.5);
  for (let a = 0; a < 9; a++) p.px(50 + sw + Math.cos(a * 0.6 - 1.4) * 4, 6 + b + raise + Math.sin(a * 0.6 - 1.4) * 4, GOLD[2 + (a % 2)], 11);
  limb(p, 40, 26 + b, 46 + sw * 0.6, 40 + b + raise, 3, 2.6, LINEN, 10);
  p.ellipse(46 + sw * 0.6, 41 + b + raise, 2.6, 2.4, LINEN, 11);
  // the face: wrapped, one burning eye between the strips
  const hy = 14 + b;
  p.ellipse(28, hy, 7, 8, LINEN, 11.5);
  for (let y = hy - 6; y < hy + 8; y += 2) p.line(21, y, 35, y + 1, LINEN[2], 11.8);
  glowEye(p, 28, hy, '#ffb040', 12.2, 3);
  // the tall mitre, tattered
  shape(p, [[20, hy - 6], [24, hy - 18], [28, hy - 22], [32, hy - 18], [36, hy - 6]], MITRE, 12.5);
  p.vline(28, hy - 20, hy - 7, PURPLE[2], 12.8);
  p.hline(25, 31, hy - 13, PURPLE[2], 12.8);
  p.px(23, hy - 9, '#0a0806', 12.8);
}, '#8a7a5a');

// ===================== THE ANCIENT OAK =====================
// A great tree that walks on its roots: a face in the trunk, branch arms, a ragged crown of leaves.

function leafClump(p, cx, cy, r, seed, h) {
  // a clump of leaves: overlapping blobs, a lit top-left, dark gaps
  for (let i = 0; i < 7; i++) {
    const a = seed * 1.7 + i * 0.9;
    const rr = r * (0.45 + ((seed * 7 + i * 3) % 5) * 0.08);
    p.ellipse(cx + Math.cos(a) * r * 0.55, cy + Math.sin(a) * r * 0.45, rr, rr * 0.8, LEAF, h);
  }
  spots(p, Math.floor(cx - r), Math.floor(cy - r), Math.ceil(r * 2), Math.ceil(r * 2), [LEAF[0], LEAF[1]], 0.12, seed * 101);
  spots(p, Math.floor(cx - r), Math.floor(cy - r), Math.ceil(r), Math.ceil(r), LEAF[5], 0.06, seed * 33);
}

export const ancientoakFrame = makeSheet(88, 96, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    // the trunk splits and topples
    shape(p, [[10, 84 - i * 2], [78, 80 - i * 2], [80, 92], [8, 94]], BARK, 8 - i * 2);
    for (let c = 0; c < 4 - i; c++) leafClump(p, 16 + c * 18, 78 - i * 3, 9, c + 1, 9 - i * 2);
    return;
  }
  const [fl, bl] = stride(pose, 3);
  const lean = k === 'attack' ? 4 : k === 'windup' ? -3 : 0;
  // roots for legs
  for (const [x0, x1, off] of [[30, 18, bl], [38, 32, fl], [50, 56, bl], [56, 72, fl]]) {
    limb(p, x0, 72 + b, x1 + off, 92, 5, 2, BARK, 6);
    limb(p, x1 + off, 92, x1 + off + (x1 > 44 ? 6 : -6), 94, 2, 1, BARK, 5);
  }
  // the trunk: thick, gnarled, ridged bark
  shape(p, [[26 + lean, 26 + b], [62 + lean, 26 + b], [64, 74 + b], [24, 74 + b]], BARK, 12, { folds: 0.9, soft: 10 });
  for (let x = 27; x < 62; x += 5) p.line(x + lean * 0.6, 30 + b, x + 1, 72 + b, BARK[1], 12.4); // furrows in the bark
  spots(p, 24, 28, 42, 46, MOSS, 0.035, 909, 2); // moss
  // the face in the trunk: deep hollows, green light inside
  const fy = 44 + b;
  p.ellipse(36 + lean * 0.7, fy, 5, 4, ['#040302', '#0a0806', '#140e0a'], 10);
  p.ellipse(52 + lean * 0.7, fy, 5, 4, ['#040302', '#0a0806', '#140e0a'], 10);
  p.lit(36 + lean * 0.7, fy, '#9aff60', 10.5, 1.8);
  p.lit(52 + lean * 0.7, fy, '#9aff60', 10.5, 1.8);
  p.line(30 + lean * 0.7, fy - 6, 40 + lean * 0.7, fy - 4, BARK[0], 12.8); // a furious brow
  p.line(58 + lean * 0.7, fy - 6, 48 + lean * 0.7, fy - 4, BARK[0], 12.8);
  const mouth = k === 'attack' || k === 'cast' ? 6 : 3;
  p.ellipse(44 + lean * 0.7, fy + 12, 7, mouth, ['#040302', '#0a0806', '#140e0a'], 9);
  if (mouth > 3) p.lit(44 + lean * 0.7, fy + 13, '#5a9a30', 9.5, 0.8);
  // branch arms
  const raise = k === 'cast' ? -18 : k === 'windup' ? -12 : k === 'attack' ? 10 : 0;
  limb(p, 26, 36 + b, 10, 50 + b + raise, 5, 3, BARK, 11);
  limb(p, 10, 50 + b + raise, 4, 62 + b + raise, 3, 1.2, BARK, 10);
  limb(p, 10, 50 + b + raise, 2, 46 + b + raise, 2, 0.8, BARK, 10);
  limb(p, 62, 36 + b, 78, 50 + b + raise, 5, 3, BARK, 13);
  limb(p, 78, 50 + b + raise, 85, 62 + b + raise, 3, 1.2, BARK, 12);
  limb(p, 78, 50 + b + raise, 86, 44 + b + raise, 2, 0.8, BARK, 12);
  leafClump(p, 8, 46 + b + raise, 7, 4, 12);
  leafClump(p, 82, 46 + b + raise, 7, 5, 14);
  // the crown: big ragged clumps of leaves with branches showing between
  limb(p, 34, 28 + b, 22, 12 + b, 3, 1.5, BARK, 13);
  limb(p, 54, 28 + b, 66, 10 + b, 3, 1.5, BARK, 13);
  limb(p, 44, 28 + b, 44, 6 + b, 3, 1.5, BARK, 13);
  const sway = k === 'walk' ? (pose.i % 2 ? 1 : -1) : 0;
  leafClump(p, 22 + sway, 14 + b, 13, 1, 14);
  leafClump(p, 66 + sway, 13 + b, 13, 2, 14);
  leafClump(p, 44 + sway, 8 + b, 15, 3, 15);
  leafClump(p, 32 + sway, 24 + b, 9, 6, 14.5);
  leafClump(p, 56 + sway, 24 + b, 9, 7, 14.5);
}, '#6a8a48');

// ===================== THE GARGOYLE LORD =====================

export const gargoylelordFrame = makeSheet(80, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    // he cracks and crumbles into rubble
    for (let r = 0; r < 9; r++) p.ellipse(14 + r * 7, 66 - (r % 3) * 2 - (2 - i) * 3, 4 + (r % 3), 3.5, STONE, 6);
    if (i === 0) shape(p, [[24, 30], [56, 30], [52, 60], [28, 60]], STONE, 9);
    return;
  }
  const spread = k === 'cast' || k === 'windup' ? 1 : k === 'walk' ? 0.55 + (pose.i % 2) * 0.15 : 0.6;
  const y0 = b + (k === 'attack' ? 4 : 0);
  // the wings: a bony arm, fingers, stone-grey membrane between them
  for (const side of [-1, 1]) {
    const sx = 40 + side * 10;
    const sy = 26 + y0;
    const tipX = 40 + side * (18 + 22 * spread);
    const tipY = 6 + y0 - spread * 6;
    const pts = [[sx, sy], [tipX, tipY]];
    for (let f = 0; f < 4; f++) pts.push([tipX - side * f * 5, tipY + 14 + f * 6 + (f % 2) * 3]);
    pts.push([sx + side * 2, sy + 22]);
    shape(p, pts, STONE.slice(0, 5), 4, { flat: 0.4, folds: 0.6 });
    limb(p, sx, sy, tipX, tipY, 2.4, 1.6, STONE, 5);
    for (let f = 1; f < 4; f++) limb(p, tipX, tipY, tipX - side * f * 5, tipY + 14 + f * 6, 1.2, 0.6, STONE, 5);
  }
  // crouched haunches and clawed feet
  p.ellipse(28, 54 + y0, 9, 8, STONE, 8);
  p.ellipse(52, 54 + y0, 9, 8, STONE, 8);
  for (const fx of [26, 54]) {
    limb(p, fx, 58 + y0, fx + (fx < 40 ? -2 : 2), 68, 3, 2.4, STONE, 6);
    for (let c = -2; c <= 2; c += 2) limb(p, fx + c, 68, fx + c * 1.6, 71, 1, 0.6, STONE.slice(3), 6.2);
  }
  // the hunched body, chest and belly
  shape(p, [[26, 26 + y0], [54, 26 + y0], [56, 46 + y0], [48, 58 + y0], [32, 58 + y0], [24, 46 + y0]], STONE, 11);
  for (let y = 36; y < 54; y += 4) p.hline(34, 46, y + y0, STONE[2], 11.4); // ridged belly
  spots(p, 22, 22 + y0, 36, 36, [STONE[1], STONE[5]], 0.05, 4404);
  p.line(30, 30 + y0, 36, 44 + y0, STONE[0], 11.6); // a crack
  p.line(36, 44 + y0, 34, 50 + y0, STONE[0], 11.6);
  // the arms: long, ending in talons that rest on the ground (or rake the air)
  const reach = k === 'attack' ? 10 : k === 'cast' ? -12 : 0;
  for (const side of [-1, 1]) {
    const hx = 40 + side * 20;
    const hy = 54 + y0 + (side > 0 ? reach * 0.5 : 0) + (k === 'cast' ? -16 : 0);
    limb(p, 40 + side * 13, 30 + y0, hx, hy, 3.4, 2.8, STONE, side > 0 ? 12 : 9);
    for (let c = -1; c <= 1; c++) limb(p, hx, hy, hx + side * 3 + c * 2, hy + 4 + (side > 0 ? reach * 0.2 : 0), 1, 0.4, STONE.slice(2), side > 0 ? 12.5 : 9.5);
  }
  // the head: horned, a snarling demon's face
  const hy = 18 + y0;
  p.ellipse(40, hy, 9, 8, STONE, 13);
  limb(p, 34, hy - 5, 26, hy - 16, 2.4, 0.8, STONE.slice(1), 13.2); // horns
  limb(p, 46, hy - 5, 54, hy - 16, 2.4, 0.8, STONE.slice(1), 13.2);
  limb(p, 32, hy - 1, 27, hy - 3, 1.6, 0.6, STONE, 13); // pointed ears
  limb(p, 48, hy - 1, 53, hy - 3, 1.6, 0.6, STONE, 13);
  p.line(34, hy - 3, 39, hy - 1, STONE[0], 13.6); // a heavy brow
  p.line(46, hy - 3, 41, hy - 1, STONE[0], 13.6);
  glowEye(p, 35, hy, '#ffb030', 13.8, 2);
  glowEye(p, 43, hy, '#ffb030', 13.8, 2);
  const open = k === 'attack' || k === 'cast' || k === 'windup';
  p.ellipse(40, hy + 5, open ? 4 : 3, open ? 2.4 : 1, ['#0a0808', '#140e0e'], 13.4);
  for (const fx of [37, 43]) p.px(fx, hy + 4, STONE[6], 13.8); // fangs
}, '#7a7a88');

// ===================== THE FUNGAL MATRON =====================

export const matronFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 60, 20, 4, MYCEL, 2, false);
    p.ellipse(30 + i * 3, 54 + i * 2, 16 - i * 2, 6 - i, SHROOM, 6);
    for (let s = 0; s < 10; s++) p.lit(14 + s * 4, 40 + ((s * 7) % 13) - i * 6, SPORE, 3, 0.5);
    return;
  }
  const sway = k === 'walk' ? (pose.i % 2 ? 1 : -1) : 0;
  // the trailing skirt of mycelium, rooted into the floor
  for (let s = 0; s < 8; s++) limb(p, 16 + s * 4.5, 52 + b, 12 + s * 5.5 + sway, 63, 2, 0.6, MYCEL, 4);
  shape(p, [[22, 28 + b], [42, 28 + b], [52, 58 + b], [12, 58 + b]], MYCEL, 8, { folds: 1.1 });
  // shelf fungi growing up her skirt
  for (const [fx, fy, w] of [[16, 50, 6], [44, 46, 7], [22, 40, 5], [40, 54, 5]]) {
    shape(p, [[fx - w, fy + b], [fx + w, fy + b - 1], [fx + w - 1, fy + b + 2], [fx - w + 1, fy + b + 2]], SHROOM.slice(1), 9);
    p.hline(fx - w + 1, fx + w - 1, fy + b + 2, GILL[1], 9.2);
  }
  // arms: thin, pale, crooked, spores drifting from her fingers
  const raise = k === 'cast' || k === 'windup' ? -12 : k === 'attack' ? -4 : 0;
  limb(p, 22, 30 + b, 12, 42 + b + raise, 2.4, 1.8, MYCEL.slice(1), 8.5);
  limb(p, 42, 30 + b, 52, 42 + b + raise, 2.4, 1.8, MYCEL.slice(1), 10);
  for (const hx of [12, 52]) for (let c = -1; c <= 1; c++) p.line(hx, 42 + b + raise, hx + c * 2, 46 + b + raise, MYCEL[3], 10);
  if (k === 'cast' || k === 'attack') for (let s = 0; s < 14; s++) p.lit(8 + ((s * 11) % 48), 20 + ((s * 7) % 30) + raise * 0.3, SPORE, 4, 0.7);
  // the body: a pale, sunken bodice
  shape(p, [[22, 24 + b], [42, 24 + b], [40, 34 + b], [24, 34 + b]], MYCEL.slice(1), 10.5);
  // the face: hollow-cheeked, glowing eyes under the cap's brim
  const hy = 20 + b;
  p.ellipse(32, hy, 6, 7, ['#5a5446', '#7e7664', '#a29a84', '#c4bca4'], 11.5);
  glowEye(p, 29, hy - 1, SPORE, 12, 1);
  glowEye(p, 34, hy - 1, SPORE, 12, 1);
  p.hline(30, 34, hy + 4, '#2a2420', 12);
  // the great cap: a domed hat of a mushroom, spotted, gills beneath
  const cy = 10 + b;
  shape(p, [[8, cy + 6], [14, cy - 4], [24, cy - 9], [40, cy - 9], [50, cy - 4], [56, cy + 6]], SHROOM, 13, { soft: 6 });
  for (let x = 9; x <= 55; x++) p.px(x, cy + 6, GILL[(x % 3) + 1], 12.6);
  for (let x = 11; x <= 53; x += 2) p.px(x, cy + 7, GILL[0], 12.4);
  for (const [sx, sy, r] of [[20, -3, 2], [32, -6, 2.4], [44, -3, 2], [27, 1, 1.4], [38, 1, 1.4], [14, 2, 1.2], [50, 2, 1.2]]) p.ellipse(sx, cy + sy, r, r * 0.8, ['#c0b8a0', '#e8e0c8', '#fffaf0'], 13.6);
  // a faint glow about her
  for (let a = 0; a < 6; a++) p.lit(10 + a * 9, cy + 9, SPORE, 12.8, 0.4);
}, '#b8a0b8');
