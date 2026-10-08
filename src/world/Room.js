import { Encounter } from './Encounter.js';
import { furnishGatehouse, Prisoner } from './Gatehouse.js';
import { ROUTES } from '../data/routes.js';
import * as THREE from 'three';
import { ROOM, FLOOR, LIGHTING, PROPS, PARTICLES, HAZARDS } from '../data/config.js';
import { getSheet, makeTexture } from '../render/Assets.js';
import { makeLitMaterial, Sprite, Animator, LAYER, depthFor, DEPTH_BIAS } from '../render/Sprite.js';
import { CANDLE_FLAMES } from '../render/art/propsArt.js';
import { Breakable } from '../entities/Props.js';
import { Door } from '../entities/Door.js';
import { ItemStand } from '../entities/ItemStand.js';
import { Trapdoor } from '../entities/Trapdoor.js';
import { getLayout, DOOR_TILES } from './Layouts.js';
import { fxRng, Rng, hashString } from '../core/Rng.js';
import { drawText } from '../ui/PixelFont.js';
import { TILESETS } from '../render/art/tilesets.js';
import { NavGrid } from './NavGrid.js';
import { CandlePuzzle, Bookcases, WishingWell, Rug, SwordInStone, TrialChamber, DiceTable, Beggar, Anvil, SealedStair } from './Secrets.js';
import { ENEMIES, CHAMPION, LAYOUT_DIGITS, SPAWN_POOLS } from '../data/enemies.js';
import { championChance, TIER_INFO, bossTier } from '../data/difficulty.js';
import { CHOICE_CHANCE } from '../data/quality.js';
import { WEAPON_CHANCE } from '../data/weapons.js';

const GEM_ROCK_CHANCE = 0.06; // a rock with gems in it (bomb it!)
const GEM_ROCK_LOOT = { penny: 4, purse: 2, ironHeart: 2, bomb: 1, key: 1, chest: 1 };

// A room: one baked background image (floor + walls + matching normal map), plus props, doors,
// lights, flames, collision boxes and hazards - built from the floor generator's room data and
// the text-grid layouts.
//
// Rooms can be 1x1, 2x1, 1x2, 2x2 or L-shaped (in grid cells). Internally a room is a grid of
// 32 px "slots" (15 x 10 per cell). Each slot is either floor or wall, and the wall pieces
// (top wall, side wall, corners, the outer corners of L shapes) are worked out from which
// neighbouring slots are floor. That one rule handles every room shape.
//
// World space: every grid cell of the floor has a fixed place in the world, so neighbouring rooms
// sit side by side and the camera can slide from one to the next.

const T = ROOM.tile;
const CW = ROOM.cellW;
const CH = ROOM.cellH;
const SW = CW / T; // 15 slots per cell across
const SH = CH / T; // 10 slots per cell down

const SOLID_TILES = new Set(['r', 'B', 'A', 'M']);

function weightedKey(rng, weights) {
  let total = 0;
  for (const k in weights) total += weights[k];
  let r = rng.next() * total;
  for (const k in weights) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return Object.keys(weights)[0];
}

