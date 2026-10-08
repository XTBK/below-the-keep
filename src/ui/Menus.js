import { RENDER } from '../data/config.js';
import { drawText, textWidth } from './PixelFont.js';
import { Save } from '../core/Save.js';
import { settingsOf, setSetting, applySettings } from '../data/settings.js';
import { OATHS, OATH_IDS, MAX_HEAT, heatOf } from '../data/oaths.js';
import { CHARACTERS } from '../data/characters.js';
import { daily } from '../core/Daily.js';

// Every menu in the game: the title menu, pause, settings, controls, oaths, the Daily Descent and
// yes/no questions. A screen is a list of items; the cursor moves with W/S, the arrows or the d-pad,
// Enter / A chooses, A/D or left/right change a slider or switch, Esc / B goes back. Taps work too.
//
// An item: { label, value?: () => text, action?: () => void, adjust?: (dir) => void,
//            disabled?: bool, note?: text shown under the list when it's selected }

const W = RENDER.width;
const H = RENDER.height;
export const MENU_COLORS = { gold: '#e8c46c', ink: '#e8e0d0', dim: '#8a8478', faint: '#5d606c', red: '#c02634' };
const C = MENU_COLORS;


export class Menus {
  constructor(game) {
    this.game = game;
    this.stack = [];
    this.rows = []; // hit boxes from the last draw, for taps
    this.flash = 0;
  }

  get top() {
    return this.stack[this.stack.length - 1] || null;
  }

  open(id, extra = {}) {
    this.stack.push({ id, cursor: 0, ...extra });
    this._fixCursor(1);
    this.game.hud.markDirty();
  }

  close() {
    this.stack.pop();
    this.game.hud.markDirty();
  }

  reset(id) {
    this.stack = [];
    if (id) this.open(id);
  }

  items() {
    const t = this.top;
    return t ? SCREENS[t.id].items(this.game, this, t) : [];
  }

  _fixCursor(dir) {
    const t = this.top;
    const items = this.items();
    if (!t || !items.length) return;
    t.cursor = Math.max(0, Math.min(items.length - 1, t.cursor));
    for (let i = 0; i < items.length && items[t.cursor].disabled && !items[t.cursor].selectable; i++) t.cursor = (t.cursor + dir + items.length) % items.length;
  }

  move(dir) {
    const t = this.top;
    const items = this.items();
    if (!t || !items.length) return;
    let c = t.cursor;
    for (let i = 0; i < items.length; i++) {
      c = (c + dir + items.length) % items.length;
      if (!items[c].disabled || items[c].selectable) break;
    }
    t.cursor = c;
    this.game.audio.play('menuMove');
    this.game.hud.markDirty();
  }

  choose() {
    const item = this.items()[this.top.cursor];
    if (!item) return;
    if (item.disabled || !item.action) {
      if (item.adjust) return this.adjust(1);
      this.game.audio.play('deny', 0.6);
      return;
    }
    this.game.audio.play('menuChoose');
    this.flash = 0.15;
    item.action();
    this.game.hud.markDirty();
  }

  adjust(dir) {
    const item = this.items()[this.top.cursor];
    if (!item || !item.adjust || item.disabled) return;
    item.adjust(dir);
    this.game.audio.play('menuMove');
    this.game.hud.markDirty();
  }

  back() {
    const s = SCREENS[this.top.id];
    this.game.audio.play('menuBack');
    if (s.back) s.back(this.game, this);
    else if (this.stack.length > 1) this.close();
  }

  /** Keyboard / gamepad. Returns true if a menu is open (so the game ignores the input). */
  handle(input) {
    if (!this.top) return false;
    const p = (a) => input.pressed(a);
    if (p('up') || p('shootUp')) this.move(-1);
    if (p('down') || p('shootDown')) this.move(1);
    if (p('left') || p('shootLeft')) this.adjust(-1);
    if (p('right') || p('shootRight')) this.adjust(1);
    if (p('confirm')) this.choose();
    else if (p('pause') || p('dodge')) this.back();
    return true;
  }

