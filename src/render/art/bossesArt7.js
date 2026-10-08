// The third boss roster (the Turnkey, the Bellringer, the Weeping Widow, the Hanged Man, the Fen Hag,
// the Wicker Man, the Grand Inquisitor, the Dread Knight, the Eye Below) and four older bosses redrawn
// (the Gravedigger, the Thorn Witch, the Pyre Bishop, the Plague Physician).

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet, stride } from './bossesArt4.js';

const SKIN = ['#2a1410', '#4a2418', '#6e3a26', '#94563a', '#b87452', '#d8946c'];
const LEATHER = ['#0c0808', '#1a1210', '#2a1e18', '#3c2c22', '#4e3a2c', '#624a38'];
const IRON = ['#0e0e12', '#1a1a20', '#2a2a32', '#3e3e48', '#565662', '#74747f', '#9a9aa6'];
const BRASS = ['#3a2a10', '#6a4c18', '#9a7228', '#c89a3c', '#ecc864'];
const RAGS = ['#1a1612', '#2a241c', '#3c3428', '#504636', '#665a46'];
const MOURN = ['#030204', '#08060a', '#100c12', '#1a141c', '#261e28'];
const PALE = ['#6a6878', '#8e8c9c', '#b4b2c0', '#d8d6e2', '#f0eef6'];
const TEAR = '#9ad0ff';
const CORPSE = ['#2a2a22', '#40402e', '#5a5a40', '#767454', '#929070'];
const ROPE = ['#3a3020', '#6a5a38', '#9a8858', '#c8b880'];
const HAG = ['#1e2a14', '#2e3e1e', '#425628', '#5a7234', '#768e44'];
const SHAWL = ['#140e14', '#22182a', '#33243e', '#463252'];
const BREW = ['#1a3a08', '#2e6010', '#4e9a1c', '#80d040', '#c0ff70'];
const WICKER = ['#2a1a0a', '#4a3014', '#6a4820', '#8e642e', '#b0843e', '#cca45a'];
const FIRE = ['#5a1404', '#a03008', '#e05a10', '#ff9a30', '#ffe080'];
const SCARLET = ['#1e0406', '#3a080c', '#5a1014', '#7e1a1c', '#a02626', '#c43a34'];
const GOLD = ['#4a3410', '#8a6420', '#c49a38', '#ecd078'];
const DREAD = ['#050608', '#0c0e12', '#15181e', '#20242c', '#2e333d', '#40464f'];
const CAPE = ['#0a0204', '#1a0408', '#2a080e', '#3c0e14'];
const SICK = '#7aff90';
const SCLERA = ['#6a5a50', '#9a8a7e', '#c8b8aa', '#e8dcd0', '#fff6ec'];
const VEIN = '#a0303a';
const FLESH_D = ['#1a0a0e', '#2e1218', '#441a22', '#5c242e', '#76303a'];
const DIRT = ['#1a140e', '#2a2016', '#3c2e20', '#4e3c2a'];
const THORNY = ['#0e140a', '#1a2410', '#283618', '#3a4a20', '#4e602a'];
const WITCHROBE = ['#0a120c', '#122016', '#1c2e20', '#284030'];
const PYRE = ['#2a0a06', '#4a120a', '#6e1c10', '#922a16', '#b43e20'];
const PLAGUE = ['#060606', '#101010', '#1a1a1a', '#262626', '#343434'];
const BEAK = ['#3a3020', '#6a5a3a', '#9a8a5e', '#c8b88a'];

// ===================== THE TURNKEY =====================

export const turnkeyFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[6, 56 + i], [56, 54 + i], [58, 62], [4, 63]], LEATHER, 7 - i * 2);
    p.ellipse(52 - i * 3, 54, 6, 5, SKIN, 8 - i);
    for (let c = 0; c < 6; c++) p.ellipse(14 + c * 5, 60, 1.6, 2.2, BRASS, 6); // spilled keys
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const y0 = b + (k === 'windup' ? 3 : 0);
  limb(p, 24, 46 + y0, 22 + bl, 60, 5, 4.4, LEATHER, 5);
  limb(p, 38, 46 + y0, 40 + fl, 60, 5, 4.4, LEATHER, 5.5);
  for (const fx of [22 + bl, 40 + fl]) p.bevelRect(fx - 5, 59, 11, 5, LEATHER.slice(1), 5, 1);
  // the far arm with the lantern
  const lift = k === 'cast' ? -10 : 0;
  limb(p, 16, 28 + y0, 10, 42 + y0 + lift, 4, 3.4, SKIN.slice(0, 5), 7);
  limb(p, 10, 42 + y0 + lift, 10, 46 + y0 + lift, 0.6, 0.6, IRON, 7.2);
  p.bevelRect(6, 46 + y0 + lift, 8, 9, IRON.slice(1, 5), 7.4, 1);
  p.lit(9, 50 + y0 + lift, '#ffb040', 7.8, 1.8);
  p.lit(10, 51 + y0 + lift, '#ffe080', 7.8, 1.8);
  // a barrel of a belly in a leather jerkin
  p.ellipse(32, 38 + y0, 18, 14, LEATHER, 10);
  for (let y = 28; y < 50; y += 4) p.hline(30, 34, y + y0, LEATHER[0], 10.4); // the lacing
  // the belt, and the great ring of keys
  p.hline(14, 50, 44 + y0, LEATHER[4], 10.6);
  p.bevelRect(28, 42 + y0, 6, 5, BRASS.slice(1), 10.8, 1);
  for (let a = 0; a < 16; a++) p.px(46 + Math.cos(a * 0.4) * 5, 52 + y0 + Math.sin(a * 0.4) * 5, IRON[5], 11);
  for (let c = 0; c < 6; c++) {
    const a = 0.2 + c * 0.5;
    limb(p, 46 + Math.cos(a) * 5, 52 + y0 + Math.sin(a) * 5, 46 + Math.cos(a) * 9, 52 + y0 + Math.sin(a) * 9 + 2, 0.9, 0.7, BRASS, 11.2);
  }
  // the near arm with a cudgel
  const sw = { windup: [50, 10, 40, -2], attack: [54, 44, 62, 54], cast: [50, 34, 58, 20] }[k] || [50, 40, 58, 28];
  limb(p, 48, 28 + y0, sw[0], sw[1] + y0, 4.4, 3.8, SKIN, 12);
  limb(p, sw[0], sw[1] + y0, sw[2], sw[3] + y0, 2, 3.2, ['#1a0f08', '#2e1c10', '#4a2e18', '#6a4424'], 12.6);
  for (const t of [0.6, 0.8, 1]) p.px(sw[0] + (sw[2] - sw[0]) * t + 1, sw[1] + y0 + (sw[3] - sw[1]) * t, IRON[5], 13); // studs
  p.ellipse(sw[0], sw[1] + y0, 3.4, 3, SKIN.slice(1), 12.8);
  // the head: bald, scarred, piggy-eyed, a jaw like a door
  const hy = 16 + y0;
  p.ellipse(32, hy + 4, 9, 6, SKIN, 13); // the jowls
  p.ellipse(32, hy, 8, 8, SKIN, 13.4);
  p.line(26, hy - 5, 30, hy - 1, SKIN[2], 13.8); // a scar
  p.px(29, hy, '#0a0606', 13.8);
  p.px(35, hy, '#0a0606', 13.8);
  p.hline(28, 30, hy - 2, SKIN[1], 13.8);
  p.hline(34, 36, hy - 2, SKIN[1], 13.8);
  p.ellipse(32, hy + 2, 1.6, 1.4, SKIN[4], 14);
  p.hline(29, 35, hy + 6, k === 'attack' || k === 'windup' ? '#2a0606' : SKIN[1], 13.8);
}, '#7a6050');

