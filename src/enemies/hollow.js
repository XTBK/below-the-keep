import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { fxRng } from '../core/Rng.js';
import { PLAYER } from '../data/config.js';

// Chapter 3: THE HOLLOW. Every attack has a telegraph; see GAME_DESIGN.md section 7.

const v = { x: 0, y: 0, dist: 0 };

function keepRange(e, v, near, far, strafe) {
  if (v.dist < near) {
    e.vx = (-v.x / v.dist) * e.speed;
    e.vy = (-v.y / v.dist) * e.speed;
  } else if (v.dist > far) e.chase(e.speed);
  else {
    e.vx = (-v.y / v.dist) * strafe * e.speed * 0.6;
    e.vy = (v.x / v.dist) * strafe * e.speed * 0.6;
  }
}

// 16. Hedge Witch - hangs back and fires curse bolts that weave in a wave. Telegraph: her staff
// flares purple. Sometimes she calls rats from a glowing circle instead.
export class HedgeWitch extends Enemy {
  constructor(game) {
    super(game, 'witch', 'witch', { anchorY: 2, shadow: 1, blood: 'blood' });
  }
  onSpawn() {
    this.setState('move');
    this.cool = fxRng.float(...this.def.attackInterval);
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'move') {
      keepRange(this, v, d.preferredRange[0], d.preferredRange[1], this.strafe);
      this.faceX(v.x);
      this.anim.play('walk');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        let rats = 0;
        this.game.enemies.forEachAlive(this.room, (e) => {
          if (e.type === 'rat') rats++;
        });
        this.setState(fxRng.chance(d.summonChance) && rats < 4 ? 'summon' : 'cast');
        this.game.audio.play('cast', 0.6);
      }
    } else if (this.state === 'cast') {
      this.stop();
      this.faceX(v.x);
      this.anim.play('windup');
      if (this.stateTime >= d.castTime) {
        const a = Math.atan2(v.y, v.x);
        for (let i = 0; i < d.bolts; i++) {
          // a stream of bolts, each weaving a little out of step with the last
          this.game.enemies.shots.fireOrb(this.x + this.facing * 8, this.y, 16, Math.cos(a), Math.sin(a), d.boltSpeed + i * 6, 6, 1, d.name, { wave: [d.waveAmp, d.waveFreq], life: 3.5 });
          this.game.enemies.shots.orbs.active[this.game.enemies.shots.orbs.count - 1].t = i * 0.25;
        }
        this.setState('after');
      }
    } else if (this.state === 'summon') {
      this.stop();
      this.anim.play('summon');
      if (this.stateTime >= d.summonTime) {
        for (let i = 0; i < d.summonCount; i++) this.game.enemies.spawn('rat', this.room, this.x + fxRng.float(-20, 20), this.y + fxRng.float(-14, 14));
        this.setState('after');
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.4) {
        this.setState('move');
        this.cool = fxRng.float(...d.attackInterval);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'cast') o.ring(this.x + this.facing * 8, this.y + 26, 6, TELE.danger, telegraphAlpha(this.stateTime / this.def.castTime, time));
    if (this.state === 'summon') o.ring(this.x, this.y, 18, TELE.danger, telegraphAlpha(this.stateTime / this.def.summonTime, time) * 0.6);
  }
  onDeath() {
    this.game.audio.play('wail', 0.5);
    this.game.effects.burst(this.game.effects.presets.ash, this.x, this.y, 10, 14, 50, 50);
  }
}

// 17. Thornling - a bush that never moves. On a steady rhythm it swells and bristles (red lines
// show all eight directions), then shoots thorns all around - each volley turned a little.
export class Thornling extends Enemy {
  constructor(game) {
    super(game, 'thornling', 'thornling', { anchorY: 2, shadow: 2, blood: 'goo' });
  }
  onSpawn() {
    this.setState('wait');
    this.turn = 0;
    this.grace = fxRng.float(0.4, 1.4);
  }
  think() {
    const d = this.def;
    this.stop();
    this.kbx = this.kby = 0; // rooted in place
    if (this.state === 'wait') {
      this.anim.play('idle');
      if (this.canAct && this.stateTime >= d.rhythm - d.warnTime) this.setState('warn');
    } else if (this.state === 'warn') {
      this.anim.play('windup');
      if (this.stateTime >= d.warnTime) {
        for (let i = 0; i < d.thorns; i++) {
          const a = this.turn + (i / d.thorns) * Math.PI * 2;
          this.game.enemies.shots.fireOrb(this.x, this.y, 10, Math.cos(a), Math.sin(a), d.thornSpeed, 5, 1, d.name);
        }
        this.turn += Math.PI / d.thorns;
        this.game.audio.play('spit', 0.6);
        this.setState('wait');
        this.anim.play('attack');
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'warn') return;
    const t = this.stateTime / this.def.warnTime;
    for (let i = 0; i < this.def.thorns; i++) {
      const a = this.turn + (i / this.def.thorns) * Math.PI * 2;
      o.line(this.x + Math.cos(a) * 12, this.y + 10 + Math.sin(a) * 10, this.x + Math.cos(a) * 30, this.y + 10 + Math.sin(a) * 24, TELE.danger, telegraphAlpha(t, time) * 0.7, 3, 2);
    }
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.splinter, this.x, this.y, 8, 14, 80, 80);
  }
}

