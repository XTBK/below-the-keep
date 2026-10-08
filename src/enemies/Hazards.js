import { Pool } from '../core/Pool.js';
import { Sprite, Animator, depthFor, DEPTH_BIAS, LAYER } from '../render/Sprite.js';
import { LIGHTING, PLAYER } from '../data/config.js';
import { fxRng } from '../core/Rng.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { linearColors } from '../render/Particles.js';
import { CHAPTERS } from '../data/palettes.js';

// Things on the floor that hurt (or hinder) Wren.
//
//  PATCHES (last a few seconds):
//    'fire'   - a few flames on a scorch mark; burns
//    'poison' - a sickly green cloud (plague flasks, spore bloaters); hurts
//    'web'    - sticky webbing; slows Wren down, doesn't hurt
//
//  ERUPTIONS (a telegraph ring, then a burst): root spikes, bone spikes, fire pillars, a grave worm
//  bursting up, shockwaves, skulls falling from the ceiling. Lines of eruptions (roots racing
//  along the ground, an executioner's shockwave) are just several eruptions with growing delays.

const FLAMES = 3;
const PATCH_LIGHT = { brightness: 0.8, height: 18, radius: 100, color: 0xff7a30, flicker: 0.35, flickerSpeed: 12 };
const POISON = { life: [0.8, 1.6], size: [2, 3], colors: linearColors(['#5a8a26', '#8ac040', '#3a5a1a'], 1.3), alpha: 0.45, gravity: -10, drag: 1.5, wander: 12, fadeInOut: true };
const SPORE = { life: [0.9, 1.7], size: [2, 3], colors: linearColors([CHAPTERS.hollow.glowPurple[2], CHAPTERS.hollow.glowTeal[2]], 1.2), alpha: 0.45, gravity: -8, drag: 1.5, wander: 14, fadeInOut: true };
const FALLING = new Set([5, 6]); // visuals that drop from above instead of bursting up

export class Hazards {
  constructor(game, manager) {
    this.game = game;
    this.manager = manager;
    const scene = game.renderer.scene;
    this.patches = new Pool(() => {
      const flames = [];
      for (let i = 0; i < FLAMES; i++) {
        const s = new Sprite(scene, 'flame', { lit: false, glow: LIGHTING.flameIntensity });
        s.visible = false;
        const a = new Animator(s);
        a.play('burn');
        flames.push({ sprite: s, anim: a, ox: 0, oy: 0 });
      }
      const web = new Sprite(scene, 'web', { anchorY: 16 });
      web.visible = false;
      return { flames, web, kind: '', room: null, x: 0, y: 0, r: 0, ttl: 0, damage: 1, light: null, acc: 0, spores: false };
    }, 48); // fire trails and footprints need plenty
    this.eruptions = new Pool(() => {
      const s = new Sprite(scene, 'eruptions', { lit: false, glow: 1.3, anchorY: 2 });
      s.visible = false;
      return { sprite: s, x: 0, y: 0, t: 0, delay: 0, radius: 0, damage: 1, visual: 0, shards: 0, shardFrame: 1, shardSpeed: 120, source: '', done: false };
    }, 64);
  }

  /** A patch on the floor. kind: 'fire' | 'poison' | 'web'. */
  spawn(room, x, y, r, ttl, damage, kind = 'fire', spores = false) {
    const f = this.patches.acquire();
    if (!f) return;
    f.kind = kind;
    f.room = room;
    f.x = x;
    f.y = y;
    f.r = r;
    f.ttl = ttl;
    f.damage = damage;
    f.acc = 0;
    f.spores = spores;
    if (kind === 'fire') {
      for (let i = 0; i < FLAMES; i++) {
        const fl = f.flames[i];
        const a = (i / FLAMES) * Math.PI * 2 + fxRng.float(0, 1);
        fl.ox = Math.cos(a) * r * 0.5;
        fl.oy = Math.sin(a) * r * 0.35;
        fl.anim.time = fxRng.float(0, 5);
        fl.sprite.visible = true;
      }
      f.light = this.manager.borrowLight({ ...PATCH_LIGHT, x, y });
      this.manager.decal(room, 'scorch', x, y - 2);
    } else if (kind === 'web') {
      f.web.visible = true;
      f.web.place(x, y, 0, LAYER.floorDecal + 0.04);
    } else {
      this.manager.decal(room, 'goo', x, y - 2);
    }
  }

  /**
   * Something bursts out of the floor (or drops from the ceiling) at (x, y) after `delay` seconds.
   * opts: { visual, damage, shards, shardFrame, shardSpeed, source }
   */
  erupt(x, y, delay, radius, opts = {}) {
    const e = this.eruptions.acquire();
    if (!e) return;
    e.x = x;
    e.y = y;
    e.t = 0;
    e.delay = delay;
    e.radius = radius;
    e.damage = opts.damage ?? 1;
    e.visual = opts.visual ?? 0;
    e.shards = opts.shards ?? 0;
    e.shardFrame = opts.shardFrame ?? 1;
    e.shardSpeed = opts.shardSpeed ?? 120;
    e.source = opts.source || 'the Dark';
    e.done = false;
    e.sprite.setFrame(e.visual, 0);
    e.sprite.visible = false;
  }