// ===================== THE BELLRINGER =====================

export const bellringerFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(40, 54, 14, 10 - i * 2, BRASS, 8 - i); // the bell, rolled
    shape(p, [[6, 58], [30, 56], [32, 62], [4, 63]], RAGS, 5);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const hop = k === 'walk' ? [0, 2, 0, 2][pose.i] : 0;
  const y0 = b - hop + (k === 'windup' ? 4 : 0);
  // bandy legs, bare feet
  limb(p, 24, 46 + y0, 20 + bl, 60, 3, 2.4, RAGS, 5);
  limb(p, 34, 46 + y0, 38 + fl, 60, 3, 2.4, RAGS, 5.4);
  for (const fx of [20 + bl, 38 + fl]) p.ellipse(fx + 1, 61, 3.4, 1.8, SKIN.slice(0, 4), 5);
  // the great bronze bell, strapped to his hunched back
  const bellY = 20 + y0;
  shape(p, [[4, bellY + 26], [8, bellY + 4], [16, bellY - 2], [26, bellY + 4], [30, bellY + 26]], BRASS, 9, { soft: 6 });
  p.hline(3, 31, bellY + 26, BRASS[1], 9.2);
  p.hline(3, 31, bellY + 27, BRASS[0], 9.2);
  for (const yy of [8, 14]) p.hline(9, 27, bellY + yy, BRASS[1], 9.4);
  spots(p, 4, bellY, 28, 26, ['#3a5a3a', '#4a6a4a'], 0.05, 3131); // verdigris
  // the hunched body in rags, a strap across it
  shape(p, [[22, 24 + y0], [40, 22 + y0], [44, 34 + y0], [40, 48 + y0], [22, 48 + y0], [18, 34 + y0]], RAGS, 10);
  p.line(20, 26 + y0, 40, 44 + y0, LEATHER[3], 10.4);
  // the arm with the hammer (he strikes his own bell)
  const sw = { windup: [46, 8, 50, -2], attack: [36, 26, 26, 20], cast: [48, 14, 52, 4] }[k] || [46, 36, 54, 30];
  limb(p, 40, 28 + y0, sw[0], sw[1] + y0, 3, 2.6, SKIN, 11.5);
  limb(p, sw[0], sw[1] + y0, sw[2], sw[3] + y0, 1.2, 1, ['#2e1c10', '#4a2e18', '#6a4424'], 12);
  p.bevelRect(sw[2] - 3, sw[3] + y0 - 3, 7, 6, IRON.slice(2, 6), 12.4, 1);
  if (k === 'attack') for (let r = 0; r < 3; r++) for (let a = 0; a < 10; a++) p.lit(18 + Math.cos(a * 0.63) * (14 + r * 5), 34 + y0 + Math.sin(a * 0.63) * (10 + r * 4), BRASS[4], 6, 0.5); // the toll, rippling out
  // the head: low on the shoulders, deep in a ragged hood; a crooked face, small mad eyes
  const hy = 22 + y0;
  shape(p, [[34, hy + 6], [36, hy - 6], [42, hy - 9], [49, hy - 5], [50, hy + 6]], RAGS, 12.2);
  p.ellipse(43, hy + 1, 5, 5.4, SKIN.slice(0, 5), 12.6);
  p.ellipse(41, hy - 1, 1.2, 1, '#0a0606', 12.9);
  p.ellipse(46, hy, 1, 0.8, '#0a0606', 12.9);
  p.lit(41, hy - 1, '#ff5030', 13, 0.9);
  p.lit(46, hy, '#ff5030', 13, 0.7);
  p.line(39, hy - 3, 42, hy - 2, SKIN[1], 12.9); // a crooked brow
  for (let x = 40; x <= 46; x++) p.px(x, hy + 3 + (x > 43 ? 1 : 0), '#2a0a0a', 12.8);
  p.px(42, hy + 3, '#d8d0b0', 13);
}, '#c89a3c');

// ===================== THE WEEPING WIDOW =====================

export const widowFrame = makeSheet(56, 72, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 2);
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[8, 66], [48, 66], [44, 70 - (2 - i) * 6], [12, 70 - (2 - i) * 6]], MOURN, 4);
    for (let s = 0; s < 8 - i * 3; s++) p.lit(14 + s * 4, 56 - s * 3 - i * 5, TEAR, 3, 0.7);
    return;
  }
  // the gown: long black mourning, trailing into mist
  for (let s = 0; s < 6; s++) limb(p, 14 + s * 5.6, 56 + b, 12 + s * 6 + (s % 2 ? 2 : -2), 70, 3, 0.6, MOURN, 3);
  shape(p, [[20, 24 + b], [36, 24 + b], [46, 60 + b], [10, 60 + b]], MOURN, 8, { folds: 0.9 });
  for (let y = 30; y < 58; y += 6) p.hline(16 + (y - 30) * 0.2, 40 - (y - 30) * 0.2, y + b, MOURN[3], 8.3);
  // long pale arms: wringing hands, or reaching out
  const reach = k === 'attack' || k === 'cast' ? 12 : k === 'windup' ? -6 : 0;
  limb(p, 20, 28 + b, 12 - reach * 0.3, 44 + b - reach * 0.4, 2, 1.6, PALE, 9);
  limb(p, 36, 28 + b, 44 + reach * 0.6, 44 + b - reach * 0.4, 2, 1.6, PALE, 10);
  for (const hx of [12 - reach * 0.3, 44 + reach * 0.6]) for (let c = -1; c <= 1; c++) p.line(hx, 44 + b - reach * 0.4, hx + c * 2, 48 + b - reach * 0.4, PALE[3], 10);
  // the veil over her face, and the tears running beneath it
  const hy = 16 + b;
  shape(p, [[18, hy - 4], [28, hy - 10], [38, hy - 4], [40, hy + 12], [16, hy + 12]], ['#06050a', '#0e0c14', '#16121e', '#201a2a'], 11, { soft: 4 });
  for (let y = hy - 6; y < hy + 12; y += 2) for (let x = 18; x < 39; x += 2) if (p.filled(x, y)) p.px(x + ((y / 2) % 2), y, '#2a2434', 11.2); // lace
  p.ellipse(28, hy + 1, 5, 6, PALE.slice(0, 4), 10.5);
  glowEye(p, 25, hy, TEAR, 11.4, 2);
  glowEye(p, 30, hy, TEAR, 11.4, 2);
  for (const tx of [25, 31]) for (let t = 1; t < 9; t++) p.lit(tx, hy + 1 + t * 1.6, TEAR, 11.3, 1 - t * 0.08);
  // a black lily at her breast
  p.ellipse(28, 28 + b, 2.6, 2, ['#1a1a24', '#2a2a3a', '#d8d8e8'], 9.4);
}, '#6a6a8a');

