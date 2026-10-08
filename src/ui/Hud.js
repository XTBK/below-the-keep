import { VISUAL } from '../render/Sprite.js';
import { drawText } from './PixelFont.js';
import { Painter } from '../render/Painter.js';
import { SHARED as S } from '../data/palettes.js';
import { ROOM, RENDER } from '../data/config.js';
import { KEYS } from '../data/controls.js';
import { drawMinimap } from './Minimap.js';
import { RELIC_IDS } from '../data/items.js';
import { BOSS_FX } from '../data/bosses.js';
import { getSheet } from '../render/Assets.js';
import { Save } from '../core/Save.js';
import { curioFrame } from '../items/Curios.js';
import { CURIO_FRAME } from '../data/curios.js';
import { drawCollection, drawCharacter } from './Collection.js';
import { TIER_INFO, bossTier } from '../data/difficulty.js';
import { CHARACTERS } from '../data/characters.js';
import { TitleBackdrop } from './TitleBackdrop.js';
import { daily } from '../core/Daily.js';
import { WEAPON_IDS } from '../data/weapons.js';
import { drawPanel, wrap as wrapText } from './Menus.js';

// Draws the HUD and menus onto a 640x360 canvas. It is only redrawn when something changes
// (call markDirty), then uploaded once as a texture.

function iconCanvas(w, h, draw) {
  const p = new Painter(w, h);
  draw(p);
  p.outline(S.outline);
  return p.toColorCanvas();
}

// Heart icons: 0 = full, 1 = half, 2 = empty, 3 = iron, 4 = half iron, 5 = unknown (Omen of the Unknown)
function heart(kind) {
  if (kind >= 3) return ironHeart(kind);
  return iconCanvas(13, 12, (p) => {
    const shape = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < 9; x++) {
        if (shape[y][x] !== '#') continue;
        let c = S.heart[2];
        if (kind === 2 || (kind === 1 && x >= 5)) c = '#2a1418';
        else if (y >= 5 || x >= 7) c = S.heart[1];
        else if ((y === 1 && (x === 1 || x === 2)) || (y === 2 && x === 1)) c = S.heart[4];
        else if (y <= 2 && x <= 3) c = S.heart[3];
        p.px(x + 2, y + 2, c);
      }
    }
  });
}

function ironHeart(kind) {
  return iconCanvas(13, 12, (p) => {
    const shape = ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....'];
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < 9; x++) {
        if (shape[y][x] !== '#') continue;
        if (kind === 4 && x >= 5) continue;
        let c = kind === 5 ? '#3a3448' : S.iron[3];
        if (kind !== 5) {
          if (y >= 5 || x >= 7) c = S.iron[2];
          else if (y <= 2 && x <= 3) c = S.iron[5];
          if ((x === 2 || x === 6) && y === 3) c = S.iron[1]; // rivets
        }
        p.px(x + 2, y + 2, c);
      }
    }
    if (kind === 5) for (const [x, y] of [[5, 3], [6, 3], [7, 4], [6, 5], [6, 7]]) p.px(x, y, '#c8c0ff');
  });
}

function penny() {
  return iconCanvas(12, 12, (p) => {
    p.ellipse(6, 6, 4.5, 4.5, S.silver, 1);
    p.vline(6, 4, 8, S.silver[1]);
    p.hline(4, 8, 6, S.silver[1]);
    p.px(4, 3, S.silver[3]);
  });
}

function keg() {
  return iconCanvas(12, 12, (p) => {
    p.cyl(3, 4, 7, 7, S.wood.slice(1, 6), 1);
    p.hline(3, 9, 6, S.iron[3]);
    p.hline(3, 9, 9, S.iron[3]);
    p.px(6, 3, S.leather[2]);
    p.px(7, 2, S.leather[2]);
    p.px(8, 1, S.fire[4]);
  });
}

function key() {
  return iconCanvas(12, 12, (p) => {
    p.ellipse(4, 4, 2.6, 2.6, S.iron.slice(2, 6), 1);
    p.px(4, 4, '#000000', 0, 0); // punch a hole in the key's ring (alpha 0)
    p.line(6, 6, 10, 10, S.iron[4]);
    p.px(9, 11, S.iron[3]);
    p.px(10, 8, S.iron[3]);
  });
}

function framedBox(ctx, x, y, w, h) {
  ctx.fillStyle = '#0b0a0d';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#3d3f48';
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = '#16171c';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = '#5d606c';
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
}

