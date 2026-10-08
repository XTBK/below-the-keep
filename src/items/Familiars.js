import { Sprite } from '../render/Sprite.js';
import { FAMILIAR_INDEX } from '../render/art/itemsArt3.js';
import { fxRng } from '../core/Rng.js';
import * as THREE from 'three';
import { ACTIVE } from '../data/items.js';

const RALLY = new THREE.Color(1.6, 1.25, 0.4);

// COMPANIONS: relics with a `familiar` field give Wren a little follower.
//   owl     follows; every so often it throws a stone at the nearest enemy
//   squire  follows; whenever Wren throws, he throws too (weaker)
//   page    circles Wren and swallows enemy shots it touches
//   moth    circles Wren further out, its knife-edged wings cutting what they touch
//   raven   dives at enemies and pecks them; after a fight it sometimes brings back a penny
// The Beastmaster transformation makes them all faster and adds another owl.

export const FAMILIAR = {
  owl: { every: 1.1, range: 230, damage: 0.6 },
  squire: { damage: 0.5 },
  page: { radius: 26, speed: 2.6 },
  moth: { radius: 44, speed: 3.6, damage: 0.35, every: 0.22 },
  raven: { speed: 170, damage: 0.45, every: 0.5, pennyChance: 0.3 },
};

const TRAIL = 90; // remembered positions of Wren, for followers to walk in his footsteps

export class Familiars {
  constructor(game) {
    this.game = game;
    this.list = [];
    this.key = '';
    this.trail = [];
    for (let i = 0; i < TRAIL; i++) this.trail.push({ x: 0, y: 0 });
    this.head = 0;
    this.time = 0;
  }

  /** Match the followers to the player's companions (called when his relics change). */
  _refresh() {
    const want = this.game.player.familiarList;
    const key = want.join(',');
    if (key === this.key) return;
    this.key = key;
    const scene = this.game.renderer.scene;
    for (const f of this.list) f.sprite.dispose(scene);
    const p = this.game.player;
    this.list = want.map((type, i) => ({
      type,
      i,
      sprite: new Sprite(scene, 'familiars', { anchorY: 0 }),
      x: p.x,
      y: p.y,
      h: type === 'squire' ? 0 : 10,
      t: fxRng.float(0, 1),
      angle: (i / Math.max(1, want.length)) * Math.PI * 2,
    }));
    for (let k = 0; k < TRAIL; k++) this.trail[k] = { x: p.x, y: p.y };
  }

  /** Jump everyone to Wren (new room, new floor). */
  warp() {
    const p = this.game.player;
    for (const f of this.list) {
      f.x = p.x;
      f.y = p.y;
    }
    for (let k = 0; k < TRAIL; k++) this.trail[k] = { x: p.x, y: p.y };
  }

