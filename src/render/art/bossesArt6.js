// Redrawn bosses, part three: the Court Jester, the Molten Knight, the Burned Queen, the Ossuary Choir,
// the Stag of Thorns, Old Gnasher, Ashwing, the Forgotten Keeper and the Hollow Crown.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet, stride } from './bossesArt4.js';

const MOTLEY_R = ['#2a0608', '#4e0c10', '#7a1418', '#a42024', '#c83a34'];
const MOTLEY_G = ['#3a2a08', '#6a4c10', '#9a7420', '#c8a034', '#ecc860'];
const PAINT = ['#8a8478', '#b4ae9e', '#d8d2c0', '#f2ecdc'];
const STEEL = ['#1a1a20', '#2e2e36', '#4a4a54', '#6e6e7a', '#9a9aa6', '#d0d0da'];
const CHAR = ['#08060a', '#120e12', '#1c161a', '#282024', '#36292c'];
const LAVA = ['#5a1404', '#a03008', '#e05a10', '#ff9a30', '#ffe080'];
const ASH = ['#141010', '#221a18', '#322622', '#44342e', '#58463c'];
const EMBER = '#ff7a20';
const GOLD = ['#4a3410', '#8a6420', '#c49a38', '#ecd078'];
const BONE = ['#4a4232', '#7a6e54', '#a89a78', '#d0c4a0', '#ece2c4'];
const ROBE_B = ['#0a080a', '#141014', '#1e181e', '#2a222a', '#382e38'];
const HART = ['#120c0a', '#22180f', '#352618', '#4a3622', '#60482e', '#7a5c3a'];
const THORN = ['#0e140a', '#1a2410', '#283618', '#3a4a20'];
const FUR = ['#16120e', '#2a221c', '#40342a', '#5a4a3c', '#786454', '#94806c'];
const DRAKE = ['#1a0806', '#320e0a', '#4e1a10', '#6c2816', '#8c3a1e', '#ac5228'];
const BELLY = ['#4a3010', '#7a5418', '#a87a2a', '#d0a448'];
const MEMBRANE = ['#2a0c0a', '#441410', '#5e1e16', '#7a2c1e'];
const KSTONE = ['#121418', '#1e2228', '#2c323a', '#3e4650', '#525c68', '#6a7682'];
const MOSSY = ['#1a2a14', '#2a3e1c', '#3e5626'];
const WRAITH = ['#04030a', '#0a0816', '#120e24', '#1c1634', '#2a2048'];
const SOUL = '#9ad0ff';

// ===================== THE COURT JESTER =====================

export const courtjesterFrame = makeSheet(56, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[8, 56 + i], [48, 54 + i], [50, 62], [6, 63]], MOTLEY_R, 5 - i);
    p.ellipse(44 - i * 3, 54, 5, 4.5, PAINT, 7);
    for (const [x, c] of [[12, MOTLEY_G[3]], [20, MOTLEY_R[3]], [30, MOTLEY_G[3]]]) p.ellipse(x, 52 - i, 1.6, 1.6, [c], 7); // the bells, scattered
    return;
  }
  const [fl, bl] = stride(pose, 3);
  const hop = k === 'walk' ? [0, 3, 0, 3][pose.i] : 0;
  const y0 = b - hop;
  // legs in parti-coloured hose, curled shoes
  limb(p, 24, 42 + y0, 22 + bl, 58 + y0 * 0.3, 2.6, 2.2, MOTLEY_R, 5);
  limb(p, 32, 42 + y0, 34 + fl, 58 + y0 * 0.3, 2.6, 2.2, MOTLEY_G, 5.5);
  for (const [fx, ramp] of [[22 + bl, MOTLEY_G], [34 + fl, MOTLEY_R]]) {
    limb(p, fx - 3, 61, fx + 5, 60, 2, 1.4, ramp, 4);
    p.ellipse(fx + 6, 58, 1.4, 1.4, ['#a07a20', '#ecc860'], 4.4);
  }
  // the doublet: a diamond pattern of red and gold
  shape(p, [[18, 22 + y0], [38, 22 + y0], [40, 44 + y0], [16, 44 + y0]], MOTLEY_R, 9);
  for (let y = 22; y < 44; y++) for (let x = 16; x < 41; x++) if (Math.abs(((x - 28 + 64) % 8) - 4) + Math.abs(((y - 22) % 8) - 4) < 3 && p.filled(x, y + y0)) p.px(x, y + y0, MOTLEY_G[2 + ((x + y) % 2)], 9.2);
  // a ruff collar of bells
  for (let x = 18; x <= 38; x += 4) {
    p.ellipse(x, 23 + y0, 2.6, 2, PAINT, 10);
    p.ellipse(x, 26 + y0, 1.2, 1.2, MOTLEY_G.slice(2), 10.2);
  }
  // arms, a dagger in each hand
  const throwArm = k === 'attack' ? -14 : k === 'windup' ? -10 : k === 'cast' ? -16 : 0;
  limb(p, 18, 26 + y0, 10, 38 + y0 + throwArm * 0.4, 2.4, 2, MOTLEY_G, 8.5);
  limb(p, 38, 26 + y0, 46, 36 + y0 + throwArm, 2.4, 2, MOTLEY_R, 10);
  for (const [hx, hy] of [[10, 39 + y0 + throwArm * 0.4], [46, 37 + y0 + throwArm]]) {
    p.ellipse(hx, hy, 2, 2, PAINT, 10.5);
    limb(p, hx, hy - 1, hx + 1, hy - 9, 1, 0.4, STEEL.slice(2), 10.8);
    p.hline(hx - 2, hx + 2, hy - 1, GOLD[2], 11);
  }
  // the painted face: white, a wide red grin, black diamonds over the eyes
  const hy = 14 + y0;
  p.ellipse(28, hy, 7, 7.5, PAINT, 12);
  for (const ex of [25, 31]) {
    p.px(ex, hy - 3, '#0a0808', 12.4);
    p.hline(ex - 1, ex + 1, hy - 2, '#0a0808', 12.4);
    p.px(ex, hy - 1, '#0a0808', 12.4);
    p.lit(ex, hy - 2, '#ff3030', 12.6, 1.2);
  }
  const grin = k === 'attack' || k === 'cast' ? 2 : 1;
  for (let x = 23; x <= 33; x++) p.px(x, Math.round(hy + 3 + Math.sin(((x - 23) / 10) * Math.PI) * grin), MOTLEY_R[3], 12.4);
  if (grin > 1) for (let x = 25; x <= 31; x += 2) p.px(x, hy + 4, PAINT[3], 12.6);
  // the three-pointed hat, belled
  shape(p, [[20, hy - 4], [36, hy - 4], [34, hy - 9], [22, hy - 9]], MOTLEY_G, 12.6);
  limb(p, 22, hy - 8, 12, hy - 16, 2.6, 1, MOTLEY_R, 13);
  limb(p, 28, hy - 9, 28, hy - 20, 2.6, 1, MOTLEY_G, 13);
  limb(p, 34, hy - 8, 44, hy - 16, 2.6, 1, MOTLEY_R, 13);
  for (const [bx, by] of [[11, hy - 17], [28, hy - 21], [45, hy - 17]]) p.ellipse(bx, by, 1.8, 1.8, ['#6a4c10', '#c8a034', '#ecc860'], 13.4);
}, '#d88070');

