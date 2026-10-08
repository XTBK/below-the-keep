import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { Sprite, depthFor } from '../render/Sprite.js';
import { fxRng } from '../core/Rng.js';
import { PLAYER } from '../data/config.js';

// Chapter 4: THE BURNING HALLS. Every attack has a telegraph; see GAME_DESIGN.md section 7.

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };
const CHAIN = new THREE.Color('#5d606c');

// 24. Black Knight - raises his lance (a red path appears), then charges across the room.
export class BlackKnight extends Enemy {
  constructor(game) {
    super(game, 'blackknight', 'blackknight', { anchorY: 2, shadow: 2, blood: 'iron' });
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
        this.setState('windup');
        this.cx = v.x / v.dist;
        this.cy = v.y / v.dist;
        this.faceX(v.x);
        this.game.audio.play('swing', 0.6);
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windupTime) {
        this.setState('charge');
        this.lastX = this.x;
        this.lastY = this.y;
      }
    } else if (this.state === 'charge') {
      this.vx = this.cx * d.chargeSpeed;
      this.vy = this.cy * d.chargeSpeed;
      this.anim.play('attack');
      const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
      this.lastX = this.x;
      this.lastY = this.y;
      if ((this.stateTime > 0.12 && moved < 1) || this.stateTime > 2.5) {
        this.setState('stunned');
        this.stop();
        this.game.audio.play('clang');
        this.game.feel.shake(0.25);
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
  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const t = this.stateTime / this.def.windupTime;
    this.room.nav.raycast(this.x, this.y, this.cx, this.cy, 600, end);
    o.line(this.x, this.y, end.x, end.y, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), 3, 3);
  }
  onDeath() {
    this.game.audio.play('clatter');
    this.game.effects.clatter(this.x, this.y);
  }
}

// 25. Flail Brute - winds up (a red ring shows the reach), then whirls his ball and chain around him.
export class FlailBrute extends Enemy {
  constructor(game) {
    super(game, 'flailbrute', 'flailbrute', { anchorY: 2, shadow: 3, blood: 'blood' });
    this.ball = new Sprite(game.renderer.scene, 'orbs', { anchorY: 6 });
    this.ball.setFrame(11, 0);
    this.ball.visible = false;
  }
  onSpawn() {
    this.setState('walk');
  }
  _ballPos() {
    return { x: this.x + Math.cos(this.spin) * this.def.spinRadius, y: this.y + Math.sin(this.spin) * this.def.spinRadius * 0.8 };
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      if (this.canAct && v.dist < d.spinRange) {
        this.setState('windup');
        this.game.audio.play('chainRattle');
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windupTime) {
        this.setState('spin');
        this.spin = 0;
      }
    } else if (this.state === 'spin') {
      this.chase(this.speed * 0.4);
      this.anim.play('attack');
      this.spin += d.spinSpeed / 60;
      const b = this._ballPos();
      if (Math.hypot(this.game.player.x - b.x, this.game.player.y - b.y) < 9 + PLAYER.radius) this.game.player.hurt(1, b.x, b.y, d.name);
      if (Math.floor(this.stateTime * 3) !== Math.floor((this.stateTime - 1 / 60) * 3)) this.game.audio.play('swing', 0.4);
      if (this.stateTime >= d.spinTime) this.setState('dizzy');
    } else {
      this.stop();
      this.anim.play('idle');
      if (this.stateTime >= d.dizzyTime) this.setState('walk');
    }
  }
  sync() {
    super.sync();
    const spinning = this.state === 'spin' && !this.dying;
    this.ball.visible = spinning;
    if (spinning) {
      const b = this._ballPos();
      this.ball.place(b.x, b.y, 12, depthFor(b.y));
    }
  }
  drawOverlay(o, time, solid) {
    if (this.state === 'windup') o.ring(this.x, this.y, this.def.spinRadius, TELE.danger, telegraphAlpha(this.stateTime / this.def.windupTime, time), 3, 0.8);
    if (this.state === 'spin' && !this.dying) {
      const b = this._ballPos();
      solid.line(this.x, this.y + 18, b.x, b.y + 12, CHAIN, 1, depthFor(Math.max(this.y, b.y)), 2);
    }
  }
  onRelease() {
    this.ball.visible = false;
  }
  onDeath() {
    this.game.audio.play('thud');
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 14, 90, 90);
  }
}

