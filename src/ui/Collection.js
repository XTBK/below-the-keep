import { quality, QUALITY_NAMES } from '../data/quality.js';
import { drawText } from './PixelFont.js';
import { RENDER } from '../data/config.js';
import { RELICS, RELIC_IDS } from '../data/items.js';
import { TRINKETS, TRINKET_IDS, SCROLLS, SCROLL_IDS, POTIONS, POTION_IDS, SEALS, PAGES, CURIO_FRAME } from '../data/curios.js';
import { CHARACTERS, CHARACTER_IDS } from '../data/characters.js';
import { getSheet, buildWrenSheet } from '../render/Assets.js';
import { Save } from '../core/Save.js';

// The collection page (C on the title screen): every relic and curio you've found, the journal
// pages you've read, and the characters. Things you haven't found yet show as dark shapes.

const GOLD = '#e2c46c';
const INK = '#d8d0c0';
const DIM = '#8a8478';
const FAINT = '#55514a';

function seen(key) {
  return Save.data.unlocks.itemsSeen.includes(key);
}

// the curios page, in order
const CURIO_LIST = [
  ...TRINKET_IDS.map((id) => ({ key: 'trinket:' + id, def: TRINKETS[id], frame: CURIO_FRAME.trinket(id) })),
  ...SCROLL_IDS.map((id) => ({ key: 'scroll:' + id, def: SCROLLS[id], frame: CURIO_FRAME.scroll(id) })),
  ...POTION_IDS.map((id, i) => ({ key: 'potion:' + id, def: POTIONS[id], frame: CURIO_FRAME.potion(i) })),
  ...SEALS.map((s, i) => ({ key: 'seal:' + i, def: s, frame: CURIO_FRAME.seal(i) })),
];

export const COLLECTION_TABS = [
  { name: 'RELICS', cols: 20, count: () => RELIC_IDS.length },
  { name: 'CURIOS', cols: 10, count: () => CURIO_LIST.length },
  { name: 'JOURNAL', cols: 1, count: () => PAGES.length },
  { name: 'CHARACTERS AND DEEDS', cols: 4, count: () => CHARACTER_IDS.length },
];

/** Split text into lines of at most `max` characters (the pixel font is 6px per character). */
export function wrap(text, max) {
  const out = [];
  let line = '';
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > max) {
      out.push(line);
      line = w;
    } else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

// characters drawn standing, facing you (cached sheets)
const previews = new Map();
export function characterPreview(id) {
  if (!previews.has(id)) {
    const c = CHARACTERS[id];
    previews.set(id, buildWrenSheet(c.looks, c.recolor || null).color);
  }
  return previews.get(id);
}

/** Draw a 32 x 32 character (idle, facing down) at (x, y); locked ones are a black shape. */
export function drawCharacter(ctx, id, x, y, scale = 2, locked = false) {
  const sheet = characterPreview(id);
  const w = 32 * scale;
  if (!locked) {
    ctx.drawImage(sheet, 0, 0, 32, 32, x, y, w, w);
    return;
  }
  ctx.drawImage(darkShape(sheet, 0, 32), 0, 0, 32, 32, x, y, w, w); // a black shape
}

// dark shapes for things not found yet, made once and kept (per sheet, per frame)
const shapes = new WeakMap();
function darkShape(src, sx, w) {
  if (!shapes.has(src)) shapes.set(src, new Map());
  const cache = shapes.get(src);
  const key = sx + ':' + w;
  if (!cache.has(key)) {
    const c = document.createElement('canvas');
    c.width = c.height = w;
    const t = c.getContext('2d');
    t.drawImage(src, sx, 0, w, w, 0, 0, w, w);
    t.globalCompositeOperation = 'source-in';
    t.fillStyle = '#1c1a22';
    t.fillRect(0, 0, w, w);
    cache.set(key, c);
  }
  return cache.get(key);
}

function icon(ctx, sheetKey, frame, x, y, known) {
  const s = getSheet(sheetKey).colorCanvas;
  if (known) ctx.drawImage(s, frame * 16, 0, 16, 16, x, y, 16, 16);
  else ctx.drawImage(darkShape(s, frame * 16, 16), x, y);
}

function grid(ctx, items, cols, cursor, x0, y0) {
  items.forEach((it, i) => {
    const x = x0 + (i % cols) * 22;
    const y = y0 + Math.floor(i / cols) * 22;
    if (i === cursor) {
      ctx.strokeStyle = GOLD;
      ctx.strokeRect(x - 2.5, y - 2.5, 21, 21);
    }
    icon(ctx, it.sheet, it.frame, x, y, it.known);
  });
}

function describe(ctx, name, flavour, y) {
  const W = RENDER.width;
  drawText(ctx, name, W / 2, y, GOLD, { align: 'center' });
  wrap(flavour, 90).forEach((l, i) => drawText(ctx, l, W / 2, y + 12 + i * 10, DIM, { align: 'center' }));
}

