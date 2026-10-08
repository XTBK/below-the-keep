// The second bestiary: five more creatures for each chapter (plus the slimelets and embers that
// some of them break into). Same column layout as enemiesArt2.js:
//   0-1 idle, 2-5 walk, 6 wind-up (the telegraph pose), 7 attack, 8-10 death, 11+ extras
// Row 0 faces right, row 1 faces left. y points DOWN (feet near the bottom of the frame).

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CREATURES as C, CHAPTERS } from '../../data/palettes.js';

const IRON = S.iron;
const BONE = CHAPTERS.catacombs.bone;
const H = CHAPTERS.hollow;
const HA = CHAPTERS.halls;
const FUR = ['#1a1612', '#2e2620', '#4a3e32', '#66574a', '#86756a'];
const ROBE = ['#16100c', '#2a1e16', '#40301f', '#58432c'];
const SLIME = ['#16240e', '#2a4216', '#44661e', '#68922c', '#a0c860'];
const LINEN = C.linen;
const BAT = ['#120e14', '#221a26', '#34283a', '#4a3a52'];
const TOAD = ['#1a2410', '#2e3e18', '#4a5c24', '#6a7e34', '#94a858'];
const BARK = H.bark;
const LEAF = H.moss;
const MOLTEN = ['#1a0806', '#3a120a', '#5a1e10', '#7a2a16'];
const MOTLEY_A = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
const MOTLEY_B = ['#3a2a08', '#7a5a14', '#d0aa40', '#f0d880'];

function poseFor(col) {
  if (col < 2) return { k: 'idle', i: col, bob: col, step: -1 };
  if (col < 6) return { k: 'walk', i: col - 2, bob: (col - 2) % 2 ? -1 : 0, step: col - 2 };
  if (col === 6) return { k: 'windup', bob: 0, step: -1 };
  if (col === 7) return { k: 'attack', bob: 0, step: -1 };
  if (col < 11) return { k: 'death', i: col - 8, bob: 0, step: -1 };
  return { k: 'extra', i: col - 11, bob: 0, step: -1 };
}
function lifts(pose) {
  if (pose.step < 0) return [0, 0];
  return [[1, 0], [0, 0], [0, 1], [0, 0]][pose.step];
}
function makeSheet(w, h, draw) {
  return (col, row) => {
    const p = new Painter(w, h);
    draw(p, poseFor(col));
    p.outline(S.outline);
    return row === 0 ? p : p.mirrored();
  };
}
function stdAnims(walkFps = 8, extras = {}, deathFps = 6) {
  const a = {
    idle: { start: 0, count: 2, fps: 2.5, loop: true },
    walk: { start: 2, count: 4, fps: walkFps, loop: true },
    windup: { start: 6, count: 1, fps: 1, loop: true },
    attack: { start: 7, count: 1, fps: 1, loop: true },
    death: { start: 8, count: 3, fps: deathFps, loop: false },
  };
  for (const [name, [s, n, fps, loop]] of Object.entries(extras)) a[name] = { start: 11 + s, count: n, fps, loop: loop !== false };
  return a;
}
function limb(p, x0, y0, x1, y1, ramp, h, thick = 2) {
  p.line(x0, y0, x1, y1, ramp[Math.min(ramp.length - 1, 2)], h);
  if (thick > 1) p.line(x0 + 1, y0, x1 + 1, y1, ramp[1], h - 0.2);
}
function eyes(p, x, y, color, h, gap = 2) {
  p.lit(x, y, color, h, 1.4);
  p.lit(x + gap, y, color, h, 1.4);
}
function erode(p, seed, amount) {
  const rng = new Rng(seed);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.filled(x, y) && rng.chance(amount)) p.px(x, y, '#000000', 0, 0);
}
function puddle(p, cx, cy, rx, ramp) {
  p.ellipse(cx, cy, rx, 2.4, ramp, 1.5);
}
function humanLegs(p, pose, b, x, ramp, top = 21, bottom = 30) {
  const [ll, rl] = lifts(pose);
  p.cyl(x, top + b, 3, bottom - top - ll, ramp, 3);
  p.cyl(x + 5, top + b, 3, bottom - top - rl, ramp, 3);
}

// =============================================================================================
// THE CELLS
// =============================================================================================

/** Kennel Hound: a lean, scarred mastiff with a spiked collar. 36 x 28 */
export const houndFrame = makeSheet(36, 28, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(18, 23, 13 - pose.i, 4, FUR, 3);
    puddle(p, 18, 25, 8 + pose.i * 2, C.blood);
    return;
  }
  const crouch = pose.k === 'windup' ? 3 : 0;
  const stretch = pose.k === 'attack' ? 4 : 0;
  for (const [x, ph] of [[9, 0], [13, 2], [22, 1], [26, 3]]) {
    const sw = pose.step >= 0 ? ((pose.step + ph) % 4 < 2 ? 2 : -2) : 0;
    limb(p, x, 16 + b + crouch, x + sw + (stretch && x < 18 ? -3 : stretch ? 3 : 0), 26, FUR, 3);
  }
  p.ellipse(17 + stretch / 2, 14 + b + crouch, 11 + stretch, 6, FUR, 7);
  for (const x of [11, 15, 19]) p.px(x, 11 + b + crouch, C.blood[3], 7.5); // scars
  const hx = 28 + stretch;
  const hy = 10 + b + crouch;
  p.ellipse(hx, hy, 5, 4.5, FUR, 8);
  p.ellipse(hx + 4, hy + 2, 3, 2.2, FUR.slice(1), 8);
  p.px(hx + 6, hy + 1, '#0a0a0a', 8.4);
  p.lit(hx + 1, hy - 1, '#ffb030', 8.6, 1.2);
  p.line(hx - 3, hy - 3, hx - 2, hy - 7, FUR[3], 8);
  for (let x = hx - 4; x <= hx + 1; x++) p.px(x, hy + 3, x % 2 ? IRON[4] : IRON[2], 8.6); // spiked collar
  if (pose.k !== 'idle' && pose.k !== 'walk') {
    p.hline(hx + 2, hx + 6, hy + 4, '#200808', 8.4);
    p.px(hx + 3, hy + 3, C.teeth[2], 8.6);
    p.px(hx + 5, hy + 3, C.teeth[2], 8.6);
  }
  limb(p, 6, 12 + b + crouch, 2, 8 + b, FUR, 6, 2);
});
export const HOUND_ANIMS = stdAnims(12);

