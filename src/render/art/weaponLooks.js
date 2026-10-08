// How the found weapons look in a hero's hands (looks drawn on top of the body, like relic looks).
// Each takes (p, dir, b, pose) like the other accessories; dir is 'down' | 'up' | 'right'.
// Melee weapons share one rule for where the hands are in each pose (the same as the Arming Sword):
// raised behind the head on the wind-up, swept forward on the strike, held low otherwise.

import { SHARED as S } from '../../data/palettes.js';
import { limb, shape } from './artKit.js';

const I = S.iron;
const W = S.wood;
const BR = S.brass;
const STEEL = ['#2e2e36', '#4a4a54', '#6e6e7a', '#9a9aa6', '#d0d0da', '#f0f0f8'];
const FIRE = ['#a03008', '#e05a10', '#ff9a30', '#ffe080'];

/** Where the hands hold a melee weapon, and which way it points: [gx, gy, tx, ty, h]. */
function meleeLine(dir, b, pose, len = 1) {
  const t = pose.throwPose;
  let g;
  if (dir === 'right') {
    g = t === 'wind' ? [12, 10 + b, 6, 1 + b, 7] : t === 'release' ? [22, 16 + b, 31, 18 + b, 7] : [18, 20 + b, 22, 29 + b, 6.4];
  } else {
    const x = dir === 'up' ? 21 : 9;
    const h = dir === 'up' ? 3.6 : 7;
    g = t === 'wind' ? [x, 9 + b, x, 0 + b, h] : t === 'release' ? [x + 1, 20 + b, x + 1, 30, h] : [x, 20 + b, x, 29 + b, h - 0.6];
  }
  const [gx, gy, tx, ty, h] = g;
  return [gx, gy, gx + (tx - gx) * len, gy + (ty - gy) * len, h];
}

function perp(gx, gy, tx, ty) {
  const l = Math.hypot(tx - gx, ty - gy) || 1;
  let nx = -(ty - gy) / l;
  let ny = (tx - gx) / l;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  return [nx, ny, (tx - gx) / l, (ty - gy) / l];
}

