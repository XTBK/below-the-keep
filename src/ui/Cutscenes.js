import { RENDER } from '../data/config.js';
import { drawText } from './PixelFont.js';
import { TitleBackdrop } from './TitleBackdrop.js';
import { drawCharacter } from './Collection.js';

// Little pixel-art cutscenes: the story of the Keep when a hero first descends, and a vignette each
// time the descent reaches a new place. Each panel is a small animated scene painted live (no image
// files) with a line of text typed out beneath it. Any key / tap moves on; Esc skips the lot.
//
// THE STORY
// The Keep of Hollowmere stood over its valley for three hundred years. Then a new king dug too deep
// and found a crown on a skull in the catacombs - a hollow crown that whispers. It told him to send
// his people down. He did, and none came up. Now the keep is sinking, the deep places are waking,
// and the only way out is down: to the throne at the bottom, and the thing that wears the king.

const W = RENDER.width;
const H = RENDER.height;
const PX = 80; // the panel's place on screen
const PY = 26;
const PW = 480;
const PH = 216;

// --------------------------------------------------------------------------------------------
// painting helpers (all coordinates inside the panel)
// --------------------------------------------------------------------------------------------
function rect(g, x, y, w, h, c) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function glowAt(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 1, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
function band(g, y0, y1, colors) {
  // a stepped, dithered vertical gradient
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    const f = t * (colors.length - 1);
    const i = Math.floor(f);
    for (let x = 0; x < PW; x += 2) {
      const d = ((x >> 1) & 1) * 0.5 + (y & 1) * 0.25 + 0.125;
      g.fillStyle = colors[Math.min(colors.length - 1, i + (f - i > d ? 1 : 0))];
      g.fillRect(x, y, 2, 1);
    }
  }
}
function flame(g, x, y, t, s = 1) {
  const f = Math.floor(t * 10 + x) % 3;
  rect(g, x - 1 * s, y - 2 * s, 3 * s, 4 * s, '#a03008');
  rect(g, x - 1 * s + (f === 1 ? s : 0), y - 4 * s, 2 * s, 4 * s, '#f68c2c');
  rect(g, x, y - 2 * s, s, 2 * s, '#ffe8a0');
}
function figure(g, x, y, c, h = 14, chained = false, t = 0, rimC = '#8a6a4a') {
  // a little walking silhouette (prisoner or guard), its back edge caught by torchlight
  const step = Math.floor(t * 4 + x) % 2;
  rect(g, x - 3, y - h, 6, h - 4, c);
  rect(g, x - 2, y - h - 5, 5, 5, c);
  rect(g, x - 2 + step, y - 4, 2, 4, c);
  rect(g, x + 1 - step, y - 4, 2, 4, c);
  rect(g, x - 3, y - h, 1, h - 4, rimC);
  rect(g, x - 2, y - h - 5, 1, 5, rimC);
  if (chained) {
    rect(g, x - 8, y - h + 7, 8, 1, '#8a8a96');
    rect(g, x - 5, y - h + 6, 1, 1, '#b0b0bc');
  }
}

// --------------------------------------------------------------------------------------------
// the scenes
// --------------------------------------------------------------------------------------------
const backdrop = new TitleBackdrop();
let keepCanvas = null;

