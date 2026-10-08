// Wren the wizard: a long grey travelling robe, a tall floppy pointed hat with a wide brim, a white
// beard, and a wand with a glowing tip. 32x32 frames, the same poses and rows as wrenArt.js
// (rows: down, up, right [left is mirrored]; cols: idle x2, walk x4, cast wind-up, cast release).
// y points DOWN.

import { Painter } from '../Painter.js';
import { SHARED as S } from '../../data/palettes.js';

export const ROBE = ['#1c1c22', '#2e2e36', '#44444e', '#5e5e6a', '#7c7c88', '#9c9ca8'];
const HAT = ['#1a1a20', '#2c2c34', '#40404a', '#585862', '#72727c'];
const BEARD = ['#8a8a84', '#b4b4ac', '#d8d8d0', '#f2f2ea'];
const WAND = ['#2a1a10', '#4a3020', '#6e4a30', '#8e6440'];
const ROPE = ['#5a4a30', '#8a7650', '#b09c70'];
const GLOW = '#c8e8ff';
const BOOT = S.leather.slice(0, 3);

function wandTip(p, x, y, h, bright = 1) {
  p.lit(x, y, GLOW, h + 0.4, 1.4 * bright);
  p.lit(x, y - 1, '#ffffff', h + 0.5, 1.2 * bright);
  if (bright > 1) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -2], [0, 1]]) p.lit(x + dx, y + dy, '#8ac8ff', h + 0.3, 0.9);
}

/** The hat: wide brim, a tall cone whose tip flops to one side. */
function hat(p, cx, b, dir) {
  const flop = dir === 'right' ? -1 : 1;
  // brim
  p.ellipse(cx, 5.5 + b, dir === 'right' ? 7 : 8, 1.8, HAT, 8);
  p.hline(cx - (dir === 'right' ? 6 : 7), cx + (dir === 'right' ? 6 : 7), 6 + b, HAT[1], 8.2);
  // cone
  for (let i = 0; i < 5; i++) {
    const w = Math.max(0, 3.5 - i * 0.8);
    p.hline(Math.round(cx - w + i * 0.3 * flop), Math.round(cx + w + i * 0.3 * flop), 4 + b - i, HAT[2 + (i % 2)], 8.6 + i * 0.1);
  }
  // the tip flops over
  p.px(cx + 2 * flop, b - 1, HAT[3], 9.2);
  p.px(cx + 3 * flop, b, HAT[2], 9.1);
  p.px(cx + 4 * flop, b + 1, HAT[2], 9);
  if (dir !== 'up') p.hline(cx - 3, cx + 3, 4 + b, '#4a3a6a', 8.8); // a faded violet band
}

/** The robe, front or back view: shoulders down to the ankles, hem swaying with the stride. */
function robeFront(p, pose, b, back) {
  for (let y = 12; y < 30; y++) {
    const w = 5 + (y - 12) * 0.22;
    const sway = y > 24 ? Math.round((pose.liftL - pose.liftR) * (y - 24) * 0.3) : 0;
    for (let x = Math.round(16 - w); x <= Math.round(16 + w); x++) {
      const edge = x - (16 - w);
      const c = edge < 1.5 ? ROBE[1] : edge > w * 2 - 1.5 ? ROBE[1] : (x + y) % 9 === 0 ? ROBE[2] : ROBE[3];
      p.px(x + sway, y + (y > 27 ? 0 : b), c, 3.5 + Math.min(1.5, edge * 0.3));
    }
  }
  // folds down the front, and the rope belt
  p.vline(14, 19 + b, 28, ROBE[2], 4);
  p.vline(18, 20 + b, 28, ROBE[2], 4);
  p.hline(12, 20, 18 + b, ROPE[1], 5);
  p.hline(13, 19, 19 + b, ROPE[0], 5);
  if (!back) {
    p.vline(15, 19 + b, 22 + b, ROPE[1], 5.2); // the knot hangs down
    p.px(15, 23 + b, ROPE[2], 5.2);
  }
  // boots peeking out under the hem
  for (const [x, lift] of [[12, pose.liftL], [17, pose.liftR]]) p.cyl(x, 28 - lift, 3, 3, BOOT, 2.5);
}

function sleeve(p, x, b, off, dir) {
  // a wide sleeve, the hand just showing
  p.cyl(x - (dir < 0 ? 1 : 0), 13 + b + off, 3, 6, ROBE.slice(1, 5), 4.5);
  p.rect(x - (dir < 0 ? 1 : 0), 18 + b + off, 3, 2, ROBE[2], 4.6);
  p.rect(x, 20 + b + off, 2, 2, S.skin[3], 4.6);
}

