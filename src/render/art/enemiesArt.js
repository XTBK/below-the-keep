// Chapter 1 enemies. Every sheet has row 0 = facing right, row 1 = facing left (mirrored),
// except the fly (it has no facing). Column layouts are listed in ENEMY_ANIMS below and
// referenced by the asset manifest.

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CREATURES as C } from '../../data/palettes.js';
import { barrel, barrelBroken } from './propsArt.js';

const IRON = S.iron;
const EYE_RED = '#ff3a20';

/** Animation tables: { name: { start, count, fps, loop } } */
export const ENEMY_ANIMS = {
  rat: { idle: [0, 2, 3], walk: [2, 4, 14], windup: [6, 1, 1], attack: [7, 1, 1], death: [8, 3, 9, false] },
  gaoler: { idle: [0, 2, 2], walk: [2, 4, 6], windup: [6, 1, 1], attack: [7, 1, 1], death: [8, 3, 6, false] },
  prisoner: { idle: [0, 2, 2.5], walk: [2, 4, 7], windup: [6, 1, 1], attack: [7, 1, 1], death: [8, 3, 7, false] },
  imp: { idle: [0, 2, 4], walk: [2, 4, 10], windup: [6, 1, 1], attack: [7, 1, 1], death: [8, 3, 6, false] },
  ghoul: { idle: [0, 2, 2], walk: [2, 4, 5], windup: [6, 1, 1], attack: [7, 1, 1], death: [8, 3, 7, false] },
  fly: { idle: [0, 2, 18], walk: [0, 2, 18], death: [0, 1, 1, false] },
  crossbowman: { idle: [0, 2, 2], walk: [2, 4, 8], aim: [6, 1, 1], attack: [7, 1, 1], reload: [8, 1, 1], death: [9, 3, 6, false] },
  mimic: { dormant: [0, 1, 1], wake: [1, 2, 3.5, false], idle: [2, 1, 1], crouch: [3, 1, 1], air: [4, 1, 1], land: [5, 1, 1], death: [6, 3, 6, false] },
};

export const ENEMY_COLS = { rat: 11, gaoler: 11, prisoner: 11, imp: 11, ghoul: 11, fly: 2, crossbowman: 12, mimic: 9 };

/** Converts [start, count, fps, loop] tables into the manifest's { start, count, fps, loop } objects. */
export function animsFor(key) {
  const out = {};
  for (const [name, [start, count, fps, loop]] of Object.entries(ENEMY_ANIMS[key])) out[name] = { start, count, fps, loop: loop !== false };
  return out;
}

/** Wraps a "draw facing right" function into a two-row (right, left) sheet generator. */
function facing(draw) {
  return (col, row) => (row === 0 ? draw(col) : draw(col).mirrored());
}

function ring(p, cx, cy, r, ramp, h) {
  const n = Math.max(12, Math.round(r * 7));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.sin(a) < 0 ? ramp[ramp.length - 1] : ramp[1], h);
  }
}

function thickLine(p, x0, y0, x1, y1, ramp, h) {
  p.line(x0, y0, x1, y1, ramp[1], h);
  p.line(x0, y0 - 1, x1, y1 - 1, ramp[2], h + 0.3);
  p.line(x0 + 1, y0, x1 + 1, y1, ramp[1], h);
}

/** Make some pixels vanish (crumbling to ash, dissolving). */
function erode(p, rng, amount) {
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.filled(x, y) && rng.chance(amount)) p.px(x, y, '#000000', 0, 0);
}

