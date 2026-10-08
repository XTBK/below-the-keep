// Phase 7 item art: icons for the rest of the relics, and the 'curios' sheet (trinkets, scrolls,
// potions, Seal Fragments, journal pages). All 16 x 16.

import { Painter } from '../Painter.js';
import { SHARED as S, CHAPTERS } from '../../data/palettes.js';
import { TRINKET_IDS, SCROLL_IDS, POTION_LOOKS } from '../../data/curios.js';
import { mysteryIcon } from './itemsArt3.js';

const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const GOLD = ['#5a3e10', '#9a7020', '#d0aa40', '#f6dc80'];
const IRON = S.iron;
const W = S.wood;
const L = S.leather;
const RED = ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a'];
const GREEN = ['#1a3a10', '#2e6a1e', '#4aa03a', '#90e070'];
const PURPLE = CHAPTERS.hollow.glowPurple;
const FIRE = [S.fire[2], S.fire[3], S.fire[4], S.fire[5]];
const PAPER = ['#6a5a3a', '#a8946a', '#d8c8a0', '#f4ead0'];

/** A box in one colour, or bevelled when given a colour ramp. */
function rect(p, x, y, w, h, c, ht) {
  if (Array.isArray(c)) p.bevelRect(x, y, w, h, c, ht, 1);
  else p.rect(x, y, w, h, c, ht);
}

function ring(p, cx, cy, rx, ry, c, h, n = 24) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.px(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, c, h);
  }
}

