// Wren's body (and the shape the other characters wear). 32x32 frames. (Wren himself wears the
// 'wizard' outfit, a whole body of its own: see wizardArt.js.)
// Sheet layout: rows = facing [down, up, right, left]; cols = [idle0, idle1, walk0..3, throwWind, throwRelease]

import { Painter } from '../Painter.js';
import { SHARED as S } from '../../data/palettes.js';
import { wizardFrame } from './wizardArt.js';

export const WREN_DIRS = ['down', 'up', 'right', 'left'];
export const WREN_FRAMES = 8;

// pose per column
const POSES = [
  { bob: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, stride: 0 }, // idle 0
  { bob: 1, liftL: 0, liftR: 0, armL: 0, armR: 0, stride: 0 }, // idle 1 (breathing)
  { bob: 1, liftL: 1, liftR: 0, armL: 1, armR: -1, stride: 1 }, // walk 0 (contact)
  { bob: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, stride: 0, passing: 1 }, // walk 1 (passing)
  { bob: 1, liftL: 0, liftR: 1, armL: -1, armR: 1, stride: -1 }, // walk 2 (contact)
  { bob: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, stride: 0, passing: -1 }, // walk 3 (passing)
  { bob: 0, liftL: 0, liftR: 0, armL: 0, armR: 0, stride: 0, throwPose: 'wind' },
  { bob: 1, liftL: 0, liftR: 0, armL: 0, armR: 0, stride: 0, throwPose: 'release' },
];

const BOOT = S.leather.slice(0, 3);

function frontLegs(p, pose, b) {
  // two legs, viewed from the front or back
  for (const [x, lift] of [
    [12, pose.liftL],
    [17, pose.liftR],
  ]) {
    const footY = 28 - lift;
    p.cyl(x, 21 + b, 3, footY - (21 + b), S.trousers, 2.5);
    p.cyl(x, footY, 3, 3, BOOT, 2.5);
    p.px(x + 1, footY + 2, S.leather[3], 2.5); // scuffed toe highlight
  }
}

function frontArm(p, x, b, off, ramp = S.tunic) {
  p.cyl(x, 13 + b + off, 2, 6, ramp, 3);
  p.rect(x, 19 + b + off, 2, 2, S.skin[3], 3);
  p.px(x + 1, 20 + b + off, S.skin[2], 3);
}

function slingHanging(p, hx, hy) {
  p.vline(hx, hy, hy + 4, S.leather[1], 2.5);
  p.rect(hx, hy + 5, 2, 2, S.leather[2], 3); // empty pouch
  p.px(hx, hy + 5, S.leather[3], 3);
}

function torsoFront(p, b, back) {
  p.cyl(11, 12 + b, 10, 10, S.tunic, 4);
  // hem: slightly flared, ragged
  p.px(10, 21 + b, S.tunic[1], 2);
  p.px(21, 21 + b, S.tunic[1], 2);
  p.px(13, 22 + b, S.tunic[1], 2);
  p.px(18, 22 + b, S.tunic[2], 2);
  // cloth folds
  p.vline(14, 19 + b, 21 + b, S.tunic[1]);
  p.vline(18, 20 + b, 21 + b, S.tunic[1]);
  p.px(17, 15 + b, S.tunic[2]);
  // belt
  p.hline(11, 20, 18 + b, S.leather[1], 4.4);
  p.hline(12, 19, 18 + b, S.leather[2], 4.4);
  if (!back) {
    p.px(15, 18 + b, S.brass[2], 4.8);
    p.px(16, 18 + b, S.brass[3], 4.8);
  }
  p.rect(back ? 12 : 18, 19 + b, 2, 2, S.leather[2], 4.2); // pouch for stones
  p.px(back ? 12 : 18, 19 + b, S.leather[3], 4.2);
  // neckerchief
  p.hline(12, 19, 12 + b, S.scarf[2], 4.6);
  p.hline(13, 18, 13 + b, S.scarf[1], 4.6);
  p.px(13, 12 + b, S.scarf[3], 4.6);
  if (back) {
    p.px(15, 14 + b, S.scarf[2], 4.8); // knot at the back
    p.px(16, 14 + b, S.scarf[1], 4.8);
    p.px(16, 15 + b, S.scarf[0], 4.4);
  } else {
    p.px(15, 14 + b, S.scarf[1], 4.6);
    p.px(16, 14 + b, S.scarf[0], 4.6);
  }
}

