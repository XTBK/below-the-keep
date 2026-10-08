import { Pool } from '../core/Pool.js';
import { Sprite, Animator, LAYER } from '../render/Sprite.js';
import { PLAYER, LIGHTING } from '../data/config.js';
import { TELE, telegraphAlpha } from './telegraph.js';

// Enemy projectiles, pooled:
//  - bolts: fast and straight (crossbowmen). 8-direction sprite, hits Wren or the first obstacle.
//  - fireballs: lobbed in an arc to a target point (torch imps); can't be blocked; a ring shows
//    where it will land; leaves a burning patch.
//  - orbs: slower round shots (plague globs, stone shards, thrown keys) used by bosses.

const FIRE_LIGHT = { brightness: 0.9, height: 20, radius: 120, color: 0xff8030, flicker: 0.3, flickerSpeed: 14 };

export class EnemyShots {
  constructor(game, manager) {
    this.game = game;
    this.manager = manager;
    const scene = game.renderer.scene;
    this.bolts = new Pool(() => {
      const s = new Sprite(scene, 'bolt', { lit: false, glow: 1.5, anchorY: 8 });
      s.visible = false;
      return { sprite: s, x: 0, y: 0, h: 0, vx: 0, vy: 0, damage: 1 };
    }, 32);
    this.fireballs = new Pool(() => {
      const s = new Sprite(scene, 'fireball', { lit: false, glow: LIGHTING.flameIntensity, anchorY: 6 });
      const sh = new Sprite(scene, 'shadows', { shadow: true });
      sh.setFrame(0, 0);
      s.visible = sh.visible = false;
      const anim = new Animator(s);
      anim.play('burn');
      const orb = new Sprite(scene, 'orbs', { anchorY: 6 });
      orb.visible = false;
      return { orb, sprite: s, shadow: sh, anim, x: 0, y: 0, h: 0, x0: 0, y0: 0, h0: 0, x1: 0, y1: 0, t: 0, T: 1, cfg: null, light: null };
    }, 24);
    this.orbs = new Pool(() => {
      const sp = new Sprite(scene, 'orbs', { anchorY: 6, emissive: 0x606060 });
      sp.visible = false;
      return { sprite: sp, x: 0, y: 0, bx: 0, by: 0, h: 0, vx: 0, vy: 0, damage: 1, source: '', life: 0, t: 0, homing: 0, waveAmp: 0, waveFreq: 0, land: null, bounce: 0, reverseAt: 0 };
    }, 240); // the last bosses fill the room with orbs
  }

  /**
   * frame: see the orbs sheet (0 glob, 1 shard, 2 key, 3 bone, 4 wisp, 5 thorn, 6 curse, 7 coin,
   * 8 fire, 9 web, 10 shadow, 11 iron ball, 12 rune). source names what hurt Wren (death screen).
   * opts: { homing (turn rate), wave: [amplitude, frequency], land: 'web' | 'poison', life,
   *         bounce (ricochets off walls this many times), reverseAt (seconds: then it flies back) }
   */
  fireOrb(x, y, h, dirX, dirY, speed, frame, damage, source, opts = null) {
    const o = this.orbs.acquire();
    if (!o) return;
    o.x = o.bx = x;
    o.y = o.by = y;
    o.h = h;
    o.vx = dirX * speed;
    o.vy = dirY * speed;
    o.damage = damage;
    o.source = source;
    o.t = 0;
    o.life = (opts && opts.life) || 4;
    o.homing = (opts && opts.homing) || 0;
    o.waveAmp = opts && opts.wave ? opts.wave[0] : 0;
    o.waveFreq = opts && opts.wave ? opts.wave[1] : 0;
    o.land = (opts && opts.land) || null;
    o.bounce = (opts && opts.bounce) || 0;
    o.reverseAt = (opts && opts.reverseAt) || 0;
    o.sprite.setFrame(frame, 0);
    o.sprite.visible = true;
  }

  fireBolt(x, y, h, dirX, dirY, speed, damage) {
    const b = this.bolts.acquire();
    if (!b) return;
    b.x = x;
    b.y = y;
    b.h = h;
    b.vx = dirX * speed;
    b.vy = dirY * speed;
    b.damage = damage;
    const frame = ((Math.round(Math.atan2(dirY, dirX) / (Math.PI / 4)) % 8) + 8) % 8;
    b.sprite.setFrame(frame, 0);
    b.sprite.visible = true;
  }

