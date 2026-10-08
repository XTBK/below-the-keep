import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { depthFor } from '../render/Sprite.js';
import { fxRng } from '../core/Rng.js';
import { PLAYER } from '../data/config.js';

// Chapter 2: THE CATACOMBS. Every attack has a telegraph; see GAME_DESIGN.md section 7.

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };

function arc(o, e, angle, reach, half, t, time) {
  const z = depthFor(e.y) + 0.001;
  o.arc(e.x, e.y, reach, angle - half, angle + half, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), z, 1);
}

// 8. Skeleton Footman - walks at you; his shield blocks stones from the front. Telegraph: raises
// his sword (red arc), then slashes. Death: falls apart into a pile of bones.
export class Skeleton extends Enemy {
  constructor(game) {
    super(game, 'skeleton', 'skeleton', { anchorY: 2, shadow: 1, blood: 'iron' });
  }
  onSpawn() {
    this.setState('walk');
  }
  hit(damage, dx, dy, quiet) {
    // stones flying INTO his shield (opposite to the way he faces) clang off harmlessly
    if (!quiet && this.alive && this.state !== 'attack' && dx * this.facing < -this.def.shieldArc) {
      this.game.effects.enemyHit(this.x + this.facing * 8, this.y, 12, dx, dy, 'iron');
      this.game.audio.play('clang', 0.7);
      this.kbx += dx * 30;
      return true;
    }
    return super.hit(damage, dx, dy, quiet);
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
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
  drawOverlay(o, time) {
    if (this.state === 'windup') arc(o, this, this.angle, this.def.slashRange, 1.1, this.stateTime / this.def.windupTime, time);
  }
  onDeath() {
    this.game.audio.play('clatter', 0.7);
    this.game.effects.burst(this.game.effects.presets.bone, this.x, this.y, 12, 12, 100, 110);
  }
}

// 9. Bone Archer - keeps its distance; three red lines show the spread before it looses three arrows.
export class BoneArcher extends Enemy {
  constructor(game) {
    super(game, 'archer', 'archer', { anchorY: 2, shadow: 1, blood: 'iron' });
  }
  onSpawn() {
    this.setState('move');
    this.cool = fxRng.float(0.5, 1.5);
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
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
      else {
        this.vx = (-v.y / v.dist) * this.strafe * this.speed * 0.6;
        this.vy = (v.x / v.dist) * this.strafe * this.speed * 0.6;
      }
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0 && this.canSeePlayer()) {
        this.setState('aim');
        this.game.audio.play('crank', 0.6);
      }
    } else if (this.state === 'aim') {
      this.stop();
      this.faceX(v.x);
      this.angle = Math.atan2(v.y, v.x);
      this.anim.play('windup');
      if (this.stateTime >= d.aimTime) {
        for (let i = 0; i < d.arrows; i++) {
          const a = this.angle + (i - (d.arrows - 1) / 2) * d.spread;
          this.game.enemies.shots.fireBolt(this.x + this.facing * 8, this.y, 14, Math.cos(a), Math.sin(a), d.arrowSpeed, 1);
        }
        this.game.audio.play('crossbowFire', 0.8);
        this.setState('loose');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.3) {
        this.setState('move');
        this.cool = d.reloadTime;
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'aim') return;
    const d = this.def;
    const t = this.stateTime / d.aimTime;
    for (let i = 0; i < d.arrows; i++) {
      const a = this.angle + (i - (d.arrows - 1) / 2) * d.spread;
      this.room.nav.raycast(this.x, this.y, Math.cos(a), Math.sin(a), 260, end);
      o.line(this.x, this.y + 12, end.x, end.y + 6, TELE.danger, telegraphAlpha(t * 0.8, time), 3, 3);
    }
  }
  onDeath() {
    this.game.audio.play('clatter', 0.6);
    this.game.effects.burst(this.game.effects.presets.bone, this.x, this.y, 12, 10, 90, 100);
  }
}

