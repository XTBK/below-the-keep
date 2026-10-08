// Item art: relic icons, pickups, bombs, stones of every size, enemy orbs, shop stands,
// the trapdoor and rock rubble.

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CHAPTERS, CREATURES as C } from '../../data/palettes.js';
import { RELIC_IDS } from '../../data/items.js';
import { RELIC_DRAW2 } from './itemsArt2.js';
import { RELIC_DRAW3, ironHeartIcon } from './itemsArt3.js';
import { RELIC_DRAW4 } from './itemsArt4.js';

const STONE = CHAPTERS.cells.stone;
const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const GLASS = ['#1a2a3a', '#2e4e6a', '#5a8ab0', '#a8d0f0'];

// ---------------------------------------------------------------------------------------------
// Relic icons (16 x 16), in the order of RELIC_IDS
// ---------------------------------------------------------------------------------------------
const RELIC_DRAW = {
  blessed_sling(p) {
    // the Blessed Rune: a disc of pale rood-wood with a glowing cross carved in it
    p.ellipse(8, 8, 6, 6, S.wood.slice(2), 3);
    p.ellipse(8, 8, 4.6, 4.6, ['#a8946a', '#c8b48a', '#e0d0a8'], 3.4);
    p.vline(8, 4, 12, S.brass[3], 3.8);
    p.hline(5, 11, 7, S.brass[3], 3.8);
    p.glow(8, 7, S.brass[3], 0.8);
    p.glow(8, 10, S.brass[3], 0.5);
  },
  rams_horn(p) {
    // a curled horn, spiralling in
    for (let i = 0; i < 40; i++) {
      const t = i / 39;
      const a = t * Math.PI * 2.2;
      const r = 6.5 - t * 4.5;
      const w = 2.6 - t * 1.6;
      p.ellipse(8 + Math.cos(a) * r, 8 + Math.sin(a) * r, w, w, BONE, 3 + t * 2, true);
    }
    for (let i = 0; i < 6; i++) p.dot(4 + i * 2, 13 - (i % 2), BONE[0]); // ridges
  },
  alchemists_eye(p) {
    p.ellipse(7, 8, 5, 5, S.brass, 2);
    p.ellipse(7, 8, 3.4, 3.4, ['#1a4a1a', '#2e8a3a', '#5ad06a', '#b8ffc0'], 3);
    p.px(6, 7, '#ffffff', 3.5);
    p.line(12, 9, 15, 14, S.brass[2], 1); // chain
    p.px(14, 12, S.brass[3], 1);
  },
  plague_mask(p) {
    p.ellipse(6, 7, 5, 5, S.leather, 3);
    for (let i = 0; i < 8; i++) p.vline(9 + i, 7 + Math.floor(i / 2), 9 + Math.floor(i / 3), S.leather[1 + (i < 4 ? 1 : 0)], 4 - i * 0.3); // beak
    p.ellipse(4.5, 6, 1.6, 1.6, ['#2a3a2a', '#6a9a6a', '#c0f0c0'], 4);
    p.ellipse(8, 6, 1.4, 1.4, ['#2a3a2a', '#6a9a6a', '#c0f0c0'], 4);
    p.hline(2, 9, 10, S.leather[0], 3);
  },
  holy_water(p) {
    p.rect(6, 1, 4, 3, S.wood[3], 3); // cork
    p.rect(6, 4, 4, 2, GLASS[1], 2.5); // neck
    p.ellipse(8, 10, 5.5, 5, GLASS, 3);
    p.ellipse(8, 11, 4.5, 3.5, ['#3a6ab0', '#6aa0e0', '#b0d8ff'], 3.4); // water
    p.vline(8, 8, 13, '#ffffff', 3.6); // cross
    p.hline(6, 10, 10, '#ffffff', 3.6);
    p.px(5, 8, '#e0f0ff', 4);
  },
  crown_of_thorns(p) {
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      p.px(8 + Math.cos(a) * 6, 8 + Math.sin(a) * 3.5, S.wood[2 + (i % 3 === 0 ? 1 : 0)], 2);
      if (i % 4 === 0) p.px(8 + Math.cos(a) * 7.5, 8 + Math.sin(a) * 4.5 - 1, S.wood[4], 2.5); // thorns
    }
    p.px(5, 12, '#c02634', 2);
    p.px(5, 13, '#7a1420', 2);
    p.px(11, 12, '#c02634', 2);
  },
  wolf_pelt(p) {
    const F = ['#1e1e22', '#3a3a40', '#5e5e66', '#8a8a92', '#b0b0b8'];
    p.ellipse(8, 9, 6, 5, F, 3);
    p.line(3, 6, 3, 1, F[2], 3); // ears
    p.line(4, 6, 4, 2, F[3], 3);
    p.line(13, 6, 13, 1, F[2], 3);
    p.line(12, 6, 12, 2, F[3], 3);
    p.ellipse(8, 12, 2.5, 2.2, F.slice(2), 4); // snout
    p.px(8, 13, '#0a0a0a', 4.5);
    p.px(5, 8, '#e8c040', 4);
    p.px(11, 8, '#e8c040', 4);
  },
  black_powder(p) {
    p.ellipse(8, 10, 5.5, 4.5, ['#0a0a0c', '#18181c', '#2a2a30', '#3e3e46'], 3);
    p.hline(5, 11, 6, S.leather[2], 3.4); // drawstring
    p.px(4, 5, S.leather[3], 3.4);
    p.px(12, 5, S.leather[3], 3.4);
    for (const [x, y] of [[2, 14], [4, 15], [13, 14], [14, 15], [11, 15]]) p.px(x, y, '#2a2a30', 1);
    p.px(13, 3, S.fire[4], 3);
    p.px(14, 2, S.fire[5], 3);
    p.px(12, 2, S.fire[3], 3);
  },
  hazel_fork(p) {
    const W = S.wood;
    p.line(8, 15, 8, 8, W[3], 2);
    p.line(8, 8, 3, 2, W[3], 2);
    p.line(8, 8, 13, 2, W[4], 2);
    p.line(9, 15, 9, 9, W[2], 2);
    p.ellipse(3, 4, 1.8, 1.2, ['#2e4a1a', '#4a7a2a', '#6aa03a'], 3);
    p.ellipse(13, 5, 1.8, 1.2, ['#2e4a1a', '#4a7a2a', '#6aa03a'], 3);
  },
  tinder_box(p) {
    p.bevelRect(2, 8, 12, 7, S.iron.slice(1, 5), 2, 1);
    p.hline(2, 13, 10, S.iron[1], 2);
    p.px(4, 9, S.iron[5], 2.5);
    p.ellipse(8, 5, 2.4, 3.2, [S.fire[2], S.fire[3], S.fire[4], S.fire[5]], 3); // spark of flame
    p.px(8, 2, S.fire[3], 3);
    p.px(10, 4, S.fire[4], 3);
  },
  jesters_ball(p) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const nx = (x + 0.5 - 8) / 6.5;
        const ny = (y + 0.5 - 8) / 6.5;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const quarter = (x < 8 ? 0 : 1) + (y < 8 ? 0 : 2);
        const base = quarter === 0 || quarter === 3 ? ['#7a1420', '#c02634', '#ee5a5a'] : ['#7a6218', '#d0aa40', '#f0d880'];
        const shade = Math.sqrt(1 - d) * 0.7 + (-nx - ny) * 0.2 + 0.1;
        p.px(x, y, base[Math.max(0, Math.min(2, Math.floor(shade * 3)))], 3 * Math.sqrt(1 - d));
      }
    }
    p.ellipse(8, 2, 1.6, 1.6, S.brass, 4); // bell
  },
  ghost_candle(p) {
    p.cyl(6, 7, 4, 8, ['#4a5a7a', '#7a8ab0', '#b0c0e0', '#e0e8ff'], 3);
    p.px(8, 6, '#1a1a2a', 3.5);
    p.ellipse(8, 3, 1.8, 2.6, ['#4ab0e0', '#8ae0ff', '#e0ffff'], 3.5);
    p.px(5, 1, '#8ae0ff', 2);
    p.px(11, 2, '#8ae0ff', 2);
  },
  millstone(p) {
    p.ellipse(8, 8, 7, 6.5, STONE.slice(2, 7), 3);
    for (let a = 0; a < 6; a++) {
      const t = (a / 6) * Math.PI * 2;
      p.line(8 + Math.cos(t) * 2.5, 8 + Math.sin(t) * 2.5, 8 + Math.cos(t) * 6, 8 + Math.sin(t) * 5.5, STONE[2], 2.4); // grooves
    }
    p.ellipse(8, 8, 1.8, 1.8, '#08080a', 0, false); // hole
  },
  thunder_nail(p) {
    p.rect(3, 2, 7, 2, S.iron[4], 3); // head
    p.vline(6, 4, 14, S.iron[3], 3);
    p.vline(7, 4, 13, S.iron[2], 3);
    p.px(6, 15, S.iron[4], 3);
    const bolt = [[10, 4], [12, 6], [10, 8], [13, 10], [11, 12], [14, 14]];
    for (let i = 0; i < bolt.length - 1; i++) p.line(bolt[i][0], bolt[i][1], bolt[i + 1][0], bolt[i + 1][1], '#a0d8ff', 4);
    p.px(12, 6, '#ffffff', 4.5);
  },
  rosary(p) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      p.ellipse(8 + Math.cos(a) * 5.5, 7 + Math.sin(a) * 4.5, 1.3, 1.3, BONE.slice(1), 3);
    }
    p.vline(8, 11, 15, BONE[2], 3); // little bone cross
    p.hline(6, 10, 13, BONE[2], 3);
  },
};

