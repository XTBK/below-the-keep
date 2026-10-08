// 16 x 16 icons for the weapons (data/weapons.js), in WEAPON_IDS order. y points DOWN.

import { Painter } from '../Painter.js';
import { SHARED as S } from '../../data/palettes.js';
import { WEAPON_IDS } from '../../data/weapons.js';

const I = S.iron;
const W = S.wood;
const BR = S.brass;
const STEEL = ['#2e2e36', '#4a4a54', '#6e6e7a', '#9a9aa6', '#d0d0da', '#f0f0f8'];
const FIRE = ['#a03008', '#e05a10', '#ff9a30', '#ffe080'];

function wand(p, tip, halo) {
  p.line(3, 13, 11, 5, W[2], 3);
  p.line(4, 13, 12, 5, W[3], 3);
  p.px(3, 13, BR[2], 3.2); // a brass ferrule
  p.lit(12, 4, tip, 3.6, 1.8);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.lit(12 + dx, 4 + dy, halo, 3.4, 1);
}
function blade(p, x0, y0, x1, y1, ramp) {
  p.line(x0, y0, x1, y1, ramp[ramp.length - 1], 3);
  p.line(x0 + 1, y0, x1 + 1, y1, ramp[Math.floor(ramp.length / 2)], 3);
}

const DRAW = {
  oak_wand: (p) => wand(p, '#c8e8ff', '#8ac8ff'),
  ember_wand: (p) => wand(p, '#ffb040', '#ff6a20'),
  tide_wand: (p) => wand(p, '#60b0ff', '#2a60e0'),
  frost_wand: (p) => wand(p, '#e8ffff', '#a0e8ff'),
  storm_wand: (p) => wand(p, '#fff080', '#a0c0ff'),
  venom_wand: (p) => wand(p, '#a0ff60', '#40c030'),
  ranger_crossbow(p) {
    p.line(2, 8, 13, 8, W[3], 3);
    p.line(11, 3, 11, 13, W[4], 3.2);
    p.line(11, 3, 6, 8, '#d8d0b0', 3.3);
    p.line(11, 13, 6, 8, '#d8d0b0', 3.3);
    p.line(5, 8, 14, 8, I[4], 3.4);
  },
  longbow(p) {
    for (let y = 1; y < 15; y++) p.px(5 + Math.sin(((y - 1) / 13) * Math.PI) * 4, y, W[2 + (y % 2)], 3);
    p.vline(5, 1, 14, '#d8d0b0', 3.2);
    p.line(4, 8, 14, 8, W[3], 3.3);
    p.px(14, 8, I[5], 3.5);
  },
  arbalest(p) {
    p.line(1, 9, 13, 9, W[2], 3);
    p.line(1, 10, 13, 10, W[3], 3);
    p.line(12, 2, 12, 15, I[4], 3.2);
    p.line(12, 2, 6, 9, '#d8d0b0', 3.3);
    p.line(12, 15, 6, 9, '#d8d0b0', 3.3);
    p.ellipse(3, 11, 2, 2, I.slice(2, 5), 3.4); // the winch
  },
  repeater(p) {
    p.line(2, 9, 13, 9, W[3], 3);
    p.line(11, 4, 11, 14, W[4], 3.2);
    p.bevelRect(5, 4, 5, 4, W.slice(1, 5), 3.4, 1); // the box of bolts
    for (const x of [6, 8]) p.px(x, 5, I[5], 3.6);
    p.line(3, 8, 4, 4, I[4], 3.4);
  },
  hunting_bow(p) {
    for (let y = 3; y < 13; y++) p.px(6 + Math.sin(((y - 3) / 9) * Math.PI) * 4, y, ['#3a2414', '#5a3a1e', '#7a5028'][y % 3], 3);
    p.vline(6, 3, 12, '#d8d0b0', 3.2);
    p.px(10, 2, '#c02634', 3.4);
    p.line(4, 8, 13, 8, W[3], 3.3);
  },
  dragon_crossbow(p) {
    p.line(2, 8, 13, 8, '#3a1a10', 3);
    p.line(11, 3, 11, 13, '#6a2a14', 3.2);
    p.line(11, 3, 6, 8, '#d8d0b0', 3.3);
    p.line(11, 13, 6, 8, '#d8d0b0', 3.3);
    p.lit(14, 8, FIRE[2], 3.6, 1.6);
    p.lit(14, 7, FIRE[3], 3.6, 1.6);
  },
  knight_sword(p) {
    blade(p, 4, 12, 12, 2, STEEL);
    p.line(2, 10, 6, 14, BR[2], 3.4);
    p.line(4, 12, 2, 14, W[3], 3.4);
  },
  greataxe(p) {
    p.line(3, 14, 11, 2, W[3], 3);
    for (let y = 1; y < 9; y++) p.hline(8, 9 + Math.round(Math.sin(((y - 1) / 7) * Math.PI) * 5), y, STEEL[2 + (y % 3)], 3.4);
    p.vline(14, 3, 7, STEEL[5], 3.6);
  },
  longsword(p) {
    blade(p, 3, 14, 14, 1, STEEL);
    p.line(1, 11, 6, 16, BR[2], 3.4);
  },
  twin_daggers(p) {
    blade(p, 3, 12, 8, 5, STEEL);
    blade(p, 8, 13, 13, 6, STEEL);
    p.px(3, 12, BR[2], 3.5);
    p.px(8, 13, BR[2], 3.5);
  },
  warhammer(p) {
    p.line(3, 14, 10, 4, W[3], 3);
    p.bevelRect(6, 1, 9, 5, I.slice(1, 6), 3.4, 1);
    p.px(14, 3, I[6], 3.6);
  },
  flail(p) {
    p.line(2, 14, 6, 9, W[3], 3);
    for (let k = 0; k < 4; k++) p.px(7 + k, 8 - k, I[4], 3.2);
    p.ellipse(12, 4, 2.6, 2.6, I.slice(1, 6), 3.4);
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3]]) p.px(12 + dx, 4 + dy, I[6], 3.5);
  },
  emberblade(p) {
    blade(p, 4, 12, 12, 2, ['#3a1008', '#a03a18', '#e06a30']);
    for (const [x, y] of [[7, 9], [9, 6], [11, 4]]) p.lit(x, y, FIRE[2], 3.6, 1.4);
    p.line(2, 10, 6, 14, BR[2], 3.4);
  },
};

export function weaponIcon(col) {
  const p = new Painter(16, 16);
  const id = WEAPON_IDS[col];
  if (DRAW[id]) DRAW[id](p);
  p.outline(S.outline);
  return p;
}
