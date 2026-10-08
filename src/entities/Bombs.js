import { Pool } from '../core/Pool.js';
import { Sprite, LAYER } from '../render/Sprite.js';
import { BOMB } from '../data/items.js';
import { fxRng } from '../core/Rng.js';
import { PERKS } from '../items/Perks.js';

// Powder kegs: E places one at Wren's feet. The fuse fizzes (blinking faster and faster), then
// BOOM: it hurts every enemy in range (and Wren, if he's too close), smashes barrels, blows rocks
// to rubble and blasts open cracked walls into secret rooms.

const FLASH_LIGHT = { brightness: 2.6, height: 30, radius: 220, color: 0xffa040, flicker: 0, flickerSpeed: 1 };

export class Bombs {
  constructor(game) {
    this.game = game;
    const scene = game.renderer.scene;
    this.pool = new Pool(() => {
      const s = new Sprite(scene, 'bomb_lit', { anchorY: 2, emissive: 0x404040 });
      const sh = new Sprite(scene, 'shadows', { shadow: true });
      sh.setFrame(1, 0);
      s.visible = sh.visible = false;
      return { sprite: s, shadow: sh, x: 0, y: 0, t: 0, sparkAcc: 0 };
    }, 6);
    this.flashes = []; // borrowed lights that fade out after an explosion
  }

  /** Place a bomb at Wren's feet (if he has one). */
  place() {
    const pl = this.game.player;
    if (pl.bombs <= 0 || pl.dead) {
      this.game.audio.play('deny', 0.5);
      return;
    }
    const b = this.pool.acquire();
    if (!b) return;
    pl.bombs--;
    b.x = pl.x;
    b.y = pl.y - 2;
    b.t = BOMB.fuse;
    b.sprite.visible = b.shadow.visible = true;
    this.game.audio.play('fuse');
    this.game.hud.markDirty();
  }

  /** A lit keg somewhere else (the Bag of Powder Kegs throws them). Costs nothing. */
  placeAt(x, y) {
    const b = this.pool.acquire();
    if (!b) return;
    b.x = x;
    b.y = y;
    b.t = BOMB.fuse;
    b.sprite.visible = b.shadow.visible = true;
    this.game.audio.play('fuse');
  }

  update(dt) {
    const fx = this.game.effects;
    for (let i = this.pool.count - 1; i >= 0; i--) {
      const b = this.pool.active[i];
      b.t -= dt;
      // blink faster as the fuse burns down
      const rate = b.t < 0.5 ? 16 : b.t < 1 ? 8 : 4;
      b.sprite.setFrame(Math.floor(b.t * rate) % 2, 0);
      b.sparkAcc += dt * 25;
      while (b.sparkAcc >= 1) {
        b.sparkAcc -= 1;
        fx.glow.emit(fx.presets.spark, b.x + 2, b.y, 15, fxRng.float(-30, 30), fxRng.float(-20, 20), fxRng.float(10, 50));
      }
      if (b.t <= 0) {
        this._release(b);
        this.explode(b.x, b.y, true);
      }
    }
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.t -= dt;
      f.light.brightness = FLASH_LIGHT.brightness * Math.max(0, f.t / 0.35);
      if (f.t <= 0) {
        this.game.enemies.returnLight(f.light);
        this.flashes.splice(i, 1);
      }
    }
  }

  /** A blast at (x, y). hurtsPlayer: false for explosions Wren's own stones cause. */
  explode(x, y, hurtsPlayer) {
    const g = this.game;
    const room = g.room;
    const pk = g.player.perks;
    // the Powder Horn makes Wren's own kegs bigger
    const R = BOMB.radius * (hurtsPlayer && pk.bigBombs ? PERKS.bigBombs : 1);
    // enemies
    g.enemies.forEachAlive(room, (e) => {
      const dx = e.x - x;
      const dy = e.y - y;
      const d = Math.hypot(dx, dy);
      if (d < R + e.def.radius) e.hit(BOMB.damage, dx / (d || 1), dy / (d || 1));
    });
    // Wren
    const pl = g.player;
    if (hurtsPlayer && !pk.bombImmune && Math.hypot(pl.x - x, pl.y - y) < R) pl.hurt(BOMB.playerDamage, x, y, 'Your Own Powder Keg');
    // barrels
    for (const prop of room.props) {
      if (!prop.broken && prop.hit && Math.hypot(prop.x - x, prop.ground + 6 - y) < R) prop.hit(999);
    }
    // rocks
    room.destroyRocksNear(x, y, R);
    room.explosion(x, y, R);
    // cracked walls into secret rooms
    let opened = false;
    for (const d of room.doors) {
      if (!d.conn.hidden || d.conn.sealed) continue;
      const f = d.entryPoint(0);
      if (Math.hypot(f.x - x, f.y - y) < R + BOMB.secretReach) {
        d.conn.hidden = false;
        opened = true;
      }
    }

    // effects
    const fx = g.effects;
    fx.explosion(x, y);
    g.enemies.decal(room, 'scorch', x, y - 2);
    g.enemies.shockwave(x, y, R);
    g.feel.shake(0.65);
    g.feel.hitStop(0.06);
    g.audio.play('explosion');
    const light = g.enemies.borrowLight({ ...FLASH_LIGHT, x, y });
    if (light) this.flashes.push({ light, t: 0.35 });

    if (opened) {
      g.audio.play('secret');
      g.rebuildCurrentRoom(); // redraw the wall with a hole in it
    }
  }

  _release(b) {
    b.sprite.visible = b.shadow.visible = false;
    this.pool.release(b);
  }

  clear() {
    for (let i = this.pool.count - 1; i >= 0; i--) this._release(this.pool.active[i]);
    for (const f of this.flashes) this.game.enemies.returnLight(f.light);
    this.flashes.length = 0;
  }

  sync() {
    for (let i = 0; i < this.pool.count; i++) {
      const b = this.pool.active[i];
      b.sprite.place(b.x, b.y);
      b.shadow.place(b.x, b.y - 6, 0, LAYER.shadow);
    }
  }
}