function weightedPick(rng, weights) {
  let total = 0;
  for (const w of weights) total += w;
  let r = rng.next() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** World rectangle of a room (from the floor generator's data). */
export function roomRect(data) {
  const x0 = data.minX * CW;
  const y1 = (FLOOR.gridH - data.minY) * CH;
  return { x0, y0: y1 - data.h * CH, x1: x0 + data.w * CW, y1 };
}

export class Room {
  constructor(game, floor, data, seed) {
    this.game = game;
    this.floor = floor;
    this.data = data;
    // cosmetic choices (floor tiles, torches) are seeded per room, so a room looks the same every visit
    this.rng = new Rng(hashString(`${seed}:${floor.number}:${data.id}`));
    this.rect = roomRect(data);
    // which chapter's art to build from (floors set this; see data/chapters.js)
    this.chapter = game.chapterInfo;
    this.ts = this.chapter.tileset;
    this.digits = LAYOUT_DIGITS[this.chapter.enemies];
    this.spawnPools = SPAWN_POOLS[this.chapter.enemies];
    this.W = data.w * CW;
    this.H = data.h * CH;
    this.gw = data.w * SW;
    this.gh = data.h * SH;
    this.solids = [];
    this.hazards = [];
    this.props = [];
    this.sprites = [];
    this.flames = [];
    this.lights = [];
    this.doors = [];
    this.rocks = []; // rocks that bombs can destroy
    this.candles = []; // snuffable candle clusters
    this.features = []; // secrets: candle puzzle, bookcases, well, rug, sword (see world/Secrets.js)
    this.echoT = 2;
    this.stands = []; // relic pedestals and shop stands
    this.trapdoor = null;
    this._shopIndex = 0;
    this.spawns = []; // enemies this room's layout asks for (spawned by the EnemyManager)
    this.locked = false;
    this.lightBudget = ROOM.maxLights;
    this.bounds = {
      x0: this.rect.x0 + ROOM.wallSide,
      x1: this.rect.x1 - ROOM.wallSide,
      y0: this.rect.y0 + ROOM.wallBottom,
      y1: this.rect.y1 - ROOM.wallTop,
    };

    this._buildSlots();
    this._buildDoors();
    this._buildBackground();
    this._buildContents();
    this._buildWallSolids();
    this.nav = new NavGrid(this);
  }

  // ------------------------------------------------------------------------------------------
  // Slot grid helpers
  // ------------------------------------------------------------------------------------------
  slot(c, r) {
    return r * this.gw + c;
  }

  isFloor(c, r) {
    return c >= 0 && r >= 0 && c < this.gw && r < this.gh && this.mask[this.slot(c, r)] === 1;
  }

  tileAt(c, r) {
    return this.isFloor(c, r) ? this.tiles[this.slot(c, r)] : null;
  }

  /** Is this world point standing in shallow water? */
  inWater(x, y) {
    if (!this.hasWater) return false;
    return this.tileAt(Math.floor((x - this.rect.x0) / T), Math.floor((this.rect.y1 - y) / T)) === 'w';
  }

  /** world centre of slot (c, r) */
  slotCenter(c, r) {
    return { x: this.rect.x0 + c * T + T / 2, y: this.rect.y1 - r * T - T / 2 };
  }

  hasCell(x, y) {
    return this.data.cells.some((k) => k.x === x && k.y === y);
  }

  _buildSlots() {
    const { gw, gh, data } = this;
    this.mask = new Uint8Array(gw * gh);
    this.tiles = new Array(gw * gh).fill('.');
    const setFloor = (c, r, ch = '.') => {
      // 'o' is solid stone: not floor at all - the walls are drawn round it (and it blocks like a wall)
      if (ch === 'o') return;
      this.mask[this.slot(c, r)] = 1;
      this.tiles[this.slot(c, r)] = ch;
    };
    for (const cell of data.cells) {
      const cx = (cell.x - data.minX) * SW;
      const cy = (cell.y - data.minY) * SH;
      const layout = getLayout(data.layouts.get(`${cell.x},${cell.y}`));
      for (let r = 0; r < ROOM.rows; r++) {
        for (let c = 0; c < ROOM.cols; c++) setFloor(cx + 1 + c, cy + 2 + r, layout.grid[r][c]);
      }
      // join cells of the same room: the walls between them become floor
      const right = this.hasCell(cell.x + 1, cell.y);
      const down = this.hasCell(cell.x, cell.y + 1);
      if (right) for (let r = 2; r <= 8; r++) for (const c of [SW - 1, SW]) setFloor(cx + c, cy + r);
      if (down) for (let r = 9; r <= 11; r++) for (let c = 1; c <= 13; c++) setFloor(cx + c, cy + r);
      if (right && down && this.hasCell(cell.x + 1, cell.y + 1)) {
        for (let r = 9; r <= 11; r++) for (const c of [SW - 1, SW]) setFloor(cx + c, cy + r);
      }
    }
  }

  // ------------------------------------------------------------------------------------------
  // Doors
  // ------------------------------------------------------------------------------------------
  _doorGeometry(cell, side) {
    // slot coordinates of this cell's door, the door sprite centre and the floor edge it sits on
    const cx = (cell.x - this.data.minX) * SW;
    const cy = (cell.y - this.data.minY) * SH;
    const { x0, y1 } = this.rect;
    const wx = (c) => x0 + c * T;
    const wy = (r) => y1 - r * T;
    switch (side) {
      case 'up':
        return { slotC: cx + 7, slotR: cy, pos: { x: wx(cx + 7) + 16, y: wy(cy) - 32 }, edge: wy(cy + 2), center: wx(cx + 7) + 16, tile: [cx + 7, cy + 2] };
      case 'down':
        return { slotC: cx + 7, slotR: cy + 9, pos: { x: wx(cx + 7) + 16, y: wy(cy + 9) - 16 }, edge: wy(cy + 9), center: wx(cx + 7) + 16, tile: [cx + 7, cy + 8] };
      case 'left':
        return { slotC: cx, slotR: cy + 5, pos: { x: wx(cx) + 16, y: wy(cy + 5) - 16 }, edge: wx(cx + 1), center: wy(cy + 5) - 16, tile: [cx + 1, cy + 5] };
      default:
        return { slotC: cx + 14, slotR: cy + 5, pos: { x: wx(cx + 14) + 16, y: wy(cy + 5) - 16 }, edge: wx(cx + 14), center: wy(cy + 5) - 16, tile: [cx + 13, cy + 5] };
    }
  }

  _buildDoors() {
    this.doorSlots = new Map(); // "c,r" of the wall slot -> connection (for picking wall pieces)
    for (const conn of this.data.connections) {
      const mine = conn.a === this.data.id;
      const cell = mine ? conn.cellA : conn.cellB;
      const side = mine ? conn.sideA : conn.sideB;
      const g = this._doorGeometry(cell, side);
      // keep the tile in front of the door clear so it can never be blocked
      const [tc, tr] = g.tile;
      if (this.isFloor(tc, tr)) this.tiles[this.slot(tc, tr)] = '.';
      this.doorSlots.set(`${g.slotC},${g.slotR}`, { conn, side });
      this.doors.push({ conn, side, g });
    }
  }

  _spawnDoors() {
    this.doors = this.doors.map(({ conn, side, g }) => {
      const d = new Door(this.game, this, conn, side, g.pos, g.edge, g.center);
      if (conn.hidden && conn.hint) {
        const f = d.frontPoint();
        if (side === 'up') this.game.effects.addCrackDust(this, d.center, d.edge - 2, 40, 6);
        else if (side === 'down') this.game.effects.addCrackDust(this, d.center, d.edge + 4, 10, 10);
        else this.game.effects.addCrackDust(this, f.x, f.y, 26, 3);
      }
      return d;
    });
  }

  // ------------------------------------------------------------------------------------------
  // Background: floor tiles + walls baked into one image and one normal map
  // ------------------------------------------------------------------------------------------
  _buildBackground() {
    const { W, H, gw, gh } = this;
    const color = document.createElement('canvas');
    const normal = document.createElement('canvas');
    color.width = normal.width = W;
    color.height = normal.height = H;
    const cctx = color.getContext('2d');
    const nctx = normal.getContext('2d');
    cctx.imageSmoothingEnabled = nctx.imageSmoothingEnabled = false;
    cctx.fillStyle = '#050407';
    cctx.fillRect(0, 0, W, H);
    nctx.fillStyle = 'rgb(128,128,255)';
    nctx.fillRect(0, 0, W, H);

    const stamp = (key, frame, c, r) => {
      const s = getSheet(key);
      const { frameW: fw, frameH: fh } = s.def;
      cctx.drawImage(s.colorCanvas, frame * fw, 0, fw, fh, c * T, r * T, fw, fh);
      nctx.drawImage(s.normalCanvas, frame * fw, 0, fw, fh, c * T, r * T, fw, fh);
    };
    const rng = this.rng;
    const F = (c, r) => this.isFloor(c, r);
    const isPit = (c, r) => this.tileAt(c, r) === 'p';

    // --- floor and pits ---
    for (let r = 0; r < gh; r++) {
      for (let c = 0; c < gw; c++) {
        if (!F(c, r)) continue;
        if (isPit(c, r)) {
          const m = (isPit(c, r - 1) ? 1 : 0) | (isPit(c + 1, r) ? 2 : 0) | (isPit(c, r + 1) ? 4 : 0) | (isPit(c - 1, r) ? 8 : 0);
          stamp(`${this.ts}_pit`, m, c, r);
        } else {
          stamp(`${this.ts}_floor`, weightedPick(rng, TILESETS[this.ts].floorWeights), c, r);
        }
      }
    }
    // straw piles (only where the decor has pixels, in both maps)
    const decor = getSheet(`${this.ts}_decor`);
    for (let r = 0; r < gh; r++) for (let c = 0; c < gw; c++) if (this.tileAt(c, r) === 's') this._stampMasked(cctx, nctx, decor, 0, c * T, r * T);
    // bridges: a walkway with a chasm on both sides gets wooden planks and rope rails
    for (let r = 0; r < gh; r++) {
      for (let c = 0; c < gw; c++) {
        if (!F(c, r) || isPit(c, r)) continue;
        const across = isPit(c - 1, r) && isPit(c + 1, r); // a bridge running up-down
        const along = isPit(c, r - 1) && isPit(c, r + 1); // a bridge running left-right
        if (!across && !along) continue;
        const x = c * T;
        const y = r * T;
        for (let k = 0; k < T; k += 6) {
          cctx.fillStyle = (k / 6) % 2 ? '#5a3c22' : '#6e4a2a';
          if (across) cctx.fillRect(x + 2, y + k, T - 4, 5);
          else cctx.fillRect(x + k, y + 2, 5, T - 4);
          cctx.fillStyle = '#2a1a0e';
          if (across) cctx.fillRect(x + 2, y + k + 5, T - 4, 1);
          else cctx.fillRect(x + k + 5, y + 2, 1, T - 4);
        }
        cctx.fillStyle = '#a08050'; // the ropes
        if (across) {
          cctx.fillRect(x + 1, y, 1, T);
          cctx.fillRect(x + T - 2, y, 1, T);
        } else {
          cctx.fillRect(x, y + 1, T, 1);
          cctx.fillRect(x, y + T - 2, T, 1);
        }
      }
    }
    // shallow water: a sheet of the chapter's water over the floor, a pale rim, ripples, flat and glossy
    const isW = (c, r) => this.tileAt(c, r) === 'w';
    const wpal = (TILESETS[this.ts].pal && TILESETS[this.ts].pal.water) || ['#0c2630', '#123642', '#1e5464', '#4a8ea0'];
    this.hasWater = false;
    for (let r = 0; r < gh; r++) {
      for (let c = 0; c < gw; c++) {
        if (!isW(c, r)) continue;
        this.hasWater = true;
        const x = c * T;
        const y = r * T;
        cctx.globalAlpha = 0.72;
        cctx.fillStyle = wpal[2];
        cctx.fillRect(x, y, T, T);
        cctx.globalAlpha = 0.35;
        cctx.fillStyle = wpal[0]; // deeper toward the middle of the pool
        if (isW(c, r - 1) && isW(c, r + 1) && isW(c - 1, r) && isW(c + 1, r)) cctx.fillRect(x, y, T, T);
        cctx.globalAlpha = 1;
        cctx.fillStyle = wpal[3]; // a bright rim where the water meets the stone
        if (!isW(c, r - 1)) cctx.fillRect(x, y, T, 2);
        if (!isW(c, r + 1)) cctx.fillRect(x, y + T - 2, T, 2);
        if (!isW(c - 1, r)) cctx.fillRect(x, y, 2, T);
        if (!isW(c + 1, r)) cctx.fillRect(x + T - 2, y, 2, T);
        cctx.globalAlpha = 0.8; // ripples
        for (let k = 0; k < 4; k++) cctx.fillRect(x + 3 + Math.floor(rng.next() * (T - 12)), y + 4 + Math.floor(rng.next() * (T - 8)), 3 + Math.floor(rng.next() * 6), 1);
        cctx.globalAlpha = 1;
        nctx.fillStyle = 'rgb(128,128,255)';
        nctx.fillRect(x, y, T, T);
      }
    }

    // --- walls: decide each wall slot's piece from its floor neighbours ---
    const done = new Uint8Array(gw * gh);
    this.torchSpots = [];
    const topRuns = []; // runs of plain top wall, for torch placement
    let run = null;
    for (let r = 0; r < gh; r++) {
      for (let c = 0; c < gw; c++) {
        if (F(c, r) || done[this.slot(c, r)]) {
          run = null;
          continue;
        }
        // top wall (2 slots tall) above a floor slot
        const isTopPair =
          !F(c, r + 1) && (F(c, r + 2) || (F(c - 1, r + 2) && !F(c - 1, r + 1)) || (F(c + 1, r + 2) && !F(c + 1, r + 1)));
        if (isTopPair) {
          done[this.slot(c, r + 1)] = 1;
          const door = this.doorSlots.get(`${c},${r}`);
          let frame;
          if (F(c - 1, r) || F(c - 1, r + 1)) frame = 8; // outer corner, floor on its left
          else if (F(c + 1, r) || F(c + 1, r + 1)) frame = 9; // outer corner, floor on its right
          else if (!F(c, r + 2) && F(c + 1, r + 2)) frame = 6; // top-left corner
          else if (!F(c, r + 2) && F(c - 1, r + 2)) frame = 7; // top-right corner
          else if (door) frame = door.conn.hidden && door.conn.hint ? 10 : rng.int(0, 1);
          else {
            frame = rng.pick([0, 0, 1, 1, 2]);
            if (rng.chance(ROOM.chainChance)) frame = 3;
            else if (rng.chance(ROOM.windowChance)) frame = 4;
            // remember plain stretches for torches
            if (!run || run.r !== r || run.end !== c - 1) {
              run = { r, start: c, end: c };
              topRuns.push(run);
            }
            run.end = c;
          }
          if (frame >= 6 || door) run = null;
          stamp(`${this.ts}_wall_top`, frame, c, r);
          continue;
        }
        run = null;
        const door = this.doorSlots.get(`${c},${r}`);
        const crack = door && door.conn.hidden && door.conn.hint;
        let frame = -1;
        if (F(c - 1, r) && F(c, r - 1)) frame = 8; // outer corner, floor left + above
        else if (F(c + 1, r) && F(c, r - 1)) frame = 9; // outer corner, floor right + above
        else if (F(c + 1, r)) frame = crack ? 10 : rng.int(0, 1); // left wall
        else if (F(c - 1, r)) frame = crack ? 11 : rng.int(2, 3); // right wall
        else if (F(c, r - 1)) frame = crack ? 12 : rng.int(4, 5); // bottom wall
        else if (F(c + 1, r - 1)) frame = 6; // bottom-left corner
        else if (F(c - 1, r - 1)) frame = 7; // bottom-right corner
        if (frame >= 0) stamp(`${this.ts}_wall_side`, frame, c, r);
      }
      run = null;
    }

    // --- torches along plain stretches of top wall, away from doors ---
    const doorCols = new Set();
    for (const { side, g } of this.doors) if (side === 'up') for (let k = -1; k <= 1; k++) doorCols.add(`${g.slotC + k},${g.slotR}`);
    for (const tr of topRuns) {
      if (tr.end - tr.start < 3 || !rng.chance(ROOM.torchChance)) continue;
      for (let c = tr.start + rng.int(1, 3); c <= tr.end - 1; c += ROOM.torchSpacing) {
        if (doorCols.has(`${c},${tr.r}`)) continue;
        stamp(`${this.ts}_wall_top`, 5, c, tr.r);
        this.torchSpots.push({ c, r: tr.r });
      }
    }

    // --- ambient occlusion: floor darkens where it meets walls (stepped, pixel-art style) ---
    const band = (x, y, w, h, a) => {
      cctx.fillStyle = `rgba(0,0,0,${a})`;
      cctx.fillRect(x, y, w, h);
    };
    for (let r = 0; r < gh; r++) {
      for (let c = 0; c < gw; c++) {
        if (!F(c, r) || isPit(c, r)) continue;
        const x = c * T;
        const y = r * T;
        if (!F(c, r - 1)) [0.5, 0.34, 0.2, 0.1].forEach((a, i) => band(x, y + i * 2, T, 2, a));
        if (!F(c - 1, r)) [0.3, 0.15].forEach((a, i) => band(x + i * 2, y, 2, T, a));
        if (!F(c + 1, r)) [0.3, 0.15].forEach((a, i) => band(x + T - 2 - i * 2, y, 2, T, a));
        if (!F(c, r + 1)) [0.3, 0.15].forEach((a, i) => band(x, y + T - 2 - i * 2, T, 2, a));
      }
    }

    // --- the start room has the controls scratched into the floor ---
    if (this.data.type === 'start') {
      const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const lines = touch ? ['LEFT THUMB  MOVE', 'RIGHT THUMB  SHOOT', 'ROLL BUTTON  DODGE'] : ['WASD  MOVE', 'ARROWS  SHOOT', 'SHIFT  ROLL', 'E  BOMB    SPACE  ITEM'];
      cctx.globalAlpha = 0.28;
      lines.forEach((t, i) => drawText(cctx, t, W / 2, 150 + i * 14, '#d8d0c0', { align: 'center', shadow: null }));
      cctx.globalAlpha = 1;
    }

    this.bgColor = makeTexture(color, true);
    this.bgNormal = makeTexture(normal, false);
    this.bgMaterial = makeLitMaterial(this.bgColor, this.bgNormal);
    this.bgMaterial.alphaTest = 0;
    this.bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(W, H), this.bgMaterial);
    this.bgMesh.position.set(this.rect.x0 + W / 2, this.rect.y0 + H / 2, LAYER.background);
    this.game.renderer.scene.add(this.bgMesh);
  }

  _stampMasked(cctx, nctx, sheet, frame, dx, dy) {
    // colour: transparent pixels are skipped automatically.
    // normal map: it is opaque everywhere, so first cut it to the colour's shape ("destination-in").
    const { frameW: w, frameH: h } = sheet.def;
    cctx.drawImage(sheet.colorCanvas, frame * w, 0, w, h, dx, dy, w, h);
    const tmp = document.createElement('canvas');
    tmp.width = w;
    tmp.height = h;
    const t = tmp.getContext('2d');
    t.drawImage(sheet.normalCanvas, frame * w, 0, w, h, 0, 0, w, h);
    t.globalCompositeOperation = 'destination-in';
    t.drawImage(sheet.colorCanvas, frame * w, 0, w, h, 0, 0, w, h);
    nctx.drawImage(tmp, dx, dy);
  }

  // ------------------------------------------------------------------------------------------
  // Contents: props, lights, flames, hazards
  // ------------------------------------------------------------------------------------------
  _addLight(opts) {
    if (this.lightBudget <= 0) return null;
    const l = this.game.lighting.add(opts);
    if (l) {
      this.lights.push(l);
      this.lightBudget--;
    }
    return l;
  }

  _buildContents() {
    const effects = this.game.effects;
    const destroyed = this.data.destroyed;
    const deferredCandles = [];
    const puzzleStands = [];
    const bookSpots = [];
    let tablet = null;

    for (let r = 0; r < this.gh; r++) {
      for (let c = 0; c < this.gw; c++) {
        const ch = this.tileAt(c, r);
        if (!ch || ch === '.' || ch === 's' || ch === 'p' || ch === 'w') {
          if (ch === 'p') {
            // pits block walking but not stones
            const { x, y } = this.slotCenter(c, r);
            this.solids.push({ x0: x - 15, x1: x + 15, y0: y - 15, y1: y + 15, owner: null, pit: true });
          }
          continue;
        }
        const { x, y } = this.slotCenter(c, r);
        const ground = y - 12;
        const key = `${c},${r}`;
        if (ch === 'r') {
          if (destroyed.has(key)) this._staticSprite('rock_rubble', x, ground, 2, null, LAYER.floorDecal);
          else {
            const rock = { key, x, ground, sprites: [] };
            const rs = this._staticSprite(`${this.ts}_rock`, x, ground, 2, 3);
            rs.setFrame(Math.abs(hashString(`${this.data.id}:${key}`)) % 3, 0); // which of the chapter's three obstacles
            rock.sprites.push(rs);
            rock.sprites.push(this.sprites[this.sprites.length - 1]); // its shadow
            // now and then a rock has gems in it: blow it up for a reward
            rock.gem = new Rng(hashString(`${this.game.seed}:${this.floor.number}:${this.data.id}:${key}`)).chance(GEM_ROCK_CHANCE);
            if (rock.gem) {
              const glint = new Sprite(this.game.renderer.scene, 'chests', { lit: false, glow: 1.2, anchorY: 0 });
              glint.setFrame(6, 0);
              glint.place(x, ground + 2, 0, depthFor(ground) + DEPTH_BIAS * 2);
              this.sprites.push(glint);
              rock.sprites.push(glint);
            }
            rock.solid = { x0: x - PROPS.rock.halfSize, x1: x + PROPS.rock.halfSize, y0: ground - 2, y1: ground + 18, owner: null };
            this.solids.push(rock.solid);
            this.rocks.push(rock);
          }
        } else if (ch === 'b') {
          this.props.push(new Breakable(this.game, this, 'barrel', x, ground, key, destroyed.has(key)));
        } else if (ch === 'e' || this.digits[ch]) {
          this._addSpawn(ch, c, r, x, y);
        } else if (ch === 'x') {
          const s = new Sprite(this.game.renderer.scene, `${this.ts}_spikes`, { anchorY: 0 });
          s.place(x, y - 16, 0, LAYER.floorDecal);
          this.sprites.push(s);
          const k = HAZARDS.spikeInset;
          this.hazards.push({ x0: x - 16 + k, x1: x + 16 - k, y0: y - 16 + k, y1: y + 16 - k, damage: HAZARDS.spikeDamage });
        } else if (ch === 'B') {
          this._staticSprite('brazier', x, ground, 1, 3);
          this._addFlame('flame_big', x, ground + 16, depthFor(ground) + DEPTH_BIAS);
          this._addLight({ ...LIGHTING.brazier, x, y: ground + 4 });
          effects.addEmberSource(this, x, ground, 30, PARTICLES.embers.perSecondBrazier, 6);
          const hs = PROPS.brazier.halfSize;
          this.solids.push({ x0: x - hs, x1: x + hs, y0: ground - 1, y1: ground + 10, owner: null });
        } else if (ch === 'A') {
          // the relic on it is chosen once per pedestal (seeded) and remembered.
          // In a Shrine of the Old God it costs a heart container (a dark deal).
          // Some treasure rooms offer a choice of two: take one and the other crumbles.
          if (!this.data.pedestals) this.data.pedestals = {};
          if (!this.data.pedestals[key]) {
            const hearts = this.data.type === 'shrine' ? 2 : 0;
            const slot = { kind: 'relic', id: this.game.pickRelic(this.data.type, this.rng), price: 0, hearts, gone: false };
            // now and then a treasure room holds a weapon instead
            if (this.data.type === 'armoury' && this.rng.chance(WEAPON_CHANCE.armoury)) {
              const wid = this.game.pickWeapon(this.rng);
              if (wid) {
                slot.kind = 'weapon';
                slot.id = wid;
              }
            }
            this.data.pedestals[key] = slot;
            if (this.rng.chance(CHOICE_CHANCE[this.data.type] || 0)) {
              const other = { kind: 'relic', id: this.game.pickRelic(this.data.type, this.rng), price: 0, hearts, gone: false };
              if (other.id) {
                slot.choiceOf = [other];
                other.choiceOf = [slot];
                slot.pair = other;
              }
            }
          }
          const slot = this.data.pedestals[key];
          const hs = PROPS.pedestal.halfSize;
          const spots = slot.pair ? [[x - 26, slot], [x + 26, slot.pair]] : [[x, slot]];
          for (const [sx, s] of spots) {
            this._staticSprite('pedestal', sx, ground, 2, 3);
            this.solids.push({ x0: sx - hs, x1: sx + hs, y0: ground - 2, y1: ground + 12, owner: null });
            if (s.id) this.stands.push(new ItemStand(this.game, this, sx, ground, s, null));
          }
        } else if (ch === 'S') {
          // merchant's stand: slot 0 a relic, the rest pickups
          if (!this.data.shop) this.data.shop = [];
          const i = this._shopIndex++;
          if (!this.data.shop[i]) this.data.shop[i] = this.game.stockShopSlot(i, this.rng);
          this.stands.push(new ItemStand(this.game, this, x, ground, this.data.shop[i], 'shop_stand'));
        } else if (ch === 'K') {
          // the floor's boss (or, behind the sealed door, the Hollow Crown)
          const boss = this.data.type === 'crown' ? 'crownwraith' : this.game.bossForFloor();
          if (!this.data.cleared) this.spawns.push({ type: boss, x, y: y - 6, count: 1, champion: false });
        } else if (ch === 'G') {
          this._staticSprite('idol', x, ground - 6, 2, 3);
          this._addLight({ ...LIGHTING.brazier, color: 0xff3a20, brightness: 0.6, x, y: ground + 10 });
          this.solids.push({ x0: x - 13, x1: x + 13, y0: ground - 6, y1: ground + 10, owner: null });
        } else if (ch === 'Y') {
          this._staticSprite('chapel_altar', x, ground - 2, 2, 3);
          this._addLight({ ...LIGHTING.candle, color: 0xfff0c0, brightness: 1.1, x, y: ground + 10 });
          this.solids.push({ x0: x - 14, x1: x + 14, y0: ground - 2, y1: ground + 12, owner: null });
        } else if (ch === 'T') {
          puzzleStands.push({ x, ground });
          this.solids.push({ x0: x - 5, x1: x + 5, y0: ground - 2, y1: ground + 6, owner: null });
        } else if (ch === 'H') {
          tablet = { x, ground };
          this._staticSprite('tablet', x, ground - 2, 2, 3);
          this.solids.push({ x0: x - 12, x1: x + 12, y0: ground - 2, y1: ground + 10, owner: null });
        } else if (ch === 'L') {
          bookSpots.push({ c, r });
        } else if (ch === 'W') {
          this.features.push(new WishingWell(this, x, ground));
        } else if (ch === 'Q') {
          this.features.push(new Encounter(this, x, ground));
        } else if (ch === 'U') {
          this.features.push(new Rug(this, x, y));
        } else if (ch === 'X') {
          this.features.push(new SwordInStone(this, x, ground));
        } else if (ch === 'D') {
          this.features.push(new DiceTable(this, x, ground));
        } else if (ch === 'F') {
          this.features.push(new Anvil(this, x, ground)); // the forge: the Blacksmith's Anvil
        } else if (ch === 'N') {
          this.features.push(new Beggar(this, x, ground));
        } else if (ch === 'M') {
          this._staticSprite('merchant_table', x, ground, 2, 3);
          this._addLight({ ...LIGHTING.lantern, x, y: ground + 8 });
          const hs = PROPS.table.halfSize;
          this.solids.push({ x0: x - hs, x1: x + hs, y0: ground - 2, y1: ground + 10, owner: null });
        } else if (ch === 'c') {
          deferredCandles.push({ x, ground, key });
        }
      }
    }

    // wall torches (after braziers so the big lights get the light budget first)
    for (const { c, r } of this.torchSpots) {
      const x = this.rect.x0 + c * T + T / 2;
      const rag = this.rect.y1 - r * T - 24; // world y of the torch rag (see cellsWallTop variant 5)
      const floorEdge = this.rect.y1 - (r + 2) * T;
      this._addFlame(this.chapter.torch.flame, x, rag - 3, LAYER.wall);
      this._addLight({ ...LIGHTING.torch, color: this.chapter.torch.color, x, y: floorEdge - 4 });
      effects.addEmberSource(this, x, rag + 6, 0, PARTICLES.embers.perSecondTorch, 2);
    }

    if (puzzleStands.length && tablet) this.features.push(new CandlePuzzle(this, puzzleStands, tablet));
    if (this.data.type === 'trial') this.features.push(new TrialChamber(this));
    // a Sealed Stair down to a secret realm
    const re = this.game.realmEntrance;
    if (re && re.roomId === this.data.id) this.features.push(new SealedStair(this, re.realm));
    if (bookSpots.length) this.features.push(new Bookcases(this, bookSpots));
    if (this.data.type === 'gatehouse') this.features.push(...furnishGatehouse(this));
    const pr = this.game.prisonerHere;
    if (pr && pr.roomId === this.data.id) this.features.push(new Prisoner(this, pr.id));
    // rewards that rose up after a secret was solved
    for (const e of this.data.extraStands || []) this._rewardPedestal(e.x, e.ground, e.slot);

    for (const { x, ground, key } of deferredCandles) {
      const s = this._staticSprite('candles', x, ground, 4, null);
      const left = Math.round(x) - 16;
      const top = Math.round(ground) - 4 + 32;
      // candles can be snuffed with a stone (Candle Wraiths draw their power from them)
      const candle = { x, ground, key, flames: [], light: null, lit: !this.data.destroyed.has(key) };
      if (candle.lit) {
        for (const [fx, fy] of CANDLE_FLAMES) candle.flames.push(this._addFlame('flame_small', left + fx + 0.5, top - fy, s.mesh.position.z + DEPTH_BIAS));
        candle.light = this._addLight({ ...LIGHTING.candle, x, y: ground + 4 });
      }
      this.candles.push(candle);
    }

    // boss doors glow red from inside the boss room
    if (this.data.type === 'boss') {
      for (const d of this.doors) {
        const p = d.g.pos;
        this._addLight({ ...LIGHTING.bossGlow, x: p.x, y: p.y });
      }
    }

    // a beaten boss leaves a stairway down and a relic
    if (this.data.type === 'boss' && this.data.cleared) this.addBossRewards();

    this._spawnDoors();
  }

  /** Solid boxes for every wall slot inside the room's bounding box (needed for L-shaped rooms). */
  _buildWallSolids() {
    for (let r = 2; r < this.gh - 1; r++) {
      let start = -1;
      for (let c = 1; c <= this.gw - 1; c++) {
        const wall = c < this.gw - 1 && !this.isFloor(c, r);
        if (wall && start < 0) start = c;
        if (!wall && start >= 0) {
          this.solids.push({
            x0: this.rect.x0 + start * T,
            x1: this.rect.x0 + c * T,
            y0: this.rect.y1 - (r + 1) * T,
            y1: this.rect.y1 - r * T,
            owner: null,
          });
          start = -1;
        }
      }
    }
  }

  _staticSprite(key, x, ground, anchorY, shadowSize, z) {
    const scene = this.game.renderer.scene;
    const s = new Sprite(scene, key, { anchorY });
    s.place(x, ground, 0, z);
    this.sprites.push(s);
    if (shadowSize !== null) {
      const sh = new Sprite(scene, 'shadows', { shadow: true });
      sh.setFrame(shadowSize, 0);
      sh.place(x, ground - 4, 0, LAYER.shadow);
      this.sprites.push(sh);
    }
    return s;
  }

  _addFlame(key, x, bottomY, z) {
    const s = new Sprite(this.game.renderer.scene, key, { lit: false, glow: LIGHTING.flameIntensity });
    s.place(x, bottomY, 0, z);
    const a = new Animator(s);
    a.play('burn');
    a.time = fxRng.float(0, 10); // flames out of sync with each other
    this.flames.push(a);
    this.sprites.push(s);
    return s;
  }

  /** Put out a candle (remembered, like broken barrels). */
  snuffCandle(candle) {
    if (!candle.lit) return;
    candle.lit = false;
    for (const f of candle.flames) f.visible = false;
    if (candle.light) {
      this.game.lighting.remove(candle.light);
      this.lights.splice(this.lights.indexOf(candle.light), 1);
      candle.light = null;
    }
    this.data.destroyed.add(candle.key);
    this.game.effects.burst(this.game.effects.presets.smoke, candle.x, candle.ground + 14, 14, 8, 20, 20);
    this.game.audio.play('snuff');
  }

  get litCandles() {
    let n = 0;
    for (const c of this.candles) if (c.lit) n++;
    return n;
  }

  // ------------------------------------------------------------------------------------------
  // Running the room
  // ------------------------------------------------------------------------------------------

  /** How many stand-in enemies are still standing. */
  get enemiesAlive() {
    return this.game.enemies.countAlive(this);
  }

  onPropBroken() {
    this.nav.markDirty(); // a smashed barrel opens up a path
  }

  /**
   * Remember an enemy spawn from the layout. 'e' picks an enemy from the difficulty pool of the
   * layout it came from; digits name a specific enemy. All choices use the room's SEEDED rng.
   */
  _addSpawn(ch, c, r, x, y) {
    let type = this.digits[ch];
    if (!type) {
      const cell = this._cellOfSlot(c, r);
      const layout = getLayout(this.data.layouts.get(`${cell.x},${cell.y}`));
      type = weightedKey(this.rng, this.spawnPools[layout.pool || 'easy']);
    }
    const def = ENEMIES[type];
    const count = def.packSize ? this.rng.int(def.packSize[0], def.packSize[1]) : 1;
    const horde = this.game.oath('horde') ? 0.22 : 0; // the Oath of the Horde
    const champion = this.rng.chance(championChance(CHAMPION.chance, this.game.floorNumber) * (this.game.omen === 'hunt' ? 3 : 1) + horde + ((this.game.route && ROUTES[this.game.route].champions) || 0));
    // enemies stand at the middle of their tile (y is where their feet are);
    // a mimic stands exactly where a real barrel would
    this.spawns.push({ type, x, y: type === 'mimic' ? y - 12 : y - 6, count, champion });
  }

  _cellOfSlot(c, r) {
    return { x: this.data.minX + Math.floor(c / SW), y: this.data.minY + Math.floor(r / SH) };
  }

  /** Camera centre for a player position: follows inside big rooms, fixed in 1x1 rooms. */
  cameraTarget(px, py) {
    const hw = 320;
    const hh = 180;
    const { x0, x1, y0, y1 } = this.rect;
    const loX = x0 - 80 + hw;
    const hiX = x1 + 80 - hw;
    const loY = y0 + hh;
    const hiY = y1 + ROOM.hudBand - hh;
    return {
      x: loX >= hiX ? (x0 + x1) / 2 : Math.max(loX, Math.min(hiX, px)),
      y: loY >= hiY ? loY : Math.max(loY, Math.min(hiY, py)),
    };
  }

  /** Trapdoor to the next floor + a relic pedestal from the boss pool. */
  /** A pedestal that rises with a reward (a solved secret). Remembered in the room's data. */
  addRewardPedestal(x, ground, slot) {
    if (!slot.id) return;
    if (!this.data.extraStands) this.data.extraStands = [];
    this.data.extraStands.push({ x, ground, slot });
    this._rewardPedestal(x, ground, slot);
    this.game.effects.relicBurst(x, ground + 18);
    this.nav.markDirty();
  }

  _rewardPedestal(x, ground, slot) {
    this._staticSprite('pedestal', x, ground, 2, 3);
    this.solids.push({ x0: x - 11, x1: x + 11, y0: ground - 2, y1: ground + 12, owner: null });
    this.stands.push(new ItemStand(this.game, this, x, ground, slot, null));
  }

  /** A sling stone reached (x, y): candles and puzzle stands can be snuffed. True if used up. */
  stoneHit(x, y) {
    for (const c of this.candles) {
      if (c.lit && (x - c.x) ** 2 + (y - (c.ground + 6)) ** 2 < 100) {
        this.snuffCandle(c);
        return true;
      }
    }
    for (const f of this.features) if (f.stoneHit && f.stoneHit(x, y)) return true;
    return false;
  }

  /** The last enemy fell. A feature (the Trial Chamber) may want the doors kept shut. */
  onCleared() {
    for (const f of this.features) if (f.onCleared && f.onCleared()) return true;
    return false;
  }

  /** A powder keg went off in this room. */
  explosion(x, y, r) {
    for (const f of this.features) if (f.explosion) f.explosion(x, y, r);
  }

  addBossRewards() {
    if (this.trapdoor) return;
    if (this.game.chapterKey === 'throne' && !this.game.deep) return; // the end of the road (unless you hunt the crown below)
    if (this.game.chapterKey === 'vault' && !this.data.sealDropped) {
      // the Keeper guarded the Seal of Bone
      this.data.sealDropped = true;
      const c = this.slotCenter(7, 4);
      if (!this.game.player.seals[0]) this.game.pickups.spawn(this, 'curio', c.x - 40, c.y, true, { type: 'seal', id: 0 });
    }
    const c = this.slotCenter(7, 6);
    this.trapdoor = new Trapdoor(this.game, c.x, c.y, false, !!this.data.stairOpen); // grinds open once
    this.data.stairOpen = true;
    const top = this.slotCenter(7, 3);
    // the tougher the boss, the better the spoils (and a Deadly or Legendary one offers a choice)
    const reward = this.data.type === 'boss' ? TIER_INFO[this.game.bossTierOf(this.game.bossForFloor())].reward : {};
    if (!this.data.pedestal && this.game.realm && this.data.type === 'boss') {
      // a secret boss's spoils: a weapon AND a rare relic, both yours (no choosing)
      const slot = { kind: 'relic', id: this.game.pickRelic('boss', this.rng, { minQuality: 3, bias: 1 }), price: 0, gone: false };
      const wid = this.game.pickWeapon(this.rng, { minQuality: 2, bias: 1 });
      slot.pair = wid ? { kind: 'weapon', id: wid, price: 0, gone: false } : { kind: 'relic', id: this.game.pickRelic('boss', this.rng, { minQuality: 3, bias: 1 }), price: 0, gone: false };
      this.data.pedestal = slot;
    }
    if (!this.data.pedestal) {
      const slot = { kind: 'relic', id: this.game.pickRelic('boss', this.rng, reward), price: 0, gone: false };
      if (reward.choice) {
        const other = { kind: 'relic', id: this.game.pickRelic('boss', this.rng, reward), price: 0, gone: false };
        // a deadly boss's second pedestal may hold a weapon
        if (this.rng.chance(WEAPON_CHANCE.bossChoice)) {
          const wid = this.game.pickWeapon(this.rng, { minQuality: 2, bias: 1 });
          if (wid) {
            other.kind = 'weapon';
            other.id = wid;
          }
        }
        if (other.id) {
          slot.choiceOf = [other];
          other.choiceOf = [slot];
          slot.pair = other;
        }
      }
      // the Bloodied Road: its boss guards an extra relic (both yours)
      if (this.data.type === 'boss' && this.game.route && ROUTES[this.game.route].bossBonus && !slot.pair) {
        const extra = this.game.pickRelic('boss', this.rng, { minQuality: 2 });
        if (extra) slot.pair = { kind: 'relic', id: extra, price: 0, gone: false };
      }
      this.data.pedestal = slot;
      if (reward.chest) {
        const cc = this.slotCenter(3, 5);
        this.game.pickups.spawn(this, 'ironchest', cc.x, cc.y);
      }
    }
    const slot = this.data.pedestal;
    const spots = slot.pair ? [[top.x - 26, slot], [top.x + 26, slot.pair]] : [[top.x, slot]];
    for (const [sx, s] of spots) {
      if (!s.id) continue;
      this._staticSprite('pedestal', sx, top.y - 12, 2, 3);
      this.solids.push({ x0: sx - 11, x1: sx + 11, y0: top.y - 14, y1: top.y, owner: null });
      this.stands.push(new ItemStand(this.game, this, sx, top.y - 12, s, null));
    }
  }

  /** Bombs: blow every rock within r of (x, y) into rubble (remembered). */
  destroyRocksNear(x, y, r) {
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const rock = this.rocks[i];
      if (Math.hypot(rock.x - x, rock.ground + 8 - y) > r + 10) continue;
      for (const sp of rock.sprites) sp.visible = false;
      this.removeSolid(rock.solid);
      this._staticSprite('rock_rubble', rock.x, rock.ground, 2, null, LAYER.floorDecal);
      this.data.destroyed.add(rock.key);
      this.game.effects.burst(this.game.effects.presets.stoneChip, rock.x, rock.ground + 8, 12, 16, 140, 140);
      if (rock.gem) {
        // the gems spill out
        const g = this.game;
        g.audio.play('secret', 0.6);
        g.effects.burst(g.effects.presets.gold, rock.x, rock.ground + 8, 10, 18, 90, 90);
        g.dropFrom(GEM_ROCK_LOOT, rock.x, rock.ground + 8, 3);
      }
      this.rocks.splice(i, 1);
      this.nav.markDirty();
    }
  }

  update(dt) {
    for (let i = 0; i < this.flames.length; i++) this.flames[i].update(dt);
    for (let i = 0; i < this.features.length; i++) if (this.features[i].update) this.features[i].update(dt);
    this._echo(dt);
    for (let i = 0; i < this.props.length; i++) this.props[i].update(dt);
    for (let i = 0; i < this.stands.length; i++) this.stands[i].update(dt);
    if (this.trapdoor) this.trapdoor.update(dt);
  }

  sync() {
    for (let i = 0; i < this.props.length; i++) this.props[i].sync();
    for (let i = 0; i < this.doors.length; i++) this.doors[i].sync();
    for (let i = 0; i < this.stands.length; i++) this.stands[i].sync();
  }

  drawOverlay(o, time = 0) {
    for (let i = 0; i < this.stands.length; i++) this.stands[i].drawOverlay(o);
    for (let i = 0; i < this.features.length; i++) if (this.features[i].drawOverlay) this.features[i].drawOverlay(o, time);
  }

  /** Near the hidden wall of a super-secret room you hear a faint echo now and then. */
  _echo(dt) {
    if (this.game.room !== this) return;
    this.echoT -= dt;
    if (this.echoT > 0) return;
    this.echoT = 2.6;
    const pl = this.game.player;
    for (const d of this.doors) {
      const c = d.conn;
      if (!c.hidden || c.hint || c.sealed || c.illusory) continue;
      const f = d.frontPoint();
      const dist = Math.hypot(pl.x - f.x, pl.y - f.y);
      if (dist < 90) this.game.audio.play('echo', 0.9 - dist / 120);
    }
  }

  removeSolid(solid) {
    const i = this.solids.indexOf(solid);
    if (i >= 0) this.solids.splice(i, 1);
  }

  dispose() {
    const scene = this.game.renderer.scene;
    this.game.enemies.releaseRoom(this);
    for (const s of this.sprites) s.dispose(scene);
    for (const p of this.props) p.dispose();
    for (const st of this.stands) st.dispose();
    if (this.trapdoor) this.trapdoor.dispose();
    for (const f of this.features) if (f.dispose) f.dispose();
    this.game.pickups.releaseRoom(this);
    for (const d of this.doors) d.dispose();
    for (const l of this.lights) this.game.lighting.remove(l);
    this.game.effects.removeSources(this);
    scene.remove(this.bgMesh);
    this.bgMaterial.dispose();
    this.bgColor.dispose();
    this.bgNormal.dispose();
    this.bgMesh.geometry.dispose();
  }
}

export { DOOR_TILES };