/** Torturer: a hooded brute swinging a chain with a meat hook. 32 x 36 */
export const torturerFrame = makeSheet(32, 36, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(16, 31, 11 - pose.i, 3.5, C.jailerSkin, 3);
    p.ellipse(10, 31, 4, 2.5, ROBE, 3.5);
    puddle(p, 18, 33, 7 + pose.i * 2, C.blood);
    return;
  }
  humanLegs(p, pose, b, 11, S.trousers, 24, 34);
  p.ellipse(16, 19 + b, 8, 7.5, C.jailerSkin, 6); // bare belly
  p.rect(8, 22 + b, 16, 3, S.leather[1], 6.4); // leather apron
  p.rect(10, 25 + b, 12, 6, S.leather[2], 6.2);
  p.ellipse(16, 9 + b, 5, 5.5, ['#0e0a08', '#1c1612', '#2c241c'], 8); // black hood
  p.ellipse(16, 4 + b, 3, 3, ['#0e0a08', '#1c1612'], 8.5);
  eyes(p, 14, 10 + b, '#ffd890', 8.6, 3);
  const up = pose.k === 'windup';
  const throwP = pose.k === 'attack';
  const hx = up ? 27 : throwP ? 30 : 25;
  const hy = up ? 4 : throwP ? 16 : 22 + b;
  limb(p, 22, 15 + b, hx, hy, C.jailerSkin, 7, 3);
  // the chain and hook
  for (let i = 0; i < 5; i++) p.px(hx + (up ? -i : throwP ? 0 : 1), hy + (up ? i - 3 : i + 1), IRON[3 + (i % 2)], 8);
  const kx = up ? hx - 4 : throwP ? hx : hx + 1;
  const ky = up ? hy + 2 : hy + 6;
  p.line(kx, ky, kx + 2, ky + 2, IRON[5], 8.5);
  p.line(kx + 2, ky + 2, kx + 1, ky + 4, IRON[4], 8.5);
  p.px(kx - 1, ky + 3, IRON[4], 8.5);
  limb(p, 10, 15 + b, 6, 25 + b, C.jailerSkin, 7, 3);
});
export const TORTURER_ANIMS = stdAnims(5);

/** Rat Nest: a heap of filth, straw and bones that squirms. 36 x 28 */
export const ratnestFrame = makeSheet(36, 28, (p, pose) => {
  const rng = new Rng(808);
  const shake = pose.k === 'windup' ? (pose.i % 2 ? 1 : -1) : 0;
  if (pose.k === 'death') {
    p.ellipse(18, 22, 14 - pose.i * 2, 4, CHAPTERS.cells.straw, 2);
    for (let i = 0; i < 6; i++) p.px(rng.int(6, 30), rng.int(18, 25), BONE[2], 2.5);
    return;
  }
  const swell = pose.k === 'attack' ? 2 : 0;
  p.ellipse(18 + shake, 18 - swell / 2, 15 + swell, 8 + swell, ['#1a140c', '#2e2416', '#463822', '#5e4c30'], 6);
  for (let i = 0; i < 26; i++) {
    const x = rng.int(5, 31);
    const y = rng.int(11, 24);
    if (p.filled(x, y)) p.line(x + shake, y, x + rng.int(-3, 3) + shake, y + rng.int(-2, 1), CHAPTERS.cells.straw[rng.int(1, 3)], 6.5);
  }
  for (let i = 0; i < 4; i++) p.ellipse(rng.int(8, 28) + shake, rng.int(14, 22), 1.4, 1, BONE, 6.8); // bones
  // glinting eyes in the dark holes
  for (const [x, y] of [[11, 15], [22, 13], [26, 19], [15, 20]]) {
    p.ellipse(x + shake, y, 2, 1.5, ['#050404', '#0e0a08'], 6.6, false);
    if (pose.i !== 1 || pose.k !== 'idle') p.lit(x + shake, y, '#ff3a2a', 6.8, 1);
  }
  if (pose.k === 'attack') {
    p.ellipse(18, 9, 3, 2, C.ratFur, 7.5); // a rat squirming out
    p.px(20, 8, '#ff3a2a', 8);
  }
});
export const RATNEST_ANIMS = stdAnims(3);

