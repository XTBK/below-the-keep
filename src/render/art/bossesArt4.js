// Redrawn bosses (replacing rushed first versions), drawn with the tools in artKit.js.
// Same frame layout as the other boss sheets:
//   0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death, 11 cast. Row 1 = mirrored. y points DOWN.
// Each faces RIGHT in row 0.

import { Painter } from '../Painter.js';
import { SHARED as S } from '../../data/palettes.js';
import { limb, shape, spots, rim, glowEye } from './artKit.js';

const OUTLINE = S.outline;

export function poseFor(col) {
  if (col < 2) return { k: 'idle', i: col, bob: col };
  if (col < 6) return { k: 'walk', i: col - 2, bob: (col - 2) % 2 ? -1 : 0 };
  if (col === 6) return { k: 'windup', bob: 0 };
  if (col === 7) return { k: 'attack', bob: 0 };
  if (col < 11) return { k: 'death', i: col - 8, bob: 0 };
  return { k: 'cast', bob: 0 };
}

export function makeSheet(w, h, draw, rimColor = null) {
  return (col, row) => {
    const p = new Painter(w, h);
    draw(p, poseFor(col));
    if (rimColor) rim(p, rimColor);
    p.outline(OUTLINE);
    return row === 0 ? p : p.mirrored();
  };
}

/** Walk-cycle stride for a two-legged creature: [front leg, back leg] forward offsets. */
export function stride(pose, amt = 3) {
  if (pose.k !== 'walk') return [0, 0];
  return [[amt, -amt], [0, 0], [-amt, amt], [0, 0]][pose.i];
}

// --- palettes ---
const SKIN = ['#2a1410', '#4a2418', '#6e3a26', '#94563a', '#b87452', '#d8946c'];
const LEATHER = ['#0c0808', '#1a1210', '#2a1e18', '#3c2c22', '#4e3a2c', '#624a38'];
const HOOD = ['#050405', '#0c090c', '#161116', '#221a22', '#2e252e'];
const STEEL = ['#1a1a20', '#2e2e36', '#4a4a54', '#6e6e7a', '#9a9aa6', '#d0d0da'];
const WOOD = ['#1a0f08', '#2e1c10', '#4a2e18', '#6a4424', '#8a5c32'];
const BLOOD = ['#2a0406', '#4e080c', '#7a1016', '#a01c20'];

// ===================== THE HEADSMAN =====================

function axe(p, hx, hy, tx, ty, blood = false) {
  // the haft from the hands (hx,hy) to the head end (tx,ty)
  limb(p, hx + (hx - tx) * 0.25, hy + (hy - ty) * 0.25, tx, ty, 1.6, 1.4, WOOD, 6);
  const len = Math.hypot(tx - hx, ty - hy) || 1;
  const ux = (tx - hx) / len; // along the haft, toward the head
  const uy = (ty - hy) / len;
  // the blade sits on the side away from the light-facing normal, sweeping out and down
  let nx = -uy;
  let ny = ux;
  if (nx < 0) {
    nx = -nx;
    ny = -ny;
  }
  const at = (a, o) => [tx + ux * a + nx * o, ty + uy * a + ny * o];
  const pts = [at(1, 1), at(3, 4), at(5, 10), at(4, 14), at(1, 16), at(-4, 16), at(-9, 14), at(-12, 11), at(-9, 6), at(-5, 1)];
  shape(p, pts, STEEL, 7, { flat: 0.45, soft: 3 });
  // the honed edge, bright along the outside curve; a dark cheek by the haft
  for (const [a, o] of [[4, 13], [3, 15], [1, 16], [-2, 16], [-5, 16], [-8, 14], [-10, 12]]) {
    const [x, y] = at(a, o);
    p.px(x, y, STEEL[5], 7.6);
  }
  for (const [a, o] of [[0, 2], [-2, 2], [-4, 2], [2, 2]]) {
    const [x, y] = at(a, o);
    p.px(x, y, STEEL[1], 7.2);
  }
  limb(p, tx - ux * 1, ty - uy * 1, tx + ux * 2, ty + uy * 2, 2.2, 2.2, STEEL.slice(1, 5), 7.3); // the socket
  if (blood) {
    for (const [a, o] of [[-6, 15], [-9, 13], [-4, 14], [-7, 12], [-11, 11]]) {
      const [x, y] = at(a, o);
      p.px(x, y, BLOOD[2], 7.8);
      p.px(x, y + 1, BLOOD[1], 7.8);
    }
  }
}