function headFront(p, b) {
  p.ellipse(16, 8.5 + b, 4.6, 4.3, S.skin, 5);
  p.px(10, 9 + b, S.skin[2], 3.5); // ears
  p.px(21, 9 + b, S.skin[1], 3.5);
  p.px(14, 9 + b, S.eye, 4.5);
  p.px(17, 9 + b, S.eye, 4.5);
  p.px(16, 10 + b, S.skin[2], 5.5); // nose shadow
  p.hline(15, 16, 11 + b, S.skin[1], 4.5); // mouth
  p.px(13, 10 + b, '#b8735a', 4.6); // cheeks
  p.px(18, 10 + b, '#a8664e', 4.6);
  // hair: messy mop with a fringe
  p.ellipse(16, 5.6 + b, 5.3, 3.5, S.hair, 6.5);
  p.vline(11, 6 + b, 9 + b, S.hair[1], 5);
  p.vline(20, 6 + b, 9 + b, S.hair[0], 5);
  p.px(13, 8 + b, S.hair[2], 6);
  p.px(15, 8 + b, S.hair[1], 6);
  p.px(18, 8 + b, S.hair[1], 6);
  p.px(18, 1 + b, S.hair[1], 6);
  p.px(17, 2 + b, S.hair[2], 6.5);
  p.px(14, 3 + b, S.hair[3], 7);
  p.px(15, 3 + b, S.hair[3], 7);
  p.px(13, 4 + b, S.hair[3], 6.8);
}

function headBack(p, b) {
  p.ellipse(16, 8.5 + b, 4.6, 4.3, S.skin, 5);
  p.px(10, 9 + b, S.skin[2], 3.5);
  p.px(21, 9 + b, S.skin[1], 3.5);
  p.ellipse(16, 7 + b, 5.3, 4.9, S.hair, 6.5);
  p.px(18, 2 + b, S.hair[1], 6);
  p.px(14, 11 + b, S.hair[1], 5); // tufts at the nape
  p.px(17, 11 + b, S.hair[1], 5);
  p.px(14, 4 + b, S.hair[3], 7); // crown highlight
  p.px(15, 3 + b, S.hair[3], 7);
  p.px(17, 5 + b, S.hair[2], 7);
}

function drawFront(pose, back) {
  const p = new Painter(32, 32);
  const b = pose.bob;
  frontLegs(p, pose, b);
  torsoFront(p, b, back);
  // the sling hand is Wren's right: viewer's left when facing us, viewer's right from behind
  const slingX = back ? 21 : 9;
  const otherX = back ? 9 : 21;
  frontArm(p, otherX, b, back ? pose.armL : pose.armR);
  const t = pose.throwPose;
  if (t === 'wind') {
    // arm raised high, sling looped above the head
    p.cyl(slingX, 7 + b, 2, 7, S.tunic, 3);
    p.rect(slingX, 5 + b, 2, 2, S.skin[3], 3.5);
    const dir = back ? 1 : -1;
    p.px(slingX + (back ? 1 : 0), 4 + b, S.leather[1], 4);
    p.px(slingX + dir * 1 + (back ? 1 : 0), 3 + b, S.leather[1], 4);
    p.px(slingX + dir * 2 + (back ? 1 : 0), 2 + b, S.leather[2], 4);
    p.rect(slingX + dir * 3 + (back ? 0 : 0), 1 + b, 2, 2, S.pebble[3], 4.5);
  } else if (t === 'release') {
    if (back) {
      p.cyl(slingX, 6 + b, 2, 7, S.tunic, 3);
      p.rect(slingX, 4 + b, 2, 2, S.skin[3], 3.5);
      p.vline(slingX + 1, 0 + b, 3 + b, S.leather[1], 3.5);
    } else {
      p.cyl(slingX + 1, 14 + b, 2, 6, S.tunic, 3.5);
      p.rect(slingX + 1, 20 + b, 2, 2, S.skin[3], 3.5);
      p.vline(slingX + 2, 22 + b, 27 + b, S.leather[1], 3.5);
      p.rect(slingX + 1, 28, 2, 2, S.leather[2], 3);
    }
  } else {
    frontArm(p, slingX, b, back ? pose.armR : pose.armL);
    slingHanging(p, slingX + (back ? 1 : 0), 21 + b + (back ? pose.armR : pose.armL));
  }
  if (back) headBack(p, b);
  else headFront(p, b);
  return p;
}

