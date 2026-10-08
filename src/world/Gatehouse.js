// The Gatehouse: home, above the Keep. Every run (but the Daily Descent) starts here, in one quiet
// room with the way down in the floor. The prisoners you've freed wait here at their spots; the
// spots of those still below are empty shackles. And down in the Keep: the prisoners themselves.

import { Trapdoor } from '../entities/Trapdoor.js';
import { PRISONERS, PRISONER_IDS, rescued, rescue, forgeable } from '../data/prisoners.js';
import { NPC_ORDER } from '../render/art/gatehouseArt.js';
import { WEAPON_DEFS, WEAPON_IDS, starterWeapon } from '../data/weapons.js';
import { Save } from '../core/Save.js';

export const GATEHOUSE_LAYOUT = {
  name: 'The Gatehouse',
  grid: [
    'B...........B',
    '.............',
    '.............',
    '.............',
    '.............',
    'b...........b',
    'bb.........bb',
  ],
};

/** The Gatehouse "floor": one room and nothing else. */
export function gatehouseFloor() {
  const room = {
    id: 0,
    type: 'gatehouse',
    cells: [{ x: 4, y: 4 }],
    minX: 4,
    minY: 4,
    w: 1,
    h: 1,
    distance: 0,
    layouts: new Map([['4,4', GATEHOUSE_LAYOUT.name]]),
    visited: true,
    seen: true,
    cleared: true,
    destroyed: new Set(),
    connections: [],
  };
  return { number: 0, rooms: [room], grid: null, connections: [], startId: 0, bossId: 0, targetRooms: 1, attempts: 1 };
}

const SPOTS = { smith: [2, 2], quartermaster: [4.5, 2], priest: [7, 1.6], cartographer: [9.5, 2], archivist: [12, 2] };

const touchable = (feature, d, near = 20, far = 40) => {
  if (d > far) feature.armed = true;
  if (feature.armed && d < near) {
    feature.armed = false;
    return true;
  }
  return false;
};

/** One prisoner's spot in the Gatehouse: them (if freed), or their empty shackles. */
class GatehouseSpot {
  constructor(room, id) {
    this.room = room;
    this.game = room.game;
    this.id = id;
    this.home = rescued(id);
    const [c, r] = SPOTS[id];
    const p = room.slotCenter(c, r);
    this.x = p.x;
    this.y = p.y;
    this.col = NPC_ORDER.indexOf(id);
    this.sprite = room._staticSprite('npcs', this.x, this.y, 2, this.home ? 3 : null);
    this.sprite.setFrame(this.home ? this.col * 2 : 15, 0);
    room.solids.push({ x0: this.x - 8, x1: this.x + 8, y0: this.y - 2, y1: this.y + 8, owner: null });
    this.t = this.col * 0.37;
    this.armed = true;
  }

  get info() {
    const P = PRISONERS[this.id];
    if (!this.home) return { name: 'An Empty Spot', flavour: 'Someone belongs here. They are still somewhere below, in chains.' };
    if (this.id === 'smith') {
      const w = this.game.player.weapon;
      return { name: P.name, flavour: w ? `${P.service} Now: ${w.name}.` : 'Your hero fights with a sling; he has nothing to forge for you.' };
    }
    return { name: P.name, flavour: P.service };
  }

  update(dt) {
    const g = this.game;
    const pl = g.player;
    this.t += dt;
    if (this.home) this.sprite.setFrame(this.col * 2 + (Math.floor(this.t * 1.6) % 2), 0);
    const d = Math.hypot(pl.x - this.x, pl.y - this.y);
    if (d < 46) g.hud.setHover(this.info, 0);
    if (this.home && this.id === 'smith' && touchable(this, d, 24, 44)) this._reforge();
  }