export const RELIC_DRAW2 = {
  iron_gauntlet(p) {
    p.bevelRect(4, 7, 9, 8, IRON.slice(1, 6), 3, 1); // cuff
    for (let i = 0; i < 4; i++) p.bevelRect(4 + i * 2.3, 2, 2, 6, IRON.slice(2, 6), 3.5, 0); // fingers
    p.bevelRect(12, 6, 3, 4, IRON.slice(2, 6), 3.4, 0); // thumb
    p.hline(4, 12, 11, IRON[1], 3.2);
  },
  falcon_feather(p) {
    p.line(3, 14, 13, 2, BONE[3], 2);
    for (let i = 0; i < 9; i++) {
      p.line(4 + i, 13 - i * 1.2, 2 + i, 10 - i * 1.2, i % 3 ? '#8a6a4a' : '#5a3e28', 2.5);
      p.line(5 + i, 13 - i * 1.2, 8 + i, 12 - i * 1.2, i % 3 ? '#a8845a' : '#5a3e28', 2.5);
    }
  },
  poachers_glove(p) {
    p.ellipse(8, 9, 5, 5, L, 3);
    for (let i = 0; i < 4; i++) p.vline(5 + i * 2, 2, 7, L[2 + (i % 2)], 3.2);
    p.line(12, 9, 15, 6, L[3], 3);
    p.hline(3, 12, 13, L[0], 3);
    p.px(6, 10, '#ffffff', 3.5);
  },
  pilgrim_boots(p) {
    rect(p, 3, 3, 4, 9, L.slice(1), 3);
    rect(p, 3, 11, 7, 3, L.slice(0, 3), 3);
    rect(p, 9, 4, 4, 8, L.slice(1), 2.6);
    rect(p, 9, 11, 6, 3, L.slice(0, 3), 2.6);
    p.px(5, 6, '#e0d8c8', 3.4); // scallop shell
  },
  heart_of_oak(p) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const nx = (x - 7.5) / 6.5;
        const ny = (y - 6.5) / 6.5;
        const heart = (nx * nx + ny * ny - 0.6) ** 3 - nx * nx * ny * ny * ny < 0 && y > 1;
        if (heart) p.px(x, 15 - y, W[1 + ((x + y * 3) % 4 === 0 ? 2 : 1)], 3);
      }
    }
    p.ellipse(7, 7, 1.5, 2, W[0], 3.2); // knot
    p.ellipse(8, 2, 2, 1, GREEN, 3.5); // leaf
  },
  bent_horseshoe(p) {
    for (let i = 0; i < 20; i++) {
      const a = Math.PI * (0.05 + (i / 19) * 0.9);
      p.ellipse(8 + Math.cos(a) * 5, 6 + Math.sin(a) * 6.5, 1.4, 1.4, IRON.slice(2, 6), 3);
    }
    for (const [x, y] of [[4, 8], [3, 11], [12, 8], [13, 11]]) p.px(x, y, IRON[0], 3.6); // nail holes
  },
  triple_sling(p) {
    // the Threefold Rune: three little rune-stones, each glowing
    for (const [x, y] of [[4, 10], [12, 10], [8, 4]]) {
      p.ellipse(x, y, 3, 3, ['#2a2a32', '#4a4a56', '#6a6a78'], 3);
      p.lit(x, y, '#8ac8ff', 3.4, 1.1);
      p.px(x, y - 1, '#c8e8ff', 3.5);
    }
  },
  two_faced_mask(p) {
    p.ellipse(8, 8, 6, 6.5, ['#a8a090', '#cac2ae', '#ecead8'], 3);
    for (let y = 2; y < 15; y++) for (let x = 8; x < 15; x++) if (p.filled(x, y)) p.px(x, y, ['#2a2230', '#3e3448', '#544868'][(x + y) % 3], 3);
    p.px(5, 7, '#0a0a0a', 3.4);
    p.px(11, 7, '#c02634', 3.4);
    p.hline(4, 7, 11, '#3a2a2a', 3.4);
    p.line(9, 12, 12, 10, '#c02634', 3.4); // a sneer on the dark side
  },
  leech_jar(p) {
    rect(p, 5, 1, 6, 2, W.slice(2), 3);
    p.ellipse(8, 9, 5.5, 5.5, ['#2a1a1a', '#4a2a2a', '#7a4a4a', '#c8a0a0'], 2.5);
    p.ellipse(8, 10, 4.5, 4, RED.slice(0, 3), 3);
    for (const [x, y] of [[6, 9], [10, 11], [8, 12]]) p.line(x, y, x + 2, y - 1, '#1a0a0a', 3.4);
    p.px(5, 7, '#ffffff', 3.6);
  },
  briar_mail(p) {
    p.bevelRect(3, 3, 10, 11, IRON.slice(1, 5), 3, 1);
    for (let y = 4; y < 14; y += 2) for (let x = 4 + (y % 4 ? 1 : 0); x < 13; x += 2) p.px(x, y, IRON[1], 3.1); // rings
    for (let i = 0; i < 8; i++) {
      const x = 2 + i * 1.7;
      p.px(x, 8 + Math.sin(i) * 3, GREEN[2], 3.5);
      if (i % 2) p.px(x, 7 + Math.sin(i) * 3, '#d8d0b0', 3.6);
    }
  },
  cartographers_map(p) {
    rect(p, 2, 3, 12, 10, PAPER, 2);
    p.vline(6, 3, 12, PAPER[1], 2.1);
    p.vline(10, 3, 12, PAPER[1], 2.1);
    for (const [x, y] of [[3, 5], [4, 6], [5, 6], [7, 7], [8, 9], [9, 9], [11, 8], [12, 6]]) p.px(x, y, '#5a2a14', 2.4); // path
    p.px(12, 5, '#c02634', 2.6);
    p.px(11, 5, '#c02634', 2.6);
  },
  dowsing_rod(p) {
    p.line(8, 15, 8, 8, W[3], 2);
    p.line(8, 8, 3, 2, W[3], 2);
    p.line(8, 8, 13, 2, W[4], 2);
    for (const [x, y] of [[2, 1], [14, 1], [8, 6]]) p.lit(x, y, '#6ad0ff', 3, 1.2);
  },
  gaolers_ring(p) {
    ring(p, 8, 8, 5.5, 5.5, IRON[4], 2);
    ring(p, 8, 8, 5, 5, IRON[2], 2.2);
    for (const [a, l] of [[0.3, 5], [1.5, 6], [2.6, 4]]) {
      const x = 8 + Math.cos(a) * 5;
      const y = 8 + Math.sin(a) * 5;
      p.line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, GOLD[2], 3);
      p.px(x + Math.cos(a) * l, y + Math.sin(a) * l, GOLD[3], 3.3);
    }
  },
  powder_horn(p) {
    for (let i = 0; i < 14; i++) p.ellipse(2 + i * 0.85, 4 + i * 0.6, 1.2 + i * 0.16, 1.2 + i * 0.16, BONE, 3 - i * 0.05);
    p.ellipse(13.5, 12.5, 2.2, 2.2, W.slice(1), 3.2); // stopper
    p.line(2, 4, 13, 12, L[2], 3.4); // strap
  },
  misers_purse(p) {
    p.ellipse(8, 10, 5.5, 4.5, L, 3);
    p.hline(5, 11, 6, GOLD[2], 3.4);
    for (const [x, y] of [[6, 3], [9, 2], [11, 4]]) p.ellipse(x, y, 1.6, 1.4, GOLD, 3.6);
  },
  phoenix_feather(p) {
    p.line(3, 14, 12, 2, GOLD[3], 2);
    for (let i = 0; i < 9; i++) {
      p.line(4 + i, 13 - i * 1.3, 2 + i, 10 - i * 1.3, FIRE[i % 4], 2.5);
      p.line(5 + i, 13 - i * 1.3, 8 + i, 12 - i * 1.3, FIRE[(i + 2) % 4], 2.5);
    }
    p.glow(12, 2, S.fire[5], 1.4);
    p.glow(10, 5, S.fire[4], 1.1);
  },
  bat_wings(p) {
    const B = ['#141018', '#261e2e', '#3a2e44', '#544660'];
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) p.line(8, 7, 8 + s * (2 + i), 3 + i * 0.4 + (i % 2 ? 4 : 0), B[1 + (i % 3)], 3);
      p.line(8, 7, 8 + s * 7, 3, B[3], 3.2);
    }
    p.ellipse(8, 8, 1.8, 2.4, B, 3.4);
  },
  berserker_braid(p) {
    for (let i = 0; i < 12; i++) {
      const x = 8 + Math.sin(i * 1.2) * 2.5;
      p.ellipse(x, 2 + i, 1.8, 1, ['#5a1a0a', '#8a3a14', '#c06a2a'], 3);
    }
    p.hline(5, 11, 13, IRON[4], 3.4);
    p.px(8, 15, '#c02634', 3);
  },
  hermits_lantern(p) {
    rect(p, 5, 4, 6, 9, IRON.slice(1, 4), 2.5);
    rect(p, 6, 5, 4, 7, ['#c87a20', '#f0b040', '#fff0a0'], 3);
    p.glow(8, 8, '#ffd060', 1.6);
    p.glow(8, 9, '#ffb040', 1.4);
    p.hline(4, 11, 3, IRON[3], 3);
    ring(p, 8, 1.5, 2, 1.5, IRON[3], 3, 10);
  },
  adders_fang(p) {
    p.line(5, 2, 10, 13, BONE[3], 3);
    p.line(6, 2, 11, 13, BONE[2], 3);
    p.line(7, 2, 11, 11, BONE[1], 3);
    p.px(11, 14, GREEN[3], 3.4);
    p.lit(12, 15, GREEN[3], 3, 0.8);
  },
  comet_shard(p) {
    for (let i = 0; i < 8; i++) p.line(2 + i, 2 + i * 0.5, 8 + i * 0.3, 7 + i * 0.4, FIRE[i % 4], 2);
    p.ellipse(11, 10, 3.5, 3.5, ['#3a2a3a', '#6a4a5a', '#a07a8a', '#e0c0c8'], 3);
    p.lit(10, 9, S.fire[5], 3.6, 1);
  },
  mirror_shard(p) {
    const G = ['#4a5a6a', '#8aa0b4', '#c8dcec', '#ffffff'];
    for (let y = 2; y < 15; y++) {
      const w = Math.floor((y - 2) * 0.5);
      for (let x = 7 - w; x <= 8 + w - (y > 10 ? y - 10 : 0); x++) p.px(x, y, G[(x + y) % 3 === 0 ? 3 : (x + y) % 2 ? 2 : 1], 2.5);
    }
    p.line(6, 5, 9, 13, G[0], 2.6);
  },
  saints_finger(p) {
    p.line(4, 13, 11, 3, BONE[2], 3);
    p.line(5, 13, 12, 3, BONE[3], 3);
    for (const k of [0.33, 0.66]) p.px(4 + 7 * k, 13 - 10 * k, BONE[0], 3.2);
    ring(p, 12, 3, 2.5, 1.2, GOLD[3], 3.5, 12);
    p.glow(12, 3, GOLD[3], 1);
  },
  ember_heart(p) {
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 16; x++) {
        const nx = (x - 7.5) / 6;
        const ny = (y - 6) / 6;
        if ((nx * nx + ny * ny - 0.6) ** 3 - nx * nx * ny * ny * ny < 0 && y > 1) p.px(x, 15 - y, ['#2a0a06', '#4a160a', '#6a2410'][(x + y) % 3], 3);
      }
    }
    for (const [x, y] of [[6, 7], [9, 8], [7, 10], [10, 6]]) p.lit(x, y, S.fire[(x + y) % 3 + 3], 3.4, 1.4);
  },
  soul_jar(p) {
    rect(p, 5, 1, 6, 2, IRON.slice(2), 3);
    p.ellipse(8, 9, 5.5, 5.5, ['#1a2a3a', '#2e4e6a', '#5a8ab0', '#a8d0f0'], 2.5);
    for (const [x, y] of [[7, 8], [9, 10], [8, 12], [6, 11]]) p.lit(x, y, '#a0f0ff', 3, 1.2);
    p.px(5, 6, '#ffffff', 3.6);
  },
  witchs_thimble(p) {
    p.cyl(4, 5, 8, 9, ['#3a2a4a', '#6a4a8a', '#9a7ac0', '#d0b8f0'], 3);
    for (let y = 6; y < 13; y += 2) for (let x = 5; x < 12; x += 2) p.px(x + (y % 4 ? 1 : 0), y, '#2a1a3a', 3.2);
    p.ellipse(8, 4, 4, 1.5, ['#6a4a8a', '#9a7ac0'], 3.5);
    p.line(12, 2, 15, 0, IRON[4], 2);
  },
  war_drum(p) {
    p.cyl(2, 5, 12, 9, RED, 3);
    p.ellipse(8, 5, 6, 2, PAPER, 3.5);
    for (let x = 3; x < 14; x += 2) p.line(x, 6, x + 1, 13, GOLD[2], 3.2);
    p.line(1, 1, 7, 5, W[3], 4);
    p.ellipse(1, 1, 1.2, 1.2, PAPER, 4);
  },
  warding_bell(p) {
    for (let y = 3; y < 13; y++) {
      const w = 2 + (y - 3) * 0.5;
      p.hline(Math.round(8 - w), Math.round(8 + w), y, GOLD[y > 10 ? 1 : (y % 3 ? 2 : 3)], 3);
    }
    p.hline(2, 14, 13, GOLD[1], 3);
    p.ellipse(8, 14, 1.4, 1.2, IRON.slice(2), 3.2);
    rect(p, 7, 1, 2, 2, GOLD.slice(1), 3);
    p.glow(8, 7, GOLD[3], 0.6);
  },
  thunder_jar(p) {
    rect(p, 5, 1, 6, 2, W.slice(2), 3);
    p.ellipse(8, 9, 5.5, 5.5, ['#1a2a3a', '#24344a', '#3a4e6a', '#6a8aa0'], 2.5);
    const bolt = [[9, 4], [6, 8], [9, 9], [6, 13]];
    for (let i = 0; i < 3; i++) p.line(bolt[i][0], bolt[i][1], bolt[i + 1][0], bolt[i + 1][1], '#c0e8ff', 3);
    for (const [x, y] of bolt) p.glow(x, y, '#a0d8ff', 1.4);
  },
  sand_glass(p) {
    p.hline(3, 12, 1, W[3], 3);
    p.hline(3, 12, 14, W[3], 3);
    p.vline(3, 1, 14, W[2], 3);
    p.vline(12, 1, 14, W[2], 3);
    for (let y = 2; y < 14; y++) {
      const w = Math.abs(y - 7.5) * 0.55 + 0.4;
      p.hline(Math.round(7.5 - w), Math.round(7.5 + w), y, '#a8b8c8', 2.4);
      if (y < 5 || y > 10) p.hline(Math.round(7.5 - w + 0.5), Math.round(7.5 + w - 0.5), y, '#8a8a80', 2.6); // grey sand
    }
  },
  gilded_die(p) {
    p.bevelRect(3, 3, 10, 10, GOLD, 3, 1);
    for (const [x, y] of [[5, 5], [10, 5], [7.5, 7.5], [5, 10], [10, 10]]) p.px(x, y, '#3a2a08', 3.4);
  },
  blood_chalice(p) {
    p.ellipse(8, 4, 5, 2.5, GOLD, 3);
    p.ellipse(8, 4, 4, 1.5, RED, 3.4);
    for (let y = 5; y < 9; y++) p.hline(8 - (9 - y), 8 + (9 - y), y, GOLD[2 - (y % 2)], 3);
    p.vline(8, 9, 12, GOLD[2], 3);
    p.hline(5, 11, 13, GOLD[1], 3);
    p.px(8, 7, '#c02634', 3.5);
  },
  masons_hammer(p) {
    p.line(4, 14, 9, 6, W[3], 2);
    p.line(5, 14, 10, 6, W[2], 2);
    p.bevelRect(6, 2, 9, 5, IRON.slice(1, 6), 3, 1);
  },
  raven_cage(p) {
    for (let x = 3; x <= 13; x += 2) p.vline(x, 4, 14, IRON[3], 2.5);
    p.hline(3, 13, 14, IRON[2], 2.6);
    for (let i = 0; i < 9; i++) p.px(4 + i, 4 - Math.round(Math.sin((i / 8) * Math.PI) * 3), IRON[4], 2.6);
    p.ellipse(8, 10, 2.5, 2, ['#0a0a10', '#1a1a24', '#2e2e3a'], 2);
    p.px(10, 9, '#d0a020', 2.4);
  },
  kings_blade(p) {
    p.line(3, 14, 12, 3, IRON[5], 3);
    p.line(4, 14, 13, 3, IRON[3], 3);
    p.line(4, 10, 8, 14, GOLD[2], 3.5); // crossguard
    p.line(1, 15, 3, 13, L[2], 3.5);
    p.glow(12, 3, '#ffffff', 1.2);
  },
};