const SCENES = {
  // the Keep on its crag, under the moon
  keep(g, t, dt) {
    if (!keepCanvas) {
      keepCanvas = document.createElement('canvas');
      keepCanvas.width = W;
      keepCanvas.height = H;
    }
    const kc = keepCanvas.getContext('2d');
    backdrop.draw(kc, t, dt);
    g.drawImage(keepCanvas, 80, 60, PW, PH, 0, 0, PW, PH);
  },

  // the king on his throne; the crown glows and whispers
  throne(g, t) {
    band(g, 0, PH, ['#07040a', '#0e0812', '#160a18', '#1e0c1c', '#240e1e']);
    // pillars receding
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const x = 240 + side * (60 + i * 52);
        const w = 26 - i * 4;
        rect(g, x - w / 2, 20 + i * 6, w, PH - 40 - i * 6, ['#1a1218', '#150e14', '#100a10', '#0c080c'][i]);
        rect(g, x - w / 2 + (side > 0 ? 0 : w - 2), 20 + i * 6, 2, PH - 40 - i * 6, '#2a1e28');
        // banners
        rect(g, x - w / 2 + 3, 40 + i * 6, w - 6, 40 - i * 4, ['#5a1018', '#4a0e14', '#3a0a10', '#2a080c'][i]);
      }
    }
    // the dais and the throne
    rect(g, 170, 170, 140, 12, '#1a1418');
    rect(g, 190, 160, 100, 12, '#221a20');
    rect(g, 214, 70, 52, 92, '#2a1c14');
    rect(g, 220, 76, 40, 60, '#4a1018');
    rect(g, 210, 60, 8, 20, '#3a2818');
    rect(g, 262, 60, 8, 20, '#3a2818');
    // the king: a dark cloaked shape, slumped
    rect(g, 226, 104, 28, 50, '#0c080c');
    rect(g, 232, 92, 16, 14, '#d0b090');
    rect(g, 234, 98, 4, 2, '#1a0a0a');
    rect(g, 242, 98, 4, 2, '#1a0a0a');
    // the crown, too bright, and its whisper
    const pulse = 0.6 + 0.4 * Math.sin(t * 3);
    glowAt(g, 240, 88, 44, '176,90,255', 0.35 * pulse);
    rect(g, 230, 86, 20, 5, '#c49a38');
    for (const x of [230, 236, 242, 248]) rect(g, x, 82, 2, 4, '#ecd078');
    rect(g, 239, 87, 2, 2, '#c070ff');
    for (let i = 0; i < 14; i++) {
      const a = t * 0.8 + i * 0.9;
      const r = 30 + ((t * 20 + i * 17) % 60);
      g.globalAlpha = 0.5 * (1 - r / 90);
      rect(g, 240 + Math.cos(a) * r, 88 + Math.sin(a) * r * 0.6, 2, 2, '#c070ff');
    }
    g.globalAlpha = 1;
    // braziers either side
    for (const x of [160, 320]) {
      rect(g, x - 6, 150, 12, 20, '#1a1418');
      flame(g, x, 146, t, 2);
      glowAt(g, x, 140, 50, '255,140,60', 0.25);
    }
  },

  // the people led down the stair into the dark
  procession(g, t) {
    band(g, 0, PH, ['#0a0808', '#0e0b0a', '#100c0a', '#0a0706', '#050404', '#020202']);
    // the stair, stepping down to the right into blackness
    for (let i = 0; i < 16; i++) {
      const x = 20 + i * 28;
      const y = 70 + i * 9;
      rect(g, x, y, 30, PH - y, i < 10 ? ['#3a3028', '#332a23', '#2c241e'][i % 3] : '#0c0a08');
      rect(g, x, y, 30, 2, '#5a4a3a');
    }
    // the walk
    const off = (t * 10) % 28;
    for (let i = 0; i < 9; i++) {
      const s = i * 28 + off;
      const x = 30 + s;
      const y = 70 + (s / 28) * 9;
      const guard = i % 4 === 0;
      figure(g, x + 12, y, guard ? '#3a3a46' : '#241c16', guard ? 18 : 14, !guard, t, guard ? '#9a9aa8' : '#a07850');
      if (guard) rect(g, x + 10, y - 23, 5, 2, '#6a6a76'); // a helm
      if (guard) {
        rect(g, x + 15, y - 22, 1, 8, '#4a3020');
        flame(g, x + 15, y - 23, t);
        glowAt(g, x + 15, y - 22, 40, '255,150,70', 0.3);
      }
    }
    // the dark swallowing them
    const fade = g.createLinearGradient(260, 0, PW, 0);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(1, 'rgba(0,0,0,0.95)');
    g.fillStyle = fade;
    g.fillRect(260, 0, PW - 260, PH);
  },

  // the hero at the top of the last stair
  hero(g, t, dt, ctx) {
    band(g, 0, PH, ['#0a0808', '#0c0a0a', '#0a0808', '#060505', '#030303']);
    // a round shaft going down, with steps spiralling into it
    for (let r = 0; r < 7; r++) {
      const ry = 120 + r * 12;
      const rx = 150 - r * 14;
      g.fillStyle = ['#2a2420', '#221d1a', '#1a1614', '#141110', '#0e0c0b', '#080707', '#040404'][r];
      g.beginPath();
      g.ellipse(300, ry, rx, rx * 0.3, 0, 0, Math.PI * 2);
      g.fill();
    }
    // far below, something glows
    glowAt(g, 300, 200, 60, '176,90,255', 0.18 + 0.08 * Math.sin(t * 2));
    // a torch on the wall beside the hero
    rect(g, 90, 60, 3, 18, '#4a3020');
    flame(g, 91, 58, t, 2);
    glowAt(g, 100, 80, 90, '255,150,70', 0.32);
    ctx.hero = true;
  },

  // the catacombs: niches of skulls, a candle, something stirring
  catacombs(g, t) {
    band(g, 0, PH, ['#0c0a06', '#14110a', '#1a160e', '#120f0a', '#0a0806']);
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 9; i++) {
        const x = 18 + i * 52;
        const y = 16 + row * 46;
        rect(g, x, y, 40, 28, '#050403');
        for (let k = 0; k < 3; k++) {
          const sx = x + 6 + k * 11;
          rect(g, sx, y + 12, 8, 8, '#b8ab8a');
          rect(g, sx + 1, y + 14, 2, 2, '#0a0806');
          rect(g, sx + 5, y + 14, 2, 2, '#0a0806');
        }
      }
    }
    // a candle, and one skull whose eyes light up
    rect(g, 236, 150, 6, 16, '#d8ccaa');
    flame(g, 239, 148, t, 2);
    glowAt(g, 239, 150, 80, '255,200,120', 0.3);
    if (Math.sin(t * 1.5) > 0.2) {
      rect(g, 70 + 6 + 11 + 1, 16 + 46 * 2 + 14, 2, 2, '#9ad0ff');
      rect(g, 70 + 6 + 11 + 5, 16 + 46 * 2 + 14, 2, 2, '#9ad0ff');
    }
  },

  // the Hollow: a forest underground, roots and glowing caps, eyes in the dark
  hollow(g, t) {
    band(g, 0, PH, ['#040a08', '#06100c', '#081610', '#0a1a14', '#08120e']);
    // trunks and roots coming down from the ceiling
    for (let i = 0; i < 8; i++) {
      const x = 20 + i * 62 + (i % 2) * 14;
      rect(g, x, 0, 18 - (i % 3) * 3, PH, ['#120c08', '#1a120c', '#0e0a06'][i % 3]);
      rect(g, x, 0, 2, PH, '#2a1e14');
    }
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = '#1e140c';
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(i * 90, PH);
      g.quadraticCurveTo(i * 90 + 40, PH - 60, i * 90 + 90, PH - 10);
      g.stroke();
    }
    // glowing mushrooms
    for (let i = 0; i < 14; i++) {
      const x = 14 + ((i * 97) % 460);
      const y = 170 + ((i * 37) % 40);
      const c = i % 2 ? '74,224,200' : '176,74,224';
      rect(g, x, y, 2, 6, '#c8c0a0');
      rect(g, x - 3, y - 2, 8, 3, i % 2 ? '#4ae0c8' : '#b04ae0');
      glowAt(g, x + 1, y, 18, c, 0.35 + 0.15 * Math.sin(t * 2 + i));
    }
    // eyes in the dark between the trunks
    const blink = Math.sin(t * 0.9) > -0.9;
    if (blink) for (const [x, y] of [[150, 90], [340, 70], [410, 120]]) {
      rect(g, x, y, 2, 2, '#ffe060');
      rect(g, x + 6, y, 2, 2, '#ffe060');
    }
  },

  // the Burning Halls: arches aflame
  halls(g, t) {
    band(g, 0, PH, ['#120404', '#200606', '#2e0a06', '#3a0e06', '#200604']);
    for (let i = 0; i < 5; i++) {
      const x = 20 + i * 96;
      rect(g, x, 30, 14, PH - 30, '#0e0606');
      rect(g, x + 74, 30, 14, PH - 30, '#0e0606');
      g.fillStyle = '#0e0606';
      g.beginPath();
      g.arc(x + 44, 40, 44, Math.PI, 0);
      g.lineTo(x + 74, 40);
      g.arc(x + 44, 40, 30, 0, Math.PI, true);
      g.fill();
    }
    // a floor of fire: tongues that lick up and fall back
    for (let x = 0; x < PW; x += 6) {
      const h = 14 + Math.sin(x * 0.13 + t * 7) * 6 + Math.sin(x * 0.31 - t * 11) * 5;
      g.fillStyle = '#a03008';
      g.beginPath();
      g.moveTo(x - 4, PH);
      g.lineTo(x + 3, PH - h - 6);
      g.lineTo(x + 10, PH);
      g.fill();
      g.fillStyle = '#f68c2c';
      g.beginPath();
      g.moveTo(x - 1, PH);
      g.lineTo(x + 3, PH - h);
      g.lineTo(x + 7, PH);
      g.fill();
      rect(g, x + 2, PH - h * 0.5, 2, h * 0.5, '#ffe080');
    }
    // banners burning on the pillars
    for (let i = 0; i < 5; i++) {
      const x = 26 + i * 96;
      rect(g, x - 2, 60, 18, 46, '#5a1018');
      rect(g, x - 2, 60, 18, 3, '#c49a38');
      flame(g, x + 7, 106, t + i, 2);
    }
    glowAt(g, PW / 2, PH, 260, '255,90,20', 0.35);
    for (let i = 0; i < 24; i++) {
      const y = PH - ((t * 30 + i * 37) % PH);
      rect(g, (i * 71 + Math.sin(t + i) * 10) % PW, y, 1, 1, '#ffb060');
    }
  },

  // before the throne: great doors, the Mad King far away, the crown burning purple
  throneDoor(g, t) {
    band(g, 0, PH, ['#08040a', '#0e0610', '#120814', '#0a050c']);
    rect(g, 140, 20, 200, PH - 20, '#1a1016');
    rect(g, 150, 30, 180, PH - 30, '#050306');
    // the long carpet
    g.fillStyle = '#3a0a10';
    g.beginPath();
    g.moveTo(210, PH);
    g.lineTo(270, PH);
    g.lineTo(246, 90);
    g.lineTo(234, 90);
    g.fill();
    rect(g, 228, 70, 24, 22, '#1a1014'); // the throne, far
    rect(g, 234, 74, 12, 14, '#0a0608'); // its king
    const pulse = 0.6 + 0.4 * Math.sin(t * 2.4);
    glowAt(g, 240, 72, 34, '176,90,255', 0.5 * pulse);
    rect(g, 236, 70, 8, 2, '#ecd078');
    for (const x of [170, 310]) {
      flame(g, x, 110, t, 2);
      glowAt(g, x, 110, 40, '255,140,60', 0.25);
    }
  },

  // the Forgotten Vault: gold in the dust, a sealed door
  vault(g, t) {
    band(g, 0, PH, ['#0a0806', '#14100a', '#1c160c', '#120e08']);
    for (let i = 0; i < 30; i++) {
      const x = 40 + ((i * 61) % 400);
      const y = 150 + ((i * 17) % 50);
      rect(g, x, y, 6, 3, '#c49a38');
      rect(g, x + 1, y, 3, 1, '#ecd078');
    }
    rect(g, 190, 30, 100, 130, '#2a2216');
    rect(g, 200, 40, 80, 120, '#14100a');
    for (const [x, y] of [[214, 80], [240, 64], [266, 80]]) {
      rect(g, x - 4, y - 4, 8, 8, '#3a3022');
      glowAt(g, x, y, 14, '200,220,255', 0.2 + 0.1 * Math.sin(t * 2 + x));
    }
    glowAt(g, 240, 100, 120, '255,210,120', 0.12);
  },
};