export function relicIcon(col) {
  const p = new Painter(16, 16);
  const id = RELIC_IDS[col];
  (RELIC_DRAW[id] || RELIC_DRAW2[id] || RELIC_DRAW3[id] || RELIC_DRAW4[id])(p);
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// Pickups (16 x 16): 0 penny, 1 purse, 2 heart, 3 half heart, 4 bomb, 5 key, 6 iron heart
// ---------------------------------------------------------------------------------------------
export function pickupFrame(k) {
  const p = new Painter(16, 16);
  if (k === 6) {
    ironHeartIcon(p);
    p.outline(S.outline);
    return p;
  }
  const H = C.blood.concat(['#c02634', '#ee5a5a']);
  if (k === 0) {
    p.ellipse(8, 9, 4.5, 4, S.silver, 2.5);
    p.vline(8, 7, 11, S.silver[1], 2.6);
    p.hline(6, 10, 9, S.silver[1], 2.6);
    p.px(6, 6, '#ffffff', 3);
  } else if (k === 1) {
    p.ellipse(8, 10, 5.5, 4.5, S.leather, 3);
    p.hline(6, 10, 6, S.leather[1], 3.5);
    p.px(5, 5, S.leather[3], 3.5);
    p.px(11, 5, S.leather[3], 3.5);
    p.px(7, 4, S.silver[3], 4); // coins peeking out
    p.px(9, 4, S.silver[2], 4);
  } else if (k === 2 || k === 3) {
    const shape = ['.##..##.', '########', '########', '.######.', '..####..', '...##...'];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < 8; x++) {
        if (shape[y][x] !== '#') continue;
        if (k === 3 && x >= 4) continue;
        let c = H[4];
        if (y >= 3 || x >= 6) c = H[3];
        if (y <= 1 && x <= 2) c = H[5];
        p.px(x + 4, y + 5, c, 2.5 - y * 0.2);
      }
    }
  } else if (k === 4) {
    p.cyl(4, 7, 8, 7, S.wood.slice(1, 6), 3);
    p.hline(4, 11, 9, S.iron[3], 3.4);
    p.hline(4, 11, 12, S.iron[3], 3.4);
    p.ellipse(8, 7, 4, 1.5, S.wood[2], 3.6, false);
    p.line(8, 6, 10, 3, S.leather[2], 3.5); // fuse
    p.px(10, 2, S.fire[4], 3.5);
  } else {
    p.ellipse(5, 8, 3.2, 3.2, S.iron.slice(2, 6), 2.5);
    p.px(5, 8, '#0a0a0c', 1);
    p.hline(8, 14, 8, S.iron[4], 2.4);
    p.hline(8, 14, 9, S.iron[2], 2.2);
    p.vline(12, 10, 11, S.iron[3], 2.2);
    p.vline(14, 10, 12, S.iron[3], 2.2);
  }
  p.outline(S.outline);
  return p;
}

