import { ROCKS } from './rocksArt.js';
// Chapter tilesets. One shared STRUCTURE (walls with corners, L-shape outer corners, cracked secret
// walls, pits) plus a STYLE per chapter that supplies its own floor, wall face, wall decorations,
// spikes, floor decor and rock prop.
//
// Every generator returns a Painter. Art rngs are seeded with constants, so the art looks the same
// every time (it is NOT part of run generation).
//
// Frame meanings (the same for every chapter, Room.js relies on them):
//   floor:    0-3 plain, 4-5 cracked, 6-9 chapter specials (weights per style)
//   wallTop:  32x64. 0-1 plain, 2 lightly cracked, 3 decor A, 4 decor B, 5 torch sconce,
//             6 top-left corner, 7 top-right corner, 8/9 L-shape outer corners, 10 hollow (secret) crack
//   wallSide: 32x32. 0-1 left, 2-3 right, 4-5 bottom, 6/7 bottom corners, 8/9 L-shape corners,
//             10 left hollow, 11 right hollow, 12 bottom hollow
//   pit:      16 frames by neighbour mask (1 up, 2 right, 4 down, 8 left)

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { CHAPTERS, SHARED } from '../../data/palettes.js';

const T = 32;
const CAP = 16;
const FACE_TILT = -1.1;
const SIDE_TILT = 1.1;
const IRON = SHARED.iron;

// =============================================================================================
// Shared building blocks (all take the chapter palette `P`)
// =============================================================================================

function slab(p, rng, P, x, y, w, h, toneRange = [1, 2]) {
  w = Math.min(w, T - 1 - x);
  h = Math.min(h, T - 1 - y);
  const tone = rng.int(toneRange[0], toneRange[1]);
  const ramp = P.stone.slice(tone, tone + 4);
  p.bevelRect(x, y, w, h, ramp, 2.2, 1);
  const pits = Math.floor((w * h) / 60);
  for (let i = 0; i < pits; i++) {
    const px = x + rng.int(2, Math.max(2, w - 3));
    const py = y + rng.int(2, Math.max(2, h - 3));
    p.px(px, py, ramp[0], 1.2);
    if (rng.chance(0.5)) p.px(px + 1, py, ramp[1], 1.6);
  }
  const worn = Math.floor((w * h) / 90);
  for (let i = 0; i < worn; i++) {
    const px = x + rng.int(2, Math.max(2, w - 4));
    const py = y + rng.int(2, Math.max(2, h - 3));
    p.px(px, py, ramp[3]);
    p.px(px + 1, py, ramp[2]);
  }
  if (w > 12 && h > 12) for (let j = 3; j < h - 3; j++) for (let i = 3; i < w - 3; i++) p.addHeight(x + i, y + j, -0.3);
}

function crack(p, rng, P, x0, y0, len, glow = null) {
  let x = x0;
  let y = y0;
  let dir = rng.next() * Math.PI * 2;
  for (let i = 0; i < len; i++) {
    if (glow) p.lit(x, y, glow[Math.min(glow.length - 1, 1 + (i % 3 === 0 ? 1 : 0))], 0.2, 1);
    else {
      p.px(x, y, P.mortar[1], 0.4);
      p.dot(x + 1, y + 1, P.stone[4]);
    }
    dir += rng.float(-0.7, 0.7);
    x = Math.round(x + Math.cos(dir));
    y = Math.round(y + Math.sin(dir));
  }
}

function capStones(p, rng, P, x, y, w, h, bw, bh) {
  p.rect(x, y, w, h, P.mortar[0], 0);
  for (let j = 0; j < h; j += bh) {
    const off = (Math.floor(j / bh) % 2) * Math.floor(bw / 2);
    for (let i = -off; i < w; i += bw) {
      const sx = Math.max(x, x + i);
      const ex = Math.min(x + w, x + i + bw - 1);
      const ey = Math.min(y + h, y + j + bh - 1);
      if (ex - sx < 2) continue;
      const tone = rng.int(0, 1);
      p.bevelRect(sx, y + j, ex - sx, ey - (y + j), P.stone.slice(tone, tone + 4), 2, 1);
    }
  }
}

function capLip(p, P, x, y, w) {
  p.hline(x, x + w - 1, y, P.stone[5], 2);
  p.hline(x, x + w - 1, y + 1, P.stone[3], 1.5);
}

function sideFaceStrip(p, rng, P, x, y, w, h, tiltX) {
  p.rect(x, y, w, h, P.mortar[0], 0);
  for (let j = 0; j < h; j += 8) {
    const tone = rng.int(1, 2);
    p.bevelRect(x, y + j, w - 1, Math.min(7, h - j), P.stone.slice(tone, tone + 4), 2, 1);
  }
  p.setTilt(x, y, w, h, tiltX, 0);
}

function bigCrack(p, rng, P, x, y, len, dirX, dirY) {
  for (let i = 0; i < len; i++) {
    p.px(x, y, '#040405', -1);
    p.px(x + 1, y, P.mortar[0], -0.5);
    p.dot(x - 1, y, P.stone[5]);
    if (rng.chance(0.25)) {
      p.px(x + 2, y + 1, '#040405', -1);
      p.dot(x + 3, y + 1, P.stone[4]);
    }
    if (rng.chance(0.1)) {
      let bx = x;
      let by = y;
      const s = rng.pick([-1, 1]);
      for (let k = 0; k < rng.int(2, 3); k++) {
        bx += dirY !== 0 ? s : 0;
        by += dirX !== 0 ? s : 0;
        p.px(bx, by, P.mortar[0], -0.5);
      }
    }
    x += dirX + (dirY !== 0 && rng.chance(0.4) ? rng.pick([-1, 1]) : 0);
    y += dirY + (dirX !== 0 && rng.chance(0.4) ? rng.pick([-1, 1]) : 0);
  }
}

function sconce(p) {
  // iron wall plate, bracket and wooden torch (flame is a separate glowing sprite at y = 24)
  p.bevelRect(13, 36, 6, 8, IRON.slice(1, 5), 3);
  p.px(14, 37, IRON[5], 3.5);
  p.px(17, 42, IRON[4], 3.5);
  p.line(16, 38, 16, 34, IRON[3], 4);
  p.rect(14, 32, 4, 2, IRON[2], 4.5);
  p.hline(14, 17, 32, IRON[4], 4.5);
  p.rect(15, 26, 2, 6, SHARED.wood[3], 5);
  p.px(15, 27, SHARED.wood[4], 5);
  p.rect(14, 24, 4, 3, '#2a1a10', 5.5);
  p.px(15, 24, SHARED.fire[1], 5.5);
  p.px(16, 25, SHARED.fire[2], 5.5);
  for (let y = CAP; y < 24; y++) for (let x = 11; x < 21; x++) p.tint(x, y, '#0a0806', 0.5 * ((y - CAP) / 8) * (1 - Math.abs(x - 15.5) / 6));
}

function wallFoot(p, rng, P, x, y, w, h, accent) {
  // darker foot of the wall where it meets the floor
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < 5; j++) p.tint(x + i, y + h - 1 - j, P.mortar[0], 0.5 - j * 0.09);
    if (accent && rng.chance(0.35)) p.px(x + i, y + h - 1 - rng.int(0, 2), rng.pick(accent), 1);
  }
}