export const headsmanFrame = makeSheet(72, 80, (p, pose) => {
  const b = pose.bob;
  if (pose.k === 'death') {
    const i = pose.i;
    if (i === 0) {
      // on his knees
      limb(p, 28, 62, 22, 76, 4, 3.5, LEATHER, 5);
      limb(p, 40, 62, 46, 76, 4, 3.5, LEATHER, 5);
      shape(p, [[20, 34], [48, 34], [46, 60], [22, 60]], SKIN, 8);
      shape(p, [[26, 18], [34, 12], [42, 18], [44, 32], [24, 32]], HOOD, 10);
      axe(p, 50, 60, 66, 74, true);
    } else {
      // fallen forward, the axe beside him, the block at last empty
      p.ellipse(36, 74, 24 - i * 2, 5, BLOOD, 1, false, false);
      shape(p, [[10, 64], [52, 62], [56, 72], [8, 74]], SKIN, 6);
      shape(p, [[50, 60], [64, 62], [66, 72], [52, 74]], HOOD, 7);
      shape(p, [[16, 66], [40, 64], [42, 74], [14, 75]], LEATHER, 6.5);
      axe(p, 12, 70, 2 + i, 58, true);
    }
    return;
  }
  const [fl, bl] = stride(pose, 3);
  const crouch = pose.k === 'windup' ? 3 : pose.k === 'attack' ? 4 : 0;
  const y0 = b + crouch;
  // where his hands grip the haft in this pose
  const grip = { windup: [32, 12], attack: [52, 42], cast: [36, 4] }[pose.k] || [46, 34];
  // the far arm, behind his body: shoulder to the haft
  limb(p, 22, 26 + y0, 14, 38 + y0, 4.6, 4, SKIN.slice(0, 5), 6);
  limb(p, 14, 38 + y0, grip[0] - 6, grip[1] + y0 + 2, 4, 3.4, SKIN.slice(0, 5), 6);
  // legs: dark breeches, heavy boots
  limb(p, 28, 52 + y0, 25 + bl, 72, 5, 4, LEATHER, 5);
  limb(p, 40, 52 + y0, 43 + fl, 72, 5, 4, LEATHER, 5.5);
  for (const fx of [25 + bl, 43 + fl]) p.bevelRect(fx - 5, 72, 11, 6, LEATHER.slice(1), 5, 1);
  // the leather apron, stiff with old blood
  shape(p, [[21, 44 + y0], [47, 44 + y0], [50, 68 + y0], [18, 68 + y0]], LEATHER, 8.5, { folds: 0.9 });
  spots(p, 20, 50 + y0, 30, 18, [BLOOD[1], BLOOD[2]], 0.07, 4242, 2);
  // the bare chest, broad and scarred
  shape(p, [[17, 23 + y0], [51, 23 + y0], [49, 40 + y0], [45, 48 + y0], [23, 48 + y0], [19, 40 + y0]], SKIN, 9);
  p.line(34, 28 + y0, 34, 46 + y0, SKIN[2], 9.4); // the breastbone
  p.line(24, 34 + y0, 32, 36 + y0, SKIN[2], 9.4); // pectorals
  p.line(36, 36 + y0, 46, 34 + y0, SKIN[2], 9.4);
  for (const ay of [40, 44]) p.hline(29, 39, ay + y0, SKIN[2], 9.3); // the belly
  p.line(22, 29 + y0, 28, 33 + y0, SKIN[5], 9.6); // an old scar
  // belt and buckle
  p.bevelRect(19, 44 + y0, 30, 4, LEATHER.slice(2), 9.5, 1);
  p.bevelRect(31, 43 + y0, 6, 6, STEEL.slice(2), 10, 1);
  // the axe and the arms that swing it
  const k = pose.k;
  let hand;
  if (k === 'windup') {
    hand = [32, 12 + y0];
    axe(p, 32, 14 + y0, 10, 2, false);
  } else if (k === 'attack') {
    hand = [52, 42 + y0];
    axe(p, 50, 42 + y0, 68, 68, true);
    for (let s = 0; s < 6; s++) p.px(60 + s * 2, 70 - s, BLOOD[3], 4); // a spray from the stroke
  } else if (k === 'cast') {
    hand = [36, 4 + y0];
    axe(p, 36, 8 + y0, 36, -2, true);
  } else {
    hand = [44, 34 + y0];
    axe(p, 42, 40 + y0, 60, 8 + b, true);
  }
  // the front arm, over the haft
  limb(p, 48, 27 + y0, (48 + hand[0]) / 2 + 3, (27 + y0 + hand[1]) / 2 + 3, 5.2, 4.4, SKIN, 10);
  limb(p, (48 + hand[0]) / 2 + 3, (27 + y0 + hand[1]) / 2 + 3, hand[0], hand[1], 4.4, 3.8, SKIN, 10.5);
  p.ellipse(hand[0], hand[1], 3.4, 3, SKIN.slice(1), 11); // the fists
  // the black hood and its short cape
  shape(p, [[20, 18 + y0], [48, 18 + y0], [53, 28 + y0], [15, 28 + y0]], HOOD, 11);
  shape(p, [[26, 9 + y0], [33, 0 + y0], [43, 7 + y0], [46, 21 + y0], [24, 22 + y0]], HOOD, 12, { soft: 5 });
  // the eyes behind the holes
  glowEye(p, 31, 12 + y0, '#ff3a20', 12.5, 2);
  glowEye(p, 39, 12 + y0, '#ff3a20', 12.5, 2);
  if (k === 'cast' || k === 'windup') {
    // a roar under the hood's hem
    p.hline(32, 40, 19 + y0, '#2a0406', 12.4);
    p.hline(33, 39, 20 + y0, '#4e080c', 12.4);
  }
}, '#3a2a30');