// 18. Dire Wolf - circles you, then crouches (a red line marks where it'll land) and pounces.
export class DireWolf extends Enemy {
  constructor(game) {
    super(game, 'direwolf', 'direwolf', { anchorY: 2, shadow: 2, blood: 'blood' });
  }
  onSpawn() {
    this.setState('circle');
    this.circleFor = fxRng.float(...this.def.circleTime);
    this.dir = fxRng.chance(0.5) ? 1 : -1;
  }
  get touchDamage() {
    return this.h > 6 ? 0 : this.def.contactDamage;
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'circle') {
      // orbit at a set distance, closing in or backing off as needed
      const radial = (v.dist - d.circleRadius) / d.circleRadius;
      const tx = (-v.y / v.dist) * this.dir + (v.x / v.dist) * radial;
      const ty = (v.x / v.dist) * this.dir + (v.y / v.dist) * radial;
      const l = Math.hypot(tx, ty) || 1;
      this.vx = (tx / l) * this.speed;
      this.vy = (ty / l) * this.speed;
      this.faceX(this.vx);
      this.anim.play('walk');
      if (this.canAct && this.stateTime >= this.circleFor) {
        this.setState('crouch');
        this.tx = this.game.player.x;
        this.ty = this.game.player.y;
        this.game.audio.play('ghoulGroan', 0.4);
      }
    } else if (this.state === 'crouch') {
      this.stop();
      this.faceX(this.tx - this.x);
      this.anim.play('windup');
      if (this.stateTime >= d.crouchTime) {
        this.setState('pounce');
        this.fx = this.x;
        this.fy = this.y;
      }
    } else if (this.state === 'pounce') {
      const k = Math.min(1, this.stateTime / d.pounceTime);
      this.x = this.fx + (this.tx - this.fx) * k;
      this.y = this.fy + (this.ty - this.fy) * k;
      this.h = 4 * d.pounceHeight * k * (1 - k);
      this.anim.play('attack');
      if (k >= 1) {
        this.h = 0;
        this.toPlayer(v);
        if (v.dist < 16) this.game.player.hurt(1, this.x, this.y, d.name);
        this.game.effects.landDust(this.x, this.y, 6);
        this.setState('recover');
      }
    } else {
      this.stop();
      this.anim.play('idle');
      if (this.stateTime >= d.recoverTime) {
        this.setState('circle');
        this.circleFor = fxRng.float(...d.circleTime);
        if (fxRng.chance(0.4)) this.dir = -this.dir;
      }
    }
  }
  move(dt) {
    if (this.state === 'pounce') this.collide();
    else super.move(dt);
  }
  drawOverlay(o, time) {
    if (this.state !== 'crouch') return;
    const t = this.stateTime / this.def.crouchTime;
    o.line(this.x, this.y, this.tx, this.ty, TELE.danger, telegraphAlpha(t, time), 3, 3);
    o.ring(this.tx, this.ty, 12, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time));
  }
  onDeath() {
    this.game.audio.play('ghoulGroan', 0.5);
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 8, 12, 80, 70);
    this.game.enemies.decal(this.room, 'blood', this.x, this.y - 2);
  }
}

// 19. Spore Bloater - waddles toward you; when it's close (or killed) it swells, its spots glowing,
// and pops into a cloud of spores. Get away from it!
export class SporeBloater extends Enemy {
  constructor(game) {
    super(game, 'bloater', 'bloater', { anchorY: 2, shadow: 2, blood: 'goo' });
  }
  onSpawn() {
    this.setState('walk');
  }
  _pop() {
    const d = this.def;
    this.game.enemies.hazards.spawn(this.room, this.x, this.y, d.cloudRadius, d.cloudTime, d.cloudDamage, 'poison', true);
    this.game.audio.play('splat');
    this.game.feel.shake(0.2);
    this.game.effects.burst(this.game.effects.presets.goo, this.x, this.y, 10, 14, 90, 80);
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    if (this.state === 'walk') {
      this.chase(this.speed);
      this.faceX(v.x);
      this.anim.play('walk');
      if (this.canAct && v.dist < d.popRange) this.setState('swell');
    } else if (this.state === 'swell') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.swellTime) {
        this.popped = true;
        this._pop();
        this.hp = 0;
        this.die();
      }
    }
  }
  sync() {
    super.sync();
    if (this.state === 'swell' && !this.dying) this.sprite.mesh.position.x += Math.round(Math.sin(this.time * 70));
  }
  drawOverlay(o, time) {
    if (this.state === 'swell') o.ring(this.x, this.y, this.def.cloudRadius, TELE.danger, telegraphAlpha(this.stateTime / this.def.swellTime, time));
  }
  onSpawnReset() {}
  onDeath() {
    if (!this.popped) this._pop();
    this.popped = false;
  }
}