/** A side panel: dark stone, an iron edge toward the room, rivets down it. */
function sidePanel(ctx, x, w, edge) {
  ctx.fillStyle = 'rgba(9,8,11,0.9)';
  ctx.fillRect(x, 0, w, RENDER.height);
  ctx.fillStyle = 'rgba(255,255,255,0.022)';
  for (let yy = 8; yy < RENDER.height; yy += 12) ctx.fillRect(x + 2, yy, w - 4, 1);
  const ex = edge === 'right' ? x + w - 3 : x;
  ctx.fillStyle = '#24242c';
  ctx.fillRect(ex, 0, 3, RENDER.height);
  ctx.fillStyle = '#4a4a56';
  ctx.fillRect(edge === 'right' ? ex : ex + 2, 0, 1, RENDER.height);
  for (let yy = 20; yy < RENDER.height; yy += 44) {
    ctx.fillStyle = '#6a6a76';
    ctx.fillRect(ex + 1, yy, 1, 1);
  }
}

/** A small framed plaque for an icon. */
function plaque(ctx, x, y, w, h, rim) {
  ctx.fillStyle = '#0b0a0d';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = rim;
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, h - 2);
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  ctx.fillStyle = '#16151b';
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
}

/** One segment of the vigor bar (a heart's worth). */
function vigorSegment(ctx, x, y, kind, time) {
  const w = 10;
  const h = 8;
  ctx.fillStyle = '#0b0a0d';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  const fill = (fx, fw, top, mid, bot) => {
    ctx.fillStyle = mid;
    ctx.fillRect(fx, y, fw, h);
    ctx.fillStyle = top;
    ctx.fillRect(fx, y, fw, 2);
    ctx.fillStyle = bot;
    ctx.fillRect(fx, y + h - 2, fw, 2);
  };
  ctx.fillStyle = '#2a1418';
  ctx.fillRect(x, y, w, h);
  if (kind === 'full') fill(x, w, '#ee6a6a', '#c02634', '#7a1420');
  else if (kind === 'half') fill(x, 5, '#ee6a6a', '#c02634', '#7a1420');
  else if (kind === 'iron') fill(x, w, '#d8dce6', '#8a8e9a', '#4a4e5a');
  else if (kind === 'halfIron') {
    ctx.fillStyle = '#16151b';
    ctx.fillRect(x, y, w, h);
    fill(x, 5, '#d8dce6', '#8a8e9a', '#4a4e5a');
  } else if (kind === 'unknown') {
    fill(x, w, '#5a5470', '#3a3448', '#26222f');
    ctx.fillStyle = '#c8c0ff';
    ctx.fillRect(x + 4, y + 2, 2, 2);
    ctx.fillRect(x + 4, y + 5, 2, 1);
  } else if (kind === 'shroud') {
    const a = 0.7 + 0.3 * Math.sin(time * 4);
    ctx.globalAlpha = a;
    fill(x, w, '#fff0b0', '#e8c46c', '#9a7020');
    ctx.globalAlpha = 1;
  }
}

function emberIcon() {
  return iconCanvas(12, 12, (p) => {
    p.ellipse(6, 7, 4, 3.6, ['#5a1a08', '#a03a10', '#e06a20', '#ffb048'], 1);
    p.px(6, 6, '#fff0a0');
    p.px(5, 7, '#ffd060');
    p.px(7, 3, '#ff9a30');
    p.px(5, 2, '#e06a20');
  });
}