// ===================== THE GREAT TOAD =====================

const TOAD = ['#0e1608', '#1a2810', '#2a3c16', '#3c5220', '#52692c', '#6c843c', '#8aa052'];
const TOAD_BELLY = ['#5a5a30', '#7a7848', '#9a9860', '#bab880', '#d8d4a4'];
const GOLD = ['#5a3e10', '#9a7020', '#d0aa40', '#f6dc80'];

export const greattoadFrame = makeSheet(72, 56, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    // belly up, legs in the air
    const i = pose.i;
    const sink = i * 2;
    p.ellipse(34, 44 + sink, 26, 10 - i, TOAD_BELLY, 6);
    spots(p, 10, 34, 50, 20, TOAD_BELLY[0], 0.05, 77);
    limb(p, 20, 40 + sink, 14, 28 + i * 3, 4, 2.5, TOAD, 5);
    limb(p, 48, 40 + sink, 54, 30 + i * 3, 3.5, 2.2, TOAD, 5);
    p.ellipse(60, 46 + sink, 9, 6, TOAD, 5);
    p.px(62, 44 + sink, '#0a0a0a', 6);
    return;
  }
  const hop = k === 'walk' ? [0, 4, 7, 3][pose.i] : 0;
  const squat = k === 'windup' ? 3 : k === 'attack' ? -1 : 0;
  const by = 36 - hop + squat + pose.bob * 0.5;
  // the great hind leg: thigh, shin, a broad webbed foot
  const legOut = k === 'walk' && pose.i === 2 ? 6 : 0;
  p.ellipse(19, by + 4, 11, 9, TOAD, 6);
  limb(p, 14, by + 10, 8 - legOut, 52 - hop * 0.3, 4, 3, TOAD, 5);
  shape(p, [[2 - legOut, 50], [18 - legOut, 50], [20 - legOut, 54], [0 - legOut, 55]], TOAD.slice(1), 4);
  // the body: a heavy warty sack
  p.ellipse(32, by, 24, 15, TOAD, 9);
  // the pale belly under it all
  shape(p, [[16, by + 6], [50, by + 4], [54, by + 13], [20, by + 15]], TOAD_BELLY, 9.2, { dir: 0.5 });
  // the head, wide and flat
  p.ellipse(51, by - 6, 18, 11, TOAD, 10);
  // the throat sac (it swells to croak)
  const sac = k === 'windup' ? 1.4 : k === 'cast' ? 1.9 : 1;
  p.ellipse(56, by + 4, 8 * sac, 5.5 * sac, TOAD_BELLY, 10.5);
  if (sac > 1) for (let a = 0; a < 6; a++) p.px(56 + Math.cos(a) * 5 * sac, by + 4 + Math.sin(a) * 3 * sac, TOAD_BELLY[1], 10.8);
  // mottling and warts on the back and head
  spots(p, 8, by - 18, 60, 24, [TOAD[1], TOAD[2]], 0.09, 1337, 2);
  spots(p, 10, by - 16, 58, 20, TOAD[6], 0.035, 7331);
  // the mouth: a long hard lip from cheek to snout - open when it attacks
  if (k === 'attack') {
    shape(p, [[44, by - 4], [70, by - 8], [70, by + 4], [48, by + 2]], ['#200608', '#3a0c10', '#5a1418'], 10.8, { flat: 0.6 });
    limb(p, 52, by - 1, 70, by + 6, 2.6, 2.2, ['#6a2030', '#9a3040', '#c04a58', '#e07080'], 11.4); // the tongue
  } else {
    for (let x = 40; x <= 68; x++) p.px(x, Math.round(by - 3 + Math.sin((x - 40) / 28 * Math.PI) * 2), TOAD[0], 10.9);
  }
  p.px(68, by - 9, TOAD[0], 10.9); // nostril
  // the bulging eyes: gold, a black slit, a heavy brow
  for (const ex of [46, 58]) {
    p.ellipse(ex, by - 14, 5, 4.6, TOAD, 11);
    p.ellipse(ex + 0.5, by - 14, 3.4, 3.2, GOLD, 11.6);
    p.vline(ex + 1, by - 16, by - 12, '#0a0806', 12);
    p.px(ex - 1, by - 15, '#fff4c8', 12.2);
    p.hline(ex - 4, ex + 3, by - 19, TOAD[1], 11.8); // the brow
  }
  // a rusted circlet sunk into the skin: King of the Bog
  for (let x = 47; x <= 57; x++) p.px(x, by - 18 + (x % 2), GOLD[1], 12.2);
  for (const x of [48, 52, 56]) p.px(x, by - 20, GOLD[2], 12.4);
  // the front leg, splayed, webbed
  const reach = k === 'attack' ? 4 : 0;
  limb(p, 50, by + 6, 56 + reach, 52 - hop * 0.4, 3.4, 2.6, TOAD, 11);
  shape(p, [[51 + reach, 51], [63 + reach, 51], [64 + reach, 55], [50 + reach, 55]], TOAD.slice(1), 10.5);
  // dripping bog-slime
  if (k === 'cast' || k === 'windup') for (let i = 0; i < 4; i++) p.lit(44 + i * 6, by + 14 + (i % 2), '#9ac040', 9, 0.5);
}, '#7a9a52');