  update(dt) {
    const g = this.game;
    const p = g.player;
    const fx = g.effects;
    for (let i = this.patches.count - 1; i >= 0; i--) {
      const f = this.patches.active[i];
      f.ttl -= dt;
      if (f.ttl <= 0) {
        this._releasePatch(f);
        continue;
      }
      const dx = p.x - f.x;
      const dy = (p.y - f.y) / 0.7;
      const inside = dx * dx + dy * dy < (f.r + PLAYER.radius * 0.5) ** 2;
      if (f.kind === 'fire') {
        const lit = Math.ceil((f.ttl / 0.6) * FLAMES);
        for (let k = 0; k < FLAMES; k++) {
          f.flames[k].sprite.visible = k < lit;
          f.flames[k].anim.update(dt);
        }
        f.acc += dt * 8;
        while (f.acc >= 1) {
          f.acc -= 1;
          fx.glow.emit(fx.presets.ember, f.x + fxRng.float(-f.r, f.r), f.y + fxRng.float(-f.r * 0.6, f.r * 0.6), 2, fxRng.float(-5, 5), 0, fxRng.float(20, 40));
        }
        if (inside) p.hurt(f.damage, f.x, f.y, 'Burning Pitch');
      } else if (f.kind === 'poison') {
        f.acc += dt * 26;
        while (f.acc >= 1) {
          f.acc -= 1;
          const a = fxRng.float(0, Math.PI * 2);
          const r = fxRng.float(0, f.r);
          fx.glow.emit(f.spores ? SPORE : POISON, f.x + Math.cos(a) * r, f.y + Math.sin(a) * r * 0.7, fxRng.float(0, 8), fxRng.float(-6, 6), fxRng.float(-4, 4), fxRng.float(4, 12));
        }
        if (inside) p.hurt(f.damage, f.x, f.y, f.spores ? 'a Cloud of Spores' : 'a Plague Cloud');
      } else if (f.kind === 'web') {
        f.web.visible = f.ttl > 0.4 || Math.floor(f.ttl * 20) % 2 === 0;
        if (inside) p.slowT = 0.15;
      }
    }

    for (let i = this.eruptions.count - 1; i >= 0; i--) {
      const e = this.eruptions.active[i];
      e.t += dt;
      if (!e.done && e.t >= e.delay) {
        e.done = true;
        e.sprite.visible = true;
        if (Math.hypot(p.x - e.x, p.y - e.y) < e.radius + PLAYER.radius) p.hurt(e.damage, e.x, e.y, e.source);
        for (let k = 0; k < e.shards; k++) {
          const a = (k / e.shards) * Math.PI * 2 + 0.2;
          this.manager.shots.fireOrb(e.x, e.y, 6, Math.cos(a), Math.sin(a), e.shardSpeed, e.shardFrame, 1, e.source);
        }
        if (e.visual === 2) fx.fireBurst(e.x, e.y);
        else fx.landDust(e.x, e.y, 8);
        g.audio.play(e.visual === 2 ? 'fireLand' : e.visual === 5 ? 'thud' : 'pop', 0.5);
        g.feel.shake(0.08);
      }
      if (e.t >= e.delay + 0.4) {
        e.sprite.visible = false;
        this.eruptions.release(e);
      }
    }
  }

  _releasePatch(f) {
    for (const fl of f.flames) fl.sprite.visible = false;
    f.web.visible = false;
    this.manager.returnLight(f.light);
    f.light = null;
    this.patches.release(f);
  }

  drawOverlay(o, time) {
    // fire and poison on the floor: a bright pulsing rim, so a puddle can be seen (and stepped around)
    // even in the dark and under everything else going on
    for (let i = 0; i < this.patches.count; i++) {
      const f = this.patches.active[i];
      if (f.kind !== 'fire' && f.kind !== 'poison') continue;
      const fade = Math.min(1, f.ttl / 0.5); // it fades out just before it goes
      const pulse = 0.55 + 0.25 * Math.sin(time * 9 + f.x * 0.1);
      const c = f.kind === 'fire' ? TELE.fire : TELE.poison;
      o.ring(f.x, f.y, f.r + 2, c, pulse * fade);
      o.ring(f.x, f.y, f.r - 1, c, pulse * fade * 0.45);
    }
    for (let i = 0; i < this.eruptions.count; i++) {
      const e = this.eruptions.active[i];
      if (e.done) continue;
      const k = e.t / e.delay;
      o.ring(e.x, e.y, e.radius, k > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(k, time));
      if (FALLING.has(e.visual)) o.ring(e.x, e.y, e.radius * (1 - k * 0.7), TELE.danger, 0.4); // the shadow tightening
    }
  }

  sync() {
    for (let i = 0; i < this.patches.count; i++) {
      const f = this.patches.active[i];
      if (f.kind !== 'fire') continue;
      for (const fl of f.flames) {
        const gy = f.y + fl.oy;
        fl.sprite.place(f.x + fl.ox, gy - 2, 0, depthFor(gy) + DEPTH_BIAS);
      }
    }
    for (let i = 0; i < this.eruptions.count; i++) {
      const e = this.eruptions.active[i];
      if (FALLING.has(e.visual) && !e.done && e.t > e.delay - 0.3) {
        // the skull / spear plummets during the last moment
        e.sprite.visible = true;
        e.sprite.place(e.x, e.y, ((e.delay - e.t) / 0.3) * 90);
      } else if (e.sprite.visible) e.sprite.place(e.x, e.y);
    }
  }

  clear() {
    for (let i = this.patches.count - 1; i >= 0; i--) this._releasePatch(this.patches.active[i]);
    for (let i = this.eruptions.count - 1; i >= 0; i--) {
      this.eruptions.active[i].sprite.visible = false;
      this.eruptions.release(this.eruptions.active[i]);
    }
  }
}
