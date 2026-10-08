// The weapons of the three later heroes: Maud's spears, Agnes's staves and the Nameless's grave
// lanterns. Looks (in the hero's hands, like weaponLooks.js) and 16 x 16 icons. y points DOWN.

import { SHARED as S } from '../../data/palettes.js';
import { limb } from './artKit.js';

const I = S.iron;
const W = S.wood;
const BR = S.brass;
const STEEL = ['#2e2e36', '#4a4a54', '#6e6e7a', '#9a9aa6', '#d0d0da', '#f0f0f8'];

// ---------------------------------------------------------------- holding them
/** A spear's line: held low and level, drawn back on the wind-up, thrust right out on the strike. */
function spearLine(dir, b, pose, len) {
  const t = pose.throwPose;
  let g;
  // (the point always faces the way she's looking: on the wind-up the spear is drawn back, point first)
  if (dir === 'right') g = t === 'wind' ? [3, 17 + b, 20, 17 + b, 7] : t === 'release' ? [20, 17 + b, 34, 17 + b, 7] : [12, 20 + b, 27, 14 + b, 6.4];
  else {
    const x = dir === 'up' ? 21 : 9;
    const h = dir === 'up' ? 3.6 : 7;
    // facing you or away: held upright, point up; the thrust drives it down (toward you) or up
    g = t === 'wind' ? [x, 26 + b, x, 6 + b, h] : t === 'release' ? (dir === 'up' ? [x, 20 + b, x, -2 + b, h] : [x, 14 + b, x, 32, h]) : [x, 29 + b, x, 3 + b, h - 0.6];
  }
  const [gx, gy, tx, ty, h] = g;
  return [gx, gy, gx + (tx - gx) * len, gy + (ty - gy) * len, h];
}

function spearhead(p, gx, gy, tx, ty, h, size, ramp) {
  const l = Math.hypot(tx - gx, ty - gy) || 1;
  const ux = (tx - gx) / l;
  const uy = (ty - gy) / l;
  for (let k = 0; k < size; k++) {
    const w = Math.max(0, (size - k) * 0.45);
    p.line(tx + ux * k - uy * w, ty + uy * k + ux * w, tx + ux * k + uy * w, ty + uy * k - ux * w, ramp[Math.min(ramp.length - 1, 2 + (k % 3))], h + 0.2);
  }
  p.px(tx + ux * size, ty + uy * size, ramp[ramp.length - 1], h + 0.3);
}

/** A staff held upright at the side, its head glowing (or flaring on the cast). */
function staffAt(p, dir, b, pose, head) {
  const t = pose.throwPose;
  const x = dir === 'right' ? (t === 'release' ? 22 : 19) : dir === 'up' ? 22 : 8;
  const h = dir === 'up' ? 3.4 : 7;
  const top = 3 + b - (t === 'wind' ? 2 : 0);
  for (let y = top; y <= 29 + b; y++) p.px(x, y, W[(y % 3) + 1], h);
  head(p, x, top, h, t === 'release' ? 1.6 : 1);
}

/** A lantern hanging from the hand on a short chain, swinging a little. */
function lanternAt(p, dir, b, pose, body) {
  const t = pose.throwPose;
  const x = dir === 'right' ? (t === 'release' ? 25 : 21) : dir === 'up' ? 22 : 9;
  const h = dir === 'up' ? 3.4 : 7;
  const y = 18 + b + (t === 'release' ? -3 : 0);
  p.line(x, y - 4, x, y - 1, I[3], h);
  body(p, x, y, h, t === 'release' ? 1.7 : 1);
}