// ===================== THE MOLTEN KNIGHT =====================

export const moltenknightFrame = makeSheet(64, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 66, 22 + i * 3, 5, LAVA, 2, false);
    for (let r = 0; r < 6 - i; r++) shape(p, [[10 + r * 8, 66 - (r % 2) * 4], [16 + r * 8, 60 - (r % 3) * 2 - i], [20 + r * 8, 66]], CHAR, 6);
    for (let s = 0; s < 8; s++) p.lit(12 + s * 5, 64 - (s % 3), LAVA[3], 3, 1.2);
    return;
  }
  const [fl, bl] = stride(pose, 3);
  const y0 = b + (k === 'attack' ? 3 : 0);
  // armoured legs, glowing at the joints
  limb(p, 26, 46 + y0, 24 + bl, 66, 4.4, 3.8, CHAR, 6);
  limb(p, 38, 46 + y0, 40 + fl, 66, 4.4, 3.8, CHAR, 6.5);
  for (const [x, y] of [[25 + bl * 0.5, 56], [39 + fl * 0.5, 56]]) p.lit(x, y + y0 * 0.5, LAVA[3], 7, 1.4);
  for (const fx of [24 + bl, 40 + fl]) p.bevelRect(fx - 5, 64, 11, 6, CHAR.slice(1), 5, 1);
  // the cuirass: black plate split by seams of lava
  shape(p, [[18, 22 + y0], [46, 22 + y0], [48, 40 + y0], [42, 50 + y0], [22, 50 + y0], [16, 40 + y0]], CHAR, 10);
  for (const [x0, y0b, x1, y1] of [[24, 26, 30, 40], [30, 40, 26, 48], [40, 26, 36, 36], [36, 36, 40, 46], [20, 34, 26, 36]]) {
    p.line(x0, y0b + y0, x1, y1 + y0, LAVA[2], 10.4);
    p.glow(x0, y0b + y0, LAVA[3], 1.5);
    p.glow(x1, y1 + y0, LAVA[3], 1.5);
    p.glow((x0 + x1) / 2, (y0b + y1) / 2 + y0, LAVA[4], 1.5);
  }
  p.hline(18, 46, 44 + y0, CHAR[3], 10.6); // a belt of plates
  // pauldrons
  p.ellipse(16, 25 + y0, 7, 5, CHAR, 11);
  p.ellipse(48, 25 + y0, 7, 5, CHAR, 12);
  p.lit(16, 27 + y0, LAVA[2], 11.4, 1);
  p.lit(48, 27 + y0, LAVA[2], 12.4, 1);
  // the far arm, then the near arm with the molten greatsword
  limb(p, 14, 28 + y0, 12, 42 + y0, 3.4, 3, CHAR, 9);
  const sw = { windup: [44, 6, 34, -4], attack: [52, 44, 62, 70], cast: [32, 4, 32, -6] }[k] || [48, 40, 56, 8];
  limb(p, 48, 28 + y0, sw[0], sw[1] + y0, 3.6, 3.2, CHAR, 12.5);
  // the blade: dark iron with a glowing core
  const len = Math.hypot(sw[2] - sw[0], sw[3] - sw[1]) || 1;
  const ux = (sw[2] - sw[0]) / len;
  const uy = (sw[3] - sw[1]) / len;
  limb(p, sw[0] + ux * 2, sw[1] + y0 + uy * 2, sw[2], sw[3] + y0, 2.6, 1.4, CHAR, 13);
  for (let t = 4; t < len - 2; t += 1.5) p.lit(sw[0] + ux * t, sw[1] + y0 + uy * t, t % 3 < 1.5 ? LAVA[3] : LAVA[4], 13.4, 1.6);
  limb(p, sw[0] - uy * 4, sw[1] + y0 + ux * 4, sw[0] + uy * 4, sw[1] + y0 - ux * 4, 1.2, 1.2, CHAR.slice(2), 13.2); // the crossguard
  p.ellipse(sw[0], sw[1] + y0, 2.6, 2.4, CHAR, 13.5); // the gauntlet
  // the great helm: a slit full of fire, a crest of smoke
  const hy = 14 + y0;
  p.ellipse(32, hy, 8, 8.5, CHAR, 13);
  p.hline(26, 38, hy, '#0a0404', 13.4);
  for (let x = 27; x <= 37; x++) p.lit(x, hy, x % 3 ? LAVA[3] : LAVA[4], 13.6, 1.8);
  p.vline(32, hy + 2, hy + 6, '#0a0404', 13.4);
  for (let s = 0; s < 5; s++) p.lit(32 + Math.sin(s * 1.3) * 2, hy - 9 - s * 2, LAVA[1 + (s % 3)], 12, 0.8); // sparks rising
  if (k === 'cast' || k === 'windup') for (let s = 0; s < 8; s++) p.lit(12 + s * 6, 60 - (s % 3) * 3, LAVA[3], 4, 0.8);
}, '#7a3a20');