// ===================== THE HANGED MAN =====================

export const hangedmanFrame = makeSheet(56, 80, (p, pose) => {
  const k = pose.k;
  const swing = k === 'walk' ? [-3, 0, 3, 0][pose.i] : k === 'attack' ? 5 : k === 'windup' ? -4 : pose.bob;
  if (k === 'death') {
    const i = pose.i;
    // the rope parts; he drops in a heap
    limb(p, 28, 0, 28, 20 - i * 6, 1.2, 1.2, ROPE, 5);
    shape(p, [[10, 72], [46, 70], [48, 78], [8, 79]], CORPSE, 6 - i);
    p.ellipse(42, 70, 5, 5, CORPSE, 7 - i);
    return;
  }
  const cx = 28 + swing;
  // the rope, down from the dark above
  limb(p, 28, 0, cx, 18, 1.4, 1.4, ROPE, 8);
  for (let y = 2; y < 18; y += 3) p.px(28 + (cx - 28) * (y / 18) + 1, y, ROPE[0], 8.2);
  // the noose and the lolling head
  const hy = 22;
  p.ellipse(cx + 2, hy, 6.4, 6.8, CORPSE, 11);
  for (let a = 0; a < 12; a++) p.px(cx + Math.cos(a * 0.52) * 4, hy + 6 + Math.sin(a * 0.52) * 1.5, ROPE[2], 11.4);
  p.ellipse(cx - 1, hy - 1, 1.6, 1.6, '#060606', 11.4);
  p.ellipse(cx + 4, hy - 1, 1.6, 1.6, '#060606', 11.4);
  p.lit(cx - 1, hy - 1, '#d0ff80', 11.6, 1);
  p.lit(cx + 4, hy - 1, '#d0ff80', 11.6, 1);
  p.hline(cx - 1, cx + 4, hy + 3, '#1a0a0a', 11.4);
  p.px(cx + 1, hy + 4, '#6a2030', 11.4); // a swollen tongue
  for (let x = cx - 5; x <= cx + 7; x += 2) p.px(x, hy - 6, RAGS[1], 11.4); // lank hair
  // the body: a ragged shirt, arms limp... or clawing
  shape(p, [[cx - 7, 28], [cx + 9, 28], [cx + 8, 50], [cx - 6, 50]], RAGS, 9, { folds: 1.2 });
  const claw = k === 'cast' || k === 'attack' ? -12 : 0;
  limb(p, cx - 7, 30, cx - 9, 48 + claw, 2, 1.6, CORPSE, 8.6);
  limb(p, cx + 9, 30, cx + 11, 48 + claw, 2, 1.6, CORPSE, 9.6);
  for (const hx of [cx - 9, cx + 11]) for (let c = -1; c <= 1; c++) p.line(hx, 48 + claw, hx + c, 52 + claw, CORPSE[3], 9.6);
  // legs dangling, bare feet pointed down
  limb(p, cx - 3, 50, cx - 4 - swing * 0.4, 70, 2.6, 2, RAGS.slice(0, 4), 8);
  limb(p, cx + 4, 50, cx + 5 - swing * 0.4, 70, 2.6, 2, RAGS, 8.4);
  for (const fx of [cx - 4 - swing * 0.4, cx + 5 - swing * 0.4]) limb(p, fx, 70, fx, 76, 1.8, 1, CORPSE, 8);
  // a crow on his shoulder
  p.ellipse(cx + 9, 26, 3, 2.4, ['#050506', '#0e0e12', '#1a1a20'], 10);
  p.px(cx + 12, 25, '#c8a034', 10.4);
  p.lit(cx + 10, 25, '#ff3020', 10.6, 1);
}, '#8a8a6a');

// ===================== THE FEN HAG =====================

export const fenhagFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 58, 22, 4, BREW, 2, false);
    p.ellipse(46, 54, 9 - i, 7 - i, IRON, 6); // the cauldron, tipped
    shape(p, [[6, 58], [30, 56 + i], [32, 62], [4, 63]], SHAWL, 5);
    return;
  }
  const stir = (pose.i || 0) % 2 ? 2 : -2;
  // the cauldron on its little fire
  for (let s = 0; s < 4; s++) limb(p, 40 + s * 4, 63, 41 + s * 4, 58 - (s % 2) * 2, 1.4, 0.5, FIRE.slice(1), 3);
  p.ellipse(46, 50, 13, 9, IRON, 6);
  p.ellipse(46, 43, 11, 3, ['#0a0a0c', '#121216'], 6.4);
  for (let x = 37; x <= 55; x++) p.lit(x, 43 + Math.round(Math.sin(x * 0.9 + stir) * 0.8), BREW[2 + (x % 3)], 6.6, 1.2);
  const bubbles = k === 'cast' || k === 'windup' ? 6 : 3;
  for (let s = 0; s < bubbles; s++) p.lit(40 + s * 3, 39 - (s % 3) * 4, BREW[3], 6.8, 0.8);
  // the hag: bent double, a shawl, a long nose, warts
  shape(p, [[8, 60], [12, 34 + b], [20, 26 + b], [32, 28 + b], [34, 44 + b], [30, 60]], SHAWL, 9, { folds: 0.9 });
  for (let x = 9; x < 31; x += 3) p.px(x, 59, SHAWL[0], 9.2); // a ragged hem
  // her arm, stirring with a bone ladle
  const reach = k === 'attack' ? 6 : 0;
  limb(p, 28, 32 + b, 38 + reach, 36 + b, 2.4, 2, HAG, 10);
  limb(p, 38 + reach, 36 + b, 46 + stir + reach, 44, 1, 0.8, ['#8a8068', '#c8bc9c', '#ece0c0'], 10.4);
  // the head, under a hood
  const hy = 26 + b;
  shape(p, [[14, hy - 2], [22, hy - 12], [32, hy - 6], [34, hy + 6], [18, hy + 6]], SHAWL, 11);
  p.ellipse(27, hy, 5, 6, HAG, 11.5);
  limb(p, 30, hy, 38, hy + 4, 2, 0.8, HAG, 12); // the long hooked nose
  p.px(37, hy + 5, HAG[1], 12);
  glowEye(p, 28, hy - 2, BREW[4], 12.2, 1);
  p.hline(26, 31, hy + 4, '#140a06', 12);
  p.px(29, hy + 4, '#c8c0a0', 12.2); // one tooth
  spots(p, 22, hy - 6, 14, 12, [HAG[4], HAG[1]], 0.1, 4141); // warts
  for (let s = 0; s < 5; s++) limb(p, 16 + s * 2, hy - 2, 12 + s * 3, hy + 12 + (s % 2) * 3, 0.8, 0.5, ['#4a4a40', '#7a7a68', '#a8a890'], 11.2); // grey straggly hair
}, '#5a7a3a');