function faceFront(p, b) {
  p.ellipse(16, 8.5 + b, 4.4, 4.2, S.skin, 5);
  p.px(14, 8 + b, S.eye, 5.4);
  p.px(18, 8 + b, S.eye, 5.4);
  p.hline(13, 15, 7 + b, BEARD[1], 5.6); // bushy brows
  p.hline(17, 19, 7 + b, BEARD[1], 5.6);
  p.px(16, 9 + b, S.skin[2], 5.6); // nose
  // long white hair either side, and the beard
  p.vline(11, 6 + b, 13 + b, BEARD[1], 5);
  p.vline(21, 6 + b, 13 + b, BEARD[0], 5);
  for (let y = 10; y < 19; y++) {
    const w = y < 12 ? 4 : Math.max(0, 4 - (y - 12) * 0.55);
    for (let x = Math.round(16 - w); x <= Math.round(16 + w); x++) p.px(x, y + b, BEARD[(x + y) % 4 === 0 ? 1 : y > 15 ? 2 : 3], 5.8 - (y - 10) * 0.08);
  }
  p.hline(15, 17, 11 + b, BEARD[0], 6); // the mouth, lost in the moustache
}

function faceBack(p, b) {
  p.ellipse(16, 8.5 + b, 4.6, 4.3, BEARD, 5); // a mane of white hair
  p.vline(12, 9 + b, 14 + b, BEARD[1], 5);
  p.vline(20, 9 + b, 14 + b, BEARD[0], 5);
  p.vline(16, 10 + b, 15 + b, BEARD[2], 5.2);
}

function drawFront(pose, back) {
  const p = new Painter(32, 32);
  const b = pose.bob;
  robeFront(p, pose, b, back);
  // the wand hand is his right: viewer's left from the front, viewer's right from behind
  const wandX = back ? 21 : 9;
  const otherX = back ? 9 : 21;
  sleeve(p, otherX, b, back ? pose.armL : pose.armR, back ? -1 : 1);
  if (back) faceBack(p, b);
  else faceFront(p, b);
  const t = pose.throwPose;
  if (t === 'wind') {
    // wand raised high, tip blazing
    p.cyl(wandX, 6 + b, 3, 8, ROBE.slice(1, 5), 6);
    p.rect(wandX, 5 + b, 2, 2, S.skin[3], 6.4);
    p.line(wandX + 1, 4 + b, wandX + (back ? 3 : -1), b, WAND[2], 7);
    wandTip(p, wandX + (back ? 3 : -1), b, 7, 2);
  } else if (t === 'release') {
    // pointing the wand at the foe
    if (back) {
      p.cyl(wandX, 6 + b, 3, 7, ROBE.slice(1, 5), 6);
      p.rect(wandX, 4 + b, 2, 2, S.skin[3], 6.4);
      p.vline(wandX + 1, b, 3 + b, WAND[2], 7);
      wandTip(p, wandX + 1, b, 7, 2);
    } else {
      p.cyl(wandX + 1, 14 + b, 3, 6, ROBE.slice(1, 5), 6);
      p.rect(wandX + 1, 20 + b, 2, 2, S.skin[3], 6.4);
      p.vline(wandX + 2, 22 + b, 26 + b, WAND[2], 7);
      wandTip(p, wandX + 2, 27 + b, 7, 2);
    }
  } else {
    const off = back ? pose.armR : pose.armL;
    sleeve(p, wandX, b, off, back ? 1 : -1);
    // the wand held low at his side
    p.line(wandX + 1, 21 + b + off, wandX + (back ? 2 : 0), 26 + b + off, WAND[2], 5);
    wandTip(p, wandX + (back ? 2 : 0), 26 + b + off, 5, 0.7);
  }
  hat(p, 16, b, back ? 'up' : 'down');
  return p;
}