// ===================== THE BURNED QUEEN =====================

export const burnedqueenFrame = makeSheet(64, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 66, 20, 4, ASH, 2, false);
    shape(p, [[16, 66 - (2 - i) * 6], [48, 66 - (2 - i) * 6], [52, 68], [12, 68]], CHAR, 4);
    for (let s = 0; s < 10 - i * 3; s++) p.lit(14 + s * 4, 60 - ((s * 5) % 20) - i * 8, EMBER, 3, 1);
    for (let x = 26; x <= 36; x++) p.px(x, 64, GOLD[x % 2 ? 1 : 2], 5); // the crown, left in the ashes
    return;
  }
  const y0 = b + Math.round(Math.sin((pose.i || 0) * 1.6));
  // flames licking at the hem
  for (let s = 0; s < 9; s++) {
    const fx = 14 + s * 4.5;
    const h = 5 + ((s * 7 + (pose.i || 0) * 3) % 6);
    limb(p, fx, 66, fx + ((s % 2) ? 1 : -1), 66 - h, 2, 0.5, LAVA.slice(1), 4);
  }
  // the gown: burned black, tattered, its edges still glowing
  const hem = [];
  for (let x = 12; x <= 52; x += 4) hem.push([x, 64 + ((x / 4) % 2 ? -4 : 0)]);
  shape(p, [[22, 26 + y0], [42, 26 + y0], [52, 62], ...hem.reverse(), [12, 62]], CHAR, 9, { folds: 0.8 });
  for (const [x, y] of hem) p.lit(x, y - 1, EMBER, 9.4, 1.4);
  spots(p, 12, 30, 40, 34, [LAVA[1], ASH[2]], 0.03, 666);
  // a bodice of charred gold
  shape(p, [[24, 24 + y0], [40, 24 + y0], [38, 36 + y0], [26, 36 + y0]], ASH, 10);
  for (let x = 25; x <= 39; x += 3) p.px(x, 30 + y0, GOLD[2], 10.4);
  // arms: thin, burned to the bone at the hands
  const raise = k === 'cast' || k === 'windup' ? -14 : k === 'attack' ? -6 : 0;
  limb(p, 24, 28 + y0, 14, 40 + y0 + raise, 2.4, 2, ASH, 9.5);
  limb(p, 40, 28 + y0, 50, 40 + y0 + raise, 2.4, 2, ASH, 11);
  for (const hx of [14, 50]) {
    for (let c = -1; c <= 1; c++) p.line(hx, 40 + y0 + raise, hx + c * 2, 44 + y0 + raise, BONE[2], 11.2);
    if (raise < 0) for (let s = 0; s < 4; s++) p.lit(hx + (s % 2 ? 1 : -1), 36 + y0 + raise - s * 2, s % 2 ? LAVA[3] : LAVA[4], 11.4, 1.6); // fire in her palms
  }
  // the face: scorched, eyes like coals; long hair turned to smoke and cinders
  const hy = 16 + y0;
  for (let s = 0; s < 6; s++) limb(p, 26 + s * 2.4, hy - 2, 20 + s * 4 + ((pose.i || 0) % 2), hy + 18 + (s % 3) * 3, 1.6, 0.6, ASH.slice(0, 4), 10.5);
  p.ellipse(32, hy, 6, 7, ['#2a1814', '#4a2a20', '#6a3e2e', '#8a5640'], 12);
  glowEye(p, 29, hy, LAVA[4], 12.4, 1);
  glowEye(p, 34, hy, LAVA[4], 12.4, 1);
  p.hline(30, 34, hy + 4, '#140808', 12.4);
  // the crown, blackened but still gold
  for (let x = 25; x <= 39; x++) p.px(x, hy - 6, GOLD[x % 3 ? 2 : 1], 13);
  for (const x of [25, 29, 32, 35, 39]) {
    p.px(x, hy - 7, GOLD[2], 13.2);
    p.px(x, hy - 8, GOLD[3], 13.4);
  }
  p.lit(32, hy - 6, '#ff3a20', 13.6, 1.4);
}, '#9a4a30');