// --------------------------------------------------------------------------------------------
// the cutscenes themselves
// --------------------------------------------------------------------------------------------
const HERO_LINES = {
  wren: 'Wren laughed at the wrong king, and was thrown below for it. He is going further down - to unmake the crown that called it treason.',
  ranger: "The royal forest is dying from the roots up. Rowan followed the rot down through the cells. Whatever is eating the trees lives below.",
  ironknight: 'Sir Aldwin swore an oath to guard the king. Tonight he breaks it, one step at a time, all the way to the bottom.',
  knight: "Maud's lord went down into the Burning Halls and never came back. She carries his sword the rest of the way.",
  witch: 'They burned the queen for a witch. Her garden is still growing in the dark below, and it is calling Agnes home.',
  ghost: 'The Nameless died in the cells, and did not stop. Death was only the first door. There are more, further down.',
};

export const CUTSCENES = {
  intro: (hero) => [
    { scene: 'keep', text: 'For three hundred years the Keep of Hollowmere stood over its valley, and the valley slept safe beneath it.' },
    { scene: 'throne', text: 'Then a new king dug too deep. On a skull in the catacombs he found a crown - hollow, and whispering.' },
    { scene: 'procession', text: 'It told him to send his people down. He did. None of them came back up.' },
    { scene: 'hero', text: HERO_LINES[hero] || HERO_LINES.wren, hero },
    { scene: 'hero', text: 'Now the Keep is sinking into the dark it woke. There is no way back. The only way out is down.', hero },
  ],
  catacombs: () => [{ scene: 'catacombs', text: 'Below the cells lie the dead of a hundred kings. Something has taught them to stand.' }],
  hollow: () => [{ scene: 'hollow', text: "Deeper still grows the queen's lost garden: a forest that has never seen the sun. It is hungry." }],
  halls: () => [{ scene: 'halls', text: "The old halls burn and never burn out. Here the crown's whisper is almost a voice." }],
  throne: () => [{ scene: 'throneDoor', text: 'The throne of the Mad King. He is waiting - and so is the thing that wears him.' }],
  vault: () => [{ scene: 'vault', text: 'A vault no king remembers, sealed with bone, flame and thorn. Someone hid something here.' }],
};

