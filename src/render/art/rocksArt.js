// The blocking "rocks" of each chapter: three variants each, all things that belong in that place -
// never a plain boulder. 32 x 32, y points DOWN. Each is (p, P, rng) with P the chapter palette.

import { SHARED } from '../../data/palettes.js';
import { limb, shape, spots } from './artKit.js';

const IRON = SHARED.iron;
const WOOD = SHARED.wood;

// ---------------------------------------------------------------- THE CELLS
const CELLS = [
  // a fallen block of cut masonry, an iron ring still bolted to it
  (p, P, rng) => {
    const S = P.stone.slice(1, 7);
    shape(p, [[5, 12], [25, 9], [28, 13], [28, 27], [7, 29], [4, 25]], S, 8, { flat: 0.35, soft: 3 });
    p.hline(6, 26, 13, P.stone[6], 8.6); // the cut top edge catches the light
    p.line(9, 18, 22, 16, P.mortar[0], 8.2); // a chisel line
    p.line(16, 21, 19, 27, P.stone[1], 8.2); // a crack
    p.line(19, 27, 17, 29, P.stone[1], 8.2);
    for (let a = 0; a < 12; a++) p.px(21 + Math.cos(a * 0.52) * 3, 22 + Math.sin(a * 0.52) * 3, IRON[a % 3 ? 3 : 5], 9);
    p.px(21, 19, IRON[2], 9.2); // the bolt
    spots(p, 4, 9, 25, 21, P.moss || P.stone[2], 0.04, rng.int(1, 999));
  },
  // a broken pillar drum lying on its side, fluted
  (p, P, rng) => {
    const S = P.stone.slice(1, 7);
    limb(p, 5, 20, 26, 18, 8, 8, S, 8);
    p.ellipse(26, 18, 4, 8, P.stone.slice(2, 7), 9); // the broken end, rough
    for (let i = 0; i < 6; i++) p.px(25 + rng.int(-2, 2), 12 + i * 2, P.stone[1], 9.2);
    for (const y of [14, 18, 22]) p.line(6, y + 1, 23, y - 1, P.stone[2], 8.4); // the flutes
    p.ellipse(8, 27, 3, 1.6, P.stone.slice(1, 4), 4); // a chip that broke off
  },
  // the stocks: an old pillory, iron-strapped, dragged here and abandoned
  (p, P) => {
    shape(p, [[4, 14], [28, 12], [29, 22], [5, 24]], WOOD, 7, { flat: 0.4, folds: 0.9 });
    for (const x of [10, 22]) p.ellipse(x, 18, 2.6, 2.4, ['#0a0806', '#140e0a'], 6.6); // the holes for wrists
    p.line(16, 12, 16, 23, WOOD[0], 7.4); // the split between the boards
    for (const x of [6, 26]) {
      p.vline(x, 13, 23, IRON[2], 7.6);
      p.px(x, 15, IRON[5], 7.8);
      p.px(x, 21, IRON[5], 7.8);
    }
    limb(p, 9, 24, 8, 30, 1.6, 1.4, WOOD, 4);
    limb(p, 23, 23, 24, 30, 1.6, 1.4, WOOD, 4);
  },
];

// ---------------------------------------------------------------- THE CATACOMBS
function skull(p, cx, cy, B, h) {
  p.ellipse(cx, cy, 3.2, 3, B, h);
  p.px(cx - 1, cy, '#0e0a06', h + 0.2);
  p.px(cx + 1, cy, '#0e0a06', h + 0.2);
  p.hline(cx - 1, cx + 1, cy + 2, B[1], h);
}
const CATA = [
  // a mound of skulls
  (p, P, rng) => {
    p.ellipse(16, 22, 13, 7, P.stone.slice(0, 4), 3);
    for (const [x, y] of [[9, 22], [16, 23], [23, 22], [12, 17], [20, 17], [16, 12]]) skull(p, x + rng.int(-1, 1), y, P.bone, 6 + (24 - y) * 0.3);
  },
  // a cracked sarcophagus lid, a stone face carved on it
  (p, P) => {
    const S = P.stone.slice(1, 7);
    shape(p, [[8, 6], [24, 6], [27, 12], [25, 29], [7, 29], [5, 12]], S, 7, { flat: 0.4, soft: 3 });
    p.ellipse(16, 12, 4, 4.4, P.bone.slice(0, 4), 8); // the carved face
    p.hline(14, 15, 11, P.stone[1], 8.4);
    p.hline(17, 18, 11, P.stone[1], 8.4);
    p.hline(15, 17, 14, P.stone[1], 8.4);
    p.line(10, 18, 22, 18, P.stone[2], 7.4); // the folded hands
    p.line(13, 20, 19, 20, P.stone[2], 7.4);
    p.line(18, 22, 13, 28, P.stone[0], 7.6); // a crack across it
  },
  // a gravestone, fallen and leaning
  (p, P) => {
    const S = P.stone.slice(1, 7);
    shape(p, [[9, 10], [13, 5], [19, 4], [24, 8], [26, 26], [10, 28]], S, 8, { flat: 0.3, soft: 3 });
    p.vline(17, 9, 15, P.stone[1], 8.6); // a carved cross
    p.hline(14, 20, 11, P.stone[1], 8.6);
    for (let x = 12; x <= 23; x += 3) p.px(x, 19 + (x % 2), P.stone[1], 8.4); // weathered letters
    p.ellipse(16, 29, 10, 2.4, P.stone.slice(0, 3), 2);
  },
];