// =============================================================================================
// The shared structure
// =============================================================================================

export const FLOOR_VARIANTS = 10;
export const WALL_TOP_VARIANTS = 11;
export const WALL_SIDE_VARIANTS = 13;
export const PIT_VARIANTS = 16;

export function makeTileset(S) {
  const P = S.pal;

  function floor(variant) {
    const rng = new Rng(1000 + variant * 77 + S.seed);
    const p = new Painter(T, T);
    S.floor(p, rng, variant);
    return p;
  }

  function wallTop(variant) {
    if (variant === 7) return wallTop(6).mirrored();
    if (variant === 9) return wallTop(8).mirrored();
    if (variant === 8) {
      const p = wallTop(1);
      sideFaceStrip(p, new Rng(2800 + S.seed), P, 0, 0, 10, 64, -SIDE_TILT);
      for (let y = 0; y < 64; y++) p.tint(9, y, P.stone[5], 0.4);
      return p;
    }
    if (variant === 10) {
      const p = wallTop(0);
      const rng = new Rng(2900 + S.seed);
      bigCrack(p, rng, P, 15, 4, 54, 0, 1);
      bigCrack(p, rng, P, 16, 30, 10, 1, 0);
      return p;
    }
    const rng = new Rng(2000 + variant * 131 + S.seed);
    const p = new Painter(T, 64);
    if (variant === 6) {
      capStones(p, rng, P, 0, 0, T, 64, 16, 16);
      S.face(p, rng, 24, CAP, 8, 64 - CAP);
      p.setTilt(24, CAP, 8, 64 - CAP, 0, FACE_TILT);
      for (let y = CAP; y < 64; y++) p.tint(24, y, P.mortar[0], 0.6);
      capLip(p, P, 24, CAP - 2, 8);
      return p;
    }
    capStones(p, rng, P, 0, 0, T, CAP, 16, 8);
    S.face(p, rng, 0, CAP, T, 64 - CAP);
    p.setTilt(0, CAP, T, 64 - CAP, 0, FACE_TILT);
    wallFoot(p, rng, P, 0, CAP, T, 64 - CAP, S.accent);
    capLip(p, P, 0, CAP - 2, T);
    if (variant === 2) {
      let x = rng.int(10, 20);
      for (let y = CAP + 3; y < 58; y++) {
        p.px(x, y, P.mortar[0], 0.2);
        if (rng.chance(0.35)) x += rng.pick([-1, 1]);
      }
    }
    if (variant === 3) S.decorA(p, rng);
    if (variant === 4) S.decorB(p, rng);
    if (variant === 5) sconce(p);
    return p;
  }

  function wallSide(variant) {
    if (variant === 2 || variant === 3) return wallSide(variant - 2).mirrored();
    if (variant === 7) return wallSide(6).mirrored();
    if (variant === 9) return wallSide(8).mirrored();
    if (variant === 11) return wallSide(10).mirrored();
    if (variant === 8) {
      const p = wallSide(2);
      capLip(p, P, 0, 0, T);
      return p;
    }
    if (variant === 10) {
      const p = wallSide(0);
      bigCrack(p, new Rng(3900 + S.seed), P, 26, 0, 32, 0, 1);
      bigCrack(p, new Rng(3901 + S.seed), P, 10, 16, 8, 1, 0);
      return p;
    }
    if (variant === 12) {
      const p = wallSide(4);
      bigCrack(p, new Rng(3902 + S.seed), P, 2, 4, 28, 1, 0);
      return p;
    }
    const rng = new Rng(3000 + variant * 97 + S.seed);
    const p = new Painter(T, T);
    if (variant === 0 || variant === 1) {
      capStones(p, rng, P, 0, 0, 22, T, 11, 16);
      p.rect(22, 0, 10, T, P.mortar[0], 0);
      for (let j = 0; j < T; j += 8) {
        const tone = rng.int(1, 2);
        p.bevelRect(22, j + (variant === 1 ? 4 : 0), 9, 7, P.stone.slice(tone, tone + 4), 2, 1);
      }
      p.setTilt(22, 0, 10, T, SIDE_TILT, 0);
      p.vline(21, 0, T - 1, P.stone[5], 2);
      for (let y = 0; y < T; y++) p.tint(31, y, P.mortar[0], 0.5);
      if (variant === 1 && S.accent) for (let i = 0; i < 12; i++) p.px(rng.int(22, 31), rng.int(0, 31), rng.pick(S.accent), 1.5);
      return p;
    }
    if (variant === 4 || variant === 5) {
      capStones(p, rng, P, 0, 0, T, T, 16, 11);
      p.hline(0, T - 1, 0, P.stone[5], 2);
      p.hline(0, T - 1, 1, P.stone[4], 2);
      if (variant === 5 && S.accent) for (let i = 0; i < 6; i++) p.px(rng.int(0, 31), rng.int(0, 3), rng.pick(S.accent), 2);
      return p;
    }
    capStones(p, rng, P, 0, 0, T, T, 16, 11);
    p.vline(21, 0, 2, P.stone[5], 2);
    return p;
  }

  function pit(mask) {
    const rng = new Rng(5000 + mask + S.seed);
    const p = new Painter(T, T);
    p.rect(0, 0, T, T, '#040406', -4);
    for (let i = 0; i < 5; i++) p.px(rng.int(4, 27), rng.int(14, 28), '#0e0e12', -4);
    if (!(mask & 1)) {
      for (let y = 2; y < 12; y++) {
        const shade = y < 6 ? P.stone[2] : y < 9 ? P.stone[1] : P.stone[0];
        for (let x = 0; x < T; x++) p.px(x, y, shade, -4 + (12 - y) * 0.35);
      }
      for (let x = 0; x < T; x += 8) p.vline(x + rng.int(0, 3), 2, 9, P.mortar[0]);
      p.setTilt(0, 2, T, 10, 0, -1.1);
      p.hline(0, T - 1, 0, P.stone[4], 0);
      p.hline(0, T - 1, 1, P.stone[3], 0);
      if (S.pitDetail) S.pitDetail(p, rng);
    }
    if (!(mask & 8)) {
      for (let y = 0; y < T; y++) {
        const w = 2 + (rng.chance(0.3) ? 1 : 0);
        for (let x = 0; x < w; x++) p.px(x, y, x === 0 ? P.stone[3] : P.stone[1], -x * 1.5);
      }
    }
    if (!(mask & 2)) {
      for (let y = 0; y < T; y++) {
        const w = 2 + (rng.chance(0.3) ? 1 : 0);
        for (let x = 0; x < w; x++) p.px(T - 1 - x, y, x === 0 ? P.stone[2] : P.stone[1], -x * 1.5);
      }
    }
    if (!(mask & 4)) {
      for (let x = 0; x < T; x++) {
        p.px(x, T - 1, P.stone[4], 0);
        p.px(x, T - 2, P.stone[2], -1);
        if (rng.chance(0.25)) p.px(x, T - 3, P.stone[1], -2);
      }
    }
    return p;
  }

  function spikes() {
    const p = new Painter(T, T);
    S.spikes(p, new Rng(6000 + S.seed));
    p.outline(SHARED.outline);
    return p;
  }

  function decor() {
    const p = new Painter(T, T);
    S.decor(p, new Rng(4000 + S.seed));
    return p;
  }

  function rock(variant = 0) {
    // three variants per chapter (render/art/rocksArt.js)
    const p = new Painter(T, T);
    const draw = ROCKS[S.key] && ROCKS[S.key][variant % 3];
    if (draw) draw(p, P, new Rng(6060 + variant * 31 + S.seed));
    else S.rock(p, new Rng(6060 + S.seed));
    p.outline(SHARED.outline);
    return p;
  }

  return { key: S.key, floor, wallTop, wallSide, pit, spikes, decor, rock, floorWeights: S.floorWeights };
}