// ===================== THE OSSUARY CHOIR =====================
// A pyramid of skulls and ribs that sings: open jaws in rows, one guttering candle on top.

export const choirFrame = makeSheet(64, 56, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    for (let r = 0; r < 10; r++) p.ellipse(10 + r * 5, 52 - (r % 2) * 2 - (2 - i) * 2, 3.2, 3, BONE, 5);
    return;
  }
  const sing = k === 'attack' || k === 'cast' || k === 'windup' ? 1 : pose.k === 'idle' ? pose.i : 0;
  // the black cloth the pile is heaped on
  shape(p, [[6, 52], [58, 52], [54, 40 + b], [10, 40 + b]], ROBE_B, 4);
  // rows of skulls: wider at the bottom
  const rows = [[5, 48], [4, 38], [3, 28], [2, 18]];
  rows.forEach(([n, y], r) => {
    for (let s = 0; s < n; s++) {
      const x = 32 + (s - (n - 1) / 2) * 10;
      const yy = y + b + (r % 2 ? 0 : 1);
      const hh = 6 + r * 1.6;
      // ribs between skulls
      if (s < n - 1) for (let rb = 0; rb < 3; rb++) p.line(x + 3, yy + 2 + rb * 2, x + 7, yy + 2 + rb * 2, BONE[1 + (rb % 2)], hh - 1);
      p.ellipse(x, yy, 4.2, 4.4, BONE, hh);
      p.ellipse(x - 1.6, yy - 0.5, 1.2, 1.4, '#0a0806', hh + 0.4);
      p.ellipse(x + 1.6, yy - 0.5, 1.2, 1.4, '#0a0806', hh + 0.4);
      p.lit(x - 1.6, yy - 0.5, SOUL, hh + 0.6, 1.2);
      p.lit(x + 1.6, yy - 0.5, SOUL, hh + 0.6, 1.2);
      // the jaw: open when they sing
      const open = sing && (s + r) % 2 === 0 ? 2 : sing ? 1 : 0;
      p.hline(x - 1, x + 1, yy + 2 + open, BONE[2], hh + 0.2);
      if (open) p.hline(x - 1, x + 1, yy + 2, '#0a0806', hh + 0.3);
    }
  });
  // the candle on top, and its light
  p.cyl(30, 4 + b, 4, 8, ['#8a7a5a', '#c8b890', '#ece0c0'], 14);
  p.lit(32, 2 + b, '#ffd080', 15, 1.6);
  p.lit(32, 1 + b, '#ffe8a0', 15, 1.8);
  if (sing) for (let n = 0; n < 4; n++) p.lit(12 + n * 13, 10 - (n % 2) * 4 + b, SOUL, 12, 0.7); // the song, made visible
}, '#c8bca0');

// ===================== THE STAG OF THORNS =====================