// ---------------------------------------------------------------------------------------------
// Curios (16 x 16): 0-9 trinkets, 10-19 scrolls, 20-29 potions, 30-32 seals, 33 journal page
// ---------------------------------------------------------------------------------------------
const TRINKET_DRAW = {
  rabbits_foot(p) {
    p.ellipse(8, 10, 3, 4.5, ['#8a7a6a', '#b8a898', '#e0d4c4', '#fff8ee'], 3);
    rect(p, 6, 2, 4, 3, GOLD.slice(1), 3);
    ring(p, 8, 1.5, 1.5, 1, GOLD[3], 3, 8);
  },
  cracked_monocle(p) {
    ring(p, 7, 7, 5, 5, GOLD[2], 3);
    p.ellipse(7, 7, 4, 4, ['#4a6a8a', '#8ab0d0'], 2);
    p.line(5, 4, 9, 10, '#ffffff', 2.3);
    p.line(11, 10, 15, 15, GOLD[1], 2);
  },
  rusted_key(p) {
    ring(p, 4.5, 8, 3, 3, '#8a4a2a', 3, 14);
    p.hline(7, 14, 8, '#7a3a1a', 3);
    p.vline(12, 8, 11, '#7a3a1a', 3);
    p.vline(14, 8, 10, '#7a3a1a', 3);
  },
  copper_ring(p) {
    ring(p, 8, 9, 5, 4, '#b87a4a', 3);
    ring(p, 8, 9, 4.2, 3.2, '#7a4a2a', 3);
    p.ellipse(8, 4.5, 2, 1.6, GREEN, 3.5);
  },
  bloody_rag(p) {
    rect(p, 3, 4, 10, 9, PAPER.slice(0, 3), 2);
    for (const [x, y, r] of [[7, 8, 2.5], [10, 6, 1.5], [5, 11, 1.2]]) p.ellipse(x, y, r, r, RED, 2.3);
    p.line(13, 12, 15, 15, PAPER[1], 2);
  },
  crow_feather(p) {
    p.line(3, 14, 13, 2, '#3a3a48', 2);
    for (let i = 0; i < 9; i++) {
      p.line(4 + i, 13 - i * 1.2, 2 + i, 10 - i * 1.2, i % 2 ? '#1a1a24' : '#2a2a38', 2.5);
      p.line(5 + i, 13 - i * 1.2, 8 + i, 12 - i * 1.2, i % 2 ? '#24243a' : '#3a3a58', 2.5);
    }
  },
  bent_nail(p) {
    rect(p, 2, 2, 6, 2, IRON.slice(3), 3);
    p.vline(5, 4, 9, IRON[3], 3);
    p.line(5, 9, 12, 13, IRON[3], 3);
    p.line(6, 9, 12, 12, IRON[2], 3);
  },
  hourglass_pin(p) {
    p.line(2, 14, 7, 9, IRON[4], 2);
    p.hline(7, 14, 3, GOLD[2], 3);
    p.hline(7, 14, 12, GOLD[2], 3);
    for (let y = 4; y < 12; y++) {
      const w = Math.abs(y - 7.5) * 0.6 + 0.4;
      p.hline(Math.round(10.5 - w), Math.round(10.5 + w), y, y < 6 || y > 9 ? '#d0aa60' : '#a8b8c8', 2.5);
    }
  },
  powder_charm(p) {
    p.ellipse(8, 9, 4.5, 4.5, ['#0a0a0c', '#18181c', '#2a2a30', '#3e3e46'], 3);
    p.line(8, 4, 8, 1, PAPER[2], 2);
    p.vline(8, 7, 11, GOLD[3], 3.5); // a little holy cross painted on
    p.hline(6, 10, 8, GOLD[3], 3.5);
  },
  moth_wing(p) {
    const M = ['#4a3e30', '#7a6a54', '#a8987a', '#d8cca8'];
    p.ellipse(6, 6, 5, 4, M, 2);
    p.ellipse(8, 11, 3.5, 3, M, 2);
    p.ellipse(6, 6, 1.5, 1.5, ['#2a1a10', '#ffffff'], 2.4);
    p.line(10, 3, 14, 1, M[3], 2.2);
  },
};

