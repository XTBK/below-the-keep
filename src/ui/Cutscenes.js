import { VISUAL } from '../render/Sprite.js';
import { RENDER } from '../data/config.js';
import { drawText } from './PixelFont.js';
import { TitleBackdrop } from './TitleBackdrop.js';
import { characterPreview } from './Collection.js';
import { getSheet } from '../render/Assets.js';
import { TILESETS } from '../render/art/tilesets.js';
import { RELIC_IDS } from '../data/items.js';
import { CURIO_FRAME } from '../data/curios.js';

// The story, told in little scenes staged with the game's own art: the same floor and wall tiles,
// the same props, heroes, creatures and bosses, at the same pixel scale, lit by torchlight the way
// the Keep is. A line of text types out beneath each scene. Any key / tap moves on; Esc skips.
//
// THE STORY
// Under the Keep of Hollowmere lies the Hollow: the dark the valley was built on. The First King
// sealed it behind the Deep Door with a crown forged from fallen-star iron, and was buried with it.
// Three hundred years later King Varick dug for silver and found the First King's tomb instead. The
// crown on the skull - the Hollow Crown - whispers. It wants to go home, down to the door it was made
// to lock, and open it. Varick sent his people down to dig (the smith, the quartermaster, a sister of
// the chapel, the mapmaker, the old archivist - hundreds more). His bride Beatrix went after him with
// a single candle. None came back. Now the Keep is sinking, and the only way out is down.

const W = RENDER.width;
const H = RENDER.height;
const PX = 80; // the scene's place on screen: exactly as wide as a room
const PY = 22;
const PW = 480;
const PH = 216;

const CROWN = '#c49aff'; // the crown's voice
const BEATRIX_VOICE = '#e89a9a';

