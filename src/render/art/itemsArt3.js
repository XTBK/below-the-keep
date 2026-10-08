// Art for the third chest of relics, the companions, chests, the iron heart, the Gambler's Den
// and the war banner. y points DOWN.

import { Painter } from '../Painter.js';
import { SHARED as S, CHAPTERS, CREATURES as C } from '../../data/palettes.js';

const GOLD = ['#5a3e10', '#9a7020', '#d0aa40', '#f6dc80'];
const IRON = S.iron;
const W = S.wood;
const L = S.leather;
const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const RED = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
const ICE = ['#1a3a5a', '#3a6a9a', '#7ab0e0', '#c8ecff'];
const PAPER = ['#6a5a3a', '#a8946a', '#d8c8a0', '#f4ead0'];
const OWL = ['#3a2a1a', '#6a4e30', '#9a7a52', '#d0b890', '#f0e8d8'];
const BLACKF = ['#0a0a10', '#1a1a24', '#2e2e3a', '#4a4a5a'];
const MOTH = ['#2a2418', '#4a4030', '#7a6a4c', '#a8946c', '#d8c8a0'];

function rect(p, x, y, w, h, c, ht) {
  if (Array.isArray(c)) p.bevelRect(x, y, w, h, c, ht, 1);
  else p.rect(x, y, w, h, c, ht);
}
function ring(p, cx, cy, rx, ry, c, h, n = 24) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.px(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, c, h);
  }
}

// ---------------------------------------------------------------------------------------------
// Relic icons (16 x 16)
// ---------------------------------------------------------------------------------------------
function owlIcon(p, f = 0) {
  p.ellipse(8, 10, 5, 5.5, OWL, 3);
  p.ellipse(8, 5, 4.5, 4, OWL, 3.6);
  p.ellipse(8, 5, 3.4, 3, ['#d8d0c0', '#f0e8d8', '#ffffff'], 3.8); // the heart-shaped face
  p.px(6, 5, '#0a0a0a', 4);
  p.px(10, 5, '#0a0a0a', 4);
  p.px(8, 6, GOLD[2], 4);
  if (f) {
    p.line(3, 9, 0, 6, OWL[2], 3); // wings up
    p.line(13, 9, 16, 6, OWL[2], 3);
  } else {
    p.ellipse(4, 10, 1.5, 3.5, OWL.slice(1), 3.2);
    p.ellipse(12, 10, 1.5, 3.5, OWL.slice(1), 3.2);
  }
}
function pageIcon(p, f = 0) {
  const G = ['#2a3a4a', '#4a6a80', '#8ab0c8', '#d0ecff'];
  p.ellipse(8, 11 + f, 4, 4.5, G, 3);
  p.ellipse(8, 5 + f, 3, 3.2, G, 3.6);
  p.lit(7, 5 + f, '#ffffff', 3.8, 1);
  p.lit(9, 5 + f, '#ffffff', 3.8, 1);
  p.rect(5, 9 + f, 6, 2, '#c02634', 3.4); // a tabard of his old knight
  for (let i = 0; i < 4; i++) p.glow(6 + i, 14 + f, G[2], 0.6);
}
function mothIcon(p, f = 0) {
  for (const s of [-1, 1]) p.ellipse(8 + s * 4, 8 - f, 3.6, 3 + f, MOTH, 3);
  for (const s of [-1, 1]) p.px(8 + s * 4, 8 - f, IRON[5], 3.4); // blade-edged wings
  p.ellipse(8, 9, 1.4, 4, MOTH, 4);
  p.lit(7, 5, '#ffd060', 4.4, 1);
  p.lit(9, 5, '#ffd060', 4.4, 1);
}
function ravenIcon(p, f = 0) {
  p.ellipse(8, 9, 4.5, 3.5, BLACKF, 3);
  p.ellipse(11, 6, 2.6, 2.4, BLACKF, 3.6);
  p.line(13, 6, 15, 7, GOLD[1], 3.8);
  p.px(11, 5, '#ff4040', 4);
  p.line(4, 9, f ? 1 : 2, f ? 4 : 11, BLACKF[2], 3);
  p.line(5, 8, f ? 3 : 4, f ? 3 : 12, BLACKF[3], 3.2);
}
function squireIcon(p, f = 0) {
  p.cyl(6, 9, 4, 6, S.tunic, 3);
  p.ellipse(8, 5, 3, 3, S.skin, 4);
  p.ellipse(8, 3, 3.4, 1.8, IRON.slice(2, 6), 4.4); // a too-big helm
  p.px(7, 5, S.eye, 4.4);
  p.px(9, 5, S.eye, 4.4);
  p.line(11, 9, 14, 6 - f, IRON[5], 4); // a little wooden sword
  p.line(11, 10, 13, 10, W[3], 4);
}