  lobFireball(x0, y0, h0, x1, y1, time, cfg) {
    const f = this.fireballs.acquire();
    if (!f) return;
    f.x0 = f.x = x0;
    f.y0 = f.y = y0;
    f.h0 = f.h = h0;
    f.x1 = x1;
    f.y1 = y1;
    f.t = 0;
    f.T = time;
    f.cfg = cfg;
    f.isFire = cfg.frame === undefined || cfg.frame === 8;
    f.sprite.visible = f.isFire;
    f.orb.visible = !f.isFire;
    if (!f.isFire) f.orb.setFrame(cfg.patchKind === 'poison' ? 0 : cfg.frame, 0);
    f.shadow.visible = true;
    f.light = f.isFire ? this.manager.borrowLight({ ...FIRE_LIGHT, x: x0, y: y0 }) : null;
  }

  update(dt, room) {
    const p = this.game.player;
    const pr = PLAYER.radius;
    // --- bolts ---
    for (let i = this.bolts.count - 1; i >= 0; i--) {
      const b = this.bolts.active[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const bd = room.bounds;
      let blocked = b.x < bd.x0 || b.x > bd.x1 || b.y < bd.y0 || b.y > bd.y1;
      if (!blocked) {
        for (let s = 0; s < room.solids.length; s++) {
          const box = room.solids[s];
          if (box.pit) continue;
          if (b.x >= box.x0 && b.x <= box.x1 && b.y >= box.y0 && b.y <= box.y1) {
            if (box.owner && box.owner.hit && !box.owner.def) box.owner.hit(1); // bolts can smash barrels too
            blocked = true;
            break;
          }
        }
      }
      if (blocked) {
        this.game.effects.stoneImpact(b.x, b.y, b.h, b.vx / 330, b.vy / 330);
        this._releaseBolt(b);
        continue;
      }
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      if (dx * dx + dy * dy < (pr + 4) * (pr + 4)) {
        p.hurt(b.damage, b.x - b.vx * 0.05, b.y - b.vy * 0.05, 'a Crossbow Bolt');
        this._releaseBolt(b);
      }
    }
    // --- orbs (they ignore rocks; walls stop them) ---
    for (let i = this.orbs.count - 1; i >= 0; i--) {
      const o = this.orbs.active[i];
      o.t += dt;
      if (o.homing) {
        // turn toward Wren a little each frame
        const sp = Math.hypot(o.vx, o.vy);
        const cur = Math.atan2(o.vy, o.vx);
        let want = Math.atan2(p.y - o.by, p.x - o.bx) - cur;
        want = Math.atan2(Math.sin(want), Math.cos(want));
        const turn = Math.max(-1, Math.min(1, want)) * o.homing * dt;
        o.vx = Math.cos(cur + turn) * sp;
        o.vy = Math.sin(cur + turn) * sp;
      }
      if (o.reverseAt && o.t >= o.reverseAt) {
        // a boomerang: turn round and come back
        o.vx = -o.vx;
        o.vy = -o.vy;
        o.reverseAt = 0;
      }
      o.bx += o.vx * dt;
      o.by += o.vy * dt;
      if (o.bounce > 0) {
        const bb = room.bounds;
        if (o.bx < bb.x0 || o.bx > bb.x1) {
          o.vx = -o.vx;
          o.bx = Math.max(bb.x0, Math.min(bb.x1, o.bx));
          o.bounce--;
        }
        if (o.by < bb.y0 || o.by > bb.y1) {
          o.vy = -o.vy;
          o.by = Math.max(bb.y0, Math.min(bb.y1, o.by));
          o.bounce--;
        }
      }
      if (o.waveAmp) {
        // weave from side to side around its path
        const sp = Math.hypot(o.vx, o.vy) || 1;
        const off = Math.sin(o.t * o.waveFreq) * o.waveAmp;
        o.x = o.bx - (o.vy / sp) * off;
        o.y = o.by + (o.vx / sp) * off;
      } else {
        o.x = o.bx;
        o.y = o.by;
      }
      o.life -= dt;
      const bd = room.bounds;
      if (o.life <= 0 || o.x < bd.x0 || o.x > bd.x1 || o.y < bd.y0 || o.y > bd.y1) {
        if (o.land === 'web') this.manager.hazards.spawn(room, o.x, o.y, 16, 4, 0, 'web');
        else if (o.land === 'poison') this.manager.hazards.spawn(room, o.x, o.y, 22, 3, 1, 'poison');
        else this.game.effects.stoneImpact(o.x, o.y, o.h, 0, 0);
        this._releaseOrb(o);
        continue;
      }
      const dx = p.x - o.x;
      const dy = p.y - o.y;
      if (dx * dx + dy * dy < (pr + 4) * (pr + 4)) {
        p.hurt(o.damage, o.x - o.vx * 0.05, o.y - o.vy * 0.05, o.source);
        this._releaseOrb(o);
      }
    }
    // --- fireballs ---
    for (let i = this.fireballs.count - 1; i >= 0; i--) {
      const f = this.fireballs.active[i];
      f.t += dt;
      const k = Math.min(1, f.t / f.T);
      f.x = f.x0 + (f.x1 - f.x0) * k;
      f.y = f.y0 + (f.y1 - f.y0) * k;
      f.h = f.h0 * (1 - k) + 4 * 42 * k * (1 - k); // a high arc
      f.anim.update(dt);
      if (f.light) {
        f.light.x = f.x;
        f.light.y = f.y + f.h * 0.5;
      }
      if (k >= 1) {
        if (f.isFire) {
          this.game.effects.fireBurst(f.x, f.y);
          this.game.audio.play('fireLand');
        } else {
          this.game.effects.landDust(f.x, f.y, 8);
          this.game.audio.play('splat', 0.5);
        }
        if (f.cfg.patchRadius) this.manager.hazards.spawn(room, f.x, f.y, f.cfg.patchRadius, f.cfg.patchTime, f.cfg.patchDamage, f.cfg.patchKind || 'fire');
        if (f.cfg.shards) for (let k = 0; k < f.cfg.shards; k++) {
          const a = (k / f.cfg.shards) * Math.PI * 2;
          this.fireOrb(f.x, f.y, 4, Math.cos(a), Math.sin(a), 110, f.cfg.frame ?? 1, 1, f.cfg.source || 'the Dark');
        }
        this._releaseFireball(f);
      }
    }
  }

  _releaseBolt(b) {
    b.sprite.visible = false;
    this.bolts.release(b);
  }

  _releaseOrb(o) {
    o.sprite.visible = false;
    this.orbs.release(o);
  }

  _releaseFireball(f) {
    f.sprite.visible = f.shadow.visible = f.orb.visible = false;
    this.manager.returnLight(f.light);
    f.light = null;
    this.fireballs.release(f);
  }

  drawOverlay(o, time) {
    for (let i = 0; i < this.fireballs.count; i++) {
      const f = this.fireballs.active[i];
      const k = f.t / f.T;
      o.ring(f.x1, f.y1, f.cfg.patchRadius, k > 0.75 ? TELE.dangerHot : TELE.fire, telegraphAlpha(0.6 + k * 0.4, time));
    }
  }

  sync() {
    for (let i = 0; i < this.bolts.count; i++) {
      const b = this.bolts.active[i];
      b.sprite.place(b.x, b.y, b.h);
    }
    for (let i = 0; i < this.orbs.count; i++) {
      const o = this.orbs.active[i];
      o.sprite.place(o.x, o.y, o.h);
    }
    for (let i = 0; i < this.fireballs.count; i++) {
      const f = this.fireballs.active[i];
      f.sprite.place(f.x, f.y, f.h);
      f.orb.place(f.x, f.y, f.h);
      f.shadow.place(f.x, f.y - 6, 0, LAYER.shadow);
    }
  }

  clear() {
    for (let i = this.bolts.count - 1; i >= 0; i--) this._releaseBolt(this.bolts.active[i]);
    for (let i = this.orbs.count - 1; i >= 0; i--) this._releaseOrb(this.orbs.active[i]);
    for (let i = this.fireballs.count - 1; i >= 0; i--) this._releaseFireball(this.fireballs.active[i]);
  }
}