// 26. Gargoyle - stone (and invulnerable) while dormant. Its eyes kindle (telegraph), it wakes,
// swoops at you, then settles and turns back to stone.
export class Gargoyle extends Enemy {
  constructor(game) {
    super(game, 'gargoyle', 'gargoyle', { anchorY: 2, shadow: 2, blood: 'iron' });
  }
  onSpawn() {
    this.setState('stone');
    this.wait = fxRng.float(...this.def.stoneTime);
  }
  get touchDamage() {
    return this.state === 'swoop' ? this.def.contactDamage : 0;
  }
  hit(damage, dx, dy, quiet) {
    if (this.state === 'stone') {
      this.game.effects.enemyHit(this.x, this.y, 10, dx, dy, 'iron');
      this.game.audio.play('clang', 0.6);
      return true;
    }
    return super.hit(damage, dx, dy, quiet);
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'stone') {
      this.stop();
      this.kbx = this.kby = 0;
      this.h = 0;
      this.anim.play('stone');
      if (this.canAct && (this.stateTime >= this.wait || v.dist < d.wakeRange * 0.5)) {
        this.setState('wake');
        this.game.audio.play('roar', 0.4);
      }
    } else if (this.state === 'wake') {
      this.stop();
      this.anim.play('idle');
      this.h = (this.stateTime / d.wakeTime) * 14;
      if (this.stateTime >= d.wakeTime) {
        this.setState('swoop');
        this.sx = v.x / v.dist;
        this.sy = v.y / v.dist;
      }
    } else if (this.state === 'swoop') {
      const k = this.stateTime / d.swoopTime;
      this.vx = this.sx * d.swoopSpeed;
      this.vy = this.sy * d.swoopSpeed;
      this.h = 14 - Math.sin(k * Math.PI) * 10;
      this.faceX(this.vx);
      this.anim.play('attack');
      if (k >= 1) this.setState('settle');
    } else {
      this.stop();
      this.anim.play('walk');
      this.h = Math.max(0, 14 - this.stateTime * 30);
      if (this.h <= 0) {
        this.setState('stone');
        this.wait = fxRng.float(...d.stoneTime);
        this.game.audio.play('thud', 0.4);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'wake') {
      this.toPlayer(v);
      o.line(this.x, this.y, this.x + (v.x / v.dist) * 120, this.y + (v.y / v.dist) * 120, TELE.danger, telegraphAlpha(this.stateTime / this.def.wakeTime, time), 3, 3);
    }
  }
  onDeath() {
    this.game.audio.play('clatter');
    this.game.effects.burst(this.game.effects.presets.stoneChip, this.x, this.y, 10, 18, 120, 120);
  }
}

// 27. Court Magus - a ring of light gathers around him (telegraph), he fires rings of orbs, then
// blinks to somewhere else in the room.
export class CourtMagus extends Enemy {
  constructor(game) {
    super(game, 'magus', 'magus', { anchorY: 2, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('rest');
    this.restFor = fxRng.float(...this.def.restTime);
  }
  get hittable() {
    return this.state !== 'gone';
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    this.faceX(v.x);
    if (this.state === 'rest') {
      this.walkTo(this.x + Math.cos(this.time) * 20, this.y + Math.sin(this.time) * 20, this.speed);
      this.anim.play('idle');
      if (this.canAct && this.stateTime >= this.restFor) {
        this.setState('cast');
        this.game.audio.play('cast');
        this.ringsLeft = d.rings;
        this.spin = fxRng.float(0, 1);
      }
    } else if (this.state === 'cast') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.castTime) {
        this.setState('fire');
        this.next = 0;
      }
    } else if (this.state === 'fire') {
      this.anim.play('attack');
      if (this.stateTime >= this.next && this.ringsLeft > 0) {
        for (let i = 0; i < d.ringCount; i++) {
          const a = this.spin + (i / d.ringCount) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 18, Math.cos(a), Math.sin(a), d.ringSpeed, 6, 1, d.name);
        }
        this.spin += Math.PI / d.ringCount;
        this.ringsLeft--;
        this.next += d.ringGap;
      }
      if (this.ringsLeft <= 0 && this.stateTime > this.next) {
        this.setState('blink');
        this.game.audio.play('blink');
      }
    } else if (this.state === 'blink') {
      this.anim.play('blink');
      if (this.stateTime >= d.blinkTime) {
        this.setState('gone');
        // reappear somewhere far from Wren
        const b = this.room.bounds;
        let best = null;
        for (let i = 0; i < 8; i++) {
          const x = fxRng.float(b.x0 + 20, b.x1 - 20);
          const y = fxRng.float(b.y0 + 20, b.y1 - 20);
          const dd = Math.hypot(x - this.game.player.x, y - this.game.player.y);
          if (this.room.nav.isWalkable(x, y) && (!best || dd > best.d)) best = { x, y, d: dd };
        }
        if (best) {
          this.x = best.x;
          this.y = best.y;
        }
      }
    } else {
      if (this.stateTime >= 0.3) {
        this.setState('rest');
        this.restFor = fxRng.float(...d.restTime);
        this.game.effects.sparkle(this.x, this.y);
      }
    }
  }
  sync() {
    super.sync();
    if (this.state === 'gone' && !this.dying) this.sprite.visible = false;
  }
  drawOverlay(o, time) {
    if (this.state === 'cast') o.ring(this.x, this.y, 18 + (this.stateTime / this.def.castTime) * 10, TELE.danger, telegraphAlpha(this.stateTime / this.def.castTime, time));
  }
  onDeath() {
    this.game.audio.play('blink', 1);
    this.game.effects.sparkle(this.x, this.y);
  }
}