export const WEAPON_LOOKS = {
  // ---------------------------------------------------------------- melee
  longsword(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = meleeLine(dir, b, pose, 1.45);
    limb(p, gx, gy, tx, ty, 1.1, 0.6, STEEL, h);
    const [nx, ny] = perp(gx, gy, tx, ty);
    p.line(gx - nx * 3, gy - ny * 3, gx + nx * 3, gy + ny * 3, BR[2], h + 0.4); // a long crossguard
  },
  emberblade(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = meleeLine(dir, b, pose, 1.1);
    limb(p, gx, gy, tx, ty, 1.2, 0.6, ['#3a1008', '#6a2010', '#a03a18', '#e06a30'], h);
    for (let k = 0.3; k <= 1; k += 0.15) p.lit(gx + (tx - gx) * k, gy + (ty - gy) * k, k > 0.8 ? FIRE[3] : FIRE[2], h + 0.2, 1.4);
    const [nx, ny] = perp(gx, gy, tx, ty);
    p.line(gx - nx * 2, gy - ny * 2, gx + nx * 2, gy + ny * 2, BR[2], h + 0.4);
  },
  greataxe(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = meleeLine(dir, b, pose, 1.25);
    limb(p, gx, gy, tx, ty, 0.9, 0.9, W, h);
    const [nx, ny, ux, uy] = perp(gx, gy, tx, ty);
    // a broad bearded head near the end
    const at = (a, o) => [tx - ux * a + nx * o, ty - uy * a + ny * o];
    shape(p, [at(0, 0), at(-1, 4), at(1, 7), at(5, 7), at(7, 3), at(5, 0)], STEEL, h + 0.3, { flat: 0.4, soft: 2 });
    const [ex, ey] = at(2, 7);
    p.px(ex, ey, STEEL[5], h + 0.6);
  },
  warhammer(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = meleeLine(dir, b, pose, 1.15);
    limb(p, gx, gy, tx, ty, 0.8, 0.8, W, h);
    const [nx, ny] = perp(gx, gy, tx, ty);
    // a squared head across the haft's end
    limb(p, tx - nx * 3, ty - ny * 3, tx + nx * 4, ty + ny * 4, 2.2, 2.2, I.slice(1, 6), h + 0.4);
    p.px(tx + nx * 4, ty + ny * 4, I[6], h + 0.7);
  },
  flail(p, dir, b, pose) {
    const [gx, gy, tx, ty, h] = meleeLine(dir, b, pose, 0.45);
    limb(p, gx, gy, tx, ty, 1, 0.9, W, h);
    // the chain and the spiked ball, swinging out from the handle
    const t = pose.throwPose;
    const bx = tx + (t === 'release' ? 8 : t === 'wind' ? -6 : 2);
    const by = ty + (t === 'wind' ? -4 : 6);
    for (let k = 0; k <= 1; k += 0.2) p.px(tx + (bx - tx) * k, ty + (by - ty) * k, I[4], h + 0.2);
    p.ellipse(bx, by, 2.4, 2.4, I.slice(1, 6), h + 0.4);
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) p.px(bx + dx, by + dy, I[6], h + 0.5);
  },
  daggers(p, dir, b, pose) {
    // one in each hand, short and quick
    const [gx, gy, tx, ty, h] = meleeLine(dir, b, pose, 0.6);
    limb(p, gx, gy, tx, ty, 0.8, 0.4, STEEL, h);
    p.px(gx, gy, BR[2], h + 0.4);
    const off = dir === 'right' ? -6 : dir === 'up' ? -12 : 12;
    limb(p, gx + off, gy + 2, tx + off, ty + 2, 0.8, 0.4, STEEL, h - 0.5);
    p.px(gx + off, gy + 2, BR[2], h);
  },

  // ---------------------------------------------------------------- bows and crossbows
  longbow(p, dir, b, pose) {
    const t = pose.throwPose;
    const drawn = t === 'wind' ? 3 : 0;
    const x = dir === 'right' ? (t ? 20 : 17) : dir === 'up' ? 21 : 9;
    const hh = dir === 'up' ? 3.4 : 7;
    // a tall stave, bowed, with its string (pulled back on the draw)
    for (let i = 0; i <= 22; i++) {
      const y = 5 + i + b;
      const bow = Math.sin((i / 22) * Math.PI) * 3;
      p.px(x + (dir === 'right' ? bow : -bow * 0.3), y, W[2 + (i % 2)], hh);
    }
    p.line(x, 5 + b, x - drawn, 16 + b, '#d8d0b0', hh + 0.1);
    p.line(x - drawn, 16 + b, x, 27 + b, '#d8d0b0', hh + 0.1);
    if (t === 'wind' && dir === 'right') p.line(x - drawn, 16 + b, x + 8, 16 + b, W[3], hh + 0.2); // the arrow, nocked
  },
  huntbow(p, dir, b, pose) {
    const t = pose.throwPose;
    const x = dir === 'right' ? (t ? 21 : 18) : dir === 'up' ? 21 : 9;
    const hh = dir === 'up' ? 3.4 : 7;
    for (let i = 0; i <= 13; i++) {
      const bow = Math.sin((i / 13) * Math.PI) * 3.4;
      p.px(x + (dir === 'right' ? bow : -bow * 0.3), 10 + i + b, ['#3a2414', '#5a3a1e', '#7a5028'][i % 3], hh);
    }
    p.line(x, 10 + b, x, 23 + b, '#d8d0b0', hh + 0.1);
    p.px(x + 2, 9 + b, '#c02634', hh + 0.2); // a red fletch tied to the tip
  },
  arbalest(p, dir, b, pose) {
    const t = pose.throwPose;
    if (dir === 'right') {
      const y = t ? 13 + b : 18 + b;
      const x = t === 'release' ? 18 : 15;
      limb(p, x - 6, y, x + 8, y, 1.6, 1.6, W, 6.5); // a long, heavy stock
      limb(p, x + 7, y - 6, x + 7, y + 6, 1.2, 1.2, I.slice(1, 6), 6.6); // a steel bow
      p.line(x + 7, y - 6, x + 1, y, '#d8d0b0', 6.7);
      p.line(x + 7, y + 6, x + 1, y, '#d8d0b0', 6.7);
      p.ellipse(x - 5, y + 2, 2, 2, I.slice(2, 5), 6.8); // the winch
      if (t !== 'release') p.line(x, y, x + 11, y, I[5], 6.9);
      return;
    }
    const y = t ? 10 + b : 18 + b;
    const x0 = dir === 'up' ? 17 : 8;
    const hh = dir === 'up' ? 3.5 : 6.5;
    limb(p, x0, y, x0 + 8, y, 1.4, 1.4, W, hh);
    limb(p, x0 - 2, y - 2, x0 + 10, y - 2, 1, 1, I.slice(1, 6), hh + 0.1);
  },
  repeater(p, dir, b, pose) {
    const t = pose.throwPose;
    const right = dir === 'right';
    const y = t ? (right ? 13 : 10) + b : 18 + b;
    const x = right ? (t === 'release' ? 19 : 16) : dir === 'up' ? 18 : 9;
    const hh = dir === 'up' ? 3.5 : 6.5;
    if (right) {
      p.line(x - 4, y, x + 7, y, W[3], hh);
      p.line(x + 6, y - 4, x + 6, y + 4, W[4], hh + 0.1);
      p.line(x + 6, y - 4, x + 3, y, '#d8d0b0', hh + 0.2);
      p.line(x + 6, y + 4, x + 3, y, '#d8d0b0', hh + 0.2);
      p.bevelRect(x - 1, y - 5, 6, 4, W.slice(1, 5), hh + 0.3, 1); // the box of bolts
      p.line(x - 4, y - 2, x - 2, y - 6, I[4], hh + 0.3); // the lever
      return;
    }
    p.line(x, y, x + 6, y, W[3], hh);
    p.line(x - 1, y - 2, x + 7, y - 2, W[4], hh + 0.1);
    p.bevelRect(x + 1, y - 6, 4, 3, W.slice(1, 5), hh + 0.2, 1);
  },
  firebow(p, dir, b, pose) {
    const t = pose.throwPose;
    const right = dir === 'right';
    const y = t ? (right ? 13 : 10) + b : 18 + b;
    const x = right ? (t === 'release' ? 19 : 16) : dir === 'up' ? 18 : 9;
    const hh = dir === 'up' ? 3.5 : 6.5;
    if (right) {
      p.line(x - 4, y, x + 7, y, '#3a1a10', hh);
      p.line(x + 6, y - 4, x + 6, y + 4, '#6a2a14', hh + 0.1);
      p.line(x + 6, y - 4, x + 3, y, '#d8d0b0', hh + 0.2);
      p.line(x + 6, y + 4, x + 3, y, '#d8d0b0', hh + 0.2);
      if (t !== 'release') {
        p.line(x, y, x + 9, y, I[4], hh + 0.3);
        p.lit(x + 10, y, FIRE[2], hh + 0.4, 1.6); // a burning tip
        p.lit(x + 10, y - 1, FIRE[3], hh + 0.4, 1.6);
      }
      return;
    }
    p.line(x, y, x + 6, y, '#3a1a10', hh);
    p.line(x - 1, y - 2, x + 7, y - 2, '#6a2a14', hh + 0.1);
    p.lit(x + 3, y - 3, FIRE[2], hh + 0.2, 1.4);
  },
};