export class Cutscene {
  /** id: a key of CUTSCENES; hero: the character id (for the intro). onDone: called when it ends. */
  constructor(id, hero, onDone) {
    this.panels = CUTSCENES[id](hero);
    this.i = 0;
    this.t = 0; // time on this panel
    this.time = 0;
    this.hero = hero;
    this.onDone = onDone;
    this.done = false;
    this.canvas = document.createElement('canvas');
    this.canvas.width = PW;
    this.canvas.height = PH;
  }

  get panel() {
    return this.panels[this.i];
  }

  /** How many letters of the line are showing. */
  get shown() {
    return Math.floor(this.t * 42);
  }

  /** A key or tap: finish typing the line, or move to the next panel. */
  advance() {
    if (this.done) return;
    if (this.shown < this.panel.text.length) {
      this.t = this.panel.text.length / 42 + 0.01;
      return;
    }
    this.next();
  }

  next() {
    this.i++;
    this.t = 0;
    if (this.i >= this.panels.length) this.finish();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    if (this.onDone) this.onDone();
  }

  update(dt) {
    if (this.done) return;
    this.t += dt;
    this.time += dt;
    // a panel moves on by itself once its line has been up for a while
    if (this.t > this.panel.text.length / 42 + 4.5) this.next();
  }

  draw(ctx, dt) {
    if (this.done) return;
    const p = this.panel;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    // the scene, faded in
    const g = this.canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, PW, PH);
    const flags = {};
    SCENES[p.scene](g, this.time, dt, flags);
    const fadeIn = Math.min(1, this.t * 2.5);
    ctx.globalAlpha = fadeIn;
    ctx.drawImage(this.canvas, PX, PY);
    if (flags.hero && p.hero) drawCharacter(ctx, p.hero, PX + 100, PY + 100, 2, false);
    ctx.globalAlpha = 1;
    // a frame of dark iron around the picture
    ctx.fillStyle = '#2a2a32';
    ctx.fillRect(PX - 4, PY - 4, PW + 8, 4);
    ctx.fillRect(PX - 4, PY + PH, PW + 8, 4);
    ctx.fillRect(PX - 4, PY, 4, PH);
    ctx.fillRect(PX + PW, PY, 4, PH);
    ctx.fillStyle = '#5a5a66';
    ctx.fillRect(PX - 4, PY - 4, PW + 8, 1);
    // the words, typed out
    const text = p.text.slice(0, this.shown);
    const lines = wrapWords(text, 70);
    lines.forEach((l, k) => drawText(ctx, l.toUpperCase(), W / 2, PY + PH + 18 + k * 12, '#e8e0d0', { align: 'center' }));
    // progress pips and the hint
    for (let k = 0; k < this.panels.length; k++) {
      ctx.fillStyle = k === this.i ? '#e8c46c' : '#3a3640';
      ctx.fillRect(W / 2 - this.panels.length * 5 + k * 10, H - 26, 6, 3);
    }
    if (Math.floor(this.time * 2) % 2 === 0) drawText(ctx, 'ANY KEY - NEXT      ESC - SKIP', W / 2, H - 16, '#5d606c', { align: 'center' });
  }
}

function wrapWords(text, n) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > n) {
      lines.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}