  get rate() {
    const m = this.game.player.setPower('menagerie');
    return m ? m.familiarRate : 1;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    if (!p) return;
    this._refresh();
    if (!this.list.length) return;
    this.time += dt;
    // remember where Wren has been
    const last = this.trail[this.head];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 2) {
      this.head = (this.head + 1) % TRAIL;
      this.trail[this.head] = { x: p.x, y: p.y };
    }
    const rate = this.rate;
    let follower = 0;
    for (const f of this.list) {
      switch (f.type) {
        case 'owl':
        case 'squire':
          this._follow(f, ++follower, dt);
          if (f.type === 'owl') this._owl(f, dt * rate);
          break;
        case 'page':
        case 'moth':
          this._orbit(f, dt * Math.sqrt(rate), FAMILIAR[f.type]);
          if (f.type === 'page') this._block(f);
          else this._cut(f, dt * rate);
          break;
        case 'raven':
          this._raven(f, dt, rate, ++follower);
          break;
      }
    }
  }

  _follow(f, n, dt) {
    const t = this.trail[(this.head - n * 12 + TRAIL * 4) % TRAIL];
    f.x += (t.x - f.x) * Math.min(1, dt * 8);
    f.y += (t.y - f.y) * Math.min(1, dt * 8);
  }

  _orbit(f, dt, o) {
    const p = this.game.player;
    f.angle += o.speed * dt;
    f.x = p.x + Math.cos(f.angle) * o.radius;
    f.y = p.y + Math.sin(f.angle) * o.radius * 0.8;
  }

  _nearest(x, y, range) {
    let best = null;
    let bd = range * range;
    this.game.enemies.forEachAlive(this.game.room, (e) => {
      if (e.state === 'dormant' || !e.hittable) return;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = e;
      }
    });
    return best;
  }

  _owl(f, dt) {
    const o = FAMILIAR.owl;
    f.t -= dt;
    if (f.t > 0) return;
    const e = this._nearest(f.x, f.y, o.range);
    if (!e) {
      f.t = 0.2;
      return;
    }
    f.t = o.every;
    const p = this.game.player;
    const dx = e.x - f.x;
    const dy = e.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    this.game.projectiles.spawn(f.x, f.y, 12, (dx / d) * p.stats.shotSpeed, (dy / d) * p.stats.shotSpeed, p.shot, 0, o.damage);
    this.game.audio.play('sling', 0.4);
  }

  /** Wren threw a stone: every squire throws one too. */
  onPlayerFire(dx, dy) {
    const p = this.game.player;
    const k = FAMILIAR.squire.damage * (this.rate > 1 ? 1.5 : 1);
    for (const f of this.list) {
      if (f.type !== 'squire') continue;
      this.game.projectiles.spawn(f.x, f.y, 10, dx * p.stats.shotSpeed, dy * p.stats.shotSpeed, p.shot, 0, k);
    }
  }

  _block(f) {
    const shots = this.game.enemies.shots;
    for (let i = shots.orbs.count - 1; i >= 0; i--) {
      const o = shots.orbs.active[i];
      if ((o.x - f.x) ** 2 + (o.y - f.y) ** 2 < 110) {
        this.game.effects.sparkle(o.x, o.y);
        shots._releaseOrb(o);
      }
    }
    for (let i = shots.bolts.count - 1; i >= 0; i--) {
      const b = shots.bolts.active[i];
      if ((b.x - f.x) ** 2 + (b.y - f.y) ** 2 < 110) {
        this.game.effects.sparkle(b.x, b.y);
        shots._releaseBolt(b);
      }
    }
  }

  _cut(f, dt) {
    const m = FAMILIAR.moth;
    f.t -= dt;
    if (f.t > 0) return;
    f.t = m.every;
    const p = this.game.player;
    this.game.enemies.forEachAlive(this.game.room, (e) => {
      if (e.hittable && (e.x - f.x) ** 2 + (e.y - f.y) ** 2 < (e.def.hitRadius + 6) ** 2) e.hit(p.stats.damage * m.damage, 0, 0, true);
    });
  }

  _raven(f, dt, rate, n) {
    const r = FAMILIAR.raven;
    const target = this._nearest(f.x, f.y, 400);
    if (!target) {
      this._follow(f, n, dt);
      return;
    }
    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > 8) {
      f.x += (dx / d) * r.speed * dt;
      f.y += (dy / d) * r.speed * dt;
    }
    f.t -= dt * rate;
    if (d < target.def.hitRadius + 6 && f.t <= 0) {
      f.t = r.every;
      target.hit(this.game.player.stats.damage * r.damage, dx / d, dy / d, true);
      this.game.audio.play('caw', 0.3);
    }
  }

  /** After a fight, ravens sometimes bring back a penny. */
  onRoomCleared() {
    for (const f of this.list) {
      if (f.type === 'raven' && fxRng.chance(FAMILIAR.raven.pennyChance)) this.game.pickups.spawn(this.game.room, 'penny', f.x, f.y);
    }
  }

  sync() {
    // a planted War Banner
    const wb = this.game.warBanner;
    if (wb) {
      if (!this.banner) this.banner = new Sprite(this.game.renderer.scene, 'war_banner', { anchorY: 1 });
      this.banner.visible = true;
      this.banner.setFrame(Math.floor(this.time * 3) % 2, 0);
      this.banner.place(wb.x, wb.y);
    } else if (this.banner) this.banner.visible = false;
    const title = this.game.state === 'title' || this.game.state === 'collection';
    for (const f of this.list) {
      const frame = FAMILIAR_INDEX[f.type] * 2 + (Math.floor(this.time * 6 + f.i) % 2);
      f.sprite.setFrame(frame, 0);
      f.sprite.visible = !title;
      f.sprite.place(f.x, f.y, f.h + (f.h ? Math.round(Math.sin(this.time * 4 + f.i) * 2) : 0));
    }
  }

  /** The War Banner's rally ring. */
  drawOverlay(o, time) {
    const wb = this.game.warBanner;
    if (!wb) return;
    const a = wb.t < 1.5 ? (Math.floor(time * 8) % 2 ? 0.6 : 0.2) : 0.45;
    o.ring(wb.x, wb.y, ACTIVE.banner.radius, RALLY, a, 3);
  }

  clear() {
    const scene = this.game.renderer.scene;
    for (const f of this.list) f.sprite.dispose(scene);
    this.list = [];
    this.key = '';
  }
}