// ===================== THE WICKER MAN =====================

export const wickermanFrame = makeSheet(72, 96, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 12; s++) limb(p, 8 + s * 5, 92, 12 + s * 5 + (s % 2 ? 3 : -3), 84 - (2 - i) * 8 + (s % 3) * 3, 1.2, 1, WICKER, 4);
    for (let s = 0; s < 10; s++) p.lit(10 + s * 6, 88 - (s % 3) * 4, FIRE[2 + (s % 3)], 4, 1.2);
    return;
  }
  const [fl, bl] = stride(pose, 4);
  const y0 = b + (k === 'windup' ? 3 : 0);
  // a woven limb: a bundle of rods bound with twine
  const woven = (x0, y0b, x1, y1, r, h) => {
    limb(p, x0, y0b, x1, y1, r, r * 0.8, WICKER, h);
    const len = Math.hypot(x1 - x0, y1 - y0b);
    for (let t = 3; t < len; t += 4) {
      const f = t / len;
      p.line(x0 + (x1 - x0) * f - r, y0b + (y1 - y0b) * f + 1, x0 + (x1 - x0) * f + r, y0b + (y1 - y0b) * f - 1, WICKER[1], h + 0.2);
    }
  };
  woven(28, 64 + y0, 24 + bl, 92, 4, 6);
  woven(44, 64 + y0, 48 + fl, 92, 4, 6.4);
  // the body: a tall woven cage with fire burning in its heart
  shape(p, [[18, 26 + y0], [54, 26 + y0], [56, 50 + y0], [48, 68 + y0], [24, 68 + y0], [16, 50 + y0]], ['#0e0402', '#1e0804', '#2e0c06'], 8, { flat: 0.6 });
  // the fire inside
  for (let s = 0; s < 14; s++) {
    const fx = 24 + ((s * 11) % 26);
    const fy = 60 - ((s * 7) % 26) + y0;
    limb(p, fx, fy + 6, fx + ((s + (pose.i || 0)) % 3) - 1, fy - 4, 2.4, 0.5, FIRE.slice(1), 8.4);
  }
  p.glow(36, 48 + y0, FIRE[3], 1.4);
  // a figure trapped in the flames
  limb(p, 36, 40 + y0, 36, 56 + y0, 2.6, 2, ['#1a0806', '#2a0e08'], 8.6);
  p.ellipse(36, 37 + y0, 2.6, 2.8, ['#1a0806', '#2a0e08'], 8.7);
  // the wicker lattice over it all
  for (let d = -40; d < 60; d += 6) {
    for (let t = 0; t < 46; t++) {
      const x1 = 16 + t;
      const ya = 26 + y0 + t + d;
      const yb = 68 + y0 - t + d - 42;
      if (ya >= 26 + y0 && ya <= 68 + y0 && p.filled(x1, ya)) p.px(x1, ya, WICKER[3 + (t % 2)], 9.2);
      if (yb >= 26 + y0 && yb <= 68 + y0 && p.filled(x1, yb)) p.px(x1, yb, WICKER[2 + (t % 2)], 9.2);
    }
  }
  // arms: long, woven, burning at the ends
  const raise = k === 'cast' || k === 'windup' ? -22 : k === 'attack' ? 6 : 0;
  woven(18, 30 + y0, 6, 52 + y0 + raise, 3.4, 9.5);
  woven(54, 30 + y0, 66, 52 + y0 + raise, 3.4, 10);
  for (const hx of [6, 66]) for (let s = 0; s < 4; s++) limb(p, hx + (s - 1.5) * 2, 52 + y0 + raise, hx + (s - 1.5) * 3, 46 + y0 + raise - s * 2, 1.4, 0.4, FIRE.slice(2), 10.4);
  // the head: a woven mask with two burning holes, antlers of twigs
  const hy = 16 + y0;
  p.ellipse(36, hy, 9, 10, WICKER, 11);
  for (let y = hy - 9; y < hy + 10; y += 3) p.hline(28, 44, y, WICKER[2], 11.2);
  glowEye(p, 31, hy, FIRE[4], 11.6, 2);
  glowEye(p, 39, hy, FIRE[4], 11.6, 2);
  p.ellipse(36, hy + 5, 3, 2, ['#0e0402', '#1e0804'], 11.4);
  p.lit(36, hy + 5, FIRE[2], 11.6, 1.2);
  for (const side of [-1, 1]) {
    limb(p, 36 + side * 6, hy - 8, 36 + side * 16, hy - 20, 1.4, 0.6, WICKER, 11.2);
    limb(p, 36 + side * 12, hy - 15, 36 + side * 10, hy - 24, 1, 0.4, WICKER, 11.2);
  }
  // breath of fire when it attacks
  if (k === 'attack') for (let s = 0; s < 8; s++) p.lit(40 + s * 3, hy + 6 + s * 0.6, FIRE[2 + (s % 3)], 11, 1.6);
}, '#d08040');

// ===================== THE GRAND INQUISITOR =====================