// ---------------------------------------------------------------------------------------------
// 1. Plague Rat (24 x 16): low, long, pink tail, red bead eye, green plague sores
// ---------------------------------------------------------------------------------------------
function ratDraw(col) {
  const p = new Painter(24, 16);
  const F = C.ratFur;
  if (col >= 8) {
    const d = col - 8;
    if (d < 2) {
      // flipped onto its back, legs in the air
      p.ellipse(11, 11 + d, 6.5, 3 - d * 0.8, F, 2);
      p.hline(8, 14, 10 + d, F[4], 2.5); // pale belly
      p.ellipse(16, 11 + d, 2.8, 2.2, F, 2);
      p.px(19, 11 + d, C.ratPink[1], 2);
      for (const lx of [8, 10, 13, 15]) p.vline(lx, 7 + d, 8 + d, C.ratPink[0], 2);
      p.line(5, 11 + d, 1, 13, C.ratPink[0], 1);
    } else {
      p.ellipse(11, 13, 8, 2.2, C.blood.slice(1), 0.2, false); // blood pool
      p.ellipse(11, 12, 6, 2, F.slice(0, 3), 1.5);
      p.px(17, 12, C.ratPink[1], 1.5);
      p.line(5, 12, 1, 13, C.ratPink[0], 1);
    }
    p.outline(S.outline);
    return p;
  }
  const run = col >= 2 && col <= 5 ? col - 2 : -1;
  const bob = col === 1 ? 1 : run === 1 || run === 3 ? -1 : 0;
  const by = 10 + bob;
  const tw = run >= 0 ? [0, 1, 0, -1][run] : col === 1 ? 1 : 0;
  // tail
  p.line(5, by, 2, by + 1 + tw, C.ratPink[0], 1);
  p.line(2, by + 1 + tw, 0, by - 1 + tw, C.ratPink[0], 1);
  // legs
  for (const [lx, ph] of [[8, 0], [10, 2], [14, 1], [16, 3]]) {
    const lift = run >= 0 && (run + ph) % 4 < 2 ? 1 : 0;
    p.vline(lx, 13 - lift, 14 - lift, F[0], 1);
    p.px(lx, 14 - lift, C.ratPink[0], 1);
  }
  if (col === 6) {
    // rearing up: the telegraph before a bite
    p.ellipse(10, 9, 5, 4.2, F, 3);
    p.ellipse(15, 5, 3, 2.6, F, 3.5);
    p.px(15, 9, C.ratPink[1], 3.5);
    p.px(16, 8, C.ratPink[1], 3.5);
    p.px(16, 4, EYE_RED, 4);
    p.px(14, 2, C.ratPink[1], 3.6);
    p.px(14, 3, C.ratPink[0], 3.6);
    p.px(18, 5, C.ratPink[2], 4);
    p.px(17, 6, C.teeth[2], 4);
  } else {
    const hx = col === 7 ? 19 : 17;
    p.ellipse(11, by, 6.5, 3.6, F, 3);
    p.ellipse(hx, by - 1, 3.2, 2.6, F, 3.5);
    p.px(hx + 3, by - 1, C.ratPink[2], 3.6);
    p.px(hx + 2, by, C.ratPink[1], 3.4);
    p.px(hx, by - 2, EYE_RED, 4);
    p.px(hx - 2, by - 4, C.ratPink[1], 3.6);
    p.px(hx - 2, by - 3, C.ratPink[0], 3.6);
    if (col === 7) {
      p.px(hx + 3, by, '#200808', 3);
      p.px(hx + 3, by + 1, C.teeth[2], 3.4);
      p.px(hx + 2, by + 1, C.teeth[1], 3.4);
    }
  }
  // plague sores and fur texture
  const sy = col === 6 ? 8 : by;
  p.dot(9, sy - 2, C.sore[2], 3.3);
  p.dot(10, sy - 2, C.sore[1], 3.3);
  p.dot(13, sy + 1, C.sore[1], 3);
  p.dot(7, sy, F[4]);
  p.dot(12, sy - 3, F[4]);
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// 2. Gaoler (40 x 40): a fat, bald jailer in a stained leather apron, swinging a ring of keys
// ---------------------------------------------------------------------------------------------
function keyRing(p, cx, cy, h) {
  ring(p, cx, cy, 3.5, IRON.slice(2, 6), h);
  p.vline(cx - 1, cy + 3, cy + 7, IRON[3], h);
  p.px(cx - 2, cy + 7, IRON[4], h);
  p.vline(cx + 2, cy + 3, cy + 6, IRON[2], h);
  p.px(cx + 3, cy + 6, IRON[3], h);
  p.vline(cx + 4, cy + 1, cy + 4, S.brass[2], h); // one big brass key
  p.px(cx + 5, cy + 4, S.brass[3], h);
}

function gaolerBody(p, o) {
  const { dx = 0, dy = 0, arm = 'hang', liftL = 0, liftR = 0, headDrop = 0, kneel = false } = o;
  const SK = C.jailerSkin;
  const L = C.linen;
  const LE = S.leather;
  if (!kneel) {
    for (const [lx, lift] of [[15, liftL], [22, liftR]]) {
      p.cyl(lx + dx, 30 + dy - lift, 4, 7, S.trousers, 3);
      p.cyl(lx + dx - 1, 36 + dy - lift, 5, 3, LE.slice(0, 3), 3);
    }
  }
  // back arm
  p.cyl(9 + dx, 16 + dy, 3, 9, SK.slice(0, 4), 4);
  p.rect(9 + dx, 25 + dy, 3, 2, SK[2], 4);
  // belly and apron
  p.ellipse(20 + dx, 23 + dy, 10.5, 10, L, 6);
  p.ellipse(22 + dx, 27 + dy, 7, 7.5, LE, 6.6);
  p.vline(18 + dx, 20 + dy, 25 + dy, LE[0], 6.4); // apron straps
  p.vline(26 + dx, 20 + dy, 25 + dy, LE[0], 6.4);
  p.tint(23 + dx, 29 + dy, '#2a0a06', 0.6); // old stains
  p.tint(21 + dx, 31 + dy, '#2a0a06', 0.5);
  p.tint(14 + dx, 19 + dy, L[1], 0.5);
  p.hline(11 + dx, 29 + dx, 21 + dy, LE[1], 7);
  p.px(24 + dx, 21 + dy, IRON[4], 7.4);
  // head
  const hx = 22 + dx;
  const hy = 11 + dy + headDrop;
  p.ellipse(hx, hy, 5.2, 5, SK, 7.5);
  for (let x = hx - 3; x <= hx + 3; x++) p.dot(x, hy + 3, SK[1], 7.4); // stubble
  p.px(hx + 3, hy - 1, '#1a0c08', 8);
  p.hline(hx + 2, hx + 4, hy - 2, SK[0], 8);
  p.px(hx + 5, hy, SK[4], 8.2);
  p.px(hx + 5, hy + 1, SK[2], 8);
  p.px(hx - 3, hy, SK[2], 7.4);
  p.px(hx + 3, hy + 3, SK[0], 7.6);
  p.px(hx - 2, hy - 4, SK[4], 8.2);
  p.px(hx - 1, hy - 4, SK[4], 8.2);
  // front arm + keys
  if (arm === 'hang') {
    p.cyl(28 + dx, 16 + dy, 3, 10, SK, 7.5);
    p.rect(28 + dx, 26 + dy, 3, 3, SK[3], 7.8);
    keyRing(p, 31 + dx, 30 + dy, 8);
  } else if (arm === 'windup') {
    thickLine(p, 27 + dx, 16 + dy, 15 + dx, 7 + dy, SK, 8);
    p.rect(13 + dx, 5 + dy, 3, 3, SK[3], 8.4);
    keyRing(p, 9 + dx, 4 + dy, 8.6);
  } else if (arm === 'swing') {
    thickLine(p, 27 + dx, 17 + dy, 34 + dx, 21 + dy, SK, 8);
    p.rect(34 + dx, 20 + dy, 3, 3, SK[3], 8.4);
    keyRing(p, 37 + dx, 22 + dy, 8.6);
    // motion smear of the swing
    for (let a = -1.3; a < 0.6; a += 0.12) p.px(26 + Math.cos(a) * 13, 20 + Math.sin(a) * 13, IRON[5], 9);
  }
}

function gaolerDraw(col) {
  const p = new Painter(40, 40);
  if (col >= 8) {
    const d = col - 8;
    if (d === 0) gaolerBody(p, { dx: -2, headDrop: 2, arm: 'hang' });
    else if (d === 1) gaolerBody(p, { dy: 5, kneel: true, headDrop: 3 });
    else {
      // face down on the floor, keys flung aside
      p.ellipse(19, 33, 14, 5, C.linen, 4);
      p.ellipse(19, 35, 9, 3, S.leather, 4.4);
      p.ellipse(33, 33, 4.2, 3.8, C.jailerSkin, 5);
      p.px(31, 30, C.jailerSkin[4], 5);
      keyRing(p, 6, 30, 3);
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const bob = col === 1 ? 1 : walk === 1 || walk === 3 ? -1 : 0;
    gaolerBody(p, {
      dy: bob,
      arm: col === 6 ? 'windup' : col === 7 ? 'swing' : 'hang',
      liftL: walk === 0 ? 1 : 0,
      liftR: walk === 2 ? 1 : 0,
    });
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// 3. Chained Prisoner (32 x 32): starved, matted hair, iron collar (the chain is drawn live)
// ---------------------------------------------------------------------------------------------
const HAIR = ['#100c0a', '#1e1712', '#2e231a'];

function prisonerBody(p, o) {
  const { dy = 0, lean = 0, liftL = 0, liftR = 0, arms = 'hang' } = o;
  const PS = C.prisonerSkin;
  const R = C.rags;
  // legs
  p.cyl(12, 22 + dy - liftL, 2, 8 - dy, PS.slice(0, 4), 2);
  p.cyl(17, 22 + dy - liftR, 2, 8 - dy, PS.slice(1, 5), 2);
  // back arm
  if (arms === 'hang') p.line(12, 14 + dy, 10, 22 + dy, PS[1], 2.5);
  else if (arms === 'back') p.line(12, 14 + dy, 7, 18 + dy, PS[1], 2.5);
  // ragged tunic
  p.ellipse(15 + lean, 17 + dy, 4.6, 6.5, R, 4);
  for (let x = 11; x <= 19; x += 2) p.px(x + lean, 23 + dy, R[1], 2); // torn hem
  p.px(13 + lean, 17 + dy, R[0], 3.5);
  // collar
  p.hline(14 + lean, 20 + lean, 11 + dy, IRON[3], 5.5);
  p.px(17 + lean, 11 + dy, IRON[5], 6);
  // head: hunched forward, hair hanging over the face
  const hx = 19 + lean * 2;
  const hy = 8 + dy;
  p.ellipse(hx, hy, 3.6, 3.6, PS, 5);
  p.ellipse(hx - 1, hy - 2, 4, 3, HAIR, 5.5);
  p.vline(hx - 4, hy - 1, hy + 4, HAIR[1], 5);
  p.vline(hx - 3, hy, hy + 5, HAIR[0], 5);
  p.vline(hx + 1, hy, hy + 2, HAIR[1], 5.6);
  p.px(hx + 2, hy, '#e0d8b8', 5.6); // one wild, staring eye
  p.px(hx + 3, hy + 2, PS[0], 5);
  p.px(hx + 1, hy + 3, PS[1], 5);
  // front arm
  if (arms === 'hang') {
    p.line(17, 14 + dy, 19, 21 + dy, PS[3], 5);
    p.px(20, 22 + dy, PS[2], 5);
    p.px(18, 22 + dy, PS[2], 5);
  } else if (arms === 'back') {
    p.line(17, 14 + dy, 13, 19 + dy, PS[3], 5);
  }
}

function prisonerDraw(col) {
  const p = new Painter(32, 32);
  const PS = C.prisonerSkin;
  if (col === 7) {
    // the lunge: stretched out flat, claws first
    p.line(12, 19, 4, 26, PS[1], 2);
    p.line(13, 20, 8, 28, PS[2], 2);
    p.ellipse(16, 17, 8, 4.5, C.rags, 4);
    p.hline(20, 23, 14, IRON[3], 5.5);
    p.ellipse(26, 14, 3.6, 3.4, PS, 5);
    p.ellipse(25, 12, 4, 2.6, HAIR, 5.5);
    p.px(28, 14, '#e0d8b8', 5.6);
    p.line(20, 15, 30, 12, PS[3], 5);
    p.line(20, 18, 30, 18, PS[3], 5);
    p.px(31, 11, C.teeth[1], 5);
    p.px(31, 13, C.teeth[1], 5);
    p.px(31, 17, C.teeth[1], 5);
    p.px(31, 19, C.teeth[1], 5);
  } else if (col >= 8) {
    const d = col - 8;
    if (d === 0) prisonerBody(p, { dy: 3, arms: 'hang' });
    else if (d === 1) prisonerBody(p, { dy: 6, arms: 'back' });
    else {
      p.ellipse(15, 26, 9, 3.4, C.rags, 3);
      p.ellipse(25, 26, 3.4, 3, PS, 3.5);
      p.ellipse(25, 25, 3.6, 2, HAIR, 4);
      p.hline(20, 23, 25, IRON[3], 4);
      p.line(5, 27, 8, 28, PS[2], 2);
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const bob = col === 1 ? 1 : walk === 1 || walk === 3 ? -1 : 0;
    if (col === 6) prisonerBody(p, { dy: 3, lean: 1, arms: 'back' });
    else prisonerBody(p, { dy: bob, liftL: walk === 0 ? 1 : 0, liftR: walk === 2 ? 1 : 0 });
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// 4. Torch Imp (24 x 24): a soot-black imp with ember cracks and glowing eyes, lobbing fire
// ---------------------------------------------------------------------------------------------
const ASH = ['#2a2826', '#3e3b38', '#5a5652', '#7a756e'];

function impBody(p, o) {
  const { bob = 0, liftL = 0, liftR = 0, arm = 'idle', body = C.soot, embers = true } = o;
  const E = S.fire;
  p.vline(10, 17 + bob, 21 - liftL, body[1], 2);
  p.vline(13, 17 + bob, 21 - liftR, body[2], 2);
  p.px(9, 21 - liftL, body[1], 2);
  p.px(14, 21 - liftR, body[2], 2);
  p.line(8, 15 + bob, 4, 13 + bob, body[1], 2); // tail
  p.px(3, 12 + bob, embers ? E[4] : body[3], 2.5);
  p.ellipse(12, 14 + bob, 4.5, 4.5, body, 4);
  p.ellipse(13, 7 + bob, 4, 3.5, body, 5);
  p.px(10, 3 + bob, '#4a2a20', 5.5); // horns
  p.px(10, 2 + bob, '#6a3a26', 5.8);
  p.px(16, 3 + bob, '#4a2a20', 5.5);
  p.px(17, 2 + bob, '#6a3a26', 5.8);
  if (embers) {
    p.px(11, 13 + bob, E[2], 4.2);
    p.px(12, 14 + bob, E[3], 4.4);
    p.px(13, 15 + bob, E[2], 4.2);
    p.px(10, 16 + bob, E[1], 4);
    p.px(14, 6 + bob, '#ffd060', 5.6); // eyes
    p.px(16, 6 + bob, '#ffd060', 5.6);
    p.hline(13, 16, 9 + bob, E[3], 5.2); // grin
  } else {
    p.px(14, 6 + bob, body[0], 5.6);
    p.px(16, 6 + bob, body[0], 5.6);
  }
  if (arm === 'idle') p.line(15, 12 + bob, 17, 16 + bob, body[2], 4.5);
  else if (arm === 'windup') {
    p.line(10, 11 + bob, 6, 6 + bob, body[2], 4.5);
    p.ellipse(5, 4 + bob, 2.6, 2.6, [E[3], E[4], E[5]], 5);
  } else if (arm === 'throw') {
    p.line(15, 11 + bob, 21, 9 + bob, body[2], 4.5);
    p.px(22, 8 + bob, E[4], 5);
  }
}

function impDraw(col) {
  const p = new Painter(24, 24);
  if (col >= 8) {
    const d = col - 8;
    if (d < 2) {
      impBody(p, { body: ASH, embers: d === 0, arm: 'none' });
      erode(p, new Rng(400 + d), d === 0 ? 0.1 : 0.45);
    } else {
      p.ellipse(12, 20, 5.5, 2, ASH, 1.5); // heap of ash
      p.px(11, 19, S.fire[2], 1.8);
      p.px(14, 20, S.fire[1], 1.8);
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const bob = col === 1 ? 1 : walk === 1 || walk === 3 ? -1 : 0;
    impBody(p, {
      bob,
      liftL: walk === 0 ? 1 : 0,
      liftR: walk === 2 ? 1 : 0,
      arm: col === 6 ? 'windup' : col === 7 ? 'throw' : 'idle',
    });
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// 5. Ghoul (32 x 32): hunched, grey-green, long clawed arms, jaw hanging loose
// ---------------------------------------------------------------------------------------------
function ghoulBody(p, o) {
  const { bob = 0, swing = 0, liftL = 0, liftR = 0, arms = 'hang', bloat = 0 } = o;
  const G = C.ghoulSkin;
  p.line(13, 22 + bob, 12, 29 - liftL, G[1], 2);
  p.line(17, 22 + bob, 18, 29 - liftR, G[2], 2);
  p.px(11, 29 - liftL, G[1], 2);
  p.px(19, 29 - liftR, G[2], 2);
  if (arms === 'hang') p.line(14, 14 + bob, 10 - swing, 25 + bob, G[1], 3);
  p.ellipse(15, 17 + bob, 5.5 + bloat, 6.5 + bloat, G, 4);
  if (bloat) {
    for (const [x, y] of [[12, 15], [17, 19], [14, 21], [18, 14]]) p.dot(x, y + bob, C.goo[1], 4.5);
  } else {
    for (let y = 14; y <= 18; y += 2) p.hline(13, 17, y + bob, G[1]); // ribs
  }
  p.rect(12, 21 + bob, 7, 3, '#2a1e14', 3.5);
  p.px(13, 24 + bob, '#2a1e14', 3);
  p.px(17, 24 + bob, '#2a1e14', 3);
  // head, low and forward
  p.ellipse(20, 11 + bob, 3.8, 3.6, G, 5);
  p.px(21, 10 + bob, '#060806', 5.4);
  p.px(23, 10 + bob, '#060806', 5.4);
  p.px(22, 11 + bob, '#c8d0a0', 5.6);
  p.px(22, 14 + bob, '#1a0a0a', 4.6);
  p.px(23, 13 + bob, C.teeth[1], 5);
  p.px(18, 7 + bob, '#2a2a22', 5.5);
  p.px(19, 7 + bob, '#2a2a22', 5.5);
  if (arms === 'hang') {
    p.line(18, 14 + bob, 22 + swing, 26 + bob, G[3], 5);
    p.px(23 + swing, 27 + bob, C.teeth[1], 5);
    p.px(21 + swing, 27 + bob, C.teeth[1], 5);
  } else if (arms === 'up') {
    p.line(16, 13 + bob, 13, 2, G[2], 5.5);
    p.line(18, 13 + bob, 22, 2, G[3], 5.5);
    for (const x of [12, 14, 21, 23]) p.px(x, 1, C.teeth[1], 6);
  } else if (arms === 'swipe') {
    p.line(18, 14 + bob, 29, 20 + bob, G[3], 5.5);
    p.line(16, 14 + bob, 28, 23 + bob, G[2], 5.5);
    for (const [x, y] of [[30, 19], [30, 21], [29, 24]]) p.px(x, y + bob, C.teeth[1], 6);
    for (let a = -0.9; a < 0.9; a += 0.15) p.px(20 + Math.cos(a) * 11, 18 + Math.sin(a) * 11, '#9aa48a', 6);
  }
}

function ghoulDraw(col) {
  const p = new Painter(32, 32);
  if (col >= 8) {
    const d = col - 8;
    const rng = new Rng(500 + d);
    if (d === 0) ghoulBody(p, { bloat: 2.5, bob: 1 });
    else if (d === 1) {
      // burst: chunks flying apart in a spray of goo
      for (let i = 0; i < 9; i++) p.ellipse(rng.int(5, 27), rng.int(10, 28), rng.float(1.2, 2.6), rng.float(1, 2), C.ghoulSkin, 2);
      for (let i = 0; i < 14; i++) p.px(rng.int(3, 29), rng.int(8, 30), rng.pick(C.goo), 1);
    } else {
      p.ellipse(15, 27, 8, 2.6, C.goo.slice(0, 3), 0.3, false);
      p.ellipse(14, 26, 4, 2, C.ghoulSkin, 1.5);
      p.line(17, 26, 21, 24, C.teeth[1], 1.5); // a bone
      p.px(22, 23, C.teeth[2], 1.5);
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const lurch = walk >= 0 ? [0, 2, 1, 2][walk] : col === 1 ? 1 : 0;
    ghoulBody(p, {
      bob: lurch,
      swing: walk >= 0 ? [2, 0, -2, 0][walk] : 0,
      liftL: walk === 0 ? 1 : 0,
      liftR: walk === 2 ? 1 : 0,
      arms: col === 6 ? 'up' : col === 7 ? 'swipe' : 'hang',
    });
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// Carrion fly (8 x 8): spawned in a swarm when a ghoul bursts
// ---------------------------------------------------------------------------------------------
export function flyFrame(col) {
  const p = new Painter(8, 8);
  p.rect(3, 3, 2, 2, '#10141a', 1);
  p.px(5, 3, '#8a1a10', 1.2);
  p.px(3, 3, '#283040', 1.4);
  if (col === 0) {
    p.px(2, 1, '#a8b4c0', 1);
    p.px(2, 2, '#7a8694', 1);
    p.px(5, 1, '#a8b4c0', 1);
    p.px(5, 2, '#7a8694', 1);
  } else {
    p.px(1, 3, '#a8b4c0', 1);
    p.px(2, 3, '#7a8694', 1);
    p.px(6, 4, '#a8b4c0', 1);
  }
  return p;
}

// ---------------------------------------------------------------------------------------------
// 6. Crossbowman (32 x 32): gaol guard in a quilted gambeson and kettle helm, royal livery
// ---------------------------------------------------------------------------------------------
function crossbow(p, mode, bob) {
  const W = S.wood;
  if (mode === 'low') {
    p.line(16, 18 + bob, 25, 19 + bob, W[3], 6);
    p.vline(25, 15 + bob, 23 + bob, IRON[3], 6.2);
    p.line(24, 15 + bob, 22, 19 + bob, '#c8c0a8', 6.4);
    p.line(22, 19 + bob, 24, 23 + bob, '#c8c0a8', 6.4);
    p.px(17, 18 + bob, S.skin[3], 6.5);
    p.px(22, 19 + bob, S.skin[3], 6.5);
  } else if (mode === 'aim' || mode === 'fire') {
    const kick = mode === 'fire' ? -1 : 0;
    p.line(14 + kick, 12, 27 + kick, 12, W[3], 7);
    p.line(14 + kick, 13, 26 + kick, 13, W[2], 7);
    p.vline(27 + kick, 8, 16, IRON[4], 7.2);
    if (mode === 'aim') {
      p.line(26, 8, 22, 12, '#c8c0a8', 7.4);
      p.line(22, 12, 26, 16, '#c8c0a8', 7.4);
      p.px(28, 12, IRON[5], 7.4); // loaded bolt tip
    } else {
      p.vline(26 + kick, 8, 16, '#c8c0a8', 7.4);
      p.px(30, 12, S.fire[5], 7.5); // spark from the release
    }
    p.px(16, 13, S.skin[3], 7.5);
    p.px(23, 13, S.skin[3], 7.5);
  } else if (mode === 'reload') {
    p.line(18, 16 + bob, 20, 27, W[3], 6);
    p.hline(16, 24, 28, IRON[3], 6);
    p.line(19, 14 + bob, 19, 20 + bob, S.skin[3], 6.5); // hauling the string
  }
}

function crossbowmanBody(p, o) {
  const { bob = 0, liftL = 0, liftR = 0, bow = 'low', dx = 0 } = o;
  const GB = C.gambeson;
  const RY = C.royal;
  p.cyl(12 + dx, 22 + bob, 3, 6 - bob, GB.slice(0, 3), 2.5);
  p.cyl(17 + dx, 22 + bob, 3, 6 - bob, GB.slice(1, 4), 2.5);
  p.cyl(11 + dx, 27 - liftL, 4, 3, S.leather.slice(0, 3), 2.5);
  p.cyl(17 + dx, 27 - liftR, 4, 3, S.leather.slice(0, 3), 2.5);
  p.rect(8 + dx, 12 + bob, 2, 7, S.leather[2], 3.5); // quiver
  p.px(8 + dx, 11 + bob, IRON[4], 4);
  p.px(9 + dx, 10 + bob, IRON[4], 4);
  p.cyl(10 + dx, 12 + bob, 11, 11, GB, 4.5);
  for (let x = 11; x < 21; x += 3) p.vline(x + dx, 13 + bob, 22 + bob, GB[1]); // quilting
  for (let y = 14; y < 23; y += 3) p.hline(11 + dx, 20 + dx, y + bob, GB[1]);
  p.rect(14 + dx, 13 + bob, 3, 10, RY[2], 5);
  p.vline(16 + dx, 13 + bob, 22 + bob, RY[1], 5);
  p.px(15 + dx, 16 + bob, '#1a1408', 5.2); // the Mad King's mark
  p.px(14 + dx, 15 + bob, '#1a1408', 5.2);
  p.px(16 + dx, 15 + bob, '#1a1408', 5.2);
  p.hline(10 + dx, 20 + dx, 20 + bob, S.leather[1], 5);
  // head + kettle helm (face in the shadow of the brim)
  p.ellipse(16 + dx, 8 + bob, 3.6, 3.6, S.skin.slice(0, 4), 6);
  for (let x = 13; x <= 19; x++) p.tint(x + dx, 8 + bob, '#100808', 0.5);
  p.px(18 + dx, 9 + bob, '#d8d0b0', 6.4);
  p.hline(10 + dx, 22 + dx, 6 + bob, IRON[2], 6.5);
  p.hline(11 + dx, 21 + dx, 7 + bob, IRON[1], 6.3);
  p.ellipse(16 + dx, 4 + bob, 4.6, 3.2, IRON.slice(1, 6), 7);
  p.px(14 + dx, 2 + bob, IRON[5], 7.4);
  crossbow(p, bow, bob);
}

function crossbowmanDraw(col) {
  const p = new Painter(32, 32);
  if (col >= 9) {
    const d = col - 9;
    if (d === 0) crossbowmanBody(p, { dx: -2, bob: 1, bow: 'low' });
    else if (d === 1) {
      crossbowmanBody(p, { dx: -3, bob: 4, bow: 'none' });
      p.line(20, 26, 28, 28, S.wood[3], 2);
    } else {
      // on his back; helmet rolled away, crossbow dropped
      p.ellipse(14, 26, 9, 3.6, C.gambeson, 3);
      p.rect(12, 24, 3, 5, C.royal[2], 3.4);
      p.ellipse(5, 26, 3, 2.6, S.skin.slice(0, 4), 3.5);
      p.ellipse(27, 27, 3.6, 2.4, IRON.slice(1, 6), 3);
      p.line(17, 30, 26, 30, S.wood[3], 1.5);
      p.vline(26, 28, 31, IRON[3], 1.5);
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const bob = col === 1 ? 1 : walk === 1 || walk === 3 ? -1 : 0;
    const bow = col === 6 ? 'aim' : col === 7 ? 'fire' : col === 8 ? 'reload' : 'low';
    crossbowmanBody(p, { bob, liftL: walk === 0 ? 1 : 0, liftR: walk === 2 ? 1 : 0, bow });
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// 7. Barrel Mimic (32 x 32): frame 0 is EXACTLY the ordinary barrel; then the lid opens...
// ---------------------------------------------------------------------------------------------
function mimicBody(p, o) {
  const { top = 9, bottom = 29, lid = 0, legs = false } = o;
  const W = S.wood;
  if (legs) {
    p.rect(10, bottom + 1, 3, 2, W[1], 1);
    p.rect(19, bottom + 1, 3, 2, W[1], 1);
    p.px(10, bottom + 2, W[0], 1);
  }
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const bulge = t > 0.15 && t < 0.85 ? 1 : 0;
    p.cyl(7 - bulge, y, 18 + bulge * 2, 1, W.slice(1, 6), 6);
  }
  for (const sx of [11, 15, 19, 23]) for (let y = top + 1; y < bottom; y++) p.tint(sx, y, W[0], 0.55);
  for (const f of [0.18, 0.78]) {
    const hy = Math.round(top + (bottom - top) * f);
    for (let y = hy; y < hy + 2; y++) p.cyl(6, y, 20, 1, IRON.slice(1, 6), 6.6);
    p.px(9, hy, IRON[5], 7);
    p.px(16, hy, IRON[5], 7);
  }
  if (lid === 0) {
    p.ellipse(16, top, 9.5, 4, W[1], 7, false);
    p.ellipse(16, top, 8, 3, W.slice(2, 5), 7.4, false);
  } else if (lid === 1) {
    // ajar: two eyes glinting in the gap
    p.ellipse(16, top, 9.5, 3, '#0e0606', 6, false);
    p.px(13, top, '#ffe060', 6.5);
    p.px(19, top, '#ffe060', 6.5);
    p.ellipse(16, top - 4, 9, 3.4, W.slice(2, 5), 7.4, false);
  } else {
    // wide open: a ring of teeth around a dark maw, tongue lolling out
    p.ellipse(15, top - 8, 8.5, 3, W.slice(1, 4), 7.4, false); // lid flipped back
    p.ellipse(16, top, 9, 4, '#140606', 6, false);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      if (i % 2 === 0) p.px(16 + Math.cos(a) * 7.5, top + Math.sin(a) * 3.2, C.teeth[i % 4 === 0 ? 2 : 1], 7);
    }
    p.rect(15, top + 2, 3, 4, C.tongue[1], 7);
    p.px(15, top + 5, C.tongue[2], 7);
    p.px(17, top + 6, C.tongue[0], 6.8);
  }
}

function mimicDraw(col) {
  if (col === 0) return barrel();
  const p = new Painter(32, 32);
  if (col === 1) mimicBody(p, { lid: 1 });
  else if (col === 2) mimicBody(p, { lid: 2, legs: true, bottom: 28 });
  else if (col === 3) mimicBody(p, { lid: 2, top: 12, bottom: 29, legs: true }); // crouch (squashed)
  else if (col === 4) mimicBody(p, { lid: 2, top: 6, bottom: 26, legs: true }); // airborne (stretched)
  else if (col === 5) mimicBody(p, { lid: 0, top: 10, legs: true }); // slams shut on landing
  else if (col === 6) {
    mimicBody(p, { lid: 2, legs: true, bottom: 28 });
    const rng = new Rng(77);
    for (let i = 0; i < 4; i++) {
      let x = rng.int(9, 22);
      for (let y = rng.int(12, 18); y < 28; y++) {
        p.dot(x, y, '#0a0604', 2);
        if (rng.chance(0.3)) x += rng.pick([-1, 1]);
      }
    }
  } else {
    const b = barrelBroken();
    p.blit(b, 0, 0);
    p.ellipse(16, 25, col === 7 ? 9 : 7, 3, C.goo, 0.4, false);
    if (col === 7) for (const [x, y] of [[6, 18], [26, 17], [10, 14], [22, 13]]) p.px(x, y, C.goo[2], 1);
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// Projectiles, decals, props
// ---------------------------------------------------------------------------------------------

/** Crossbow bolt, 16x16, 8 directions (frame k points at angle k * 45 degrees, 0 = right, counter-clockwise). */
export function boltFrame(k) {
  const p = new Painter(16, 16);
  const a = (k * Math.PI) / 4;
  const ca = Math.cos(a);
  const sa = -Math.sin(a); // canvas y points down
  for (let t = -6; t <= 4; t++) p.px(8 + ca * t, 8 + sa * t, t < -4 ? '#d8d0c0' : S.wood[4], 1);
  for (let t = 5; t <= 6; t++) p.px(8 + ca * t, 8 + sa * t, IRON[5], 1);
  p.px(8 - ca * 6 - sa, 8 - sa * 6 + ca, '#c8bea8', 1); // fletching
  p.px(8 - ca * 6 + sa, 8 - sa * 6 - ca, '#c8bea8', 1);
  return p;
}

/** Fireball, 12x12, 3 flickering frames. */
export function fireballFrame(f) {
  const p = new Painter(12, 12);
  const E = S.fire;
  p.ellipse(6, 6, 4.2, 4.2, E[2], 0, false);
  p.ellipse(6 - (f === 1 ? 0.5 : 0), 6, 3, 3, E[3], 0, false);
  p.ellipse(6, 5.5 + (f === 2 ? 0.5 : 0), 1.8, 1.8, E[5], 0, false);
  p.px(6, 5, E[6], 0);
  const rng = new Rng(900 + f);
  for (let i = 0; i < 5; i++) p.px(rng.int(1, 10), rng.int(1, 10), rng.pick([E[2], E[3], E[4]]), 0);
  return p;
}

/** Floor splats, 16x16: 0-1 blood, 2 goo, 3 scorch mark. */
export function splatFrame(k) {
  const p = new Painter(16, 16);
  const rng = new Rng(1200 + k);
  const ramp = k < 2 ? C.blood : k === 2 ? C.goo : ['#060504', '#0e0b09', '#1a1512', '#241d18'];
  p.ellipse(8, 8, rng.float(4, 5.5), rng.float(3, 4), ramp.slice(0, 3), 0.2, false);
  for (let i = 0; i < 4; i++) p.ellipse(8 + rng.float(-4, 4), 8 + rng.float(-3, 3), rng.float(1.5, 3), rng.float(1, 2.2), ramp.slice(0, 3), 0.2, false);
  for (let i = 0; i < 6; i++) p.px(rng.int(1, 14), rng.int(1, 14), ramp[rng.int(1, 3)], 0.2);
  p.px(6, 6, ramp[3], 0.4); // wet highlight
  return p;
}

/** Iron ring set into the floor that a Chained Prisoner is shackled to. */
export function chainAnchor() {
  const p = new Painter(16, 16);
  p.bevelRect(3, 5, 10, 8, IRON.slice(0, 4), 1.5, 1);
  ring(p, 8, 8, 3.2, IRON.slice(2, 6), 3);
  p.px(4, 6, IRON[5], 2);
  p.px(11, 11, IRON[4], 2);
  p.outline(S.outline);
  return p;
}

export const ratFrame = facing(ratDraw);
export const gaolerFrame = facing(gaolerDraw);
export const prisonerFrame = facing(prisonerDraw);
export const impFrame = facing(impDraw);
export const ghoulFrame = facing(ghoulDraw);
export const crossbowmanFrame = facing(crossbowmanDraw);
export const mimicFrame = facing(mimicDraw);