/** Mad Monk: a gaunt monk in a ragged habit, lantern raised. 32 x 34 */
export const monkFrame = makeSheet(32, 34, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(16, 30, 10 - pose.i, 3.5, ROBE, 3);
    p.ellipse(22, 30, 2.5, 2, S.brass, 3.5);
    if (pose.i < 2) p.lit(22, 29, S.fire[4], 4, 1);
    return;
  }
  const [ll, rl] = lifts(pose);
  for (let y = 12; y < 31; y++) {
    const w = 4 + (y - 12) * 0.32;
    for (let x = Math.round(16 - w); x <= Math.round(16 + w); x++) p.px(x, y + (y > 28 ? (x < 16 ? -ll : -rl) : b), ROBE[1 + ((x + y) % 6 === 0 ? 1 : 0)], 5);
  }
  p.hline(12, 20, 19 + b, '#a8946a', 5.5); // rope belt
  p.ellipse(16, 8 + b, 4, 4.5, C.prisonerSkin, 8); // tonsured head
  p.ellipse(16, 5 + b, 2.2, 1.2, C.prisonerSkin.slice(2), 8.5);
  p.hline(12, 20, 7 + b, ROBE[2], 8.2);
  eyes(p, 14, 9 + b, '#ffffff', 8.6, 3);
  const up = pose.k === 'windup' || pose.k === 'attack';
  const lx = up ? 25 : 23;
  const ly = up ? 2 : 18 + b;
  limb(p, 19, 13 + b, lx, ly + 2, C.prisonerSkin, 7);
  p.rect(lx - 1, ly - 3, 4, 5, IRON[2], 8); // the lantern
  p.lit(lx, ly - 2, S.fire[4], 8.5, 1.6);
  p.lit(lx + 1, ly - 1, S.fire[3], 8.5, 1.4);
  if (pose.k === 'attack') for (let a = 0; a < 4; a++) p.lit(lx + Math.cos(a * 1.57) * 4, ly - 1 + Math.sin(a * 1.57) * 4, '#ffe0a0', 9, 1.2);
  limb(p, 12, 13 + b, 9, 22 + b, C.prisonerSkin, 7);
});
export const MONK_ANIMS = stdAnims(5);

/** Sewer Slime: a quivering heap of green filth with things floating in it. 32 x 24 */
function slimeBody(p, pose, scale) {
  const sq = pose.k === 'windup' ? 0.8 : pose.k === 'attack' ? 1.2 : pose.step >= 0 ? [1, 0.92, 1.08, 0.95][pose.step] : 1;
  const cx = p.w / 2;
  if (pose.k === 'death') {
    puddle(p, cx, p.h - 4, (10 + pose.i * 3) * scale, SLIME);
    return;
  }
  const rx = 11 * scale * (2 - sq);
  const ry = 8 * scale * sq;
  p.ellipse(cx, p.h - 3 - ry, rx, ry, SLIME, 6 * scale);
  p.px(cx - 4 * scale, p.h - 6 - ry, SLIME[4], 6.5 * scale); // shine
  p.ellipse(cx + 3 * scale, p.h - 2 - ry * 0.8, 1.5 * scale, 1 * scale, BONE, 5 * scale); // a bone inside
  p.lit(cx - 2 * scale, p.h - 4 - ry * 1.2, '#d0ff60', 6.6 * scale, 0.9);
  p.lit(cx + 2 * scale, p.h - 4 - ry * 1.2, '#d0ff60', 6.6 * scale, 0.9);
}
export const slimeFrame = makeSheet(32, 24, (p, pose) => slimeBody(p, pose, 1));
export const SLIME_ANIMS = stdAnims(6);
export const slimeletFrame = makeSheet(20, 16, (p, pose) => slimeBody(p, pose, 0.55));

// =============================================================================================
// THE CATACOMBS
// =============================================================================================

/** Flying Skull: a skull trailing ghostly flame. 20 x 20 */
export const skullFrame = makeSheet(20, 20, (p, pose) => {
  if (pose.k === 'death') {
    for (let i = 0; i < 4 - pose.i; i++) p.ellipse(4 + i * 4, 15, 1.5, 1.2, BONE, 2);
    return;
  }
  const f = pose.i % 2;
  for (let i = 0; i < 6; i++) p.lit(4 - i * 0.5 + (f ? 1 : 0), 10 + Math.sin(i + f) * 2, H.glowTeal[i < 3 ? 3 : 2], 3, 1.2); // flame trail
  p.ellipse(11, 9, 6, 5.5, BONE, 6);
  p.ellipse(11, 14, 3.5, 2, BONE.slice(0, 3), 5.5); // jaw
  const open = pose.k === 'windup' || pose.k === 'attack';
  if (open) p.hline(9, 13, 13, '#0a0806', 6);
  p.ellipse(9, 9, 1.4, 1.6, ['#060404', '#0e0a08'], 6.5, false);
  p.ellipse(13.5, 9, 1.4, 1.6, ['#060404', '#0e0a08'], 6.5, false);
  p.lit(9, 9, H.glowTeal[3], 6.8, 1.4);
  p.lit(13.5, 9, H.glowTeal[3], 6.8, 1.4);
});
export const SKULL_ANIMS = stdAnims(10);