export const CLASS_LOOKS = {
  // Maud's spears
  spear(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = spearLine(dir, b, pose, 1);
    limb(p, gx, gy, tx, ty, 0.7, 0.6, W.slice(1, 5), h);
    spearhead(p, gx, gy, tx, ty, h, 4, STEEL);
  },
  boarspear(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = spearLine(dir, b, pose, 1);
    limb(p, gx, gy, tx, ty, 0.9, 0.8, W.slice(0, 4), h);
    spearhead(p, gx, gy, tx, ty, h, 5, STEEL);
    // the crossbar that stops a charging boar
    const l = Math.hypot(tx - gx, ty - gy) || 1;
    const nx = -(ty - gy) / l;
    const ny = (tx - gx) / l;
    p.line(tx - nx * 3, ty - ny * 3, tx + nx * 3, ty + ny * 3, I[3], h + 0.3);
  },
  halberd(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = spearLine(dir, b, pose, 1.1);
    limb(p, gx, gy, tx, ty, 0.7, 0.6, W.slice(1, 5), h);
    spearhead(p, gx, gy, tx, ty, h, 3, STEEL);
    // the axe blade just behind the point
    const l = Math.hypot(tx - gx, ty - gy) || 1;
    const ux = (tx - gx) / l;
    const uy = (ty - gy) / l;
    for (let k = 1; k <= 4; k++) p.line(tx - ux * k, ty - uy * k, tx - ux * k - uy * 4, ty - uy * k + ux * 4, STEEL[3 + (k % 2)], h + 0.25);
  },
  // Agnes's staves
  staff: (p, dir, b, pose) =>
    staffAt(p, dir, b, pose, (p, x, y, h, k) => {
      p.ellipse(x, y, 2.2, 2.2, ['#2a4a1a', '#4a7a2a', '#7ab84a'], h + 0.3);
      p.lit(x, y, '#b8ff80', h + 0.5, 1.2 * k);
    }),
  nightshade: (p, dir, b, pose) =>
    staffAt(p, dir, b, pose, (p, x, y, h, k) => {
      for (const [dx, dy] of [[-2, -1], [2, -1], [0, -3], [-1, 1], [1, 1]]) p.px(x + dx, y + dy, '#2a1a3e', h + 0.3); // dark leaves
      p.lit(x, y - 1, '#c070ff', h + 0.5, 1.3 * k);
      p.lit(x, y + 1, '#80ff60', h + 0.4, 0.8 * k);
    }),
  briarstaff: (p, dir, b, pose) =>
    staffAt(p, dir, b, pose, (p, x, y, h, k) => {
      // a crown of thorns twisted round the head
      for (let a = 0; a < 6; a++) p.px(x + Math.round(Math.cos(a) * 3), y + Math.round(Math.sin(a) * 2), '#5a3a18', h + 0.3);
      for (const [dx, dy] of [[-3, -2], [3, -2], [0, -4]]) p.px(x + dx, y + dy, '#e0d0a0', h + 0.35);
      p.lit(x, y, '#a0ff60', h + 0.5, 1.1 * k);
    }),
  // the Nameless's lanterns
  lantern: (p, dir, b, pose) =>
    lanternAt(p, dir, b, pose, (p, x, y, h, k) => {
      p.rect(x - 2, y, 5, 5, '#2a2a30', h);
      p.rect(x - 1, y + 1, 3, 3, '#8ad0ff', h + 0.2);
      p.lit(x, y + 2, '#c8f0ff', h + 0.4, 1.4 * k);
      p.hline(x - 2, x + 2, y - 1, I[3], h + 0.1);
    }),
  chainlantern: (p, dir, b, pose) =>
    lanternAt(p, dir, b, pose, (p, x, y, h, k) => {
      p.rect(x - 2, y, 5, 5, '#2a2a30', h);
      p.rect(x - 1, y + 1, 3, 3, '#a0e0ff', h + 0.2);
      p.lit(x, y + 2, '#e0f8ff', h + 0.4, 1.3 * k);
      for (let i = 0; i < 4; i++) p.px(x - 3 - i, y + 4 + (i % 2), I[2 + (i % 2)], h + 0.1); // a trailing chain
    }),
  deathbell: (p, dir, b, pose) =>
    lanternAt(p, dir, b, pose, (p, x, y, h, k) => {
      // a small dark bell instead of a lantern, its mouth glowing
      for (let i = 0; i < 5; i++) p.hline(x - 1 - Math.floor(i / 2), x + 1 + Math.floor(i / 2), y + i, BR[i < 2 ? 1 : 2], h);
      p.hline(x - 2, x + 2, y + 5, '#c8f0ff', h + 0.3);
      p.lit(x, y + 5, '#c8f0ff', h + 0.4, 1.2 * k);
    }),
};

// ---------------------------------------------------------------- icons
function iconSpear(p, head = 4) {
  p.line(2, 14, 11, 5, W[3], 3);
  p.line(3, 14, 12, 5, W[2], 3);
  for (let k = 0; k < head; k++) p.line(11 + k, 5 - k, 12 + k, 4 - k, STEEL[4 - (k % 2)], 3.4);
  p.px(13, 2, STEEL[5], 3.6);
}
function iconStaff(p, glow, tint) {
  p.line(4, 14, 10, 4, W[3], 3);
  p.ellipse(11, 3.5, 2.4, 2.4, tint, 3.4);
  p.lit(11, 3, glow, 3.6, 1.6);
}
function iconLantern(p, glow) {
  p.line(8, 1, 8, 4, I[3], 3);
  p.bevelRect(5, 5, 7, 8, ['#1a1a20', '#2a2a30', '#3a3a44'], 3, 1);
  p.rect(7, 7, 3, 4, glow, 3.4);
  p.lit(8, 9, '#ffffff', 3.6, 1.2);
}

export const CLASS_ICONS = {
  squire_spear: (p) => iconSpear(p, 4),
  boar_spear(p) {
    iconSpear(p, 5);
    p.line(9, 8, 12, 11, I[3], 3.5);
  },
  halberd(p) {
    iconSpear(p, 3);
    for (let k = 0; k < 4; k++) p.line(9 + k, 7 - k, 12 + k, 10 - k, STEEL[3 + (k % 2)], 3.3);
  },
  apprentice_staff: (p) => iconStaff(p, '#b8ff80', ['#2a4a1a', '#4a7a2a', '#7ab84a']),
  nightshade_staff: (p) => iconStaff(p, '#c070ff', ['#1a0e2a', '#3a1e5a', '#5a2e8a']),
  briar_staff(p) {
    iconStaff(p, '#a0ff60', ['#3a2a10', '#5a3a18', '#7a5426']);
    for (const [x, y] of [[8, 2], [14, 2], [11, 0]]) p.px(x, y, '#e0d0a0', 3.7);
  },
  grave_lantern: (p) => iconLantern(p, '#8ad0ff'),
  cell_chain(p) {
    iconLantern(p, '#a0e0ff');
    for (let i = 0; i < 4; i++) p.px(4 - i, 12 + (i % 2), I[3], 3.5);
  },
  death_bell(p) {
    p.line(8, 1, 8, 3, I[3], 3);
    for (let i = 0; i < 8; i++) p.hline(8 - 1 - Math.floor(i / 2), 8 + 1 + Math.floor(i / 2), 4 + i, BR[i < 3 ? 1 : 2], 3.2);
    p.hline(4, 12, 12, '#c8f0ff', 3.5);
  },
};