export function drawCollection(ctx, state) {
  const W = RENDER.width;
  const H = RENDER.height;
  const c = state.collection;
  const tab = COLLECTION_TABS[c.tab];
  ctx.fillStyle = 'rgba(6,5,8,0.92)';
  ctx.fillRect(0, 0, W, H);
  drawText(ctx, 'COLLECTION', W / 2, 14, GOLD, { scale: 2, align: 'center' });
  // the tabs
  const tw = 128;
  COLLECTION_TABS.forEach((t, i) => {
    const x = W / 2 + (i - (COLLECTION_TABS.length - 1) / 2) * tw;
    drawText(ctx, t.name, x, 36, i === c.tab ? INK : FAINT, { align: 'center' });
    if (i === c.tab) {
      ctx.fillStyle = GOLD;
      ctx.fillRect(x - 30, 46, 60, 1);
    }
  });

  if (tab.name === 'RELICS') {
    const items = RELIC_IDS.map((id, i) => ({ sheet: 'relics', frame: i, known: seen(id) }));
    const found = items.filter((i) => i.known).length;
    const x0 = Math.round((W - tab.cols * 22) / 2);
    grid(ctx, items, tab.cols, c.cursor, x0, 60);
    drawText(ctx, `FOUND ${found} OF ${items.length}`, W / 2, 182, FAINT, { align: 'center' });
    const id = RELIC_IDS[c.cursor];
    if (seen(id)) {
      describe(ctx, RELICS[id].name.toUpperCase(), RELICS[id].flavour, 204);
      const q = quality(id);
      drawText(ctx, QUALITY_NAMES[q], W / 2, 194, ['', '#a8a090', '#7ac07a', '#6aa8f0', '#e8b040'][q], { align: 'center' });
    }
    else describe(ctx, '???', 'Not found yet.', 204);
  } else if (tab.name === 'CURIOS') {
    const items = CURIO_LIST.map((it) => ({ sheet: 'curios', frame: it.frame, known: seen(it.key) }));
    const x0 = Math.round((W - tab.cols * 22) / 2);
    grid(ctx, items, tab.cols, c.cursor, x0, 60);
    const labels = ['TRINKETS', 'SCROLLS', 'POTIONS', 'SEALS'];
    labels.forEach((l, i) => drawText(ctx, l, x0 - 8, 64 + i * 22, FAINT, { align: 'right' }));
    const it = CURIO_LIST[c.cursor];
    if (seen(it.key)) describe(ctx, it.def.name.toUpperCase(), it.def.flavour, 170);
    else describe(ctx, '???', it.key.startsWith('potion') ? 'Drink it to learn what it is.' : 'Not found yet.', 170);
  } else if (tab.name === 'JOURNAL') {
    const read = Save.data.unlocks.pages;
    PAGES.forEach((pg, i) => {
      const y = 58 + i * 11;
      const has = read.includes(i);
      drawText(ctx, (i === c.cursor ? '> ' : '  ') + pg.title.toUpperCase(), 40, y, i === c.cursor ? GOLD : has ? INK : FAINT);
    });
    const pg = PAGES[c.cursor];
    const has = read.includes(c.cursor);
    const lines = has ? wrap(pg.text.toUpperCase(), 64) : ['THIS PAGE IS STILL SOMEWHERE IN THE DARK.'];
    ctx.fillStyle = 'rgba(40,32,22,0.5)';
    ctx.fillRect(176, 56, 424, 150);
    lines.forEach((l, i) => drawText(ctx, l, 188, 66 + i * 12, has ? '#e8dcc0' : FAINT));
    drawText(ctx, `PAGES FOUND ${read.length} OF ${PAGES.length}`, W / 2, 222, FAINT, { align: 'center' });
  } else {
    const unlocked = Save.data.unlocks.characters;
    CHARACTER_IDS.forEach((id, i) => {
      const x = W / 2 + (i - (CHARACTER_IDS.length - 1) / 2) * 96 - 32;
      const locked = !unlocked.includes(id);
      if (i === c.cursor) {
        ctx.strokeStyle = GOLD;
        ctx.strokeRect(x - 4.5, 55.5, 73, 73);
      }
      drawCharacter(ctx, id, x, 60, 2, locked);
      drawText(ctx, locked ? '???' : CHARACTERS[id].name.toUpperCase(), x + 32, 134, locked ? FAINT : INK, { align: 'center' });
    });
    const ch = CHARACTERS[CHARACTER_IDS[c.cursor]];
    if (unlocked.includes(CHARACTER_IDS[c.cursor])) describe(ctx, ch.title.toUpperCase(), ch.flavour, 152);
    else describe(ctx, 'LOCKED', ch.unlock, 152);
    const st = Save.data.stats;
    const lines = [
      `RUNS ${st.runsStarted}   VICTORIES ${st.victories}   DEATHS ${st.deaths}   BOSSES SLAIN ${st.bossesBeaten}`,
      `SECRETS FOUND ${st.secretsFound}   SEALS FOUND ${st.sealsFound}   STONES THROWN ${st.stonesThrown}   TIME BELOW ${Math.floor(st.playSeconds / 60)} MIN`,
    ];
    lines.forEach((l, i) => drawText(ctx, l, W / 2, 196 + i * 12, DIM, { align: 'center' }));
  }

  const touch = state.input.touchMode;
  drawText(ctx, touch ? 'TAP FOR THE NEXT PAGE' : 'ARROWS  BROWSE      TAB  NEXT PAGE      ESC  BACK', W / 2, H - 22, FAINT, { align: 'center' });
}