/** Banshee: a wailing woman of mist with streaming hair. 32 x 36 */
export const bansheeFrame = makeSheet(32, 36, (p, pose) => {
  const MIST = ['#2a3a44', '#4a6070', '#7a94a4', '#a8c0cc', '#d8e8f0'];
  if (pose.k === 'death') {
    p.ellipse(16, 30, 9 - pose.i * 2, 3, MIST, 2);
    erode(p, 70 + pose.i, 0.4);
    return;
  }
  const f = Math.round(Math.sin((pose.i || 0) * 1.6));
  for (let y = 12; y < 34; y++) {
    const w = 5 - (y - 12) * 0.12 + Math.sin(y * 0.6 + f) * 1;
    for (let x = Math.round(16 - w); x <= Math.round(16 + w); x++) p.px(x + (y > 26 ? Math.round(Math.sin(y) * 1.5) : 0), y + f, MIST[1 + ((x + y) % 4 === 0 ? 1 : 0) + (y > 28 ? -1 : 0)], 4);
  }
  p.ellipse(16, 8 + f, 4.5, 5, MIST.slice(1), 7);
  for (let k = 0; k < 6; k++) p.line(12 + k * 1.6, 4 + f, 8 + k * 2.5, 18 + f + (k % 2) * 3, '#e8f0f4', 6.5); // streaming hair
  const wail = pose.k === 'windup' || pose.k === 'attack';
  p.ellipse(16, 11 + f, wail ? 2 : 1, wail ? 2.5 : 1, ['#05080a', '#0e1418'], 7.5, false);
  eyes(p, 14, 7 + f, '#c0f0ff', 7.6, 4);
  if (pose.k === 'attack') for (let a = 0; a < 20; a++) p.lit(16 + Math.cos(a * 0.314) * 13, 11 + f + Math.sin(a * 0.314) * 9, '#c0f0ff', 8, 1);
  const armUp = wail ? -6 : 0;
  limb(p, 12, 14 + f, 7, 20 + f + armUp, MIST, 5);
  limb(p, 20, 14 + f, 25, 20 + f + armUp, MIST, 5);
});
export const BANSHEE_ANIMS = stdAnims(5);

/** Necromancer: a hunched figure in black, a staff topped with a skull. 32 x 36 */
export const necromancerFrame = makeSheet(32, 36, (p, pose) => {
  const BLACK = ['#08060a', '#140e18', '#221828', '#32243a'];
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(16, 31, 10 - pose.i, 3.5, BLACK, 3);
    p.ellipse(24, 31, 2.5, 2, BONE, 3.5);
    erode(p, 90 + pose.i, 0.15 * pose.i);
    return;
  }
  const [ll, rl] = lifts(pose);
  for (let y = 12; y < 33; y++) {
    const w = 5 + (y - 12) * 0.3;
    for (let x = Math.round(15 - w); x <= Math.round(15 + w); x++) p.px(x, y + (y > 30 ? (x < 15 ? -ll : -rl) : b), BLACK[1 + ((x * y) % 7 === 0 ? 1 : 0)], 5);
  }
  for (let x = 10; x < 21; x += 3) p.lit(x, 24 + b, H.glowPurple[2], 5.5, 0.6); // runes on the hem
  p.ellipse(15, 8 + b, 5, 5.5, BLACK, 8); // deep hood
  p.ellipse(16, 9 + b, 3, 3.2, ['#020203', '#060508'], 8.2, false);
  eyes(p, 15, 9 + b, '#a0ff60', 8.6, 2);
  const up = pose.k === 'windup' || pose.k === 'attack';
  const sx = up ? 26 : 24;
  const sy = up ? 0 : 6;
  limb(p, 20, 14 + b, sx - 1, sy + 10, ['#3a3a30', '#6a6a58', '#8a8a70'], 7);
  p.line(sx, sy + 4, sx - 1, 34, S.wood[2], 7.5);
  p.ellipse(sx, sy + 2, 2.6, 2.4, BONE, 8.2);
  p.lit(sx - 1, sy + 2, '#a0ff60', 8.6, 1.2);
  p.lit(sx + 1, sy + 2, '#a0ff60', 8.6, 1.2);
  if (up) for (let y = -4; y < 6; y++) for (let x = -4; x < 5; x++) if (x * x + y * y < 18 && p.filled(sx + x, sy + 2 + y)) p.glow(sx + x, sy + 2 + y, '#a0ff60', 0.9);
});
export const NECROMANCER_ANIMS = stdAnims(4);

/** Mummy: a shambling corpse wound in grave linen, one arm reaching. 32 x 34 */
export const mummyFrame = makeSheet(32, 34, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(16, 30, 11 - pose.i, 3.5, LINEN, 3);
    for (let i = 0; i < 4; i++) p.line(6 + i * 6, 31, 9 + i * 6, 29, LINEN[3], 3.5);
    return;
  }
  humanLegs(p, pose, b, 11, LINEN, 21, 32);
  p.cyl(9, 11 + b, 14, 12, LINEN, 6);
  for (let y = 12; y < 32; y += 2) for (let x = 8; x < 24; x++) if (p.filled(x, y + b) && (x + y) % 5 < 2) p.px(x, y + b, LINEN[1], 6.2); // windings
  p.ellipse(16, 7 + b, 4.5, 5, LINEN, 8);
  for (let y = 3; y < 12; y += 2) p.hline(12, 20, y + b, LINEN[1], 8.2);
  p.lit(15, 7 + b, '#ffcf5a', 8.6, 1.2); // one eye shows through
  const reach = pose.k === 'windup' || pose.k === 'attack';
  limb(p, 20, 13 + b, reach ? 30 : 25, reach ? 12 : 18 + b, LINEN, 7);
  if (pose.k === 'attack') for (let x = 25; x < 32; x++) p.px(x, 12 + Math.round(Math.sin(x)), LINEN[3], 7.2); // trailing linen
  limb(p, 11, 13 + b, 8, 21 + b, LINEN, 7);
  p.line(8, 21 + b, 5, 27 + b, LINEN[2], 6); // a loose strip dangling
});
export const MUMMY_ANIMS = stdAnims(4, { enraged: [0, 1, 1] });

