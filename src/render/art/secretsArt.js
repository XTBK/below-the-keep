// Art for special rooms and secrets: the Old God's idol, the chapel altar, puzzle candle stands,
// the order tablet, bookcases, the wishing well, the rug and the sword in the stone.
// (Most of these are drawn with y pointing UP, then flipped.)

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CHAPTERS } from '../../data/palettes.js';

const STONE = CHAPTERS.cells.stone;
const IRON = S.iron;
const W = S.wood;
const GOLD = ['#5a3e10', '#9a7020', '#d0aa40', '#f6dc80'];
const DARK = ['#0e0a10', '#1a1420', '#2a2032', '#3e3048', '#544466'];
const RED = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
const MARBLE = ['#5a5650', '#8a867c', '#b8b4a8', '#e0dcd0', '#f8f6f0'];
const CLOTH = ['#2a1a3a', '#4a2a5a', '#6a3a7a', '#8a5a9a'];

/** The puzzle symbols, as 5 x 5 pixel pictures: circle, triangle, square, cross. */
export const SYMBOLS = [
  ['.###.', '#...#', '#...#', '#...#', '.###.'],
  ['..#..', '.#.#.', '.#.#.', '#...#', '#####'],
  ['#####', '#...#', '#...#', '#...#', '#####'],
  ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
];

function drawSymbol(p, k, x, y, c, h, glow = 0) {
  SYMBOLS[k].forEach((row, j) => {
    for (let i = 0; i < 5; i++) {
      if (row[i] !== '#') continue;
      p.px(x + i, y + j, c, h);
      if (glow) p.glow(x + i, y + j, c, glow);
    }
  });
}

/** The Old God: a squat horned idol of black stone with ember eyes. 32 x 48 */
export function idolFrame() {
  const p = new Painter(32, 48);
  p.bevelRect(4, 0, 24, 8, STONE.slice(1, 6), 3, 1); // plinth
  p.cyl(7, 8, 18, 22, DARK, 6);
  p.ellipse(16, 32, 9, 8, DARK, 8);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 9; i++) p.ellipse(16 + s * (7 + i), 37 + i * 0.9 - (i > 5 ? (i - 5) * 1.6 : 0), 1.8 - i * 0.1, 1.8 - i * 0.1, ['#3a3226', '#6a5a40', '#9a8a68'], 9);
  }
  p.lit(13, 33, '#ff5a20', 9, 1.8);
  p.lit(19, 33, '#ff5a20', 9, 1.8);
  p.hline(12, 20, 28, '#08060a', 8.6); // mouth
  for (let x = 12; x <= 20; x += 2) p.px(x, 27, '#c8b898', 8.8);
  p.lit(16, 14, RED[2], 6.5, 1.1); // a bloody mark on its belly
  p.lit(16, 15, RED[1], 6.5, 1);
  p.outline(S.outline);
  return p.flippedV(); // drawn with y pointing up
}

/** The Chapel altar: white stone, gold cloth, a holy book, two candles. 32 x 32 */
export function chapelAltarFrame() {
  const p = new Painter(32, 32);
  p.bevelRect(2, 2, 28, 14, MARBLE, 4, 1);
  p.rect(4, 12, 24, 5, GOLD[2], 4.5); // cloth
  p.rect(14, 4, 4, 12, GOLD[1], 4.5);
  p.vline(16, 6, 13, '#ffffff', 4.8); // the cross on the cloth
  p.hline(14, 18, 10, '#ffffff', 4.8);
  p.bevelRect(9, 16, 14, 3, ['#4a1a10', '#7a2a1a', '#a84a2a'], 6, 1); // book
  p.hline(10, 21, 18, '#f0e8d0', 6.4);
  for (const x of [5, 26]) {
    p.cyl(x - 1, 16, 3, 8, ['#c8c0a8', '#e8e0c8', '#fffaf0'], 6);
    p.lit(x, 25, S.fire[4], 7, 1.5);
    p.lit(x, 26, S.fire[5], 7, 1.5);
  }
  p.outline(S.outline);
  return p.flippedV(); // drawn with y pointing up
}

