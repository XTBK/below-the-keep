// Doors. Frames are arranged kind * 3 + state:
//   kinds:  0 normal, 1 armoury (gilded), 2 boss (horned, red glow), 3 secret (a hole blasted in the wall)
//   states: 0 open, 1 barred (room is locked during a fight), 2 locked (needs a key)
//
// The top-wall door is seen face-on (48 x 64). The left-wall door is seen from above (32 x 48);
// right = mirrored left, bottom = left rotated so its room side faces up.

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CHAPTERS } from '../../data/palettes.js';

// set per call from the chapter palette (doors are drawn in each chapter's stone)
let STONE = CHAPTERS.cells.stone;
let MORTAR = CHAPTERS.cells.mortar;
function usePalette(pal) {
  STONE = pal.stone;
  MORTAR = pal.mortar;
}
export const DOOR_KINDS = ['normal', 'armoury', 'boss', 'secret'];
export const DOOR_STATES = ['open', 'barred', 'locked'];
export const DOOR_FRAMES = DOOR_KINDS.length * DOOR_STATES.length;

const FACE_TILT = -1.1;
const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const BOSS_STONE = ['#100a0c', '#1e1216', '#2e1a1e', '#42242a', '#5a3036'];
const GLOW = ['#0e0303', '#220505', '#3e0909', '#5e1210'];

// ---------------------------------------------------------------------------------------------
// Top wall door (face-on)
// ---------------------------------------------------------------------------------------------
const TW = 48;
const TH = 64;
const ARCH_CX = 24;
const ARCH_CY = 30;
const ARCH_IN = 14; // inner radius = half the opening width
const ARCH_OUT = 22;

function inOpening(x, y) {
  if (x < ARCH_CX - ARCH_IN || x >= ARCH_CX + ARCH_IN) return false;
  if (y >= ARCH_CY) return true;
  return Math.hypot(x + 0.5 - ARCH_CX, y + 0.5 - ARCH_CY) < ARCH_IN;
}

function inSurround(x, y) {
  if (inOpening(x, y)) return false;
  if (y >= ARCH_CY) return x >= ARCH_CX - ARCH_OUT && x < ARCH_CX + ARCH_OUT;
  return Math.hypot(x + 0.5 - ARCH_CX, y + 0.5 - ARCH_CY) < ARCH_OUT;
}

function archSurround(p, rng, ramp, accent) {
  for (let y = 0; y < TH; y++) {
    for (let x = 0; x < TW; x++) {
      if (!inSurround(x, y)) continue;
      // split the surround into blocks: radial voussoirs above, stacked jamb stones below
      let edge = false;
      if (y < ARCH_CY) {
        const a = Math.atan2(y + 0.5 - ARCH_CY, x + 0.5 - ARCH_CX);
        const seg = (a + Math.PI) / (Math.PI / 7);
        edge = Math.abs(seg - Math.round(seg)) < 0.09;
      } else {
        edge = (y - ARCH_CY) % 9 === 8;
      }
      const r = y < ARCH_CY ? Math.hypot(x + 0.5 - ARCH_CX, y + 0.5 - ARCH_CY) : Math.abs(x + 0.5 - ARCH_CX);
      const t = (r - ARCH_IN) / (ARCH_OUT - ARCH_IN); // 0 inner .. 1 outer
      let c = ramp[2];
      if (t < 0.2) c = ramp[3];
      else if (t > 0.85) c = ramp[1];
      if (edge) c = MORTAR[0];
      p.px(x, y, c, edge ? 1 : 3.2 - Math.abs(t - 0.4) * 2);
    }
  }
  // keystone
  p.bevelRect(ARCH_CX - 3, ARCH_CY - ARCH_OUT - 1, 6, 9, accent || ramp, 4, 1);
  // stain + wear
  for (let i = 0; i < 18; i++) {
    const x = rng.int(0, TW - 1);
    const y = rng.int(0, TH - 1);
    if (inSurround(x, y)) p.tint(x, y, MORTAR[1], 0.3);
  }
}

function fillOpening(p, colorAt, h = -3) {
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) if (inOpening(x, y)) p.px(x, y, colorAt(x, y), h);
}

function darkPassage(p, glow) {
  fillOpening(p, (x, y) => {
    if (glow) return y > 54 ? GLOW[2] : y > 44 ? GLOW[1] : GLOW[0];
    // a few steps faintly visible going down into the dark
    if (y > 57) return STONE[2];
    if (y > 52) return y === 53 ? STONE[2] : STONE[1];
    return y > 44 ? '#0a0a0e' : '#050507';
  });
}