/** A lit powder keg, 16 x 16: 0 normal, 1 flashing red (it blinks faster as the fuse burns down). */
export function bombLitFrame(k) {
  const p = pickupFrame(4);
  if (k === 1) for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.tint(x, y, '#ff2010', 0.55);
  p.px(10, 1, S.fire[5], 4);
  p.px(11, 2, S.fire[4], 4);
  return p;
}

// ---------------------------------------------------------------------------------------------
// Stones (16 x 16 frames): 0 normal pebble, 1 large, 2 huge (millstone-sized)
// ---------------------------------------------------------------------------------------------
export function stoneFrame(k) {
  const p = new Painter(16, 16);
  const r = [3, 4.6, 6.6][k];
  p.ellipse(8, 8, r, r * 0.9, S.pebble, 3 + k);
  p.px(8 - Math.ceil(r * 0.4), 8 - Math.ceil(r * 0.5), S.pebble[4], 3.5 + k);
  if (k >= 1) {
    p.dot(9, 10, S.pebble[1], 2);
    p.dot(10, 9, S.pebble[1], 2);
  }
  p.outline(S.outline);
  return p;
}

/** Enemy orbs, 12 x 12: 0 plague glob, 1 stone shard, 2 thrown iron key. */
export function orbFrame(k) {
  const p = new Painter(12, 12);
  if (k === 0) {
    p.ellipse(6, 6, 3.6, 3.4, C.goo, 2);
    p.px(5, 5, '#d0ff90', 2.5);
    p.px(9, 9, C.goo[2], 1);
  } else if (k === 1) {
    p.line(3, 8, 6, 3, STONE[4], 2);
    p.line(6, 3, 9, 7, STONE[3], 2);
    p.line(9, 7, 4, 9, STONE[2], 2);
    p.px(5, 6, STONE[5], 2);
    p.px(6, 6, STONE[4], 2);
  } else {
    p.ellipse(3.5, 4, 2.2, 2.2, S.iron.slice(2, 6), 2);
    p.px(3, 4, '#0a0a0c', 1);
    p.line(5, 6, 10, 10, S.iron[4], 2);
    p.px(9, 11, S.iron[3], 2);
  }
  p.outline(S.outline);
  return p;
}