// --------------------------------------------------------------------------------------------
// the stage: places the game's own sprites and tiles
// --------------------------------------------------------------------------------------------
function hash(a, b, s) {
  let h = (a * 374761393 + b * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function pickWeighted(weights, r) {
  let total = 0;
  for (const w of weights) total += w;
  let x = r * total;
  for (let i = 0; i < weights.length; i++) {
    x -= weights[i];
    if (x <= 0) return i;
  }
  return 0;
}

let shadeCanvas = null;

class Stage {
  constructor(g, t, pan = 0) {
    this.g = g;
    this.t = t;
    this.ox = -Math.round(pan);
    this.lights = [];
  }

  /** Floor tiles from a chapter's tileset, from y0 down. */
  floor(ts, y0 = 56, seed = 1) {
    const s = getSheet(`${ts}_floor`);
    const weights = TILESETS[ts].floorWeights || [1];
    const c0 = Math.floor(-this.ox / 32) - 1;
    for (let r = 0; r * 32 + y0 < PH; r++) {
      for (let c = c0; c < c0 + 17; c++) {
        const f = pickWeighted(weights, hash(c, r, seed));
        this.g.drawImage(s.colorCanvas, f * 32, 0, 32, 32, c * 32 + this.ox, y0 + r * 32, 32, 32);
      }
    }
  }

  /** The top wall (brick face), its foot at y. */
  wall(ts, y = 56, seed = 2) {
    const s = getSheet(`${ts}_wall_top`);
    const c0 = Math.floor(-this.ox / 32) - 1;
    for (let c = c0; c < c0 + 17; c++) {
      const f = Math.floor(hash(c, 9, seed) * 4);
      this.g.drawImage(s.colorCanvas, f * 32, 0, 32, 64, c * 32 + this.ox, y - 64, 32, 64);
    }
  }

  /** A frame of any sprite sheet, its feet at (x, ground). */
  sprite(key, col, row, x, ground, flip = false) {
    const s = getSheet(key);
    const { frameW: fw, frameH: fh } = s.def;
    this._blit(s.colorCanvas, col * fw, row * fh, fw, fh, x, ground, flip);
  }

  /** A hero (the same sheet the game builds for them). dir: 0 down, 1 up, 2 right, 3 left. */
  hero(id, col, dir, x, ground) {
    this._blit(characterPreview(id), col * 32, dir * 32, 32, 32, x, ground + 2, false);
  }

  /** A 16 x 16 icon (a relic or a curio), centred on (x, y). */
  icon(key, col, x, y) {
    const s = getSheet(key);
    this.g.drawImage(s.colorCanvas, col * 16, 0, 16, 16, Math.round(x - 8 + this.ox), Math.round(y - 8), 16, 16);
  }

  _blit(canvas, sx, sy, fw, fh, x, ground, flip) {
    const g = this.g;
    const dx = Math.round(x - fw / 2 + this.ox);
    const dy = Math.round(ground - fh);
    if (flip) {
      g.save();
      g.translate(dx + fw, dy);
      g.scale(-1, 1);
      g.drawImage(canvas, sx, sy, fw, fh, 0, 0, fw, fh);
      g.restore();
    } else g.drawImage(canvas, sx, sy, fw, fh, dx, dy, fw, fh);
  }

  /** A wall torch: a flame and its light. */
  torch(x, y) {
    const f = Math.floor(this.t * 11 + x) % 4;
    const s = getSheet('flame');
    this.g.fillStyle = '#3a2614';
    this.g.fillRect(Math.round(x - 1 + this.ox), y, 3, 9);
    this.g.drawImage(s.colorCanvas, f * 10, 0, 10, 16, Math.round(x - 5 + this.ox), y - 14, 10, 16);
    this.light(x, y - 4, 110, '255,150,70', 0.5);
  }

  /** A brazier on the floor, lit. */
  brazier(x, ground) {
    this.sprite('brazier', 0, 0, x, ground);
    const f = Math.floor(this.t * 11 + x) % 4;
    const s = getSheet('flame');
    this.g.drawImage(s.colorCanvas, f * 10, 0, 10, 16, Math.round(x - 5 + this.ox), ground - 40, 10, 16);
    this.light(x, ground - 30, 130, '255,150,70', 0.55);
  }

  candles(x, ground) {
    this.sprite('candles', 0, 0, x, ground);
    this.light(x, ground - 14, 70, '255,200,120', 0.4);
  }

  light(x, y, r, rgb = '255,160,80', a = 0.5) {
    this.lights.push({ x: x + this.ox, y, r: r * (0.96 + 0.04 * Math.sin(this.t * 9 + x)), rgb, a });
  }

  /** Shallow water across the floor, from y down. */
  water(y, rgb = '20,70,90') {
    const g = this.g;
    g.fillStyle = `rgba(${rgb},0.62)`;
    g.fillRect(0, y, PW, PH - y);
    g.fillStyle = 'rgba(120,200,220,0.5)';
    for (let i = 0; i < 26; i++) {
      const x = (i * 53 + this.t * (8 + (i % 3) * 4)) % (PW + 30) - 15;
      g.fillRect(Math.round(x), y + 6 + ((i * 17) % (PH - y - 8)), 6 + (i % 4) * 2, 1);
    }
    g.fillRect(0, y, PW, 1);
  }

  /** Motes drifting in the air (dust, spores, embers). */
  motes(color, n = 30, rise = -6) {
    const g = this.g;
    g.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const x = ((i * 97 + this.t * 7 * ((i % 3) - 1)) % PW + PW) % PW;
      const y = ((i * 61 + this.t * rise) % PH + PH) % PH;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  /** The dark, with holes where the lights are, and their colour on top. */
  shade(level = 0.6, tint = '4,3,8') {
    if (!shadeCanvas) {
      shadeCanvas = document.createElement('canvas');
      shadeCanvas.width = PW;
      shadeCanvas.height = PH;
    }
    const sc = shadeCanvas.getContext('2d');
    sc.globalCompositeOperation = 'source-over';
    sc.clearRect(0, 0, PW, PH);
    sc.fillStyle = `rgba(${tint},${level})`;
    sc.fillRect(0, 0, PW, PH);
    sc.globalCompositeOperation = 'destination-out';
    for (const l of this.lights) {
      const gr = sc.createRadialGradient(l.x, l.y, 2, l.x, l.y, l.r);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      sc.fillStyle = gr;
      sc.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    const g = this.g;
    g.drawImage(shadeCanvas, 0, 0);
    g.globalCompositeOperation = 'lighter';
    for (const l of this.lights) {
      const gr = g.createRadialGradient(l.x, l.y, 1, l.x, l.y, l.r * 0.8);
      gr.addColorStop(0, `rgba(${l.rgb},${(l.a * 0.35).toFixed(3)})`);
      gr.addColorStop(1, `rgba(${l.rgb},0)`);
      g.fillStyle = gr;
      g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    g.globalCompositeOperation = 'source-over';
  }
}

// animation helpers (frame columns on the creature sheets: 0-1 idle, 2-5 walk, 6 windup, 7 attack,
// 8-10 death, 11 cast on the bosses)
const idle = (t, off = 0) => Math.floor(t * 1.6 + off) % 2;
const walk = (t, off = 0) => 2 + (Math.floor(t * 8 + off) % 4);
const heroWalk = (t) => 2 + (Math.floor(t * 9) % 4);
const crownIcon = () => RELIC_IDS.indexOf('first_crown');

// --------------------------------------------------------------------------------------------
// the scenes
// --------------------------------------------------------------------------------------------
const backdrop = new TitleBackdrop();
let keepCanvas = null;

const SCENES = {
  // the Keep on its crag, under the moon (the title's own painting)
  keep(g, t, dt) {
    if (!keepCanvas) {
      keepCanvas = document.createElement('canvas');
      keepCanvas.width = W;
      keepCanvas.height = H;
    }
    backdrop.draw(keepCanvas.getContext('2d'), t, dt);
    g.drawImage(keepCanvas, 80, 60, PW, PH, 0, 0, PW, PH);
  },

  // the First King's tomb: King Varick lifts the crown from the skull
  tomb(g, t, dt, f, whisper = false) {
    const s = new Stage(g, t, 10 + t * 3);
    s.wall('catacombs');
    s.floor('catacombs', 56, 7);
    s.candles(150, 150);
    s.candles(330, 150);
    s.sprite('chapel_altar', 0, 0, 240, 150);
    // the crown, floating up off the skull, whispering
    const bob = Math.sin(t * 2) * 2;
    s.icon('relics', crownIcon(), 240, 104 + bob - Math.min(12, t * 3));
    s.light(240, 100, whisper ? 150 : 90, '176,110,255', whisper ? 0.9 : 0.55);
    // Varick, reaching for it
    s.sprite('madking1', whisper ? 6 : 11, 0, 182, 176);
    s.motes('rgba(200,180,255,0.5)', 18, -4);
    s.shade(whisper ? 0.72 : 0.6);
  },
  whisper(g, t, dt, f) {
    SCENES.tomb(g, t, dt, f, true);
  },

  // the procession: the king's people led down the cells in chains
  procession(g, t) {
    const s = new Stage(g, t, t * 22); // the camera walks with them
    s.wall('cells');
    s.floor('cells', 56, 3);
    for (let x = 60; x < 1100; x += 180) s.torch(x, 24);
    const lead = 330 + t * 22;
    s.sprite('gaoler', walk(t), 0, lead, 150);
    s.light(lead + 10, 128, 70, '255,170,90', 0.4); // his lantern
    // the five, chained in a line (the same people you can free, deep below)
    for (let i = 0; i < 5; i++) {
      const x = lead - 40 - i * 34;
      const bob = Math.floor(t * 4 + i) % 2;
      s.sprite('npcs', i * 2 + bob, 0, x, 152);
      g.fillStyle = '#8a8a96';
      g.fillRect(Math.round(x + 8 + s.ox), 132, 26, 1); // the chain to the next
    }
    s.sprite('gaoler', walk(t, 2), 0, lead - 40 - 5 * 34, 150);
    s.motes('rgba(220,200,160,0.35)', 20, -2);
    s.shade(0.55);
  },

  // Beatrix, long ago, going down after her king with a single candle
  beatrix(g, t) {
    const s = new Stage(g, t, 40 - t * 3);
    s.wall('cells');
    s.floor('cells', 56, 11);
    const x = 400 - t * 14;
    s.sprite('beatrix', 2 + (Math.floor(t * 4) % 4), 0, x, 160, true);
    s.light(x - 14, 120, 80, '255,210,150', 0.6); // her candle
    g.fillStyle = '#f0e8d0';
    g.fillRect(Math.round(x - 15 + s.ox), 122, 2, 4);
    s.shade(0.82);
  },

  // the hero at the Gatehouse, at the top of the stair down
  hero(g, t, dt, f, last = false) {
    const s = new Stage(g, t, 0);
    s.wall('gatehouse');
    s.floor('gatehouse', 56, 5);
    s.brazier(70, 120);
    s.brazier(410, 120);
    s.sprite('stairway', 7, 0, 300, 196);
    s.light(300, 186, 60, '176,110,255', 0.3 + 0.15 * Math.sin(t * 2)); // something glows far below
    const id = f.hero || 'wren';
    if (last) s.hero(id, idle(t), 1, 300, 150); // looking down the stair
    else {
      const x = Math.min(250, 120 + t * 30);
      s.hero(id, x < 250 ? heroWalk(t) : idle(t), x < 250 ? 2 : 0, x, 150);
    }
    s.shade(0.45, '10,6,4');
  },
  heroLast(g, t, dt, f) {
    SCENES.hero(g, t, dt, f, true);
  },

  // the catacombs: the dead of a hundred kings, getting up
  catacombs(g, t, dt, f, whisper = false) {
    const s = new Stage(g, t, t * 3);
    s.wall('catacombs');
    s.floor('catacombs', 56, 21);
    s.candles(60, 110);
    s.candles(420, 110);
    for (let i = 0; i < 4; i++) {
      const x = 110 + i * 85;
      const k = t * 1.2 - i * 0.6;
      // rising: the death frames backwards, then standing
      const col = k < 0 ? 10 : k < 1.5 ? 10 - Math.floor(k * 2) : idle(t, i);
      s.sprite('skeleton', col, whisper ? 1 : 0, x, 170 + (i % 2) * 14, false);
    }
    if (whisper) s.light(240, 120, 300, '150,90,240', 0.35);
    s.motes('rgba(220,210,170,0.35)', 22, -3);
    s.shade(whisper ? 0.7 : 0.58);
  },
  catacombsWhisper(g, t, dt, f) {
    SCENES.catacombs(g, t, dt, f, true);
  },

  // the Hollow: the lost queen's garden, grown wild in the dark
  hollow(g, t, dt, f, whisper = false) {
    const s = new Stage(g, t, t * 4);
    s.wall('hollow');
    s.floor('hollow', 56, 31);
    s.sprite('treant', idle(t), 0, 120, 176);
    s.sprite('treant', idle(t, 1), 1, 380, 168);
    s.sprite('thornling', walk(t), 0, 60 + ((t * 20) % 420), 196);
    s.sprite('puffcap', idle(t, 0.5), 0, 250, 150);
    s.light(250, 136, 90, '120,220,140', 0.45);
    if (whisper) s.light(240, 110, 300, '150,90,240', 0.3);
    s.motes('rgba(150,240,170,0.55)', 40, -5);
    s.shade(whisper ? 0.72 : 0.62);
  },
  hollowWhisper(g, t, dt, f) {
    SCENES.hollow(g, t, dt, f, true);
  },

  // the Burning Halls: fire that never goes out, and the king's knights still on watch
  halls(g, t, dt, f, whisper = false) {
    const s = new Stage(g, t, t * 4);
    s.wall('halls');
    s.floor('halls', 56, 41);
    for (let x = 40; x < 700; x += 200) s.brazier(x, 112);
    s.sprite('war_banner', 0, 0, 140, 104);
    s.sprite('war_banner', 0, 0, 340, 104);
    s.sprite('blackknight', walk(t), 0, -20 + ((t * 18) % 520), 178);
    s.sprite('bannerman', idle(t), 1, 400, 196);
    if (whisper) s.light(240, 110, 300, '150,90,240', 0.3);
    s.motes('rgba(255,170,90,0.7)', 30, -14);
    s.shade(whisper ? 0.6 : 0.48, '10,4,2');
  },
  hallsWhisper(g, t, dt, f) {
    SCENES.halls(g, t, dt, f, true);
  },

  // the throne: Varick at the bottom of everything
  throne(g, t, dt, f, whisper = false) {
    const s = new Stage(g, t, 0);
    s.wall('halls');
    s.floor('halls', 56, 51);
    s.brazier(120, 120);
    s.brazier(360, 120);
    s.sprite('war_banner', 0, 0, 60, 104);
    s.sprite('war_banner', 0, 0, 420, 104);
    s.sprite('madking1', whisper ? 11 : idle(t), 0, 240, 170);
    s.light(240, 100, whisper ? 200 : 110, '176,110,255', whisper ? 0.8 : 0.45);
    s.shade(0.62, '8,2,6');
  },
  throneWhisper(g, t, dt, f) {
    SCENES.throne(g, t, dt, f, true);
  },

  // the Forgotten Vault: the Keeper, and three seals
  vault(g, t) {
    const s = new Stage(g, t, 0);
    s.wall('catacombs');
    s.floor('catacombs', 56, 61);
    s.sprite('keeper', idle(t), 0, 240, 170);
    for (let i = 0; i < 3; i++) {
      const a = t * 0.8 + (i * Math.PI * 2) / 3;
      const x = 240 + Math.cos(a) * 90;
      const y = 120 + Math.sin(a) * 22;
      s.icon('curios', CURIO_FRAME.seal(i), x, y);
      s.light(x, y, 50, ['230,220,180', '255,150,70', '120,220,120'][i], 0.5);
    }
    s.shade(0.7);
  },

  // the secret realms
  cistern(g, t) {
    const s = new Stage(g, t, t * 3);
    s.wall('cistern');
    s.floor('cistern', 56, 71);
    s.torch(100, 24);
    s.torch(380, 24);
    s.sprite('drowned', walk(t), 0, 60 + ((t * 12) % 300), 140);
    s.water(150);
    s.sprite('leviathan', idle(t), 1, 380, 236); // rising out of the black water
    s.sprite('eel', idle(t, 1), 0, 160, 212);
    s.light(380, 170, 70, '200,255,100', 0.3);
    s.shade(0.68, '2,8,12');
  },
  chapel(g, t) {
    const s = new Stage(g, t, 0);
    s.wall('chapel');
    s.floor('chapel', 56, 81);
    s.sprite('chapel_altar', 0, 0, 240, 120);
    s.candles(170, 120);
    s.candles(310, 120);
    s.sprite('nun', idle(t), 0, 120, 186);
    s.sprite('nun', idle(t, 1), 1, 360, 186);
    s.sprite('acolyte', walk(t), 0, 80 + ((t * 14) % 320), 206);
    s.light(240, 100, 140, '190,120,255', 0.5);
    s.shade(0.7, '6,2,10');
  },
  forge(g, t) {
    const s = new Stage(g, t, t * 2);
    s.wall('forge');
    s.floor('forge', 56, 91);
    s.sprite('anvil', 0, 0, 240, 150);
    s.light(240, 110, 220, '255,140,50', 0.75);
    s.sprite('anvilknight', idle(t), 0, 160, 176);
    for (let i = 0; i < 3; i++) {
      const hop = Math.abs(Math.sin(t * 4 + i)) * 10;
      s.sprite('bellows', idle(t, i), i % 2, 320 + i * 40, 190 - hop);
    }
    s.motes('rgba(255,180,90,0.8)', 36, -18);
    s.shade(0.5, '10,3,1');
  },

  // the endings
  kingFalls(g, t) {
    const s = new Stage(g, t, 0);
    s.wall('halls');
    s.floor('halls', 56, 101);
    s.brazier(80, 120);
    s.brazier(400, 120);
    s.sprite('madking3', Math.min(10, 8 + Math.floor(t * 1.4)), 0, 200, 170);
    // the crown rolls away and lies whispering
    const x = Math.min(330, 220 + t * 40);
    s.icon('relics', crownIcon(), x, 160 - Math.abs(Math.sin(Math.min(t, 2.75) * 4)) * 6);
    s.light(x, 160, 70, '176,110,255', 0.6);
    s.shade(0.6);
  },
  crownBreaks(g, t) {
    const s = new Stage(g, t, 0);
    s.wall('halls');
    s.floor('halls', 56, 111);
    s.sprite('crownwraith', Math.min(10, 8 + Math.floor(t * 1.4)), 0, 240, 170);
    const flash = Math.max(0, 1 - t * 0.6) * (VISUAL.calm ? 0.3 : 1);
    s.light(240, 120, 260, '255,240,200', 0.4 + flash * 0.6);
    s.motes('rgba(255,240,200,0.8)', 40, -20);
    s.shade(0.55 - flash * 0.4);
  },
  dawn(g, t, dt, f) {
    const s = new Stage(g, t, 0);
    s.wall('gatehouse');
    s.floor('gatehouse', 56, 121);
    // the five, home at last, and the hero among them
    for (let i = 0; i < 5; i++) s.sprite('npcs', i * 2 + idle(t, i), 0, 90 + i * 70 + (i > 1 ? 40 : 0), 160 + (i % 2) * 10);
    s.hero(f.hero || 'wren', idle(t), 0, 270, 168);
    // light pouring down from above
    s.light(240, 0, 340, '255,220,160', 0.9);
    s.motes('rgba(255,240,200,0.6)', 30, 4);
    s.shade(0.25, '20,12,6');
  },
};

// Close-ups: some scenes are shown at 2x (the same pixels, nearer), centred on what matters.
// [zoom, focus x (t) , focus y]
const CLOSE = {
  tomb: [2, () => 220, 132],
  whisper: [2, () => 236, 118],
  beatrix: [2, (t) => 360 - 11 * t, 128],
  hero: [2, () => 255, 150],
  heroLast: [2, () => 300, 160],
  catacombsWhisper: [2, () => 250, 150],
  hollowWhisper: [2, () => 200, 140],
  hallsWhisper: [2, () => 240, 140],
  throne: [2, () => 240, 132],
  throneWhisper: [2, () => 240, 120],
  kingFalls: [2, () => 255, 140],
  crownBreaks: [2, () => 240, 132],
};

// --------------------------------------------------------------------------------------------
// the words
// --------------------------------------------------------------------------------------------
const HERO_LINES = {
  wren: 'Wren laughed at the wrong king, and was thrown below for it. Now he goes further down - to unmake the crown that called it treason.',
  ranger: 'The royal forest is dying from the roots up. Rowan followed the rot down through the cells. Whatever is eating the trees lives below.',
  ironknight: 'Sir Aldwin swore an oath to guard the king. Tonight he breaks it, one step at a time, all the way to the bottom.',
  knight: "Maud's lord went down into the Burning Halls and never came back. She carries his sword the rest of the way.",
  witch: 'They burned the queen for a witch. Her garden is still growing in the dark below, and it is calling Agnes home.',
  ghost: 'The Nameless died in the cells, and did not stop. Death was only the first door. There are more, further down.',
};

const crown = (scene, text) => ({ scene, text, color: CROWN, voice: 'THE CROWN' });

export const CUTSCENES = {
  intro: (hero) => [
    { scene: 'keep', text: 'For three hundred years the Keep of Hollowmere stood over its valley. Beneath it, behind an iron door, slept the Hollow.' },
    { scene: 'tomb', text: "King Varick dug for silver. He found the First King's tomb instead - and on the skull inside, a crown of black iron." },
    crown('whisper', 'TAKE ME HOME. DOWN. TO THE DOOR I WAS MADE TO LOCK.'),
    { scene: 'procession', text: 'So the king sent his people down to dig: a smith, a quartermaster, a sister of the chapel, a mapmaker, an old archivist. Hundreds more.' },
    { scene: 'beatrix', text: 'His bride Beatrix went after him with a single candle. None of them came back up.' },
    { scene: 'hero', text: HERO_LINES[hero] || HERO_LINES.wren, hero },
    { scene: 'heroLast', text: 'Now the Keep is sinking into the dark it woke. Some of the lost may still be alive. The only way out is down.', hero },
  ],
  catacombs: () => [
    { scene: 'catacombs', text: 'Below the cells lie the dead of a hundred kings. Something has taught them to stand.' },
    crown('catacombsWhisper', 'THEY SERVED THE FIRST KING. NOW THEY SERVE ME. SO WILL YOU.'),
  ],
  hollow: () => [
    { scene: 'hollow', text: "Deeper still grows the burned queen's garden: a forest that has never seen the sun. It is hungry." },
    crown('hollowWhisper', 'SHE HEARD ME TOO. SHE LISTENED. LOOK HOW SHE BLOOMS.'),
  ],
  halls: () => [
    { scene: 'halls', text: "The old halls burn and never burn out. The king's knights still keep their watch, long after they stopped being men." },
    crown('hallsWhisper', 'YOU ARE CLOSE NOW. CLOSER THAN HE EVER WAS. PUT ME ON.'),
  ],
  throne: () => [
    { scene: 'throne', text: 'At the bottom of the Keep sits King Varick, wearing what is left of himself - and the crown wearing him.' },
    crown('throneWhisper', 'KNEEL, OR TAKE HIS PLACE. EITHER WAY, I GO HOME.'),
  ],
  vault: () => [{ scene: 'vault', text: 'A vault no king remembers, sealed with bone, flame and thorn. The First King hid the way to break his crown here.' }],
  cistern: () => [{ scene: 'cistern', text: 'Under the cells, a cistern no one remembers digging. The water is black, and it is not still.' }],
  chapel: () => [{ scene: 'chapel', text: 'A chapel built for a god that never answered. Something else did, and its sisters kept the faith.' }],
  forge: () => [{ scene: 'forge', text: "Here the First King forged the Keep's iron, and his own crown. The fire was never put out." }],
  // Stalked: who she is
  beatrix: () => [
    { scene: 'beatrix', text: 'Beatrix went down to find her king. She has been looking ever since, in the dark, with her candle long gone out.' },
    { scene: 'beatrix', text: 'VARICK...? IS THAT YOU...?', color: BEATRIX_VOICE, voice: 'BEATRIX' },
  ],
  // the endings
  endKing: () => [
    { scene: 'kingFalls', text: 'Varick falls. For a moment the whisper stops, and the Keep is very quiet.' },
    crown('kingFalls', 'ANOTHER WILL COME. ANOTHER ALWAYS COMES.'),
    { scene: 'kingFalls', text: 'The crown endures. They say three seals, hidden in the deep, could break it for good.' },
  ],
  endCrown: () => [
    { scene: 'crownBreaks', text: "The Hollow Crown breaks. Three hundred years of whispering end in a sound like a bell cracking." },
    { scene: 'crownBreaks', text: 'The Deep Door stays shut. Far above, the Keep stops sinking.' },
    { scene: 'dawn', text: 'And the people of Hollowmere climb up out of the dark, into the first dawn in years.' },
  ],
};

export class Cutscene {
  /** id: a key of CUTSCENES; hero: the character id (for the intro). onDone: called when it ends. */
  constructor(id, hero, onDone) {
    this.panels = CUTSCENES[id](hero);
    this.i = 0;
    this.t = 0; // time on this panel
    this.time = 0;
    this.sceneT = 0; // a scene keeps playing across consecutive lines
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
    return Math.floor(this.t * 40);
  }

  /** A key or tap: finish typing the line, or move to the next panel. */
  advance() {
    if (this.done) return;
    if (this.shown < this.panel.text.length) {
      this.t = this.panel.text.length / 40 + 0.01;
      return;
    }
    this.next();
  }

  next() {
    const was = this.panel && this.panel.scene;
    this.i++;
    this.t = 0;
    if (this.panel && this.panel.scene !== was) this.sceneT = 0;
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
    this.sceneT += dt;
    this.time += dt;
    // a panel moves on by itself once its line has been up for a while
    if (this.t > this.panel.text.length / 40 + 4.5) this.next();
  }

  draw(ctx, dt) {
    if (this.done) return;
    const p = this.panel;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);
    // the scene (the same panel keeps its own clock, so a scene continues across its lines)
    const g = this.canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, PW, PH);
    SCENES[p.scene](g, this.sceneT + 0.0001, dt, { hero: p.hero || this.hero });
    const fadeIn = Math.min(1, this.sceneT * 2.2);
    ctx.globalAlpha = fadeIn;
    const close = CLOSE[p.scene];
    if (close) {
      // a close-up: the middle of the scene at 2x, crisp
      const [z, fx, fy] = close;
      const vw = PW / z;
      const vh = PH / z;
      const sx = Math.round(Math.max(0, Math.min(PW - vw, fx(this.sceneT) - vw / 2)));
      const sy = Math.round(Math.max(0, Math.min(PH - vh, fy - vh / 2)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.canvas, sx, sy, vw, vh, PX, PY, PW, PH);
    } else ctx.drawImage(this.canvas, PX, PY);
    ctx.globalAlpha = 1;
    // a frame of dark iron around the picture
    ctx.fillStyle = '#2a2a32';
    ctx.fillRect(PX - 4, PY - 4, PW + 8, 4);
    ctx.fillRect(PX - 4, PY + PH, PW + 8, 4);
    ctx.fillRect(PX - 4, PY, 4, PH);
    ctx.fillRect(PX + PW, PY, 4, PH);
    ctx.fillStyle = '#5a5a66';
    ctx.fillRect(PX - 4, PY - 4, PW + 8, 1);
    // the words, typed out (a voice speaks in its own colour)
    let y = PY + PH + 16;
    if (p.voice) {
      drawText(ctx, p.voice, W / 2, y, p.color, { align: 'center' });
      y += 12;
    }
    const text = p.text.slice(0, this.shown);
    const lines = wrapWords(text, 70);
    lines.forEach((l, k) => drawText(ctx, l.toUpperCase(), W / 2, y + k * 12, p.color || '#e8e0d0', { align: 'center' }));
    // progress pips and the hint
    for (let k = 0; k < this.panels.length; k++) {
      ctx.fillStyle = k === this.i ? '#e8c46c' : '#3a3640';
      ctx.fillRect(W / 2 - this.panels.length * 5 + k * 10, H - 22, 6, 3);
    }
    if (Math.floor(this.time * 2) % 2 === 0) drawText(ctx, 'ANY KEY - NEXT      ESC - SKIP', W / 2, H - 13, '#5d606c', { align: 'center' });
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
