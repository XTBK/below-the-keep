import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { fxRng } from '../core/Rng.js';

// The secret bestiary: creatures found only in the three secret realms (data/enemies.js has their
// numbers). Every attack is telegraphed, like everything else below the Keep.
//   the Drowned Cistern      Drowned Pilgrim, Cistern Eel
//   the Starless Chapel      Hollow Nun, Censer Acolyte
//   the First King's Forge   Bellows Imp, Anvil Knight

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };

function line(o, e, dx, dy, len, t, time) {
  e.room.nav.raycast(e.x, e.y, dx, dy, len, end);
  o.line(e.x, e.y, end.x, end.y, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), 3, 3);
}
function ring(o, x, y, r, t, time) {
  o.ring(x, y, r, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time));
}
function keepRange(e, [near, far], strafe = 1) {
  if (v.dist < near) {
    e.vx = (-v.x / v.dist) * e.speed;
    e.vy = (-v.y / v.dist) * e.speed;
  } else if (v.dist > far) e.chase(e.speed);
  else {
    e.vx = (-v.y / v.dist) * strafe * e.speed * 0.6;
    e.vy = (v.x / v.dist) * strafe * e.speed * 0.6;
  }
}

// ============================================================================ THE DROWNED CISTERN

/** Drowned Pilgrim: shambles close and spits a fan of foul water that leaves slowing puddles. */
export class DrownedPilgrim extends Enemy {
  constructor(game) {
    super(game, 'drowned', 'drowned', { anchorY: 2, shadow: 1, blood: 'goo' });
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
      if (this.canAct && this.cool <= 0 && v.dist < d.spitRange && this.canSeePlayer()) {
        this.setState('windup');
        this.aim = Math.atan2(v.y, v.x);
        this.game.audio.play('ghoulGroan', 0.4);
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windup) {
        for (let i = 0; i < d.count; i++) {
          const a = this.aim + (i / (d.count - 1) - 0.5) * d.spread;
          this.game.enemies.shots.fireOrb(this.x, this.y, 14, Math.cos(a), Math.sin(a), d.speed, 0, 1, d.name, { land: 'web', life: d.life });
        }
        this.game.audio.play('splat', 0.7);
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.5) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const d = this.def;
    const t = this.stateTime / d.windup;
    for (const k of [-0.5, 0, 0.5]) line(o, this, Math.cos(this.aim + k * d.spread), Math.sin(this.aim + k * d.spread), 70, t, time);
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.goo || this.game.effects.presets.blood, this.x, this.y, 8, 12, 60, 50);
  }
}

/** Cistern Eel: swims unseen under the floor, bursts up beside Wren with a ring of teeth, then sinks. */
export class CisternEel extends Enemy {
  constructor(game) {
    super(game, 'eel', 'eel', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('under');
    this.sprite.visible = false;
  }
  get hittable() {
    return this.state === 'up' || this.state === 'bite';
  }
  get touchDamage() {
    return this.hittable ? this.def.contactDamage : 0;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'under') {
      this.chase(this.speed);
      if (this.canAct && this.stateTime > d.underTime && v.dist < 70) {
        this.setState('rising');
        this.game.audio.play('hop', 0.5);
      }
    } else if (this.state === 'rising') {
      this.stop();
      if (this.stateTime >= d.riseTime) {
        this.setState('bite');
        this.sprite.visible = true;
        this.game.audio.play('splat', 0.8);
        for (let i = 0; i < d.teeth; i++) {
          const a = (i / d.teeth) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 10, Math.cos(a), Math.sin(a), d.toothSpeed, 1, 1, d.name);
        }
        this.lunge = { x: v.x / v.dist, y: v.y / v.dist };
      }
    } else if (this.state === 'bite') {
      this.vx = this.lunge.x * d.lungeSpeed;
      this.vy = this.lunge.y * d.lungeSpeed;
      this.faceX(this.lunge.x);
      this.anim.play('attack');
      if (this.stateTime >= 0.2) this.setState('up');
    } else if (this.state === 'up') {
      this.stop();
      this.anim.play('idle');
      if (this.stateTime >= d.upTime) {
        this.setState('under');
        this.sprite.visible = false;
        this.game.audio.play('splat', 0.4);
      }
    }
  }
  sync() {
    super.sync();
    if (this.state === 'under' || this.state === 'rising') this.sprite.visible = false;
    this.shadow.visible = !this.sprite.visible ? false : this.shadow.visible;
  }
  drawOverlay(o, time) {
    // ripples where it swims; a closing ring where it will rise
    if (this.state === 'under') o.ring(this.x, this.y + 2, 6 + ((time * 14) % 8), TELE.danger, 0.25);
    if (this.state === 'rising') ring(o, this.x, this.y + 2, 18 * (1 - this.stateTime / this.def.riseTime) + 6, this.stateTime / this.def.riseTime, time);
  }
}