/** A merchant's display stand: a small crate draped with cloth. 32 x 32 */
export function shopStand() {
  const p = new Painter(32, 32);
  p.bevelRect(8, 18, 16, 11, S.wood.slice(1, 6), 3, 1);
  p.hline(8, 23, 22, S.wood[1], 3);
  for (let x = 7; x <= 24; x++) {
    const drop = 3 + (x % 3 === 0 ? 1 : 0);
    for (let y = 17; y < 17 + drop; y++) p.px(x, y, x % 4 === 0 ? '#3a1a3e' : '#4e2654', 4);
  }
  p.hline(7, 24, 17, '#6e3a74', 4.2);
  p.outline(S.outline);
  return p;
}

/** Trapdoor down to the next floor: a hatch thrown open over a dark shaft with a ladder. 48 x 48 */
export function trapdoor() {
  const p = new Painter(48, 48);
  p.bevelRect(6, 10, 36, 30, STONE.slice(2, 7), 2, 2); // stone rim
  p.rect(10, 14, 28, 22, '#030304', -6);
  for (let y = 16; y < 36; y += 4) p.hline(19, 28, y, S.wood[y < 26 ? 2 : 1], -4 + (36 - y) * 0.1); // ladder rungs
  p.vline(18, 14, 35, S.wood[2], -3);
  p.vline(29, 14, 35, S.wood[2], -3);
  for (let y = 14; y < 22; y++) for (let x = 10; x < 38; x++) p.tint(x, y, '#000000', 0.4); // depth
  // the open hatch lying back against the floor
  p.bevelRect(8, 1, 32, 10, S.wood.slice(1, 6), 3, 1);
  for (let x = 12; x < 40; x += 6) p.vline(x, 2, 9, S.wood[1], 3);
  p.hline(9, 38, 4, S.iron[3], 3.4);
  p.hline(9, 38, 8, S.iron[3], 3.4);
  p.ellipse(24, 6, 2, 2, S.iron.slice(2, 6), 4); // ring handle
  p.outline(S.outline);
  return p;
}

/** What's left of a rock after a bomb: scattered chunks. 32 x 32 */
export function rockRubble() {
  const p = new Painter(32, 32);
  const rng = new Rng(6161);
  for (let i = 0; i < 9; i++) p.ellipse(rng.int(7, 25), rng.int(18, 28), rng.float(1.5, 3.5), rng.float(1.2, 2.4), STONE.slice(1, 6), 2);
  for (let i = 0; i < 10; i++) p.px(rng.int(5, 27), rng.int(16, 30), STONE[rng.int(1, 4)], 0.5);
  p.outline(S.outline);
  return p;
}
