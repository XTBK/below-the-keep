import { Pool } from '../core/Pool.js';
import { Sprite, LAYER } from '../render/Sprite.js';
import { PICKUPS, CHESTS, CHEST_LOOT } from '../data/items.js';
import { PLAYER } from '../data/config.js';
import { pushCircleOutOfBox, clampCircleToRect } from '../world/Collision.js';
import { fxRng } from '../core/Rng.js';
import { takeCurio, curioFrame, curioInfo, randomCurio } from '../items/Curios.js';

// Pennies, purses, hearts, powder kegs and keys lying on the floor - and curios (kind 'curio':
// a trinket, scroll, potion, Seal Fragment or journal page, see items/Curios.js) - and chests
// (kinds 'chest', 'ironchest', 'cursedchest': walk into one to open it; it stays, open).
// They pop out with a little bounce, settle, and are collected by walking over them.
// Pickups left behind in a room are remembered and are still there when you come back.

const GRAVITY = 420;

export class Pickups {
  constructor(game) {
    this.game = game;
    const scene = game.renderer.scene;
    this.pool = new Pool(() => {
      const s = new Sprite(scene, 'pickups', { anchorY: 3, emissive: 0x505050 });
      const cs = new Sprite(scene, 'curios', { anchorY: 3, emissive: 0x606060 });
      const ch = new Sprite(scene, 'chests', { anchorY: 2, emissive: 0x404040 });
      ch.visible = false;
      const sh = new Sprite(scene, 'shadows', { shadow: true });
      sh.setFrame(0, 0);
      s.visible = cs.visible = sh.visible = false;
      return { pickupSprite: s, curioSprite: cs, chestSprite: ch, denyT: 0, sprite: s, shadow: sh, kind: '', item: null, waitLeave: false, room: null, x: 0, y: 0, h: 0, vx: 0, vy: 0, vh: 0, age: 0 };
    }, 64);
  }

  /** item: the curio, when kind is 'curio'. waitLeave: Wren must step away before it can be taken. */
  spawn(room, kind, x, y, pop = true, item = null, waitLeave = false) {
    const p = this.pool.acquire();
    if (!p) return null;
    p.kind = kind;
    p.item = item;
    p.waitLeave = waitLeave;
    p.room = room;
    p.x = x;
    p.y = y;
    p.h = pop ? 6 : 0;
    p.vx = pop ? fxRng.float(-50, 50) : 0;
    p.vy = pop ? fxRng.float(-35, 35) : 0;
    p.vh = pop ? fxRng.float(90, 140) : 0;
    p.age = pop ? 0 : 1;
    p.denyT = 0;
    if (CHESTS[kind]) {
      if (!p.item) p.item = { open: false };
      p.sprite = p.chestSprite;
      p.sprite.setFrame(CHESTS[kind].frame + (p.item.open ? 1 : 0), 0);
    } else {
      p.sprite = kind === 'curio' ? p.curioSprite : p.pickupSprite;
      p.sprite.setFrame(kind === 'curio' ? curioFrame(this.game, item) : PICKUPS[kind].frame, 0);
    }
    p.sprite.visible = p.shadow.visible = true;
    return p;
  }

  update(dt) {
    const room = this.game.room;
    const pl = this.game.player;
    for (let i = this.pool.count - 1; i >= 0; i--) {
      const p = this.pool.active[i];
      if (p.room !== room) continue;
      p.age += dt;
      if (p.h > 0 || p.vh > 0) {
        p.vh -= GRAVITY * dt;
        p.h += p.vh * dt;
        if (p.h <= 0) {
          p.h = 0;
          p.vh = p.vh < -40 ? -p.vh * 0.35 : 0;
          p.vx *= 0.6;
          p.vy *= 0.6;
          if (p.vh > 0) this.game.audio.play('land', 0.4);
        }
      }
      const f = Math.exp(-3 * dt);
      p.vx *= f;
      p.vy *= f;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      for (let s = 0; s < room.solids.length; s++) pushCircleOutOfBox(p, 5, room.solids[s]);
      clampCircleToRect(p, 5, room.bounds);

      // collect
      if (p.age > 0.25 && !pl.dead) {
        const dx = pl.x - p.x;
        const dy = pl.y - p.y;
        const d2 = dx * dx + dy * dy;
        if (p.kind === 'curio' && d2 < 44 * 44) this.game.hud.setHover(curioInfo(this.game, p.item), 0);
        if (p.denyT > 0) p.denyT -= dt;
        if (CHESTS[p.kind]) {
          if (!p.item.open && d2 < (PLAYER.radius + 10) ** 2 && p.denyT <= 0) this._openChest(p);
        } else if (p.waitLeave) {
          if (d2 > 24 * 24) p.waitLeave = false;
        } else if (d2 < (PLAYER.radius + 7) ** 2 && this._collect(p)) {
          this._release(p);
        }
      }
    }
  }

