// The prisoners you can free, and the Gatehouse they come home to. y points DOWN.
//
// One sheet, 28 x 36 frames:
//   cols 0-9    each prisoner standing free (two idle frames each, in NPC order)
//   cols 10-14  each prisoner as you find them: kneeling, in chains
//   col 15      empty shackles on a post (no one has come home to this spot yet)

import { Painter } from '../Painter.js';
import { SHARED as S } from '../../data/palettes.js';
import { limb, shape } from './artKit.js';

export const NPC_ORDER = ['smith', 'quartermaster', 'priest', 'cartographer', 'archivist'];

const SKIN = ['#6a4030', '#9a6448', '#c88e68', '#e8b48c'];
const SKIN_OLD = ['#6a5040', '#9a7a62', '#c4a488', '#e2c8ae'];
const IRON = S.iron;

const LOOKS = {
  // Hollis the Smith: broad, bald, a black beard, a leather apron, a hammer on his shoulder
  smith: { body: ['#2a1a10', '#4a3020', '#6a4630', '#8a6040'], legs: ['#1a1410', '#2e241c', '#423428'], skin: SKIN, hair: null, beard: ['#100c0a', '#2a2018', '#3e3024'], wide: 1.25 },
  // Bram the Quartermaster: a green tunic, a feathered cap, a satchel
  quartermaster: { body: ['#1a2a16', '#2e4626', '#46663a', '#628a50'], legs: ['#2a1e14', '#3e2e1e', '#544028'], skin: SKIN, hair: ['#3a2010', '#5a3418', '#7a4a24'], cap: ['#5a1a14', '#8a2a1e', '#b0402c'], wide: 1 },
  // Sister Ottilie: a grey habit, a white wimple, a gold sun on her breast
  priest: { body: ['#2a2a30', '#44444e', '#62626e', '#82828e'], legs: ['#2a2a30', '#44444e', '#62626e'], skin: SKIN, wimple: ['#a8a49a', '#d0ccc0', '#f0ece2'], robe: true, wide: 0.95 },
  // Wynn the Cartographer: a blue coat, red hair, spectacles, a rolled map
  cartographer: { body: ['#141c34', '#22305a', '#344a82', '#4e68a8'], legs: ['#2a2018', '#3e3024', '#544232'], skin: SKIN, hair: ['#5a1a0a', '#8a3014', '#b84a20'], specs: true, wide: 0.95 },
  // Old Ambrose the Archivist: a brown robe, a long white beard, a candle
  archivist: { body: ['#2a1c12', '#3e2a1a', '#584026', '#725638'], legs: ['#2a1c12', '#3e2a1a', '#584026'], skin: SKIN_OLD, hair: ['#8a8680', '#b8b4ac', '#e0dcd4'], beard: ['#8a8680', '#b8b4ac', '#e0dcd4'], long: true, robe: true, wide: 0.9 },
};