export const RELIC_DRAW3 = {
  barn_owl: (p) => owlIcon(p),
  spectral_page: (p) => pageIcon(p),
  moth_guardian: (p) => mothIcon(p),
  pet_raven: (p) => ravenIcon(p),
  little_squire: (p) => squireIcon(p),
  boomerang_sling(p) {
    for (let i = 0; i < 14; i++) {
      const a = Math.PI * (0.1 + (i / 13) * 0.8);
      p.ellipse(8 + Math.cos(a) * 6, 13 - Math.sin(a) * 9, 1.3, 1.3, W.slice(2), 3);
    }
    p.line(2, 4, 4, 2, '#e0d0b0', 2.5); // a curved arrow
    p.line(4, 2, 4, 5, '#e0d0b0', 2.5);
  },
  frost_shard(p) {
    for (let y = 1; y < 15; y++) {
      const w = Math.max(0, 4 - Math.abs(y - 7) * 0.55);
      for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) p.px(x, y, ICE[(x + y) % 3 === 0 ? 3 : (x < 8 ? 2 : 1)], 3);
    }
    p.glow(8, 7, ICE[3], 1.2);
    p.px(7, 4, '#ffffff', 3.6);
  },
  lodestone(p) {
    p.ellipse(8, 9, 5.5, 5, IRON.slice(1, 6), 3);
    for (let x = 0; x < 16; x++) p.px(x, 3 + Math.round(Math.sin(x * 0.8) * 2), '#a0d0ff', 3.6); // a wave of force
    p.glow(8, 3, '#a0d0ff', 0.6);
  },
  midas_coin(p) {
    p.ellipse(8, 8, 6, 6, GOLD, 3);
    ring(p, 8, 8, 4.5, 4.5, GOLD[1], 3.3);
    p.vline(8, 5, 11, GOLD[3], 3.5); // a crown stamped on it
    p.hline(6, 10, 6, GOLD[3], 3.5);
    p.glow(8, 8, GOLD[3], 0.8);
  },
  siege_crossbow(p) {
    p.line(2, 8, 14, 8, W[3], 3); // stock
    p.line(11, 2, 11, 14, W[4], 3.2); // the bow
    p.line(11, 2, 6, 8, '#d8d0b0', 3.4); // the drawn string
    p.line(11, 14, 6, 8, '#d8d0b0', 3.4);
    p.line(6, 8, 15, 8, IRON[5], 3.6); // the bolt
  },
  ballista_bolt(p) {
    p.line(1, 14, 13, 2, W[4], 3);
    p.line(2, 14, 14, 2, W[3], 3);
    p.ellipse(14, 2, 2, 2, IRON.slice(2, 6), 3.5);
    p.line(1, 12, 3, 15, '#c8c0a0', 3); // fletching
  },
  wraith_shroud(p) {
    const G = ['#1a2028', '#3a4652', '#6a7a88', '#a8bcc8'];
    for (let y = 2; y < 15; y++) {
      const w = 3 + (y - 2) * 0.35 + Math.sin(y) * 0.5;
      for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) p.px(x, y, G[1 + ((x + y) % 4 === 0 ? 1 : 0)], 3);
    }
    p.lit(6, 6, '#c0f0ff', 3.6, 1.4);
    p.lit(10, 6, '#c0f0ff', 3.6, 1.4);
    p.ellipse(8, 9, 1.2, 1.8, ['#05080a'], 3.4, false);
  },
  saints_shroud(p) {
    for (let y = 2; y < 15; y++) {
      const w = 2.5 + (y - 2) * 0.4;
      for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) p.px(x, y, PAPER[2 + ((x + y) % 5 === 0 ? 1 : 0)], 3);
    }
    ring(p, 8, 2, 4, 1.5, GOLD[3], 3.6, 16); // halo
    p.glow(8, 2, GOLD[3], 0.8);
    p.vline(8, 6, 11, GOLD[2], 3.4);
    p.hline(6, 10, 8, GOLD[2], 3.4);
  },
  martyrs_chain(p) {
    for (let i = 0; i < 6; i++) ring(p, 3 + i * 2, 3 + i * 2, 2, 1.4, IRON[i % 2 ? 4 : 3], 3, 10);
    p.px(14, 14, RED[2], 3.4);
    p.px(13, 15, RED[1], 3.4);
  },
  bottomless_purse(p) {
    p.ellipse(8, 10, 5.5, 4.5, L, 3);
    p.ellipse(8, 6, 3, 1.4, ['#050404'], 3.2, false); // the mouth of the purse goes on forever
    p.hline(5, 11, 7, GOLD[2], 3.4);
    for (const [x, y] of [[5, 2], [8, 1], [11, 3]]) p.ellipse(x, y, 1.4, 1.2, GOLD, 3.6);
  },
  dead_mans_hand(p) {
    for (let i = 0; i < 4; i++) {
      const x = 2 + i * 3;
      rect(p, x, 3 + Math.abs(i - 1.5), 6, 9, PAPER.slice(1), 2 + i * 0.2);
      p.px(x + 2, 6 + Math.abs(i - 1.5), i % 2 ? RED[2] : '#0a0a0a', 2.4 + i * 0.2);
    }
  },
  wyrm_scale(p) {
    for (let y = 2; y < 15; y++) {
      const w = 5 - Math.max(0, y - 9) * 0.8;
      for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) p.px(x, y, ['#2a0806', '#5a1e10', '#8a3418', '#b84a24'][(x + y) % 4 === 0 ? 3 : y < 6 ? 2 : 1], 3 - Math.abs(x - 8) * 0.2);
    }
    for (let y = 4; y < 13; y += 3) p.hline(5, 11, y, '#2a0806', 3.1);
  },
  merchants_seal(p) {
    p.ellipse(8, 9, 6, 5.5, RED, 3); // a wax seal
    ring(p, 8, 9, 4, 3.6, RED[3], 3.3);
    p.ellipse(8, 9, 1.8, 1.8, GOLD, 3.6);
    p.line(8, 2, 11, 4, '#a8946a', 2.6); // ribbon
  },
  powder_bag(p) {
    p.ellipse(8, 10, 6, 5, L, 3);
    for (const [x, y] of [[5, 6], [8, 4], [11, 6]]) {
      p.ellipse(x, y, 2, 2, ['#0a0a0c', '#2a2a30', '#3e3e46'], 3.5);
      p.lit(x + 1, y - 2, S.fire[4], 3.8, 1);
    }
  },
  shepherds_crook(p) {
    p.line(5, 15, 9, 4, W[3], 3);
    p.line(6, 15, 10, 4, W[2], 3);
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * (1 + (i / 9) * 1.1);
      p.px(11 + Math.cos(a) * 3, 4 + Math.sin(a) * 3, W[4], 3.2);
    }
  },
  mirror_of_truth(p) {
    p.ellipse(8, 7, 5, 6, GOLD, 3);
    p.ellipse(8, 7, 3.8, 4.8, ['#4a6a8a', '#8ab0d0', '#d0ecff', '#ffffff'], 3.4);
    p.line(8, 13, 8, 15, GOLD[2], 3);
    p.px(6, 5, '#ffffff', 3.8);
    p.glow(8, 7, '#d0ecff', 0.7);
  },
  censer(p) {
    p.line(8, 0, 8, 5, IRON[4], 3);
    p.ellipse(8, 9, 4.5, 4, GOLD, 3.2);
    p.hline(4, 12, 9, GOLD[1], 3.4);
    for (let i = 0; i < 5; i++) p.lit(4 + i * 2, 4 - (i % 2), '#b0e0a0', 3.6, 0.7); // the strange smoke
  },
  horn_of_plenty(p) {
    for (let i = 0; i < 12; i++) p.ellipse(3 + i * 0.9, 13 - i * 0.6, 1 + i * 0.25, 1 + i * 0.25, W.slice(2), 3);
    for (const [x, y, c] of [[13, 4, RED], [14, 7, ['#2a5a1a', '#4a9a2a', '#8ad050']], [11, 3, GOLD]]) p.ellipse(x, y, 1.6, 1.6, c, 3.6);
  },
  executioners_sword(p) {
    p.line(3, 13, 13, 3, IRON[5], 3);
    p.line(4, 13, 14, 3, IRON[3], 3);
    p.line(14, 3, 15, 1, IRON[5], 3.2);
    p.line(3, 9, 7, 13, W[3], 3.6); // crossguard
    p.line(1, 15, 3, 13, L[2], 3.6);
    p.px(9, 7, RED[2], 3.4);
  },
  war_banner(p) {
    p.vline(3, 1, 15, W[3], 3);
    for (let y = 2; y < 10; y++) for (let x = 4; x < 14; x++) p.px(x, y + (x > 11 && y > 7 ? 1 : 0), RED[1 + ((x + y) % 5 === 0 ? 1 : 0)], 3.2);
    for (const x of [6, 8, 10]) p.vline(x, 4, 6, GOLD[2], 3.4);
    p.hline(6, 10, 6, GOLD[2], 3.4);
  },
};

