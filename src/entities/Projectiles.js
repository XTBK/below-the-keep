import * as THREE from 'three';
import { PROJECTILE, FEEL, COMBAT } from '../data/config.js';
import { MODS } from '../data/items.js';
import { Pool } from '../core/Pool.js';
import { getSheet } from '../render/Assets.js';
import { makeLitMaterial, depthFor, LAYER } from '../render/Sprite.js';
import { fxRng } from '../core/Rng.js';
import { pointInBox } from '../world/Collision.js';

// Wren's stones, built as a MODIFIER PIPELINE.
//
// Each relic adds modifier stacks (homing, pierce, bounce, split, burn, poison, spectral, size,
// orbit, chain, explode, boomerang, frost, wave, gild, knockback, fear - see MODS in src/data/items.js). Every stone carries the numbers for all of
// them, and each modifier is handled by ONE independent step below. Because the steps don't know
// about each other, combinations just work:
//   split children inherit every other modifier (homing + split = homing splinters),
//   explode + pierce explodes on every enemy it passes, bounce + burn ricochets on fire, etc.
//
// Drawing: one InstancedMesh per stone size (3 sizes), tinted per stone, plus one for shadows.
// Two looks: 'sling' (lit grey stones) and 'wand' (glowing spell bolts, for Wren the wizard).
// Only the look and the impact effects differ; every modifier works the same either way.

const _m = new THREE.Matrix4();
const _c = new THREE.Color();
const TIER_RADIUS = [PROJECTILE.hitRadius, PROJECTILE.hitRadius + MODS.size.hitRadius, PROJECTILE.hitRadius + MODS.size.hitRadius * 2];
const MAX_HITS = 8;
const ARC_COLOR = new THREE.Color(1.4, 2.2, 3.4);