// =============================================================================================
// THE CELLS - cold damp stone, iron, straw
// =============================================================================================
const SLABS = [
  [[0, 0, 18, 13], [19, 0, 13, 13], [0, 14, 10, 18], [11, 14, 21, 18]],
  [[0, 0, 11, 20], [12, 0, 20, 9], [12, 10, 20, 10], [0, 21, 32, 11]],
  [[0, 0, 32, 15], [0, 16, 15, 16], [16, 16, 16, 16]],
  [[0, 0, 14, 32], [15, 0, 17, 17], [15, 18, 17, 14]],
];

function slabFloor(p, rng, P, variant, toneRange) {
  p.rect(0, 0, T, T, P.mortar[0], 0);
  for (const [x, y, w, h] of SLABS[variant % SLABS.length]) slab(p, rng, P, x, y, w, h, toneRange);
  for (let i = 0; i < 18; i++) {
    const x = rng.int(0, T - 1);
    const y = rng.int(0, T - 1);
    if (p.getHeight(x, y) < 0.2) p.px(x, y, P.mortar[1], 0.1);
  }
  if (variant === 4 || variant === 5) {
    crack(p, rng, P, rng.int(6, 12), rng.int(5, 10), 16);
    if (variant === 5) crack(p, rng, P, rng.int(16, 24), rng.int(18, 24), 10);
  }
}

function mossInJoints(p, rng, ramp, amount) {
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      if (p.getHeight(x, y) < 0.3 && rng.chance(amount)) {
        p.px(x, y, rng.pick(ramp.slice(1)), 0.6);
        if (rng.chance(0.5)) p.tint(x + rng.int(-1, 1), y + rng.int(-1, 1), ramp[2], 0.6);
      }
    }
  }
}

function strawStrand(p, rng, P, x, y) {
  const len = rng.int(3, 6);
  const dx = rng.pick([-1, 1]);
  const dy = rng.chance(0.5) ? 0 : rng.pick([-1, 1]);
  const c = rng.pick(P.straw.slice(2));
  for (let i = 0; i < len; i++) {
    const sx = x + i * dx;
    const sy = y + Math.floor((i * dy) / 2);
    p.px(sx, sy, i === 0 ? P.straw[4] : c, 2.8);
    p.dot(sx, sy + 1, P.mortar[1]);
  }
}

function brickFace(p, rng, P, x, y, w, h, course = 12, brick = 16) {
  p.rect(x, y, w, h, P.mortar[0], 0);
  let row = 0;
  for (let j = 0; j < h; j += course, row++) {
    const off = (row % 2) * (brick / 2);
    for (let i = -off; i < w; i += brick) {
      const sx = Math.max(x, x + i);
      const ex = Math.min(x + w, x + i + brick - 1);
      const bh = Math.min(course - 1, h - j);
      if (ex - sx < 2 || bh < 2) continue;
      const tone = rng.int(1, 3);
      p.bevelRect(sx, y + j, ex - sx, bh, P.stone.slice(tone, tone + 4), 2.4, 1);
      if (rng.chance(0.5)) p.px(sx + rng.int(2, ex - sx - 2), y + j + rng.int(2, bh - 2), P.stone[tone], 1);
    }
  }
  for (let i = 0; i < w; i++) {
    if (!rng.chance(0.1)) continue;
    const len = rng.int(6, h - 4);
    for (let j = 0; j < len; j++) p.tint(x + i, y + j, P.mortar[1], 0.35 * (1 - j / len));
  }
}

function chain(p, x, y0, y1, P) {
  p.bevelRect(x - 2, y0 - 2, 5, 4, IRON.slice(1, 5), 3);
  p.px(x, y0 - 1, IRON[5], 3.5);
  for (let y = y0 + 2, k = 0; y < y1; y += 3, k++) {
    if (k % 2 === 0) {
      p.px(x - 1, y, IRON[3], 2.5);
      p.px(x + 1, y, IRON[2], 2.5);
      p.px(x, y - 1, IRON[4], 2.5);
      p.px(x, y + 1, IRON[2], 2.5);
    } else {
      p.vline(x, y - 1, y + 1, IRON[3], 3);
      p.px(x, y - 1, IRON[4], 3);
    }
  }
  p.ellipse(x + 0.5, y1 + 1.5, 2.6, 2, IRON.slice(1, 5), 3);
  p.px(x, y1 + 1, P.mortar[0], 0.5);
  p.px(x + 1, y1 + 1, P.mortar[0], 0.5);
  for (let i = 0; i < 4; i++) p.tint(x + i - 1, y1 + 5, SHARED.rust[0], 0.5);
}

function ironSpikes(p, glowTips = null) {
  p.bevelRect(3, 4, 26, 25, IRON.slice(0, 4), 1, 1);
  for (let j = 0; j < 3; j++) {
    for (let i = 0; i < 3; i++) {
      const cx = 8 + i * 8;
      const cy = 9 + j * 8;
      p.rect(cx - 1, cy + 1, 3, 2, '#08080a', 0.5);
      p.vline(cx, cy - 3, cy + 1, IRON[3], 5);
      p.px(cx - 1, cy, IRON[2], 3);
      p.px(cx + 1, cy, IRON[4], 3);
      if (glowTips) p.lit(cx, cy - 3, glowTips, 6);
      else p.px(cx, cy - 3, IRON[5], 6);
    }
  }
}

