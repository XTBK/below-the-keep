import * as THREE from 'three';
import { Sprite, LAYER, depthFor } from '../render/Sprite.js';
import { SYMBOLS } from '../render/art/secretsArt.js';
import { ItemStand } from '../entities/ItemStand.js';
import { Trapdoor } from '../entities/Trapdoor.js';
import { nextPage, randomCurio } from '../items/Curios.js';
import { RELICS, ROOM_DROPS } from '../data/items.js';
import { PLAYER, LIGHTING } from '../data/config.js';
import { Save } from '../core/Save.js';
import { quality, QUALITY_NAMES, ANVIL } from '../data/quality.js';

// The secrets hidden in feature rooms. Each is a small object the Room owns, with any of:
//   update(dt)            every frame while you're in the room
//   stoneHit(x, y)        a sling stone reached (x, y): return true if it was used up here
//   explosion(x, y, r)    a powder keg went off
//   drawOverlay(o, time)  glowing symbols / hints on the telegraph overlay
//   dispose()
// What happened to them is stored in the room's data, so it's remembered when you come back.

const T = 32;
const RUNE = new THREE.Color(1.6, 0.9, 0.35);
const RUNE_DIM = new THREE.Color(0.45, 0.3, 0.2);
const RUNE_DONE = new THREE.Color(0.5, 1.4, 0.7);

function drawRune(o, k, x, y, c, a) {
  SYMBOLS[k].forEach((row, j) => {
    for (let i = 0; i < 5; i++) if (row[i] === '#') o.dot(x - 2 + i, y + 4 - j, 3, c, a);
  });
}

/** Give the reward a secret promises: a Seal Fragment if Wren lacks it, otherwise something good. */
function sealOrRelic(game, room, seal, x, ground) {
  if (!game.player.seals[seal] && !game.sealsGiven.has(seal)) {
    game.sealsGiven.add(seal);
    Save.data.stats.sealsFound++;
    game.pickups.spawn(room, 'curio', x, ground + 8, true, { type: 'seal', id: seal });
    return;
  }
  room.addRewardPedestal(x, ground, { kind: 'relic', id: game.pickRelic('secret', game.dropRng), price: 0, gone: false });
}

// ---------------------------------------------------------------------------------------------
// The candle puzzle: four stands, each with a symbol. The tablet shows an order. Snuff them in
// that order (with stones) to win the Seal of Flame. A wrong one, and they all flare back up.
// ---------------------------------------------------------------------------------------------
export class CandlePuzzle {
  constructor(room, stands, tablet) {
    this.room = room;
    this.game = room.game;
    const d = room.data;
    if (!d.puzzle) {
      // which symbol each stand wears, and the order to snuff them in (seeded by the room)
      const syms = [0, 1, 2, 3];
      room.rng.shuffle(syms);
      const order = [0, 1, 2, 3];
      room.rng.shuffle(order);
      d.puzzle = { syms, order, solved: false };
    }
    this.p = d.puzzle;
    this.tablet = tablet;
    this.progress = 0;
    this.relightT = 0;
    this.stands = stands.map((s, i) => {
      const sprite = room._staticSprite('puzzle_stand', s.x, s.ground, 1, 1);
      sprite.setFrame(this.p.solved ? 1 : 0, 0);
      const light = this.p.solved ? null : room._addLight({ ...LIGHTING.candle, x: s.x, y: s.ground + 10 });
      return { ...s, sym: this.p.syms[i], lit: !this.p.solved, sprite, light };
    });
  }

  stoneHit(x, y) {
    if (this.p.solved || this.relightT > 0) return false;
    for (const s of this.stands) {
      if (!s.lit || (x - s.x) ** 2 + (y - (s.ground + 14)) ** 2 > 150) continue;
      this._snuff(s);
      if (s.sym === this.p.order[this.progress]) {
        this.progress++;
        this.game.audio.play('snuff');
        if (this.progress === 4) this._solve();
      } else {
        // wrong! they all flare back up
        this.game.audio.play('deny');
        this.relightT = 0.7;
      }
      return true;
    }
    return false;
  }

  _snuff(s) {
    s.lit = false;
    s.sprite.setFrame(1, 0);
    if (s.light) s.light.brightness = 0;
    this.game.effects.burst(this.game.effects.presets.smoke, s.x, s.ground + 26, 2, 6, 15, 20);
  }