export const inquisitorFrame = makeSheet(56, 72, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 1.5);
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[6, 64], [48, 62], [50, 70], [4, 71]], SCARLET, 6 - i * 2);
    p.bevelRect(34, 58 - i, 12, 9, GOLD, 7, 1); // the book, closed at last
    return;
  }
  // the robe: scarlet, floor-length, a cord of gold
  shape(p, [[18, 24 + b], [38, 24 + b], [48, 68], [8, 68]], SCARLET, 9, { folds: 0.8 });
  for (let y = 28; y < 68; y++) p.px(28 + Math.round(Math.sin(y * 0.25) * 1.5), y + (y < 60 ? b : 0), GOLD[2], 9.4);
  shape(p, [[14, 22 + b], [42, 22 + b], [46, 34 + b], [10, 34 + b]], ['#d8d0c0', '#ece6da', '#fffaf0'], 10, { flat: 0.4 }); // a white mantle
  for (let x = 11; x <= 45; x += 4) p.px(x, 33 + b, SCARLET[3], 10.2);
  // the near hand holds a burning book; the far hand a branding iron
  const raise = k === 'cast' || k === 'windup' ? -12 : 0;
  limb(p, 16, 28 + b, 8, 44 + b + raise, 3, 2.6, SCARLET, 9.5);
  limb(p, 8, 44 + b + raise, 4, 24 + b + raise, 1, 1, IRON.slice(2), 10);
  p.lit(4, 22 + b + raise, FIRE[3], 10.4, 1.6);
  p.lit(3, 21 + b + raise, FIRE[4], 10.4, 1.6);
  limb(p, 40, 28 + b, 46, 40 + b + raise, 3, 2.6, SCARLET, 11);
  p.bevelRect(42, 38 + b + raise, 12, 9, ['#3a1a0a', '#5a2a14', '#7a3e20'], 11.4, 1);
  p.hline(43, 52, 42 + b + raise, '#e8dcc0', 11.6); // the pages
  for (let s = 0; s < 4; s++) p.lit(44 + s * 3, 36 + b + raise - (s % 2) * 2, FIRE[2 + (s % 3)], 11.8, 1.4);
  // the face: gaunt, severe, the tall hat of his office
  const hy = 16 + b;
  p.ellipse(28, hy, 5.4, 6.4, ['#5a4438', '#7a5c4c', '#9a7a64', '#b8967c'], 11.5);
  p.hline(25, 27, hy - 1, '#1a0a0a', 12);
  p.hline(29, 31, hy - 1, '#1a0a0a', 12);
  if (k === 'cast' || k === 'attack') {
    p.lit(26, hy - 1, '#ffd060', 12.2, 1.4);
    p.lit(30, hy - 1, '#ffd060', 12.2, 1.4);
  }
  p.hline(26, 30, hy + 4, '#3a1a14', 12);
  shape(p, [[22, hy - 4], [24, hy - 22], [32, hy - 22], [34, hy - 4]], SCARLET, 12.4, { flat: 0.3 });
  p.hline(22, 34, hy - 5, GOLD[2], 12.8);
  for (let y = hy - 20; y < hy - 6; y += 4) p.hline(26, 30, y, GOLD[1], 12.8);
  p.vline(28, hy - 21, hy - 7, GOLD[2], 12.9); // the cross on his hat
}, '#c04a40');

// ===================== THE DREAD KNIGHT =====================

export const dreadknightFrame = makeSheet(72, 80, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[6, 72], [62, 70], [64, 78], [4, 79]], CAPE, 4);
    shape(p, [[12, 70 - (2 - i) * 6], [48, 68 - (2 - i) * 6], [50, 76], [10, 77]], DREAD, 8 - i * 2);
    p.ellipse(54, 70, 6, 5, DREAD, 8 - i);
    if (i < 2) p.lit(55, 69, SICK, 8.5, 1);
    return;
  }
  const [fl, bl] = stride(pose, 4);
  const y0 = b + (k === 'attack' ? 3 : k === 'windup' ? 2 : 0);
  // the tattered cape behind
  const hem = [];
  for (let x = 8; x <= 60; x += 4) hem.push([x, 72 + ((x / 4) % 2 ? -5 : 0)]);
  shape(p, [[20, 22 + y0], [52, 22 + y0], [60, 70], ...hem.reverse(), [8, 70]], CAPE, 4, { folds: 0.8 });
  // legs in spiked plate
  limb(p, 28, 50 + y0, 26 + bl, 74, 5, 4.4, DREAD, 6);
  limb(p, 44, 50 + y0, 46 + fl, 74, 5, 4.4, DREAD, 6.5);
  for (const fx of [26 + bl, 46 + fl]) {
    p.bevelRect(fx - 6, 73, 13, 6, DREAD.slice(1), 5, 1);
    p.px(fx, 60, DREAD[5], 7);
  }
  // the cuirass: black, fluted, a spiked gorget
  shape(p, [[18, 22 + y0], [54, 22 + y0], [56, 40 + y0], [48, 54 + y0], [24, 54 + y0], [16, 40 + y0]], DREAD, 10);
  for (const x of [26, 32, 40, 46]) p.line(x, 26 + y0, x + (x < 36 ? 1 : -1), 50 + y0, DREAD[1], 10.4);
  p.line(36, 24 + y0, 36, 52 + y0, DREAD[5], 10.6);
  for (let x = 20; x <= 52; x += 4) shape(p, [[x, 23 + y0], [x + 2, 17 + y0], [x + 4, 23 + y0]], DREAD.slice(2), 10.8); // the gorget's spikes
  // spiked pauldrons
  for (const [sx, h] of [[16, 11], [56, 12]]) {
    p.ellipse(sx, 26 + y0, 8, 6, DREAD, h);
    for (let s = -1; s <= 1; s++) limb(p, sx + s * 4, 22 + y0, sx + s * 6, 14 + y0, 1.6, 0.4, DREAD.slice(2), h + 0.4);
  }
  // the far arm, a shield of black iron
  limb(p, 14, 30 + y0, 10, 46 + y0, 4, 3.6, DREAD, 9);
  shape(p, [[2, 36 + y0], [16, 36 + y0], [16, 52 + y0], [9, 60 + y0], [2, 52 + y0]], DREAD, 9.5, { flat: 0.3 });
  for (let y = 40; y < 56; y += 5) p.hline(4, 14, y + y0, CAPE[2], 9.8);
  p.lit(9, 46 + y0, SICK, 10, 0.8);
  // the near arm, a great black sword
  const sw = { windup: [50, 8, 34, -6], attack: [58, 46, 70, 76], cast: [36, 4, 36, -6] }[k] || [56, 44, 62, 4];
  limb(p, 56, 30 + y0, sw[0], sw[1] + y0, 4.2, 3.6, DREAD, 12.4);
  const len = Math.hypot(sw[2] - sw[0], sw[3] - sw[1]) || 1;
  const ux = (sw[2] - sw[0]) / len;
  const uy = (sw[3] - sw[1]) / len;
  limb(p, sw[0] + ux * 3, sw[1] + y0 + uy * 3, sw[2], sw[3] + y0, 2.8, 1.2, DREAD, 13);
  for (let t = 6; t < len - 3; t += 2) p.lit(sw[0] + ux * t, sw[1] + y0 + uy * t, SICK, 13.4, 0.5); // a green rune down the fuller
  limb(p, sw[0] - uy * 6, sw[1] + y0 + ux * 6, sw[0] + uy * 6, sw[1] + y0 - ux * 6, 1.4, 1.4, DREAD.slice(2), 13.2);
  p.ellipse(sw[0], sw[1] + y0, 3.4, 3, DREAD, 13.6);
  // the helm: horned, a T-slit full of green light
  const hy = 12 + y0;
  p.ellipse(36, hy, 9, 9, DREAD, 13);
  p.hline(29, 43, hy, '#000000', 13.4);
  p.vline(36, hy, hy + 6, '#000000', 13.4);
  for (let x = 30; x <= 42; x++) p.lit(x, hy, SICK, 13.6, x === 33 || x === 39 ? 2 : 0.8);
  limb(p, 29, hy - 5, 20, hy - 12, 2.2, 0.8, DREAD.slice(1), 13.2);
  limb(p, 20, hy - 12, 18, hy - 20, 1.2, 0.4, DREAD.slice(1), 13.2);
  limb(p, 43, hy - 5, 52, hy - 12, 2.2, 0.8, DREAD.slice(1), 13.4);
  limb(p, 52, hy - 12, 54, hy - 20, 1.2, 0.4, DREAD.slice(1), 13.4);
}, '#4a5a6a');