/** Crypt Bat: leathery wings, a pig-snout, glinting eyes. 24 x 16 */
export const batFrame = makeSheet(24, 16, (p, pose) => {
  if (pose.k === 'death') {
    p.ellipse(12, 12, 5 - pose.i, 2, BAT, 1.5);
    return;
  }
  const flap = pose.step >= 0 ? [0, -3, -5, -3][pose.step] : pose.i ? -2 : 1;
  for (const s of [-1, 1]) {
    for (let i = 0; i < 4; i++) p.line(12, 8, 12 + s * (3 + i * 2.2), 8 + flap + (i % 2 ? 3 : 0), BAT[1 + (i % 3)], 4);
    p.line(12, 8, 12 + s * 10, 7 + flap, BAT[3], 4.5);
  }
  p.ellipse(12, 9, 2.6, 3, BAT, 5.5);
  p.px(11, 6, BAT[3], 6);
  p.px(13, 6, BAT[3], 6);
  eyes(p, 11, 8, '#ff4040', 6, 2);
});
export const BAT_ANIMS = stdAnims(14);

// =============================================================================================
// THE HOLLOW
// =============================================================================================

/** Puffcap: a fat mushroom that hides, then pops up on stubby legs. 28 x 28 */
export const puffcapFrame = makeSheet(28, 28, (p, pose) => {
  const CAP = ['#2a0e2e', '#4a1a52', '#6e2a7a', '#9a42a6'];
  if (pose.k === 'death') {
    p.ellipse(14, 23, 9 - pose.i * 2, 3, CAP, 2);
    return;
  }
  const hidden = pose.k === 'extra';
  const swell = pose.k === 'windup' ? 2 : 0;
  const lift = hidden ? 6 : 0;
  if (!hidden) {
    const [ll, rl] = lifts(pose);
    p.cyl(9, 18, 3, 7 - ll, ['#5a5040', '#8a7e64', '#b8ab8a'], 3);
    p.cyl(16, 18, 3, 7 - rl, ['#5a5040', '#8a7e64', '#b8ab8a'], 3);
  }
  p.cyl(10, 13 + lift, 8, 7 - lift, ['#8a8068', '#c8bea0', '#ece4cc'], 5); // stalk
  p.ellipse(14, 11 + lift, 11 + swell, 6 + swell, CAP, 8);
  for (const [x, y] of [[9, 9], [15, 7], [19, 11], [12, 12]]) p.lit(x, y + lift, H.glowTeal[2], 8.4, 0.8); // spots
  if (!hidden) eyes(p, 12, 16, '#ffe040', 6, 3);
  if (pose.k === 'attack') for (let a = 0; a < 10; a++) p.lit(14 + Math.cos(a * 0.63) * 13, 12 + Math.sin(a * 0.63) * 8, H.glowPurple[2], 9, 1);
});
export const PUFFCAP_ANIMS = stdAnims(8, { hidden: [0, 1, 1] });

/** Bog Toad: a warty toad the size of a dog, long sticky tongue. 32 x 24 */
export const toadFrame = makeSheet(32, 24, (p, pose) => {
  if (pose.k === 'death') {
    p.ellipse(14, 19, 11 - pose.i, 3.5, TOAD, 2.5);
    return;
  }
  const crouch = pose.k === 'windup' ? 2 : 0;
  const air = pose.step === 1 || pose.step === 2 ? -3 : 0;
  p.ellipse(8, 18 + air, 4, 3, TOAD, 4); // back legs
  p.ellipse(14, 14 + crouch + air, 10, 6.5 - crouch / 2, TOAD, 7);
  const rng = new Rng(55);
  for (let i = 0; i < 10; i++) p.px(rng.int(6, 22), rng.int(9, 18) + crouch + air, TOAD[4], 7.4); // warts
  p.ellipse(20, 10 + crouch + air, 4, 3, TOAD, 7.6);
  p.ellipse(21, 8 + crouch + air, 1.8, 1.8, ['#4a4010', '#ffd040'], 8);
  p.px(21, 8 + crouch + air, '#0a0a0a', 8.4);
  p.hline(18, 25, 13 + crouch + air, TOAD[0], 7.8);
  limb(p, 18, 16 + air, 20, 21, TOAD, 4);
  if (pose.k === 'attack') {
    for (let x = 24; x < 32; x++) p.px(x, 13, C.tongue[2], 7.5); // the tongue lashes out
    p.ellipse(31, 13, 1.6, 1.6, C.tongue, 7.8);
  }
});
export const TOAD_ANIMS = stdAnims(6);