function sideLeg(p, hipX, footX, lift, ramp, b) {
  const top = 21 + b;
  const footY = 28 - lift;
  for (let y = top; y < footY; y++) {
    const t = (y - top) / Math.max(1, footY - top);
    const x = Math.round(hipX + (footX - hipX) * t);
    p.cyl(x - 1, y, 3, 1, ramp, 2.5);
  }
  p.cyl(footX - 1, footY, 4, 3, BOOT, 2.5);
  p.px(footX + 2, footY + 1, S.leather[3], 2.5);
}

function drawSide(pose) {
  const p = new Painter(32, 32);
  const b = pose.bob;
  const s = pose.stride;
  const pass = pose.passing || 0;
  const backFoot = 16 - s * 3;
  const frontFoot = 16 + s * 3;
  const darkTrousers = S.trousers.slice(0, 3);
  // back leg (further from the viewer = darker)
  sideLeg(p, 15, backFoot, pass === 1 ? 1 : 0, darkTrousers, b);
  // back arm, mostly hidden behind the body
  if (!pose.throwPose) {
    const swing = -pose.armL * 2;
    p.line(14, 14 + b, 14 + swing, 19 + b, S.tunic[0], 2.5);
  }
  sideLeg(p, 16, frontFoot, pass === -1 ? 1 : 0, S.trousers, b);

  // torso
  p.cyl(12, 12 + b, 8, 10, S.tunic, 4, 0.2);
  p.px(11, 21 + b, S.tunic[1], 2);
  p.px(20, 21 + b, S.tunic[2], 2);
  p.vline(17, 19 + b, 21 + b, S.tunic[1]);
  p.hline(12, 19, 18 + b, S.leather[1], 4.4);
  p.hline(13, 19, 18 + b, S.leather[2], 4.4);
  p.rect(12, 19 + b, 2, 2, S.leather[2], 4.2); // stone pouch at the hip
  p.px(12, 19 + b, S.leather[3], 4.2);
  // neckerchief with its tail flapping behind
  p.hline(13, 19, 12 + b, S.scarf[2], 4.6);
  p.hline(14, 19, 13 + b, S.scarf[1], 4.6);
  p.px(12, 13 + b, S.scarf[1], 4);
  p.px(11, 14 + b + (pass !== 0 ? 0 : 1), S.scarf[0], 3.5);

  // head (facing right)
  p.ellipse(16.5, 8.5 + b, 4.4, 4.3, S.skin, 5);
  p.px(21, 9 + b, S.skin[3], 5); // nose
  p.px(21, 10 + b, S.skin[2], 4.5);
  p.px(19, 9 + b, S.eye, 4.6);
  p.px(20, 11 + b, S.skin[1], 4.4); // mouth
  p.px(18, 10 + b, '#b8735a', 4.6);
  p.px(15, 9 + b, S.skin[1], 4); // ear
  p.px(15, 8 + b, S.skin[2], 4);
  p.ellipse(15.6, 5.8 + b, 4.9, 3.5, S.hair, 6.5);
  p.vline(12, 5 + b, 10 + b, S.hair[1], 5);
  p.vline(13, 6 + b, 9 + b, S.hair[1], 5.5);
  p.px(14, 7 + b, S.hair[2], 5.5);
  p.px(20, 6 + b, S.hair[2], 6);
  p.px(21, 7 + b, S.hair[1], 5.5);
  p.px(13, 1 + b, S.hair[2], 6);
  p.px(17, 2 + b, S.hair[3], 6.6);
  p.px(16, 3 + b, S.hair[3], 7);
  p.px(11, 4 + b, S.hair[1], 5);

  // front (sling) arm
  const t = pose.throwPose;
  if (t === 'wind') {
    p.line(16, 14 + b, 12, 11 + b, S.tunic[3], 3.5);
    p.line(16, 15 + b, 12, 12 + b, S.tunic[2], 3.5);
    p.rect(10, 10 + b, 2, 2, S.skin[3], 4);
    p.line(10, 9 + b, 7, 6 + b, S.leather[1], 4);
    p.rect(5, 4 + b, 2, 2, S.pebble[3], 4.5);
  } else if (t === 'release') {
    p.line(16, 15 + b, 22, 15 + b, S.tunic[3], 4);
    p.line(16, 16 + b, 22, 16 + b, S.tunic[2], 4);
    p.rect(23, 15 + b, 2, 2, S.skin[3], 4);
    p.line(25, 16 + b, 29, 17 + b, S.leather[1], 4);
  } else {
    const swing = pose.armL * 2;
    p.line(16, 14 + b, 16 + swing, 19 + b, S.tunic[3], 4);
    p.line(17, 14 + b, 17 + swing, 18 + b, S.tunic[2], 4);
    p.rect(16 + swing, 20 + b, 2, 2, S.skin[3], 4);
    p.vline(17 + swing, 22 + b, 25 + b, S.leather[1], 3);
    p.rect(17 + swing, 26 + b, 2, 2, S.leather[2], 3);
  }
  return p;
}