// ============================================================================ THE STARLESS CHAPEL

/** Hollow Nun: blinks close in a puff of violet, then casts a cross of curses that start to seek. */
export class HollowNun extends Enemy {
  constructor(game) {
    super(game, 'nun', 'nun', { anchorY: 4, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('drift');
    this.cool = fxRng.float(...this.def.cooldown);
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'drift') {
      keepRange(this, d.preferredRange, this.strafe);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        this.setState('fade');
        this.game.audio.play('blink', 0.6);
      }
    } else if (this.state === 'fade') {
      this.stop();
      if (this.stateTime >= 0.3) {
        // reappear somewhere around Wren, not on top of her
        const p = this.game.player;
        const a = fxRng.float(0, Math.PI * 2);
        const b = this.room.bounds;
        this.x = Math.max(b.x0 + 16, Math.min(b.x1 - 16, p.x + Math.cos(a) * d.blinkDist));
        this.y = Math.max(b.y0 + 16, Math.min(b.y1 - 16, p.y + Math.sin(a) * d.blinkDist));
        this.game.effects.spellImpact(this.x, this.y, 16);
        this.setState('cast');
        this.turn = fxRng.chance(0.5) ? 0 : Math.PI / 4;
      }
    } else if (this.state === 'cast') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.castTime) {
        for (let k = 0; k < 4; k++) {
          const a = this.turn + (k / 4) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 16, Math.cos(a), Math.sin(a), d.orbSpeed, 6, 1, d.name, { homing: d.homing });
        }
        this.game.audio.play('cast', 0.6);
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.5) {
        this.setState('drift');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  sync() {
    super.sync();
    if (this.state === 'fade') this.sprite.visible = Math.floor(this.stateTime * 30) % 2 === 0;
  }
  drawOverlay(o, time) {
    if (this.state !== 'cast') return;
    const t = this.stateTime / this.def.castTime;
    for (let k = 0; k < 4; k++) {
      const a = this.turn + (k / 4) * Math.PI * 2;
      line(o, this, Math.cos(a), Math.sin(a), 60, t, time);
    }
  }
  onDeath() {
    this.game.audio.play('wail', 0.5);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 12, 12, 50, 50);
  }
}

/** Censer Acolyte: trails clouds of poison smoke, and when close spins out a ring of shadow. */
export class CenserAcolyte extends Enemy {
  constructor(game) {
    super(game, 'acolyte', 'acolyte', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('walk');
    this.smoke = 0;
    this.cool = fxRng.float(...this.def.cooldown);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      this.smoke -= dt;
      if (this.smoke <= 0) {
        this.smoke = d.smokeEvery;
        this.game.enemies.hazards.spawn(this.room, this.x, this.y, d.smokeRadius, d.smokeTime, 1, 'poison', true);
      }
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && v.dist < d.spinRange) {
        this.setState('windup');
        this.game.audio.play('swing', 0.6);
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windup) {
        for (let i = 0; i < d.ring; i++) {
          const a = (i / d.ring) * Math.PI * 2 + this.stateTime;
          this.game.enemies.shots.fireOrb(this.x, this.y, 14, Math.cos(a), Math.sin(a), d.orbSpeed, 10, 1, d.name);
        }
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.5) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'windup') ring(o, this.x, this.y, 26, this.stateTime / this.def.windup, time);
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 10, 10, 50, 50);
  }
}