function drawPerson(p, id, f, chained) {
  const L = LOOKS[id];
  const bob = chained ? 0 : f;
  const kneel = chained ? 6 : 0;
  const cx = 14;
  const w = 6 * L.wide;
  const top = 13 + bob + kneel;
  // legs (a robe hides them)
  if (L.robe) shape(p, [[cx - w, top + 4], [cx + w, top + 4], [cx + w + 2, 34], [cx - w - 2, 34]], L.body, 5, { folds: 0.6 });
  else if (chained) {
    p.ellipse(cx - 3, 32, 4, 2.4, L.legs, 4);
    p.ellipse(cx + 3, 32, 4, 2.4, L.legs, 4);
  } else {
    limb(p, cx - 2.5, top + 10, cx - 3, 33, 2, 1.8, L.legs, 4);
    limb(p, cx + 2.5, top + 10, cx + 3, 33, 2, 1.8, L.legs, 4);
    p.ellipse(cx - 3.5, 34, 2.4, 1.2, ['#0e0a08', '#2a1e14'], 4.2);
    p.ellipse(cx + 3.5, 34, 2.4, 1.2, ['#0e0a08', '#2a1e14'], 4.2);
  }
  // the body
  shape(p, [[cx - w, top], [cx + w, top], [cx + w + 0.5, top + 12], [cx - w - 0.5, top + 12]], L.body, 6, { folds: 0.5 });
  if (id === 'smith') shape(p, [[cx - 4, top + 2], [cx + 4, top + 2], [cx + 5, top + 14], [cx - 5, top + 14]], ['#3a2010', '#5a3418', '#7a4a24'], 6.4, { flat: 0.5 }); // the apron
  if (id === 'quartermaster') {
    limb(p, cx - w, top + 1, cx + w, top + 9, 0.6, 0.6, ['#3a2614', '#5a3c20'], 6.6); // satchel strap
    p.ellipse(cx + w, top + 10, 2.6, 2.2, ['#3a2614', '#5a3c20', '#7a5430'], 6.8);
  }
  if (id === 'priest') {
    p.px(cx, top + 4, '#f6dc80', 6.8);
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.px(cx + dx, top + 4 + dy, '#d0aa40', 6.7);
  }
  // arms: free, they hold their trade; chained, they hang from the shackles
  if (chained) {
    limb(p, cx - w, top + 2, cx - w - 4, top - 6, 1.6, 1.3, L.body, 5.5);
    limb(p, cx + w, top + 2, cx + w + 4, top - 6, 1.6, 1.3, L.body, 5.5);
    for (const sx of [-1, 1]) {
      const hx = cx + sx * (w + 4);
      p.ellipse(hx, top - 7, 1.4, 1.4, L.skin, 5.8);
      p.rect(Math.round(hx - 1.5), top - 9, 3, 2, IRON[2], 6);
      for (let k = 1; k < 5; k++) p.px(Math.round(hx + sx * k * 0.6), top - 9 - k * 2, IRON[k % 2 ? 1 : 3], 5.9);
    }
  } else {
    limb(p, cx - w, top + 2, cx - w - 1, top + 11, 1.6, 1.4, L.body, 6.2);
    limb(p, cx + w, top + 2, cx + w + 1, top + 11, 1.6, 1.4, L.body, 6.2);
    p.ellipse(cx - w - 1, top + 12, 1.4, 1.4, L.skin, 6.4);
    p.ellipse(cx + w + 1, top + 12, 1.4, 1.4, L.skin, 6.4);
    if (id === 'smith') {
      limb(p, cx + w + 1, top + 11, cx + w + 4, top - 2, 0.7, 0.7, ['#3a2614', '#5a3c20'], 6.6);
      p.rect(Math.round(cx + w + 2), top - 5, 5, 3, IRON[3], 6.8);
    }
    if (id === 'cartographer') {
      limb(p, cx - w - 3, top + 12, cx - w + 3, top + 10, 1.4, 1.4, ['#a89870', '#d8c8a0', '#f0e4c4'], 6.8);
    }
    if (id === 'archivist') {
      p.rect(Math.round(cx + w), top + 7, 2, 4, '#e8e0c8', 6.8);
      p.lit(cx + w + 1, top + 5 + bob, '#ffd060', 7, 1.4);
    }
  }
  // the head
  const hy = top - 4;
  p.ellipse(cx, hy, 4.2, 4.6, L.skin, 8);
  if (L.wimple) {
    shape(p, [[cx - 5, hy - 5], [cx + 5, hy - 5], [cx + 6, hy + 6], [cx - 6, hy + 6]], L.wimple, 7.8, { flat: 0.4 });
    p.ellipse(cx, hy + 0.5, 3.4, 3.8, L.skin, 8.2);
  }
  if (L.hair) {
    shape(p, [[cx - 4.6, hy - 1], [cx - 3, hy - 5.5], [cx + 3, hy - 5.5], [cx + 4.6, hy - 1]], L.hair, 8.3, { flat: 0.4 });
    if (L.long) {
      p.vline(Math.round(cx - 5), hy - 1, hy + 4, L.hair[1], 8.1);
      p.vline(Math.round(cx + 5), hy - 1, hy + 4, L.hair[1], 8.1);
    }
  }
  if (L.cap) {
    shape(p, [[cx - 5, hy - 3], [cx + 5, hy - 3], [cx + 3, hy - 7], [cx - 3, hy - 7]], L.cap, 8.5, { flat: 0.5 });
    limb(p, cx + 3, hy - 6, cx + 8, hy - 10, 0.8, 0.3, ['#c0b090', '#f0e8d0'], 8.6); // the feather
  }
  if (L.beard) shape(p, [[cx - 4, hy + 1], [cx + 4, hy + 1], [cx + (L.long ? 2 : 3), hy + (L.long ? 10 : 6)], [cx - (L.long ? 2 : 3), hy + (L.long ? 10 : 6)]], L.beard, 8.6, { flat: 0.3 });
  const eyeY = hy - 0.5;
  if (chained) {
    p.hline(cx - 2, cx - 1, eyeY + 1, '#1a1010', 8.9); // eyes down
    p.hline(cx + 1, cx + 2, eyeY + 1, '#1a1010', 8.9);
  } else {
    p.px(cx - 1.5, eyeY, '#1a1010', 8.9);
    p.px(cx + 1.5, eyeY, '#1a1010', 8.9);
  }
  if (L.specs) {
    p.px(cx - 2.5, eyeY, '#c0d0e0', 9);
    p.px(cx + 2.5, eyeY, '#c0d0e0', 9);
    p.px(cx, eyeY, '#8a8a90', 9);
  }
}

function emptyShackles(p) {
  // a post with two empty manacles hanging, and straw
  p.rect(12, 6, 4, 28, '#3a2a1c', 4);
  p.rect(12, 6, 1, 28, '#5a4430', 4.2);
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 4; k++) p.px(14 + sx * (2 + k), 10 + k * 2, IRON[k % 2 ? 1 : 3], 5);
    p.rect(14 + sx * 7 - 1, 18, 3, 2, IRON[2], 5.2);
  }
  for (let x = 6; x < 22; x += 2) p.px(x, 34 - (x % 4 ? 0 : 1), '#a08a40', 3);
}

export function npcFrame(col) {
  const p = new Painter(28, 36);
  if (col < 10) drawPerson(p, NPC_ORDER[Math.floor(col / 2)], col % 2, false);
  else if (col < 15) drawPerson(p, NPC_ORDER[col - 10], 0, true);
  else emptyShackles(p);
  p.outline(S.outline);
  return p;
}