const CELLS = {
  key: 'cells',
  seed: 0,
  pal: CHAPTERS.cells,
  accent: CHAPTERS.cells.moss,
  floorWeights: [6, 6, 6, 6, 1.4, 1.0, 1.8, 1.4, 0.8, 0.5],
  floor(p, rng, v) {
    const P = this.pal;
    slabFloor(p, rng, P, v);
    if (v === 6) mossInJoints(p, rng, P.moss, 0.55);
    if (v === 7) for (let i = 0; i < 16; i++) strawStrand(p, rng, P, rng.int(2, 29), rng.int(2, 29));
    if (v === 8) {
      for (let y = 10; y < 25; y++) {
        for (let x = 5; x < 28; x++) {
          const nx = (x + 0.5 - 16) / 10.5;
          const ny = (y + 0.5 - 17) / 6.5;
          const d = nx * nx + ny * ny;
          if (d > 1) continue;
          p.tint(x, y, d > 0.7 ? P.water[2] : P.water[3], d > 0.7 ? 0.45 : 0.55);
          p.px(x, y, null, 0.6);
        }
      }
      p.hline(11, 15, 14, '#9ab4cc', 0.6);
      p.hline(12, 13, 15, '#7894b0', 0.6);
      p.hline(18, 20, 19, '#7894b0', 0.6);
    }
    if (v === 9) {
      p.rect(8, 9, 16, 14, IRON[0], 0.5);
      p.bevelRect(8, 9, 16, 14, IRON.slice(1, 5), 1.6, 1);
      for (let i = 0; i < 4; i++) p.rect(11 + i * 3, 12, 2, 8, '#050507', -1);
      for (let i = 0; i < 10; i++) p.tint(rng.int(8, 23), rng.int(22, 25), SHARED.rust[1], 0.45);
    }
  },
  face(p, rng, x, y, w, h) {
    brickFace(p, rng, this.pal, x, y, w, h);
  },
  decorA(p) {
    chain(p, 9, 22, 44, this.pal);
    chain(p, 23, 22, 38, this.pal);
  },
  decorB(p) {
    const P = this.pal;
    p.bevelRect(7, 21, 18, 22, P.stone.slice(3, 7), 3, 2);
    p.rect(9, 23, 14, 18, '#06070b', -2);
    p.rect(10, 24, 12, 4, '#0d1420', -2);
    for (let i = 0; i < 3; i++) p.vline(11 + i * 4, 23, 40, IRON[2], 1);
    p.hline(9, 22, 31, IRON[2], 1.2);
    p.hline(9, 22, 30, IRON[3], 1.2);
    p.setTilt(9, 23, 14, 18, 0, -0.4);
  },
  spikes(p) {
    ironSpikes(p);
    p.tint(14, 18, '#3a0c0c', 0.6);
    p.tint(22, 11, '#3a0c0c', 0.4);
  },
  decor(p, rng) {
    const P = this.pal;
    p.ellipse(16, 17, 12, 8, P.straw.slice(0, 3), 3.5);
    for (let i = 0; i < 70; i++) {
      const a = rng.next() * Math.PI * 2;
      const r = rng.next() * 11;
      strawStrand(p, rng, P, Math.round(16 + Math.cos(a) * r), Math.round(17 + Math.sin(a) * r * 0.65));
    }
  },
  rock(p, rng) {
    const P = this.pal;
    const ramp = P.stone.slice(1, 7);
    p.ellipse(12, 20, 8, 7, ramp, 7);
    p.ellipse(20, 21, 8.5, 6.5, ramp, 6);
    p.ellipse(15.5, 14.5, 7.5, 6.5, ramp, 9);
    p.line(15, 18, 17, 24, P.stone[1], 4);
    for (let i = 0; i < 26; i++) p.dot(rng.int(9, 22), rng.int(8, 15), rng.pick(P.moss.slice(1)), 9);
  },
};

// =============================================================================================
// THE CATACOMBS - pale bone, tomb slabs, skull walls, candles, sickly green
// =============================================================================================
const TOMB_SLABS = [
  [[0, 0, 32, 20], [0, 21, 16, 11], [17, 21, 15, 11]],
  [[0, 0, 15, 32], [16, 0, 16, 32]],
  [[0, 0, 20, 14], [21, 0, 11, 32], [0, 15, 20, 17]],
  [[0, 0, 32, 10], [0, 11, 32, 21]],
];

function skull(p, cx, cy, B, h, small = false) {
  const r = small ? 2.4 : 3.2;
  p.ellipse(cx, cy, r, r * 0.9, B, h);
  p.px(cx - 1, cy, '#100c08', h - 1);
  p.px(cx + 1, cy, '#100c08', h - 1);
  if (!small) {
    p.px(cx - 1, cy - 1, '#1e1810', h - 1);
    p.px(cx + 2, cy - 1, '#1e1810', h - 1);
    p.px(cx, cy + 1, '#2a2218', h - 0.5);
    p.hline(cx - 1, cx + 1, cy + 3, B[1], h - 0.5);
  }
}

function bone(p, x0, y0, x1, y1, B, h) {
  p.line(x0, y0, x1, y1, B[2], h);
  p.ellipse(x0, y0, 1.3, 1.3, B, h + 0.5);
  p.ellipse(x1, y1, 1.3, 1.3, B, h + 0.5);
}