  _solve() {
    this.p.solved = true;
    const g = this.game;
    g.audio.play('secret');
    g.feel.shake(0.4);
    Save.data.stats.secretsFound++;
    const c = this.tablet;
    sealOrRelic(g, this.room, 1, c.x, c.ground - 40);
  }

  update(dt) {
    if (this.relightT > 0) {
      this.relightT -= dt;
      if (this.relightT <= 0) {
        this.progress = 0;
        for (const s of this.stands) {
          s.lit = true;
          s.sprite.setFrame(0, 0);
          if (s.light) s.light.brightness = LIGHTING.candle.brightness;
          this.game.effects.fireBurst(s.x, s.ground + 26);
        }
      }
    }
  }

  drawOverlay(o, time) {
    // each stand's symbol glows on the floor in front of it
    for (const s of this.stands) drawRune(o, s.sym, s.x, s.ground - 6, this.p.solved ? RUNE_DONE : s.lit ? RUNE : RUNE_DIM, 0.8);
    // the tablet: the order, carved left to right
    const t = this.tablet;
    for (let i = 0; i < 4; i++) {
      const done = this.p.solved || i < this.progress;
      drawRune(o, this.p.order[i], t.x - 10.5 + i * 7, t.ground + 16, done ? RUNE_DONE : RUNE, 0.7 + 0.2 * Math.sin(time * 3 + i));
    }
  }
}

// ---------------------------------------------------------------------------------------------
// Bookcases: walk into one for a moment and it slides a tile. One hides something underneath.
// ---------------------------------------------------------------------------------------------
export class Bookcases {
  constructor(room, spots) {
    this.room = room;
    this.game = room.game;
    const d = room.data;
    if (!d.books) {
      d.books = spots.map((s) => ({ c: s.c, r: s.r }));
      d.bookSecret = Math.floor(room.rng.next() * spots.length); // which one hides the treasure
      d.bookFound = false;
    }
    this.d = d;
    // the layout's bookcases may have been pushed elsewhere on an earlier visit
    for (const s of spots) room.tiles[room.slot(s.c, s.r)] = '.';
    this.cases = d.books.map((b, i) => {
      room.tiles[room.slot(b.c, b.r)] = 'L';
      const { x, y } = room.slotCenter(b.c, b.r);
      const ground = y - 12;
      const sprite = new Sprite(room.game.renderer.scene, 'bookcase', { anchorY: 2 });
      sprite.setFrame(i === d.bookSecret && !d.bookFound ? 1 : 0, 0);
      room.sprites.push(sprite);
      const solid = { x0: x - 15, x1: x + 15, y0: ground - 2, y1: ground + 14, owner: null };
      room.solids.push(solid);
      return { i, b, x, ground, sprite, solid, push: 0, dir: null, slide: null };
    });
    for (const c of this.cases) c.sprite.place(c.x, c.ground);
  }

  update(dt) {
    const pl = this.game.player;
    const input = this.game.input;
    for (const k of this.cases) {
      if (k.slide) {
        k.slide.t += dt / 0.25;
        const t = Math.min(1, k.slide.t);
        k.x = k.slide.x0 + (k.slide.x1 - k.slide.x0) * t;
        k.ground = k.slide.g0 + (k.slide.g1 - k.slide.g0) * t;
        k.sprite.place(k.x, k.ground, 0, depthFor(k.ground));
        if (t >= 1) {
          k.slide = null;
          this._setSolid(k);
        }
        continue;
      }
      // is Wren pressing against this side of it?
      const s = k.solid;
      const r = PLAYER.radius + 1.5;
      let dir = null;
      if (input.moveX > 0.5 && Math.abs(pl.x + r - s.x0) < 2.5 && pl.y > s.y0 - 2 && pl.y < s.y1 + 2) dir = [1, 0];
      else if (input.moveX < -0.5 && Math.abs(pl.x - r - s.x1) < 2.5 && pl.y > s.y0 - 2 && pl.y < s.y1 + 2) dir = [-1, 0];
      else if (input.moveY > 0.5 && Math.abs(pl.y + r - s.y0) < 2.5 && pl.x > s.x0 - 2 && pl.x < s.x1 + 2) dir = [0, -1];
      else if (input.moveY < -0.5 && Math.abs(pl.y - r - s.y1) < 2.5 && pl.x > s.x0 - 2 && pl.x < s.x1 + 2) dir = [0, 1];
      if (!dir) {
        k.push = 0;
        continue;
      }
      k.push += dt;
      if (k.push >= 0.35) {
        k.push = 0;
        this._tryMove(k, dir[0], dir[1]);
      }
    }
  }