  /** Can this be picked up by walking over it (or pulled in by the Shepherd's Crook)? */
  isCollectible(p) {
    return !!PICKUPS[p.kind];
  }

  _openChest(p) {
    const g = this.game;
    const pl = g.player;
    const c = CHESTS[p.kind];
    if (c.needsKey) {
      if (pl.keys <= 0) {
        g.audio.play('deny', 0.6);
        p.denyT = 1;
        return;
      }
      pl.keys--;
      g.audio.play('unlock');
    }
    p.item.open = true;
    p.sprite.setFrame(c.frame + 1, 0);
    g.audio.play('woodHit');
    g.effects.burst(g.effects.presets.gold, p.x, p.y, 10, 10, 60, 70);
    const rng = g.dropRng;
    if (c.curse && rng.chance(c.curse)) {
      // a cursed chest bites back
      pl.hurt(1, p.x, p.y, 'a Cursed Chest');
      g.audio.play('roar', 0.5);
      const pool = p.room.spawnPools.easy;
      const types = Object.keys(pool);
      for (let i = 0; i < 2; i++) g.enemies.spawn(types[Math.floor(rng.next() * types.length)], p.room, p.x + (i ? 24 : -24), p.y + 10);
      if (!p.room.locked) {
        p.room.locked = true;
        g.audio.play('doorSlam');
      }
      g.hud.markDirty();
      return;
    }
    // the loot
    if (c.relic && rng.chance(c.relic)) {
      const id = g.pickRelic('armoury', rng);
      if (id) p.room.addRewardPedestal(p.x, p.y + 26, { kind: 'relic', id, price: 0, gone: false });
    }
    if (rng.chance(c.curio)) {
      const r = rng.next();
      this.spawn(p.room, 'curio', p.x, p.y, true, randomCurio(rng, r < 0.3 ? 'trinket' : r < 0.65 ? 'scroll' : 'potion'));
    }
    const n = c.loot[0] + Math.floor(rng.next() * (c.loot[1] - c.loot[0] + 1));
    for (let i = 0; i < n; i++) g.dropFrom(CHEST_LOOT, p.x, p.y, 1);
    g.hud.markDirty();
  }

  _collect(p) {
    if (p.kind === 'curio') {
      // swapping: whatever Wren was carrying is put down where this one lay
      const dropped = takeCurio(this.game, p.item);
      this.game.effects.sparkle(p.x, p.y);
      if (dropped) this.spawn(p.room, 'curio', p.x, p.y, false, dropped, true);
      return true;
    }
    const def = PICKUPS[p.kind];
    const pl = this.game.player;
    if (def.needsMissingHealth && pl.halfHearts >= pl.maxHalfHearts) return false;
    for (const k in def.give) {
      if (k === 'halfHearts') pl.heal(this.game.oath('iron') ? Math.max(1, Math.floor(def.give[k] / 2)) : def.give[k]); // the Oath of Iron
      else pl[k] += def.give[k];
    }
    this.game.audio.play(def.sound);
    this.game.effects.sparkle(p.x, p.y);
    this.game.hud.markDirty();
    return true;
  }

  _release(p) {
    p.pickupSprite.visible = p.curioSprite.visible = p.chestSprite.visible = p.shadow.visible = false;
    p.room = null;
    p.item = null;
    this.pool.release(p);
  }

  /** Leaving a room: remember its pickups in the room data, then hide them. */
  releaseRoom(room) {
    const saved = [];
    for (let i = this.pool.count - 1; i >= 0; i--) {
      const p = this.pool.active[i];
      if (p.room !== room) continue;
      saved.push({ kind: p.kind, x: p.x, y: p.y, item: p.item });
      this._release(p);
    }
    room.data.pickups = saved;
  }

  /** Entering a room: put back whatever was left there. */
  restoreRoom(room) {
    for (const s of room.data.pickups || []) this.spawn(room, s.kind, s.x, s.y, false, s.item);
    room.data.pickups = [];
  }

  reassign(oldRoom, newRoom) {
    for (let i = 0; i < this.pool.count; i++) if (this.pool.active[i].room === oldRoom) this.pool.active[i].room = newRoom;
  }

  clear() {
    for (let i = this.pool.count - 1; i >= 0; i--) this._release(this.pool.active[i]);
  }

  sync() {
    for (let i = 0; i < this.pool.count; i++) {
      const p = this.pool.active[i];
      // settled pickups bob gently so they catch the eye
      const bob = p.h === 0 && p.vh === 0 ? Math.round(Math.sin(p.age * 3 + p.x) * 1) : 0;
      p.sprite.place(p.x, p.y, p.h + 1 + bob);
      p.shadow.place(p.x, p.y - 6, 0, LAYER.shadow);
    }
  }
}