function drawSide(pose) {
  const p = new Painter(32, 32);
  const b = pose.bob;
  const s = pose.stride;
  const pass = pose.passing || 0;
  // boots under the hem, front and back
  p.cyl(14 - s * 2, 28 - (pass === 1 ? 1 : 0), 4, 3, BOOT.slice(0, 2), 2.4);
  p.cyl(16 + s * 2, 28 - (pass === -1 ? 1 : 0), 4, 3, BOOT, 2.5);
  // the robe, flaring behind him as he walks
  for (let y = 12; y < 29; y++) {
    const w = 4 + (y - 12) * 0.2;
    const trail = y > 20 ? Math.round((y - 20) * 0.25 * (1 + Math.abs(s))) : 0;
    for (let x = Math.round(16 - w - trail); x <= Math.round(16 + w); x++) {
      const c = x < 16 - w + 1 ? ROBE[1] : x > 16 + w - 1 ? ROBE[4] : (x + y) % 8 === 0 ? ROBE[2] : ROBE[3];
      p.px(x, y + (y > 26 ? 0 : b), c, 3.5 + (x - (16 - w)) * 0.15);
    }
  }
  p.hline(12, 20, 18 + b, ROPE[1], 5);
  p.hline(13, 20, 19 + b, ROPE[0], 5);
  // head facing right: big nose, white hair and beard
  p.ellipse(16.5, 8.5 + b, 4.2, 4.2, S.skin, 5);
  p.px(21, 9 + b, S.skin[3], 5.4);
  p.px(19, 8 + b, S.eye, 5.6);
  p.hline(18, 20, 7 + b, BEARD[1], 5.8);
  for (let y = 6; y < 14; y++) p.hline(12, 14, y + b, BEARD[(y % 3) + 1], 5); // hair down his back
  for (let y = 10; y < 18; y++) {
    const w = Math.max(0, 3 - (y - 11) * 0.45);
    for (let x = Math.round(19 - w); x <= Math.round(19 + w); x++) p.px(x, y + b, BEARD[y > 14 ? 2 : 3], 5.8);
  }
  hat(p, 16, b, 'right');
  // the wand arm
  const t = pose.throwPose;
  if (t === 'wind') {
    p.line(16, 14 + b, 12, 10 + b, ROBE[4], 6);
    p.line(16, 15 + b, 12, 11 + b, ROBE[3], 6);
    p.rect(10, 9 + b, 2, 2, S.skin[3], 6.4);
    p.line(10, 8 + b, 8, 4 + b, WAND[2], 7);
    wandTip(p, 8, 3 + b, 7, 2);
  } else if (t === 'release') {
    p.line(16, 15 + b, 22, 15 + b, ROBE[4], 6);
    p.line(16, 16 + b, 22, 16 + b, ROBE[3], 6);
    p.rect(23, 15 + b, 2, 2, S.skin[3], 6.4);
    p.line(25, 15 + b, 29, 14 + b, WAND[2], 7);
    wandTip(p, 30, 14 + b, 7, 2);
  } else {
    const swing = pose.armL * 2;
    p.line(16, 14 + b, 16 + swing, 19 + b, ROBE[4], 6);
    p.line(17, 14 + b, 17 + swing, 19 + b, ROBE[3], 6);
    p.rect(16 + swing, 20 + b, 2, 2, S.skin[3], 6.4);
    p.line(18 + swing, 21 + b, 21 + swing, 24 + b, WAND[2], 6);
    wandTip(p, 21 + swing, 24 + b, 6, 0.7);
  }
  return p;
}

/** Wren as a wizard, for a pose and a facing ('down' | 'up' | 'right'). */
export function wizardFrame(pose, dir) {
  return dir === 'right' ? drawSide(pose) : drawFront(pose, dir === 'up');
}

/**
 * A wand's spell bolt, in the three stone sizes (16 x 16; 'spells' sheet). Drawn pale blue and
 * white so a relic's colour tints it nicely; it is drawn unlit and bright, so it glows and blooms.
 */
export function spellFrame(k) {
  const p = new Painter(16, 16);
  const r = [2.6, 3.6, 4.8][k];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
      if (d > r + 1.6) continue;
      // white core, pale blue body, a soft fringe
      const c = d < r * 0.45 ? '#ffffff' : d < r ? '#cfe4ff' : '#8ab0ff';
      p.px(x, y, c, 2, d < r ? 255 : 150);
    }
  }
  // a four-pointed glint
  for (let i = 1; i <= Math.round(r) + 1; i++) {
    p.px(8 + i, 8, '#ffffff', 2);
    p.px(7 - i, 7, '#ffffff', 2);
    p.px(7, 8 + i, '#e8f0ff', 2);
    p.px(8, 7 - i, '#e8f0ff', 2);
  }
  return p;
}

/**
 * A crossbow quarrel, pointing right (rotated to its flight when drawn), in the three stone sizes
 * (16 x 16; 'quarrels' sheet). Drawn pale so a relic's colour tints the shaft and fletching.
 */
export function quarrelFrame(k) {
  const p = new Painter(16, 16);
  const len = [9, 11, 13][k];
  const x0 = 8 - Math.floor(len / 2);
  const thick = k === 2 ? 2 : 1;
  for (let t = 0; t < thick; t++) p.hline(x0, x0 + len - 3, 8 + t, '#c8b48a', 3); // the shaft
  // a steel head
  p.px(x0 + len - 2, 7, '#e8eef4', 3.5);
  p.px(x0 + len - 2, 8, '#ffffff', 3.6);
  p.px(x0 + len - 2, 9 + (thick - 1), '#e8eef4', 3.5);
  p.px(x0 + len - 1, 8, '#ffffff', 3.6);
  if (thick > 1) p.px(x0 + len - 1, 9, '#e8eef4', 3.6);
  // fletching
  p.px(x0, 6, '#e0d8c8', 3);
  p.px(x0 + 1, 7, '#e0d8c8', 3);
  p.px(x0, 10 + (thick - 1), '#e0d8c8', 3);
  p.px(x0 + 1, 9 + (thick - 1), '#e0d8c8', 3);
  p.outline('#0b0a0d');
  return p;
}