export const stagFrame = makeSheet(72, 64, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(36, 58, 24, 6 - i, HART, 6);
    limb(p, 54, 54, 66, 48 + i * 3, 4, 3, HART, 7); // the neck, laid down
    for (let a = 0; a < 3; a++) limb(p, 64, 46 + i * 3, 70 - a * 4, 36 + i * 4 - a * 3, 1, 0.5, ['#4a4030', '#7a6a50'], 8);
    return;
  }
  const lower = k === 'windup' ? 8 : k === 'attack' ? 10 : 0;
  const gait = k === 'walk' ? pose.i : 0;
  // legs: long and fine
  for (const [x, ph, h] of [[18, 0, 4], [26, 2, 5], [46, 1, 4], [54, 3, 5]]) {
    const sw = k === 'walk' ? ((gait + ph) % 4 < 2 ? 4 : -4) : 0;
    limb(p, x, 38 + b, x + sw * 0.5, 50 + b, 2.6, 2, HART, h);
    limb(p, x + sw * 0.5, 50 + b, x + sw, 61, 2, 1.4, HART.slice(0, 4), h);
    p.px(x + sw, 62, '#0a0806', h);
  }
  // the body, ribs showing under dark hide, vines wound about it
  p.ellipse(36, 32 + b, 22, 10, HART, 9);
  for (let x = 28; x <= 44; x += 4) p.line(x, 26 + b, x - 1, 38 + b, HART[2], 9.4);
  for (let x = 14; x <= 58; x++) p.px(x, Math.round(30 + b + Math.sin(x * 0.4) * 5), THORN[2], 9.6);
  for (let x = 16; x <= 56; x += 5) p.px(x, Math.round(30 + b + Math.sin(x * 0.4) * 5) - 1, THORN[3], 9.8);
  // the neck and noble head, lowered to charge
  const hx = 60;
  const hy = 16 + b + lower;
  limb(p, 50, 28 + b, hx, hy + 4, 5, 3.6, HART, 10);
  p.ellipse(hx + 2, hy + 3, 5, 4, HART, 11);
  limb(p, hx + 3, hy + 4, hx + 9, hy + 7, 2.6, 1.6, HART, 11.2); // the muzzle
  p.px(hx + 10, hy + 7, '#0a0806', 11.6);
  glowEye(p, hx + 2, hy + 1, '#e0f0d0', 11.8, 1);
  limb(p, hx - 1, hy - 1, hx - 5, hy - 3, 1.4, 0.6, HART, 11); // an ear
  // the antlers: great branching tines, wound with briars
  const tines = [[0, -10, -6, -20], [-6, -20, -14, -24], [-6, -20, -4, -30], [-2, -12, 6, -18], [0, -10, 4, -14]];
  for (const side of [0, 5]) {
    for (const [ax, ay, bx2, by2] of tines) limb(p, hx + ax + side, hy + ay + 8, hx + bx2 + side * 1.4, hy + by2 + 8, 1.4, 0.7, ['#3a3226', '#6a5c44', '#968464', '#c0ae88'], 12 - side * 0.2);
  }
  for (let t = 0; t < 14; t++) p.px(hx - 4 + ((t * 5) % 14), hy - 8 - ((t * 7) % 18), THORN[3], 12.6); // briars
  for (let t = 0; t < 6; t++) p.lit(hx - 6 + ((t * 9) % 16), hy - 12 - ((t * 5) % 14), '#c02634', 12.8, 0.6); // red berries
}, '#8a7050');

// ===================== OLD GNASHER =====================

export const mastiffFrame = makeSheet(64, 44, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 38, 22 - i * 2, 5, FUR, 4);
    p.ellipse(34, 41, 12 + i * 4, 2.5, ['#2a0406', '#4e080c', '#7a1016'], 2, false);
    p.ellipse(52, 36, 7, 5, FUR, 5);
    return;
  }
  const crouch = k === 'windup' ? 4 : 0;
  const lunge = k === 'attack' ? 6 : 0;
  const y0 = b + crouch;
  // legs: thick, muscular, the far pair darker
  for (const [x, ph, h, ramp] of [[16, 0, 4, FUR.slice(0, 5)], [42, 1, 4, FUR.slice(0, 5)], [22, 2, 6, FUR], [48, 3, 6, FUR]]) {
    const sw = k === 'walk' ? ((pose.i + ph) % 4 < 2 ? 3 : -3) : 0;
    limb(p, x, 26 + y0, x + sw * 0.6, 34 + y0, 3.6, 3, ramp, h);
    limb(p, x + sw * 0.6, 34 + y0, x + sw, 41, 3, 2.4, ramp, h);
    p.ellipse(x + sw + 1, 42, 3, 1.6, ramp, h);
  }
  // the body: deep chest, tucked waist, a stub of tail
  shape(p, [[10, 16 + y0], [40, 12 + y0], [52 + lunge, 18 + y0], [48 + lunge, 30 + y0], [30, 28 + y0], [12, 30 + y0]], FUR, 9);
  limb(p, 10, 18 + y0, 4, 12 + y0, 2, 1.2, FUR, 8);
  for (const x of [20, 26, 33]) p.line(x, 14 + y0, x + 4, 22 + y0, '#7a2a20', 9.4); // old whip-scars
  // the head: a broad skull, cropped ears, slavering jaws
  const hx = 52 + lunge;
  const hy = 14 + y0;
  p.ellipse(hx, hy, 8, 7, FUR, 10);
  limb(p, hx + 3, hy + 2, hx + 10, hy + 4, 4, 3, FUR, 10.2);
  p.ellipse(hx + 11, hy + 3, 1.6, 1.4, ['#0a0808', '#1a1414'], 10.6); // the nose
  limb(p, hx - 4, hy - 4, hx - 6, hy - 9, 2, 0.8, FUR, 10.4); // cropped ear
  glowEye(p, hx + 2, hy - 2, '#ffa020', 10.8, 1);
  const open = k !== 'idle' && k !== 'walk';
  if (open) {
    shape(p, [[hx + 2, hy + 4], [hx + 12, hy + 5], [hx + 10, hy + 9], [hx + 3, hy + 8]], ['#2a0606', '#4a0c0c'], 10.6, { flat: 0.6 });
    for (let x = hx + 3; x <= hx + 11; x += 2) {
      p.px(x, hy + 5, '#e8e0c8', 11);
      p.px(x + 1, hy + 8, '#e8e0c8', 11);
    }
    for (let d = 0; d < 3; d++) p.px(hx + 6 + d * 2, hy + 10 + d, '#c0d0e0', 10); // drool
  } else p.hline(hx + 3, hx + 11, hy + 6, '#1a0a0a', 10.6);
  // the spiked iron collar and its broken chain
  for (let y = hy + 3; y <= hy + 9; y++) p.px(hx - 6 + (y - hy - 3) * 0.3, y, STEEL[2], 11);
  for (let y = hy + 3; y <= hy + 9; y += 2) p.px(hx - 7, y, STEEL[5], 11.2);
  for (let c = 0; c < 4; c++) p.ellipse(hx - 9 - c * 2.4, hy + 10 + c * 1.6, 1.2, 1, STEEL.slice(2), 11);
}, '#8a7460');