  _tryMove(k, dc, dr) {
    const room = this.room;
    const c = k.b.c + dc;
    const r = k.b.r + dr;
    const t = room.tileAt(c, r);
    if (t !== '.' && t !== 's') {
      this.game.audio.play('thud', 0.3);
      return;
    }
    // never shove a bookcase in front of a door
    for (const d of room.doors) if (d.g && d.g.tile[0] === c && d.g.tile[1] === r) return;
    if (room.doorTiles && room.doorTiles.has(`${c},${r}`)) return;
    const from = { c: k.b.c, r: k.b.r };
    room.tiles[room.slot(from.c, from.r)] = '.';
    room.tiles[room.slot(c, r)] = 'L';
    k.b.c = c;
    k.b.r = r;
    const to = room.slotCenter(c, r);
    k.slide = { t: 0, x0: k.x, g0: k.ground, x1: to.x, g1: to.y - 12 };
    room.removeSolid(k.solid);
    room.nav.markDirty();
    this.game.audio.play('woodHit', 0.6);
    this.game.effects.landDust(k.x, k.ground, 6);
    // the secret one reveals what it was hiding
    if (k.i === this.d.bookSecret && !this.d.bookFound) {
      this.d.bookFound = true;
      k.sprite.setFrame(0, 0);
      const spot = room.slotCenter(from.c, from.r);
      const item = nextPage() || randomCurio(this.game.dropRng, this.game.dropRng.chance(0.5) ? 'scroll' : 'trinket');
      this.game.pickups.spawn(room, 'curio', spot.x, spot.y - 6, true, item);
      this.game.audio.play('secret');
      Save.data.stats.secretsFound++;
    }
  }

  _setSolid(k) {
    k.solid = { x0: k.x - 15, x1: k.x + 15, y0: k.ground - 2, y1: k.ground + 14, owner: null };
    this.room.solids.push(k.solid);
  }
}

// ---------------------------------------------------------------------------------------------
// The wishing well: walk into it to drop in pennies. After a secret number, a wish comes true.
// ---------------------------------------------------------------------------------------------
export class WishingWell {
  constructor(room, x, ground) {
    this.room = room;
    this.game = room.game;
    this.x = x;
    this.ground = ground;
    const d = room.data;
    if (d.wellNeed === undefined) {
      d.wellNeed = room.rng.int(4, 9);
      d.wellPennies = 0;
    }
    this.d = d;
    this.sprite = room._staticSprite('well', x, ground - 4, 2, 3);
    this.sprite.setFrame(d.wellPennies >= d.wellNeed ? 1 : 0, 0);
    room.solids.push({ x0: x - 17, x1: x + 17, y0: ground - 6, y1: ground + 10, owner: null });
    this.t = 0;
  }

  update(dt) {
    const d = this.d;
    if (d.wellPennies >= d.wellNeed) return;
    const pl = this.game.player;
    const near = Math.abs(pl.x - this.x) < 26 && pl.y > this.ground - 14 && pl.y < this.ground + 18;
    if (near) this.game.hud.setHover(WELL_INFO, 0);
    this.t -= dt;
    if (!near || this.t > 0 || pl.pennies <= 0) return;
    this.t = 0.5;
    pl.pennies--;
    d.wellPennies++;
    this.game.hud.markDirty();
    this.game.audio.play('coin', 0.7);
    this.game.effects.burst(this.game.effects.presets.gold, this.x, this.ground + 4, 10, 4, 30, 40);
    if (d.wellPennies >= d.wellNeed) {
      this.sprite.setFrame(1, 0);
      this.game.audio.play('secret');
      Save.data.stats.secretsFound++;
      this.game.effects.relicBurst(this.x, this.ground);
      sealOrRelic(this.game, this.room, 2, this.x, this.ground - 42);
    }
  }
}
const WELL_INFO = { name: 'Wishing Well', flavour: 'Toss in a penny. Toss in another. Wishes are not cheap.' };