// ===================== THE BLOATED FRIAR =====================

const ROBE = ['#120c08', '#22160e', '#342216', '#4a3220', '#60442c', '#785636'];
const FLESH = ['#4a2a22', '#6e4032', '#965a44', '#b8765a', '#d69676', '#ecb294'];
const ROPE = ['#3a3020', '#6a5a38', '#9a8858', '#c8b880'];
const GOO = ['#2a3a08', '#4a6010', '#6e8a1c', '#94b030', '#c0d860'];

export const friarFrame = makeSheet(64, 64, (p, pose) => {
  const k = pose.k;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(32, 58, 22 + i * 2, 5, GOO, 2, false);
    shape(p, [[8, 58 - i * 4], [56, 56 - i * 4], [58, 62], [6, 62]], ROBE, 8 - i * 2);
    p.ellipse(48 - i * 4, 54 - i * 3, 7, 6, FLESH, 9 - i * 2);
    return;
  }
  const [fl, bl] = stride(pose, 2);
  const puff = k === 'windup' ? 3 : k === 'cast' ? 2 : 0;
  const b = pose.bob;
  // sandalled feet under the hem
  p.ellipse(24 + bl, 61, 5, 2.5, FLESH.slice(0, 4), 3);
  p.ellipse(40 + fl, 61, 5, 2.5, FLESH.slice(0, 4), 3.5);
  p.hline(20 + bl, 28 + bl, 60, ROPE[1], 3.6);
  p.hline(36 + fl, 44 + fl, 60, ROPE[1], 4);
  // the robe: a vast belly with a cowl
  shape(p, [[14 - puff, 26 + b], [50 + puff, 26 + b], [58 + puff, 44 + b], [54 + puff, 60], [10 - puff, 60], [6 - puff, 44 + b]], ROBE, 12, { folds: 0.55 });
  // the stain down his front (wine, gravy, worse)
  spots(p, 30, 34 + b, 20, 22, ['#3a1418', '#2a1a10'], 0.25, 31, 2);
  // the rope belt, sunk deep under the gut, and its knotted end
  for (let x = 10 - puff; x <= 55 + puff; x++) p.px(x, Math.round(46 + b + Math.sin(((x - 10) / 46) * Math.PI) * 4), ROPE[2], 12.6);
  limb(p, 22, 50 + b, 20, 58 + b, 1.2, 1, ROPE, 12.6);
  p.ellipse(20, 59 + b, 1.8, 1.6, ROPE, 12.8);
  // the cowl around a neck that isn't there
  shape(p, [[16, 20 + b], [48, 20 + b], [50, 30 + b], [14, 30 + b]], ROBE.slice(1), 13);
  // the head: jowls on jowls, a tonsure, small greedy eyes
  const hy = 14 + b;
  p.ellipse(34, hy + 6, 11 + puff * 0.6, 6, FLESH, 13.5); // the chins
  p.ellipse(34, hy, 10, 9, FLESH, 14);
  p.ellipse(34, hy - 6, 7, 3.5, FLESH.slice(2), 14.4); // the bald pate
  for (let x = 24; x <= 44; x++) if (Math.abs(x - 34) > 5) p.px(x, hy - 3 + (Math.abs(x - 34) > 8 ? 1 : 0), ROBE[3], 14.2); // the ring of hair
  p.ellipse(28, hy + 2, 2.6, 2, '#c04a40', 14.2); // flushed cheeks
  p.ellipse(41, hy + 2, 2.6, 2, '#c04a40', 14.2);
  p.px(30, hy - 1, '#0a0606', 14.6);
  p.px(38, hy - 1, '#0a0606', 14.6);
  p.hline(29, 31, hy - 3, FLESH[1], 14.6);
  p.hline(37, 39, hy - 3, FLESH[1], 14.6);
  p.ellipse(35, hy + 1, 2, 1.6, FLESH[3], 14.8); // the nose
  if (k === 'attack') {
    // he heaves: a gout of green from a gaping mouth
    p.ellipse(35, hy + 6, 3.4, 2.4, '#1a0606', 14.6);
    for (let i = 0; i < 16; i++) p.lit(38 + i * 1.6, hy + 7 + (i * i) / 22 + Math.sin(i) * 1.5, GOO[2 + (i % 3)], 15, 0.7);
  } else {
    p.hline(31, 38, hy + 5, '#5a2020', 14.6); // a greasy smirk
  }
  // the arms: wide sleeves; one hand clutches a roast haunch
  const raise = k === 'cast' ? -14 : k === 'windup' ? -6 : 0;
  limb(p, 14 - puff, 30 + b, 8 - puff, 44 + b + raise, 5, 4.5, ROBE, 12.5);
  p.ellipse(8 - puff, 46 + b + raise, 3, 2.6, FLESH, 13);
  limb(p, 50 + puff, 30 + b, 54 + puff, 42 + b + raise, 5, 4.5, ROBE, 14);
  const hx = 55 + puff;
  const hyy = 44 + b + raise;
  p.ellipse(hx, hyy, 3.2, 2.8, FLESH, 15);
  // the haunch: a bone with a fist of meat
  limb(p, hx - 1, hyy + 1, hx + 5, hyy - 10, 1.2, 1, ['#8a8068', '#c8bc9c', '#ece0c0'], 15.2);
  p.ellipse(hx + 4, hyy - 7, 4.4, 3.6, ['#4a1a10', '#7a2e18', '#a24a28', '#c46a3c'], 15.4);
}, '#6a5440');