const SCROLL_SEAL = {
  mending: '#e04a5a',
  revealing: '#5ab0e0',
  fire: '#f08a2a',
  lightning: '#a0d8ff',
  warding: '#f0d870',
  passage: '#8a6ae0',
  plenty: '#5ad06a',
  haste: '#f0f0f0',
  unlocking: '#c0a060',
  banishing: '#40e0c0',
};

function scrollIcon(p, seal) {
  p.cyl(3, 4, 10, 9, PAPER, 2);
  p.ellipse(3, 8.5, 1.5, 4.6, PAPER.slice(0, 3), 2.5); // rolled ends
  p.ellipse(13, 8.5, 1.5, 4.6, PAPER.slice(0, 3), 2.5);
  for (let y = 6; y < 12; y += 2) p.hline(5, 11, y, PAPER[0], 2.1); // writing
  p.ellipse(8, 12, 2, 1.8, [seal, seal], 3);
  p.glow(8, 12, seal, 0.8);
}

function potionIcon(p, glass) {
  rect(p, 6, 1, 4, 2, ['#5a3a1a', '#8a5a2a', '#b08050'], 3); // cork
  rect(p, 6, 3, 4, 2, ['#2a2a34', '#4a4a5a'], 2.6);
  p.ellipse(8, 10, 5.5, 5, ['#1a1a24', '#3a3a4a', '#6a6a7a'], 2.6);
  p.ellipse(8, 11, 4.5, 3.5, glass, 3.2);
  p.px(5, 8, '#ffffff', 3.6);
  p.px(10, 10, glass[3], 3.5);
}

