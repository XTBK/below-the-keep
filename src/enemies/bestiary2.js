import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { depthFor } from '../render/Sprite.js';
import { fxRng } from '../core/Rng.js';
import { PLAYER } from '../data/config.js';

// The second bestiary: five more creatures per chapter. Every attack has a telegraph (a red line,
// ring or arc, or an obvious wind-up pose) before it can hurt. See data/enemies.js for the numbers.

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };
const CHAIN = new THREE.Color('#6a6c78');
const TONGUE = new THREE.Color('#a8303e');
const LINEN = new THREE.Color('#a89a7a');
const AURA = new THREE.Color(1.6, 1.25, 0.4);

/** Distance from point (px, py) to the segment (x0, y0)-(x1, y1). */
function segDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2));
  return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t));
}

/** Yank Wren toward (x, y). */
function pullPlayer(game, x, y, strength) {
  const p = game.player;
  const dx = x - p.x;
  const dy = y - p.y;
  const d = Math.hypot(dx, dy) || 1;
  p.vx = (dx / d) * strength;
  p.vy = (dy / d) * strength;
}

function keepRange(e, v, [near, far], strafe = 1) {
  if (v.dist < near) {
    e.vx = (-v.x / v.dist) * e.speed;
    e.vy = (-v.y / v.dist) * e.speed;
  } else if (v.dist > far) e.chase(e.speed);
  else {
    e.vx = (-v.y / v.dist) * strafe * e.speed * 0.6;
    e.vy = (v.x / v.dist) * strafe * e.speed * 0.6;
  }
}

function line(o, e, dx, dy, len, t, time, width = 0) {
  e.room.nav.raycast(e.x, e.y, dx, dy, len, end);
  const c = t > 0.75 ? TELE.dangerHot : TELE.danger;
  const a = telegraphAlpha(t, time);
  if (!width) o.line(e.x, e.y, end.x, end.y, c, a, 3, 3);
  else for (const off of [-width, width]) o.line(e.x - dy * off, e.y + dx * off, end.x - dy * off, end.y + dx * off, c, a, 3, 3);
}

/** A hop toward a target in an arc (slimes, toads). Shared by a few creatures. */
class Hopper extends Enemy {
  onSpawn() {
    this.setState('rest');
    this.restFor = fxRng.float(...this.def.restTime);
  }
  get touchDamage() {
    return this.h > 6 ? 0 : this.def.contactDamage;
  }
  _startHop() {
    const d = this.def;
    this.toPlayer(v);
    const dist = Math.min(d.hopDistance, v.dist);
    this.fx = this.x;
    this.fy = this.y;
    const b = this.room.bounds;
    this.tx = Math.max(b.x0 + 8, Math.min(b.x1 - 8, this.x + (v.x / v.dist) * dist));
    this.ty = Math.max(b.y0 + 8, Math.min(b.y1 - 8, this.y + (v.y / v.dist) * dist));
    this.faceX(v.x);
    this.setState('hopWarn');
  }
  _hop(dt) {
    const d = this.def;
    if (this.state === 'hopWarn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.hopWarn) {
        this.setState('hop');
        this.game.audio.play('hop', 0.5);
      }
      return true;
    }
    if (this.state === 'hop') {
      const k = Math.min(1, this.stateTime / d.hopTime);
      this.x = this.fx + (this.tx - this.fx) * k;
      this.y = this.fy + (this.ty - this.fy) * k;
      this.h = 4 * 22 * k * (1 - k);
      this.anim.play('walk');
      if (k >= 1) {
        this.h = 0;
        this.collide();
        this.game.effects.landDust(this.x, this.y, 5);
        this.onLand();
        this.setState('rest');
        this.restFor = fxRng.float(...d.restTime);
      }
      return true;
    }
    return false;
  }
  onLand() {}
  move(dt) {
    if (this.state === 'hop') return;
    super.move(dt);
  }
  drawOverlay(o, time) {
    if (this.state === 'hopWarn') o.ring(this.tx, this.ty, this.def.radius + 4, TELE.danger, telegraphAlpha(this.stateTime / this.def.hopWarn, time) * 0.8);
  }
}

// =============================================================================================
// THE CELLS
// =============================================================================================

/** Kennel Hound (easy): trots after you, crouches (a red line), then lunges in a short dash. */
export class KennelHound extends Enemy {
  constructor(game, type = 'hound') {
    super(game, type, type, { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('trot');
    this.restFor = fxRng.float(...this.def.restTime);
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'trot') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      if (this.canAct && this.stateTime >= this.restFor && v.dist < 170) {
        this.setState('warn');
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
        this.game.audio.play('ghoulGroan', 0.3);
      }
    } else if (this.state === 'warn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.dashWarn) this.setState('dash');
    } else {
      this.vx = this.dx * d.dashSpeed;
      this.vy = this.dy * d.dashSpeed;
      this.faceX(this.dx);
      this.anim.play('attack');
      if (this.stateTime >= d.dashTime) {
        this.setState('trot');
        this.restFor = fxRng.float(...d.restTime);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'warn') line(o, this, this.dx, this.dy, this.def.dashSpeed * this.def.dashTime, this.stateTime / this.def.dashWarn, time);
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 8, 10, 70, 60);
    this.game.enemies.decal(this.room, 'blood', this.x, this.y - 2);
  }
}

