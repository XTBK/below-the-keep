// Icons for the fifth chest of relics (16 x 16, y points DOWN).

import { SHARED as S } from '../../data/palettes.js';

const GOLD = ['#5a3e10', '#9a7020', '#d0aa40', '#f6dc80'];
const SILVER = S.silver;
const IRON = S.iron;
const W = S.wood;
const L = S.leather;
const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const RED = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
const FIRE = ['#a03008', '#e05a10', '#ff9a30', '#ffe080'];
const ICE = ['#3a6a8a', '#6aa8d0', '#b0e0ff', '#ffffff'];
const GREEN = ['#1a3a14', '#2e5a20', '#4a8a30', '#7ac050'];
const PURPLE = ['#2a0e3a', '#6a1a8a', '#b04ae0', '#f0c0ff'];
const STORM = ['#1a2a4a', '#3a5a9a', '#80b0ff', '#e0f0ff'];
const STONE = ['#2a2a30', '#44444e', '#62626e', '#8a8a96'];
const WAX = ['#8a7a5a', '#c8b890', '#ece0c0'];

export const RELIC_DRAW5 = {
  whetstone(p) {
    p.bevelRect(2, 7, 12, 4, STONE, 3, 1);
    p.line(3, 8, 12, 8, STONE[3], 3.4); // the honed edge
    p.px(13, 6, '#ffffff', 3.8); // a spark
  },
  tin_whistle(p) {
    p.line(2, 12, 12, 4, SILVER[2], 3);
    p.line(3, 12, 13, 4, SILVER[1], 3);
    for (const k of [0.35, 0.55, 0.75]) p.px(Math.round(2 + 10 * k), Math.round(12 - 8 * k) - 1, '#1a1a20', 3.4);
    p.px(2, 13, SILVER[3], 3.4);
  },
  beggars_bowl(p) {
    p.ellipse(8, 10, 6, 3.5, W.slice(1, 5), 3);
    p.ellipse(8, 9, 4.5, 1.6, W[0], 2.6, false);
    p.ellipse(7, 8, 1.2, 1, SILVER.slice(1), 3.6);
    p.ellipse(10, 8.5, 1.2, 1, SILVER.slice(1), 3.6);
  },
  salt_pouch(p) {
    p.ellipse(8, 10, 5, 4.5, L.slice(0, 4), 3);
    p.hline(6, 10, 5, L[1], 3.4); // the drawstring
    for (const [x, y] of [[4, 3], [7, 2], [11, 3], [9, 1]]) p.px(x, y, '#f0f0f0', 3.6); // salt flying
  },
  cobbled_boots(p) {
    p.bevelRect(3, 3, 5, 8, L.slice(0, 4), 3, 1);
    p.bevelRect(3, 10, 9, 4, L.slice(0, 4), 3, 1);
    for (const [x, y] of [[5, 6], [6, 12], [9, 11]]) p.px(x, y, '#c8b080', 3.5); // patches
  },
  torn_map(p) {
    p.bevelRect(2, 3, 11, 10, ['#8a7048', '#b29a6e', '#c8b48a'], 2.6, 1);
    p.line(4, 10, 7, 6, '#5a2a1a', 3);
    p.line(7, 6, 10, 8, '#5a2a1a', 3);
    p.px(10, 8, RED[2], 3.4); // an X
  },
  gravediggers_spade(p) {
    p.line(4, 2, 9, 9, W[3], 3);
    p.bevelRect(8, 8, 6, 6, IRON.slice(2, 6), 3.2, 1);
    p.hline(3, 6, 2, W[4], 3.2); // the grip
  },
  stormglass(p) {
    p.ellipse(8, 9, 5, 5.5, ['#14202a', '#2a3a4a'], 2.6);
    p.rect(6, 2, 4, 2, IRON[3], 3);
    p.line(6, 6, 9, 9, STORM[3], 3.4);
    p.line(9, 9, 7, 12, STORM[2], 3.4);
    p.lit(8, 9, STORM[2], 3.6, 1);
  },
  bone_dice(p) {
    p.bevelRect(2, 5, 6, 6, BONE, 3, 1);
    p.bevelRect(8, 7, 6, 6, BONE, 3.2, 1);
    for (const [x, y] of [[4, 7], [6, 9], [10, 9], [12, 11], [11, 10]]) p.px(x, y, '#2a2018', 3.6);
  },
  frostlit_lantern(p) {
    p.line(8, 1, 8, 3, IRON[3], 3);
    p.bevelRect(4, 4, 8, 10, IRON.slice(1, 5), 3, 1);
    p.rect(6, 6, 4, 6, ICE[1], 3.2);
    p.lit(8, 9, ICE[3], 3.6, 1.4);
  },
  iron_rosary(p) {
    for (let a = 0; a < 10; a++) {
      const t = (a / 10) * Math.PI * 2;
      p.px(Math.round(8 + Math.cos(t) * 5), Math.round(6 + Math.sin(t) * 4), IRON[a % 2 ? 3 : 4], 3.2);
    }
    p.vline(8, 10, 14, IRON[4], 3.3);
    p.hline(6, 10, 12, IRON[4], 3.3); // the cross
  },
  wayfarers_staff(p) {
    p.line(4, 14, 11, 2, W[3], 3);
    p.line(5, 14, 12, 2, W[2], 3);
    p.ellipse(12, 3, 1.6, 1.4, ['#c0a8d0', '#f0e8f8'], 3.6); // a pilgrim's shell tied on
  },
  physicians_kit(p) {
    p.bevelRect(2, 5, 12, 9, ['#e8e0d0', '#c8c0b0', '#a09888'], 3, 1);
    p.rect(7, 7, 2, 5, RED[2], 3.4);
    p.rect(5, 9, 6, 2, RED[2], 3.4);
    p.hline(6, 10, 4, L[2], 3.2); // the handle
  },
  hunting_horn(p) {
    for (let k = 0; k < 9; k++) p.ellipse(3 + k, 10 - Math.sin((k / 8) * Math.PI) * 4, 1 + k * 0.35, 1 + k * 0.35, BONE, 3 + k * 0.05);
    p.ellipse(12, 7, 2.2, 2.6, ['#2a2018', '#4a3a28'], 3.6, false); // the bell
  },
  briar_circlet(p) {
    for (let a = 0; a < 16; a++) {
      const t = (a / 16) * Math.PI * 2;
      p.px(Math.round(8 + Math.cos(t) * 5), Math.round(8 + Math.sin(t) * 3.5), ['#3a2a10', '#5a3a18'][a % 2], 3);
    }
    for (const [x, y] of [[3, 7], [13, 7], [8, 4], [5, 11], [11, 11]]) p.px(x, y, '#e0d0a0', 3.4);
  },
  quicksilver_vial(p) {
    p.rect(6, 2, 4, 2, IRON[3], 3);
    p.ellipse(8, 10, 4.5, 4.5, ['#2a2a34', '#4a4a5a'], 2.6);
    p.ellipse(8, 11, 3.4, 2.6, SILVER, 3.2);
    p.px(6, 9, '#ffffff', 3.6);
  },
  executioners_hood(p) {
    p.ellipse(8, 8, 6, 6.5, ['#0e0a0c', '#1e161a', '#2e2228'], 3);
    p.rect(5, 7, 2, 1, RED[3], 3.6);
    p.rect(9, 7, 2, 1, RED[3], 3.6); // eye-holes, and something red behind them
  },
  twin_moons(p) {
    p.ellipse(5, 8, 3.5, 3.5, SILVER.slice(1), 3.2);
    p.ellipse(11, 8, 3.5, 3.5, SILVER.slice(1), 3.2);
    p.ellipse(6, 7, 1, 1, '#ffffff', 3.6);
    p.ellipse(12, 7, 1, 1, '#ffffff', 3.6);
    p.hline(5, 11, 3, L[2], 3); // the cord
  },
  bell_clapper(p) {
    p.line(8, 2, 8, 9, IRON[3], 3);
    p.ellipse(8, 11, 3.5, 3, IRON.slice(2, 6), 3.2);
    for (const [x, y] of [[3, 5], [13, 5], [2, 11], [14, 11]]) p.px(x, y, GOLD[3], 3.4); // the ring of it
  },
  serpent_ring(p) {
    for (let a = 0; a < 14; a++) {
      const t = (a / 14) * Math.PI * 2;
      p.px(Math.round(8 + Math.cos(t) * 5), Math.round(8 + Math.sin(t) * 5), GREEN[2 + (a % 2)], 3.2);
    }
    p.ellipse(12, 5, 1.6, 1.4, GREEN.slice(1), 3.6); // its head, biting its tail
    p.px(12, 4, RED[3], 3.8);
  },
  phoenix_ash(p) {
    p.ellipse(8, 12, 5, 2.2, ['#2a2a2a', '#4a4440', '#6a6058'], 2.6);
    for (const [x, y] of [[6, 9], [9, 8], [8, 6], [10, 10]]) p.lit(x, y, FIRE[2], 3, 1.2);
    p.lit(8, 4, FIRE[3], 3.4, 1.4);
  },
  knights_oath(p) {
    p.ellipse(7, 9, 5, 5.5, ['#1a2a4a', '#2a3e6a', '#3e5a8a'], 3);
    p.line(10, 2, 13, 13, SILVER[3], 3.6); // a sword laid across the shield
    p.hline(9, 13, 5, GOLD[2], 3.7);
  },
  mountain_heart(p) {
    p.ellipse(8, 9, 6, 5.5, STONE, 3);
    p.ellipse(8, 9, 2.6, 2.4, RED.slice(1), 3.6);
    p.lit(8, 9, RED[3], 3.8, 1.4);
    p.line(4, 5, 6, 8, STONE[0], 3.4); // cracks, glowing
  },
  starmetal_edge(p) {
    p.line(3, 13, 13, 3, PURPLE[3], 3.6);
    p.line(4, 13, 14, 3, PURPLE[2], 3.4);
    p.line(2, 11, 5, 14, GOLD[2], 3.4);
    for (const [x, y] of [[9, 6], [12, 4], [6, 10]]) p.lit(x, y, '#ffffff', 3.8, 1);
  },
  last_candle(p) {
    p.cyl(7, 8, 3, 6, WAX, 3);
    p.vline(8, 6, 7, '#2a2018', 3.4);
    p.lit(8, 5, FIRE[2], 4, 1.6);
    p.lit(8, 4, FIRE[3], 4, 1.8);
    p.ellipse(8, 14, 5, 1.2, IRON.slice(2, 5), 2);
  },
};
