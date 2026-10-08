// Chapter 1 bosses. Row 0 faces right, row 1 faces left (mirrored).

import { Painter } from '../Painter.js';
import { Rng } from '../../core/Rng.js';
import { SHARED as S, CREATURES as C } from '../../data/palettes.js';

const IRON = S.iron;
const FIRE = S.fire;

export const BOSS_ANIMS = {
  ratmother: {
    idle: [0, 2, 2.5],
    walk: [2, 4, 7],
    chargeWindup: [6, 1, 1],
    charge: [7, 2, 12],
    brood: [9, 1, 1],
    spit: [10, 1, 1],
    dazed: [11, 1, 1],
    death: [12, 3, 4, false],
  },
  warden: {
    idle: [0, 2, 2],
    walk: [2, 4, 5],
    sweepWindup: [6, 1, 1],
    sweep: [7, 1, 1],
    crouch: [8, 1, 1],
    air: [9, 1, 1],
    land: [10, 1, 1],
    throwWindup: [11, 1, 1],
    throw: [12, 1, 1],
    death: [13, 3, 3, false],
  },
};
export const BOSS_COLS = { ratmother: 15, warden: 16 };

export function bossAnims(key) {
  const out = {};
  for (const [name, [start, count, fps, loop]] of Object.entries(BOSS_ANIMS[key])) out[name] = { start, count, fps, loop: loop !== false };
  return out;
}

function facing(draw) {
  return (col, row) => (row === 0 ? draw(col) : draw(col).mirrored());
}

// ---------------------------------------------------------------------------------------------
// Mother of Rats (80 x 56)
// ---------------------------------------------------------------------------------------------
const FUR = ['#141110', '#241e1a', '#382e27', '#4e4136', '#665645', '#806c58'];
const PINK = C.ratPink.concat(['#e0aaa0']);

function ratMother(p, o) {
  const { bob = 0, legs = [0, 0, 0, 0], head = 'normal', crouch = 0, stretch = 0, belly = 0 } = o;
  const by = 34 + bob + crouch;
  // knotted tails behind her
  const tails = [
    [[12, by + 2], [5, by + 6], [1, by + 12], [4, by + 17]],
    [[12, by], [4, by - 2], [0, by + 3]],
    [[13, by + 4], [8, by + 12], [10, by + 18]],
  ];
  for (const t of tails) for (let i = 0; i < t.length - 1; i++) p.line(t[i][0], t[i][1], t[i + 1][0], t[i + 1][1], PINK[i % 2], 2);
  // legs (back pair darker)
  const legX = [20, 30, 46, 54];
  legX.forEach((x, i) => {
    const lift = legs[i];
    const top = by + 6;
    const foot = 52 - lift - Math.floor(crouch / 2);
    const lx = x + (stretch ? (i < 2 ? -4 : 5) : 0);
    p.line(x, top, lx, foot, i % 2 ? FUR[2] : FUR[3], 4);
    p.line(x + 1, top, lx + 1, foot, FUR[2], 4);
    p.hline(lx - 1, lx + 3, foot, PINK[1], 4);
    p.px(lx + 3, foot, C.teeth[1], 4); // claws
  });
  // body and swollen belly
  p.ellipse(36 - stretch, by, 26 + stretch * 2, 15 - stretch, FUR, 10);
  p.ellipse(34, by + 8, 16 + belly, 7 + belly, PINK, 9);
  for (const [x, y] of [[28, by + 10], [36, by + 11], [42, by + 9]]) p.px(x, y, PINK[0], 9.5); // teats
  // mange: bald patches and sores
  const rng = new Rng(4242);
  for (let i = 0; i < 9; i++) p.dot(rng.int(16, 54), by - rng.int(2, 12), rng.pick([PINK[1], PINK[2], C.sore[1], C.sore[2]]), 10);
  for (let i = 0; i < 26; i++) p.dot(rng.int(12, 58), by - rng.int(0, 14), FUR[5], 10.5); // fur tufts
  // pups clinging to her back
  for (const [x, y] of [[26, by - 13], [38, by - 14], [47, by - 11]]) {
    p.ellipse(x, y, 3.5, 2.2, C.ratFur, 11);
    p.px(x + 3, y - 1, '#ff3a20', 11.5);
    p.px(x + 4, y, PINK[1], 11);
  }
  // head
  let hx = 62 + stretch * 2;
  let hy = by - 4 + (head === 'down' ? 6 : head === 'up' ? -7 : 0);
  if (head === 'loll') {
    hx -= 2;
    hy += 5;
  }
  p.ellipse(hx, hy, 11, 8.5, FUR, 11);
  p.ellipse(hx + 9, hy + 2, 6, 4.5, FUR.slice(1), 11.5); // snout
  p.px(hx + 15, hy + 1, PINK[3], 12);
  p.px(hx + 14, hy + 2, PINK[2], 12);
  p.ellipse(hx - 5, hy - 8, 3, 4, PINK, 10); // ragged ear
  p.px(hx - 6, hy - 11, FUR[1], 10);
  if (head === 'loll') {
    p.line(hx + 1, hy - 3, hx + 3, hy - 1, '#ff3a20', 12);
    p.line(hx + 3, hy - 3, hx + 1, hy - 1, '#ff3a20', 12);
  } else {
    p.ellipse(hx + 2, hy - 3, 1.8, 1.6, ['#6a0808', '#ff3a20', '#ffb090'], 12.5); // burning red eye
  }
  const open = head === 'up' || head === 'spit';
  if (open) {
    p.ellipse(hx + 11, hy + 6, 4, 2.5, '#200606', 10, false);
    p.vline(hx + 9, hy + 4, hy + 7, C.teeth[2], 11.5);
    p.vline(hx + 11, hy + 4, hy + 7, C.teeth[2], 11.5);
    if (head === 'spit') for (let i = 0; i < 4; i++) p.px(hx + 14 + i, hy + 7 + (i % 2), C.goo[2 + (i % 2)], 11);
  } else {
    p.vline(hx + 11, hy + 5, hy + 8, C.teeth[2], 11.5); // great yellowed incisors
    p.vline(hx + 12, hy + 5, hy + 8, C.teeth[1], 11.5);
  }
}

