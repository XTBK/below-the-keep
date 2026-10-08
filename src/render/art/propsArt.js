// Props and effect sprites. Each returns a Painter (or is used through buildSheet for animations).

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CHAPTERS } from '../../data/palettes.js';

const STONE = CHAPTERS.cells.stone;
const MOSS = CHAPTERS.cells.moss;

/** Barrel, 32x32, seen from the 3/4 view: lid on top, staves, two iron hoops with rivets. */
export function barrel() {
  const p = new Painter(32, 32);
  const L = 7;
  const W = 18;
  // body (staves) - a cylinder that bulges slightly in the middle
  for (let y = 9; y <= 29; y++) {
    const bulge = y > 12 && y < 26 ? 1 : 0;
    p.cyl(L - bulge, y, W + bulge * 2, 1, S.wood.slice(1, 6), 6);
  }
  // stave seams
  for (const sx of [11, 15, 19, 23]) {
    for (let y = 10; y <= 28; y++) p.tint(sx, y, S.wood[0], 0.55);
  }
  // hoops
  for (const hy of [12, 24]) {
    for (let y = hy; y < hy + 2; y++) p.cyl(L - 1, y, W + 2, 1, S.iron.slice(1, 6), 6.6);
    p.px(L + 2, hy, S.iron[5], 7);
    p.px(L + 9, hy, S.iron[5], 7);
    p.px(L + 16, hy, S.iron[4], 7);
  }
  // lid: ellipse seen from above-front, with planks and a dark rim
  p.ellipse(16, 9, 9.5, 4, S.wood[1], 7, false);
  p.ellipse(16, 9, 8, 3, S.wood.slice(2, 5), 7.4, false);
  p.hline(10, 22, 8, S.wood[2], 7.2);
  p.hline(9, 23, 10, S.wood[2], 7.2);
  p.px(13, 7, S.wood[5], 7.5);
  p.px(18, 9, S.wood[4], 7.5);
  // grime at the base
  for (let x = L; x < L + W; x++) {
    p.tint(x, 29, '#0a0806', 0.5);
    p.tint(x, 28, '#0a0806', 0.25);
  }
  p.outline(S.outline);
  return p;
}

/** Remains of a smashed barrel: splayed staves and a bent hoop. Walk-through decoration. */
export function barrelBroken() {
  const p = new Painter(32, 32);
  const rng = new Rng(5150);
  // bent hoop lying on the floor
  for (let a = 0; a < 48; a++) {
    const t = (a / 48) * Math.PI * 2;
    const r = 10 + Math.sin(t * 3) * 1.2;
    if (a > 34 && a < 42) continue; // snapped
    p.px(16 + Math.cos(t) * r, 22 + Math.sin(t) * r * 0.45, S.iron[a % 3 === 0 ? 4 : 3], 1.5);
  }
  // staves
  const staves = [
    [5, 20, 13, 17],
    [8, 26, 16, 24],
    [17, 18, 27, 21],
    [19, 26, 26, 23],
    [12, 21, 13, 27],
  ];
  for (const [x0, y0, x1, y1] of staves) {
    p.line(x0, y0, x1, y1, S.wood[3], 2);
    p.line(x0, y0 + 1, x1, y1 + 1, S.wood[2], 1.5);
    p.px(x0, y0, S.wood[5], 2);
  }
  for (let i = 0; i < 8; i++) p.px(rng.int(6, 26), rng.int(16, 28), S.wood[rng.int(2, 4)], 1);
  p.outline(S.outline);
  return p;
}

/** Armoury pedestal: a carved stone plinth (relics will rest on it in Phase 4). */
export function pedestal() {
  const p = new Painter(32, 32);
  p.bevelRect(6, 22, 20, 8, STONE.slice(2, 7), 3, 1); // base
  p.cyl(9, 12, 14, 11, STONE.slice(1, 7), 5); // column
  p.ellipse(16, 11, 9, 3.5, STONE.slice(2, 7), 7, false); // top slab
  p.ellipse(16, 10.5, 6, 2, STONE[5], 7.4, false);
  p.hline(9, 22, 16, STONE[1], 5); // carved band
  p.px(12, 16, S.brass[2], 5.5);
  p.px(16, 16, S.brass[3], 5.5);
  p.px(20, 16, S.brass[2], 5.5);
  p.outline(S.outline);
  return p;
}

/** Merchant's table: a trestle table under a cloth, with a lantern, scales and a coin purse. */
export function merchantTable() {
  const p = new Painter(32, 32);
  p.line(6, 20, 5, 29, S.wood[2], 2);
  p.line(26, 20, 27, 29, S.wood[2], 2);
  p.bevelRect(3, 13, 26, 8, S.wood.slice(1, 6), 4, 1); // top
  // cloth hanging over the front
  for (let x = 4; x < 28; x++) {
    const drop = 3 + ((x * 7) % 3 === 0 ? 1 : 0);
    for (let y = 18; y < 18 + drop; y++) p.px(x, y, x % 4 === 0 ? '#3a1a3e' : '#4e2654', 4);
  }
  // coin purse
  p.ellipse(10, 12, 3, 2.5, S.leather.slice(1, 4), 6);
  p.px(10, 9, S.leather[0], 6);
  // scales
  p.vline(21, 5, 12, S.brass[2], 6);
  p.hline(17, 25, 5, S.brass[3], 6.5);
  p.hline(16, 18, 9, S.brass[2], 6);
  p.hline(24, 26, 8, S.brass[2], 6);
  // a few silver pennies
  p.px(14, 13, S.silver[3], 5.5);
  p.px(15, 14, S.silver[2], 5.5);
  p.outline(S.outline);
  return p;
}