const CATA = {
  key: 'catacombs',
  seed: 100,
  pal: CHAPTERS.catacombs,
  accent: CHAPTERS.catacombs.moss,
  floorWeights: [6, 6, 6, 6, 1.4, 1.0, 1.4, 1.6, 1.0, 0.6],
  floor(p, rng, v) {
    const P = this.pal;
    p.rect(0, 0, T, T, P.mortar[0], 0);
    for (const [x, y, w, h] of TOMB_SLABS[v % TOMB_SLABS.length]) slab(p, rng, P, x, y, w, h, [2, 3]);
    if (v === 4 || v === 5) crack(p, rng, P, rng.int(6, 14), rng.int(4, 12), 18);
    if (v === 5) {
      // a cross carved into the slab
      p.rect(14, 6, 3, 18, P.stone[1], 1);
      p.rect(9, 11, 13, 3, P.stone[1], 1);
    }
    if (v === 6) {
      bone(p, 6, 20, 14, 24, P.bone, 2.5);
      bone(p, 18, 8, 25, 13, P.bone, 2.5);
      skull(p, 22, 22, P.bone, 3, true);
    }
    if (v === 7) mossInJoints(p, rng, P.moss, 0.6);
    if (v === 8) {
      // grave slab: rows of worn inscription
      for (let r = 0; r < 4; r++) for (let x = 6; x < 26; x += 2) if (rng.chance(0.7)) p.px(x, 7 + r * 4, P.stone[1], 1.4);
    }
    if (v === 9) {
      p.bevelRect(7, 8, 18, 16, IRON.slice(1, 5), 1.6, 1);
      p.rect(9, 10, 14, 12, '#060504', -2);
      skull(p, 13, 15, P.bone.slice(0, 3), -1.5, true);
      skull(p, 19, 17, P.bone.slice(0, 3), -1.5, true);
      for (let i = 0; i < 3; i++) p.vline(11 + i * 5, 10, 21, IRON[3], 1.5);
    }
  },
  face(p, rng, x, y, w, h) {
    // an ossuary wall: rows of skulls between courses of stacked long-bone ends
    const P = this.pal;
    const B = P.bone;
    p.rect(x, y, w, h, P.mortar[0], 0);
    let yy = y + 1;
    let row = 0;
    while (yy < y + h - 4) {
      if (row % 2 === 0) {
        for (let cx = x + 3 + (row % 4 === 0 ? 0 : 4); cx < x + w; cx += 8) skull(p, cx, yy + 3, B, 3);
        yy += 8;
      } else {
        for (let cx = x + 1; cx < x + w; cx += 3) {
          p.ellipse(cx + 0.5, yy + 1.5, 1.4, 1.4, B, 2.2);
          p.ellipse(cx + 2, yy + 4, 1.4, 1.4, B.slice(0, 3), 2);
        }
        yy += 6;
      }
      row++;
    }
    for (let i = 0; i < 30; i++) p.tint(x + rng.int(0, w - 1), y + rng.int(0, h - 1), P.moss[1], 0.3);
  },
  decorA(p) {
    // candle niche: an arched alcove with stubby candles (their flames glow, baked in)
    const P = this.pal;
    p.rect(7, 26, 18, 16, '#0a0806', -2);
    p.ellipse(16, 26, 9, 5, '#0a0806', -2, false);
    p.setTilt(7, 22, 18, 20, 0, -0.4);
    for (const [cx, top] of [[11, 34], [15, 32], [20, 35]]) {
      p.cyl(cx, top, 2, 41 - top, SHARED.wax, 1);
      p.lit(cx, top - 1, SHARED.fire[4], 1, 1.4);
      p.lit(cx, top - 2, SHARED.fire[5], 1, 1.4);
      p.glow(cx + 1, top - 1, SHARED.fire[3], 0.6);
    }
    p.hline(8, 23, 41, SHARED.wax[2], 1); // pooled wax
    p.tint(16, 24, P.mortar[1], 0.5);
  },
  decorB(p) {
    // a burial niche with a shrouded body laid in it
    const P = this.pal;
    p.rect(4, 28, 24, 12, '#090706', -2);
    p.setTilt(4, 28, 24, 12, 0, -0.5);
    p.ellipse(16, 35, 10, 3.5, ['#3a362e', '#5e584c', '#8a8270', '#aaa290'], 1);
    for (let x = 8; x < 25; x += 3) p.vline(x, 33, 37, '#3a362e', 1.2); // binding cords
    skull(p, 6, 34, P.bone.slice(0, 3), 1, true);
  },
  spikes(p) {
    const P = this.pal;
    p.bevelRect(3, 5, 26, 24, P.stone.slice(1, 5), 1, 1);
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 3; i++) {
        const cx = 8 + i * 8 + (j % 2) * 2;
        const cy = 10 + j * 7;
        p.line(cx, cy + 2, cx + (i - 1), cy - 4, P.bone[2], 5); // splintered bone shards
        p.px(cx + (i - 1), cy - 4, P.bone[3], 6);
        p.px(cx - 1, cy + 2, '#0a0806', 0.5);
      }
    }
  },
  decor(p, rng) {
    const P = this.pal;
    p.ellipse(16, 20, 11, 6, P.mortar.concat([P.stone[2]]), 1.5);
    for (let i = 0; i < 6; i++) bone(p, rng.int(6, 22), rng.int(14, 24), rng.int(8, 26), rng.int(16, 26), P.bone, 2.5);
    skull(p, 13, 17, P.bone, 4);
    skull(p, 20, 19, P.bone, 3.5, true);
  },
  rock(p, rng) {
    // a mound of skulls
    const P = this.pal;
    p.ellipse(16, 22, 13, 7, P.stone.slice(0, 4), 3);
    const spots = [[9, 22], [16, 23], [23, 22], [12, 17], [20, 17], [16, 12]];
    for (const [x, y] of spots) skull(p, x + rng.int(-1, 1), y, P.bone, 6 + (24 - y) * 0.3);
  },
  pitDetail(p) {
    skull(p, 9, 8, this.pal.bone.slice(0, 3), -3, true);
  },
};

// =============================================================================================
// THE HOLLOW - an underground forest: earth, giant roots, glowing fungus, witch totems
// =============================================================================================
function root(p, rng, B, x0, y0, x1, y1, r, h) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t + Math.sin(t * 6 + x0) * 1.2;
    p.ellipse(x, y, r, r, B, h);
  }
  for (let i = 0; i < n; i += rng.int(3, 6)) {
    const t = i / n;
    p.dot(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, B[0]); // bark grooves
  }
}

function mushroom(p, x, y, cap, size, glowStrength = 1) {
  p.vline(x, y, y + size + 1, '#c8c0b0', 2);
  for (let dx = -size; dx <= size; dx++) {
    const c = Math.abs(dx) === size ? cap[0] : cap[1 + (dx < 0 ? 1 : 0)];
    p.lit(x + dx, y, c, 3, glowStrength * 0.8);
    if (Math.abs(dx) < size) p.lit(x + dx, y - 1, cap[2], 3.4, glowStrength);
  }
  p.lit(x, y - 2, cap[3], 3.6, glowStrength);
}