function portcullis(p, ironRamp) {
  for (let bx = ARCH_CX - ARCH_IN + 2; bx < ARCH_CX + ARCH_IN; bx += 5) {
    for (let y = 0; y < TH; y++) {
      if (!inOpening(bx, y)) continue;
      p.px(bx, y, ironRamp[2], 2);
      p.px(bx + 1, y, ironRamp[1], 2);
    }
    p.px(bx, TH - 1, ironRamp[4], 2.5); // spike tips
  }
  for (const by of [36, 50]) {
    for (let x = ARCH_CX - ARCH_IN; x < ARCH_CX + ARCH_IN; x++) {
      p.px(x, by, ironRamp[3], 2.4);
      p.px(x, by + 1, ironRamp[1], 2.2);
    }
  }
}

function plankDoor(p, heavyIron) {
  const ramp = heavyIron ? S.iron.slice(0, 4) : S.wood.slice(1, 5);
  fillOpening(p, (x, y) => {
    const plank = Math.floor((x - (ARCH_CX - ARCH_IN)) / 7);
    const seam = (x - (ARCH_CX - ARCH_IN)) % 7 === 0;
    if (seam) return ramp[0];
    return ramp[1 + ((plank + (y > 40 ? 1 : 0)) % 2)];
  }, 1.5);
  // iron bands with rivets
  for (const by of [38, 54]) {
    for (let x = ARCH_CX - ARCH_IN; x < ARCH_CX + ARCH_IN; x++) {
      p.px(x, by, S.iron[3], 2.4);
      p.px(x, by + 1, S.iron[2], 2.2);
      if ((x - ARCH_CX) % 6 === 0) p.px(x, by, S.iron[5], 2.8);
    }
  }
  // padlock
  p.ellipse(ARCH_CX, 44, 2.6, 2.6, S.iron.slice(2, 6), 3); // shackle ring
  p.px(ARCH_CX, 44, ramp[1], 2);
  p.bevelRect(ARCH_CX - 3, 45, 6, 6, S.brass, 4, 1);
  p.px(ARCH_CX, 47, '#1a120a', 3); // keyhole
  p.px(ARCH_CX, 48, '#1a120a', 3);
}

function horns(p) {
  // two curved horns sweeping up from the top corners of the arch
  for (const side of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const t = i / 11;
      const x = Math.round(ARCH_CX + side * (ARCH_OUT - 1 + t * 3 - t * t * 6));
      const y = Math.round(ARCH_CY - 6 - t * 22);
      const w = Math.max(1, Math.round(3 * (1 - t)));
      for (let k = 0; k < w; k++) p.px(x + side * k, y, BONE[2 + (k === 0 ? 1 : 0)], 4);
      p.px(x - side, y, BONE[0], 3);
    }
  }
}

function crown(p) {
  // tiny gilded crown on the keystone (armoury)
  const y = ARCH_CY - ARCH_OUT + 1;
  p.hline(ARCH_CX - 2, ARCH_CX + 1, y + 3, S.brass[3], 5);
  p.px(ARCH_CX - 2, y + 2, S.brass[3], 5);
  p.px(ARCH_CX, y + 1, S.brass[3], 5);
  p.px(ARCH_CX + 1, y + 2, S.brass[2], 5);
  p.px(ARCH_CX - 1, y + 2, '#c02634', 5); // a ruby
}

function blastHole(p, rng) {
  // ragged hole: no arch, chunks of rubble at the bottom
  for (let y = 18; y < TH; y++) {
    for (let x = 6; x < TW - 6; x++) {
      const nx = (x - ARCH_CX) / 15;
      const ny = (y - 46) / 26;
      const wobble = Math.sin(x * 1.7 + y * 0.9) * 0.08 + Math.sin(y * 2.3) * 0.06;
      if (nx * nx + ny * ny < 1 + wobble) p.px(x, y, y > 56 ? '#0c0c10' : '#050507', -3);
    }
  }
  for (let i = 0; i < 12; i++) {
    const x = rng.int(8, TW - 9);
    const y = rng.int(56, TH - 2);
    p.ellipse(x, y, rng.float(1.5, 3), rng.float(1, 2), STONE.slice(2, 6), 2);
  }
}