/** Iron brazier on three legs, bowl full of glowing coals (the flame is a separate sprite). */
export function brazier() {
  const p = new Painter(32, 32);
  // legs
  p.line(9, 18, 6, 30, S.iron[2], 3);
  p.line(23, 18, 26, 30, S.iron[2], 3);
  p.line(16, 19, 16, 30, S.iron[3], 3);
  p.px(6, 30, S.iron[3], 3);
  p.px(26, 30, S.iron[3], 3);
  // bowl
  p.ellipse(16, 15, 11, 5.5, S.iron.slice(1, 5), 7);
  p.hline(6, 26, 15, S.iron[4], 7.5);
  for (const rx of [8, 13, 19, 24]) p.px(rx, 17, S.iron[5], 7.5);
  // coals
  p.ellipse(16, 13, 8.5, 2.6, '#1a0e08', 7.8, false);
  const rng = new Rng(7070);
  for (let i = 0; i < 26; i++) {
    const x = rng.int(9, 23);
    const y = rng.int(11, 14);
    p.dot(x, y, rng.pick([S.fire[0], S.fire[1], S.fire[2], '#2a1a12']), 8.2);
  }
  p.outline(S.outline);
  return p;
}

/** Cluster of three candles on a little puddle of wax (flames are separate sprites). */
export function candles() {
  const p = new Painter(32, 32);
  // each candle stands apart in its own little pool of melted wax
  const sticks = [
    [7, 16, 3, 27],
    [14, 9, 4, 25],
    [23, 19, 3, 28],
  ];
  for (const [x, top, w, base] of sticks) {
    p.ellipse(x + w / 2, base, w / 2 + 2, 1.6, S.wax[1], 0.8, false);
    p.cyl(x, top, w, base - top, S.wax, 4);
    p.px(x, top + 2, S.wax[3], 4); // drips running down
    p.vline(x + w - 1, top + 1, top + 5, S.wax[1], 4);
    p.hline(x, x + w - 1, top, S.wax[2], 4.2); // melted rim
    p.px(x + 1, top - 1, '#1a120c', 4.5); // wick
  }
  p.outline(S.outline);
  return p;
}

// Wick positions (in the 32x32 sprite) where flames sit, used by the room builder.
export const CANDLE_FLAMES = [
  [8, 16],
  [15, 9],
  [24, 19],
];

/** Flame animation: 4 frames, w x h. Drawn as nested teardrops (dark red rim -> white core). */
export function flameFrame(frame, w, h, F = S.fire) {
  const p = new Painter(w, h);
  const rng = new Rng(9000 + frame * 13 + w);
  const cx = w / 2;
  const sway = [0, 1, 0, -1][frame];
  const layers = [
    [F[1], 1.0],
    [F[2], 0.78],
    [F[3], 0.58],
    [F[4], 0.4],
    [F[5], 0.24],
  ];
  for (const [c, scale] of layers) {
    const baseR = (w / 2) * scale;
    const top = h * (1 - scale * (0.9 + 0.1 * Math.sin(frame * 1.7)));
    for (let y = Math.floor(top); y < h; y++) {
      const t = (y - top) / (h - top); // 0 at tip, 1 at base
      const r = baseR * Math.sqrt(Math.max(0, t)) * (t > 0.8 ? 1 - (t - 0.8) * 1.5 : 1);
      const x0 = cx + sway * (1 - t) - r;
      const x1 = cx + sway * (1 - t) + r;
      for (let x = Math.floor(x0); x < Math.ceil(x1); x++) p.px(x, y, c, 0);
    }
  }
  // detached licks of flame on some frames
  if (frame % 2 === 0) p.px(cx + sway - 1, 0, F[2], 0);
  if (rng.chance(0.6)) p.px(cx + rng.int(-1, 1), 1, F[3], 0);
  return p;
}

/** The sling stone: a smooth river pebble. 8x8. */
export function slingStone() {
  const p = new Painter(8, 8);
  p.ellipse(4, 4, 3, 2.7, S.pebble, 3);
  p.px(3, 2, S.pebble[4], 3);
  p.outline(S.outline);
  return p;
}

/** Blob shadow sheet: 4 sizes, 32x12 frames, stepped (dithered-looking) alpha. Colour is black. */
export function shadowFrame(size) {
  const p = new Painter(32, 12);
  const sizes = [
    [4, 1.5],
    [7, 2.5],
    [11, 4],
    [15, 5],
  ];
  const [rx, ry] = sizes[size];
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 32; x++) {
      const nx = (x + 0.5 - 16) / rx;
      const ny = (y + 0.5 - 6) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      p.px(x, y, '#000000', 0, d < 0.45 ? 150 : 95);
    }
  }
  return p;
}