const HOLLOW = {
  key: 'hollow',
  seed: 200,
  pal: CHAPTERS.hollow,
  accent: CHAPTERS.hollow.moss,
  floorWeights: [6, 6, 6, 6, 1.4, 1.6, 0.9, 1.4, 0.7, 0.8],
  floor(p, rng, v) {
    const P = this.pal;
    // packed earth
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) p.px(x, y, P.earth[rng.int(1, 3)], 1 + rng.next() * 0.6);
    for (let i = 0; i < 6; i++) p.ellipse(rng.int(2, 29), rng.int(2, 29), rng.float(1, 2), rng.float(0.8, 1.6), P.stone.slice(2, 6), 2); // pebbles
    for (let i = 0; i < 12; i++) p.px(rng.int(0, 31), rng.int(0, 31), P.earth[0], 0.6);
    if (v === 4 || v === 5) root(p, rng, P.bark, -2, rng.int(6, 26), 34, rng.int(6, 26), v === 4 ? 2.2 : 1.6, 3);
    if (v === 5 || v === 2) mossInJoints(p, rng, P.moss, 0.15);
    if (v === 6) {
      // a fairy ring of little glowing mushrooms
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        mushroom(p, Math.round(16 + Math.cos(a) * 9), Math.round(17 + Math.sin(a) * 6), i % 2 ? P.glowTeal : P.glowPurple, 1, 0.9);
      }
    }
    if (v === 7) {
      for (let i = 0; i < 14; i++) {
        const x = rng.int(2, 28);
        const y = rng.int(2, 28);
        const c = rng.pick([P.leaf[1], P.leaf[2], P.moss[2]]);
        p.px(x, y, c, 1.8);
        p.px(x + 1, y, c, 1.8);
        p.px(x, y + 1, P.leaf[0], 1.6);
      }
    }
    if (v === 8) {
      // toxic puddle, faintly glowing
      for (let y = 10; y < 24; y++) {
        for (let x = 6; x < 27; x++) {
          const d = ((x + 0.5 - 16) / 10) ** 2 + ((y + 0.5 - 17) / 6) ** 2;
          if (d > 1) continue;
          p.px(x, y, d > 0.6 ? P.glowPurple[0] : P.glowPurple[1], 0.4);
          if (d < 0.3) p.glow(x, y, P.glowPurple[1], 0.35);
        }
      }
      p.lit(12, 14, P.glowPurple[3], 0.5, 0.6);
    }
    if (v === 9) p.ellipse(16, 16, 9, 7, P.stone.slice(2, 7), 3); // a flat stepping stone
  },
  face(p, rng, x, y, w, h) {
    // a wall of packed earth bound by giant roots
    const P = this.pal;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.px(x + i, y + j, P.earth[rng.int(0, 2)], 0.5);
    // three great roots running the length of the wall. Their height and wave depend only on the
    // position across the tile (one wave per 32 px), so neighbouring wall tiles join seamlessly.
    for (let k = 0; k < 3; k++) {
      const y0 = y + 7 + k * 15;
      const r = [3, 2.6, 3.2][k];
      for (let xx = x; xx < x + w; xx++) {
        const yy = y0 + Math.sin(((xx % T) / T) * Math.PI * 2 + k * 2.1) * 1.6;
        p.ellipse(xx, yy, r, r, P.bark, 3.5);
      }
      for (let xx = x + 3; xx < x + w; xx += 7) p.px(xx, y0 + Math.sin(((xx % T) / T) * Math.PI * 2 + k * 2.1) * 1.6 - r + 1, P.bark[P.bark.length - 1], 3.9); // light along the top
    }
    for (let i = 0; i < 4; i++) {
      const rx = x + rng.int(2, w - 3);
      p.line(rx, y + rng.int(0, 10), rx + rng.int(-2, 2), y + rng.int(18, h - 4), P.bark[1], 1.5); // hanging rootlets
    }
    for (let i = 0; i < 20; i++) p.dot(x + rng.int(0, w - 1), y + rng.int(0, h - 1), rng.pick(P.moss), 3.6);
    if (rng.chance(0.6)) p.lit(x + rng.int(4, w - 4), y + rng.int(6, h - 8), P.glowTeal[2], 3.6, 0.8); // a glowing spore cap
  },
  decorA(p) {
    // a cluster of glowing mushrooms growing out of the roots
    const P = this.pal;
    mushroom(p, 10, 34, P.glowTeal, 3, 1.2);
    mushroom(p, 18, 30, P.glowTeal, 4, 1.3);
    mushroom(p, 24, 38, P.glowPurple, 2, 1.1);
    mushroom(p, 14, 42, P.glowPurple, 2, 1);
  },
  decorB(p) {
    // a witch's totem: sticks bound in a star, a small skull, hanging feathers, red thread
    const W = SHARED.wood;
    p.line(16, 22, 16, 46, W[2], 4);
    p.line(8, 28, 24, 40, W[3], 4.4);
    p.line(24, 28, 8, 40, W[3], 4.4);
    p.line(7, 34, 25, 34, W[2], 4.2);
    skull(p, 16, 33, CHAPTERS.catacombs.bone, 5.5, true);
    for (const [x, y] of [[13, 31], [19, 31], [16, 37]]) p.px(x, y, '#c02634', 5);
    for (const x of [9, 23]) {
      p.vline(x, 41, 47, '#2a2a2e', 3);
      p.px(x, 48, '#4a4a52', 3);
    }
    p.lit(16, 33, CHAPTERS.hollow.glowPurple[3], 5.6, 0.7); // something glints in its eye
  },
  spikes(p, rng) {
    // a bramble of black thorny vines
    const P = this.pal;
    for (let k = 0; k < 6; k++) {
      let x = rng.int(4, 27);
      let y = rng.int(4, 27);
      for (let i = 0; i < 12; i++) {
        p.px(x, y, P.bark[1], 3);
        if (i % 3 === 0) p.px(x + 1, y - 1, P.bark[3], 5);
        x += rng.int(-1, 1);
        y += rng.int(-1, 1);
      }
    }
    for (let i = 0; i < 10; i++) p.px(rng.int(5, 26), rng.int(5, 26), '#c8c0a0', 6); // thorn tips
  },
  decor(p) {
    const P = this.pal;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      mushroom(p, Math.round(16 + Math.cos(a) * 8), Math.round(18 + Math.sin(a) * 5), i % 2 ? P.glowTeal : P.glowPurple, 1, 1);
    }
  },
  rock(p, rng) {
    // a mossy stump with shelf fungus
    const P = this.pal;
    p.cyl(8, 10, 16, 18, P.bark, 7);
    p.ellipse(16, 10, 8, 3.5, ['#3a2a1e', '#5a4430', '#7c6244'], 8, false); // cut top with rings
    p.ellipse(16, 10, 4, 1.5, '#4a3626', 8.2, false);
    for (let i = 0; i < 20; i++) p.dot(rng.int(8, 23), rng.int(14, 27), rng.pick(P.moss), 7.5);
    p.cyl(4, 25, 4, 3, P.bark, 4); // roots
    p.cyl(24, 25, 4, 3, P.bark, 4);
    mushroom(p, 24, 16, P.glowTeal, 2, 1);
  },
};