/** Puzzle candle stand: frame 0 lit, 1 snuffed. 16 x 32 */
export function puzzleStandFrame(k) {
  const p = new Painter(16, 32);
  p.ellipse(8, 2, 5, 2, IRON.slice(1, 5), 2);
  p.vline(7, 3, 20, IRON[3], 4);
  p.vline(8, 3, 20, IRON[2], 4);
  p.ellipse(8, 21, 5, 1.5, IRON.slice(1, 5), 5);
  p.cyl(6, 22, 5, 5, ['#c8c0a8', '#e8e0c8', '#fffaf0'], 6);
  if (k === 0) {
    p.lit(8, 28, S.fire[3], 7, 1.6);
    p.lit(8, 29, S.fire[4], 7, 1.8);
    p.lit(8, 30, S.fire[5], 7, 1.8);
    p.lit(7, 28, S.fire[3], 7, 1.2);
  } else {
    p.px(8, 27, '#2a2420', 6.5);
    p.px(9, 28, '#5a544c', 6.5); // a wisp of smoke
  }
  p.outline(S.outline);
  return p.flippedV(); // drawn with y pointing up
}

/** The tablet: the order is carved on it at runtime (see Room); this is the blank stone. 32 x 32 */
export function tabletFrame() {
  const p = new Painter(32, 32);
  p.bevelRect(3, 0, 26, 4, STONE.slice(1, 6), 2, 1);
  for (let y = 4; y < 30; y++) {
    const w = y > 26 ? 11 - (y - 26) * 2 : 11;
    for (let x = 16 - w; x <= 16 + w; x++) p.px(x, y, STONE[(x * 3 + y) % 7 === 0 ? 2 : 3], 4);
  }
  for (let x = 6; x <= 26; x++) p.px(x, 29 - (x % 4 === 0 ? 1 : 0), STONE[4], 4.5);
  const rng = new Rng(77);
  for (let i = 0; i < 6; i++) p.px(rng.int(6, 26), rng.int(6, 26), STONE[1], 3.8); // pits in the stone
  p.outline(S.outline);
  return p.flippedV(); // drawn with y pointing up
}

/** A bookcase, crammed. 32 x 44 (frame 0 normal, 1 the same with a slightly loose book) */
export function bookcaseFrame(k) {
  const p = new Painter(32, 44);
  p.bevelRect(1, 0, 30, 44, W.slice(0, 4), 6, 2);
  const rng = new Rng(4242);
  const BOOKS = [RED, ['#1a2a4a', '#2a4a7a', '#4a6aa0'], ['#1a3a1a', '#2a5a2a', '#4a8a3a'], ['#3a2a10', '#6a4a20', '#9a7a40'], CLOTH];
  for (const shelfY of [4, 17, 30]) {
    p.hline(3, 28, shelfY - 1, W[1], 6.5);
    let x = 4;
    while (x < 28) {
      const w = rng.int(2, 3);
      const h = rng.int(8, 11);
      const b = BOOKS[rng.int(0, BOOKS.length - 1)];
      for (let i = 0; i < w && x + i < 28; i++) p.vline(x + i, shelfY, shelfY + h - 1, b[Math.min(b.length - 1, 1 + (i === 0 ? 1 : 0))], 7);
      if (rng.chance(0.4)) p.px(x, shelfY + h - 3, GOLD[2], 7.4);
      x += w + (rng.chance(0.15) ? 1 : 0);
    }
  }
  if (k === 1) {
    p.vline(14, 30, 41, GOLD[2], 8); // one book sticks out a little...
    p.vline(15, 30, 41, GOLD[1], 8);
  }
  p.outline(S.outline);
  return p;
}