// ===================== THE RAT KING =====================

const RFUR = ['#140e0c', '#241a14', '#38281e', '#4e3a2a', '#66503a', '#80684e'];
const PINK = ['#5a2a2e', '#8a4a50', '#b46a70', '#d48c90'];

function rat(p, x, y, ang, h, pose, i, open) {
  // one rat of the knot: a body pointing outward along `ang`, its tail back toward the middle
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const lift = pose.k === 'windup' || pose.k === 'cast' ? 2 : 0;
  const wig = pose.k === 'walk' ? Math.sin(pose.i * 1.6 + i) * 1.2 : 0;
  const bx = x + ca * (2 + lift);
  const by = y + sa * (2 + lift) + wig;
  // legs scrabbling
  for (const s of [-1, 1]) p.line(bx - sa * 3 * s, by + ca * 3 * s, bx - sa * 5 * s + ca * 2, by + ca * 5 * s + sa * 2, RFUR[1], h - 1);
  limb(p, bx - ca * 4, by - sa * 4, bx + ca * 4, by + sa * 4, 3.6, 3.2, RFUR, h);
  // the head and snout
  const hx = bx + ca * 8;
  const hy = by + sa * 8;
  limb(p, bx + ca * 4, by + sa * 4, hx + ca * 2, hy + sa * 2, 3, 1.2, RFUR, h + 0.5);
  p.px(hx + ca * 3, hy + sa * 3, PINK[2], h + 1); // the nose
  p.lit(hx - sa * 1.6, hy + ca * 1.6 - 1, '#ff2a1a', h + 1.2, 1.4); // a red eye
  p.ellipse(hx - ca * 1 - sa * 2.6, hy - sa * 1 + ca * 2.6 - 2, 1.6, 1.4, PINK, h + 1); // an ear
  if (open) {
    p.px(hx + ca * 2 + sa, hy + sa * 2 - ca + 1, '#200606', h + 1.1);
    p.px(hx + ca * 2 + sa * 1.6, hy + sa * 2 - ca * 1.6 + 1, '#e8e0c8', h + 1.2); // a yellow tooth
  }
}

