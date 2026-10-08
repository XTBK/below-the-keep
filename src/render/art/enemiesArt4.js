// Redrawn enemies (the rushed round-bodied ones): the Executioner, the Flail Brute and the Torturer.
// Same layout as the other enemy sheets: 0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death.

import { limb, shape, spots, glowEye } from './artKit.js';
import { makeSheet, stride } from './bossesArt4.js';

const SKIN = ['#2a1410', '#4a2418', '#6e3a26', '#94563a', '#b87452', '#d8946c'];
const LEATHER = ['#0c0808', '#1a1210', '#2a1e18', '#3c2c22', '#4e3a2c', '#624a38'];
const HOOD = ['#050405', '#0c090c', '#161116', '#221a22', '#2e252e'];
const STEEL = ['#1a1a20', '#2e2e36', '#4a4a54', '#6e6e7a', '#9a9aa6', '#d0d0da'];
const WOOD = ['#1a0f08', '#2e1c10', '#4a2e18', '#6a4424', '#8a5c32'];
const BLOOD = ['#2a0406', '#4e080c', '#7a1016', '#a01c20'];
const IRONHOOD = ['#140e0a', '#24180e', '#342414', '#46321c'];

function bodyBase(p, y0, w, chestTop, beltY, legTop, fl, bl, legR = 3.2) {
  // legs in dark breeches, heavy boots
  const cx = p.w / 2;
  limb(p, cx - w * 0.3, legTop + y0, cx - w * 0.32 + bl, p.h - 4, legR, legR * 0.85, LEATHER, 4);
  limb(p, cx + w * 0.3, legTop + y0, cx + w * 0.32 + fl, p.h - 4, legR, legR * 0.85, LEATHER, 4.4);
  for (const fx of [cx - w * 0.32 + bl, cx + w * 0.32 + fl]) p.bevelRect(Math.round(fx - legR - 1), p.h - 5, Math.round(legR * 2 + 3), 4, LEATHER.slice(1), 4, 1);
  // a broad bare chest
  shape(p, [[cx - w / 2, chestTop + y0], [cx + w / 2, chestTop + y0], [cx + w / 2 - 2, beltY + y0], [cx - w / 2 + 2, beltY + y0]], SKIN, 7);
  p.vline(cx, chestTop + 3 + y0, beltY - 1 + y0, SKIN[2], 7.3);
  p.hline(cx - 4, cx - 1, chestTop + 6 + y0, SKIN[2], 7.3);
  p.hline(cx + 1, cx + 4, chestTop + 6 + y0, SKIN[2], 7.3);
  // belt
  p.bevelRect(Math.round(cx - w / 2 + 1), beltY + y0, Math.round(w - 2), 3, LEATHER.slice(2), 7.5, 1);
}

// ===================== THE EXECUTIONER (40 x 44) =====================

export const executionerFrame = makeSheet(40, 44, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(20, 40, 12 + i * 2, 3, BLOOD, 1, false);
    shape(p, [[6, 38 - (2 - i) * 4], [30, 36 - (2 - i) * 4], [32, 42], [4, 42]], SKIN, 5);
    shape(p, [[28, 34 - (2 - i) * 3], [36, 36], [36, 42], [28, 42]], HOOD, 5.5);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const y0 = pose.bob + (k === 'attack' ? 2 : 0);
  // the far arm
  limb(p, 12, 17 + y0, 8, 27 + y0, 2.6, 2.2, SKIN.slice(0, 5), 5);
  bodyBase(p, y0, 20, 14, 26, 29, fl, bl);
  // an apron, blood-dark
  shape(p, [[13, 27 + y0], [27, 27 + y0], [28, 38], [12, 38]], LEATHER, 7.6);
  spots(p, 12, 28, 16, 10, [BLOOD[1], BLOOD[2]], 0.12, 77);
  // the great axe, two-handed
  const sw = { windup: [24, 4, 12, -2], attack: [30, 28, 38, 42] }[k] || [28, 22, 34, 4];
  limb(p, 28, 17 + y0, sw[0], sw[1] + y0, 2.8, 2.4, SKIN, 8.5);
  limb(p, sw[0] + (sw[0] - sw[2]) * 0.2, sw[1] + y0 + (sw[1] - sw[3]) * 0.2, sw[2], sw[3] + y0, 1, 1, WOOD, 9);
  const len = Math.hypot(sw[2] - sw[0], sw[3] - sw[1]) || 1;
  const ux = (sw[2] - sw[0]) / len;
  const uy = (sw[3] - sw[1]) / len;
  let nx = -uy;
  let ny = ux;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  const at = (a, o) => [sw[2] + ux * a + nx * o, sw[3] + y0 + uy * a + ny * o];
  shape(p, [at(1, 0.5), at(2, 3), at(1, 7), at(-2, 8), at(-6, 6), at(-4, 0.5)], STEEL, 9.4, { flat: 0.5, soft: 2 });
  for (const [a, o] of [[1, 6], [-1, 8], [-4, 7]]) {
    const [x, y] = at(a, o);
    p.px(x, y, STEEL[5], 9.8);
  }
  p.ellipse(sw[0], sw[1] + y0, 2.2, 2, SKIN.slice(1), 9.2);
  // the black hood, eyes like coals
  shape(p, [[12, 12 + y0], [28, 12 + y0], [31, 18 + y0], [9, 18 + y0]], HOOD, 9.6);
  shape(p, [[14, 6 + y0], [20, 0 + y0], [26, 6 + y0], [27, 14 + y0], [13, 14 + y0]], HOOD, 10, { soft: 3 });
  glowEye(p, 16, 8 + y0, '#ff3a20', 10.4, 2);
  glowEye(p, 22, 8 + y0, '#ff3a20', 10.4, 2);
});