// 28. Living Armour - when "killed" it collapses into a heap of armour. Hit the heap a couple of
// times to finish it; otherwise it twitches (telegraph) and reassembles once at half health.
export class LivingArmour extends Enemy {
  constructor(game) {
    super(game, 'livingarmour', 'livingarmour', { anchorY: 2, shadow: 1, blood: 'iron' });
  }
  onSpawn() {
    this.setState('walk');
    this.reassembled = false;
  }
  die() {
    if (!this.reassembled && this.state !== 'pile') {
      // collapse instead of dying (stays "alive", so the room stays locked)
      this.setState('pile');
      this.pileHits = 0;
      this.stop();
      this.game.audio.play('clatter');
      this.game.effects.clatter(this.x, this.y);
      this.hp = 1;
      return;
    }
    super.die();
  }
  hit(damage, dx, dy, quiet) {
    if (this.state === 'pile' && this.alive) {
      this.pileHits++;
      this.sprite.flash(0.07);
      this.game.audio.play('clang', 0.6);
      if (this.pileHits >= this.def.pileHits) {
        this.reassembled = true;
        super.die();
      }
      return true;
    }
    return super.hit(damage, dx, dy, quiet);
  }
  get touchDamage() {
    return this.state === 'pile' ? 0 : this.def.contactDamage;
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'pile') {
      this.stop();
      this.anim.play(this.stateTime > d.pileTime - 0.6 ? 'reassemble' : 'pile');
      if (this.stateTime >= d.pileTime) {
        this.reassembled = true;
        this.hp = this.maxHp * 0.5;
        this.setState('walk');
        this.game.audio.play('clatter', 0.6);
      }
    } else if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      if (this.canAct && v.dist < d.slashRange) {
        this.setState('windup');
        this.angle = Math.atan2(v.y, v.x);
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windupTime) {
        this.setState('attack');
        this.game.audio.play('swing');
        this.toPlayer(v);
        let diff = Math.atan2(v.y, v.x) - this.angle;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (v.dist < d.slashRange + 6 && Math.abs(diff) < 1.1) this.game.player.hurt(1, this.x, this.y, d.name);
      }
    } else if (this.state === 'attack') {
      this.anim.play('attack');
      if (this.stateTime >= d.slashTime) this.setState('recover');
    } else {
      this.stop();
      this.anim.play('idle');
      if (this.stateTime >= d.recoverTime) this.setState('walk');
    }
  }
  sync() {
    super.sync();
    if (this.state === 'pile' && !this.dying && this.stateTime > this.def.pileTime - 0.6) this.sprite.mesh.position.x += Math.round(Math.sin(this.time * 50));
  }
  drawOverlay(o, time) {
    if (this.state === 'windup') {
      const z = depthFor(this.y) + 0.001;
      o.arc(this.x, this.y, this.def.slashRange, this.angle - 1.1, this.angle + 1.1, TELE.danger, telegraphAlpha(this.stateTime / this.def.windupTime, time), z, 1);
    }
  }
}