// ---------------------------------------------------------------------------------------------
// The rug: a powder keg burns it away and shows the trapdoor to the Forgotten Vault.
// ---------------------------------------------------------------------------------------------
export class Rug {
  constructor(room, x, y) {
    this.room = room;
    this.game = room.game;
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(room.game.renderer.scene, 'rug', { anchorY: 0 });
    this.sprite.place(x, y - 16, 0, LAYER.floorDecal + 0.01);
    room.sprites.push(this.sprite);
    this.trapdoor = null;
    if (room.data.rugBurnt) this._reveal(false);
  }

  explosion(x, y, r) {
    if (this.room.data.rugBurnt || Math.hypot(x - this.x, y - this.y) > r + 16) return;
    this.room.data.rugBurnt = true;
    this.game.effects.fireBurst(this.x, this.y);
    this._reveal(true);
  }

  _reveal(fresh) {
    this.sprite.setFrame(1, 0);
    const g = this.game;
    // a way down to the Forgotten Vault - once a run, and never from the Vault itself
    if (!g.inVault && !g.vaultVisited) {
      this.trapdoor = new Trapdoor(g, this.x, this.y, true);
      if (fresh) {
        g.audio.play('secret');
        Save.data.stats.secretsFound++;
      }
    } else if (fresh) g.pickups.spawn(this.room, 'purse', this.x, this.y);
  }

  update(dt) {
    if (this.trapdoor) this.trapdoor.update(dt);
  }

  dispose() {
    if (this.trapdoor) this.trapdoor.dispose();
  }
}

// ---------------------------------------------------------------------------------------------
// The sword in the stone: only one who carries the right two relics can draw it.
// ---------------------------------------------------------------------------------------------
export const SWORD_KEY = ['blessed_sling', 'crown_of_thorns'];
const SWORD_INFO = { name: "The King's First Blade", flavour: 'It answers only a blessed rune, crowned in thorns.' };

export class SwordInStone {
  constructor(room, x, ground) {
    this.room = room;
    this.game = room.game;
    this.x = x;
    this.ground = ground;
    this.sprite = room._staticSprite('sword_stone', x, ground - 4, 2, 3);
    this.sprite.setFrame(room.data.swordDrawn ? 1 : 0, 0);
    room.solids.push({ x0: x - 13, x1: x + 13, y0: ground - 6, y1: ground + 8, owner: null });
    this.touching = false;
  }

  update() {
    if (this.room.data.swordDrawn) return;
    const pl = this.game.player;
    const d = Math.hypot(pl.x - this.x, pl.y - this.ground);
    if (d < 44) this.game.hud.setHover(SWORD_INFO, 0);
    const touching = d < 20;
    if (touching && !this.touching) {
      if (SWORD_KEY.every((id) => pl.hasRelic(id))) this._draw();
      else {
        this.game.audio.play('deny');
        this.game.feel.shake(0.1);
      }
    }
    this.touching = touching;
  }

  _draw() {
    const g = this.game;
    this.room.data.swordDrawn = true;
    this.sprite.setFrame(1, 0);
    g.player.addRelic('kings_blade');
    g.hud.banner(RELICS.kings_blade);
    g.audio.play('victory');
    g.effects.relicBurst(this.x, this.ground + 20);
    Save.data.stats.secretsFound++;
    g.unlockCharacter('knight');
  }
}


// ---------------------------------------------------------------------------------------------
// The Trial Chamber: the doors slam, three waves come, each worse than the last. Survive: a relic.
// ---------------------------------------------------------------------------------------------
export class TrialChamber {
  constructor(room) {
    this.room = room;
    this.game = room.game;
    this.d = room.data;
    this.t = 0;
    this.pendingT = 0;
  }

  update(dt) {
    const d = this.d;
    if (d.trialDone) return;
    if (!d.trialStarted) {
      this.t += dt;
      if (this.t > 0.7) this._start();
      return;
    }
    if (this.pendingT > 0) {
      this.pendingT -= dt;
      if (this.pendingT <= 0) this._spawnWave();
    }
  }

  _start() {
    const g = this.game;
    this.d.trialStarted = true;
    this.wave = 0;
    this.room.locked = true;
    g.audio.play('doorSlam');
    g.audio.play('horn', 0.6);
    g.hud.banner({ name: 'THE TRIAL BEGINS', flavour: 'Three waves. Survive them all.' });
    this.pendingT = 1.2;
  }