/** Torturer (medium): aims his hook (a tracking line that locks), throws it; caught, you're dragged in. */
export class Torturer extends Enemy {
  constructor(game) {
    super(game, 'torturer', 'torturer', { anchorY: 2, shadow: 2, blood: 'blood' });
  }
  onSpawn() {
    this.setState('walk');
    this.cool = fxRng.float(...this.def.cooldown);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && v.dist < d.hookRange && this.canSeePlayer()) {
        this.setState('aim');
        this.game.audio.play('chainRattle', 0.6);
      }
    } else if (this.state === 'aim') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime < d.aimTime - 0.25) {
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
        this.faceX(v.x);
      }
      if (this.stateTime >= d.aimTime) {
        this.setState('throw');
        this.hx = this.x;
        this.hy = this.y;
        this.hookOut = 0;
        this.caught = false;
        this.game.audio.play('swing');
      }
    } else if (this.state === 'throw') {
      this.anim.play('attack');
      this.stop();
      this.hookOut += d.hookSpeed * dt;
      this.hx = this.x + this.dx * this.hookOut;
      this.hy = this.y + this.dy * this.hookOut;
      const pl = this.game.player;
      if (!this.caught && Math.hypot(pl.x - this.hx, pl.y - this.hy) < PLAYER.radius + 6) {
        this.caught = pl.hurt(1, this.hx, this.hy, d.name);
        pullPlayer(this.game, this.x, this.y, d.pullStrength);
        this.game.audio.play('chainYank');
        this.setState('reel');
      } else if (this.hookOut > d.hookRange || !this.room.nav.isWalkable(this.hx, this.hy)) this.setState('reel');
    } else if (this.state === 'reel') {
      this.stop();
      this.hookOut = Math.max(0, this.hookOut - d.hookSpeed * 1.5 * dt);
      this.hx = this.x + this.dx * this.hookOut;
      this.hy = this.y + this.dy * this.hookOut;
      if (this.hookOut <= 0) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time, solid) {
    if (this.state === 'aim') line(o, this, this.dx, this.dy, this.def.hookRange, this.stateTime / this.def.aimTime, time);
    if ((this.state === 'throw' || this.state === 'reel') && !this.dying) {
      solid.line(this.x + this.facing * 8, this.y + 18, this.hx, this.hy + 10, CHAIN, 1, depthFor(Math.max(this.y, this.hy)) + 0.001, 2);
      o.dot(this.hx, this.hy + 10, 3, TELE.dangerHot, 1);
    }
  }
  onDeath() {
    this.game.audio.play('thud', 0.6);
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 12, 80, 80);
  }
}

/** Rat Nest (medium): never moves; it shakes (telegraph), then a rat crawls out. Burn it down. */
export class RatNest extends Enemy {
  constructor(game) {
    super(game, 'ratnest', 'ratnest', { anchorY: 2, shadow: 3, blood: 'goo' });
  }
  onSpawn() {
    this.setState('wait');
    this.grace = fxRng.float(0.5, 1.5);
  }
  think() {
    const d = this.def;
    this.stop();
    this.kbx = this.kby = 0;
    if (this.state === 'wait') {
      this.anim.play('idle');
      if (this.canAct && this.stateTime >= d.birthEvery - d.warnTime) {
        let rats = 0;
        this.game.enemies.forEachAlive(this.room, (e) => {
          if (e.type === 'rat') rats++;
        });
        if (rats < d.maxRats) {
          this.setState('warn');
          this.game.audio.play('ratSqueak', 0.7);
        } else this.setState('wait');
      }
    } else if (this.state === 'warn') {
      this.anim.play('windup');
      if (this.stateTime >= d.warnTime) {
        this.game.enemies.spawn('rat', this.room, this.x + fxRng.float(-10, 10), this.y - 8, { quiet: true });
        this.anim.play('attack');
        this.setState('wait');
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'warn') o.ring(this.x, this.y, 18, TELE.danger, telegraphAlpha(this.stateTime / this.def.warnTime, time) * 0.6);
  }
  onDeath() {
    this.game.audio.play('ratDie');
    this.game.effects.burst(this.game.effects.presets.straw, this.x, this.y, 8, 20, 90, 80);
  }
}

/** Mad Monk (medium): raises his lantern (a red cross shows the paths), then casts a cross of orbs. */
export class MadMonk extends Enemy {
  constructor(game) {
    super(game, 'monk', 'monk', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('move');
    this.cool = fxRng.float(...this.def.cooldown);
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'move') {
      keepRange(this, v, d.preferredRange, this.strafe);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        this.setState('cast');
        this.turn = fxRng.chance(0.5) ? 0 : Math.PI / 4; // a + or an x
        this.game.audio.play('cast', 0.6);
      }
    } else if (this.state === 'cast') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.castTime) {
        for (let a = 0; a < d.arms; a++) {
          const ang = this.turn + (a / d.arms) * Math.PI * 2;
          for (let k = 0; k < d.perArm; k++) this.game.enemies.shots.fireOrb(this.x, this.y, 16, Math.cos(ang), Math.sin(ang), d.orbSpeed * (1 - k * 0.18), 12, 1, d.name);
        }
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.4) {
        this.setState('move');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'cast') return;
    const t = this.stateTime / this.def.castTime;
    for (let a = 0; a < this.def.arms; a++) {
      const ang = this.turn + (a / this.def.arms) * Math.PI * 2;
      line(o, this, Math.cos(ang), Math.sin(ang), 90, t, time);
    }
  }
  onDeath() {
    this.game.audio.play('wail', 0.4);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 10, 10, 50, 50);
  }
}