// ---------------------------------------------------------------------------------------------
// Companions: 'familiars' sheet, 16 x 16, two frames each:
//   0-1 owl, 2-3 spectral page, 4-5 moth, 6-7 raven, 8-9 squire
// ---------------------------------------------------------------------------------------------
const FAMILIAR_DRAW = [owlIcon, pageIcon, mothIcon, ravenIcon, squireIcon];
export function familiarFrame(col) {
  const p = new Painter(16, 16);
  FAMILIAR_DRAW[Math.floor(col / 2)](p, col % 2);
  p.outline(S.outline);
  return p;
}
export const FAMILIAR_INDEX = { owl: 0, page: 1, moth: 2, raven: 3, squire: 4 };

// ---------------------------------------------------------------------------------------------
// Chests (24 x 20): 0/1 wooden shut/open, 2/3 iron, 4/5 cursed, 6 a gem glinting in a rock
// ---------------------------------------------------------------------------------------------
export function chestFrame(k) {
  const p = new Painter(24, 20);
  if (k === 6) {
    // a gem set into a rock (drawn over the rock sprite)
    p.ellipse(12, 10, 3, 2.6, ['#2a0a4a', '#6a2aa0', '#b06ae0', '#f0d0ff'], 6);
    p.px(11, 9, '#ffffff', 6.4);
    p.glow(12, 10, '#d0a0ff', 1.2);
    p.ellipse(16, 13, 1.6, 1.4, ['#0a3a2a', '#2aa07a', '#a0ffd8'], 6);
    p.glow(16, 13, '#a0ffd8', 0.8);
    return p;
  }
  const type = Math.floor(k / 2);
  const open = k % 2 === 1;
  const body = [W.slice(1, 5), IRON.slice(1, 5), ['#1a060a', '#3a0e16', '#5a1820', '#7a2430']][type];
  const band = [IRON.slice(2, 5), GOLD, ['#3a3a3a', '#6a6a6a', '#9a9a9a']][type];
  rect(p, 2, 9, 20, 10, body, 3);
  for (const x of [5, 18]) p.vline(x, 9, 18, band[1], 3.4);
  if (open) {
    rect(p, 2, 3, 20, 5, body, 2.5); // the lid flung back
    p.rect(4, 9, 16, 2, '#0a0806', 3.2); // dark inside
    p.glow(12, 10, GOLD[3], 0.6);
  } else {
    p.ellipse(12, 9, 10, 4, body, 4); // the rounded lid
    for (const x of [5, 18]) p.vline(x, 6, 9, band[1], 4.4);
    p.rect(11, 9, 3, 4, band, 4.6); // the lock
    p.px(12, 11, '#0a0806', 4.8);
    if (type === 2) {
      p.lit(9, 8, '#ff3030', 4.6, 1); // the cursed chest watches you
      p.lit(15, 8, '#ff3030', 4.6, 1);
    }
  }
  p.outline(S.outline);
  return p;
}