  _spawnWave() {
    const g = this.game;
    const room = this.room;
    const pool = room.spawnPools[this.wave === 0 ? 'medium' : 'hard'];
    const types = [];
    for (const k in pool) for (let i = 0; i < pool[k]; i++) types.push(k);
    const n = 3 + this.wave;
    const b = room.bounds;
    const pl = g.player;
    for (let i = 0; i < n; i++) {
      let x;
      let y;
      for (let tries = 0; tries < 12; tries++) {
        x = g.dropRng.float(b.x0 + 24, b.x1 - 24);
        y = g.dropRng.float(b.y0 + 24, b.y1 - 24);
        if (Math.hypot(x - pl.x, y - pl.y) > 100 && room.nav.isWalkable(x, y)) break;
      }
      const type = types[Math.floor(g.dropRng.next() * types.length)];
      g.enemies.spawn(type, room, x, y, { champion: this.wave === 2 && i === 0 });
    }
    g.audio.play('roar', 0.5);
  }

  /** The room fell quiet: the next wave, or the end of the trial. Returns true to keep the doors shut. */
  onCleared() {
    if (!this.d.trialStarted || this.d.trialDone) return false;
    if (this.pendingT > 0) return true;
    if (this.wave < 2) {
      this.wave++;
      this.pendingT = 1.4;
      this.game.hud.banner({ name: `WAVE ${this.wave + 1} OF 3`, flavour: this.wave === 2 ? 'The last, and the worst.' : 'More are coming.' });
      return true;
    }
    this.d.trialDone = true;
    const c = this.room.slotCenter(7, 4);
    this.room.addRewardPedestal(c.x, c.y - 12, { kind: 'relic', id: this.game.pickRelic('boss', this.game.dropRng), price: 0, gone: false });
    this.game.audio.play('relic');
    this.game.hud.banner({ name: 'THE TRIAL IS WON', flavour: 'Take your prize.' });
    Save.data.stats.secretsFound++;
    return false;
  }
}

// ---------------------------------------------------------------------------------------------
// The Gambler's Den: a dice table (3 pennies a throw) and a beggar who remembers kindness.
// ---------------------------------------------------------------------------------------------
const DICE_COST = 3;
const DICE_OUTCOMES = { nothing: 34, double: 24, pickup: 20, curio: 12, chest: 6, relic: 4 };
const DICE_INFO = { name: 'Dice Table', flavour: `Walk up and throw: ${DICE_COST} pennies a game. Fortune favours the bold.` };
const BEGGAR_INFO = { name: 'A Beggar', flavour: 'Spare a penny, friend? Spare another?' };

export class DiceTable {
  constructor(room, x, ground) {
    this.room = room;
    this.game = room.game;
    this.x = x;
    this.ground = ground;
    this.sprite = room._staticSprite('dice_table', x, ground - 4, 2, 3);
    room.solids.push({ x0: x - 19, x1: x + 19, y0: ground - 4, y1: ground + 8, owner: null });
    this.cool = 0;
    this.rolling = 0;
  }

  update(dt) {
    const g = this.game;
    const pl = g.player;
    const near = Math.abs(pl.x - this.x) < 30 && pl.y > this.ground - 16 && pl.y < this.ground + 20;
    if (near) g.hud.setHover(DICE_INFO, DICE_COST);
    if (this.rolling > 0) {
      this.rolling -= dt;
      this.sprite.setFrame(Math.floor(this.rolling * 20) % 2, 0);
      if (this.rolling <= 0) this._result();
      return;
    }
    this.cool -= dt;
    if (!near || this.cool > 0) return;
    if (pl.pennies < DICE_COST) {
      g.audio.play('deny', 0.5);
      this.cool = 1;
      return;
    }
    pl.pennies -= DICE_COST;
    g.hud.markDirty();
    this.rolling = 0.6;
    g.audio.play('clatter', 0.4);
  }