/** Sewer Slime (easy): hops at you (a ring marks where it lands); kill it and it splits in two. */
export class SewerSlime extends Hopper {
  constructor(game, type = 'slime') {
    super(game, type, type, { anchorY: 2, shadow: type === 'slime' ? 2 : 0, blood: 'goo' });
  }
  think() {
    this.toPlayer(v);
    if (this._hop()) return;
    this.stop();
    this.anim.play('idle');
    if (this.canAct && this.stateTime >= this.restFor) this._startHop();
  }
  onDeath() {
    this.game.audio.play('splat', 0.6);
    this.game.effects.burst(this.game.effects.presets.goo, this.x, this.y, 6, 12, 70, 60);
    this.game.enemies.decal(this.room, 'goo', this.x, this.y - 2);
    for (let i = 0; i < this.def.splits; i++) this.game.enemies.spawn('slimelet', this.room, this.x + (i ? 8 : -8), this.y, { quiet: true });
  }
}
export class Slimelet extends SewerSlime {
  constructor(game) {
    super(game, 'slimelet');
  }
}

// =============================================================================================
// THE CATACOMBS
// =============================================================================================

/** Flying Skull (easy): bounces about the room on a diagonal, never stopping. */
export class FlyingSkull extends Enemy {
  constructor(game) {
    super(game, 'skull', 'skull', { anchorY: 0, shadow: 0, blood: 'iron' });
  }
  onSpawn() {
    this.h = 12;
    this.dx = fxRng.chance(0.5) ? 1 : -1;
    this.dy = fxRng.chance(0.5) ? 1 : -1;
  }
  collide() {
    const r = this.def.radius;
    const b = this.room.bounds;
    if (this.x < b.x0 + r || this.x > b.x1 - r) {
      this.dx = -this.dx;
      this.game.audio.play('clatter', 0.15);
    }
    if (this.y < b.y0 + r || this.y > b.y1 - r) this.dy = -this.dy;
    this.x = Math.max(b.x0 + r, Math.min(b.x1 - r, this.x));
    this.y = Math.max(b.y0 + r, Math.min(b.y1 - r, this.y));
  }
  think() {
    this.vx = this.dx * this.speed * 0.71;
    this.vy = this.dy * this.speed * 0.71;
    this.faceX(this.dx);
    this.h = 12 + Math.sin(this.time * 6) * 2;
    this.anim.play('walk');
  }
  onDeath() {
    this.game.audio.play('clatter', 0.6);
    this.game.effects.burst(this.game.effects.presets.bone, this.x, this.y, 12, 8, 80, 80);
  }
}

/** Banshee (hard): a long rising wail (a ring swells around her), then a ring of orbs with ONE gap. */
export class Banshee extends Enemy {
  constructor(game) {
    super(game, 'banshee', 'banshee', { anchorY: 2, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('drift');
    this.cool = fxRng.float(...this.def.cooldown);
    this.h = 6;
  }
  collide() {
    const b = this.room.bounds;
    this.x = Math.max(b.x0, Math.min(b.x1, this.x));
    this.y = Math.max(b.y0, Math.min(b.y1, this.y));
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    this.faceX(v.x);
    if (this.state === 'drift') {
      keepRange(this, v, [90, 150], 1);
      this.anim.play('idle');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        this.setState('wail');
        this.gapAt = Math.atan2(v.y, v.x) + fxRng.float(-1.2, 1.2); // the gap is somewhere near you - find it
        this.game.audio.play('wail', 1);
      }
    } else if (this.state === 'wail') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.wailTime) {
        const step = (Math.PI * 2) / d.ringCount;
        for (let i = 0; i < d.ringCount; i++) {
          const a = this.gapAt + (i + 0.5) * step;
          if (i >= d.ringCount - d.gap) continue; // leave the gap
          this.game.enemies.shots.fireOrb(this.x, this.y, 14, Math.cos(a), Math.sin(a), d.ringSpeed, 4, 1, d.name, { life: 5 });
        }
        this.setState('after');
        this.anim.play('attack');
      }
    } else if (this.stateTime >= 0.6) {
      this.setState('drift');
      this.cool = fxRng.float(...d.cooldown);
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'wail') return;
    const t = this.stateTime / this.def.wailTime;
    o.ring(this.x, this.y, 10 + t * 30, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time));
    // a pale wedge shows where the gap will be
    const g = this.gapAt + (Math.PI * 2 * (this.def.ringCount - this.def.gap / 2)) / this.def.ringCount;
    o.line(this.x, this.y, this.x + Math.cos(g) * 50, this.y + Math.sin(g) * 50, AURA, 0.5 * t, 3, 2);
  }
  onDeath() {
    this.game.audio.play('wail', 0.8);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 14, 16, 40, 40);
  }
}

