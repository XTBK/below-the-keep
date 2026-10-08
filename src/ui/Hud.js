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
import { CHARACTERS } from '../data/characters.js';

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

  /** Once per frame, after the world has updated. */
  tick(dt, game) {
    this.time += dt;
    const next = this._hoverNext;
    this._hoverNext = null;
    if ((next && next.def) !== (this.hover && this.hover.def)) this.dirty = true;
    this.hover = next;
    if (this.bannerT > 0) {
      this.bannerT -= dt;
      this.dirty = true;
    }
    // screens that animate need a redraw every frame
    if (game.state !== 'play' || game.floorTitleT > 0 || game.enemies.boss || game.fade > 0 || (game.player && game.player.charge > 0)) this.dirty = true;
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

    if (state.state === 'title' || state.state === 'collection') {
      if (state.state === 'collection') drawCollection(this.ctx, state);
      else this._drawTitle(state);
      this._drawFade(state);
      this.texture.needsUpdate = true;
      return;
    }

    this._drawPlayHud(state);

    if (state.state === 'bossIntro') this._drawBossCard(state);
    if (state.floorTitleT > 0) this._drawFloorTitle(state);
    if (state.state === 'dead' && state.deathTimer > 1.1) this._drawDeath(state);
    if (state.state === 'victory') this._drawVictory(state);
    if (state.paused) this._drawPause(state);
    this._drawFade(state);
    this.texture.needsUpdate = true;
  }

  // ------------------------------------------------------------------------------------------
  _drawPlayHud(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    const left = (W - (ROOM.wallSide * 2 + ROOM.cols * ROOM.tile)) / 2; // room's left edge on screen
    const p = state.player;

    // active relic + charge bar
    framedBox(ctx, 8, 6, 28, 28);
    if (p.active) {
      const ic = this._relicIcon(p.active.id);
      ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, 14, 12, 16, 16);
      const segs = p.active.max;
      const segH = Math.floor(26 / segs);
      for (let i = 0; i < segs; i++) {
        const y = 33 - (i + 1) * segH;
        ctx.fillStyle = '#0b0a0d';
        ctx.fillRect(38, y, 6, segH);
        ctx.fillStyle = i < p.active.charge ? (p.active.charge >= segs ? '#f0d880' : '#b8963c') : '#25262d';
        ctx.fillRect(39, y + 1, 4, segH - 2);
      }
    }
    if (!state.input.touchMode) drawText(ctx, 'SPACE', 22, 36, FAINT, { align: 'center', shadow: null });

    // hearts (6 per row)
    const full = Math.floor(p.halfHearts / 2);
    const half = p.halfHearts % 2;
    const containers = Math.ceil(p.maxHalfHearts / 2);
    const unknown = state.omen === 'unknown';
    for (let i = 0; i < containers; i++) {
      const kind = unknown ? 5 : i < full ? 0 : i === full && half ? 1 : 2;
      ctx.drawImage(this.icons.hearts[kind], left + 2 + (i % 6) * 12, 6 + Math.floor(i / 6) * 11);
    }
    // iron hearts follow the red ones
    const iron = p.ironHalfHearts;
    for (let k = 0; k < Math.ceil(iron / 2); k++) {
      const i = containers + k;
      const kind = unknown ? 5 : k * 2 + 1 === iron ? 4 : 3;
      ctx.drawImage(this.icons.hearts[kind], left + 2 + (i % 6) * 12, 6 + Math.floor(i / 6) * 11);
    }
    // Saint's Shroud ready: a little gold mark after the hearts
    if (p.perks.shield && p.shieldReady) {
      const i = containers + Math.ceil(iron / 2);
      ctx.fillStyle = '#f0d880';
      ctx.fillRect(left + 6 + (i % 6) * 12, 10 + Math.floor(i / 6) * 11, 3, 5);
      ctx.fillRect(left + 5 + (i % 6) * 12, 11 + Math.floor(i / 6) * 11, 5, 1);
    }

    // consumables, down the left margin
    const rows = [
      [this.icons.penny, p.pennies],
      [this.icons.keg, p.bombs],
      [this.icons.key, p.keys],
    ];
    rows.forEach(([icon, n], i) => {
      ctx.drawImage(icon, 10, 60 + i * 16);
      drawText(ctx, String(n).padStart(2, '0'), 26, 62 + i * 16, '#d8d0c0');
    });

    // trinket, the Q slot (scroll / potion) and the Seal Fragments
    const slot = (x, frame, label) => {
      ctx.fillStyle = 'rgba(11,10,13,0.75)';
      ctx.fillRect(x, 110, 18, 18);
      ctx.strokeStyle = '#3a3640';
      ctx.strokeRect(x + 0.5, 110.5, 17, 17);
      if (frame >= 0) {
        const ic = this._curioIcon(frame);
        ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, x + 1, 111, 16, 16);
      }
      if (label && !state.input.touchMode) drawText(ctx, label, x + 9, 131, FAINT, { align: 'center', shadow: null });
    };
    slot(8, p.trinket ? CURIO_FRAME.trinket(p.trinket) : -1, null);
    slot(30, p.consumable ? curioFrame(state, p.consumable) : -1, 'Q');
    p.seals.forEach((has, i) => {
      if (!has) return;
      const ic = this._curioIcon(CURIO_FRAME.seal(i));
      ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, 52 + i * 9, 111, 16, 16);
    });

    // relics carried, small, under the slots
    const ids = p.relics;
    ids.forEach((id, i) => {
      const ic = this._relicIcon(id);
      ctx.drawImage(ic.canvas, ic.sx, 0, 16, 16, 8 + (i % 4) * 17, 140 + Math.floor(i / 4) * 17, 16, 16);
    });

    // minimap + floor name
    if (state.floor) {
      if (state.omen === 'lost' && !state.debugReveal) {
        // the Omen of the Lost: no map at all
        drawText(ctx, '?', W - 40, 26, FAINT, { scale: 3, align: 'center' });
        drawText(ctx, state.floorName, W - 8, 52, DIM, { align: 'right' });
        drawText(ctx, state.omenInfo.name.toUpperCase(), W - 8, 62, '#b080e0', { align: 'right' });
      } else {
        const m = drawMinimap(ctx, state.floor, state.room.data.id, state.debugReveal);
        drawText(ctx, state.floorName, m.x + m.w, m.y + m.h + 6, DIM, { align: 'right' });
        if (state.omen) drawText(ctx, state.omenInfo.name.toUpperCase(), m.x + m.w, m.y + m.h + 16, '#b080e0', { align: 'right' });
      }
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
      ctx.fillRect(0, 44, W, 40);
      drawText(ctx, this.bannerDef.name, W / 2, 50, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, this.bannerDef.flavour, W / 2, 70, INK, { align: 'center' });
      ctx.globalAlpha = 1;
    }

    if (this.debugText) drawText(ctx, this.debugText, 6, H - 12, '#9ad07a');
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
    ctx.fillStyle = 'rgba(4,3,6,0.74)';
    ctx.fillRect(0, 0, W, H);
    // the title, with a flickering ember glow behind it
    const flick = 0.85 + 0.15 * Math.sin(this.time * 7) * Math.sin(this.time * 3.1);
    ctx.globalAlpha = 0.35 * flick;
    drawText(ctx, 'BELOW THE KEEP', W / 2 + 1, 63, '#d4521a', { scale: 5, align: 'center', shadow: null });
    ctx.globalAlpha = 1;
    drawText(ctx, 'BELOW THE KEEP', W / 2, 62, GOLD, { scale: 5, align: 'center', shadow: '#3a1206' });
    drawText(ctx, "A DESCENT INTO THE MAD KING'S DUNGEONS", W / 2, 106, DIM, { align: 'center' });

    const touch = state.input.touchMode;
    if (state.seedEntry !== null) {
      drawText(ctx, 'TYPE A SEED', W / 2, 168, INK, { align: 'center' });
      const shown = (state.seedEntry + '________').slice(0, 8);
      const seedText = `${shown.slice(0, 4)}-${shown.slice(4)}`;
      framedBox(ctx, W / 2 - 66, 182, 132, 26);
      drawText(ctx, seedText, W / 2, 188, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, 'ENTER  BEGIN     ESC  BACK', W / 2, 222, DIM, { align: 'center' });
    } else {
      // who descends: the character picker
      const id = state.characterId;
      const ch = CHARACTERS[id];
      const locked = !Save.data.unlocks.characters.includes(id);
      drawCharacter(ctx, id, W / 2 - 32, 118, 2, locked);
      const bob = Math.round(Math.sin(this.time * 4) * 2);
      drawText(ctx, '<', W / 2 - 70 - bob, 144, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, '>', W / 2 + 70 + bob, 144, GOLD, { scale: 2, align: 'center' });
      drawText(ctx, locked ? '???' : `${ch.name.toUpperCase()}, ${ch.title.toUpperCase()}`, W / 2, 188, locked ? DIM : INK, { align: 'center' });
      drawText(ctx, locked ? 'LOCKED: ' + ch.unlock.toUpperCase() : ch.flavour.toUpperCase(), W / 2, 200, DIM, { align: 'center' });
      if (!locked && Math.floor(this.time * 2) % 2 === 0) {
        drawText(ctx, touch ? 'TAP TO BEGIN THE DESCENT' : 'PRESS ENTER TO BEGIN THE DESCENT', W / 2, 222, INK, { align: 'center' });
      }
      drawText(ctx, touch ? 'TAP THE SIDES TO CHOOSE      TAP HERE FOR THE COLLECTION' : 'A / D  CHOOSE      F  SEEDED RUN      C  COLLECTION', W / 2, touch ? H - 52 : 240, DIM, { align: 'center' });
    }

    const st = Save.data.stats;
    drawText(ctx, `RUNS ${st.runsStarted}    VICTORIES ${st.victories}    BOSSES SLAIN ${st.bossesBeaten}    RELICS FOUND ${RELIC_IDS.filter((r) => Save.data.unlocks.itemsSeen.includes(r)).length}/${RELIC_IDS.length}`, W / 2, H - 36, FAINT, {
      align: 'center',
    });
    drawText(ctx, 'THROWN INTO THE DUNGEONS BENEATH THE KEEP. THE ONLY WAY OUT IS DOWN.', W / 2, H - 22, FAINT, { align: 'center' });
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

  _drawPause(state) {
    const ctx = this.ctx;
    const W = RENDER.width;
    const H = RENDER.height;
    ctx.fillStyle = 'rgba(5,4,8,0.72)';
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2;
    drawText(ctx, 'PAUSED', cx, 50, GOLD, { scale: 3, align: 'center' });
    drawText(ctx, 'SEED', cx, 92, DIM, { align: 'center' });
    drawText(ctx, state.seed, cx, 104, INK, { scale: 2, align: 'center' });

    const touchLines = [
      ['>', 'RESUME'],
      ['NEW RUN', 'NEW RUN (NEW SEED)'],
      ['', ''],
      ['LEFT THUMB', 'DRAG TO MOVE'],
      ['RIGHT THUMB', 'DRAG TO SHOOT'],
      ['ITEM / BOMB', 'BUTTONS AT THE TOP RIGHT'],
    ];
    const lines = state.input.touchMode
      ? touchLines
      : [
          ['ESC', 'RESUME'],
          [KEYS.newRun[0].replace('Key', ''), 'NEW RUN (NEW SEED)'],
          ['T', 'QUIT TO TITLE'],
          ['', ''],
          ['WASD', 'MOVE'],
          ['ARROWS', 'SHOOT'],
          ['SPACE / E', 'ACTIVE RELIC / POWDER KEG'],
          ['F3 / F4', 'FPS / LIGHTING-ONLY VIEW'],
          ['F5 / F6 / F7', 'DEBUG: MAP / OPEN SECRETS / NEXT FLOOR'],
        ];
    lines.forEach(([k, v], i) => {
      const y = 140 + i * 12;
      drawText(ctx, k, cx - 8, y, GOLD, { align: 'right' });
      drawText(ctx, v, cx + 8, y, '#b8b0a0');
    });
    // relics carried, with their names
    const p = state.player;
    if (p.relics.length || p.active) this._drawRelicRow(state, H - 60);
    if (!state.input.touchMode) drawText(ctx, 'ADD ?SEED=XXXX-XXXX TO THE URL TO REPLAY A SEED', cx, H - 18, FAINT, { align: 'center' });
  }
}