// ============================================================================ THE FIRST KING'S FORGE

/** Bellows Imp: hops about, then breathes a short cone of sparks and cinders. */
export class BellowsImp extends Enemy {
  constructor(game) {
    super(game, 'bellows', 'bellows', { anchorY: 2, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('hop');
    this.cool = fxRng.float(...this.def.cooldown);
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'hop') {
      keepRange(this, d.preferredRange, this.strafe);
      this.h = Math.abs(Math.sin(this.stateTime * 9)) * 5;
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && v.dist < d.coneRange + 20) {
        this.h = 0;
        this.setState('windup');
        this.aim = Math.atan2(v.y, v.x);
        this.game.audio.play('inhale', 0.5);
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windup) {
        for (let i = 0; i < d.count; i++) {
          const a = this.aim + (i / (d.count - 1) - 0.5) * d.spread + fxRng.float(-0.05, 0.05);
          this.game.enemies.shots.fireOrb(this.x, this.y, 12, Math.cos(a), Math.sin(a), d.speed * fxRng.float(0.85, 1.1), 8, 1, d.name, { life: d.coneRange / d.speed });
        }
        this.game.audio.play('castFire', 0.8);
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.5) {
        this.setState('hop');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const d = this.def;
    const t = this.stateTime / d.windup;
    o.arc(this.x, this.y, d.coneRange, this.aim - d.spread / 2, this.aim + d.spread / 2, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), 3, 0.8);
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.ember || this.game.effects.presets.ash, this.x, this.y, 8, 14, 70, 70);
  }
}

/** Anvil Knight: a slow wall of iron that charges, stops dead, and hammers the floor into a ring of iron. */
export class AnvilKnight extends Enemy {
  constructor(game) {
    super(game, 'anvilknight', 'anvilknight', { anchorY: 2, shadow: 2, blood: 'iron' });
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
      if (this.canAct && this.cool <= 0 && v.dist < d.chargeRange && this.canSeePlayer()) {
        this.setState('aim');
        this.dir = { x: v.x / v.dist, y: v.y / v.dist };
        this.game.audio.play('clang', 0.6);
      }
    } else if (this.state === 'aim') {
      this.stop();
      this.faceX(this.dir.x);
      this.anim.play('windup');
      if (this.stateTime >= d.aimTime) this.setState('charge');
    } else if (this.state === 'charge') {
      this.vx = this.dir.x * d.chargeSpeed;
      this.vy = this.dir.y * d.chargeSpeed;
      this.anim.play('attack');
      if (this.stateTime >= d.chargeTime) this.setState('slamWind');
    } else if (this.state === 'slamWind') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.slamWind) {
        // a ring of iron with two gaps to slip through
        const gap = fxRng.float(0, Math.PI * 2);
        for (let i = 0; i < d.ring; i++) {
          const a = (i / d.ring) * Math.PI * 2;
          let diff = Math.abs(Math.atan2(Math.sin(a - gap), Math.cos(a - gap)));
          diff = Math.min(diff, Math.abs(Math.PI - diff));
          if (diff < 0.35) continue;
          this.game.enemies.shots.fireOrb(this.x, this.y, 8, Math.cos(a), Math.sin(a), d.ringSpeed, 11, 1, d.name);
        }
        this.game.audio.play('hammer', 0.9);
        this.game.feel.shake(0.2);
        this.setState('after');
      }
    } else {
      this.anim.play('idle');
      if (this.stateTime >= 0.6) {
        this.setState('walk');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    const d = this.def;
    if (this.state === 'aim') line(o, this, this.dir.x, this.dir.y, d.chargeSpeed * d.chargeTime, this.stateTime / d.aimTime, time);
    if (this.state === 'slamWind') ring(o, this.x, this.y, 30, this.stateTime / d.slamWind, time);
  }
  onDeath() {
    this.game.audio.play('clang', 0.8);
    this.game.effects.burst(this.game.effects.presets.spark || this.game.effects.presets.ash, this.x, this.y, 12, 16, 80, 60);
  }
}