function ratMotherDraw(col) {
  const p = new Painter(80, 56);
  if (col >= 12) {
    const d = col - 12;
    if (d === 0) ratMother(p, { head: 'loll', bob: 2 });
    else if (d === 1) {
      // rolled onto her side, legs kicking up
      p.ellipse(38, 42, 28, 10, FUR, 6);
      p.ellipse(36, 37, 16, 6, PINK, 6.5);
      for (const x of [24, 32, 42, 50]) p.line(x, 34, x + 2, 24, FUR[3], 6);
      p.ellipse(66, 42, 10, 7, FUR, 7);
      p.line(64, 39, 68, 43, '#ff3a20', 7.5);
      p.line(68, 39, 64, 43, '#ff3a20', 7.5);
    } else {
      p.ellipse(40, 47, 34, 7, C.blood.slice(1), 0.3, false);
      p.ellipse(38, 44, 26, 7, FUR, 4);
      p.ellipse(66, 44, 9, 6, FUR, 4.5);
      for (const [x, y] of [[20, 49], [58, 50], [30, 51]]) p.ellipse(x, y, 2.4, 1.6, C.ratFur, 2); // dead pups
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const legs = walk >= 0 ? [[2, 0, 0, 2], [1, 1, 1, 1], [0, 2, 2, 0], [1, 1, 1, 1]][walk] : [0, 0, 0, 0];
    const bob = col === 1 ? 1 : walk === 1 || walk === 3 ? -1 : 0;
    if (col === 6) ratMother(p, { crouch: 4, head: 'down', legs: [0, 0, 0, 0] });
    else if (col === 7 || col === 8) ratMother(p, { stretch: 1, head: 'down', legs: col === 7 ? [3, 0, 3, 0] : [0, 3, 0, 3] });
    else if (col === 9) ratMother(p, { head: 'up', belly: 2, bob: -1 });
    else if (col === 10) ratMother(p, { head: 'spit' });
    else if (col === 11) ratMother(p, { head: 'loll', bob: 2 });
    else ratMother(p, { bob, legs });
  }
  p.outline(S.outline);
  return p;
}

// ---------------------------------------------------------------------------------------------
// The Warden (96 x 96)
// ---------------------------------------------------------------------------------------------
const PLATE = ['#0c0c10', '#18181e', '#26262e', '#3a3a44', '#55555f', '#7a7a86'];
const ROYAL = C.royal;

function lantern(p, x, y, h) {
  // an iron cage with a fire burning inside
  p.rect(x - 5, y - 6, 11, 13, '#140804', h);
  p.ellipse(x, y + 1, 3.5, 4.5, [FIRE[2], FIRE[3], FIRE[4], FIRE[5]], h + 1);
  for (let bx = x - 5; bx <= x + 5; bx += 3) p.vline(bx, y - 6, y + 6, IRON[3], h + 2);
  p.hline(x - 6, x + 6, y - 7, IRON[4], h + 2);
  p.hline(x - 6, x + 6, y + 7, IRON[2], h + 2);
  p.px(x, y - 9, IRON[4], h + 2); // ring
}

function chainTo(p, x0, y0, x1, y1, h) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    p.px(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 3, i % 2 ? IRON[3] : IRON[5], h);
  }
}