/** Necromancer (hard): raises skeletons from the floor (bone spikes mark where), or casts homing shadows. */
export class Necromancer extends Enemy {
  constructor(game) {
    super(game, 'necromancer', 'necromancer', { anchorY: 2, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('move');
    this.cool = fxRng.float(...this.def.cooldown) * 0.6;
    this.raising = [];
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'move') {
      keepRange(this, v, d.preferredRange, 1);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        let raised = 0;
        this.game.enemies.forEachAlive(this.room, (e) => {
          if (e.type === 'skeleton') raised++;
        });
        this.setState(raised < d.maxRaised ? 'raise' : 'curse');
        this.game.audio.play('cast', 0.7);
        if (this.state === 'raise') {
          // the graves open around Wren
          this.raising.length = 0;
          for (let i = 0; i < d.raiseCount; i++) {
            const a = fxRng.float(0, Math.PI * 2);
            const b = this.room.bounds;
            const x = Math.max(b.x0 + 16, Math.min(b.x1 - 16, this.game.player.x + Math.cos(a) * 60));
            const y = Math.max(b.y0 + 16, Math.min(b.y1 - 16, this.game.player.y + Math.sin(a) * 45));
            this.raising.push({ x, y });
            this.game.enemies.hazards.erupt(x, y, d.raiseTime, 12, { visual: 1, source: d.name });
          }
        }
      }
    } else if (this.state === 'raise') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.raiseTime) {
        for (const r of this.raising) this.game.enemies.spawn('skeleton', this.room, r.x, r.y, { quiet: true });
        this.setState('after');
      }
    } else if (this.state === 'curse') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= 0.6) {
        for (let i = -1; i <= 1; i++) {
          const a = Math.atan2(v.y, v.x) + i * 0.5;
          this.game.enemies.shots.fireOrb(this.x, this.y, 18, Math.cos(a), Math.sin(a), d.boltSpeed, 10, 1, d.name, { homing: 1.3, life: 4 });
        }
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.5) {
        this.setState('move');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'curse') o.ring(this.x, this.y, 14, TELE.danger, telegraphAlpha(this.stateTime / 0.6, time) * 0.7);
  }
  onDeath() {
    this.game.audio.play('wail', 0.6);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 12, 18, 50, 50);
    // his servants crumble with him
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e.type === 'skeleton') {
        e.hp = 0;
        e.die();
      }
    });
  }
}

/** Mummy (medium): shambles; flings a strip of grave-linen along a red line that drags you in. Angrier when hurt. */
export class Mummy extends Enemy {
  constructor(game) {
    super(game, 'mummy', 'mummy', { anchorY: 2, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('walk');
    this.cool = fxRng.float(...this.def.cooldown);
    this.enraged = false;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (!this.enraged && this.hp < this.maxHp * d.enrageAt) {
      this.enraged = true;
      this.speed *= d.enrageSpeed;
      this.game.audio.play('ghoulGroan', 0.8);
    }
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && v.dist < d.lashRange && this.canSeePlayer()) {
        this.setState('warn');
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
      }
    } else if (this.state === 'warn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.lashWarn) {
        this.setState('lash');
        this.game.audio.play('swing');
        const pl = this.game.player;
        if (segDist(pl.x, pl.y, this.x, this.y, this.x + this.dx * d.lashRange, this.y + this.dy * d.lashRange) < PLAYER.radius + 5) {
          if (pl.hurt(1, this.x, this.y, d.name)) pullPlayer(this.game, this.x, this.y, d.pull);
        }
      }
    } else {
      this.stop();
      this.anim.play('attack');
      if (this.stateTime >= d.lashTime + 0.3) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown) / (this.enraged ? 1.5 : 1);
      }
    }
  }
  sync() {
    super.sync();
    if (this.enraged && !this.dying) this.sprite.material.color.setRGB(1.3, 0.85, 0.75);
  }
  drawOverlay(o, time, solid) {
    const d = this.def;
    if (this.state === 'warn') line(o, this, this.dx, this.dy, d.lashRange, this.stateTime / d.lashWarn, time);
    if (this.state === 'lash' && this.stateTime < d.lashTime + 0.1 && !this.dying) {
      solid.line(this.x, this.y + 14, this.x + this.dx * d.lashRange, this.y + this.dy * d.lashRange + 10, LINEN, 1, depthFor(this.y) + 0.001, 0);
    }
  }
  onDeath() {
    this.game.audio.play('ghoulGroan', 0.5);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 12, 14, 60, 60);
  }
}