// ---------------------------------------------------------------- THE HOLLOW
function mushroomCap(p, x, y, r, ramp, h) {
  p.ellipse(x, y, r, r * 0.6, ramp, h);
  p.hline(Math.round(x - r + 1), Math.round(x + r - 1), Math.round(y + r * 0.5), '#2a2018', h - 0.3);
}
const HOLLOW = [
  // a mossy stump with shelf fungus
  (p, P, rng) => {
    p.cyl(8, 10, 16, 18, P.bark, 7);
    p.ellipse(16, 10, 8, 3.5, ['#3a2a1e', '#5a4430', '#7c6244'], 8, false);
    p.ellipse(16, 10, 4, 1.5, '#4a3626', 8.2, false);
    for (let i = 0; i < 20; i++) p.dot(rng.int(8, 23), rng.int(14, 27), rng.pick(P.moss), 7.5);
    p.cyl(4, 25, 4, 3, P.bark, 4);
    p.cyl(24, 25, 4, 3, P.bark, 4);
    p.lit(24, 16, P.glowTeal[2], 7.8, 1);
  },
  // a knot of great roots breaking up through the earth
  (p, P) => {
    limb(p, 2, 24, 14, 12, 4, 3, P.bark, 6);
    limb(p, 14, 12, 28, 20, 3.4, 3, P.bark, 7);
    limb(p, 8, 28, 22, 14, 3.6, 2.6, P.bark, 8);
    limb(p, 22, 14, 30, 8, 2.6, 1.2, P.bark, 7.5);
    for (const [x, y] of [[12, 16], [20, 18], [16, 22]]) p.px(x, y, P.moss[3], 8.4);
    p.lit(18, 14, P.glowPurple[3], 8.6, 0.8);
  },
  // a cluster of giant toadstools, softly glowing
  (p, P) => {
    limb(p, 11, 28, 11, 14, 2.2, 1.8, ['#8a8068', '#b8ac8e', '#ddd2b4'], 6);
    limb(p, 21, 28, 22, 18, 2, 1.6, ['#8a8068', '#b8ac8e', '#ddd2b4'], 6);
    mushroomCap(p, 11, 12, 8, P.glowPurple.slice(0, 3).concat(['#c070e0']), 9);
    mushroomCap(p, 22, 17, 6, P.glowTeal.slice(0, 3).concat(['#80f0d8']), 8);
    for (const [x, y] of [[8, 10], [13, 9], [20, 15], [24, 16]]) p.lit(x, y, '#f0e8ff', 9.4, 0.5);
    p.ellipse(16, 29, 10, 2, P.moss.slice(0, 3), 2);
  },
];

// ---------------------------------------------------------------- THE BURNING HALLS
const HALLS = [
  // a toppled statue's head, still crowned
  (p, P) => {
    p.ellipse(16, 20, 11, 9, P.marbleA.concat(P.marbleB.slice(3)), 7);
    p.px(12, 18, '#0a0806', 7.5);
    p.px(19, 18, '#0a0806', 7.5);
    p.hline(13, 18, 23, P.marbleA[0], 7);
    for (const x of [8, 12, 16, 20, 24]) p.vline(x, 9, 12, P.gold[2], 8.5);
    p.hline(8, 24, 12, P.gold[2], 8.5);
    p.hline(8, 24, 13, P.gold[1], 8.3);
  },
  // a fallen column section with a gold band, scorched
  (p, P) => {
    limb(p, 4, 22, 27, 16, 7, 7, P.marbleA, 8);
    p.ellipse(27, 16, 3.4, 7, P.marbleB, 9);
    for (let i = -6; i <= 6; i++) p.px(15 + i * 0.1, 19 + i, P.gold[2], 8.8); // the gold band
    for (let i = -6; i <= 6; i++) p.px(16 + i * 0.1, 19 + i, P.gold[1], 8.8);
    for (let i = 0; i < 8; i++) p.px(6 + i * 2, 23 + (i % 2), '#1a1010', 8.2); // soot
  },
  // a great urn of beaten gold, dented, spilling ash
  (p, P) => {
    p.ellipse(16, 19, 9, 10, P.gold, 8);
    p.ellipse(16, 9, 6, 2, P.gold.slice(0, 3), 8.6); // the neck
    p.ellipse(16, 8, 4, 1.2, '#0a0806', 8.8);
    for (const y of [15, 22]) p.hline(8, 24, y, P.gold[0], 8.4);
    p.ellipse(11, 18, 2, 3, P.gold[0], 8.6); // a dent
    p.ellipse(25, 28, 5, 2, ['#2a2422', '#3a3230', '#4e4440'], 2); // spilled ash
  },
];

export const ROCKS = { cells: CELLS, catacombs: CATA, hollow: HOLLOW, halls: HALLS };