  _result() {
    const g = this.game;
    const rng = g.dropRng;
    const d = this.room.data;
    const w = { ...DICE_OUTCOMES };
    if (d.diceRelic) w.relic = 0;
    let total = 0;
    for (const k in w) total += w[k];
    let r = rng.next() * total;
    let out = 'nothing';
    for (const k in w) {
      r -= w[k];
      if (r <= 0) {
        out = k;
        break;
      }
    }
    const x = this.x;
    const y = this.ground - 18;
    this.cool = 0.8;
    switch (out) {
      case 'nothing':
        g.audio.play('deny', 0.6);
        break;
      case 'double':
        for (let i = 0; i < DICE_COST * 2; i++) g.pickups.spawn(this.room, 'penny', x, y);
        g.audio.play('coins');
        break;
      case 'pickup':
        g.dropFrom({ ...ROOM_DROPS, none: 0, chest: 0, ironchest: 0, cursedchest: 0 }, x, y, 1);
        g.audio.play('coin');
        break;
      case 'curio':
        g.pickups.spawn(this.room, 'curio', x, y, true, randomCurio(rng, rng.chance(0.5) ? 'potion' : 'scroll'));
        g.audio.play('buy');
        break;
      case 'chest':
        g.pickups.spawn(this.room, 'chest', x, y);
        g.audio.play('buy');
        break;
      case 'relic':
        d.diceRelic = true;
        this.room.addRewardPedestal(x, this.ground - 44, { kind: 'relic', id: g.pickRelic('secret', rng), price: 0, gone: false });
        g.audio.play('victory', 0.6);
        break;
    }
    this.sprite.setFrame(0, 0);
  }
}

export class Beggar {
  constructor(room, x, ground) {
    this.room = room;
    this.game = room.game;
    this.x = x;
    this.ground = ground;
    const d = room.data;
    if (d.beggarNeed === undefined) {
      d.beggarNeed = room.rng.int(4, 9);
      d.beggarGiven = 0;
    }
    this.d = d;
    this.sprite = room._staticSprite('beggar', x, ground - 2, 2, 2);
    this.solid = { x0: x - 9, x1: x + 9, y0: ground - 2, y1: ground + 10, owner: null };
    if (!d.beggarGone) room.solids.push(this.solid);
    else this.sprite.visible = false;
    this.t = 0;
    this.time = 0;
  }

  update(dt) {
    if (this.d.beggarGone) return;
    const g = this.game;
    const pl = g.player;
    this.time += dt;
    this.sprite.setFrame(Math.floor(this.time * 1.5) % 2, 0);
    const near = Math.hypot(pl.x - this.x, pl.y - this.ground) < 26;
    if (near) g.hud.setHover(BEGGAR_INFO, 0);
    this.t -= dt;
    if (!near || this.t > 0 || pl.pennies <= 0) return;
    this.t = 0.5;
    pl.pennies--;
    this.d.beggarGiven++;
    g.hud.markDirty();
    g.audio.play('coin', 0.6);
    if (this.d.beggarGiven >= this.d.beggarNeed) {
      // he blesses you, leaves something precious, and is gone
      this.d.beggarGone = true;
      this.sprite.visible = false;
      this.room.removeSolid(this.solid);
      g.effects.relicBurst(this.x, this.ground + 10);
      this.room.addRewardPedestal(this.x, this.ground, { kind: 'relic', id: g.pickRelic('secret', g.dropRng), price: 0, gone: false });
      g.hud.banner({ name: 'Bless You, Child', flavour: 'He was not what he seemed.' });
      g.audio.play('holy');
    } else if (g.dropRng.chance(0.15)) {
      g.pickups.spawn(this.room, g.dropRng.chance(0.5) ? 'halfHeart' : 'key', this.x, this.ground + 4); // a little thanks
    }
  }
}

// --- the Blacksmith's Anvil (every merchant's room): reforge your newest relic ---

export class Anvil {
  constructor(room, x, ground) {
    this.room = room;
    this.game = room.game;
    this.x = x;
    this.ground = ground;
    this.sprite = room._staticSprite('anvil', x, ground - 2, 2, 3);
    room.solids.push({ x0: x - 14, x1: x + 14, y0: ground - 2, y1: ground + 8, owner: null });
    this.work = 0;
    this.sparkT = 0;
    if (room.data.anvilUsed) this.sprite.setFrame(2, 0);
  }

  /** The relic the anvil would melt: the newest passive one. */
  get target() {
    const r = this.game.player.relics;
    return r.length ? r[r.length - 1] : null;
  }