// 20. Wisp - a floating light. Telegraph: it brightens, then spins out a spiral of orbs.
export class Wisp extends Enemy {
  constructor(game) {
    super(game, 'wisp', 'wisp', { anchorY: 0, shadow: 0, blood: 'ash' });
  }
  onSpawn() {
    this.setState('drift');
    this.cool = fxRng.float(...this.def.attackInterval);
    this.h = 14;
    this.phase = fxRng.float(0, 6);
  }
  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    this.h = 14 + Math.sin(this.time * 3 + this.phase) * 3;
    if (this.state === 'drift') {
      this.vx = (-v.y / v.dist) * this.speed + (v.dist > 120 ? (v.x / v.dist) * this.speed : 0);
      this.vy = (v.x / v.dist) * this.speed + (v.dist > 120 ? (v.y / v.dist) * this.speed : 0);
      this.anim.play('idle');
      this.cool -= dt;
      if (this.canAct && this.cool <= 0) {
        this.setState('charge');
        this.game.audio.play('cast', 0.4);
      }
    } else if (this.state === 'charge') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.chargeTime) {
        this.setState('spiral');
        this.acc = 0;
        this.ang = fxRng.float(0, 6);
      }
    } else {
      this.stop();
      this.acc += dt * d.spiralRate;
      while (this.acc >= 1) {
        this.acc -= 1;
        this.ang += 0.55;
        for (const s of [0, Math.PI]) this.game.enemies.shots.fireOrb(this.x, this.y, this.h, Math.cos(this.ang + s), Math.sin(this.ang + s), d.orbSpeed, 4, 1, d.name);
      }
      if (this.stateTime >= d.spiralTime) {
        this.setState('drift');
        this.cool = fxRng.float(...d.attackInterval);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state === 'charge') o.ring(this.x, this.y, 10 + (this.stateTime / this.def.chargeTime) * 8, TELE.danger, telegraphAlpha(this.stateTime / this.def.chargeTime, time));
  }
  get corpseTime() {
    return 0.3;
  }
  onDeath() {
    this.game.effects.sparkle(this.x, this.y);
  }
}

// 21. Scarecrow - stands still. Shoot near it and its head jerks (telegraph): crows burst out at you.
export class Scarecrow extends Enemy {
  constructor(game) {
    super(game, 'scarecrow', 'scarecrow', { anchorY: 2, shadow: 2, blood: 'iron' });
  }
  onSpawn() {
    this.setState('stand');
    this.cool = 0;
  }
  think(dt) {
    const d = this.def;
    this.stop();
    this.kbx = this.kby = 0;
    this.cool -= dt;
    if (this.state === 'stand') {
      this.anim.play('idle');
      // a stone flying close sets it off
      if (this.canAct && this.cool <= 0) {
        const pool = this.game.projectiles.pool;
        for (let i = 0; i < pool.count; i++) {
          const p = pool.active[i];
          if ((p.x - this.x) ** 2 + (p.y - this.y) ** 2 < d.triggerRange * d.triggerRange) {
            this.setState('warn');
            this.game.audio.play('caw');
            break;
          }
        }
      }
    } else if (this.state === 'warn') {
      this.anim.play('windup');
      if (this.stateTime >= d.warnTime) {
        for (let i = 0; i < d.crows; i++) this.game.enemies.spawn('crow', this.room, this.x + fxRng.float(-10, 10), this.y + 24, { quiet: true, noGrace: true });
        this.game.audio.play('caw', 1);
        this.setState('stand');
        this.cool = d.cooldown;
      }
    }
  }
  hit(damage, dx, dy, quiet) {
    if (this.state === 'stand' && this.cool <= 0 && !quiet) {
      this.setState('warn');
      this.game.audio.play('caw');
    }
    return super.hit(damage, dx, dy, quiet);
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.splinter, this.x, this.y, 14, 18, 90, 90);
    for (let i = 0; i < 2; i++) this.game.enemies.spawn('crow', this.room, this.x, this.y + 20, { quiet: true, noGrace: true });
  }
}