/** The iron heart pickup (pickups sheet, frame 6). */
export function ironHeartIcon(p) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const nx = (x - 7.5) / 6;
      const ny = (y - 6) / 6;
      if ((nx * nx + ny * ny - 0.6) ** 3 - nx * nx * ny * ny * ny < 0 && y > 1) p.px(x, 15 - y, IRON[2 + ((x + y) % 5 === 0 ? 2 : x < 8 ? 1 : 0)], 3 - Math.abs(nx) * 0.6);
    }
  }
  for (const [x, y] of [[5, 6], [10, 6], [7, 10]]) p.px(x, y, IRON[5], 3.4); // rivets
}

// ---------------------------------------------------------------------------------------------
// The Gambler's Den: a dice table (40 x 32: 0 idle, 1 rolling) and a beggar (24 x 32: 0-1)
// ---------------------------------------------------------------------------------------------
export function diceTableFrame(k) {
  const p = new Painter(40, 32);
  p.cyl(4, 22, 3, 9, W, 3);
  p.cyl(33, 22, 3, 9, W, 3);
  p.bevelRect(1, 12, 38, 10, W.slice(1, 5), 5, 1);
  p.rect(4, 13, 32, 7, ['#1a3a1a'][0], 5.4); // green baize
  for (const [x, y, n] of k === 0 ? [[14, 15, 5], [22, 16, 3]] : [[11, 14, 2], [26, 15, 6]]) {
    p.bevelRect(x, y, 5, 5, ['#a8a090', '#d8d0c0', '#ffffff'], 6.4, 1);
    p.px(x + 2, y + 2, '#0a0a0a', 6.6);
    if (n > 3) {
      p.px(x + 1, y + 1, '#0a0a0a', 6.6);
      p.px(x + 3, y + 3, '#0a0a0a', 6.6);
    }
  }
  for (let i = 0; i < 5; i++) p.ellipse(30 - i * 0.6, 17 - i, 1.6, 1, GOLD, 6 + i * 0.2); // a stack of pennies
  p.lit(8, 8, S.fire[4], 7, 1.2); // a stub of candle
  p.cyl(7, 9, 3, 4, S.wax, 6);
  p.outline(S.outline);
  return p;
}
export function beggarFrame(k) {
  const p = new Painter(24, 32);
  const R = C.rags;
  p.ellipse(12, 26, 9, 5, R, 3); // sitting in rags
  p.ellipse(12, 18, 6, 7, R, 5);
  p.ellipse(12, 9, 4, 4.5, C.prisonerSkin, 7);
  p.ellipse(12, 7, 5, 3.4, R, 7.4); // hood
  p.px(10, 10, '#0a0a0a', 7.4);
  p.px(14, 10, '#0a0a0a', 7.4);
  p.hline(10, 14, 13, C.prisonerSkin[1], 7.2); // a scraggly beard
  const hold = k ? -1 : 0;
  p.line(15, 18, 19, 20 + hold, C.prisonerSkin[2], 6);
  p.ellipse(20, 21 + hold, 3, 1.6, W.slice(1, 4), 6.4); // his bowl
  p.px(20, 20 + hold, GOLD[2], 6.6);
  p.outline(S.outline);
  return p;
}