/** Elder Treant: a walking oak, mossy, its face a split in the bark. 44 x 48 */
export const treantFrame = makeSheet(44, 48, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(22, 42, 18 - pose.i * 2, 5, BARK, 4);
    for (let i = 0; i < 6; i++) p.line(8 + i * 5, 42, 10 + i * 5, 36 + (i % 3), BARK[2], 5);
    return;
  }
  const [ll, rl] = lifts(pose);
  // root-feet
  for (const [x, l] of [[12, ll], [26, rl]]) {
    p.cyl(x, 32 + b, 7, 14 - l, BARK, 4);
    p.line(x - 2, 46 - l, x + 9, 46 - l, BARK[1], 4);
  }
  p.cyl(10, 14 + b, 24, 22, BARK, 8);
  for (let x = 12; x < 34; x += 3) p.line(x, 15 + b, x + 1, 35 + b, BARK[1], 8.2); // grain
  // the face
  p.ellipse(22, 22 + b, 5, 2, ['#080604', '#140e08'], 8.6, false);
  eyes(p, 18, 19 + b, '#a0ff60', 8.8, 8);
  // crown of leaves
  p.ellipse(22, 9 + b, 16, 9, LEAF, 10);
  for (let i = 0; i < 12; i++) p.lit(9 + i * 2.4, 6 + b + (i % 3) * 2, H.glowTeal[1], 10.2, 0.4);
  const stomp = pose.k === 'windup';
  const slam = pose.k === 'attack';
  for (const s of [-1, 1]) {
    const x0 = 22 + s * 11;
    const x1 = 22 + s * (stomp ? 18 : slam ? 19 : 17);
    const y1 = stomp ? 4 : slam ? 44 : 30 + b;
    limb(p, x0, 18 + b, x1, y1, BARK, 9, 3);
    for (let k = 0; k < 3; k++) p.line(x1, y1, x1 + s * (k - 1) * 2, y1 + (slam ? 3 : -3), BARK[3], 9.2); // twig fingers
  }
});
export const TREANT_ANIMS = stdAnims(4);

/** Hollow Sprite: a tiny thorn-winged fae with a needle. 20 x 20 */
export const pixieFrame = makeSheet(20, 20, (p, pose) => {
  if (pose.k === 'death') {
    p.lit(10, 14, H.glowTeal[2], 2, 1.2 - pose.i * 0.4);
    return;
  }
  const flap = pose.i % 2 || pose.step % 2 ? -2 : 1;
  for (const s of [-1, 1]) {
    p.ellipse(10 + s * 4, 7 + flap, 3.5, 2.2, ['#2a5a5a', '#5aa0a0', '#a0f0e8'], 3);
    for (let i = 0; i < 3; i++) p.glow(10 + s * (3 + i), 7 + flap, H.glowTeal[2], 0.6);
  }
  p.ellipse(10, 10, 2, 3.5, LEAF, 5);
  p.ellipse(10, 5, 2.2, 2.2, ['#6a8a6a', '#9ac09a', '#c8e8c8'], 6);
  eyes(p, 9, 5, '#ffffff', 6.4, 2);
  const stab = pose.k === 'windup' || pose.k === 'attack';
  p.line(12, 10, stab ? 18 : 15, stab ? 8 : 13, IRON[5], 6); // the needle
  if (stab) p.lit(18, 8, '#ffffff', 6.4, 1);
});
export const PIXIE_ANIMS = stdAnims(12, { blink: [0, 1, 1] });

/** Tusked Boar: a bristling black boar with curling tusks. 40 x 28 */
export const boarFrame = makeSheet(40, 28, (p, pose) => {
  const BR = ['#100c0a', '#1e1814', '#302620', '#44382e', '#5a4a3c'];
  if (pose.k === 'death') {
    p.ellipse(20, 23, 14 - pose.i, 4, BR, 3);
    puddle(p, 22, 25, 7 + pose.i * 2, C.blood);
    return;
  }
  const crouch = pose.k === 'windup' ? 2 : 0;
  for (const [x, ph] of [[10, 0], [14, 2], [24, 1], [28, 3]]) {
    const sw = pose.step >= 0 ? ((pose.step + ph) % 4 < 2 ? 2 : -2) : 0;
    limb(p, x, 17 + crouch, x + sw, 26, BR, 3);
  }
  p.ellipse(19, 14 + crouch, 13, 7.5, BR, 7);
  for (let x = 9; x < 28; x += 2) p.line(x, 7 + crouch, x - 1, 4 + crouch + (x % 4 ? 1 : 0), BR[3], 7.5); // bristles
  p.ellipse(31, 15 + crouch, 6, 5, BR, 8);
  p.ellipse(36, 17 + crouch, 2.5, 2.2, ['#3a2a28', '#6a4a46'], 8.2);
  p.lit(32, 13 + crouch, '#ff6a2a', 8.6, 1.2);
  // tusks
  p.line(34, 19 + crouch, 37, 15 + crouch, C.teeth[2], 8.8);
  p.line(33, 19 + crouch, 36, 16 + crouch, C.teeth[1], 8.7);
  if (pose.k === 'attack') for (let i = 0; i < 5; i++) p.px(4 - i, 20 + (i % 2), '#6a5a48', 3); // kicked-up dirt
});
export const BOAR_ANIMS = stdAnims(10, { stunned: [0, 1, 1] });

// =============================================================================================
// THE BURNING HALLS
// =============================================================================================