// ===================== ASHWING =====================
// The last dragon: a long neck, a horned head, vast tattered wings, a belly of banked fire.

export const ashwingFrame = makeSheet(96, 80, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[10, 74], [80, 70 - i * 2], [86, 78], [8, 79]], DRAKE, 8 - i * 2);
    shape(p, [[14, 70], [44, 50 + i * 8], [52, 72]], MEMBRANE, 6 - i);
    for (let s = 0; s < 8; s++) p.lit(16 + s * 8, 72 - (s % 3) * 2, EMBER, 4, 0.8);
    return;
  }
  const flap = k === 'cast' || k === 'windup' ? -12 : k === 'walk' ? [0, -6, -10, -4][pose.i] : (pose.i ? -2 : 0);
  const y0 = b;
  // the far wing
  shape(p, [[40, 30 + y0], [22, 4 + y0 + flap], [8, 10 + y0 + flap], [12, 26 + y0 + flap * 0.4], [6, 38 + y0], [24, 42 + y0]], MEMBRANE.slice(0, 3), 4, { flat: 0.5, folds: 0.5 });
  limb(p, 40, 30 + y0, 22, 4 + y0 + flap, 2.4, 1.4, DRAKE, 5);
  for (const [fx, fy] of [[8, 10 + flap], [12, 26 + flap * 0.4], [6, 38]]) limb(p, 22, 4 + y0 + flap, fx, fy + y0, 1.2, 0.6, DRAKE, 5);
  // the tail, sweeping back
  limb(p, 30, 50 + y0, 14, 62, 6, 3.4, DRAKE, 6);
  limb(p, 14, 62, 4, 54, 3.4, 1.2, DRAKE, 6);
  shape(p, [[2, 50], [8, 52], [4, 57]], DRAKE.slice(2), 6.4); // the tail spade
  // legs: heavy haunches, clawed feet
  for (const [x, h, ramp] of [[34, 6, DRAKE.slice(0, 5)], [60, 8, DRAKE]]) {
    p.ellipse(x, 54 + y0, 7, 8, ramp, h);
    limb(p, x, 58 + y0, x - 3, 68, 4.6, 3.6, ramp, h);
    limb(p, x - 3, 68, x + 1, 76, 3.6, 3, ramp, h);
    for (let c = -1; c <= 1; c++) limb(p, x + 1, 76, x + 5 + c * 2, 78, 1.1, 0.5, ['#3a2a1a', '#8a7a5a', '#c8b890'], h + 0.4);
  }
  // the body: scaled back, a belly of plates glowing with banked fire
  p.ellipse(46, 46 + y0, 23, 14, DRAKE, 10);
  shape(p, [[28, 50 + y0], [64, 48 + y0], [66, 58 + y0], [30, 60 + y0]], BELLY, 10.4, { dir: 0.4 });
  for (let x = 30; x < 66; x += 4) p.vline(x, 49 + y0, 59 + y0, BELLY[0], 10.6);
  const fire = k === 'windup' || k === 'cast' || k === 'attack';
  if (fire) for (let x = 32; x < 64; x += 4) p.lit(x + 2, 54 + y0, LAVA[3], 10.8, 1.2);
  spots(p, 24, 34 + y0, 44, 14, [DRAKE[2], DRAKE[5]], 0.08, 2024);
  // the near wing, swept back over the body (so the neck and head stay in sight)
  const wt = [42, 0 + y0 + flap];
  shape(p, [[58, 36 + y0], wt, [18, 4 + y0 + flap], [14, 20 + y0 + flap * 0.5], [20, 34 + y0], [34, 42 + y0]], MEMBRANE, 13, { flat: 0.45, folds: 0.5 });
  limb(p, 58, 36 + y0, wt[0], wt[1], 3, 1.8, DRAKE, 14);
  for (const [fx, fy] of [[18, 4 + flap], [14, 20 + flap * 0.5], [20, 34]]) limb(p, wt[0], wt[1], fx, fy + y0, 1.3, 0.6, DRAKE, 14);
  for (let t = 0; t < 6; t++) p.px(22 + t * 3.4, 14 + y0 + flap * 0.6 + (t % 3) * 5, MEMBRANE[0], 13.4); // tears in the wing
  for (let x = 46; x <= 64; x += 5) shape(p, [[x, 36 + y0], [x + 2, 31 + y0], [x + 4, 36 + y0]], DRAKE.slice(1), 13.6); // spines along the back
  // the long neck and horned head, in front of everything
  const hx = 82 + (k === 'attack' ? 4 : 0);
  const hy = 22 + y0 + (k === 'windup' ? -6 : k === 'attack' ? 6 : 0);
  limb(p, 60, 42 + y0, 72, 32 + y0, 6.4, 5.4, DRAKE, 14.5);
  limb(p, 72, 32 + y0, hx - 4, hy + 2, 5.4, 4.2, DRAKE, 15);
  for (let t = 0; t < 4; t++) p.hline(64 + t * 4, 67 + t * 4, 40 - t * 3 + y0, BELLY[2], 15.2); // throat plates
  p.ellipse(hx, hy, 8, 6.4, DRAKE, 15.5);
  limb(p, hx + 2, hy + 1, hx + 12, hy + 3, 4.2, 2.4, DRAKE, 15.6); // the snout
  const HORN = ['#3a3226', '#6a5c44', '#a89a78', '#d0c4a0'];
  limb(p, hx - 4, hy - 4, hx - 13, hy - 12, 2.2, 0.7, HORN, 15.8);
  limb(p, hx - 1, hy - 5, hx - 6, hy - 15, 1.8, 0.6, HORN, 15.8);
  glowEye(p, hx + 2, hy - 2, '#ffd040', 16, 2);
  p.px(hx + 11, hy + 1, '#0a0404', 15.9);
  if (fire) {
    shape(p, [[hx + 2, hy + 3], [hx + 13, hy + 4], [hx + 12, hy + 9], [hx + 3, hy + 7]], ['#5a1404', '#a03008'], 15.7, { flat: 0.6 });
    for (let t = 0; t < 6; t++) p.lit(hx + 5 + t, hy + 6 + (t % 2), LAVA[3 + (t % 2)], 15.9, 2);
    if (k === 'attack') for (let t = 0; t < 6; t++) p.lit(hx + 13 + t * 0.8, hy + 4 + t * 1.4, LAVA[2 + (t % 3)], 15, 1.6);
  }
}, '#c06030');