  /** The mouse moved over (fx, fy): point at that row. */
  hover(fx, fy) {
    const x = fx * W;
    const y = fy * H;
    for (const r of this.rows) {
      if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) continue;
      if (this.top.cursor !== r.i) {
        const it = this.items()[r.i];
        if (it && (!it.disabled || it.selectable)) {
          this.top.cursor = r.i;
          this.game.audio.play('menuMove', 0.6);
          this.game.hud.markDirty();
        }
      }
      return;
    }
  }

  /** A tap at (fx, fy) in 0..1 screen space. */
  tap(fx, fy) {
    const x = fx * W;
    const y = fy * H;
    for (const r of this.rows) {
      if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) continue;
      this.top.cursor = r.i;
      const item = this.items()[r.i];
      if (item && item.adjust && !item.action) this.adjust(x < (r.x0 + r.x1) / 2 ? -1 : 1);
      else this.choose();
      return true;
    }
    return false;
  }

  /**
   * Draw a list of items. Used by every screen (the title draws its list over the castle).
   * opts: { x, y, align: 'left'|'center', width, gap, scale }
   */
  drawList(ctx, time, opts) {
    const items = this.items();
    const t = this.top;
    const gap = opts.gap || 16;
    const scale = opts.scale || 1;
    const align = opts.align || 'left';
    this.rows = [];
    items.forEach((item, i) => {
      const y = opts.y + i * gap;
      if (item.spacer) return;
      const sel = i === t.cursor;
      const color = item.disabled ? C.faint : sel ? C.gold : item.color || C.ink;
      const label = item.label;
      let x = opts.x;
      const lw = textWidth(label, scale);
      if (align === 'center') x = Math.round(opts.x - lw / 2);
      // the selected row: a dark band and two little flames
      if (sel) {
        const bx0 = (align === 'center' ? x : opts.x) - 14;
        const bw = opts.width || lw + 28;
        const bandX = align === 'center' ? Math.round(opts.x - bw / 2) : bx0;
        ctx.fillStyle = 'rgba(120,40,16,0.28)';
        ctx.fillRect(bandX, y - 3, bw, 7 * scale + 6);
        ctx.fillStyle = 'rgba(232,196,108,0.5)';
        ctx.fillRect(bandX, y - 3, 1, 7 * scale + 6);
        drawFlame(ctx, (align === 'center' ? x : opts.x) - 12, y + Math.floor(3 * scale), time);
        if (align === 'center') drawFlame(ctx, x + lw + 6, y + Math.floor(3 * scale), time + 1.3);
      }
      drawText(ctx, label, x, y, color, { scale });
      if (item.slider) {
        // ten pips, lit up to the value
        const n = item.slider();
        const vx = opts.x + (opts.valueX || 150);
        if (sel) drawText(ctx, '<', vx - 10, y, C.gold, { scale });
        for (let k = 0; k < 10; k++) {
          ctx.fillStyle = k < n ? (sel ? '#e8c46c' : '#a89870') : '#2a2630';
          ctx.fillRect(vx + k * 8, y, 6, 7);
          if (k < n) {
            ctx.fillStyle = sel ? '#fff4c8' : '#c8b890';
            ctx.fillRect(vx + k * 8, y, 6, 1);
          }
        }
        if (sel) drawText(ctx, '>', vx + 84, y, C.gold, { scale });
      }
      if (item.value) {
        const v = item.value();
        const vx = opts.x + (opts.valueX || 150);
        drawText(ctx, item.adjust && sel ? `< ${v} >` : v, vx, y, sel ? C.gold : C.dim, { scale });
      }
      this.rows.push({ i, x0: (align === 'center' ? opts.x - (opts.width || 200) / 2 : opts.x - 16), x1: align === 'center' ? opts.x + (opts.width || 200) / 2 : opts.x + (opts.width || 260), y0: y - 4, y1: y + gap - 4 });
    });
    const sel = items[t.cursor];
    if (sel && sel.note && opts.noteY) {
      const lines = wrap(sel.note, opts.noteWidth || 60);
      lines.forEach((l, k) => drawText(ctx, l, opts.noteX ?? opts.x, opts.noteY + k * 10, C.dim, { align: opts.noteAlign || 'left' }));
    }
  }

  /** Draw the open screen (not the title, which Hud draws over its castle). */
  draw(ctx, time) {
    const t = this.top;
    if (!t) return;
    const s = SCREENS[t.id];
    if (s.draw) s.draw(ctx, this, time, t);
  }
}

// ----------------------------------------------------------------------------------------------
// Drawing helpers
// ----------------------------------------------------------------------------------------------