// ===================== THE FLAIL BRUTE (40 x 40) =====================

export const flailbruteFrame = makeSheet(40, 40, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[4, 34 - (2 - i) * 4], [28, 32 - (2 - i) * 4], [30, 38], [2, 38]], SKIN, 5);
    p.ellipse(34, 35, 4, 3.6, STEEL.slice(1, 5), 4);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const y0 = pose.bob;
  limb(p, 11, 15 + y0, 6, 25 + y0, 2.8, 2.4, SKIN.slice(0, 5), 5);
  bodyBase(p, y0, 22, 11, 23, 26, fl, bl, 3.4);
  // a bandolier of chain across the chest
  for (let t = 0; t < 12; t++) p.px(10 + t * 1.6, 12 + t + y0, t % 2 ? STEEL[4] : STEEL[2], 7.6);
  // the flail: a spiked ball whirling on its chain
  const spin = { windup: -1.2, attack: 0.6, walk: (pose.i || 0) * 1.6 }[k] ?? 2.2;
  const hx = 30;
  const hy = 16 + y0;
  limb(p, 29, 13 + y0, hx, hy, 3, 2.6, SKIN, 8);
  p.ellipse(hx, hy, 2.4, 2.2, SKIN.slice(1), 8.4);
  const r = k === 'attack' ? 14 : 10;
  const bx = hx + Math.cos(spin) * r;
  const by = hy + Math.sin(spin) * r * 0.8;
  for (let t = 1; t < 6; t++) p.px(hx + (bx - hx) * (t / 6), hy + (by - hy) * (t / 6), STEEL[3 + (t % 2)], 8.6);
  p.ellipse(bx, by, 3.4, 3.2, STEEL.slice(1, 5), 9);
  for (let a = 0; a < 6; a++) p.px(bx + Math.cos(a) * 4.4, by + Math.sin(a) * 4, STEEL[5], 9.2);
  if (k === 'attack') for (let a = -1.4; a < 1.4; a += 0.2) p.px(hx + Math.cos(spin + a) * r, hy + Math.sin(spin + a) * r * 0.8, '#d8c8b0', 7); // the swing's arc
  // an iron-banded hood, a jaw like a cinder block
  p.ellipse(20, 8 + y0, 5.6, 5.6, IRONHOOD, 9.6);
  p.hline(15, 25, 7 + y0, STEEL[3], 9.9);
  glowEye(p, 17, 9 + y0, '#ff7a3a', 10, 1);
  glowEye(p, 22, 9 + y0, '#ff7a3a', 10, 1);
});

// ===================== THE TORTURER (32 x 36) =====================

export const torturerFrame = makeSheet(32, 36, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    shape(p, [[3, 30 - (2 - i) * 3], [24, 28 - (2 - i) * 3], [26, 34], [2, 34]], LEATHER, 5);
    p.ellipse(25, 30, 3, 3, SKIN, 5);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const y0 = pose.bob;
  // a long leather coat over a bare chest
  limb(p, 12, 23 + y0, 11 + bl, 33, 2.4, 2, LEATHER, 4);
  limb(p, 20, 23 + y0, 21 + fl, 33, 2.4, 2, LEATHER, 4.4);
  shape(p, [[8, 10 + y0], [24, 10 + y0], [26, 28 + y0], [6, 28 + y0]], LEATHER, 6.6, { folds: 1.2 });
  shape(p, [[12, 11 + y0], [20, 11 + y0], [19, 22 + y0], [13, 22 + y0]], SKIN, 7);
  // a butcher's hook on a chain, in the near hand
  const throwIt = k === 'attack' ? 8 : k === 'windup' ? -6 : 0;
  limb(p, 23, 13 + y0, 27 + throwIt * 0.3, 20 + y0 + Math.min(0, throwIt), 2, 1.7, LEATHER, 7.4);
  const hx = 28 + throwIt * 0.3;
  const hy = 21 + y0 + Math.min(0, throwIt);
  for (let t = 0; t < 4; t++) p.px(hx, hy + t + 1, STEEL[3 + (t % 2)], 7.8);
  for (let a = 0; a < 7; a++) p.px(hx - 2 + Math.cos(a * 0.5) * 2.4, hy + 6 + Math.sin(a * 0.5) * 2.4, STEEL[4], 8);
  limb(p, 9, 13 + y0, 6, 21 + y0, 2, 1.7, LEATHER.slice(0, 5), 6);
  // a leather mask, stitched, with a grin of iron teeth
  p.ellipse(16, 6 + y0, 5, 5.6, LEATHER.slice(1), 8.4);
  for (let y = 2; y < 10; y += 2) p.px(16, y + y0, LEATHER[0], 8.6); // the stitching
  glowEye(p, 13, 5 + y0, '#ffb040', 8.8, 1);
  glowEye(p, 18, 5 + y0, '#ffb040', 8.8, 1);
  for (let x = 13; x <= 19; x += 2) p.px(x, 9 + y0, STEEL[4], 8.8);
});