// ---------------------------------------------------------------------------------------------
// Relic accessories. Each draws onto a finished (un-outlined) frame; the head position follows the
// pose's bob, so accessories move with the walk cycle.
// ---------------------------------------------------------------------------------------------
const BONE = ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'];
const PELT = ['#1e1e22', '#3a3a40', '#5e5e66', '#8a8a92', '#b0b0b8'];

const ACCESSORIES = {
  horns(p, dir, b) {
    // curled ram horns at the sides of the head
    const sides = dir === 'right' ? [-1] : [-1, 1];
    for (const s of sides) {
      const cx = dir === 'right' ? 14 : 16 + s * 5;
      for (let i = 0; i < 9; i++) {
        const a = (i / 8) * Math.PI * 1.4 - 1.2;
        p.px(cx + s * Math.cos(a) * 2.5, 5 + b + Math.sin(a) * 2.5 + i * 0.25, BONE[1 + (i % 3)], 8);
      }
    }
  },
  mask(p, dir, b) {
    if (dir === 'up') {
      p.hline(11, 20, 8 + b, S.leather[0], 7.5); // straps
      return;
    }
    if (dir === 'right') {
      for (let i = 0; i < 6; i++) p.vline(19 + i, 9 + b + Math.floor(i / 3), 11 + b, S.leather[i < 3 ? 2 : 1], 6 - i * 0.3);
      p.px(19, 8 + b, '#b0f0b0', 6.5); // glass eye
      return;
    }
    p.rect(13, 8 + b, 6, 3, S.leather[1], 6); // mask over the face
    for (let i = 0; i < 4; i++) p.hline(15, 16, 11 + b + i, S.leather[2 - (i > 2 ? 1 : 0)], 6.5 - i * 0.3); // beak
    p.px(14, 9 + b, '#b0f0b0', 6.8);
    p.px(17, 9 + b, '#b0f0b0', 6.8);
  },
  thorns(p, dir, b) {
    for (let x = 11; x <= 20; x++) {
      p.px(x, 4 + b, S.wood[x % 2 ? 2 : 3], 7.5);
      if (x % 3 === 0) p.px(x, 3 + b, S.wood[4], 7.8);
    }
    if (dir === 'down') {
      p.px(14, 6 + b, '#c02634', 6);
      p.px(18, 7 + b, '#c02634', 6);
    }
  },
  wolf(p, dir, b) {
    // the wolf's head worn as a hood, its pelt hanging down the back
    if (dir === 'up') {
      p.ellipse(16, 16 + b, 6.5, 8, PELT, 5.5);
      p.ellipse(16, 6 + b, 5.6, 4.5, PELT, 7.5);
    } else if (dir === 'right') {
      p.ellipse(15, 5 + b, 5.2, 3.6, PELT, 7.5);
      p.line(10, 8 + b, 10, 17 + b, PELT[1], 4);
      p.px(19, 4 + b, PELT[4], 8);
      p.px(21, 5 + b, '#0a0a0a', 8);
    } else {
      p.ellipse(16, 4.5 + b, 5.6, 3.4, PELT, 7.5);
      p.ellipse(16, 6 + b, 2.4, 1.5, PELT.slice(2), 8); // snout over the brow
      p.px(16, 7 + b, '#0a0a0a', 8.2);
      p.px(13, 4 + b, '#e8c040', 8);
      p.px(19, 4 + b, '#e8c040', 8);
    }
    for (const x of dir === 'right' ? [13] : [12, 19]) {
      p.px(x, 1 + b, PELT[3], 8.5); // ears
      p.px(x, 0 + b, PELT[2], 8.5);
    }
  },
  monocle(p, dir, b) {
    if (dir === 'up') return;
    const ex = dir === 'right' ? 19 : 17;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.px(ex + dx, 9 + b + dy, S.brass[3], 6);
    p.px(ex, 9 + b, '#7aff8a', 6.2); // the glowing lens
    p.line(ex + 1, 10 + b, ex + 2, 13 + b, S.brass[2], 5);
  },
  flask(p, dir, b) {
    const x = dir === 'right' ? 12 : dir === 'up' ? 12 : 19;
    p.rect(x, 18 + b, 2, 3, '#6aa0e0', 5);
    p.px(x, 17 + b, S.wood[3], 5);
    p.px(x, 18 + b, '#e0f0ff', 5.2);
  },
  // --- character outfits ---
  helm(p, dir, b) {
    // Maud's open-faced squire's helm (a kettle hat)
    const I = S.iron;
    if (dir === 'right') {
      p.ellipse(15, 5 + b, 5.6, 3.4, I.slice(1, 6), 8);
      p.hline(8, 22, 7 + b, I[4], 8.4);
      p.hline(9, 21, 8 + b, I[2], 8.2);
      return;
    }
    p.ellipse(16, 5 + b, 5.8, 3.4, I.slice(1, 6), 8);
    p.hline(9, 23, 7 + b, I[4], 8.4); // the wide brim
    p.hline(10, 22, 8 + b, I[2], 8.2);
    p.vline(16, 2 + b, 6 + b, I[5], 8.6); // a ridge down the middle
  },
  witchhat(p, dir, b) {
    // Agnes's floppy pointed hat
    const H = ['#140a1e', '#24123a', '#3a1e56', '#56307a'];
    const cx = dir === 'right' ? 15 : 16;
    p.hline(cx - 7, cx + 7, 6 + b, H[1], 8);
    p.hline(cx - 6, cx + 6, 5 + b, H[2], 8.2);
    for (let i = 0; i < 7; i++) p.hline(cx - 4 + Math.floor(i / 2), cx + 4 - Math.floor(i / 2) - (i > 4 ? 1 : 0), 4 + b - i, H[2 + (i % 2)], 8.5 + i * 0.1);
    p.px(cx + (dir === 'right' ? -3 : 3), -3 + b, H[3], 9); // the tip flops over
    p.px(cx + (dir === 'right' ? -4 : 4), -2 + b, H[2], 9);
    if (dir !== 'up') p.hline(cx - 3, cx + 3, 5 + b, '#c8a040', 8.4); // a gold band
  },
  shackles(p, dir, b) {
    // iron cuffs and a broken chain at the wrists; a faint chill about him
    const I = S.iron;
    const xs = dir === 'right' ? [17] : [9, 22];
    for (const x of xs) {
      p.rect(x, 18 + b, 2, 2, I[3], 6);
      p.px(x, 20 + b, I[2], 6);
      p.px(x + (x < 16 ? -1 : 1), 21 + b, I[2], 5.5);
    }
  },
  soot(p, dir, b) {
    for (const [x, y] of [[13, 15], [18, 17], [15, 20], [12, 19]]) p.tint(x, y + b, '#0a0a0c', 0.6);
    if (dir === 'down') p.tint(18, 10 + b, '#0a0a0c', 0.5);
    p.rect(dir === 'right' ? 17 : 11, 19 + b, 2, 2, '#18181c', 4.4); // powder pouch
  },
};

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Swap Wren's tunic / hair / skin colours for a character's own (exact colour matches). */
function recolorPainter(p, recolor) {
  const swaps = [];
  for (const k in recolor) {
    const from = S[k];
    const to = recolor[k];
    for (let i = 0; i < Math.min(from.length, to.length); i++) swaps.push([hexRgb(from[i]), hexRgb(to[i])]);
  }
  const d = p.rgba;
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue;
    for (const [f, t] of swaps) {
      if (d[i] === f[0] && d[i + 1] === f[1] && d[i + 2] === f[2]) {
        d[i] = t[0];
        d[i + 1] = t[1];
        d[i + 2] = t[2];
        break;
      }
    }
  }
}

/**
 * One frame of Wren (or another character wearing his shape). `looks` lists accessories from
 * relics and the character's outfit (e.g. ['horns', 'wolf']); `recolor` swaps his colours.
 * Accessories are drawn before the outline so they get outlined with him.
 */
export function wrenFrame(col, row, looks = [], recolor = null) {
  const pose = POSES[col];
  const dir = WREN_DIRS[row];
  const drawDir = dir === 'left' ? 'right' : dir;
  // the 'wizard' outfit is a whole different body (robe, hat, beard, wand); other looks are drawn on top
  const p = looks.includes('wizard') ? wizardFrame(pose, drawDir) : drawDir === 'right' ? drawSide(pose) : drawFront(pose, drawDir === 'up');
  if (recolor) recolorPainter(p, recolor);
  for (const look of looks) if (ACCESSORIES[look]) ACCESSORIES[look](p, drawDir, pose.bob);
  p.outline(S.outline);
  return dir === 'left' ? p.mirrored() : p;
}