function heapRat(p, x, y, dir, h, pose, i, open, big = 1) {
  // a rat lying along x, head toward dir (1 right, -1 left)
  const wig = pose.k === 'walk' ? Math.sin(pose.i * 1.6 + i * 2) : 0;
  const lift = (pose.k === 'windup' || pose.k === 'cast') && i % 2 ? -2 : 0;
  y += wig * 0.6 + lift;
  for (const s2 of [-3, 2]) limb(p, x + s2 * big, y + 2, x + s2 * big + dir, y + 5, 1, 0.8, RFUR.slice(0, 3), h - 1); // legs
  limb(p, x - dir * 6 * big, y, x + dir * 3 * big, y - 0.5, 4.2 * big, 3.8 * big, RFUR, h);
  const hx = x + dir * 8 * big;
  limb(p, x + dir * 3 * big, y - 0.5, hx + dir * 3, y + 1, 3.2 * big, 1.2, RFUR, h + 0.6);
  p.px(hx + dir * 4, y + 1, PINK[2], h + 1);
  p.ellipse(x + dir * 4 * big, y - 4 * big, 1.8 * big, 1.6 * big, PINK, h + 1); // ear
  p.lit(hx, y - 1.5, '#ff2a1a', h + 1.2, 1.5); // eye
  if (open) {
    p.hline(Math.min(hx + dir, hx + dir * 4), Math.max(hx + dir, hx + dir * 4), y + 2, '#200606', h + 1.1);
    p.px(hx + dir * 2, y + 2, '#e8e0c8', h + 1.2);
  }
  // its tail runs down into the knot
  return [x - dir * 9 * big, y + 1];
}