/** Crypt Bat (easy, comes in flocks): flutters in loops, hangs for a beat (a line), then swoops. */
export class CryptBat extends Enemy {
  constructor(game) {
    super(game, 'bat', 'bat', { anchorY: 0, shadow: 0, blood: 'blood' });
  }
  onSpawn() {
    this.setState('flutter');
    this.h = 14;
    this.phase = fxRng.float(0, 6);
    this.flutterFor = fxRng.float(1.4, 2.6);
  }
  collide() {
    const b = this.room.bounds;
    this.x = Math.max(b.x0, Math.min(b.x1, this.x));
    this.y = Math.max(b.y0, Math.min(b.y1, this.y));
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'flutter') {
      const a = this.time * 2.4 + this.phase;
      const tx = this.game.player.x + Math.cos(a) * 60;
      const ty = this.game.player.y + Math.sin(a * 1.3) * 45;
      this.walkTo(tx, ty, this.speed);
      this.faceX(this.vx);
      this.anim.play('walk');
      if (this.canAct && this.stateTime >= this.flutterFor) {
        this.setState('warn');
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
        this.game.audio.play('ratSqueak', 0.4);
      }
    } else if (this.state === 'warn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.swoopWarn) this.setState('swoop');
    } else {
      this.vx = this.dx * d.swoopSpeed;
      this.vy = this.dy * d.swoopSpeed;
      this.anim.play('attack');
      if (this.stateTime >= d.swoopTime) {
        this.setState('flutter');
        this.flutterFor = fxRng.float(1.4, 2.6);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'warn') line(o, this, this.dx, this.dy, this.def.swoopSpeed * this.def.swoopTime, this.stateTime / this.def.swoopWarn, time);
  }
  get corpseTime() {
    return 0.3;
  }
}

// =============================================================================================
// THE HOLLOW
// =============================================================================================

/** Puffcap (easy): hides as an ordinary mushroom; come close and it pops up, swells (a ring), and puffs spores. */
export class Puffcap extends Enemy {
  constructor(game) {
    super(game, 'puffcap', 'puffcap', { anchorY: 2, shadow: 1, blood: 'goo' });
  }
  onSpawn() {
    this.setState('hidden');
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'hidden') {
      this.stop();
      this.kbx = this.kby = 0;
      this.anim.play('hidden');
      if (this.canAct && v.dist < d.wakeRange) {
        this.setState('warn');
        this.game.audio.play('pop', 0.6);
      }
    } else if (this.state === 'warn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.warnTime) {
        const off = fxRng.float(0, 1);
        for (let i = 0; i < d.spores; i++) {
          const a = off + (i / d.spores) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 10, Math.cos(a), Math.sin(a), d.sporeSpeed, 6, 1, d.name, { life: 2.5 });
        }
        this.game.audio.play('spit', 0.8);
        this.setState('waddle');
        this.cool = fxRng.float(...d.cooldown);
      }
    } else {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.cool <= 0) this.setState(v.dist < d.wakeRange ? 'warn' : 'hidden');
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'warn') o.ring(this.x, this.y, 16 + (this.stateTime / this.def.warnTime) * 8, TELE.danger, telegraphAlpha(this.stateTime / this.def.warnTime, time));
  }
  onDeath() {
    this.game.enemies.hazards.spawn(this.room, this.x, this.y, 18, 1.5, 0, 'poison', true);
    this.game.audio.play('splat', 0.4);
  }
}

/** Bog Toad (easy): hops about; close enough, it opens wide (a red line) and its tongue lashes out. */
export class BogToad extends Hopper {
  constructor(game) {
    super(game, 'toad', 'toad', { anchorY: 2, shadow: 1, blood: 'goo' });
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this._hop()) return;
    if (this.state === 'tongueWarn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.tongueWarn) {
        this.setState('tongue');
        this.game.audio.play('spit', 0.6);
        const pl = this.game.player;
        if (segDist(pl.x, pl.y, this.x, this.y, this.x + this.dx * d.tongueRange, this.y + this.dy * d.tongueRange) < PLAYER.radius + 4) pl.hurt(1, this.x, this.y, d.name);
      }
      return;
    }
    if (this.state === 'tongue') {
      this.anim.play('attack');
      if (this.stateTime >= 0.3) {
        this.setState('rest');
        this.restFor = fxRng.float(...d.restTime);
      }
      return;
    }
    this.stop();
    this.anim.play('idle');
    if (this.canAct && this.stateTime >= this.restFor) {
      if (v.dist < d.tongueRange + 10) {
        this.setState('tongueWarn');
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
        this.faceX(v.x);
      } else this._startHop();
    }
  }
  drawOverlay(o, time, solid) {
    super.drawOverlay(o, time);
    const d = this.def;
    if (this.state === 'tongueWarn') line(o, this, this.dx, this.dy, d.tongueRange, this.stateTime / d.tongueWarn, time);
    if (this.state === 'tongue' && this.stateTime < 0.2 && !this.dying) solid.line(this.x, this.y + 10, this.x + this.dx * d.tongueRange, this.y + this.dy * d.tongueRange + 8, TONGUE, 1, depthFor(this.y) + 0.001, 0);
  }
  onDeath() {
    this.game.audio.play('splat', 0.5);
    this.game.effects.burst(this.game.effects.presets.goo, this.x, this.y, 6, 10, 70, 60);
  }
}