// =============================================================================================
// THE BURNING HALLS - collapsed throne halls: dark marble, gold, banners on fire, lava cracks
// =============================================================================================
const HALLS = {
  key: 'halls',
  seed: 300,
  pal: CHAPTERS.halls,
  accent: CHAPTERS.halls.ash,
  floorWeights: [6, 6, 6, 6, 1.4, 1.0, 1.0, 0.8, 0.6, 0.4],
  floor(p, rng, v) {
    const P = this.pal;
    // a checker of dark marble set with gold inlay
    for (let q = 0; q < 4; q++) {
      const qx = (q % 2) * 16;
      const qy = Math.floor(q / 2) * 16;
      const ramp = (q === 0 || q === 3) ^ (v % 2 === 1) ? P.marbleA : P.marbleB;
      p.bevelRect(qx, qy, 15, 15, ramp, 1.6, 1);
      if (rng.chance(0.5)) p.line(qx + rng.int(1, 13), qy + rng.int(1, 13), qx + rng.int(1, 13), qy + rng.int(1, 13), ramp[ramp.length - 2], 1.6); // a faint vein
    }
    // dark seams between the slabs, a little gold only where four slabs meet
    p.hline(0, 31, 15, '#0c0808', 0.8);
    p.vline(15, 0, 31, '#0c0808', 0.8);
    p.hline(0, 31, 31, '#0a0606', 0.6);
    p.vline(31, 0, 31, '#0a0606', 0.6);
    p.px(15, 15, P.gold[2], 1);
    p.px(31, 31, P.gold[1], 1);
    if (v === 4 || v === 8) crack(p, rng, P, rng.int(4, 12), rng.int(4, 12), v === 8 ? 30 : 18, P.lava);
    if (v === 5) for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (((x - 16) ** 2 + (y - 16) ** 2) < 140) p.tint(x, y, '#060404', 0.55); // scorch
    if (v === 6) {
      p.ellipse(16, 18, 10, 6, P.ash, 1.8);
      p.lit(14, 17, P.lava[2], 2, 0.7); // embers still glowing in the ash
      p.lit(19, 19, P.lava[1], 2, 0.6);
    }
    if (v === 7) for (let i = 0; i < 8; i++) p.ellipse(rng.int(4, 27), rng.int(4, 27), 1.6, 1.2, P.gold, 2);
    if (v === 9) {
      // the Mad King's crown set into the floor in gold
      p.hline(9, 22, 20, P.gold[2], 1.4);
      p.hline(9, 22, 21, P.gold[1], 1.4);
      for (const x of [9, 13, 16, 19, 22]) p.vline(x, x === 16 ? 11 : 14, 19, P.gold[2], 1.4);
      p.px(16, 10, '#c02634', 1.6);
    }
  },
  face(p, rng, x, y, w, h) {
    const P = this.pal;
    brickFace(p, rng, P, x, y, w, h, 16, 32);
    p.hline(x, x + w - 1, y + 8, P.gold[2], 3); // gilded band
    p.hline(x, x + w - 1, y + 9, P.gold[1], 3);
    for (let i = 0; i < w; i++) if (rng.chance(0.3)) p.tint(x + i, y + rng.int(0, h - 1), '#000000', 0.4); // soot
  },
  decorA(p, rng) {
    // a torn crimson banner bearing the gold crown, burning along its ragged hem
    const P = this.pal;
    p.hline(7, 24, 19, IRON[3], 5);
    for (let x = 8; x <= 23; x++) {
      const bottom = 42 + Math.round(Math.sin(x * 1.7) * 2) + (x % 5 === 0 ? -3 : 0);
      for (let y = 20; y < bottom; y++) p.px(x, y, (x + y) % 7 === 0 ? P.crimson[1] : P.crimson[2], 4);
      for (let k = 0; k < 2; k++) p.lit(x, bottom + k, k === 0 ? P.lava[2] : P.lava[1], 4, 1.2);
      if (rng.chance(0.3)) p.lit(x, bottom - 1, P.lava[3], 4, 1);
    }
    p.hline(12, 19, 30, P.gold[2], 4.4);
    for (const xx of [12, 15, 16, 19]) p.vline(xx, xx === 15 || xx === 16 ? 25 : 27, 29, P.gold[2], 4.4);
  },
  decorB(p, rng) {
    // a seam of molten rock splitting the wall
    crack(p, rng, this.pal, 16, 18, 40, this.pal.lava);
    crack(p, rng, this.pal, 14, 30, 14, this.pal.lava);
  },
  spikes(p) {
    // a fire grate: iron bars over glowing coals
    const P = this.pal;
    p.bevelRect(3, 4, 26, 25, IRON.slice(0, 4), 1, 1);
    for (let y = 7; y < 27; y += 2) for (let x = 6; x < 26; x++) if ((x + y) % 3) p.lit(x, y, rng4(x, y) ? P.lava[1] : P.lava[2], 0.5, 0.9);
    for (let x = 6; x < 26; x += 4) p.vline(x, 6, 27, IRON[3], 2);
  },
  decor(p, rng) {
    const P = this.pal;
    p.ellipse(16, 18, 11, 6, P.ash, 1.2);
    for (let i = 0; i < 6; i++) p.ellipse(rng.int(8, 24), rng.int(13, 23), 1.6, 1.2, P.gold, 2);
  },
  rock(p) {
    // a toppled statue head, still crowned
    const P = this.pal;
    p.ellipse(16, 20, 11, 9, P.marbleA.concat(P.marbleB.slice(3)), 7);
    p.px(12, 18, '#0a0806', 7.5);
    p.px(19, 18, '#0a0806', 7.5);
    p.hline(13, 18, 23, P.marbleA[0], 7);
    for (const x of [8, 12, 16, 20, 24]) p.vline(x, 9, 12, P.gold[2], 8.5);
    p.hline(8, 24, 12, P.gold[2], 8.5);
    p.hline(8, 24, 13, P.gold[1], 8.3);
  },
};

function rng4(x, y) {
  return ((x * 7 + y * 13) % 5) < 2;
}