// ===================== THE FORGOTTEN KEEPER =====================
// A guardian statue come alive: mossy stone, a sealed helm, a great stone key for a club.

export const keeperFrame = makeSheet(64, 72, (p, pose) => {
  const k = pose.k;
  const b = pose.bob;
  if (k === 'death') {
    const i = pose.i;
    for (let r = 0; r < 8; r++) p.ellipse(10 + r * 6.5, 66 - (r % 3) * 2 - (2 - i) * 4, 4 + (r % 2), 3.5, KSTONE, 6);
    if (i < 2) p.ellipse(44, 62 - i * 4, 7, 6, KSTONE, 8);
    return;
  }
  const [fl, bl] = stride(pose, 3);
  const y0 = b + (k === 'attack' ? 3 : 0);
  // pillar legs
  limb(p, 24, 46 + y0, 22 + bl, 66, 5, 4.6, KSTONE, 6);
  limb(p, 40, 46 + y0, 42 + fl, 66, 5, 4.6, KSTONE, 6.5);
  for (const fx of [22 + bl, 42 + fl]) p.bevelRect(fx - 6, 64, 13, 7, KSTONE.slice(1), 5, 1);
  // the body: blocks of carved stone, runes glowing faintly blue
  shape(p, [[16, 22 + y0], [48, 22 + y0], [50, 48 + y0], [14, 48 + y0]], KSTONE, 10, { flat: 0.25 });
  for (const yy of [30, 38]) p.hline(15, 49, yy + y0, KSTONE[1], 10.4);
  for (const xx of [26, 38]) p.vline(xx, 22 + y0, 30 + y0, KSTONE[1], 10.4);
  for (const [x, y] of [[22, 34], [32, 26], [42, 42], [28, 44]]) p.lit(x, y + y0, SOUL, 10.6, 0.9);
  spots(p, 14, 20 + y0, 36, 30, MOSSY, 0.06, 818, 2);
  // the far arm
  limb(p, 14, 26 + y0, 10, 44 + y0, 4.4, 4, KSTONE.slice(0, 5), 8);
  // the near arm and the great stone key
  const raise = k === 'windup' ? -26 : k === 'cast' ? -30 : k === 'attack' ? 8 : 0;
  const hx = 52;
  const hy = 40 + y0 + raise * 0.5;
  limb(p, 48, 26 + y0, hx, hy, 4.6, 4, KSTONE, 12);
  const tipX = hx + (k === 'attack' ? 10 : 0);
  const tipY = hy + (k === 'attack' ? 24 : raise < 0 ? -28 : 24);
  limb(p, hx, hy, tipX, tipY, 2.4, 2.4, KSTONE.slice(1), 12.6); // the shaft
  p.ellipse(hx - (tipY < hy ? 0 : 0), hy + (tipY < hy ? 6 : -6), 5, 5, KSTONE, 12.4); // the bow of the key
  p.ellipse(hx, hy + (tipY < hy ? 6 : -6), 2, 2, '#0a0c10', 12.8);
  p.bevelRect(tipX - 1, tipY - (tipY < hy ? 0 : 6), 7, 6, KSTONE.slice(1, 5), 13, 1); // the bit
  p.ellipse(hx, hy, 4, 3.6, KSTONE, 13);
  // the sealed helm: a carved face, eye-slit glowing
  const hy2 = 14 + y0;
  p.ellipse(32, hy2, 9, 9, KSTONE, 13);
  p.hline(25, 39, hy2 - 1, '#04060a', 13.4);
  for (let x = 26; x <= 38; x++) p.lit(x, hy2 - 1, SOUL, 13.6, x % 3 ? 1 : 1.8);
  p.vline(32, hy2 + 1, hy2 + 7, KSTONE[1], 13.4);
  spots(p, 22, hy2 - 9, 20, 10, MOSSY, 0.1, 919);
}, '#6a7a8a');