export function doorTop(frame, pal = CHAPTERS.cells) {
  usePalette(pal);
  const kind = Math.floor(frame / 3);
  const state = frame % 3;
  const rng = new Rng(7000 + frame);
  const p = new Painter(TW, TH);
  if (kind === 3) {
    blastHole(p, rng);
  } else {
    const ramp = kind === 2 ? BOSS_STONE : STONE.slice(1, 6);
    const accent = kind === 1 ? S.brass : null;
    archSurround(p, rng, ramp, accent);
    if (kind === 1) {
      // gilded trim along the inner edge of the arch
      for (let y = 0; y < TH; y++) {
        for (let x = 0; x < TW; x++) {
          if (!inSurround(x, y)) continue;
          const touchesOpening = inOpening(x - 1, y) || inOpening(x + 1, y) || inOpening(x, y + 1);
          if (touchesOpening) p.px(x, y, (x + y) % 3 === 0 ? S.brass[3] : S.brass[2], 3.4);
        }
      }
      crown(p);
    }
    darkPassage(p, kind === 2);
    if (state === 1) portcullis(p, S.iron);
    if (state === 2) plankDoor(p, kind === 2);
    if (kind === 2) horns(p);
  }
  p.setTilt(0, 16, TW, TH - 16, 0, FACE_TILT);
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// Left wall door (seen from above). The room is on the RIGHT side (x = 31).
// ---------------------------------------------------------------------------------------------
const SW = 32;
const SH = 48;

function jambs(p, rng, ramp, accent) {
  for (const y0 of [0, 40]) {
    p.bevelRect(0, y0, SW, 8, ramp, 4, 1);
    if (accent) {
      p.hline(4, SW - 4, y0 + 3, accent[2], 4.5);
      p.px(SW - 6, y0 + 3, accent[3], 5);
    }
    for (let i = 0; i < 4; i++) p.tint(rng.int(1, SW - 2), y0 + rng.int(1, 6), MORTAR[1], 0.4);
  }
  // the jambs' faces toward the opening tilt slightly inward
  p.setTilt(0, 7, SW, 1, 0, -0.8);
  p.setTilt(0, 40, SW, 1, 0, 0.8);
}

function passageFloor(p, glow) {
  for (let y = 8; y < 40; y++) {
    for (let x = 0; x < SW; x++) {
      const t = x / (SW - 1); // dark outside -> lit near the room
      let c;
      if (glow) c = t > 0.85 ? GLOW[3] : t > 0.6 ? GLOW[2] : t > 0.3 ? GLOW[1] : GLOW[0];
      else c = t > 0.75 ? STONE[2] : t > 0.45 ? STONE[1] : t > 0.2 ? '#0c0c10' : '#050507';
      p.px(x, y, c, 0);
    }
  }
  // slab seams in the passage floor
  for (let y = 8; y < 40; y += 11) for (let x = 14; x < SW; x++) p.px(x, y, MORTAR[0], 0);
}

export function doorLeft(frame, pal = CHAPTERS.cells) {
  usePalette(pal);
  const kind = Math.floor(frame / 3);
  const state = frame % 3;
  const rng = new Rng(7500 + frame);
  const p = new Painter(SW, SH);
  if (kind === 3) {
    // rough breach through the wall cap
    for (let y = 4; y < SH - 4; y++) {
      const inset = Math.round(Math.abs(Math.sin(y * 1.3)) * 3 + (y < 9 || y > 38 ? 3 : 0));
      for (let x = 0; x < SW; x++) p.px(x, y, x > SW - 8 ? '#101014' : '#050507', -2);
      for (let k = 0; k < inset; k++) {
        p.px(k, y, STONE[2], 1);
        p.px(SW - 1 - k, y, STONE[2], 1);
      }
    }
    for (let i = 0; i < 10; i++) p.ellipse(rng.int(18, 30), rng.int(8, 40), rng.float(1.2, 2.5), rng.float(1, 2), STONE.slice(2, 6), 2);
    p.outline(S.outline);
    return p;
  }
  const ramp = kind === 2 ? BOSS_STONE : STONE.slice(1, 6);
  jambs(p, rng, ramp, kind === 1 ? S.brass : null);
  passageFloor(p, kind === 2);
  if (state === 1) {
    // portcullis seen from above: a row of bar tops along the wall line
    p.rect(22, 8, 3, 32, S.iron[1], 3);
    for (let y = 9; y < 40; y += 4) {
      p.px(22, y, S.iron[4], 3.5);
      p.px(23, y, S.iron[3], 3.5);
    }
  }
  if (state === 2) {
    // closed door seen from above: a thick wooden leaf with a lock bump
    const r = kind === 2 ? S.iron : S.wood;
    p.rect(20, 8, 6, 32, r[2], 3);
    p.vline(20, 8, 39, r[3], 3.2);
    for (let y = 12; y < 40; y += 8) p.hline(20, 25, y, S.iron[3], 3.4);
    p.bevelRect(26, 21, 3, 6, S.brass, 4, 1);
  }
  if (kind === 2) {
    // bone spikes jutting out from the jambs toward the room
    for (const y of [2, 44]) {
      for (let i = 0; i < 6; i++) p.px(SW - 6 + i, y + (i > 3 ? (y < 20 ? 1 : -1) : 0), BONE[i < 3 ? 2 : 3], 5);
    }
  }
  p.outline(S.outline);
  return p;
}

export function doorRight(frame, pal) {
  return doorLeft(frame, pal).mirrored();
}

export function doorBottom(frame, pal) {
  return doorLeft(frame, pal).rotatedCCW();
}
