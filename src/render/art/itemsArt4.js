// Icons for the fourth chest of relics (16 x 16, y points DOWN).

import { SHARED as S } from '../../data/palettes.js';

const GOLD = ['#5a3e10', '#9a7020', '#d0aa40', '#f6dc80'];
const IRON = S.iron;
const W = S.wood;
const L = S.leather;
const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const RED = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
const WAX = ['#8a7a5a', '#c8b890', '#ece0c0'];
const FIRE = ['#a03008', '#e05a10', '#ff9a30', '#ffe080'];
const ICE = ['#3a6a8a', '#6aa8d0', '#b0e0ff', '#ffffff'];
const GREEN = ['#1a3a14', '#2e5a20', '#4a8a30', '#7ac050'];
const PURPLE = ['#2a0e3a', '#6a1a8a', '#b04ae0', '#f0c0ff'];

export const RELIC_DRAW4 = {
  tallow_candle(p) {
    p.cyl(6, 7, 4, 8, WAX, 3);
    p.ellipse(8, 15, 5, 1.4, IRON.slice(2, 5), 2); // a dish
    p.vline(8, 5, 6, '#2a2018', 3.4); // the wick
    p.lit(8, 4, FIRE[2], 4, 1.4);
    p.lit(8, 3, FIRE[3], 4, 1.6);
    p.px(6, 9, WAX[2], 3.5); // a drip
    p.px(6, 10, WAX[2], 3.5);
  },
  cracked_buckler(p) {
    p.ellipse(8, 8, 6.5, 6.5, IRON.slice(1, 6), 3);
    p.ellipse(8, 8, 2, 2, IRON.slice(3), 3.6); // the boss
    p.line(9, 2, 11, 7, IRON[0], 3.4); // a crack
    p.line(11, 7, 10, 12, IRON[0], 3.4);
  },
  pilgrims_satchel(p) {
    p.bevelRect(3, 6, 10, 8, L.slice(0, 4), 3, 1);
    p.ellipse(8, 6, 5, 2, L.slice(1), 3.3); // the flap
    p.line(3, 6, 6, 1, L[2], 3); // the strap
    p.line(13, 6, 10, 1, L[2], 3);
    p.ellipse(8, 9, 1.4, 1.2, ['#c0a8d0', '#f0e8f8'], 3.6); // a pilgrim's shell badge
  },
  rusty_spurs(p) {
    p.line(2, 9, 9, 9, IRON[3], 3);
    p.line(2, 10, 9, 10, '#7a4a20', 3); // rust
    for (let a = 0; a < 8; a++) p.px(12 + Math.cos(a * 0.785) * 3, 9 + Math.sin(a * 0.785) * 3, a % 2 ? IRON[4] : '#8a5a2a', 3.4); // the rowel
    p.px(12, 9, IRON[2], 3.6);
  },
  hares_foot(p) {
    p.ellipse(7, 9, 3.5, 5, ['#6a5a48', '#9a8a70', '#c8b8a0', '#e8dcc8'], 3);
    for (const x of [5, 7, 9]) p.vline(x, 13, 15, '#3a3028', 3.2); // claws
    p.line(9, 4, 12, 1, L[2], 3); // a cord
    p.px(12, 1, GOLD[2], 3.4);
  },
  broken_seal(p) {
    p.ellipse(8, 9, 5.5, 5, RED, 3);
    for (const [x, y] of [[3, 6], [13, 7], [12, 13], [4, 13]]) p.px(x, y, RED[1], 3); // the ragged edge
    p.line(6, 6, 10, 12, RED[0], 3.4); // the break
    p.px(8, 8, RED[3], 3.6);
  },
  ravens_quill(p) {
    p.line(3, 14, 12, 2, '#1a1a22', 3);
    for (let i = 0; i < 8; i++) {
      p.line(5 + i, 12 - i * 1.4, 3 + i, 10 - i * 1.4, '#22222c', 3.2);
      p.line(5 + i, 12 - i * 1.4, 8 + i, 11 - i * 1.4, '#2e2e3a', 3.2);
    }
    p.px(3, 14, GOLD[2], 3.4); // the nib, ink-dark
    p.px(11, 3, '#5a5a6e', 3.6);
  },
  hunters_bracer(p) {
    p.bevelRect(4, 3, 8, 10, L.slice(1, 5), 3, 1);
    for (const y of [5, 8, 11]) p.hline(4, 11, y, L[0], 3.3); // the lacing
    for (const y of [5, 8, 11]) p.px(8, y, GOLD[2], 3.5);
  },
  bramble_wreath(p) {
    for (let a = 0; a < 20; a++) {
      const t = (a / 20) * Math.PI * 2;
      p.px(8 + Math.cos(t) * 5, 8 + Math.sin(t) * 5, GREEN[1 + (a % 2)], 3);
      if (a % 3 === 0) p.px(8 + Math.cos(t) * 6.5, 8 + Math.sin(t) * 6.5, '#c8c0a0', 3.2); // thorns
    }
    p.px(5, 5, RED[2], 3.4); // a berry
  },
  ember_flask(p) {
    p.ellipse(8, 10, 4.5, 4.5, ['#4a2a18', '#7a4a2a', '#a06a3c'], 3);
    p.cyl(7, 3, 3, 4, ['#4a2a18', '#7a4a2a'], 3); // the neck
    p.rect(7, 2, 3, 1, W[3], 3.4); // the cork
    for (const [x, y] of [[7, 10], [9, 9], [8, 12]]) p.lit(x, y, FIRE[2], 3.6, 1.2);
  },
  grave_dust(p) {
    p.ellipse(8, 10, 5, 4.5, L.slice(0, 4), 3);
    p.line(5, 6, 11, 6, L[3], 3.4); // the drawstring
    for (const [x, y] of [[4, 3], [7, 2], [10, 3], [12, 5]]) p.lit(x, y, '#c0b8d8', 3.6, 0.6); // dust in the air
    p.ellipse(8, 11, 1.6, 1.4, BONE.slice(1), 3.4); // a tiny skull stitched on it
  },
  winter_rose(p) {
    p.line(8, 15, 8, 8, GREEN[2], 3);
    p.px(9, 11, GREEN[3], 3.2);
    for (let a = 0; a < 6; a++) p.ellipse(8 + Math.cos(a) * 2.4, 6 + Math.sin(a) * 2.2, 1.8, 1.6, ICE, 3.4);
    p.ellipse(8, 6, 1.4, 1.4, ICE.slice(2), 3.8);
    p.glow(8, 6, ICE[2], 0.8);
  },
  heron_feather(p) {
    p.line(4, 14, 11, 1, '#d8d4c8', 3);
    for (let i = 0; i < 9; i++) {
      p.line(5 + i * 0.8, 12 - i * 1.3, 2 + i * 0.8, 10 - i * 1.3, i > 6 ? '#3a3a44' : '#b8b4a8', 3.2);
      p.line(5 + i * 0.8, 12 - i * 1.3, 9 + i * 0.8, 11 - i * 1.3, i > 6 ? '#4a4a54' : '#e8e4d8', 3.2);
    }
  },
  mail_shirt(p) {
    p.bevelRect(3, 4, 10, 10, IRON.slice(1, 5), 3, 1);
    p.rect(1, 4, 3, 5, IRON[2], 3); // sleeves
    p.rect(12, 4, 3, 5, IRON[2], 3);
    for (let y = 5; y < 14; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x < 13; x += 2) p.px(x, y, IRON[5], 3.4); // the rings
    p.hline(6, 9, 4, IRON[0], 3.5); // the neck
  },
  field_dressing(p) {
    p.cyl(3, 5, 10, 7, WAX, 3); // a roll of linen
    p.ellipse(13, 8.5, 1.4, 3.4, ['#c8b890', '#ece0c0'], 3.4);
    p.hline(3, 12, 8, RED[2], 3.6); // a red cross band
    p.vline(7, 5, 11, RED[2], 3.6);
    p.ellipse(4, 13, 2, 1.6, GOLD.slice(1), 3.2); // a dab of honey
  },
  witchs_knot(p) {
    for (let a = 0; a < 40; a++) {
      const t = (a / 40) * Math.PI * 2;
      const r = 5 + Math.sin(t * 3) * 1.6;
      p.px(8 + Math.cos(t) * r, 8 + Math.sin(t) * r, RED[2 + (a % 2)], 3);
    }
    p.lit(8, 8, PURPLE[2], 3.4, 0.9);
  },
  oathkeeper_ring(p) {
    for (let a = 0; a < 20; a++) {
      const t = (a / 20) * Math.PI * 2;
      p.px(8 + Math.cos(t) * 4.5, 10 + Math.sin(t) * 3, GOLD[a < 10 ? 1 : 2], 3);
    }
    p.ellipse(8, 5, 2.6, 2.4, ['#1a3a8a', '#3a6ad0', '#a0c8ff'], 3.6); // a sapphire
    p.px(7, 4, '#ffffff', 3.8);
  },
  twin_fang(p) {
    p.line(3, 3, 11, 11, IRON[4], 3);
    p.line(4, 3, 12, 11, IRON[2], 3);
    p.line(6, 2, 13, 9, IRON[5], 3.2); // the second blade
    p.line(11, 11, 13, 13, W[3], 3.4); // the grip
    p.hline(9, 13, 11, GOLD[2], 3.5); // the guard
  },
  saints_lantern(p) {
    p.bevelRect(4, 4, 8, 10, GOLD.slice(0, 3), 3, 1);
    p.rect(5, 5, 6, 8, '#fff8d0', 3.2);
    p.glow(8, 9, '#fff8d0', 1.6);
    p.line(6, 4, 8, 1, GOLD[2], 3.4); // the handle
    p.line(10, 4, 8, 1, GOLD[2], 3.4);
    p.vline(8, 5, 12, GOLD[1], 3.4); // the cross in the glass
    p.hline(6, 10, 7, GOLD[1], 3.4);
  },
  tempest_rune(p) {
    p.ellipse(8, 8, 6, 6.5, ['#2a2a32', '#3e3e48', '#565662', '#74747f'], 3);
    p.line(9, 2, 6, 8, '#a0d0ff', 3.6); // a lightning bolt carved and glowing
    p.line(6, 8, 10, 8, '#a0d0ff', 3.6);
    p.line(10, 8, 7, 14, '#a0d0ff', 3.6);
    p.glow(8, 8, '#a0d0ff', 1.2);
  },
  ironwood_bow(p) {
    for (let i = 0; i < 14; i++) p.px(4 + Math.sin((i / 13) * Math.PI) * 4, 1 + i, ['#2a2018', '#3a2c22', '#4a3a2c'][i % 3], 3);
    p.line(4, 1, 4, 14, '#d8d0b0', 3.2); // the string
    p.line(3, 8, 14, 8, W[3], 3.4); // an arrow
    p.px(14, 8, IRON[5], 3.6);
    p.px(13, 7, IRON[4], 3.6);
    p.px(13, 9, IRON[4], 3.6);
  },
  bloodletter(p) {
    p.line(3, 13, 11, 3, IRON[5], 3);
    p.line(4, 13, 12, 3, IRON[3], 3);
    p.rect(2, 12, 3, 3, BONE[2], 3.2); // a bone handle
    for (const [x, y] of [[11, 4], [12, 6], [13, 8]]) p.px(x, y, RED[2], 3.4); // drops of blood
    p.px(13, 9, RED[1], 3.4);
  },
  dragons_heart(p) {
    p.ellipse(6, 8, 3.6, 3.6, RED, 3);
    p.ellipse(10, 8, 3.6, 3.6, RED, 3);
    for (let y = 9; y < 15; y++) p.hline(3 + (y - 9), 13 - (y - 9), y, RED[1 + (y < 12 ? 1 : 0)], 3);
    for (const [x, y] of [[6, 8], [9, 10], [8, 12]]) p.lit(x, y, FIRE[2], 3.6, 1.2); // it burns inside
    p.line(8, 4, 9, 1, RED[1], 3.2); // a vessel
  },
  first_crown(p) {
    p.rect(2, 9, 12, 4, GOLD[2], 3);
    p.hline(2, 13, 12, GOLD[1], 3.2);
    for (const x of [2, 6, 9, 13]) p.vline(x, 5, 9, GOLD[3], 3.3);
    for (const x of [4, 11]) p.vline(x, 3, 9, GOLD[3], 3.3);
    for (const [x, c] of [[4, '#c02634'], [8, '#3a6ad0'], [11, '#2a9a4a']]) p.lit(x, 10, c, 3.6, 0.7); // three jewels
  },
  starfall_shard(p) {
    for (let y = 2; y < 14; y++) {
      const w = Math.max(0, 3.5 - Math.abs(y - 8) * 0.55);
      for (let x = Math.round(8 - w); x <= Math.round(8 + w); x++) p.px(x, y, (x + y) % 3 === 0 ? '#ffffff' : PURPLE[2], 3);
    }
    p.glow(8, 8, PURPLE[3], 1.6);
    for (const [x, y] of [[3, 3], [13, 4], [2, 12], [13, 13]]) p.lit(x, y, '#fff0c0', 3.4, 1); // falling sparks
  },
};