/** Elder Treant (hard): raises its arms and stomps - rings of roots burst out; up close, a sweeping swipe. */
export class ElderTreant extends Enemy {
  constructor(game) {
    super(game, 'treant', 'treant', { anchorY: 2, shadow: 3, blood: 'iron' });
  }
  onSpawn() {
    this.setState('walk');
    this.cool = fxRng.float(...this.def.cooldown);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        if (v.dist < d.swipeRange + 10) {
          this.setState('swipeWarn');
          this.angle = Math.atan2(v.y, v.x);
        } else {
          this.setState('stomp');
          this.game.audio.play('roar', 0.3);
          // rings of roots, the outer one a moment later
          d.ringRadius.forEach((r, k) => {
            const n = Math.round((Math.PI * 2 * r) / 26);
            const off = fxRng.float(0, 1);
            for (let i = 0; i < n; i++) {
              const a = off + (i / n) * Math.PI * 2;
              this.game.enemies.hazards.erupt(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r * 0.8, d.stompWarn + k * 0.35, 11, { visual: 0, source: d.name });
            }
          });
        }
      }
    } else if (this.state === 'stomp') {
      this.stop();
      this.anim.play(this.stateTime < d.stompWarn ? 'windup' : 'attack');
      if (this.stateTime >= d.stompWarn && !this.stomped) {
        this.stomped = true;
        this.game.audio.play('thud', 1);
        this.game.feel.shake(0.4);
      }
      if (this.stateTime >= d.stompWarn + 0.8) {
        this.stomped = false;
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    } else if (this.state === 'swipeWarn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.swipeWarn) {
        this.setState('swipe');
        this.game.audio.play('swing', 1);
        this.toPlayer(v);
        let diff = Math.atan2(v.y, v.x) - this.angle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (v.dist < d.swipeRange + 8 && Math.abs(diff) < 1.3) this.game.player.hurt(1, this.x, this.y, d.name);
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.6) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'swipeWarn') {
      const t = this.stateTime / this.def.swipeWarn;
      o.arc(this.x, this.y, this.def.swipeRange, this.angle - 1.3, this.angle + 1.3, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), depthFor(this.y) + 0.001, 0.8);
    }
  }
  onDeath() {
    this.game.audio.play('woodBreak', 1);
    this.game.feel.shake(0.4);
    this.game.effects.burst(this.game.effects.presets.splinter, this.x, this.y, 16, 26, 110, 110);
  }
}

/** Hollow Sprite (medium): darts about, aims (a short line) and flings a needle, then blinks elsewhere. */
export class HollowSprite extends Enemy {
  constructor(game) {
    super(game, 'pixie', 'pixie', { anchorY: 0, shadow: 0, blood: 'ash' });
  }
  onSpawn() {
    this.setState('flit');
    this.h = 14;
    this.cool = fxRng.float(...this.def.cooldown);
  }
  get hittable() {
    return this.state !== 'gone';
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    this.faceX(v.x);
    if (this.state === 'flit') {
      const a = this.time * 3;
      this.walkTo(this.x + Math.cos(a) * 30, this.y + Math.sin(a * 1.7) * 30, this.speed);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) this.setState('aim');
    } else if (this.state === 'aim') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime < d.aimTime - 0.12) {
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
      }
      if (this.stateTime >= d.aimTime) {
        this.game.enemies.shots.fireOrb(this.x, this.y, this.h, this.dx, this.dy, d.dartSpeed, 1, 1, d.name);
        this.game.audio.play('blink', 0.4);
        this.setState('vanish');
      }
    } else if (this.state === 'vanish') {
      this.anim.play('attack');
      if (this.stateTime >= d.blinkTime) {
        this.setState('gone');
        // reappear somewhere around Wren
        const a = fxRng.float(0, Math.PI * 2);
        const b = this.room.bounds;
        this.x = Math.max(b.x0 + 10, Math.min(b.x1 - 10, this.game.player.x + Math.cos(a) * 110));
        this.y = Math.max(b.y0 + 10, Math.min(b.y1 - 10, this.game.player.y + Math.sin(a) * 80));
      }
    } else if (this.stateTime >= 0.3) {
      this.setState('flit');
      this.cool = fxRng.float(...d.cooldown);
      this.game.effects.sparkle(this.x, this.y);
    }
  }
  sync() {
    super.sync();
    if (this.state === 'gone' && !this.dying) this.sprite.visible = false;
  }
  drawOverlay(o, time) {
    if (this.state === 'aim') line(o, this, this.dx, this.dy, 60, this.stateTime / this.def.aimTime, time);
  }
  get corpseTime() {
    return 0.3;
  }
  onDeath() {
    this.game.effects.sparkle(this.x, this.y);
  }
}