// ===================== THE EYE BELOW =====================

export const abyssaleyeFrame = makeSheet(72, 72, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.3) * 2);
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(36, 64, 22 - i * 3, 6 - i, FLESH_D, 5);
    for (let s = 0; s < 6 - i * 2; s++) limb(p, 16 + s * 8, 64, 12 + s * 9, 70, 2, 1, FLESH_D, 4);
    if (i < 2) p.ellipse(36, 60, 8 - i * 3, 6 - i * 2, SCLERA, 6);
    return;
  }
  // tentacles hanging beneath, writhing
  for (let s = 0; s < 7; s++) {
    const x0 = 18 + s * 6;
    const sw = Math.sin(s * 1.7 + (pose.i || 0) * 1.4 + pose.bob) * 6;
    limb(p, x0, 48 + b, x0 + sw * 0.5, 58 + b, 3, 2.2, FLESH_D, 5);
    limb(p, x0 + sw * 0.5, 58 + b, x0 + sw, 70, 2.2, 0.6, FLESH_D, 5);
    for (let t = 52; t < 68; t += 4) p.px(x0 + sw * ((t - 48) / 22), t + b * 0.5, FLESH_D[4], 5.4); // suckers
  }
  // the eyeball: huge, veined, bloodshot
  const cy = 30 + b;
  p.ellipse(36, cy, 24, 22, SCLERA, 12);
  for (let v = 0; v < 9; v++) {
    const a = v * 0.7;
    let x = 36 + Math.cos(a) * 22;
    let y = cy + Math.sin(a) * 20;
    for (let s = 0; s < 9; s++) {
      x += (36 - x) * 0.12 + Math.sin(s + v) * 0.8;
      y += (cy - y) * 0.12 + Math.cos(s * 1.3 + v) * 0.8;
      if (p.filled(Math.round(x), Math.round(y))) p.px(x, y, VEIN, 12.3);
    }
  }
  // the lids: heavy, wrinkled flesh closing over top and bottom
  const open = k === 'cast' || k === 'attack' ? 1 : k === 'windup' ? 0.8 : 0.55 + (pose.i || 0) * 0.03;
  const lidTop = cy - 22 + (1 - open) * 18;
  const lidBot = cy + 22 - (1 - open) * 14;
  for (let y = cy - 23; y <= cy + 23; y++) {
    for (let x = 10; x <= 62; x++) {
      if (!p.filled(x, y)) continue;
      if (y < lidTop + Math.abs(x - 36) * 0.18 || y > lidBot - Math.abs(x - 36) * 0.14) p.px(x, y, FLESH_D[2 + ((x + y) % 3 === 0 ? 1 : 0)], 13);
    }
  }
  for (let x = 14; x <= 58; x++) {
    p.px(x, Math.round(lidTop + Math.abs(x - 36) * 0.18), FLESH_D[4], 13.4);
    p.px(x, Math.round(lidBot - Math.abs(x - 36) * 0.14), FLESH_D[1], 13.4);
  }
  // the iris and pupil, glaring, glowing sick green
  const ix = 38 + (k === 'attack' ? 3 : 0);
  p.ellipse(ix, cy, 10, 10 * Math.min(1, open * 1.2), ['#0e2a10', '#1a4a1c', '#2a7a2c', '#4ab048', SICK], 13.8);
  p.ellipse(ix, cy, 3, 7 * Math.min(1, open * 1.2), ['#000000', '#020402'], 14);
  p.glow(ix - 4, cy - 4, SICK, 1.4);
  p.glow(ix + 5, cy + 3, SICK, 1.2);
  p.px(ix - 5, cy - 5, '#ffffff', 14.2);
  p.px(ix - 4, cy - 5, '#e8fff0', 14.2);
}, '#c08a8a');

// ===================== redrawn: THE GRAVEDIGGER =====================