/** The War Banner, planted (20 x 40). */
export function warBannerFrame(k) {
  const p = new Painter(20, 40);
  p.vline(4, 1, 39, W[3], 6);
  p.vline(5, 1, 39, W[2], 6);
  const wave = k ? 1 : 0;
  for (let y = 3; y < 18; y++) for (let x = 6; x < 18; x++) p.px(x, y + (x > 13 ? wave : 0), RED[1 + ((x + y) % 6 === 0 ? 1 : 0)], 6.4);
  for (const x of [9, 12, 15]) p.vline(x, 7, 10, GOLD[2], 6.6);
  p.hline(9, 15, 10, GOLD[2], 6.6);
  p.ellipse(4.5, 1, 1.6, 1.6, GOLD, 7);
  p.outline(S.outline);
  return p;
}

/** A blank relic: what pedestals show under the Omen of the Blind (curios sheet, frame 34). */
export function mysteryIcon(p) {
  p.ellipse(8, 8, 6, 6, ['#1a1a24', '#2e2e3a', '#4a4a5a'], 2);
  const Q = ['.###.', '#...#', '...#.', '..#..', '.....', '..#..'];
  Q.forEach((row, j) => {
    for (let i = 0; i < 5; i++) if (row[i] === '#') p.px(6 + i, 4 + j, '#c8c0ff', 2.6);
  });
  p.glow(8, 8, '#8a80d0', 0.5);
}