// ===================== THE HOLLOW CROWN =====================
// The thing that whispered in the King's ear: a floating crown over a void that has a face.

export const crownwraithFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  const b = Math.round(Math.sin(((pose.i || 0) + pose.bob) * 1.4) * 2);
  if (k === 'death') {
    const i = pose.i;
    for (let s = 0; s < 14 - i * 4; s++) p.lit(10 + ((s * 13) % 44), 30 + ((s * 7) % 26) + i * 4, '#c070ff', 3, 0.8);
    for (let x = 24; x <= 40; x++) p.px(x, 58, GOLD[x % 2 ? 1 : 2], 4); // the crown, fallen
    return;
  }
  // tendrils of shadow hanging below
  for (let s = 0; s < 7; s++) {
    const x = 18 + s * 4.6;
    const sway = Math.sin(s * 1.3 + (pose.i || 0)) * 3;
    limb(p, x, 34 + b, x + sway, 58 + (s % 3) * 2, 2.6, 0.5, WRAITH, 4);
  }
  // the void: a hood of nothing with a crowd of faint faces in it
  shape(p, [[14, 22 + b], [50, 22 + b], [54, 40 + b], [32, 50 + b], [10, 40 + b]], WRAITH, 9, { soft: 8 });
  for (const [fx, fy] of [[22, 34], [42, 34], [32, 42]]) {
    p.lit(fx - 1, fy + b, '#6a4aa0', 9.4, 0.6);
    p.lit(fx + 1, fy + b, '#6a4aa0', 9.4, 0.6);
  }
  // the one face that matters: two white eyes, a mouth that is only a line
  const open = k === 'attack' || k === 'cast' || k === 'windup';
  glowEye(p, 26, 30 + b, '#f0e8ff', 10, 2);
  glowEye(p, 36, 30 + b, '#f0e8ff', 10, 2);
  if (open) {
    p.ellipse(32, 38 + b, 5, 2.6, ['#000000', '#140a20'], 9.8);
    for (let x = 28; x <= 36; x += 2) p.lit(x, 38 + b, '#c070ff', 10, 0.8);
  } else p.hline(28, 36, 38 + b, '#000000', 9.8);
  // the crown floats above, too big for any head
  const cy = 14 + b - (open ? 3 : 0);
  shape(p, [[12, cy + 6], [52, cy + 6], [50, cy - 2], [14, cy - 2]], ['#4a3410', '#8a6420', '#c49a38', '#ecd078', '#fff0b0'], 11, { flat: 0.5 });
  for (const [x, h] of [[14, 8], [23, 11], [32, 14], [41, 11], [50, 8]]) {
    shape(p, [[x - 3, cy - 1], [x, cy - 1 - h], [x + 3, cy - 1]], GOLD, 11.4);
    p.lit(x, cy - h + 1, '#c070ff', 11.8, 1.4);
  }
  for (let x = 16; x <= 48; x += 8) p.lit(x, cy + 2, x % 16 ? '#c02634' : '#40a0ff', 11.6, 1.2); // jewels
}, '#8a70c0');