  update(dt) {
    const g = this.game;
    const pl = g.player;
    const near = Math.abs(pl.x - this.x) < 30 && pl.y > this.ground - 18 && pl.y < this.ground + 24;
    const d = this.room.data;
    if (!near) {
      if (this.work > 0) this.sprite.setFrame(d.anvilUsed ? 2 : 0, 0);
      this.work = 0;
      return;
    }
    if (d.anvilUsed) {
      g.hud.setHover(ANVIL_SPENT, 0);
      return;
    }
    const id = this.target;
    if (!id) {
      g.hud.setHover(ANVIL_EMPTY, 0);
      return;
    }
    const q = quality(id);
    const better = QUALITY_NAMES[Math.min(4, q + 1)].toLowerCase();
    g.hud.setHover({ name: "Blacksmith's Anvil", flavour: `Stay close to melt your ${RELICS[id].name} into something ${better}.` }, 0);
    // the work: hold still beside it, the metal heats, the hammer rings
    this.work += dt;
    this.sprite.setFrame(1, 0);
    this.sparkT -= dt;
    if (this.sparkT <= 0) {
      this.sparkT = 0.22;
      g.audio.play('clang', 0.5 + this.work / ANVIL.holdTime);
      g.effects.burst(g.effects.presets.gold, this.x, this.ground + 4, 20, 5, 70, 60);
    }
    if (this.work >= ANVIL.holdTime) this._reforge(id, q);
  }

  _reforge(id, q) {
    const g = this.game;
    const d = this.room.data;
    // always one step better (a legendary stays legendary)
    const newId = g.pickRelic('armoury', g.dropRng, { minQuality: Math.min(4, q + 1), bias: ANVIL.bias });
    if (!newId) {
      this.work = 0;
      g.audio.play('deny');
      return;
    }
    d.anvilUsed = true;
    g.player.removeRelic(id);
    this.sprite.setFrame(2, 0);
    g.audio.play('explosion', 0.4);
    g.feel.shake(0.25);
    g.effects.burst(g.effects.presets.gold, this.x, this.ground + 6, 22, 24, 110, 90);
    this.room.addRewardPedestal(this.x - 34, this.ground, { kind: 'relic', id: newId, price: 0, gone: false }); // it rises beside the anvil
  }

  drawOverlay(o) {
    if (this.work <= 0) return;
    // a ring that fills as the metal heats
    const k = Math.min(1, this.work / ANVIL.holdTime);
    o.arc(this.x, this.ground + 34, 9, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2, ANVIL_RING, 1, 3, 1);
  }
}

const ANVIL_SPENT = { name: "Blacksmith's Anvil", flavour: 'The coals are dead. It has done its work.' };
const ANVIL_EMPTY = { name: "Blacksmith's Anvil", flavour: 'Bring a relic, and the anvil will make it something new.' };
const ANVIL_RING = new THREE.Color(2.4, 1.4, 0.4);

// --- the Sealed Stair (hidden in a secret room): the way down to a secret realm ---

const REALM_INFO = {
  cistern: { name: 'A Sealed Stair', flavour: 'Water drips up from below. Something down there is breathing.' },
  chapel: { name: 'A Sealed Stair', flavour: 'Somewhere below, a choir is singing with no voices.' },
  forge: { name: 'A Sealed Stair', flavour: 'Heat rolls up the steps, and the ring of a hammer.' },
};

export class SealedStair {
  constructor(room, realm) {
    this.room = room;
    this.game = room.game;
    this.realm = realm;
    const c = room.slotCenter(7, 4);
    this.x = c.x;
    this.y = c.y - 10;
    this.sprite = room._staticSprite('sealed_stair', this.x, this.y - 18, 0, null);
    this.armed = false;
    this.t = 0;
  }

  update(dt) {
    const g = this.game;
    const pl = g.player;
    this.t += dt;
    this.sprite.setFrame(Math.floor(this.t * 3) % 2, 0);
    const d = Math.hypot(pl.x - this.x, pl.y - this.y);
    if (d < 50) g.hud.setHover(REALM_INFO[this.realm], 0);
    if (d > 30) this.armed = true;
    if (this.armed && d < 12 && !pl.dead && g.state === 'play') g.descend(false, this.realm);
  }
}