// Crow - bursts out of a scarecrow, dives at you, then flaps off.
export class Crow extends Enemy {
  constructor(game) {
    super(game, 'crow', 'crow', { anchorY: 0, shadow: 0, blood: 'blood' });
  }
  onSpawn() {
    this.h = 16;
    this.toPlayer(v);
    const a = Math.atan2(v.y, v.x) + fxRng.float(-0.4, 0.4);
    this.dx = Math.cos(a);
    this.dy = Math.sin(a);
  }
  collide() {
    const b = this.room.bounds;
    if (this.x < b.x0 || this.x > b.x1) this.dx = -this.dx;
    if (this.y < b.y0 || this.y > b.y1) this.dy = -this.dy;
    this.x = Math.max(b.x0, Math.min(b.x1, this.x));
    this.y = Math.max(b.y0, Math.min(b.y1, this.y));
  }
  think() {
    this.vx = this.dx * this.speed;
    this.vy = this.dy * this.speed;
    this.faceX(this.vx);
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
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, this.h, 5, 50, 40);
  }
}

// 22. Root Sapling - shuffles slowly. Telegraph: it digs its roots in and a red dotted line runs
// toward you; then roots burst out of the ground along that line, one after another.
export class RootSapling extends Enemy {
  constructor(game) {
    super(game, 'sapling', 'sapling', { anchorY: 2, shadow: 2, blood: 'iron' });
  }
  onSpawn() {
    this.setState('walk');
    this.cool = fxRng.float(...this.def.attackInterval);
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
        this.setState('windup');
        this.ax = v.x / v.dist;
        this.ay = v.y / v.dist;
      }
    } else if (this.state === 'windup') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.windupTime) {
        for (let i = 1; i <= d.rootSteps; i++) {
          this.game.enemies.hazards.erupt(this.x + this.ax * i * d.rootSpacing, this.y + this.ay * i * d.rootSpacing, i * d.rootDelay, d.rootRadius, { visual: 0, source: d.name });
        }
        this.setState('attack');
        this.game.audio.play('thud', 0.5);
      }
    } else {
      this.anim.play('attack');
      if (this.stateTime >= 0.6) {
        this.setState('walk');
        this.cool = fxRng.float(...d.attackInterval);
      }
    }
  }
  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const d = this.def;
    const t = this.stateTime / d.windupTime;
    o.line(this.x, this.y, this.x + this.ax * d.rootSteps * d.rootSpacing, this.y + this.ay * d.rootSteps * d.rootSpacing, TELE.danger, telegraphAlpha(t, time), 3, 3);
  }
  onDeath() {
    this.game.effects.burst(this.game.effects.presets.splinter, this.x, this.y, 10, 18, 90, 90);
    this.game.audio.play('woodBreak', 0.6);
  }
}

// 23. Goblin Cutpurse - grins and crouches (telegraph), then dashes in, snatches your pennies and
// runs. Kill it before it escapes to get them back (with interest).
export class GoblinCutpurse extends Enemy {
  constructor(game) {
    super(game, 'cutpurse', 'cutpurse', { anchorY: 2, shadow: 0, blood: 'blood' });
  }
  onSpawn() {
    this.setState('stalk');
    this.stolen = 0;
  }
  think() {
    const d = this.def;
    this.toPlayer(v);
    const pl = this.game.player;
    if (this.state === 'stalk') {
      this.chase(this.speed * 0.6);
      this.faceX(v.x);
      this.anim.play('walk');
      if (this.canAct && v.dist < 70) {
        this.setState('grin');
        this.game.audio.play('caw', 0.4);
      }
    } else if (this.state === 'grin') {
      this.stop();
      this.anim.play('windup');
      if (this.stateTime >= d.grabTime) this.setState('dash');
    } else if (this.state === 'dash') {
      this.chase(this.speed * 1.6);
      this.faceX(v.x);
      this.anim.play('attack');
      if (v.dist < this.def.radius + PLAYER.radius + 2) {
        this.stolen = Math.min(d.steal, pl.pennies);
        pl.pennies -= this.stolen;
        this.game.hud.markDirty();
        this.game.audio.play('steal');
        this.setState('flee');
      } else if (this.stateTime > 1.4) this.setState('flee');
    } else if (this.state === 'flee') {
      this.vx = (-v.x / v.dist) * d.fleeSpeed;
      this.vy = (-v.y / v.dist) * d.fleeSpeed;
      this.faceX(this.vx);
      this.anim.play(this.stolen ? 'flee' : 'walk');
      if (this.stateTime > d.escapeTime) {
        // it slips away through a crack in the wall, pennies and all
        this.game.effects.spawnPuff(this.x, this.y);
        this.release();
      }
    }
  }
  onDeath() {
    for (let i = 0; i < this.stolen + 1; i++) this.game.pickups.spawn(this.room, 'penny', this.x, this.y);
    this.stolen = 0;
  }
}