export function drawFlame(ctx, x, y, time) {
  // a little candle flame that licks side to side
  const f = Math.floor(time * 9) % 4;
  const lean = f === 1 ? 1 : f === 3 ? -1 : 0;
  ctx.fillStyle = '#7a1a08';
  ctx.fillRect(x, y - 1, 5, 4);
  ctx.fillRect(x + 1, y + 3, 3, 1);
  ctx.fillStyle = '#e0541c';
  ctx.fillRect(x + 1 + lean, y - 3, 3, 5);
  ctx.fillRect(x + 2 + lean, y - 5, 1, 2);
  ctx.fillStyle = '#f6a03c';
  ctx.fillRect(x + 1 + lean, y - 1, 3, 3);
  ctx.fillStyle = '#fff0b0';
  ctx.fillRect(x + 2, y, 1, 2);
}

/** A panel of dark stone in an iron frame with rivets. */
export function drawPanel(ctx, x, y, w, h, title) {
  ctx.fillStyle = 'rgba(10,8,12,0.94)';
  ctx.fillRect(x, y, w, h);
  // stone texture: faint mortar lines
  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  for (let yy = y + 10; yy < y + h; yy += 12) ctx.fillRect(x + 3, yy, w - 6, 1);
  for (let yy = y + 4, row = 0; yy < y + h - 4; yy += 12, row++) for (let xx = x + (row % 2 ? 14 : 4); xx < x + w - 4; xx += 24) ctx.fillRect(xx, yy, 1, 6);
  // the iron frame
  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(x, y, w, 3);
  ctx.fillRect(x, y + h - 3, w, 3);
  ctx.fillRect(x, y, 3, h);
  ctx.fillRect(x + w - 3, y, 3, h);
  ctx.fillStyle = '#5a5a66';
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillStyle = '#121216';
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x + w - 1, y, 1, h);
  // rivets at the corners
  for (const [rx, ry] of [[x + 6, y + 6], [x + w - 8, y + 6], [x + 6, y + h - 8], [x + w - 8, y + h - 8]]) {
    ctx.fillStyle = '#6a6a76';
    ctx.fillRect(rx, ry, 2, 2);
    ctx.fillStyle = '#9a9aa6';
    ctx.fillRect(rx, ry, 1, 1);
  }
  if (title) {
    const tw = textWidth(title, 2) + 24;
    const tx = Math.round(x + w / 2 - tw / 2);
    ctx.fillStyle = '#0a080c';
    ctx.fillRect(tx, y - 9, tw, 20);
    ctx.fillStyle = '#5a1a12';
    ctx.fillRect(tx, y - 9, tw, 1);
    ctx.fillRect(tx, y + 10, tw, 1);
    drawText(ctx, title, x + w / 2, y - 5, C.gold, { scale: 2, align: 'center', shadow: '#3a1206' });
  }
}