function sealIcon(p, i) {
  // three pieces of one stone disc: bone (left), flame (top-right), thorn (bottom-right)
  const ramps = [BONE, FIRE, GREEN];
  const ramp = ramps[i];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      if (dx * dx + dy * dy > 42) continue;
      const a = (Math.atan2(dy, dx) + Math.PI * 2.5) % (Math.PI * 2); // 0 at the top
      const piece = Math.floor(a / ((Math.PI * 2) / 3));
      if (piece !== (i + 2) % 3) continue;
      p.px(x, y, ramp[(x + y) % 3 === 0 ? 3 : 2], 3);
    }
  }
  p.glow(8, 8, ramp[3], 1);
  ring(p, 7.5, 7.5, 6.3, 6.3, GOLD[2], 3.2, 30);
}

function pageIcon(p) {
  rect(p, 3, 2, 10, 12, PAPER, 2);
  for (let i = 0; i < 6; i++) p.px(13 - (i % 2), 3 + i * 2, PAPER[0], 2.2); // torn edge
  for (let y = 4; y < 13; y += 2) p.hline(5, 10 - (y % 4 ? 2 : 0), y, '#3a2a1a', 2.1);
  p.ellipse(10, 11, 1.5, 1.2, RED, 2.3); // a blot
}

export function curioFrame(k) {
  const p = new Painter(16, 16);
  if (k < 10) TRINKET_DRAW[TRINKET_IDS[k]](p);
  else if (k < 20) scrollIcon(p, SCROLL_SEAL[SCROLL_IDS[k - 10]]);
  else if (k < 30) potionIcon(p, POTION_LOOKS[k - 20].glass);
  else if (k < 33) sealIcon(p, k - 30);
  else if (k === 33) pageIcon(p);
  else mysteryIcon(p);
  p.outline(S.outline);
  return p;
}