/** Tusked Boar (medium): paws the ground (a red path), charges - and again, and again. Dazed by walls. */
export class TuskedBoar extends Enemy {
  constructor(game) {
    super(game, 'boar', 'boar', { anchorY: 2, shadow: 2, blood: 'blood' });
  }
  onSpawn() {
    this.setState('walk');
    this.cool = fxRng.float(...this.def.cooldown);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && this.canSeePlayer()) {
        this.left = d.charges;
        this._aim();
      }
    } else if (this.state === 'warn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.chargeWarn) {
        this.setState('charge');
        this.lastX = this.x;
        this.lastY = this.y;
        this.game.audio.play('hop', 0.8);
      }
    } else if (this.state === 'charge') {
      this.vx = this.dx * d.chargeSpeed;
      this.vy = this.dy * d.chargeSpeed;
      this.faceX(this.dx);
      this.anim.play('attack');
      const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
      this.lastX = this.x;
      this.lastY = this.y;
      if (this.stateTime > 0.1 && moved < 1) {
        this.stop();
        this.setState('stunned');
        this.game.audio.play('thud');
        this.game.feel.shake(0.2);
      } else if (this.stateTime >= d.chargeTime) {
        if (--this.left > 0) this._aim(0.25);
        else {
          this.setState('walk');
          this.cool = fxRng.float(...d.cooldown);
        }
      }
    } else {
      this.stop();
      this.anim.play('stunned');
      if (this.stateTime >= d.stunTime) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  _aim(shorter = 0) {
    this.toPlayer(v);
    this.dx = v.x / v.dist;
    this.dy = v.y / v.dist;
    this.faceX(v.x);
    this.setState('warn');
    this.stateTime = shorter; // follow-up charges come quicker
  }
  drawOverlay(o, time) {
    if (this.state === 'warn') line(o, this, this.dx, this.dy, 500, this.stateTime / this.def.chargeWarn, time, 6);
  }
  onDeath() {
    this.game.audio.play('ghoulGroan', 0.5);
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 12, 80, 80);
    this.game.enemies.decal(this.room, 'blood', this.x, this.y - 2);
  }
}

// =============================================================================================
// THE BURNING HALLS
// =============================================================================================

/** Hellhound (hard): crouches (a red line), then dashes - leaving a trail of fire behind it. */
export class Hellhound extends KennelHound {
  constructor(game) {
    super(game, 'hellhound'); // the Kennel Hound's brain, its own body and numbers
  }
  think(dt) {
    super.think(dt);
    if (this.state === 'dash') {
      this.fireAcc = (this.fireAcc || 0) + dt;
      if (this.fireAcc >= this.def.fireEvery) {
        this.fireAcc = 0;
        this.game.enemies.hazards.spawn(this.room, this.x, this.y, 9, this.def.fireTime, 1, 'fire');
      }
    }
  }
  onDeath() {
    this.game.effects.fireBurst(this.x, this.y);
    this.game.audio.play('sizzle');
  }
}

/** Ballista (medium): never moves; aims a long red line at you, locks it (the line flashes), and looses a huge bolt. */
export class Ballista extends Enemy {
  constructor(game) {
    super(game, 'ballista', 'ballista', { anchorY: 2, shadow: 3, blood: 'iron' });
  }
  onSpawn() {
    this.setState('reload');
    this.grace = fxRng.float(0.5, 1.2);
  }
  think() {
    const d = this.def;
    this.stop();
    this.kbx = this.kby = 0;
    this.toPlayer(v);
    if (this.state === 'reload') {
      this.anim.play('idle');
      if (this.canAct && this.stateTime >= d.reloadTime) {
        this.setState('aim');
        this.game.audio.play('crank');
      }
    } else if (this.state === 'aim') {
      this.anim.play('windup');
      if (this.stateTime < d.aimTime) {
        this.dx = v.x / v.dist;
        this.dy = v.y / v.dist;
        this.faceX(v.x);
      }
      if (this.stateTime >= d.aimTime + d.lockTime) {
        this.game.enemies.shots.fireBolt(this.x + this.facing * 14, this.y, 12, this.dx, this.dy, d.boltSpeed, 2);
        this.game.audio.play('crossbowFire', 1);
        this.game.feel.shake(0.15);
        this.setState('reload');
        this.anim.play('attack');
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'aim') return;
    const d = this.def;
    const locked = this.stateTime >= d.aimTime;
    this.room.nav.raycast(this.x, this.y, this.dx, this.dy, 700, end);
    o.line(this.x, this.y + 10, end.x, end.y + 6, locked ? TELE.dangerHot : TELE.danger, locked ? (Math.floor(time * 20) % 2 ? 1 : 0.4) : 0.5, 3, locked ? 0 : 3);
  }
  onDeath() {
    this.game.audio.play('woodBreak', 1);
    this.game.effects.burst(this.game.effects.presets.splinter, this.x, this.y, 10, 24, 110, 100);
  }
}

/** Mad Jester (medium): capers about, raises a knife (a ring), throws a spiral of knives, then cartwheels away. */
export class MadJester extends Enemy {
  constructor(game) {
    super(game, 'jester', 'jester', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('caper');
    this.cool = fxRng.float(...this.def.cooldown);
    this.strafe = 1;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'caper') {
      keepRange(this, v, [70, 140], this.strafe);
      this.faceX(v.x);
      this.anim.play('walk');
      if (fxRng.chance(0.01)) this.strafe = -this.strafe;
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        this.setState('throw');
        this.spin = fxRng.float(0, 1);
        this.volleys = 0;
      }
    } else if (this.state === 'throw') {
      this.stop();
      this.anim.play(this.stateTime < d.throwTime ? 'windup' : 'attack');
      if (this.stateTime >= d.throwTime + this.volleys * 0.2 && this.volleys < 2) {
        for (let i = 0; i < d.knives; i++) {
          const a = this.spin + (i / d.knives) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 16, Math.cos(a), Math.sin(a), d.knifeSpeed, 1, 1, d.name);
        }
        this.spin += d.spin;
        this.volleys++;
        this.game.audio.play('swing', 0.5);
      }
      if (this.volleys >= 2 && this.stateTime >= d.throwTime + 0.4) {
        this.setState('cartwheel');
        this.game.audio.play('hop', 0.5);
        const a = Math.atan2(v.y, v.x) + (fxRng.chance(0.5) ? 1.6 : -1.6);
        this.cx = Math.cos(a);
        this.cy = Math.sin(a);
      }
    } else {
      this.vx = this.cx * this.speed * 2.2;
      this.vy = this.cy * this.speed * 2.2;
      this.anim.play('cartwheel');
      if (this.stateTime >= d.cartwheelTime) {
        this.setState('caper');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'throw' && this.stateTime < this.def.throwTime) o.ring(this.x, this.y, 18, TELE.danger, telegraphAlpha(this.stateTime / this.def.throwTime, time));
  }
  onDeath() {
    this.game.audio.play('coins', 0.6); // its bells scatter
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 10, 80, 70);
  }
}