  /** Hollis hands you the next weapon you've carried before (and keeps your choice for next time). */
  _reforge() {
    const g = this.game;
    const pl = g.player;
    const cls = pl.character.weapon;
    const starter = starterWeapon(cls);
    if (!starter) return g.audio.play('deny', 0.6);
    const list = forgeable(cls, WEAPON_IDS, WEAPON_DEFS, starter);
    if (list.length < 2) {
      g.hud.banner({ name: 'Nothing to Re-forge', flavour: 'Carry a new weapon out of the Keep, and Hollis can make it again.' });
      return g.audio.play('deny', 0.6);
    }
    const next = list[(list.indexOf(pl.weaponId) + 1) % list.length];
    pl.equipWeapon(next);
    if (!Save.data.forged) Save.data.forged = {};
    Save.data.forged[cls] = next;
    Save.write();
    g.audio.play('clang', 0.8);
    g.effects.landDust(this.x, this.y, 6);
  }
}

/** Ambrose's forgotten stair: straight down to the Catacombs, with a relic for the road. */
class ShortcutStair {
  constructor(room) {
    this.room = room;
    this.game = room.game;
    const c = room.slotCenter(12, 6);
    this.x = c.x;
    this.y = c.y;
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
    if (d < 50) g.hud.setHover({ name: "Ambrose's Stair", flavour: 'A forgotten way down: straight to the Catacombs, with a relic in hand.' }, 0);
    if (d > 30) this.armed = true;
    if (this.armed && d < 12 && !pl.dead && g.state === 'play') g.descend(false, null, 3);
  }
}

/** The way down, and a word about it. */
class TheWayDown {
  constructor(room) {
    this.game = room.game;
    const c = room.slotCenter(7, 7);
    this.x = c.x;
    this.y = c.y;
    room.trapdoor = new Trapdoor(room.game, c.x, c.y);
  }

  update() {
    const pl = this.game.player;
    if (Math.hypot(pl.x - this.x, pl.y - this.y) < 44) this.game.hud.setHover({ name: 'The Way Down', flavour: 'Into the Keep. Somewhere below, the others are waiting.' }, 0);
  }
}

/** Fill the Gatehouse room with its people and its stairs. */
export function furnishGatehouse(room) {
  const out = PRISONER_IDS.map((id) => new GatehouseSpot(room, id));
  out.push(new TheWayDown(room));
  if (rescued('archivist')) out.push(new ShortcutStair(room));
  return out;
}

// ---------------------------------------------------------------------------------------------
// Down in the Keep: a prisoner in chains

export class Prisoner {
  constructor(room, id) {
    this.room = room;
    this.game = room.game;
    this.id = id;
    // chained to a wall, out of every doorway's way, on bare floor
    const spot = [[3, 2], [11, 2], [3, 6], [11, 6], [2, 4], [12, 4]].find(([c, r]) => room.tileAt(c, r) === '.') || [3, 2];
    const c = room.slotCenter(spot[0], spot[1]);
    this.x = c.x;
    this.y = c.y;
    this.sprite = room._staticSprite('npcs', this.x, this.y, 2, 3);
    this.freed = rescued(id) && this.game.prisonerFreed === id;
    this.sprite.setFrame(this.freed ? 15 : 10 + NPC_ORDER.indexOf(id), 0);
    room.solids.push({ x0: this.x - 8, x1: this.x + 8, y0: this.y - 2, y1: this.y + 8, owner: null });
    this.armed = true;
  }

  update() {
    if (this.freed) return;
    const g = this.game;
    const pl = g.player;
    const d = Math.hypot(pl.x - this.x, pl.y - this.y);
    const P = PRISONERS[this.id];
    if (d < 46) {
      const flavour = !this.room.data.cleared ? 'Deal with what is in this room first.' : pl.keys > 0 ? `${P.chained} Touch them to use one.` : P.chained;
      g.hud.setHover({ name: P.name, flavour }, 0);
    }
    if (!touchable(this, d, 24, 44) || !this.room.data.cleared) return;
    if (pl.keys <= 0) return g.audio.play('deny', 0.6);
    pl.keys--;
    this.freed = true;
    g.prisonerFreed = this.id;
    rescue(this.id);
    this.sprite.setFrame(15, 0);
    g.audio.play('unlock');
    g.audio.play('holy', 0.7);
    g.effects.holySplash(this.x, this.y, 40);
    g.hud.banner({ name: `${P.name} is Free`, flavour: P.freed });
    g.hud.markDirty();
  }
}