/** Hellhound: a hound of smouldering coal with flame for a mane. 36 x 28 */
export const hellhoundFrame = makeSheet(36, 28, (p, pose) => {
  if (pose.k === 'death') {
    p.ellipse(18, 23, 12 - pose.i * 2, 3.5, MOLTEN, 3);
    for (let i = 0; i < 6; i++) p.lit(8 + i * 4, 22 - (i % 2), HA.lava[2 - (pose.i > 1 ? 1 : 0)], 3.4, 1);
    return;
  }
  const b = pose.bob;
  const crouch = pose.k === 'windup' ? 3 : 0;
  const stretch = pose.k === 'attack' ? 4 : 0;
  for (const [x, ph] of [[9, 0], [13, 2], [22, 1], [26, 3]]) {
    const sw = pose.step >= 0 ? ((pose.step + ph) % 4 < 2 ? 2 : -2) : 0;
    limb(p, x, 16 + b + crouch, x + sw, 26, MOLTEN, 3);
  }
  p.ellipse(17 + stretch / 2, 14 + b + crouch, 11 + stretch, 6, MOLTEN, 7);
  for (let i = 0; i < 10; i++) p.lit(8 + i * 2 + stretch / 2, 14 + b + crouch + ((i * 3) % 4) - 1, HA.lava[1 + (i % 2)], 7.4, 1.1); // cracks of fire
  const hx = 28 + stretch;
  const hy = 10 + b + crouch;
  p.ellipse(hx, hy, 5, 4.5, MOLTEN, 8);
  p.ellipse(hx + 4, hy + 2, 3, 2.2, MOLTEN.slice(1), 8);
  p.lit(hx + 1, hy - 1, '#ffe060', 8.6, 1.8);
  for (let i = 0; i < 7; i++) p.lit(hx - 6 + i * 1.2, hy - 4 - (i % 3), S.fire[3 + (i % 3)], 8.8, 1.6); // fiery mane
  if (pose.k === 'attack') p.lit(hx + 7, hy + 2, S.fire[5], 8.6, 1.6);
  for (let i = 0; i < 4; i++) p.lit(5 - i, 10 + b + crouch - i, S.fire[3 + (i % 2)], 6, 1.4); // tail of flame
});
export const HELLHOUND_ANIMS = stdAnims(12);

/** Ballista: a siege crossbow on a wheeled frame, a bolt the size of a spear. 40 x 28 */
export const ballistaFrame = makeSheet(40, 28, (p, pose) => {
  if (pose.k === 'death') {
    for (let i = 0; i < 6; i++) p.line(6 + i * 5, 24, 10 + i * 5, 20 + (i % 2) * 2, S.wood[2 + (i % 2)], 3);
    p.ellipse(10, 23, 3, 3, IRON.slice(1, 4), 3.5);
    return;
  }
  p.ellipse(10, 22, 4, 4, S.wood, 4); // wheels
  p.ellipse(28, 22, 4, 4, S.wood, 4);
  p.px(10, 22, IRON[4], 4.4);
  p.px(28, 22, IRON[4], 4.4);
  p.bevelRect(6, 16, 26, 4, S.wood.slice(1, 5), 5, 1); // carriage
  p.bevelRect(8, 10, 26, 3, S.wood.slice(2, 6), 6, 1); // stock
  const drawn = pose.k === 'windup' ? 4 : pose.k === 'attack' ? -1 : 2;
  // the bow arms and string
  p.line(30, 11, 34, 3, S.wood[4], 7);
  p.line(30, 12, 34, 19, S.wood[4], 7);
  p.line(34, 3, 30 - drawn * 2, 11, '#d8d0b0', 7.4);
  p.line(34, 19, 30 - drawn * 2, 12, '#d8d0b0', 7.4);
  if (pose.k !== 'attack') {
    p.line(12 - drawn * 2, 11, 38, 11, S.wood[5], 7.6); // the bolt
    p.line(36, 10, 39, 11, IRON[5], 7.8);
    p.line(36, 12, 39, 11, IRON[4], 7.8);
  }
  p.rect(16, 13, 3, 3, IRON[3], 6.4); // the crank
  if (pose.k === 'windup') p.lit(39, 11, '#ff4030', 8, 0.8);
});
export const BALLISTA_ANIMS = stdAnims(1);

/** Mad Jester: motley, bells, a grin painted over a real one. 28 x 34 */
export const jesterFrame = makeSheet(28, 34, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(14, 30, 9 - pose.i, 3, MOTLEY_A, 3);
    p.ellipse(18, 30, 3, 2, MOTLEY_B, 3.5);
    return;
  }
  const flip = pose.k === 'extra'; // cartwheeling
  const [ll, rl] = lifts(pose);
  p.cyl(10, 21 + b, 3, 10 - ll, MOTLEY_A, 3);
  p.cyl(15, 21 + b, 3, 10 - rl, MOTLEY_B, 3);
  p.cyl(9, 11 + b, 5, 11, MOTLEY_B, 6);
  p.cyl(14, 11 + b, 5, 11, MOTLEY_A, 6);
  p.hline(9, 18, 21 + b, IRON[3], 6.2);
  p.ellipse(14, 7 + b, 4, 4.5, ['#c8c0b0', '#e8e0d4', '#ffffff'], 8); // painted face
  p.hline(12, 16, 9 + b, MOTLEY_A[2], 8.4); // the painted grin
  p.px(12, 8 + b, MOTLEY_A[2], 8.4);
  p.px(16, 8 + b, MOTLEY_A[2], 8.4);
  eyes(p, 12, 6 + b, '#1a0a0a', 8.6, 4);
  // three-pointed cap with bells
  for (const [dx, c] of [[-5, MOTLEY_A], [0, MOTLEY_B], [5, MOTLEY_A]]) {
    p.line(14, 3 + b, 14 + dx, -1 + b + Math.abs(dx) * 0.4, c[2], 9);
    p.ellipse(14 + dx, b + Math.abs(dx) * 0.4, 1.2, 1.2, S.brass, 9.4);
  }
  const throwing = pose.k === 'windup' || pose.k === 'attack';
  limb(p, 18, 13 + b, throwing ? 25 : 21, throwing ? 6 : 20 + b, MOTLEY_A, 7);
  if (throwing) p.line(25, 6, 27, 2, IRON[5], 7.6); // a knife
  limb(p, 9, 13 + b, 5, 20 + b, MOTLEY_B, 7);
  if (flip) return;
});
export const JESTER_ANIMS = stdAnims(9, { cartwheel: [0, 1, 1] });