/** Molten Golem (hard): slow, leaving burning footprints; heaves its fists up (a ring) and smashes. Breaks into embers. */
export class MoltenGolem extends Enemy {
  constructor(game) {
    super(game, 'moltengolem', 'moltengolem', { anchorY: 2, shadow: 3, blood: 'ash' });
  }
  onSpawn() {
    this.setState('walk');
    this.cool = fxRng.float(...this.def.cooldown);
    this.stepAcc = 0;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.stepAcc += dt;
      if (this.stepAcc >= d.footprintEvery) {
        this.stepAcc = 0;
        this.game.enemies.hazards.spawn(this.room, this.x, this.y - 2, 8, 2.5, 1, 'fire');
      }
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && v.dist < d.smashRange + 40) {
        this.setState('smashWarn');
        this.game.audio.play('roar', 0.3);
      }
    } else if (this.state === 'smashWarn') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.smashWarn) {
        this.setState('smash');
        this.toPlayer(v);
        if (v.dist < d.smashRange) this.game.player.hurt(1, this.x, this.y, d.name);
        for (let i = 0; i < d.shards; i++) {
          const a = (i / d.shards) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 8, Math.cos(a), Math.sin(a), 120, 8, 1, d.name);
        }
        this.game.enemies.shockwave(this.x, this.y, d.smashRange);
        this.game.audio.play('fireLand', 1);
        this.game.feel.shake(0.45);
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.8) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'smashWarn') o.ring(this.x, this.y, this.def.smashRange, TELE.danger, telegraphAlpha(this.stateTime / this.def.smashWarn, time));
  }
  onDeath() {
    this.game.effects.fireBurst(this.x, this.y);
    this.game.audio.play('fireLand');
    for (let i = 0; i < this.def.embers; i++) this.game.enemies.spawn('ember', this.room, this.x + fxRng.float(-14, 14), this.y + fxRng.float(-10, 10), { quiet: true, noGrace: true });
  }
}

/** Ember: a spark of a broken golem, skittering at you until it burns out. */
export class Ember extends Enemy {
  constructor(game) {
    super(game, 'ember', 'ember', { anchorY: 0, shadow: 0, blood: 'ash' });
  }
  onSpawn() {
    this.heading = fxRng.float(0, 6);
  }
  think() {
    this.toPlayer(v);
    this.heading += (Math.atan2(v.y, v.x) - this.heading) * 0.05 + fxRng.float(-0.3, 0.3);
    this.vx = Math.cos(this.heading) * this.speed;
    this.vy = Math.sin(this.heading) * this.speed;
    this.anim.play('walk');
    if (this.stateTime > this.def.lifeTime) {
      this.hp = 0;
      this.die();
    }
  }
  get corpseTime() {
    return 0.2;
  }
  onDeath() {
    this.game.effects.fireBurst(this.x, this.y);
  }
}

/** Banner Bearer (medium): hangs back, holding the king's banner high. Every ally near it is faster and tougher (a gold ring). */
export class BannerBearer extends Enemy {
  constructor(game) {
    super(game, 'bannerman', 'bannerman', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('move');
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    keepRange(this, v, d.preferredRange, 1);
    this.faceX(v.x);
    this.anim.play(Math.hypot(this.vx, this.vy) > 4 ? 'walk' : 'windup');
    // rally the troops
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e !== this && Math.hypot(e.x - this.x, e.y - this.y) < d.auraRadius) e.buffT = 0.15;
    });
  }
  drawOverlay(o, time) {
    if (this.dying) return;
    o.ring(this.x, this.y, this.def.auraRadius, AURA, 0.18 + 0.08 * Math.sin(time * 4), 3);
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e.buffT > 0 && e !== this) o.ring(e.x, e.y, e.def.radius + 5, AURA, 0.7, 3);
    });
  }
  onDeath() {
    this.game.audio.play('clatter', 0.7);
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 12, 80, 80);
  }
}