const GOLD = '#e8c46c';
const INK = '#e8e0d0';
const DIM = '#8a8478';
const FAINT = '#5d606c';
const BLOOD = '#d8343c';
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export class Hud {
  constructor(canvas, texture) {
    this.canvas = canvas;
    this.texture = texture;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.icons = {
      hearts: [heart(0), heart(1), heart(2), heart(3), heart(4), heart(5)],
      penny: penny(),
      keg: keg(),
      key: key(),
      ember: emberIcon(),
    };
    this.dirty = true;
    this.debugText = null;
    this.hover = null; // relic you're standing next to: { def, price }
    this._hoverNext = null;
    this.bannerDef = null;
    this.bannerT = 0;
    this.time = 0;
  }

  markDirty() {
    this.dirty = true;
  }

  /** Called by item stands every frame while Wren is near a relic. */
  setHover(def, price, hearts = 0) {
    this._hoverNext = { def, price, hearts };
  }

  /** Big "you got X" banner with the relic's flavour line. */
  banner(def) {
    this.bannerDef = def;
    this.bannerT = 2.8;
    this.dirty = true;
  }

  /** Embers found: a little +N beside the count. */
  emberFlash(n, why = null) {
    this.emberN = this.emberT > 0 ? this.emberN + n : n;
    this.emberWhy = why;
    this.emberT = 2.2;
    this.dirty = true;
  }

  /** Once per frame, after the world has updated. */
  tick(dt, game) {
    this.time += dt;
    if (this.emberT > 0) {
      this.emberT -= dt;
      this.dirty = true;
    }
    if (this.dreadFlash > 0) this.dreadFlash -= dt;
    if (game.dread > 0.01 || this.dreadFlash > 0) this.dirty = true;
    this._dt = dt;
    const next = this._hoverNext;
    this._hoverNext = null;
    if ((next && next.def) !== (this.hover && this.hover.def)) this.dirty = true;
    this.hover = next;
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      this.dirty = true;
    }
    // screens that animate need a redraw every frame
    if (game.state !== 'play' || game.paused || game.floorTitleT > 0 || game.enemies.boss || game.fade > 0 || (game.player && game.player.charge > 0)) this.dirty = true;
  }

  _curioIcon(frame) {
    return { canvas: getSheet('curios').colorCanvas, sx: frame * 16 };
  }

  _relicIcon(id) {
    const sheet = getSheet('relics');
    const i = RELIC_IDS.indexOf(id);
    return { canvas: sheet.colorCanvas, sx: i * 16 };
  }

  /** state: the Game */
  draw(state) {
    if (!this.dirty) return;
    this.dirty = false;
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    ctx.clearRect(0, 0, W, H);

    if (state.cutscene) {
      state.cutscene.draw(ctx, this._dt || 1 / 60);
      this.texture.needsUpdate = true;
      return;
    }
    if (state.state === 'title' || state.state === 'collection') {
      if (state.state === 'collection') drawCollection(this.ctx, state);
      else this._drawTitle(state);
      this._drawFade(state);
      this.texture.needsUpdate = true;
      return;
    }

    this._drawPlayHud(state);

    if (state.state === 'bossIntro') this._drawBossCard(state);
    if (state.floorTitleT > 0 && state.state !== 'dead' && state.state !== 'victory') this._drawFloorTitle(state);
    if (state.state === 'dead' && state.deathTimer > 1.1) this._drawDeath(state);
    if (state.state === 'victory') this._drawVictory(state);
    this._drawFade(state);
    if (state.paused) this._drawPause(state); // (over the fade: the fork in the road shows in the dark)
    this.texture.needsUpdate = true;
  }

  // ------------------------------------------------------------------------------------------
  _drawPlayHud(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    const left = (W - (ROOM.wallSide * 2 + ROOM.cols * ROOM.tile)) / 2; // room's left edge on screen
    const p = state.player;

    // The Keep's ledger: two stone-and-iron side panels that frame the room. Left: who you are
    // (portrait, weapon, vigor, supplies, what's in your hands). Right: where you are (map, floor,
    // omen) and what you carry (relics).
    const SIDE = Math.round(left);
    // Beatrix near: the edges of the world go dark (and flash red when she's suddenly there)
    if (state.dread > 0.01 || this.dreadFlash > 0) {
      const cx = W / 2;
      const cy = H / 2 + 10;
      const g = ctx.createRadialGradient(cx, cy, 90 - state.dread * 40, cx, cy, 300);
      g.addColorStop(0, 'rgba(6,0,3,0)');
      g.addColorStop(1, `rgba(6,0,3,${(0.82 * state.dread).toFixed(3)})`);
      ctx.fillStyle = g;
      ctx.fillRect(SIDE, 0, W - SIDE * 2, H);
      if (this.dreadFlash > 0 && !VISUAL.calm) {
        ctx.fillStyle = `rgba(120,0,10,${(this.dreadFlash * 0.5).toFixed(3)})`;
        ctx.fillRect(SIDE, 0, W - SIDE * 2, H);
      }
    }
    sidePanel(ctx, 0, SIDE, 'right');
    sidePanel(ctx, W - SIDE, SIDE, 'left');

    // --- the hero: a portrait in an iron medallion, the weapon at their side
    this._drawPortrait(ctx, p, 24, 25);
    plaque(ctx, 46, 11, 26, 26, p.weaponId ? '#8a6a3a' : '#3a3640');
    if (p.weaponId) {
      const ws = getSheet('weapons');
      ctx.drawImage(ws.colorCanvas, WEAPON_IDS.indexOf(p.weaponId) * 16, 0, 16, 16, 51, 16, 16, 16);
    } else drawText(ctx, 'SLING', 59, 21, FAINT, { align: 'center', shadow: null });

    // --- vigor: one blood segment per heart (halves fill half), iron ones after
    let y = 48;
    drawText(ctx, 'VIGOR', 8, y, FAINT, { shadow: null });
    y += 10;
    const containers = Math.ceil(p.maxHalfHearts / 2);
    const unknown = state.omen === 'unknown';
    const iron = p.ironHalfHearts;
    const segs = [];
    for (let i = 0; i < containers; i++) segs.push(unknown ? 'unknown' : p.halfHearts >= i * 2 + 2 ? 'full' : p.halfHearts === i * 2 + 1 ? 'half' : 'empty');
    for (let k = 0; k < Math.ceil(iron / 2); k++) segs.push(unknown ? 'unknown' : k * 2 + 1 === iron ? 'halfIron' : 'iron');
    if (p.perks.shield && p.shieldReady) segs.push('shroud');
    segs.forEach((kind, i) => vigorSegment(ctx, 8 + (i % 6) * 11, y + Math.floor(i / 6) * 10, kind, this.time));
    y += Math.ceil(segs.length / 6) * 10 + 8;

    // --- supplies: a short ledger
    const ledger = [
      [this.icons.penny, p.pennies, '#e0dccf'],
      [this.icons.keg, p.bombs, '#e0dccf'],
      [this.icons.key, p.keys, '#e0dccf'],
    ];
    if (state.embersShown) ledger.push([this.icons.ember, p.embers || 0, '#f0a848']);
    ledger.forEach(([icon, n, color], i) => {
      const ly = y + i * 14;
      ctx.drawImage(icon, 9, ly - 2);
      drawText(ctx, String(n).padStart(2, '0'), 26, ly + 1, color);
      if (icon === this.icons.ember && this.emberT > 0) {
        // embers just found: +N rises beside the count
        ctx.globalAlpha = Math.min(1, this.emberT);
        drawText(ctx, `+${this.emberN}`, 46, ly + 1 - Math.round((2.2 - this.emberT) * 4), '#ffd070');
        if (this.emberWhy) drawText(ctx, this.emberWhy, 26, ly + 11 - Math.round((2.2 - this.emberT) * 4), '#e8c46c', { shadow: null });
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(8, ly + 11, 62, 1);
    });
    y += ledger.length * 14 + 8;

    // --- in hand: the active relic (with its charge), the trinket and the Q slot
    plaque(ctx, 7, y, 26, 26, p.active && p.active.charge >= p.active.max ? '#c8a050' : '#4a4652');
    if (p.active) {
      const ic = this._relicIcon(p.active.id);
      ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, 12, y + 5, 16, 16);
      const n = p.active.max;
      const segH = Math.max(2, Math.floor(26 / n));
      for (let i = 0; i < n; i++) {
        const sy = y + 26 - (i + 1) * segH;
        ctx.fillStyle = '#0b0a0d';
        ctx.fillRect(34, sy, 5, segH);
        ctx.fillStyle = i < p.active.charge ? (p.active.charge >= n ? '#f0d880' : '#b8963c') : '#25262d';
        ctx.fillRect(35, sy + 1, 3, segH - 2);
      }
    }
    const slot = (x, frame, label) => {
      plaque(ctx, x, y + 4, 18, 18, '#3e3a46');
      if (frame >= 0) {
        const ic = this._curioIcon(frame);
        ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, x + 1, y + 5, 16, 16);
      }
      if (label && !state.input.touchMode) drawText(ctx, label, x + 9, y + 26, FAINT, { align: 'center', shadow: null });
    };
    slot(42, p.trinket ? CURIO_FRAME.trinket(p.trinket) : -1, null);
    slot(61, p.consumable ? curioFrame(state, p.consumable) : -1, 'Q');
    if (!state.input.touchMode) drawText(ctx, 'SPACE', 20, y + 30, FAINT, { align: 'center', shadow: null });
    y += 40;
    // the Seal Fragments
    p.seals.forEach((has, i) => {
      if (!has) return;
      const ic = this._curioIcon(CURIO_FRAME.seal(i));
      ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, 8 + i * 12, y, 16, 16);
    });

    // --- the right panel: map, floor, omen, relics
    const RX = W - SIDE;
    let ry = 4;
    if (state.floor) {
      if ((state.omen === 'lost' || state.oath('blind')) && !state.debugReveal) {
        // the Omen of the Lost: no map at all
        drawText(ctx, '?', RX + SIDE / 2, 22, FAINT, { scale: 3, align: 'center' });
        ry = 66;
      } else {
        const m = drawMinimap(ctx, state.floor, state.room.data.id, state.debugReveal);
        ry = m.y + m.h + 10;
      }
      for (const line of wrapText(state.floorName.toUpperCase(), 12)) {
        drawText(ctx, line, RX + SIDE / 2, ry, INK, { align: 'center' });
        ry += 10;
      }
      if (state.omen) {
        for (const line of wrapText(state.omenInfo.name.toUpperCase(), 12)) {
          drawText(ctx, line, RX + SIDE / 2, ry, '#b080e0', { align: 'center' });
          ry += 10;
        }
      }
      if (state.mode === 'stalked') {
        drawText(ctx, 'STALKED', RX + SIDE / 2, ry, '#c84a5a', { align: 'center' });
        ry += 10;
      }
    }
    // relics carried
    const ids = p.relics;
    if (ids.length) {
      ry += 4;
      drawText(ctx, `RELICS ${ids.length}`, RX + 6, ry, FAINT, { shadow: null });
      ry += 10;
      const perRow = 4;
      const maxRows = Math.floor((H - ry - (state.input.touchMode ? 44 : 6)) / 17); // (on a touch screen, clear of the ROLL button)
      const shown = ids.slice(-perRow * maxRows); // newest stay in view
      shown.forEach((id, i) => {
        const ic = this._relicIcon(id);
        ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, RX + 5 + (i % perRow) * 17, ry + Math.floor(i / perRow) * 17, 16, 16);
      });
    }

    // the Siege Crossbow: how far the shot is drawn
    if (p.charge > 0) {
      ctx.fillStyle = '#0b0a0d';
      ctx.fillRect(W / 2 - 21, H - 30, 42, 5);
      ctx.fillStyle = p.charge >= 1 ? '#f0d880' : '#b8963c';
      ctx.fillRect(W / 2 - 20, H - 29, Math.round(40 * p.charge), 3);
    }

    // boss health bar
    const boss = state.enemies.boss;
    if (boss && state.state === 'play') {
      const bw = 300;
      const bx = Math.round((W - bw) / 2);
      const by = H - 18;
      drawText(ctx, boss.name, W / 2, by - 11, GOLD, { align: 'center' });
      ctx.fillStyle = '#0b0a0d';
      ctx.fillRect(bx - 2, by - 2, bw + 4, 10);
      ctx.fillStyle = '#3a0a10';
      ctx.fillRect(bx, by, bw, 6);
      ctx.fillStyle = boss.enraged ? '#ee5a5a' : '#c02634';
      ctx.fillRect(bx, by, Math.max(0, Math.round((bw * boss.hp) / boss.maxHp)), 6);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(bx, by, Math.max(0, Math.round((bw * boss.hp) / boss.maxHp)), 2);
    }

    // relic you're standing next to
    if (this.hover && state.state === 'play') {
      const { def, price, hearts } = this.hover;
      const y = H - (boss ? 54 : 34);
      const cost = price ? `   ${price} PENNIES` : hearts ? `   COSTS ${hearts / 2} HEART${hearts > 2 ? 'S' : ''}` : '';
      drawText(ctx, def.name + cost, W / 2, y, hearts ? '#e04a5a' : GOLD, { align: 'center' });
      drawText(ctx, def.flavour, W / 2, y + 11, DIM, { align: 'center' });
    }

    // "you found..." banner
    if (this.bannerT > 0 && this.bannerDef) {
      const a = Math.min(1, this.bannerT * 2, (2.8 - this.bannerT) * 4);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(5,4,8,0.7)';
      ctx.fillRect(SIDE, 44, W - SIDE * 2, 40); // inside the room: the side panels stay readable
      drawText(ctx, this.bannerDef.name, W / 2, 50, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, this.bannerDef.flavour, W / 2, 70, INK, { align: 'center' });
      ctx.globalAlpha = 1;
    }

    if (this.debugText) drawText(ctx, this.debugText, 6, H - 12, '#9ad07a');
  }

  /** The hero's face in an iron medallion (cut from their own sprite, facing you). */
  _drawPortrait(ctx, p, cx, cy) {
    const r = 15;
    ctx.fillStyle = '#0b0a0d';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6a6a76';
    ctx.beginPath();
    ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1a22';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
    ctx.fill();
    const canvas = p.portraitCanvas || (p.sprite && p.sprite.sheet && p.sprite.sheet.colorCanvas);
    if (canvas) {
      const fw = 32;
      const fh = 32;
      const row = 0; // facing you
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.clip();
      // head and shoulders: the top of the frame, a little enlarged
      const scale = 1.5;
      const sw = Math.min(fw, 22);
      const sh = 20;
      const sx = Math.round((fw - sw) / 2);
      const sy = Math.max(0, Math.round(fh * 0.12));
      ctx.drawImage(canvas, sx, row * fh + sy, sw, sh, Math.round(cx - (sw * scale) / 2), Math.round(cy - (sh * scale) / 2 + 3), sw * scale, sh * scale);
      ctx.restore();
    }
    ctx.fillStyle = '#9a9aa6';
    ctx.fillRect(cx - 1, cy - r - 1, 2, 1); // a rivet at the top
  }

  _drawBossCard(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    const boss = state.enemies.boss;
    if (!boss) return;
    const t = state.introT; // counts down
    const a = Math.min(1, (BOSS_FX.introTime - t) * 4, t * 3);
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, H / 2 - 40, W, 80);
    ctx.fillStyle = '#7a1420';
    ctx.fillRect(0, H / 2 - 40, W, 1);
    ctx.fillRect(0, H / 2 + 39, W, 1);
    const slide = Math.round(Math.max(0, 1 - (BOSS_FX.introTime - t) * 3) * 40);
    drawText(ctx, boss.name, W / 2 - slide, H / 2 - 22, GOLD, { scale: 3, align: 'center' });
    drawText(ctx, boss.subtitle, W / 2 + slide, H / 2 + 12, INK, { align: 'center' });
    // its rank: one skull per step, in the rank's colour
    const tier = state.bossTierOf(boss.type);
    const info = TIER_INFO[tier];
    const label = info.name;
    const tw = label.length * 6 + tier * 9 + 6;
    let x = Math.round(W / 2 - tw / 2);
    for (let i = 0; i < tier; i++) {
      drawSkull(ctx, x, H / 2 + 25, info.color);
      x += 9;
    }
    drawText(ctx, label, x + 4, H / 2 + 25, info.color);
    ctx.globalAlpha = 1;
  }

  _drawFloorTitle(state) {
    const ctx = this.ctx;
    const a = Math.min(1, state.floorTitleT);
    ctx.globalAlpha = a;
    // in the middle of the screen, clear of the item banner at the top
    const y = RENDER.height / 2 - 30;
    ctx.fillStyle = 'rgba(5,4,8,0.45)';
    ctx.fillRect(0, y - 8, RENDER.width, state.omen ? 58 : 32);
    drawText(ctx, state.floorName, RENDER.width / 2, y, INK, { scale: 2, align: 'center' });
    if (state.omen) {
      drawText(ctx, state.omenInfo.name.toUpperCase(), RENDER.width / 2, y + 24, '#b080e0', { align: 'center' });
      drawText(ctx, state.omenInfo.flavour.toUpperCase(), RENDER.width / 2, y + 36, DIM, { align: 'center' });
    }
    ctx.globalAlpha = 1;
  }

  _drawFade(state) {
    if (state.fade <= 0) return;
    this.ctx.fillStyle = `rgba(0,0,0,${Math.min(1, state.fade)})`;
    this.ctx.fillRect(0, 0, RENDER.width, RENDER.height);
  }

  // ------------------------------------------------------------------------------------------
  _drawTitle(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    const time = this.time;
    // the castle under the moon
    if (!this.backdrop) this.backdrop = new TitleBackdrop();
    this.backdrop.draw(ctx, time, this._dt || 1 / 60);
    // a dark wash on the left, behind the menu
    const grad = ctx.createLinearGradient(0, 0, 230, 0);
    grad.addColorStop(0, 'rgba(3,2,6,0.82)');
    grad.addColorStop(1, 'rgba(3,2,6,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 96, 230, H - 96);

    // the logo, with a flickering ember glow behind it
    const flick = 0.85 + 0.15 * Math.sin(time * 7) * Math.sin(time * 3.1);
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.3);
    ctx.globalAlpha = 0.4 * flick;
    drawText(ctx, 'BELOW THE KEEP', W / 2 + 1, 19, '#d4521a', { scale: 5, align: 'center', shadow: null });
    ctx.globalAlpha = 1;
    drawText(ctx, 'BELOW THE KEEP', W / 2, 18, GOLD, { scale: 5, align: 'center', shadow: '#3a1206' });
    ctx.globalAlpha = 0.75 + 0.25 * pulse;
    drawText(ctx, 'THE ONLY WAY OUT IS DOWN', W / 2, 62, '#c02634', { scale: 2, align: 'center', shadow: '#1a0406' });
    ctx.globalAlpha = 1;

    const menus = state.menus;
    const onTitle = menus.top && menus.top.id === 'title';
    // the hero, on the cliff to the right
    const id = state.characterId;
    const ch = CHARACTERS[id];
    const locked = !Save.data.unlocks.characters.includes(id);
    const hx = 536;
    // torchlight on the hero
    const glow = ctx.createRadialGradient(hx, 236, 4, hx, 236, 70);
    glow.addColorStop(0, `rgba(255,140,60,${0.16 + 0.04 * flick})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(hx - 80, 160, 160, 120);
    drawCharacter(ctx, id, hx - 32, 206, 2, locked);
    if (onTitle) {
      const bob = Math.round(Math.sin(time * 4) * 2);
      drawText(ctx, '<', hx - 52 - bob, 236, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, '>', hx + 52 + bob, 236, GOLD, { scale: 2, align: 'center' });
    }
    drawText(ctx, locked ? '???' : ch.name.toUpperCase(), hx, 278, locked ? DIM : GOLD, { scale: 2, align: 'center' });
    drawText(ctx, locked ? 'LOCKED' : ch.title.toUpperCase(), hx, 296, locked ? DIM : INK, { align: 'center' });
    const flav = locked ? 'UNLOCK: ' + (ch.unlock || 'available from the start').toUpperCase() : ch.flavour.toUpperCase();
    wrapText(flav, 30).forEach((l, i) => drawText(ctx, l, hx, 308 + i * 9, DIM, { align: 'center' }));

    // the menu
    if (onTitle && state.seedEntry === null && !state.nameEntry) {
      menus.drawList(ctx, time, { x: 44, y: 120, gap: 20, width: 190, noteX: 30, noteY: 256, noteWidth: 30 });
      const touch = state.input.touchMode;
      if (state.audio.ctx && state.audio.ctx.state === 'running') drawText(ctx, touch ? 'TAP A CHOICE  -  TAP THE ARROWS FOR ANOTHER HERO' : 'W/S CHOOSE    ENTER SELECT    A/D HERO', W / 2, H - 12, FAINT, { align: 'center' });
    } else if (!onTitle) {
      menus.draw(ctx, time);
    }

    // typing a seed or a name
    if (state.seedEntry !== null || state.nameEntry) {
      const naming = !!state.nameEntry;
      ctx.fillStyle = 'rgba(3,2,6,0.7)';
      ctx.fillRect(0, 0, W, H);
      drawPanel(ctx, 170, 130, 300, 110, naming ? 'YOUR NAME' : 'SEEDED RUN');
      const raw = naming ? state.nameEntry.value : state.seedEntry;
      const shown = naming ? raw + (Math.floor(time * 2) % 2 ? '_' : ' ') : `${(raw + '________').slice(0, 4)}-${(raw + '________').slice(4, 8)}`;
      drawText(ctx, naming ? 'FOR THE DAILY DESCENT BOARD' : 'TYPE A SEED', W / 2, 152, DIM, { align: 'center' });
      drawText(ctx, shown, W / 2, 172, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, 'ENTER  OK     ESC  BACK', W / 2, 212, DIM, { align: 'center' });
    }

    const st = Save.data.stats;
    if (onTitle) drawText(ctx, `RUNS ${st.runsStarted}    VICTORIES ${st.victories}    BOSSES SLAIN ${st.bossesBeaten}    RELICS FOUND ${RELIC_IDS.filter((r) => Save.data.unlocks.itemsSeen.includes(r)).length}/${RELIC_IDS.length}`, W / 2, H - 24, FAINT, { align: 'center' });
    // browsers keep quiet until the first key press or tap
    const audio = state.audio;
    if (!audio.ctx || audio.ctx.state !== 'running') {
      ctx.globalAlpha = 0.6 + 0.4 * pulse;
      drawText(ctx, state.input.touchMode ? 'TAP ANYWHERE FOR SOUND' : 'PRESS ANY KEY FOR SOUND', W / 2, H - 12, DIM, { align: 'center' });
      ctx.globalAlpha = 1;
    }
  }

  _drawDeath(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    const a = Math.min(1, (state.deathTimer - 1.1) * 2);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(14,2,4,0.86)';
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, `${state.player.character.name.toUpperCase()} HAS FALLEN`, W / 2, 46, BLOOD, { scale: 3, align: 'center' });
    const p = state.player;
    const lines = [
      ['SLAIN BY', p.lastHurtBy.toUpperCase()],
      ['ON', state.floorName],
      ['TIME', fmtTime(state.runTime)],
      ['SEED', state.seed],
    ];
    lines.forEach(([k, v], i) => {
      drawText(ctx, k, W / 2 - 8, 92 + i * 14, DIM, { align: 'right' });
      drawText(ctx, v, W / 2 + 8, 92 + i * 14, i === 0 ? GOLD : INK);
    });
    this._drawRelicRow(state, 164);
    this._drawEmbersHome(state, H - 66);
    this._drawRunNote(state, H - 50);
    drawText(ctx, state.input.touchMode ? 'TAP TO DESCEND AGAIN' : 'R  DESCEND AGAIN      ESC  TITLE', W / 2, H - 34, INK, { align: 'center' });
    ctx.globalAlpha = 1;
  }

  _drawVictory(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    ctx.fillStyle = 'rgba(4,3,6,0.85)';
    ctx.fillRect(0, 0, W, H);
    const crown = state.ending === 'crown';
    drawText(ctx, crown ? 'THE CROWN IS BROKEN' : 'THE MAD KING IS DEAD', W / 2, 46, GOLD, { scale: 2, align: 'center' });
    drawText(ctx, crown ? 'THE WHISPER THAT RULED THE KEEP IS SILENT AT LAST.' : 'THE KEEP FALLS QUIET. BUT SOMETHING IN HIS CROWN STILL WHISPERS...', W / 2, 76, INK, { align: 'center' });
    drawText(ctx, crown ? `${state.player.character.name.toUpperCase()} CLIMBS TOWARD THE DAWN.` : '(THREE SEALS MIGHT OPEN THE WAY TO IT)', W / 2, 90, DIM, { align: 'center' });
    drawText(ctx, `TIME ${fmtTime(state.runTime)}      SEED ${state.seed}`, W / 2, 112, INK, { align: 'center' });
    if (state.unlockNotice) {
      const ch = CHARACTERS[state.unlockNotice];
      const a = 0.6 + 0.4 * Math.sin(this.time * 5);
      ctx.globalAlpha = a;
      drawText(ctx, `NEW CHARACTER: ${ch.name.toUpperCase()}, ${ch.title.toUpperCase()}`, W / 2, 124, GOLD, { align: 'center' });
      ctx.globalAlpha = 1;
    }
    this._drawRelicRow(state, 140);
    this._drawEmbersHome(state, H - 66);
    this._drawRunNote(state, H - 50);
    drawText(ctx, state.input.touchMode ? 'TAP FOR A NEW RUN' : 'R  NEW RUN      ESC  TITLE', W / 2, H - 34, INK, { align: 'center' });
  }

  _drawRelicRow(state, y) {
    const ctx = this.ctx;
    const p = state.player;
    const ids = p.active ? [...p.relics, p.active.id] : p.relics;
    if (!ids.length) {
      drawText(ctx, 'NO RELICS', RENDER.width / 2, y + 4, FAINT, { align: 'center' });
      return;
    }
    const total = ids.length * 20 - 4;
    const x0 = Math.round((RENDER.width - total) / 2);
    ids.forEach((id, i) => {
      const ic = this._relicIcon(id);
      ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, x0 + i * 20, y, 16, 16);
    });
  }

  /** Under the death / victory screen: the Daily Descent's result, or the run's heat. */
  _drawEmbersHome(state, y) {
    if (!state.embersBanked) return;
    const ctx = this.ctx;
    const W = RENDER.width;
    ctx.drawImage(this.icons.ember, W / 2 - 92, y - 3);
    drawText(ctx, `${state.embersBanked} EMBERS CARRIED HOME   (${Save.data.embers || 0} AT THE HEARTH)`, W / 2 - 76, y, '#f0a848');
  }

  _drawRunNote(state, y) {
    const ctx = this.ctx;
    const W = RENDER.width;
    let text = null;
    let color = '#7ac0e0';
    if (state.daily) {
      const lp = daily.lastPost;
      if (!lp || lp.pending) text = 'DAILY DESCENT: POSTING YOUR RUN...';
      else if (lp.rank) text = `DAILY DESCENT: YOU PLACED #${lp.rank} TODAY`;
      else if (lp.practice) text = 'DAILY DESCENT: A PRACTICE RUN - ONLY THE FIRST RUN COUNTS';
      else text = 'DAILY DESCENT: KEPT ON THIS DEVICE (THE BOARD IS UNREACHABLE)';
    } else if (state.heat) {
      const rec = Save.data.heatRecord[state.characterId] || 0;
      text = state.state === 'victory' && rec === state.heat ? `WON AT HEAT ${state.heat} - A NEW RECORD` : `SWORN TO HEAT ${state.heat}`;
      color = '#e07a40';
    }
    if (text) drawText(ctx, text, W / 2, y, color, { align: 'center' });
  }

  _drawPause(state) {
    state.menus.draw(this.ctx, this.time);
  }
}

const SKULL = ['.###.', '#####', '#.#.#', '#####', '.#.#.'];
function drawSkull(ctx, x, y, color) {
  ctx.fillStyle = color;
  SKULL.forEach((row, ry) => {
    for (let rx = 0; rx < 5; rx++) if (row[rx] === '#') ctx.fillRect(x + rx, y + ry, 1, 1);
  });
}