// 29. Drake Whelp - takes a deep breath (its chest glows; a red cone shows where the fire will go),
// then breathes a cone of flame.
export class DrakeWhelp extends Enemy {
  constructor(game) {
    super(game, 'drake', 'drake', { anchorY: 2, shadow: 2, blood: 'ash' });
  }
  onSpawn() {
    this.setState('move');
    this.cool = fxRng.float(...this.def.cooldown);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'move') {
      const [near, far] = d.preferredRange;
      if (v.dist < near) {
        this.vx = (-v.x / v.dist) * this.speed;
        this.vy = (-v.y / v.dist) * this.speed;
      } else if (v.dist > far) this.chase(this.speed);
      else this.stop();
      this.faceX(v.x);
      this.anim.play(Math.hypot(this.vx, this.vy) > 2 ? 'walk' : 'idle');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && v.dist < d.coneLength + 20) {
        this.setState('inhale');
        this.angle = Math.atan2(v.y, v.x);
        this.faceX(v.x);
        this.game.audio.play('inhale');
      }
    } else if (this.state === 'inhale') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.inhaleTime) {
        this.setState('breathe');
        this.game.audio.play('breath');
      }
    } else if (this.state === 'breathe') {
      this.stop();
      this.anim.play('attack');
      const fx = this.game.effects;
      for (let k = 0; k < 3; k++) {
        const a = this.angle + fxRng.float(-d.coneAngle, d.coneAngle);
        const sp = fxRng.float(140, 220);
        fx.glow.emit(fx.presets.ember, this.x + Math.cos(this.angle) * 14, this.y + Math.sin(this.angle) * 10, 14, Math.cos(a) * sp, Math.sin(a) * sp, fxRng.float(-10, 20));
      }
      // is Wren inside the cone?
      this.toPlayer(v);
      let diff = Math.atan2(v.y, v.x) - this.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (v.dist < d.coneLength && Math.abs(diff) < d.coneAngle) this.game.player.hurt(1, this.x, this.y, 'Dragonfire');
      if (this.stateTime >= d.breathTime) {
        this.setState('move');
        this.cool = fxRng.float(...d.cooldown);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'inhale') return;
    const d = this.def;
    const t = this.stateTime / d.inhaleTime;
    const c = t > 0.75 ? TELE.dangerHot : TELE.danger;
    const a = telegraphAlpha(t, time);
    const z = depthFor(this.y) + 0.001;
    o.line(this.x, this.y, this.x + Math.cos(this.angle - d.coneAngle) * d.coneLength, this.y + Math.sin(this.angle - d.coneAngle) * d.coneLength, c, a, z, 2);
    o.line(this.x, this.y, this.x + Math.cos(this.angle + d.coneAngle) * d.coneLength, this.y + Math.sin(this.angle + d.coneAngle) * d.coneLength, c, a, z, 2);
    o.arc(this.x, this.y, d.coneLength, this.angle - d.coneAngle, this.angle + d.coneAngle, c, a, z, 1);
  }
  onDeath() {
    this.game.effects.fireBurst(this.x, this.y);
    this.game.audio.play('sizzle');
  }
}

// 30. Executioner - heaves his axe overhead (red lines run out along the floor), then slams it down
// and shockwaves rip along those lines.
export class Executioner extends Enemy {
  constructor(game) {
    super(game, 'executioner', 'executioner', { anchorY: 2, shadow: 3, blood: 'blood' });
  }
  onSpawn() {
    this.setState('walk');
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      if (this.canAct && v.dist < d.slamRange) {
        this.setState('windup');
        this.angle = Math.atan2(v.y, v.x);
        this.game.audio.play('swing', 0.5);
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windupTime) {
        for (let w = 0; w < d.waves; w++) {
          const a = this.angle + (w - (d.waves - 1) / 2) * d.waveSpread;
          for (let i = 1; i <= d.waveSteps; i++) {
            this.game.enemies.hazards.erupt(this.x + Math.cos(a) * i * d.waveSpacing, this.y + Math.sin(a) * i * d.waveSpacing, i * d.waveDelay, 10, { visual: 4, source: d.name });
          }
        }
        this.setState('attack');
        this.game.audio.play('thud');
        this.game.feel.shake(0.4);
      }
    } else if (this.state === 'attack') {
      this.anim.play('attack');
      if (this.stateTime >= d.recoverTime) this.setState('walk');
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const d = this.def;
    const t = this.stateTime / d.windupTime;
    for (let w = 0; w < d.waves; w++) {
      const a = this.angle + (w - (d.waves - 1) / 2) * d.waveSpread;
      o.line(this.x, this.y, this.x + Math.cos(a) * d.waveSteps * d.waveSpacing, this.y + Math.sin(a) * d.waveSteps * d.waveSpacing, TELE.danger, telegraphAlpha(t, time), 3, 3);
    }
  }
  onDeath() {
    this.game.audio.play('thud');
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 16, 90, 90);
  }
}