export const ratkingFrame = makeSheet(64, 48, (p, pose) => {
  const k = pose.k;
  const cx = 32;
  const b = pose.bob * 0.5;
  if (k === 'death') {
    const i = pose.i;
    p.ellipse(cx, 42, 18 + i * 3, 4, ['#2a0406', '#4e080c'], 1, false);
    for (let r = 0; r < 5 - i * 2; r++) heapRat(p, cx - 16 + r * 9, 40 - (r % 2) * 2, r % 2 ? 1 : -1, 4, pose, r, false, 0.9);
    return;
  }
  const open = k === 'attack' || k === 'cast' || k === 'windup';
  const knot = [cx, 40];
  const tails = [];
  // the heap, back row to front
  const rats = [
    [cx - 13, 22 + b, -1, 6],
    [cx + 13, 22 + b, 1, 6],
    [cx - 18, 30 + b, -1, 8],
    [cx + 18, 30 + b, 1, 8],
    [cx - 8, 36 + b, -1, 10],
    [cx + 9, 36 + b, 1, 10],
  ];
  // the tails, knotted: drawn first so the bodies sit on them
  for (const [x, y, dir] of rats) tails.push([x - dir * 9, y + 1]);
  for (const [tx, ty] of tails) {
    for (let s2 = 0; s2 <= 10; s2++) {
      const t = s2 / 10;
      const x = tx + (knot[0] - tx) * t + Math.sin(t * 9) * 2;
      const y = ty + (knot[1] - ty) * t;
      p.px(x, y, PINK[1 + (s2 % 3)], 4.5);
    }
  }
  // the knot itself
  for (let a = 0; a < 40; a++) {
    const t = a * 0.5;
    p.px(knot[0] + Math.cos(t) * (2 + (a % 5)), knot[1] + Math.sin(t * 1.3) * 2.5, PINK[a % 4], 5);
  }
  rats.forEach(([x, y, dir, h], i) => heapRat(p, x, y, dir, h, pose, i, open));
  // the king himself, on top, crowned
  const ky = 14 + b + (open ? -2 : 0);
  heapRat(p, cx - 1, ky, 1, 12, pose, 9, open, 1.15);
  for (let x = cx - 4; x <= cx + 3; x++) p.px(x, ky - 6, GOLD[x % 2 ? 1 : 2], 12.6);
  for (const x of [cx - 4, cx - 1, cx + 2]) {
    p.px(x, ky - 7, GOLD[2], 12.8);
    p.px(x, ky - 8, GOLD[3], 13);
  }
  p.lit(cx - 1, ky - 6, '#c02634', 13, 0.8);
}, '#7a6450');
