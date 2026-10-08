// Beatrix the Wandering: a tall, too-thin woman in a grey burial gown, black hair hanging over her
// face, arms that reach past her knees. She doesn't walk; the hem just drifts. y points DOWN.
//
// One row, 36 x 54 frames, facing right (mirrored in the game to face left):
//   0-1 idle (a slow sway)   2-5 drifting   6 reaching for you   7-8 coming apart (vanishing)

import { Painter } from '../Painter.js';
import { SHARED as S } from '../../data/palettes.js';
import { limb, shape, glowEye } from './artKit.js';

const GOWN = ['#18181e', '#2a2a32', '#44444e', '#62626e', '#8a8a96', '#b4b4be'];
const SKIN = ['#6a6670', '#9a96a2', '#c8c4cc', '#e8e4ec'];
const HAIR = ['#020203', '#08080b', '#121218', '#1e1e26'];

export const BEATRIX_COLS = 9;

export function beatrixFrame(col) {
  const p = new Painter(36, 54);
  const cx = 18;
  const drift = col >= 2 && col <= 5 ? col - 2 : 0;
  const bob = col <= 1 ? col : [0, -1, -1, 0][drift];
  const sway = col <= 1 ? col * 0.6 : Math.sin(drift * 1.57) * 1.2;
  const fade = col >= 7 ? col - 6 : 0; // 1 or 2: coming apart

  // the gown: narrow at the shoulders, a long ragged bell to the floor (no feet)
  const top = 16 + bob;
  const hem = 50;
  const pts = [[cx - 4, top], [cx + 4, top], [cx + 8 + sway, hem - 6]];
  for (let k = 0; k <= 6; k++) pts.push([cx + 9 - k * 3 + sway * (1 - k / 6), hem - ((k + drift) % 2 ? 0 : 4)]); // a torn hem
  pts.push([cx - 9 + sway * 0.4, hem - 6]);
  if (fade < 2) shape(p, pts, GOWN, 5, { folds: 1.2 });
  // wisps trailing from the hem
  for (let w = 0; w < 4; w++) {
    const wx = cx - 7 + w * 4.5 + sway;
    const len = 3 + ((w + drift) % 3);
    limb(p, wx, hem - 1, wx - 1 - fade * 2, hem + len + fade * 2, 1, 0.3, GOWN.slice(0, 3), 4);
  }
  // a stain down the front
  if (fade < 2) for (let y = top + 6; y < top + 20; y++) p.px(cx + 1 + ((y * 7) % 3) - 1, y, '#3a1a1e', 5.4);

  // the arms: too long, hanging past her knees - or reaching out
  if (col === 6) {
    limb(p, cx + 3, top + 2, cx + 14, top + 6, 1.4, 1.1, SKIN, 7);
    limb(p, cx + 14, top + 6, cx + 24, top + 4, 1.1, 0.8, SKIN, 7.2);
    for (let f = -1; f <= 1; f++) limb(p, cx + 24, top + 4, cx + 29, top + 3 + f * 2, 0.5, 0.3, SKIN, 7.4);
    limb(p, cx - 3, top + 2, cx + 6, top + 10, 1.4, 1.1, SKIN, 6.8);
    limb(p, cx + 6, top + 10, cx + 16, top + 12, 1.1, 0.8, SKIN, 7);
  } else if (fade < 2) {
    for (const side of [-1, 1]) {
      const hx = cx + side * (7 + sway * 0.3);
      limb(p, cx + side * 4, top + 2, hx, top + 16, 1.3, 1, SKIN, 6.4);
      limb(p, hx, top + 16, hx + side * 0.5, top + 27, 1, 0.7, SKIN, 6.6);
      for (let f = -1; f <= 1; f++) limb(p, hx + side * 0.5, top + 27, hx + side * 0.5 + f, top + 31, 0.4, 0.25, SKIN, 6.8); // long fingers
    }
  }

  // the head, tilted; black hair hanging over her face to her chest
  const hx = cx + 1 + sway * 0.5;
  const hy = top - 7;
  if (fade < 2) {
    p.ellipse(hx, hy, 4.4, 5.2, SKIN, 8);
    // the hair parts in two wet curtains; between them, a strip of her face
    shape(p, [[hx - 5, hy - 4], [hx + 0.5, hy - 5.5], [hx + 0.5, hy + 2], [hx - 1, hy + 18], [hx - 4, hy + 11], [hx - 6, hy + 15]], HAIR, 8.6, { folds: 1 });
    shape(p, [[hx + 2.5, hy - 5.5], [hx + 5, hy - 4], [hx + 6, hy + 16 + (drift % 2)], [hx + 3, hy + 12], [hx + 2.5, hy + 4]], HAIR, 8.6, { folds: 1 });
    p.hline(hx - 1, hx + 3, hy - 5, HAIR[1], 8.7); // the crown of her head
    glowEye(p, hx + 1.5, hy - 0.5, '#ff3a3a', 9, 1); // one eye, staring
    p.px(hx + 1, hy + 2, SKIN[0], 8.9); // the shadow of a nose
    p.hline(hx + 1, hx + 2, hy + 4, '#1a0a0e', 8.9); // a mouth, slightly open
  }

  // coming apart: the gown frays into grey motes
  if (fade) {
    for (let i = 0; i < 26 - fade * 6; i++) {
      const x = cx - 10 + ((i * 7) % 20) + sway;
      const y = top - 6 + ((i * 11) % 44) - fade * 3;
      p.px(x, y, GOWN[(i % 4) + 1], 5);
    }
  }
  p.outline(S.outline);
  return p;
}