function warden(p, o) {
  const { dy = 0, crouch = 0, tuck = 0, liftL = 0, liftR = 0, flail = 'low', arm = 'low', helmOff = false } = o;
  const by = dy + crouch;
  // tattered cloak behind
  p.ellipse(44, 52 + by, 18, 24, ['#1a0a0a', '#2e1212', '#421a18'], 4);
  for (let x = 28; x < 60; x += 4) p.vline(x, 70 + by, 76 + by + (x % 8 === 0 ? 2 : 0), '#2e1212', 3);
  // legs in iron greaves
  for (const [lx, lift] of [[36, liftL], [52, liftR]]) {
    const top = 70 + by;
    const foot = 90 - lift - tuck;
    p.cyl(lx, top, 9, foot - top, PLATE, 6);
    p.cyl(lx - 1, foot, 11, 4, PLATE.slice(0, 4), 6);
    p.hline(lx, lx + 8, top + 8, PLATE[5], 6.5); // knee plate edge
  }
  // gambeson skirt + tabard
  p.cyl(30, 60 + by, 36, 14, C.gambeson, 7);
  p.cyl(42, 44 + by, 12, 32, ROYAL, 8.5);
  // breastplate
  p.ellipse(48, 48 + by, 18, 15, PLATE, 9);
  p.hline(34, 62, 56 + by, PLATE[1], 9);
  p.rect(43, 42 + by, 10, 12, ROYAL[2], 9.6); // tabard over the plate
  p.vline(48, 42 + by, 53 + by, ROYAL[1], 9.8);
  for (const [x, y] of [[46, 45], [48, 44], [50, 45], [46, 47], [50, 47], [47, 48], [49, 48]]) p.px(x, y + by, '#100c04', 10); // the Mad King's crown
  // belt with the great ring of keys
  p.hline(30, 66, 60 + by, S.leather[1], 9.5);
  p.hline(30, 66, 61 + by, S.leather[2], 9.5);
  p.ellipse(32, 66 + by, 5, 5, S.brass, 8, false);
  p.ellipse(32, 66 + by, 3, 3, '#0a0806', 8, false);
  for (const [x, y] of [[28, 71], [31, 72], [35, 71], [37, 69]]) p.vline(x, y + by, y + 4 + by, S.brass[2], 8.5);
  // pauldrons
  p.ellipse(32, 38 + by, 9, 7, PLATE, 10);
  p.ellipse(64, 38 + by, 9, 7, PLATE, 10.5);
  // helm: a great helm whose grille is a little cell door, two embers glowing behind the bars
  const hx = 50;
  const hy = 24 + by;
  if (!helmOff) {
    p.cyl(hx - 10, hy - 12, 20, 22, PLATE, 12);
    p.ellipse(hx, hy - 12, 10, 4, PLATE.slice(2), 12.5);
    p.rect(hx - 5, hy - 5, 13, 10, '#050405', 11);
    p.px(hx - 2, hy - 1, FIRE[5], 11.5);
    p.px(hx + 4, hy - 1, FIRE[5], 11.5);
    for (let x = hx - 5; x <= hx + 7; x += 3) p.vline(x, hy - 5, hy + 4, IRON[4], 12.5);
    p.hline(hx - 5, hx + 7, hy, IRON[3], 12.6);
    p.px(hx - 8, hy - 6, PLATE[5], 13); // rivets
    p.px(hx + 9, hy - 6, PLATE[5], 13);
  } else {
    // bare head: grey, scarred, stubbled
    p.ellipse(hx, hy - 2, 7, 7, ['#2a2420', '#4a3e34', '#6a5a4a', '#8a7a66'], 11);
    p.px(hx + 3, hy - 3, '#0a0806', 11.5);
    p.line(hx - 4, hy - 6, hx - 1, hy + 1, '#3a2a22', 11.5);
  }
  // arms + flail
  const shoulder = { x: 64, y: 40 + by };
  let hand;
  if (flail === 'raised') hand = { x: 30, y: 14 + by };
  else if (flail === 'forward') hand = { x: 80, y: 44 + by };
  else hand = { x: 70, y: 58 + by };
  p.line(shoulder.x, shoulder.y, hand.x, hand.y, PLATE[3], 11);
  p.line(shoulder.x + 1, shoulder.y + 1, hand.x + 1, hand.y + 1, PLATE[2], 11);
  p.ellipse(hand.x, hand.y, 3, 3, PLATE, 11.5); // gauntlet
  if (flail === 'raised') {
    chainTo(p, hand.x, hand.y, 14, 8 + by, 12);
    lantern(p, 12, 12 + by, 12);
  } else if (flail === 'forward') {
    chainTo(p, hand.x, hand.y, 88, 48 + by, 12);
    lantern(p, 88, 54 + by, 12);
    for (let a = -1.6; a < 0.5; a += 0.1) p.px(50 + Math.cos(a) * 40, 50 + by + Math.sin(a) * 34, '#c8a070', 13); // swing smear
  } else {
    chainTo(p, hand.x, hand.y, 76, 74 + by, 12);
    lantern(p, 76, 80 + by, 12);
  }
  // back arm (keys to throw)
  if (arm === 'raised') {
    p.line(32, 40 + by, 18, 22 + by, PLATE[3], 10);
    p.ellipse(17, 20 + by, 3, 3, PLATE, 10.5);
    for (const [x, y] of [[13, 15], [17, 13], [21, 15]]) p.line(17, 20 + by, x, y + by, S.brass[2], 11); // keys fanned in his fist
  } else if (arm === 'thrown') {
    p.line(32, 40 + by, 50, 36 + by, PLATE[3], 13);
    p.ellipse(51, 36 + by, 3, 3, PLATE, 13.5);
  } else {
    p.line(32, 40 + by, 28, 56 + by, PLATE[3], 10);
    p.ellipse(28, 57 + by, 3, 3, PLATE, 10.5);
  }
}