/** The wishing well: frame 0 water, 1 dry (its wish granted). 40 x 40 */
export function wellFrame(k) {
  const p = new Painter(40, 40);
  p.ellipse(20, 10, 17, 8, STONE.slice(1, 6), 5);
  for (let a = 0; a < 28; a++) {
    const t = (a / 28) * Math.PI * 2;
    p.px(20 + Math.cos(t) * 15, 12 + Math.sin(t) * 6.5, STONE[(a % 3) + 3], 6);
  }
  p.ellipse(20, 12, 12, 5, k === 0 ? ['#0a1a2a', '#14304a', '#2a5a7a', '#6aa0c0'] : ['#1a140e', '#2a2018', '#3a2e22'], 3, false);
  if (k === 0) {
    p.lit(16, 12, '#8ad0ff', 3.2, 0.6);
    p.lit(23, 13, '#8ad0ff', 3.2, 0.5);
    for (const [x, y] of [[18, 11], [22, 12], [20, 14]]) p.px(x, y, GOLD[3], 3.4); // pennies glinting below
  }
  // posts and roof
  p.rect(5, 12, 3, 20, W[2], 8);
  p.rect(32, 12, 3, 20, W[3], 8);
  for (let y = 30; y < 38; y++) p.hline(3 + (y - 30), 36 - (y - 30), y, W[1 + (y % 2)], 9);
  p.hline(8, 32, 24, W[3], 8.5); // windlass
  p.vline(20, 14, 24, '#a8946a', 8.2); // rope
  p.rect(18, 12, 5, 3, W.slice(1), 8.4); // bucket
  p.outline(S.outline);
  return p.flippedV(); // drawn with y pointing up
}

/** A dusty rug: frame 0 the rug, 1 burnt away (the trapdoor shows). 32 x 32 */
export function rugFrame(k) {
  const p = new Painter(32, 32);
  if (k === 0) {
    for (let y = 3; y < 29; y++) for (let x = 1; x < 31; x++) p.px(x, y, (x + y) % 6 === 0 ? CLOTH[3] : x < 3 || x > 28 || y < 5 || y > 26 ? RED[1] : CLOTH[1 + ((x * y) % 5 === 0 ? 1 : 0)], 0.3);
    for (let x = 2; x < 30; x += 2) {
      p.px(x, 2, GOLD[2], 0.3);
      p.px(x, 29, GOLD[2], 0.3);
    }
    for (let i = 0; i < 4; i++) p.px(16 + Math.cos(i * 1.57) * 5, 16 + Math.sin(i * 1.57) * 5, GOLD[2], 0.35);
    p.px(16, 16, GOLD[3], 0.35);
  } else {
    for (let y = 3; y < 29; y++) for (let x = 1; x < 31; x++) if ((x - 16) ** 2 + (y - 16) ** 2 > 150 && (x * 7 + y * 3) % 5) p.px(x, y, '#1a1210', 0.2);
  }
  return p;
}

/** The sword in the stone: frame 0 the sword is there, 1 the stone is empty. 32 x 40 */
export function swordStoneFrame(k) {
  const p = new Painter(32, 40);
  p.ellipse(16, 8, 14, 9, STONE.slice(0, 6), 8);
  const rng = new Rng(55);
  for (let i = 0; i < 8; i++) p.px(rng.int(5, 27), rng.int(3, 13), CHAPTERS.cells.moss[2], 8.4);
  p.hline(14, 18, 14, '#0a0808', 9); // the slit
  if (k === 0) {
    p.vline(15, 14, 30, IRON[5], 10);
    p.vline(16, 14, 30, IRON[3], 10);
    p.vline(17, 14, 30, IRON[2], 10);
    p.hline(10, 22, 31, GOLD[2], 11); // crossguard
    p.hline(11, 21, 32, GOLD[1], 11);
    p.vline(16, 33, 37, ['#4a2a1a'][0], 11);
    p.ellipse(16, 38, 1.6, 1.4, GOLD, 11.5);
    p.glow(16, 38, GOLD[3], 0.8);
    p.glow(16, 31, GOLD[3], 0.5);
  }
  p.outline(S.outline);
  return p.flippedV(); // drawn with y pointing up
}

export { drawSymbol };