function wrap(text, n) {
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

function dimBackground(ctx, a = 0.72) {
  ctx.fillStyle = `rgba(4,3,6,${a})`;
  ctx.fillRect(0, 0, W, H);
}

function fmtTime(s) {
  s = Math.floor(s);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

// ----------------------------------------------------------------------------------------------
// The screens
// ----------------------------------------------------------------------------------------------

const settingsItems = (g, menus) => {
  const s = settingsOf(Save);
  const set = (k, v) => {
    setSetting(Save, k, v);
    applySettings(g, Save);
  };
  const slider = (key, label) => ({
    label,
    slider: () => settingsOf(Save)[key],
    adjust: (d) => set(key, Math.max(0, Math.min(10, settingsOf(Save)[key] + d))),
  });
  const toggle = (key, label, note) => ({
    label,
    note,
    value: () => (settingsOf(Save)[key] ? 'ON' : 'OFF'),
    adjust: () => set(key, !settingsOf(Save)[key]),
    action: () => set(key, !settingsOf(Save)[key]),
  });
  return [
    slider('music', 'MUSIC'),
    slider('sound', 'SOUND'),
    { ...slider('shake', 'SCREEN SHAKE'), note: 'How hard the screen shakes when blows land.' },
    toggle('slowmo', 'SLOW-MO ON CRITS', 'A split second of slow motion when a critical hit lands.'),
    toggle('numbers', 'DAMAGE NUMBERS', 'Numbers float up from struck foes.'),
    toggle('story', 'STORY SCENES', 'The tale of the Keep, and a scene at each new place below.'),
    {
      label: 'FULLSCREEN',
      value: () => (document.fullscreenElement ? 'ON' : 'OFF'),
      action: () => {
        try {
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
        } catch {
          // not allowed here
        }
      },
      disabled: !document.fullscreenEnabled,
    },
    { spacer: true, label: '', disabled: true },
    { label: 'BACK', action: () => menus.close() },
  ].map((it) => (s ? it : it));
};

const SCREENS = {
  // the title screen's own menu (drawn by Hud over the castle)
  title: {
    back() {},
    items(g, menus) {
      const won = Save.data.stats.victories > 0;
      const heat = heatOf(Save.data.oaths);
      return [
        { label: 'BEGIN THE DESCENT', action: () => g.beginFromTitle(), note: heat && won ? `SWORN TO ${heat} HEAT.` : null },
        { label: 'DAILY DESCENT', action: () => { daily.fetchBoard(); menus.open('daily'); }, note: 'One seed, one hero, everyone. Climb the board.' },
        won
          ? { label: 'OATHS', action: () => menus.open('oaths'), value: heat ? () => `HEAT ${heat}` : null, note: 'Swear oaths to make the descent harder - and its relics better.' }
          : { label: 'OATHS', disabled: true, selectable: true, note: 'WIN A RUN TO SWEAR OATHS.' },
        { label: 'SEEDED RUN', action: () => g.openSeedEntry(), note: 'Type a seed to play a run again.' },
        { label: 'COLLECTION', action: () => g.openCollection() },
        { label: 'SETTINGS', action: () => menus.open('settings') },
      ];
    },
  },

  pause: {
    back(g) {
      g.setPaused(false);
    },
    items(g, menus) {
      return [
        { label: 'RESUME', action: () => g.setPaused(false) },
        { label: 'SETTINGS', action: () => menus.open('settings') },
        { label: 'CONTROLS', action: () => menus.open('controls') },
        {
          label: 'ABANDON RUN',
          action: () =>
            menus.open('confirm', {
              question: 'ABANDON THIS RUN?',
              detail: 'A new run begins on a new seed.',
              yes: () => {
                g.setPaused(false);
                g.restartRun();
              },
            }),
        },
        {
          label: 'QUIT TO TITLE',
          action: () =>
            menus.open('confirm', {
              question: 'QUIT TO THE TITLE?',
              detail: 'This run will be lost.',
              yes: () => {
                g.setPaused(false);
                g.toTitle();
              },
            }),
        },
      ];
    },
    draw(ctx, menus, time) {
      const g = menus.game;
      dimBackground(ctx, 0.7);
      // left: the menu
      drawPanel(ctx, 40, 52, 220, 150, 'PAUSED');
      menus.drawList(ctx, time, { x: 70, y: 82, gap: 22, scale: 1, width: 200 });
      // right: the run
      drawPanel(ctx, 280, 52, 320, 256, null);
      drawText(ctx, 'THE RUN', 440, 300 - 10, C.faint, { align: 'center' });
      const p = g.player;
      const ch = p.character;
      drawText(ctx, `${ch.name.toUpperCase()}, ${ch.title.toUpperCase()}`, 440, 62, C.gold, { align: 'center' });
      drawText(ctx, g.floorName.toUpperCase(), 440, 74, C.ink, { align: 'center' });
      const st = p.stats;
      const rows = [
        ['DAMAGE', (st.damage * p.damageScale).toFixed(1)],
        ['ATTACKS / SEC', (1 / st.fireDelay).toFixed(1)],
        ['RANGE', Math.round(st.range)],
        ['SHOT SPEED', Math.round(st.shotSpeed)],
        ['SPEED', Math.round(st.moveSpeed)],
        ['LUCK', st.luck.toFixed(1)],
      ];
      rows.forEach(([k, v], i) => {
        const col = i % 2;
        const x = 300 + col * 150;
        const y = 92 + Math.floor(i / 2) * 12;
        drawText(ctx, k, x, y, C.dim);
        drawText(ctx, String(v), x + 130, y, C.ink, { align: 'right' });
      });
      drawText(ctx, `TIME ${fmtTime(g.runTime)}`, 300, 136, C.dim);
      drawText(ctx, `SEED ${g.seed}`, 580, 136, C.dim, { align: 'right' });
      if (g.daily) drawText(ctx, 'THE DAILY DESCENT', 440, 148, '#7ac0e0', { align: 'center' });
      else if (g.heat) drawText(ctx, `SWORN TO ${g.heat} HEAT: ${[...g.oaths].map((o) => OATHS[o].name.replace('Oath of ', '').toUpperCase()).join(', ')}`, 440, 148, '#e07a40', { align: 'center' });
      // relics carried, hovering one names it
      const ids = p.active ? [...p.relics, p.active.id] : p.relics;
      drawText(ctx, `RELICS ${ids.length}`, 300, 162, C.dim);
      const perRow = 14;
      ids.forEach((id, i) => {
        const ic = g.hud._relicIcon(id);
        ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, 300 + (i % perRow) * 20, 174 + Math.floor(i / perRow) * 20, 16, 16);
      });
      if (!ids.length) drawText(ctx, 'NONE YET', 300, 178, C.faint);
      drawText(ctx, g.input.touchMode ? 'TAP AN OPTION' : 'W/S CHOOSE    ENTER SELECT    ESC RESUME', W / 2, H - 22, C.faint, { align: 'center' });
    },
  },

  settings: {
    items: settingsItems,
    draw(ctx, menus, time) {
      if (menus.game.state !== 'title') dimBackground(ctx, 0.8);
      else dimBackground(ctx, 0.55);
      drawPanel(ctx, 150, 70, 340, 220, 'SETTINGS');
      menus.drawList(ctx, time, { x: 180, y: 100, gap: 20, valueX: 170, width: 300, noteX: 320, noteY: 262, noteAlign: 'center', noteWidth: 52 });
    },
  },

  controls: {
    items(g, menus) {
      return [{ label: 'BACK', action: () => menus.close() }];
    },
    draw(ctx, menus, time) {
      dimBackground(ctx, 0.8);
      drawPanel(ctx, 110, 50, 420, 270, 'CONTROLS');
      const touch = menus.game.input.touchMode;
      const lines = touch
        ? [
            ['LEFT THUMB', 'MOVE'],
            ['RIGHT THUMB', 'SHOOT (DRAG TOWARD A FOE)'],
            ['ROLL', 'DODGE (BOTTOM CENTRE)'],
            ['ITEM / USE', 'ACTIVE RELIC / SCROLL OR POTION'],
            ['BOMB', 'POWDER KEG'],
          ]
        : [
            ['WASD', 'MOVE'],
            ['ARROWS', 'SHOOT  (OR SWING, FOR THE KNIGHT)'],
            ['SHIFT', 'DODGE  (ROLL / BLINK / SHIELD CHARGE)'],
            ['SPACE', 'ACTIVE RELIC'],
            ['Q', 'SCROLL OR POTION'],
            ['E', 'POWDER KEG'],
            ['ESC', 'PAUSE'],
            ['', ''],
            ['GAMEPAD', 'STICKS MOVE AND SHOOT, B DODGES,'],
            ['', 'RB RELIC, LB SCROLL, LT KEG, START PAUSE'],
            ['F3 / F4', 'FPS  /  LIGHTING-ONLY VIEW'],
          ];
      lines.forEach(([k, v], i) => {
        drawText(ctx, k, 230, 80 + i * 16, C.gold, { align: 'right' });
        drawText(ctx, v, 246, 80 + i * 16, C.ink);
      });
      menus.drawList(ctx, time, { x: 320, y: 296, align: 'center', width: 120 });
    },
  },

  confirm: {
    items(g, menus, t) {
      return [
        {
          label: 'YES',
          action: () => {
            menus.close();
            t.yes();
          },
        },
        { label: 'NO', action: () => menus.close() },
      ];
    },
    draw(ctx, menus, time, t) {
      dimBackground(ctx, 0.6);
      drawPanel(ctx, 180, 120, 280, 110, null);
      drawText(ctx, t.question, W / 2, 138, C.gold, { scale: 2, align: 'center' });
      drawText(ctx, t.detail || '', W / 2, 162, C.dim, { align: 'center' });
      menus.drawList(ctx, time, { x: W / 2, y: 186, gap: 16, align: 'center', width: 100 });
    },
  },

  oaths: {
    items(g, menus) {
      const sworn = new Set(Save.data.oaths);
      const toggle = (id) => {
        if (sworn.has(id)) sworn.delete(id);
        else sworn.add(id);
        Save.data.oaths = [...sworn];
        Save.write();
      };
      return [
        ...OATH_IDS.map((id) => ({
          label: OATHS[id].name.toUpperCase(),
          value: () => (sworn.has(id) ? `SWORN  +${OATHS[id].heat}` : `       +${OATHS[id].heat}`),
          color: sworn.has(id) ? '#e07a40' : null,
          action: () => toggle(id),
          adjust: () => toggle(id),
          note: OATHS[id].text,
        })),
        { spacer: true, label: '', disabled: true },
        {
          label: 'BEGIN THE DESCENT',
          action: () => {
            menus.reset('title');
            g.beginFromTitle();
          },
        },
        { label: 'BACK', action: () => menus.close() },
      ];
    },
    draw(ctx, menus, time) {
      dimBackground(ctx, 0.6);
      drawPanel(ctx, 100, 40, 440, 296, 'OATHS');
      const heat = heatOf(Save.data.oaths);
      const g = menus.game;
      const rec = Save.data.heatRecord[g.characterId] || 0;
      drawText(ctx, `HEAT ${heat} / ${MAX_HEAT}`, W / 2, 60, heat ? '#e07a40' : C.dim, { scale: 2, align: 'center' });
      drawText(ctx, `${CHARACTERS[g.characterId].name.toUpperCase()}'S BEST: HEAT ${rec}`, W / 2, 78, C.dim, { align: 'center' });
      menus.drawList(ctx, time, { x: 140, y: 96, gap: 15, valueX: 250, width: 380, noteX: W / 2, noteY: 314, noteAlign: 'center', noteWidth: 64 });
    },
  },

  daily: {
    items(g, menus) {
      const played = daily.played;
      return [
        {
          label: played ? 'PRACTICE AGAIN' : "BEGIN TODAY'S DESCENT",
          action: () => {
            if (!daily.name && !played) g.openNameEntry(() => g.startDaily());
            else g.startDaily();
          },
          note: played ? "Today's run is on the board. Replays don't count." : 'Only your first run today counts.',
        },
        { label: daily.name ? `NAME: ${daily.name}` : 'SET YOUR NAME', action: () => g.openNameEntry(null), note: 'The name shown on the board.' },
        { label: 'BACK', action: () => menus.close() },
      ];
    },
    draw(ctx, menus, time) {
      dimBackground(ctx, 0.6);
      drawPanel(ctx, 60, 40, 520, 296, 'DAILY DESCENT');
      const hero = CHARACTERS[daily.hero];
      drawText(ctx, `${daily.date}   SEED ${daily.seed}   HERO: ${hero.name.toUpperCase()}`, W / 2, 62, C.ink, { align: 'center' });
      menus.drawList(ctx, time, { x: 90, y: 92, gap: 18, width: 210, noteX: 90, noteY: 160, noteWidth: 34 });
      // the board
      const b = daily.board;
      const x0 = 320;
      drawText(ctx, 'TODAY', x0, 86, C.gold);
      if (!b || daily.loading) drawText(ctx, 'CONSULTING THE BOARD...', x0, 102, C.dim);
      else if (!b.online) {
        drawText(ctx, 'THE BOARD IS UNREACHABLE.', x0, 102, C.dim);
        drawText(ctx, 'YOUR BEST STAYS ON THIS DEVICE.', x0, 114, C.faint);
      } else if (!b.top.length) drawText(ctx, 'NO ONE HAS DESCENDED YET. BE FIRST.', x0, 102, C.dim);
      else {
        b.top.slice(0, 15).forEach((r, i) => {
          const y = 102 + i * 12;
          const me = r.name === daily.name;
          const col = me ? C.gold : i < 3 ? C.ink : C.dim;
          drawText(ctx, `${i + 1}.`, x0 + 14, y, col, { align: 'right' });
          drawText(ctx, r.name, x0 + 20, y, col);
          drawText(ctx, r.won ? 'VICTORY' : `FLOOR ${r.depth + 1}`, x0 + 170, y, col, { align: 'right' });
          drawText(ctx, fmtTime(r.seconds || 0), x0 + 230, y, col, { align: 'right' });
        });
      }
      const best = daily.localBest;
      if (best) drawText(ctx, `YOUR BEST TODAY: ${best.won ? 'VICTORY' : 'FLOOR ' + (best.depth + 1)} IN ${fmtTime(best.seconds)}`, 90, 300, C.gold);
      const lp = daily.lastPost;
      if (lp && lp.rank) drawText(ctx, `YOU PLACED #${lp.rank} TODAY`, 90, 312, '#7ac0e0');
    },
  },
};

export { fmtTime, wrap };