function wardenDraw(col) {
  const p = new Painter(96, 96);
  if (col >= 13) {
    const d = col - 13;
    if (d === 0) warden(p, { dy: 2, flail: 'low' });
    else if (d === 1) warden(p, { crouch: 12, tuck: 0, flail: 'low' });
    else {
      // fallen: armour heaped on the floor, the helm rolled off, lantern smashed
      p.ellipse(44, 84, 30, 8, PLATE, 6);
      p.rect(38, 80, 14, 5, ROYAL[2], 6.5);
      p.ellipse(22, 82, 8, 6, ['#2a2420', '#4a3e34', '#6a5a4a'], 6);
      p.cyl(70, 76, 14, 12, PLATE, 6);
      for (let x = 72; x < 84; x += 3) p.vline(x, 79, 85, IRON[4], 6.5);
      for (const [x, y] of [[86, 88], [90, 86], [84, 90]]) p.line(x, y, x + 3, y - 2, IRON[3], 3);
      p.px(88, 90, FIRE[3], 3);
    }
  } else {
    const walk = col >= 2 && col <= 5 ? col - 2 : -1;
    const dy = col === 1 ? 1 : walk === 1 || walk === 3 ? -1 : 0;
    const o = { dy, liftL: walk === 0 ? 2 : 0, liftR: walk === 2 ? 2 : 0 };
    if (col === 6) Object.assign(o, { flail: 'raised' });
    if (col === 7) Object.assign(o, { flail: 'forward' });
    if (col === 8) Object.assign(o, { crouch: 8 });
    if (col === 9) Object.assign(o, { dy: -6, tuck: 8 });
    if (col === 10) Object.assign(o, { crouch: 5 });
    if (col === 11) Object.assign(o, { arm: 'raised' });
    if (col === 12) Object.assign(o, { arm: 'thrown' });
    warden(p, o);
  }
  p.outline(S.outline);
  return p;
}

export const ratMotherFrame = facing(ratMotherDraw);
export const wardenFrame = facing(wardenDraw);