// 10. Candle Wraith - flickers between the room's lit candles and casts slow homing wisps.
// Snuff the candles (shoot them) and it has nowhere to go: it stays visible and takes double damage.
export class CandleWraith extends Enemy {
  constructor(game) {
    super(game, 'wraith', 'wraith', { anchorY: 2, shadow: 1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('appear');
    this.h = 6;
  }
  get weakened() {
    return this.room.litCandles === 0;
  }
  get hittable() {
    return this.state !== 'gone';
  }
  hit(damage, dx, dy, quiet) {
    return super.hit(this.weakened ? damage * this.def.weakenedDamage : damage, dx, dy, quiet);
  }
  _teleport() {
    const lit = this.room.candles.filter((c) => c.lit);
    if (lit.length) {
      const c = lit[Math.floor(fxRng.next() * lit.length)];
      this.x = c.x + fxRng.float(-14, 14);
      this.y = c.ground + fxRng.float(-6, 10);
    }
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    this.faceX(v.x);
    this.stop();
    if (this.state === 'appear') {
      this.anim.play('fade');
      if (this.stateTime >= d.appearTime) this.setState('linger');
    } else if (this.state === 'linger') {
      this.anim.play('idle');
      this.walkTo(this.game.player.x, this.game.player.y, this.speed * (this.weakened ? 0.5 : 1));
      if (this.canAct && this.stateTime >= 0.5) {
        this.setState('cast');
        this.game.audio.play('cast', 0.6);
      }
    } else if (this.state === 'cast') {
      this.anim.play('windup');
      if (this.stateTime >= d.castTime) {
        for (let i = 0; i < d.wisps; i++) {
          const a = Math.atan2(v.y, v.x) + (i - (d.wisps - 1) / 2) * 0.7;
          this.game.enemies.shots.fireOrb(this.x, this.y, 18, Math.cos(a), Math.sin(a), d.wispSpeed, 4, 1, d.name, { homing: d.wispTurn, life: 5 });
        }
        this.setState('after');
      }
    } else if (this.state === 'after') {
      this.anim.play('attack');
      if (this.stateTime >= d.lingerTime) {
        if (this.weakened) this.setState('linger'); // no candle left to flee to
        else {
          this.setState('vanish');
          this.game.audio.play('blink', 0.5);
        }
      }
    } else if (this.state === 'vanish') {
      this.anim.play('fade');
      if (this.stateTime >= d.vanishTime) {
        this.setState('gone');
        this._teleport();
      }
    } else if (this.state === 'gone') {
      if (this.stateTime >= 0.4) this.setState('appear');
    }
  }
  sync() {
    super.sync();
    if (this.state === 'gone' && !this.dying) this.sprite.visible = false;
  }
  drawOverlay(o, time) {
    if (this.state === 'cast') o.ring(this.x, this.y, 16, TELE.danger, telegraphAlpha(this.stateTime / this.def.castTime, time) * 0.6);
  }
  onDeath() {
    this.game.audio.play('wail', 0.6);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 12, 16, 50, 40);
  }
}

// 11. Ossuary Golem - a hulk of bones. Telegraph: paws the ground while a red line shows its path,
// then charges in a straight line until it slams into something - and is dazed.
export class OssuaryGolem extends Enemy {
  constructor(game) {
    super(game, 'golem', 'golem', { anchorY: 2, shadow: 3, blood: 'iron' });
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
      if (this.canAct && this.cool <= 0 && v.dist < d.sightRange && this.canSeePlayer()) {
        this.setState('windup');
        this.cx = v.x / v.dist;
        this.cy = v.y / v.dist;
        this.game.audio.play('roar', 0.4);
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
      this.faceX(this.cx);
      this.anim.play('attack');
      const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
      this.lastX = this.x;
      this.lastY = this.y;
      if ((this.stateTime > 0.12 && moved < 1) || this.stateTime > 2.5) {
        this.setState('stunned');
        this.stop();
        this.game.audio.play('thud');
        this.game.feel.shake(0.35);
        this.game.effects.burst(this.game.effects.presets.bone, this.x + this.cx * 14, this.y, 14, 10, 90, 90);
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
    this.room.nav.raycast(this.x, this.y, this.cx, this.cy, 500, end);
    for (const off of [-8, 8]) o.line(this.x - this.cy * off, this.y + this.cx * off, end.x - this.cy * off, end.y + this.cx * off, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), 3, 3);
  }
  onDeath() {
    this.game.audio.play('clatter');
    this.game.feel.shake(0.5);
    this.game.effects.burst(this.game.effects.presets.bone, this.x, this.y, 14, 30, 140, 140);
  }
}

// 12. Crypt Spider - waits unseen on the ceiling. Telegraph: its shadow (a ring) grows under you,
// then it drops. On the floor it rears up and spits webs that slow you, then climbs back up.
export class CryptSpider extends Enemy {
  constructor(game) {
    super(game, 'spider', 'spider', { anchorY: 2, shadow: 1, blood: 'goo' });
  }
  onSpawn() {
    this.setState('ceiling');
    this.wait = fxRng.float(...this.def.ceilingTime) * 0.5;
    this.h = 200;
  }
  get hittable() {
    return this.state !== 'ceiling' && this.state !== 'drop';
  }
  get touchDamage() {
    return this.h > 4 ? 0 : this.def.contactDamage;
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'ceiling') {
      this.stop();
      this.h = 200;
      if (this.canAct && this.stateTime >= this.wait) {
        this.setState('drop');
        this.tx = this.game.player.x;
        this.ty = this.game.player.y;
      }
    } else if (this.state === 'drop') {
      this.x = this.tx;
      this.y = this.ty;
      const k = this.stateTime / d.dropWarn;
      this.h = k < 0.7 ? 200 : 200 * (1 - (k - 0.7) / 0.3);
      if (k >= 1) {
        this.h = 0;
        this.setState('scuttle');
        this.scuttleFor = fxRng.float(...d.scuttleTime);
        this.game.feel.shake(0.12);
        this.game.effects.landDust(this.x, this.y, 8);
        this.toPlayer(v);
        if (v.dist < d.dropRadius + PLAYER.radius) this.game.player.hurt(1, this.x, this.y, d.name);
      }
    } else if (this.state === 'scuttle') {
      // quick jittery skittering
      this.turnT = (this.turnT || 0) - 1 / 60;
      if (this.turnT <= 0) {
        this.turnT = fxRng.float(0.25, 0.5);
        this.heading = Math.atan2(v.y, v.x) + fxRng.float(-1.2, 1.2);
      }
      this.vx = Math.cos(this.heading || 0) * this.speed;
      this.vy = Math.sin(this.heading || 0) * this.speed;
      this.faceX(this.vx);
      this.anim.play('walk');
      if (this.stateTime >= 0.8 && v.dist < 160 && fxRng.chance(0.02)) this.setState('rear');
      if (this.stateTime >= this.scuttleFor) {
        this.setState('ceiling');
        this.wait = fxRng.float(...d.ceilingTime);
        this.game.effects.landDust(this.x, this.y, 4);
      }
    } else if (this.state === 'rear') {
      this.stop();
      this.faceX(v.x);
      this.anim.play('windup');
      if (this.stateTime >= d.spitTime) {
        this.game.enemies.shots.fireOrb(this.x + this.facing * 8, this.y, 8, v.x / v.dist, v.y / v.dist, d.webSpeed, 9, 0, d.name, { land: 'web', life: Math.min(1.4, v.dist / d.webSpeed) });
        this.game.audio.play('spit');
        this.setState('scuttle');
      }
    }
  }
  sync() {
    super.sync();
    const up = this.state === 'ceiling' || (this.state === 'drop' && this.h > 150);
    if (!this.dying) {
      this.sprite.visible = !up;
      this.shadow.visible = !up;
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'drop') {
      const k = this.stateTime / this.def.dropWarn;
      o.ring(this.tx, this.ty, this.def.dropRadius * (0.4 + 0.6 * k), k > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(k, time));
    }
    if (this.state === 'rear') o.ring(this.x, this.y, 10, TELE.danger, 0.5);
  }
  onDeath() {
    this.game.audio.play('splat', 0.5);
    this.game.effects.burst(this.game.effects.presets.goo, this.x, this.y, 6, 10, 70, 60);
    this.game.enemies.decal(this.room, 'goo', this.x, this.y - 2);
  }
}

// 13. Grave Worm - burrows unseen; telegraph: a dirt-mound ring forms under you, then it erupts in
// a ring of bone shards and stays up (vulnerable) for a moment before burrowing again.
export class GraveWorm extends Enemy {
  constructor(game) {
    super(game, 'worm', 'worm', { anchorY: 2, shadow: -1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('surface');
    this.grace = 0.8;
  }
  get hittable() {
    return this.state === 'surface';
  }
  get touchDamage() {
    return this.state === 'surface' ? this.def.contactDamage : 0;
  }
  think() {
    const d = this.def;
    this.stop();
    if (this.state === 'under') {
      if (this.stateTime >= this.wait) {
        this.setState('warn');
        this.x = this.game.player.x;
        this.y = this.game.player.y;
        this.game.audio.play('land', 0.5);
      }
    } else if (this.state === 'warn') {
      if (fxRng.chance(0.4)) this.game.effects.landDust(this.x, this.y, 1);
      if (this.stateTime >= d.warnTime) {
        this.setState('surface');
        this.game.audio.play('roar', 0.35);
        this.game.feel.shake(0.15);
        this.game.effects.landDust(this.x, this.y, 14);
        this.toPlayer(v);
        if (v.dist < d.eruptRadius + PLAYER.radius) this.game.player.hurt(1, this.x, this.y, d.name);
        for (let i = 0; i < d.shards; i++) {
          const a = (i / d.shards) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 8, Math.cos(a), Math.sin(a), d.shardSpeed, 3, 1, d.name);
        }
      }
    } else if (this.state === 'surface') {
      this.anim.play(this.stateTime < 0.3 ? 'attack' : 'idle');
      if (this.canAct && this.stateTime >= d.surfaceTime) {
        this.setState('under');
        this.wait = fxRng.float(...d.burrowTime);
        this.game.effects.landDust(this.x, this.y, 8);
      }
    }
  }
  sync() {
    super.sync();
    if (!this.dying) this.sprite.visible = this.state === 'surface';
  }
  drawOverlay(o, time) {
    if (this.state === 'warn') {
      const k = this.stateTime / this.def.warnTime;
      o.ring(this.x, this.y, this.def.eruptRadius, k > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(k, time));
      o.ring(this.x, this.y, this.def.eruptRadius * 0.5, TELE.danger, telegraphAlpha(k, time) * 0.5);
    }
  }
  onDeath() {
    this.game.audio.play('splat', 0.6);
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 10, 12, 80, 80);
  }
}

// 14. Plague Doctor - keeps his distance, throws a flask (green ring where it lands) that leaves a
// poison cloud, then backs away. Death: his mask falls; a burst of green smoke.
export class PlagueDoctor extends Enemy {
  constructor(game) {
    super(game, 'doctor', 'doctor', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('move');
    this.cool = fxRng.float(...this.def.attackInterval);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'move' || this.state === 'retreat') {
      const [near, far] = d.preferredRange;
      if (this.state === 'retreat' || v.dist < near) {
        this.vx = (-v.x / v.dist) * this.speed * 1.2;
        this.vy = (-v.y / v.dist) * this.speed * 1.2;
      } else if (v.dist > far) this.chase(this.speed);
      else this.stop();
      this.faceX(v.x);
      this.anim.play(Math.hypot(this.vx, this.vy) > 2 ? 'walk' : 'idle');
      if (this.state === 'retreat' && this.stateTime >= d.retreatTime) this.setState('move');
      this.cool -= dt;
      if (this.state === 'move' && this.canAct && this.cool <= 0) {
        this.setState('windup');
        this.tx = this.game.player.x;
        this.ty = this.game.player.y;
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windupTime) {
        this.game.enemies.shots.lobFireball(this.x + this.facing * 6, this.y, 18, this.tx, this.ty, d.lobTime, { patchRadius: d.cloudRadius, patchTime: d.cloudTime, patchDamage: d.cloudDamage, patchKind: 'poison' });
        this.game.audio.play('fireThrow', 0.6);
        this.setState('retreat');
        this.cool = fxRng.float(...d.attackInterval);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'windup') o.ring(this.tx, this.ty, this.def.cloudRadius, TELE.danger, telegraphAlpha(this.stateTime / this.def.windupTime, time));
  }
  onDeath() {
    this.game.enemies.hazards.spawn(this.room, this.x, this.y, 20, 1.5, 0, 'poison');
    this.game.audio.play('splat', 0.4);
  }
}

// 15. Mourning Spectre - drifts straight through rocks and walls and can only be seen (or hit)
// while she moves. Telegraph: a wail, and she flickers into view just before gliding at you.
export class MourningSpectre extends Enemy {
  constructor(game) {
    super(game, 'spectre', 'spectre', { anchorY: 2, shadow: -1, blood: 'ash' });
  }
  onSpawn() {
    this.setState('still');
    this.h = 8;
  }
  get hittable() {
    return this.state !== 'still';
  }
  get touchDamage() {
    return this.state === 'glide' ? this.def.contactDamage : 0;
  }
  collide() {
    // ghosts ignore everything but the room's outer walls
    const b = this.room.bounds;
    this.x = Math.max(b.x0, Math.min(b.x1, this.x));
    this.y = Math.max(b.y0, Math.min(b.y1, this.y));
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'still') {
      this.stop();
      if (this.canAct && this.stateTime >= d.stillTime) {
        this.setState('warn');
        this.game.audio.play('wail', 0.5);
      }
    } else if (this.state === 'warn') {
      this.stop();
      this.faceX(v.x);
      this.anim.play('windup');
      if (this.stateTime >= d.warnTime) {
        this.setState('glide');
        this.gx = v.x / v.dist;
        this.gy = v.y / v.dist;
      }
    } else {
      this.vx = this.gx * this.speed;
      this.vy = this.gy * this.speed;
      this.faceX(this.vx);
      this.anim.play('walk');
      if (this.stateTime >= d.glideTime) this.setState('still');
    }
  }
  sync() {
    super.sync();
    if (!this.dying) this.sprite.visible = this.state !== 'still' || Math.floor(this.time * 20) % 9 === 0; // the faintest flicker
  }
  onDeath() {
    this.game.audio.play('wail', 0.8);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 12, 16, 40, 40);
  }
}