export const gravediggerFrame = makeSheet(56, 56, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(28, 50, 18 + i * 2, 4, DIRT, 3);
    shape(p, [[8, 50 - (2 - i) * 4], [40, 48 - (2 - i) * 4], [42, 54], [6, 54]], RAGS, 5);
    limb(p, 36, 50, 54, 44 + i * 2, 1, 1, ['#2e1c10', '#4a2e18'], 5);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const y0 = b + (k === 'windup' ? 3 : 0);
  limb(p, 22, 38 + y0, 20 + bl, 52, 3.2, 2.6, RAGS, 5);
  limb(p, 30, 38 + y0, 32 + fl, 52, 3.2, 2.6, RAGS, 5.4);
  for (const fx of [20 + bl, 32 + fl]) p.bevelRect(fx - 4, 51, 9, 4, LEATHER.slice(1), 5, 1);
  // a long coat caked in grave-dirt
  shape(p, [[16, 18 + y0], [34, 18 + y0], [38, 44 + y0], [12, 44 + y0]], RAGS, 9, { folds: 1 });
  spots(p, 12, 30 + y0, 26, 14, DIRT, 0.1, 6161, 2);
  // the shovel
  const sw = { windup: [38, 6, 22, -2], attack: [40, 30, 52, 46], cast: [36, 4, 40, -4] }[k] || [36, 26, 46, 4];
  limb(p, 32, 22 + y0, sw[0], sw[1] + y0, 2.6, 2.2, RAGS, 10.5);
  limb(p, sw[0], sw[1] + y0, sw[2], sw[3] + y0, 1, 1, ['#2e1c10', '#4a2e18', '#6a4424'], 11);
  const ang = Math.atan2(sw[3] - sw[1], sw[2] - sw[0]);
  const bx = sw[2] + Math.cos(ang) * 4;
  const by = sw[3] + y0 + Math.sin(ang) * 4;
  shape(p, [[bx - Math.sin(ang) * 4, by + Math.cos(ang) * 4], [bx + Math.cos(ang) * 8, by + Math.sin(ang) * 8], [bx + Math.sin(ang) * 4, by - Math.cos(ang) * 4]], IRON, 11.4, { flat: 0.4 });
  p.ellipse(sw[0], sw[1] + y0, 2.4, 2.2, SKIN.slice(0, 5), 11.6);
  // a slouch hat, a lantern jaw, a lamp at his belt
  const hy = 12 + y0;
  p.ellipse(25, hy, 5.4, 6, ['#4a3a30', '#6a5444', '#8a705c', '#a8907a'], 12);
  p.px(23, hy, '#0a0606', 12.4);
  p.px(27, hy, '#0a0606', 12.4);
  p.lit(23, hy, '#ffd080', 12.6, 0.6);
  p.hline(22, 28, hy + 4, '#2a1a10', 12.4);
  shape(p, [[14, hy - 4], [36, hy - 4], [32, hy - 7], [18, hy - 7]], LEATHER, 12.8);
  shape(p, [[19, hy - 7], [31, hy - 7], [29, hy - 13], [21, hy - 13]], LEATHER, 13);
  p.bevelRect(12, 36 + y0, 5, 6, IRON.slice(2, 6), 9.4, 1);
  p.lit(14, 39 + y0, '#ffb040', 9.8, 1.6);
}, '#8a7460');

// ===================== redrawn: THE THORN WITCH =====================

export const thornwitchFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 1.5);
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[8, 58], [52, 56], [54, 62], [6, 63]], WITCHROBE, 5 - i);
    for (let s = 0; s < 8; s++) limb(p, 10 + s * 6, 60, 12 + s * 6, 52 - ((s * 5) % 8) + i * 3, 1, 0.4, THORNY, 6);
    return;
  }
  // briars curling up from the floor around her
  for (let s = 0; s < 6; s++) {
    const x = 10 + s * 9;
    for (let t = 0; t < 12; t++) p.px(x + Math.sin(t * 0.8 + s) * 2, 62 - t, THORNY[2 + (t % 2)], 3);
    p.px(x + 2, 56 - s % 3, THORNY[4], 3.4);
  }
  // the robe: moss-dark, its hem tattered into roots
  const hem = [];
  for (let x = 14; x <= 50; x += 3) hem.push([x, 60 + ((x / 3) % 2 ? 2 : -1)]);
  shape(p, [[24, 22 + b], [40, 22 + b], [50, 58], ...hem.reverse(), [14, 58]], WITCHROBE, 9, { folds: 0.9 });
  for (let y = 28; y < 58; y += 5) p.line(20, y, 44, y + 2, THORNY[3], 9.4); // briars binding the robe
  // arms: long thin fingers, thorns growing from her knuckles
  const raise = k === 'cast' || k === 'windup' ? -14 : k === 'attack' ? -4 : 0;
  limb(p, 24, 26 + b, 14, 38 + b + raise, 2.4, 2, WITCHROBE, 9.5);
  limb(p, 40, 26 + b, 50, 38 + b + raise, 2.4, 2, WITCHROBE, 10.5);
  for (const hx of [14, 50]) for (let c = -1; c <= 1; c++) limb(p, hx, 38 + b + raise, hx + c * 3, 44 + b + raise, 0.8, 0.4, ['#5a5a44', '#8a8a6a'], 10.6);
  if (raise < 0) for (let s = 0; s < 6; s++) p.lit(14 + s * 7, 18 + b + raise * 0.5 - (s % 2) * 3, '#a0ff60', 9, 0.6);
  // the face: green-grey, a crown of thorns, eyes of sap-light
  const hy = 16 + b;
  for (let s = 0; s < 6; s++) limb(p, 26 + s * 2.4, hy - 2, 22 + s * 4, hy + 14 + (s % 3) * 2, 1.2, 0.5, ['#1a1a14', '#2a2a20', '#3a3a2c'], 10.5);
  p.ellipse(32, hy, 5.4, 6.4, ['#4a5440', '#68745a', '#8a9676', '#a8b494'], 11.5);
  glowEye(p, 29, hy - 1, '#a0ff60', 12, 1);
  glowEye(p, 34, hy - 1, '#a0ff60', 12, 1);
  p.hline(30, 34, hy + 4, '#141a10', 12);
  for (let a = 0; a < 9; a++) {
    const x = 25 + a * 1.8;
    limb(p, x, hy - 6, x + (a % 2 ? 1 : -1), hy - 11 - (a % 3) * 2, 0.8, 0.3, THORNY, 12.4);
  }
}, '#6a8a5a');

// ===================== redrawn: THE PYRE BISHOP =====================