// the secret realms reuse a chapter's tiles in their own palette
// the Deep: each borrows a chapter's way of building (tiles, walls, pits) in its own colours
const ROOTDEEP = { ...HOLLOW, key: 'rootdeep', seed: 800, pal: CHAPTERS.rootdeep };
// the Frozen Deep: walls of great translucent ice blocks with icicles at their tops; floors of glossy ice
const FROZEN = {
  ...CATA,
  key: 'frozen',
  seed: 900,
  pal: CHAPTERS.frozen,
  accent: CHAPTERS.frozen.moss,
  floorWeights: [6, 6, 6, 6, 1.4, 1.0, 1.4, 1.2, 1.0, 0.8],
  floor(p, rng, v) {
    const P = this.pal;
    const ICE = P.bone;
    slabFloor(p, rng, P, v, [2, 3]);
    // a sheen of ice over the stone: pale glossy streaks
    for (let i = 0; i < 4; i++) {
      const x = rng.int(2, 24);
      const y = rng.int(3, 28);
      p.line(x, y, x + rng.int(3, 6), y - rng.int(1, 3), ICE[2], 2.4);
    }
    if (v === 6) {
      // a drift of snow against one corner
      p.ellipse(rng.int(8, 24), rng.int(18, 26), rng.float(6, 9), rng.float(3, 4), [P.moss[2], P.moss[3], '#ffffff'], 2.6);
    }
    if (v === 7) for (let i = 0; i < 10; i++) p.px(rng.int(2, 29), rng.int(2, 29), '#ffffff', 2.5); // hoarfrost
    if (v === 9) {
      // a frozen puddle, with something dark under the ice
      p.ellipse(16, 16, 10, 7, [ICE[0], ICE[1], ICE[2]], 1.2);
      p.ellipse(15, 17, 3, 2, ['#0a1420', '#16263a'], 1.1);
      p.line(10, 13, 16, 11, '#ffffff', 1.4);
    }
  },
  face(p, rng, x, y, w, h) {
    // great blocks of ice, blue at the heart and white at the edges, icicles hanging from the cap
    const P = this.pal;
    const ICE = P.bone;
    p.rect(x, y, w, h, P.stone[1], 0);
    let yy = y + 1;
    while (yy < y + h - 3) {
      const bh = rng.int(9, 14);
      let xx = x - rng.int(0, 6);
      while (xx < x + w) {
        const bw = rng.int(10, 16);
        const x0 = Math.max(x, xx);
        const x1 = Math.min(x + w, xx + bw - 1);
        if (x1 - x0 > 2) {
          p.bevelRect(x0, yy, x1 - x0, Math.min(bh - 1, y + h - yy - 1), [P.stone[2], P.stone[3], ICE[0], ICE[1]], 2.4, 1);
          // the clear heart of the block, and a white glint
          p.rect(x0 + 2, yy + 2, Math.max(1, x1 - x0 - 5), Math.max(1, bh - 6), P.stone[3], 2.2);
          p.line(x0 + 2, yy + 2, x0 + 5, yy + 2, ICE[3], 2.8);
        }
        xx += bw;
      }
      yy += bh;
    }
    // icicles from the cap
    for (let ix = x + 1; ix < x + w - 1; ix += rng.int(2, 4)) {
      const len = rng.int(2, 8);
      for (let k = 0; k < len; k++) p.px(ix, y + k, k < len - 1 ? ICE[2] : ICE[3], 3.2 - k * 0.1);
    }
    for (let i = 0; i < 24; i++) p.tint(x + rng.int(0, w - 1), y + h - rng.int(1, 10), '#ffffff', 0.25); // frost creeping up from below
  },
  decorA(p) {
    // someone frozen into the wall, a dark shape behind the ice
    const P = this.pal;
    p.rect(8, 22, 16, 22, P.bone[1], 0.6);
    p.ellipse(16, 27, 3, 3, ['#0a1420', '#16263a'], 0.8);
    p.rect(13, 30, 7, 10, '#16263a', 0.8);
    p.line(12, 31, 9, 38, '#16263a', 0.8);
    p.line(20, 31, 23, 36, '#16263a', 0.8);
    p.line(9, 23, 14, 23, '#ffffff', 1.4);
    p.tint(16, 30, '#c8e0f2', 0.4);
  },
  decorB(p) {
    // a cluster of frost crystals growing from the foot of the wall
    const P = this.pal;
    for (const [x, h, w] of [[9, 12, 2], [13, 18, 3], [17, 14, 2], [21, 9, 2]]) {
      for (let k = 0; k < h; k++) p.hline(x - Math.round(w * (1 - k / h)), x + Math.round(w * (1 - k / h)), 42 - k, P.bone[k > h * 0.6 ? 3 : 2], 1 + k * 0.05);
      p.lit(x, 42 - h, '#ffffff', 2, 0.8);
    }
  },
};
const SUNKEN = { ...HALLS, key: 'sunken', seed: 1000, pal: CHAPTERS.sunken };
// the Amethyst Caverns: rough cave rock shot through with glowing crystal veins; geodes and crystal clusters
const AMETHYST = {
  ...CATA,
  key: 'amethyst',
  seed: 1100,
  pal: CHAPTERS.amethyst,
  accent: CHAPTERS.amethyst.moss,
  floorWeights: [6, 6, 6, 6, 1.4, 1.0, 1.6, 1.4, 1.0, 0.8],
  floor(p, rng, v) {
    const P = this.pal;
    const C = P.bone;
    // rough cave floor: lumpy stone, not laid slabs
    p.rect(0, 0, T, T, P.stone[1], 0);
    for (let i = 0; i < 9; i++) p.ellipse(rng.int(2, 29), rng.int(2, 29), rng.float(3, 7), rng.float(2.5, 5), P.stone.slice(rng.int(1, 2), 6), 1.4);
    for (let i = 0; i < 16; i++) p.px(rng.int(0, 31), rng.int(0, 31), P.stone[0], 0.2);
    if (v === 4 || v === 5) crack(p, rng, P, rng.int(6, 12), rng.int(5, 10), 16, C);
    if (v === 6 || v === 9) {
      // shards of crystal scattered on the floor
      for (let i = 0; i < (v === 9 ? 5 : 3); i++) {
        const x = rng.int(4, 26);
        const y = rng.int(6, 26);
        p.line(x, y, x + rng.int(-2, 2), y - rng.int(3, 6), C[2], 2.2);
        p.lit(x, y - 2, C[3], 2.4, 0.6);
      }
    }
    if (v === 7) for (let i = 0; i < 6; i++) p.lit(rng.int(3, 28), rng.int(3, 28), C[rng.int(2, 3)], 1.8, 0.5); // a scatter of tiny glints
  },
  face(p, rng, x, y, w, h) {
    // rough rock, lumped and shadowed, with seams of crystal glowing through it
    const P = this.pal;
    const C = P.bone;
    p.rect(x, y, w, h, P.stone[1], 0);
    for (let i = 0; i < Math.floor((w * h) / 55); i++) p.ellipse(x + rng.int(2, w - 3), y + rng.int(2, h - 3), rng.float(3, 6), rng.float(2.5, 4.5), P.stone.slice(rng.int(1, 3), 6), 1.8);
    // a crystal vein or two, running at a slant
    for (let v = 0; v < rng.int(1, 2); v++) {
      let vx = x + rng.int(0, w - 1);
      let vy = y + rng.int(2, 8);
      for (let k = 0; k < h - 8; k++) {
        p.lit(vx, vy, C[k % 5 === 0 ? 3 : 2], 2.6, 0.7);
        vy++;
        if (rng.chance(0.5)) vx += rng.pick([-1, 1]);
        if (vx < x || vx >= x + w || vy >= y + h) break;
      }
    }
    // now and then a crystal juts out of the rock
    if (rng.chance(0.6)) {
      const cx = x + rng.int(4, w - 5);
      const cy = y + rng.int(10, h - 6);
      for (let k = 0; k < 6; k++) p.hline(cx - Math.round(2 * (1 - k / 6)), cx + Math.round(2 * (1 - k / 6)), cy - k, C[k > 3 ? 3 : 2], 3 + k * 0.1);
    }
  },
  decorA(p) {
    // a geode: a dark hollow lined with glowing crystal points
    const P = this.pal;
    const C = P.bone;
    p.ellipse(16, 32, 10, 8, ['#0a0410', '#14081e'], -2, false);
    for (let a = 0; a < 12; a++) {
      const t = (a / 12) * Math.PI * 2;
      const x0 = 16 + Math.cos(t) * 9;
      const y0 = 32 + Math.sin(t) * 7;
      p.line(x0, y0, 16 + Math.cos(t) * 5, 32 + Math.sin(t) * 4, C[a % 2 ? 2 : 3], 0.4);
    }
    p.glow(16, 32, C[2], 0.8);
  },
  decorB(p) {
    // a great crystal cluster growing out of the foot of the wall
    const P = this.pal;
    const C = P.bone;
    for (const [x, h, w, lean] of [[8, 10, 2, -1], [13, 20, 3, 0], [19, 15, 3, 1], [24, 8, 2, 1]]) {
      for (let k = 0; k < h; k++) {
        const half = Math.round(w * (1 - k / h));
        const xx = x + Math.round((lean * k) / 4);
        p.hline(xx - half, xx + half, 42 - k, C[k > h * 0.7 ? 3 : k > h * 0.3 ? 2 : 1], 1 + k * 0.06);
      }
      p.lit(x + Math.round((lean * h) / 4), 42 - h, C[3], 2, 1);
    }
    p.glow(16, 34, C[2], 0.7);
  },
};
const HEART = { ...HOLLOW, key: 'heart', seed: 1200, pal: CHAPTERS.heart };
const GATEHOUSE = { ...CELLS, key: 'gatehouse', seed: 700, pal: CHAPTERS.gatehouse, accent: CHAPTERS.gatehouse.moss };
const CISTERN = { ...CELLS, key: 'cistern', seed: 400, pal: CHAPTERS.cistern, accent: CHAPTERS.cistern.moss };
const CHAPEL = { ...CATA, key: 'chapel', seed: 500, pal: CHAPTERS.chapel, accent: CHAPTERS.chapel.moss };
const FORGE = { ...HALLS, key: 'forge', seed: 600, pal: CHAPTERS.forge, accent: CHAPTERS.forge.ash };

export const TILESETS = {
  cistern: makeTileset(CISTERN),
  gatehouse: makeTileset(GATEHOUSE),
  rootdeep: makeTileset(ROOTDEEP),
  frozen: makeTileset(FROZEN),
  sunken: makeTileset(SUNKEN),
  amethyst: makeTileset(AMETHYST),
  heart: makeTileset(HEART),
  chapel: makeTileset(CHAPEL),
  forge: makeTileset(FORGE),
  cells: makeTileset(CELLS),
  catacombs: makeTileset(CATA),
  hollow: makeTileset(HOLLOW),
  halls: makeTileset(HALLS),
};