/** Molten Golem: a hulk of cooling slag, lava showing through the cracks. 40 x 40 */
export const moltengolemFrame = makeSheet(40, 40, (p, pose) => {
  const SLAG = ['#0e0806', '#1e1410', '#30221a', '#463226', '#5c4434'];
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(20, 35, 15 - pose.i * 2, 4, SLAG, 3);
    for (let i = 0; i < 8; i++) p.lit(8 + i * 3, 34 - (i % 3), HA.lava[2], 3.4, 1.3 - pose.i * 0.3);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(12, 26 + b, 6, 12 - ll, SLAG, 4);
  p.cyl(22, 26 + b, 6, 12 - rl, SLAG, 4);
  p.ellipse(20, 18 + b, 13, 11, SLAG, 8);
  const rng = new Rng(4040);
  for (let i = 0; i < 5; i++) {
    let x = rng.int(10, 30);
    let y = rng.int(10, 26) + b;
    for (let k = 0; k < 6; k++) {
      p.lit(x, y, HA.lava[k < 2 ? 3 : 2], 8.4, 1.4);
      x += rng.int(-1, 1);
      y += 1;
    }
  }
  p.ellipse(20, 7 + b, 6, 5, SLAG, 9);
  eyes(p, 17, 7 + b, HA.lava[3], 9.4, 6);
  const raise = pose.k === 'windup';
  const smash = pose.k === 'attack';
  for (const s of [-1, 1]) {
    const x1 = 20 + s * (raise ? 15 : 17);
    const y1 = raise ? 2 : smash ? 36 : 28 + b;
    limb(p, 20 + s * 11, 14 + b, x1, y1, SLAG, 9, 3);
    p.ellipse(x1, y1, 4, 3.5, SLAG, 9.4);
    p.lit(x1, y1, HA.lava[2], 9.6, 1);
  }
});
export const MOLTENGOLEM_ANIMS = stdAnims(4);

/** Ember: a spark of the golem that skitters about. 14 x 14 */
export const emberFrame = makeSheet(14, 14, (p, pose) => {
  if (pose.k === 'death') {
    p.lit(7, 10, HA.lava[1], 2, 1 - pose.i * 0.3);
    return;
  }
  const f = pose.i % 2 || pose.step % 2;
  p.ellipse(7, 9, 4, 3.5, MOLTEN, 4);
  p.lit(7, 8, HA.lava[3], 4.4, 1.6);
  p.lit(6 + f, 6, S.fire[4], 5, 1.4);
  p.lit(7, 4 - f, S.fire[5], 5, 1.2);
});
export const EMBER_ANIMS = stdAnims(14);

/** Banner Bearer: a sergeant holding the Mad King's banner high. 32 x 44 */
export const bannermanFrame = makeSheet(32, 44, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    p.ellipse(14, 40, 9 - pose.i, 3, C.gambeson, 3);
    p.line(4, 40, 28, 36, S.wood[3], 3.5);
    p.rect(20, 34, 8, 5, HA.crimson.slice(1), 3.4);
    return;
  }
  const [ll, rl] = lifts(pose);
  p.cyl(10, 32 + b, 3, 11 - ll, IRON.slice(1, 5), 3);
  p.cyl(15, 32 + b, 3, 11 - rl, IRON.slice(1, 5), 3);
  p.cyl(8, 20 + b, 12, 13, C.gambeson, 6);
  p.rect(10, 22 + b, 8, 9, C.royal[2], 6.3); // the king's tabard
  p.px(14, 25 + b, HA.crimson[2], 6.5);
  p.ellipse(14, 16 + b, 4, 4.5, S.skin, 8);
  p.ellipse(14, 13 + b, 4.5, 2.5, IRON.slice(2, 6), 8.6); // a kettle helm
  p.hline(9, 19, 14 + b, IRON[4], 8.8);
  eyes(p, 13, 17 + b, S.eye, 8.4, 2);
  // the banner pole and flag
  const planted = pose.k === 'windup' || pose.k === 'attack';
  const px = planted ? 24 : 22;
  p.line(px, 2 + b, px, 42, S.wood[3], 7);
  for (let y = 3; y < 15; y++) for (let x = px + 1; x < px + 8; x++) p.px(x, y + b + (x - px > 5 && y > 12 ? -1 : 0), HA.crimson[1 + ((x + y) % 5 === 0 ? 1 : 0)], 7.2);
  for (const x of [px + 2, px + 4, px + 6]) p.vline(x, 6 + b, 9 + b, HA.gold[2], 7.4); // a little gold crown
  p.hline(px + 2, px + 6, 9 + b, HA.gold[2], 7.4);
  if (planted) for (let a = 0; a < 16; a++) p.lit(px + 4 + Math.cos(a * 0.39) * 7, 9 + Math.sin(a * 0.39) * 5, HA.gold[3], 8, 0.8);
  limb(p, 19, 22 + b, px, 22 + b, C.gambeson, 7);
});
export const BANNERMAN_ANIMS = stdAnims(5);