export const pyrebishopFrame = makeSheet(56, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(28, 58, 18 + i * 2, 4, ['#2a1a14', '#4a2a1a'], 2, false);
    shape(p, [[8, 58 - (2 - i) * 4], [44, 56 - (2 - i) * 4], [46, 62], [6, 62]], PYRE, 5);
    for (let s = 0; s < 6; s++) p.lit(10 + s * 6, 56 - (s % 3) * 3 - i * 3, FIRE[2 + (s % 3)], 4, 1);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  // the vestments: deep crimson over a burning hem
  for (let s = 0; s < 7; s++) limb(p, 12 + s * 5, 62, 13 + s * 5, 56 - (s % 2) * 3, 1.6, 0.5, FIRE.slice(1), 3);
  shape(p, [[18, 22 + b], [38, 22 + b], [46, 60], [10, 60]], PYRE, 9, { folds: 0.8 });
  shape(p, [[24, 22 + b], [32, 22 + b], [34, 60], [22, 60]], GOLD, 9.4, { flat: 0.5 }); // the gold stole
  for (let y = 28; y < 58; y += 7) {
    p.hline(26, 30, y + (y < 50 ? b : 0), PYRE[1], 9.8);
    p.vline(28, y - 2 + (y < 50 ? b : 0), y + 2 + (y < 50 ? b : 0), PYRE[1], 9.8);
  }
  // the censer on its chain, swinging, pouring smoke and embers
  const swing = k === 'walk' ? (pose.i % 2 ? 6 : -6) : k === 'attack' ? 10 : 0;
  const raise = k === 'cast' || k === 'windup' ? -12 : 0;
  limb(p, 38, 26 + b, 44, 36 + b + raise, 2.6, 2.2, PYRE, 10.5);
  for (let t = 0; t < 8; t++) p.px(44 + swing * (t / 8), 36 + b + raise + t * 1.4, IRON[5], 10.8);
  const cx = 44 + swing;
  const cy = 48 + b + raise;
  p.ellipse(cx, cy, 4.4, 4, GOLD, 11);
  for (let x = cx - 3; x <= cx + 3; x += 2) p.lit(x, cy, FIRE[3], 11.4, 1.2);
  for (let s = 0; s < 5; s++) p.lit(cx + Math.sin(s) * 3, cy - 5 - s * 3, s % 2 ? FIRE[2] : '#7a6a6a', 9, s % 2 ? 0.9 : 0);
  limb(p, 18, 26 + b, 12, 40 + b, 2.6, 2.2, PYRE, 9);
  p.ellipse(12, 41 + b, 2.4, 2.2, ['#6a4a38', '#8e6a52', '#b08a6e'], 9.4);
  // the face: old, stern, lit from below; the mitre
  const hy = 14 + b;
  p.ellipse(28, hy, 5.4, 6.4, ['#5a4438', '#7a5c4c', '#9a7a64', '#c09a7e'], 11.5);
  p.hline(25, 27, hy - 1, '#1a0a0a', 12);
  p.hline(29, 31, hy - 1, '#1a0a0a', 12);
  p.lit(26, hy - 1, FIRE[3], 12.2, 0.8);
  p.lit(30, hy - 1, FIRE[3], 12.2, 0.8);
  for (let x = 24; x <= 32; x++) p.px(x, hy + 4 + (x % 2), '#d8d0c0', 12); // a white beard
  for (let x = 25; x <= 31; x++) p.px(x, hy + 6, '#b8b0a0', 12);
  shape(p, [[21, hy - 5], [24, hy - 18], [28, hy - 21], [32, hy - 18], [35, hy - 5]], ['#4a3410', '#8a6420', '#c4a040', '#e8cc70'], 12.5);
  p.vline(28, hy - 19, hy - 6, PYRE[3], 12.8);
  p.hline(25, 31, hy - 12, PYRE[3], 12.8);
  if (fl) {
    // (keeps the stride import honest when walking)
  }
  if (bl) {
    // -
  }
}, '#c0603a');

// ===================== redrawn: THE PLAGUE PHYSICIAN =====================

export const physicianFrame = makeSheet(56, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[6, 58], [46, 56], [48, 62], [4, 63]], PLAGUE, 5 - i);
    p.ellipse(44 - i * 2, 54, 6, 4, PLAGUE, 6);
    limb(p, 46 - i * 2, 54, 54, 56, 2, 0.6, BEAK, 6);
    return;
  }
  const [fl, bl] = stride(pose, 3);
  limb(p, 22, 40 + b, 20 + bl, 60, 3, 2.4, PLAGUE, 5);
  limb(p, 32, 40 + b, 34 + fl, 60, 3, 2.4, PLAGUE, 5.4);
  for (const fx of [20 + bl, 34 + fl]) p.bevelRect(fx - 4, 59, 9, 4, LEATHER.slice(1), 5, 1);
  // the waxed black coat, long and flared
  shape(p, [[18, 20 + b], [36, 20 + b], [44, 52 + b], [10, 52 + b]], PLAGUE, 9, { folds: 0.8 });
  for (let y = 24; y < 50; y += 5) p.px(27, y + b, '#8a8a8a', 9.4); // buttons
  p.hline(14, 40, 36 + b, LEATHER[3], 9.6); // the belt, hung with phials
  for (const [x, c] of [[16, '#7ad040'], [36, '#d04060'], [40, '#40a0d0']]) {
    p.bevelRect(x, 37 + b, 3, 5, ['#2a2a2a', '#4a4a4a', '#6a6a6a'], 9.8, 1);
    p.lit(x + 1, 39 + b, c, 10, 1);
  }
  // a cane with a bleeding-bowl, and a lancet in the other hand
  const raise = k === 'cast' || k === 'windup' ? -10 : 0;
  limb(p, 18, 24 + b, 10, 38 + b, 2.6, 2.2, PLAGUE, 9.5);
  limb(p, 10, 38 + b, 8, 62, 1, 1, ['#2e1c10', '#4a2e18', '#6a4424'], 9.6);
  limb(p, 36, 24 + b, 44 + (k === 'attack' ? 6 : 0), 36 + b + raise, 2.6, 2.2, PLAGUE, 10.5);
  limb(p, 44 + (k === 'attack' ? 6 : 0), 36 + b + raise, 50 + (k === 'attack' ? 6 : 0), 30 + b + raise, 0.8, 0.4, IRON.slice(3), 10.8);
  // the mask: a long ivory beak, round glass eyes, a wide-brimmed hat
  const hy = 14 + b;
  p.ellipse(26, hy, 6, 6.4, PLAGUE, 11.5);
  limb(p, 30, hy + 1, 44, hy + 8, 3, 0.8, BEAK, 12);
  for (const ex of [24, 29]) {
    p.ellipse(ex, hy - 1, 2.2, 2.2, ['#1a2a2a', '#2a4a48', '#3a6a68'], 12.4);
    p.lit(ex - 1, hy - 2, '#c0fff0', 12.6, 0.8);
  }
  shape(p, [[12, hy - 5], [40, hy - 5], [36, hy - 8], [16, hy - 8]], PLAGUE.slice(1), 12.8);
  shape(p, [[18, hy - 8], [34, hy - 8], [32, hy - 15], [20, hy - 15]], PLAGUE, 13);
  p.hline(18, 34, hy - 9, LEATHER[3], 13.2);
  if (k === 'cast' || k === 'attack') for (let s = 0; s < 8; s++) p.lit(30 + s * 2, 40 + b + raise * 0.5 - s * 2, '#7ad040', 8, 0.7); // a miasma
}, '#6a6a6a');