export class Projectiles {
  constructor(game) {
    this.game = game;
    this.pool = new Pool(
      () => ({
        x: 0, y: 0, h: 0, vx: 0, vy: 0, vh: 0, travelled: 0, range: 0, damage: 0, falling: false,
        tier: 0, r: 1, g: 1, b: 1,
        homing: 0, pierce: 0, bounce: 0, spectral: 0, split: 0, gen: 0,
        burn: 0, poison: 0, explode: 0, chain: 0,
        boomerang: 0, returning: false, frost: 0, wave: 0, waveT: 0, gild: 0, knockback: 0, fear: 0,
        orbit: false, orbitAngle: 0, orbitTime: 0,
        hits: new Array(MAX_HITS).fill(null), hitCount: 0, trailAcc: 0,
      }),
      PROJECTILE.poolSize,
    );

    const scene = game.renderer.scene;
    const sheet = getSheet('stones');
    const spells = getSheet('spells');
    const quarrels = getSheet('quarrels');
    this.boltMats = [];
    this.meshes = [];
    this.stoneMats = [];
    this.spellMats = [];
    this.style = 'sling';
    for (let tier = 0; tier < 3; tier++) {
      const map = sheet.map.clone();
      map.needsUpdate = true;
      map.repeat.set(1 / 3, 1);
      map.offset.set(tier / 3, 0);
      const normal = sheet.normalMap.clone();
      normal.needsUpdate = true;
      normal.repeat.set(1 / 3, 1);
      normal.offset.set(tier / 3, 0);
      const mat = makeLitMaterial(map, normal, { emissive: 0x3a3a3a });
      this.stoneMats.push(mat);
      // spell bolts: unlit and brighter than white, so they glow and bloom
      const smap = spells.map.clone();
      smap.needsUpdate = true;
      smap.repeat.set(1 / 3, 1);
      smap.offset.set(tier / 3, 0);
      this.spellMats.push(new THREE.MeshBasicMaterial({ map: smap, alphaTest: 0.4 }));
      // crossbow bolts: lit like the stones, rotated to fly point-first
      const qmap = quarrels.map.clone();
      qmap.needsUpdate = true;
      qmap.repeat.set(1 / 3, 1);
      qmap.offset.set(tier / 3, 0);
      const qn = quarrels.normalMap.clone();
      qn.needsUpdate = true;
      qn.repeat.set(1 / 3, 1);
      qn.offset.set(tier / 3, 0);
      this.boltMats.push(makeLitMaterial(qmap, qn, { emissive: 0x4a4a4a }));
      const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(16, 16), mat, PROJECTILE.poolSize);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(PROJECTILE.poolSize * 3), 3);
      mesh.frustumCulled = false;
      mesh.count = 0;
      scene.add(mesh);
      this.meshes.push(mesh);
    }

    const sh = getSheet('shadows');
    const shadowMap = sh.map.clone();
    shadowMap.needsUpdate = true;
    shadowMap.repeat.set(1 / sh.def.cols, 1);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: shadowMap, color: 0x000000, transparent: true, depthWrite: false });
    this.shadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(32, 12), this.shadowMat, PROJECTILE.poolSize);
    this.shadows.frustumCulled = false;
    this.shadows.count = 0;
    scene.add(this.shadows);

    // short-lived lightning arcs (chain modifier), drawn on the enemy telegraph overlay
    this.arcs = [];
    for (let i = 0; i < 16; i++) this.arcs.push({ ttl: 0, x0: 0, y0: 0, x1: 0, y1: 0, seed: 0 });
  }

  /** 'sling' (stones) or 'wand' (spell bolts) - set from the character when a run starts. */
  setStyle(style) {
    // the Iron Knight's thrown sword-wave glows like a spell
    this.style = style === 'wand' || style === 'sword' ? 'wand' : style === 'crossbow' ? 'crossbow' : 'sling';
    const mats = this.style === 'wand' ? this.spellMats : this.style === 'crossbow' ? this.boltMats : this.stoneMats;
    this.meshes.forEach((m, i) => (m.material = mats[i]));
  }

  get wand() {
    return this.style === 'wand';
  }

  /** The flash where a shot ends: stone chips, or a burst of arcane sparks. */
  _impact(x, y, h, dx, dy, loud = true) {
    if (this.wand) this.game.effects.spellImpact(x, y, h);
    else this.game.effects.stoneImpact(x, y, h, dx, dy);
    if (loud) this.game.audio.play(this.wand ? 'spellHit' : 'impact', this.wand ? 0.7 : 1);
  }

  /**
   * Fire a stone. `shot` is the player's shot profile (Player.shot): damage, range, tier, tint
   * and every modifier's stack count.
   */
  spawn(x, y, h, vx, vy, shot, gen = 0, damageScale = 1) {
    const p = this.pool.acquire();
    if (!p) return null;
    p.x = x;
    p.y = y;
    p.h = h;
    p.vx = vx;
    p.vy = vy;
    p.vh = 0;
    p.travelled = 0;
    p.range = shot.range;
    p.damage = shot.damage * damageScale;
    p.falling = false;
    p.tier = Math.max(0, shot.tier - gen); // split children are a size smaller
    p.r = shot.tint[0];
    p.g = shot.tint[1];
    p.b = shot.tint[2];
    p.homing = shot.homing;
    p.sureCrit = false;
    p.pierce = shot.pierce * MODS.pierce.hits;
    p.bounce = shot.bounce * MODS.bounce.bounces;
    p.spectral = shot.spectral;
    p.split = gen === 0 ? shot.split : 0; // children don't split again
    p.gen = gen;
    p.burn = shot.burn;
    p.poison = shot.poison;
    p.explode = shot.explode;
    p.chain = shot.chain;
    p.boomerang = shot.boomerang || 0;
    p.returning = false;
    p.frost = shot.frost || 0;
    p.wave = shot.wave || 0;
    p.waveT = 0;
    p.gild = shot.gild || 0;
    p.knockback = shot.knockback || 0;
    p.fear = shot.fear || 0;
    // the Alchemist: now and then a stone gains an element it didn't have
    const alch = this.game.player && this.game.player.setPower('alchemy');
    if (alch && fxRng.chance(alch.elementChance)) {
      const k = fxRng.pick(['burn', 'poison', 'frost', 'chain', 'explode']);
      p[k] += 1;
    }
    p.orbit = false;
    p.hitCount = 0;
    p.trailAcc = 0;
    p.shot = shot;
    return p;
  }

  /** A stone that circles Wren for a while (orbit modifier). */
  spawnOrbit(shot, angle) {
    const p = this.spawn(this.game.player.x, this.game.player.y, 12, 0, 0, shot);
    if (!p) return;
    p.orbit = true;
    p.orbitAngle = angle;
    p.orbitTime = MODS.orbit.time;
    p.pierce = Math.max(p.pierce, 3); // a circling stone can clip a few enemies
  }

  clear() {
    this.pool.releaseAll();
  }

  // ------------------------------------------------------------------------------------------
  update(dt, room) {
    const { effects } = this.game;
    const pool = this.pool;
    for (let i = pool.count - 1; i >= 0; i--) {
      const p = pool.active[i];

      if (p.orbit) {
        this._updateOrbit(p, dt);
        if (p._poolIndex < 0) continue;
      } else {
        if (p.homing > 0 && !p.returning) this._steerHoming(p, dt);
        if (p.returning) this._steerHome(p, dt);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.wave > 0) {
          // weave: a sideways sway on top of the straight flight
          const w = MODS.wave;
          const sp = Math.hypot(p.vx, p.vy) || 1;
          const prev = Math.sin(p.waveT * w.frequency);
          p.waveT += dt;
          const off = (Math.sin(p.waveT * w.frequency) - prev) * w.amplitude * p.wave;
          p.x += (-p.vy / sp) * off;
          p.y += (p.vx / sp) * off;
        }
        p.travelled += Math.hypot(p.vx, p.vy) * dt;
        if (!p.falling && p.travelled >= p.range) {
          if (p.boomerang > 0 && !p.returning) {
            // the boomerang turns for home instead of dropping
            p.returning = true;
            p.travelled = 0;
            p.range = 900;
            p.hitCount = 0; // it may hit the same enemies again on the way back
          } else {
            p.falling = true;
            p.vh = 0;
          }
        }
        if (p.returning) {
          const pl = this.game.player;
          if ((pl.x - p.x) ** 2 + (pl.y - p.y) ** 2 < 120) {
            this._release(p); // caught
            continue;
          }
        }
        if (p.falling) {
          p.vh -= PROJECTILE.dropGravity * dt;
          p.h += p.vh * dt;
          if (p.h <= 0) {
            if (this.wand) effects.spellImpact(p.x, p.y, 0);
            else effects.stoneLand(p.x, p.y);
            this.game.audio.play(this.wand ? 'spellHit' : 'land', this.wand ? 0.4 : 1);
            this._onImpact(p, p.x, p.y, 0, 0);
            this._release(p);
            continue;
          }
        }
      }
      this._trail(p, dt);

      const speed = Math.hypot(p.vx, p.vy) || 1;
      const dx = p.vx / speed;
      const dy = p.vy / speed;
      const radius = TIER_RADIUS[p.tier];

      // --- walls (bounce modifier: ricochet) ---
      if (!p.orbit) {
        const b = room.bounds;
        if (p.x < b.x0 || p.x > b.x1 || p.y < b.y0 || p.y > b.y1) {
          if (p.bounce > 0) {
            p.bounce--;
            if (p.x < b.x0 || p.x > b.x1) p.vx = -p.vx;
            if (p.y < b.y0 || p.y > b.y1) p.vy = -p.vy;
            p.x = Math.max(b.x0, Math.min(b.x1, p.x));
            p.y = Math.max(b.y0, Math.min(b.y1, p.y));
            this._impact(p.x, p.y, p.h, dx, dy, false);
            this.game.audio.play(this.wand ? 'spellHit' : 'impact', 0.5);
          } else {
            const ix = Math.max(b.x0, Math.min(b.x1, p.x));
            const iy = Math.max(b.y0, Math.min(b.y1, p.y));
            this.game.feel.shake(FEEL.impactShake);
            this._impact(ix, iy, p.h, dx, dy);
            this._onImpact(p, ix, iy, dx, dy);
            this._release(p);
            continue;
          }
        }
      }

      // --- enemies (pierce: keep going; split / explode / chain / burn / poison on hit) ---
      const enemy = this.game.enemies.hitTest(p.x, p.y, radius, p.hits, p.hitCount);
      if (enemy) {
        this._hitEnemy(p, enemy, dx, dy);
        if (p.pierce > 0) {
          p.pierce--;
          if (p.hitCount < MAX_HITS) p.hits[p.hitCount++] = enemy;
        } else {
          this._release(p);
          continue;
        }
      }

      // --- candles and puzzle stands: a stone snuffs them ---
      if (!p.orbit && room.stoneHit(p.x, p.y)) {
        this._release(p);
        continue;
      }

      // --- rocks, barrels... (spectral: pass straight through) ---
      if (!p.spectral && !p.orbit) {
        const solids = room.solids;
        let hitSolid = null;
        for (let s = 0; s < solids.length; s++) {
          const box = solids[s];
          if (box.pit) continue;
          if (pointInBox(p.x, p.y, box, radius)) {
            hitSolid = box;
            break;
          }
        }
        if (hitSolid) {
          if (hitSolid.owner && hitSolid.owner.hit) hitSolid.owner.hit(p.damage, dx, dy);
          if (p.bounce > 0 && !hitSolid.owner) {
            // ricochet off the rock: flip whichever axis we came in on
            p.bounce--;
            const fromX = p.x - p.vx * dt;
            if (fromX < hitSolid.x0 - radius || fromX > hitSolid.x1 + radius) p.vx = -p.vx;
            else p.vy = -p.vy;
            p.x += p.vx * dt * 2;
            p.y += p.vy * dt * 2;
            this._impact(p.x, p.y, p.h, dx, dy, false);
          } else {
            this.game.feel.shake(FEEL.impactShake);
            this._impact(p.x, p.y, p.h, dx, dy);
            this._onImpact(p, p.x, p.y, dx, dy);
            this._release(p);
          }
        }
      }
    }

    for (const a of this.arcs) if (a.ttl > 0) a.ttl -= dt;
  }

  // --- modifier steps ------------------------------------------------------------------------

  _steerHoming(p, dt) {
    const target = this._nearestEnemy(p.x, p.y, MODS.homing.seekRange, null);
    if (!target) return;
    const speed = Math.hypot(p.vx, p.vy);
    const cur = Math.atan2(p.vy, p.vx);
    let want = Math.atan2(target.y - p.y, target.x - p.x) - cur;
    want = Math.atan2(Math.sin(want), Math.cos(want));
    const turn = Math.max(-1, Math.min(1, want)) * MODS.homing.turnRate * p.homing * dt;
    p.vx = Math.cos(cur + turn) * speed;
    p.vy = Math.sin(cur + turn) * speed;
  }

  /** A returning boomerang stone steers hard back toward Wren. */
  _steerHome(p, dt) {
    const pl = this.game.player;
    const speed = Math.max(220, Math.hypot(p.vx, p.vy));
    const cur = Math.atan2(p.vy, p.vx);
    let want = Math.atan2(pl.y - p.y, pl.x - p.x) - cur;
    want = Math.atan2(Math.sin(want), Math.cos(want));
    const turn = Math.max(-1, Math.min(1, want)) * 9 * dt;
    p.vx = Math.cos(cur + turn) * speed;
    p.vy = Math.sin(cur + turn) * speed;
  }

  _updateOrbit(p, dt) {
    const o = MODS.orbit;
    const pl = this.game.player;
    p.orbitTime -= dt;
    p.orbitAngle += o.speed * dt;
    const nx = pl.x + Math.cos(p.orbitAngle) * o.radius;
    const ny = pl.y + Math.sin(p.orbitAngle) * o.radius * 0.8;
    p.vx = (nx - p.x) / Math.max(dt, 0.001);
    p.vy = (ny - p.y) / Math.max(dt, 0.001);
    p.x = nx;
    p.y = ny;
    p.h = 12;
    if (p.orbitTime <= 0) {
      // fling it outward at the end
      p.orbit = false;
      p.vx = -Math.sin(p.orbitAngle) * 200;
      p.vy = Math.cos(p.orbitAngle) * 200;
      p.travelled = 0;
      p.range = 80;
    }
  }

  _hitEnemy(p, enemy, dx, dy) {
    // a critical hit now and then: double damage, a gold flash, a harder freeze
    const crit = p.sureCrit || this.game.rollCrit();
    const dmg = p.damage * (crit ? COMBAT.critMultiplier : 1);
    const hpBefore = enemy.hp;
    enemy.hit(dmg, dx, dy);
    this.game.combatFeedback(enemy, Math.min(dmg, Math.max(0, hpBefore)), crit);
    this.game.feel.shake(FEEL.impactShake);
    if (p.burn > 0) enemy.applyStatus('burn', MODS.burn.time, p.damage * MODS.burn.dps * p.burn);
    if (p.poison > 0) enemy.applyStatus('poison', MODS.poison.time, p.damage * MODS.poison.dps * p.poison);
    if (p.chain > 0) this._chainLightning(enemy, p);
    if (p.explode > 0) this._explode(p, p.x, p.y);
    if (p.split > 0) this._split(p, dx, dy);
    if (p.knockback > 0 && enemy.alive) {
      const k = (MODS.knockback.force * p.knockback * 160) / enemy.def.mass;
      enemy.kbx += dx * k;
      enemy.kby += dy * k;
    }
    if (p.frost > 0) enemy.chill(MODS.frost.time * p.frost);
    if (p.gild > 0 && fxRng.chance(MODS.gild.chance * p.gild)) enemy.gild(MODS.gild.time);
    if (p.fear > 0 && fxRng.chance(MODS.fear.chance * p.fear)) enemy.scare(MODS.fear.time);
  }

  /** Anything that ends a stone's flight (wall, rock, floor) still triggers explode and split. */
  _onImpact(p, x, y, dx, dy) {
    if (p.explode > 0) this._explode(p, x, y);
    if (p.split > 0 && (dx !== 0 || dy !== 0)) this._split(p, -dx, -dy);
  }

  _split(p, dx, dy) {
    const s = MODS.split;
    const n = s.children * p.split;
    const base = Math.atan2(dy, dx);
    const speed = Math.max(140, Math.hypot(p.vx, p.vy) * 0.8);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * s.spread;
      const c = this.spawn(p.x + Math.cos(a) * 6, p.y + Math.sin(a) * 6, Math.max(6, p.h), Math.cos(a) * speed, Math.sin(a) * speed, p.shot, 1, s.damage);
      if (c) {
        c.range = p.range * 0.5;
        // the children shouldn't instantly hit what the parent just hit
        for (let k = 0; k < p.hitCount; k++) c.hits[c.hitCount++] = p.hits[k];
      }
    }
    p.split = 0;
  }

  _explode(p, x, y) {
    const e = MODS.explode;
    const radius = e.radius * (1 + 0.3 * (p.explode - 1));
    const dmg = p.damage * e.damage * p.explode;
    this.game.enemies.forEachAlive(this.game.room, (en) => {
      const dx = en.x - x;
      const dy = en.y - y;
      if (dx * dx + dy * dy < radius * radius) en.hit(dmg, dx / (Math.hypot(dx, dy) || 1), dy / (Math.hypot(dx, dy) || 1), true);
    });
    for (const prop of this.game.room.props) {
      if (prop.broken || !prop.hit) continue;
      if ((prop.x - x) ** 2 + (prop.ground - y) ** 2 < radius * radius) prop.hit(dmg);
    }
    this.game.effects.fireBurst(x, y);
    this.game.effects.burst(this.game.effects.presets.woodDust, x, y, 4, 6, 60, 30);
    this.game.audio.play('pop');
  }

  _chainLightning(from, p) {
    const c = MODS.chain;
    let src = from;
    const jumps = c.jumps * p.chain;
    const hitSet = this._chainSet || (this._chainSet = []);
    hitSet.length = 0;
    hitSet.push(from);
    for (let j = 0; j < jumps; j++) {
      const next = this._nearestEnemy(src.x, src.y, c.range, hitSet);
      if (!next) break;
      next.hit(p.damage * c.damage, 0, 0, true);
      next.sprite.flash(0.1);
      this.addArc(src.x, src.y + 10, next.x, next.y + 10);
      hitSet.push(next);
      src = next;
    }
    if (hitSet.length > 1) this.game.audio.play('zap');
  }

  addArc(x0, y0, x1, y1) {
    let a = this.arcs[0];
    for (const arc of this.arcs) if (arc.ttl <= a.ttl) a = arc;
    a.ttl = 0.18;
    a.x0 = x0;
    a.y0 = y0;
    a.x1 = x1;
    a.y1 = y1;
    a.seed = fxRng.float(0, 100);
  }

  _nearestEnemy(x, y, range, exclude) {
    // (a plain loop: this runs every frame for every homing stone, so no closures)
    let best = null;
    let bestD = range * range;
    const list = this.game.enemies.active;
    const room = this.game.room;
    for (let i = 0; i < list.length; i++) {
      const e = list[i];
      if (e.room !== room || !e.alive || e.state === 'dormant') continue; // never point at a sleeping mimic
      if (exclude && exclude.indexOf(e) >= 0) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  /** Little particle trails that show what a stone carries. */
  _trail(p, dt) {
    p.trailAcc += dt * 30;
    if (p.trailAcc < 1) return;
    p.trailAcc = 0;
    const fx = this.game.effects;
    if (this.wand && fxRng.chance(0.45)) fx.glow.emit(fx.presets.holy, p.x, p.y, p.h, fxRng.float(-8, 8), fxRng.float(-8, 8), fxRng.float(-4, 8)); // a trail of motes
    if (p.burn > 0) fx.glow.emit(fx.presets.ember, p.x, p.y, p.h, fxRng.float(-10, 10), fxRng.float(-10, 10), fxRng.float(5, 20));
    if (p.chain > 0 && fxRng.chance(0.5)) fx.glow.emit(fx.presets.spark, p.x, p.y, p.h, fxRng.float(-40, 40), fxRng.float(-40, 40), fxRng.float(-10, 30));
    if (p.explode > 0 && fxRng.chance(0.4)) fx.glow.emit(fx.presets.spark, p.x, p.y, p.h + 3, fxRng.float(-15, 15), fxRng.float(-15, 15), fxRng.float(10, 30));
    if (p.poison > 0 && fxRng.chance(0.5)) fx.lit.emit(fx.presets.goo, p.x, p.y, p.h, 0, 0, -10);
    if (p.spectral > 0 && fxRng.chance(0.5)) fx.lit.emit(fx.presets.crackDust, p.x, p.y, p.h, 0, 0, 4);
    if (p.frost > 0 && fxRng.chance(0.5)) fx.glow.emit(fx.presets.holy, p.x, p.y, p.h, fxRng.float(-8, 8), fxRng.float(-8, 8), 0);
    if (p.gild > 0 && fxRng.chance(0.3)) fx.glow.emit(fx.presets.gold, p.x, p.y, p.h, 0, 0, 5);
  }

  _release(p) {
    this.pool.release(p);
  }

  // ------------------------------------------------------------------------------------------
  /** Write every live stone into the instanced meshes (whole-pixel positions). */
  sync() {
    const pool = this.pool;
    const counts = [0, 0, 0];
    const dim = pool.count > 14 ? Math.max(0.55, 1 - (pool.count - 14) * 0.02) : 1;
    for (let i = 0; i < pool.count; i++) {
      const p = pool.active[i];
      const mesh = this.meshes[p.tier];
      const k = counts[p.tier]++;
      if (this.style === 'crossbow') {
        // point the bolt along its flight
        _m.makeRotationZ(Math.atan2(p.vy, p.vx));
        _m.setPosition(Math.round(p.x), Math.round(p.y + p.h), depthFor(p.y));
      } else _m.makeTranslation(Math.round(p.x), Math.round(p.y + p.h), depthFor(p.y));
      mesh.setMatrixAt(k, _m);
      // your own shots glow less when the air is thick with them, so enemy shots stay easy to see
      const k2 = (this.wand ? 1.3 : 1) * dim;
      _c.setRGB(p.r * k2, p.g * k2, p.b * k2);
      mesh.setColorAt(k, _c);
      _m.makeTranslation(Math.round(p.x), Math.round(p.y) - 1, LAYER.shadow + 0.01);
      this.shadows.setMatrixAt(i, _m);
    }
    for (let t = 0; t < 3; t++) {
      const mesh = this.meshes[t];
      mesh.count = counts[t];
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
    }
    this.shadows.count = pool.count;
    this.shadows.instanceMatrix.needsUpdate = true;
  }

  /** Lightning arcs between chained enemies: jagged glowing lines. */
  drawOverlay(o) {
    for (const a of this.arcs) {
      if (a.ttl <= 0) continue;
      const steps = 6;
      let px = a.x0;
      let py = a.y0;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const jitter = i === steps ? 0 : Math.sin(a.seed + i * 12.9) * 6;
        const nx = a.x0 + (a.x1 - a.x0) * t - ((a.y1 - a.y0) / 60) * jitter;
        const ny = a.y0 + (a.y1 - a.y0) * t + ((a.x1 - a.x0) / 60) * jitter;
        o.line(px, py, nx, ny, ARC_COLOR, Math.min(1, a.ttl * 8), 3);
        px = nx;
        py = ny;
      }
    }
  }
}

