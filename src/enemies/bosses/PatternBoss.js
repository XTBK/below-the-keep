import { Enemy } from '../Enemy.js';
import { PATTERN_BOSSES, BOSS_FX } from '../../data/bosses.js';
import * as THREE from 'three';
import { TELE, telegraphAlpha } from '../telegraph.js';
import { depthFor } from '../../render/Sprite.js';
import { fxRng } from '../../core/Rng.js';
import { PLAYER } from '../../data/config.js';

// One class drives every boss from chapter 2 on. Each boss in data/bosses.js (PATTERN_BOSSES) is a
// list of PHASES (which start below some fraction of its health), and each phase is a weighted
// list of ATTACK PATTERNS with their numbers:
//
//   lob     throws things in an arc (red rings show where they land)   -> fire / poison / shards
//   rain    things burst from the floor or fall from the ceiling (red rings first)
//   summon  calls minions
//   spiral  spins out arms of orbs
//   charge  a red path, then a straight charge until it hits a wall (dazed afterwards)
//   pounce  a red ring where it will land, then a leap
//   ring    rings of orbs in every direction
//   lines   red lines run along the floor, then eruptions race along them
//   fan     fans of orbs aimed at Wren (optionally weaving)
//   blink   fades out and reappears elsewhere
//   sweep   a red arc in front of it, then a huge swing
//   slam    leaps into the air (a shrinking ring follows Wren), crashes down with a ring of shards
//   homing  slow orbs that follow Wren
//   dash, boomerang, pull, cross, minefield, laser, breath, wall, bounce: see data/bosses2.js
//
// Every pattern has a wind-up (its telegraph) before anything dangerous happens.

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };
const CAST = new Set(['ring', 'spiral', 'summon', 'homing', 'pull', 'cross', 'minefield', 'laser', 'wall', 'bounce']);
const BEAM = {
  shadow: [new THREE.Color(1.1, 0.5, 2.2), new THREE.Color(2.4, 1.8, 3.0)],
  fire: [new THREE.Color(2.6, 0.9, 0.3), new THREE.Color(3.2, 2.4, 1.2)],
  tongue: [new THREE.Color(1.6, 0.35, 0.45), new THREE.Color(2.2, 0.8, 0.9)],
  holy: [new THREE.Color(2.6, 2.0, 0.8), new THREE.Color(3.2, 3.0, 2.2)],
  abyss: [new THREE.Color(0.6, 2.2, 0.8), new THREE.Color(1.8, 3.0, 1.6)],
};
const GUST = new THREE.Color(1.0, 1.2, 1.4);
const FIRE_OUTER = new THREE.Color(2.2, 0.7, 0.15);
const FIRE_INNER = new THREE.Color(3.0, 2.2, 0.9);

function segDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / l2));
  return Math.hypot(px - (x0 + dx * t), py - (y0 + dy * t));
}

export class PatternBoss extends Enemy {
  constructor(game, type, look) {
    const def = PATTERN_BOSSES[type];
    super(game, type, def.sheet, look, def);
    this.isBoss = true;
    this.targets = [];
    for (let i = 0; i < 12; i++) this.targets.push({ x: 0, y: 0 });
  }

  get name() {
    return this.phaseTitle || this.def.name;
  }

  get subtitle() {
    return this.def.subtitle;
  }

  get corpseTime() {
    return BOSS_FX.deathTime;
  }

  get phase() {
    return this.def.phases[this.phaseIndex];
  }

  get hittable() {
    return this.state !== 'gone' && this.state !== 'burrowed' && this.state !== 'transform';
  }

  get touchDamage() {
    if (this.state === 'gone' || this.state === 'burrowed' || this.h > 10) return 0;
    return this.def.contactDamage;
  }

  stun(time) {
    super.stun(Math.min(time, 0.5));
  }

  onSpawn() {
    this.grace = 0;
    this.shotMult = this.shotMult || 1; // set by the depth scaling (see data/difficulty.js)
    this.phaseIndex = 0;
    this.phaseTitle = this.def.phases[0].title || null;
    this.moveMode = this.def.move;
    this.speedMult = 1;
    this.orbit = fxRng.chance(0.5) ? 1 : -1;
    this.sprite.useSheet(this.def.sheet);
    this.lastPattern = '';
    this.mines = [];
    this.rest();
  }

  rest() {
    this.setState('rest');
    this.restFor = fxRng.float(...this.def.restTime) / this.speedMult;
  }

  // --- phases -------------------------------------------------------------------------------------

  _checkPhase() {
    const frac = this.hp / this.maxHp;
    let idx = this.phaseIndex;
    while (idx + 1 < this.def.phases.length && frac < this.def.phases[idx + 1].below) idx++;
    if (idx === this.phaseIndex) return false;
    this.phaseIndex = idx;
    const ph = this.phase;
    this.speedMult = ph.speedMult || 1;
    if (ph.move) this.moveMode = ph.move;
    if (ph.title) this.phaseTitle = ph.title;
    this.h = 0;
    this.sprite.visible = true;
    this.setState('transform');
    this.game.enemies.shots.clear();
    this.game.audio.play('roar', 1);
    this.game.audio.play('gong', 0.7);
    this.game.feel.shake(0.6);
    return true;
  }

  hit(damage, dx, dy, quiet) {
    if (this.state === 'transform') return false;
    const took = super.hit(damage, dx, dy, quiet);
    if (took && this.alive) this._checkPhase();
    // some bosses shake loose a minion when hurt
    const soh = this.def.summonOnHurt;
    if (took && this.alive && soh && !quiet && fxRng.chance(soh[1]) && this._countAlive(soh[0]) < soh[2]) {
      this.game.enemies.spawn(soh[0], this.room, this.x + fxRng.float(-16, 16), this.y + fxRng.float(-12, 12), { quiet: true });
    }
    return took;
  }

  // --- choosing an attack -----------------------------------------------------------------------

  _countAlive(type) {
    let n = 0;
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e.type === type) n++;
    });
    return n;
  }

  _choose() {
    const list = this.phase.attacks.filter(([, name, p]) => {
      if (name === 'summon' && this._countAlive(p.type) >= p.max) return false;
      return true;
    });
    let total = 0;
    for (const [w, name] of list) total += name === this.lastPattern ? w * 0.4 : w;
    let r = fxRng.next() * total;
    for (const a of list) {
      r -= a[1] === this.lastPattern ? a[0] * 0.4 : a[0];
      if (r <= 0) return a;
    }
    return list[list.length - 1];
  }

  _startAttack() {
    const [, name, p] = this._choose();
    this.pattern = name;
    this.lastPattern = name;
    this.p = p;
    this.step = 0;
    this.repeatsLeft = p.repeats || 1;
    this.toPlayer(v);
    this.aim = Math.atan2(v.y, v.x);
    this.sweepDir = fxRng.chance(0.5) ? 1 : -1;
    this.faceX(v.x);
    this._aimTargets();
    this.spin0 = fxRng.float(0, Math.PI);
    this.setState('windup');
    if (CAST.has(name)) this.game.audio.play('cast', 0.8);
    else if (name === 'charge' || name === 'pounce') this.game.audio.play('roar', 0.5);
  }

  /** Where lobs / rain / pounces / slams will land - chosen at the start of the wind-up. */
  _aimTargets() {
    const p = this.p;
    const pl = this.game.player;
    const b = this.room.bounds;
    const n = Math.min(this.targets.length, p.count || 1);
    this.nTargets = n;
    for (let i = 0; i < n; i++) {
      const t = this.targets[i];
      let r = 0;
      if (this.pattern === 'lob') r = i === 0 ? 0 : p.spread;
      else if (this.pattern === 'rain') r = p.onPlayer ? (i === 0 ? 0 : 40) : p.nearPlayer || p.spread || 0;
      const a = fxRng.float(0, Math.PI * 2);
      const d = Math.sqrt(fxRng.next()) * r;
      t.x = Math.max(b.x0 + 8, Math.min(b.x1 - 8, pl.x + Math.cos(a) * d));
      t.y = Math.max(b.y0 + 8, Math.min(b.y1 - 8, pl.y + Math.sin(a) * d * 0.8));
    }
  }

  // --- the brain ----------------------------------------------------------------------------------

  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'transform':
        this.stop();
        this.anim.play('cast');
        if (this.stateTime > 0.25 && this.phase.sheet && this.sprite.sheet.key !== this.phase.sheet) {
          this.sprite.useSheet(this.phase.sheet);
          this.game.effects.relicBurst(this.x, this.y);
        }
        if (this.stateTime >= 1.2) this.rest();
        break;
      case 'rest':
        this._move();
        if (this.stateTime >= this.restFor) this._startAttack();
        break;
      case 'windup':
        this._windup(dt);
        break;
      case 'act':
        this._act(dt);
        break;
      case 'stunned':
        this.stop();
        this.anim.play('idle');
        if (this.stateTime >= this.p.stun) {
          if (--this.repeatsLeft > 0) {
            this.toPlayer(v);
            this.aim = Math.atan2(v.y, v.x);
            this.setState('windup');
          } else this.rest();
        }
        break;
      case 'gone':
        this.stop();
        if (this.stateTime >= 0.35) {
          this._reappear();
          this.setState('appear');
        }
        break;
      case 'appear':
        this.stop();
        this.anim.play('idle');
        if (this.stateTime >= 0.35) this.rest();
        break;
      case 'burrowed':
        this.stop();
        if (this.stateTime >= this.p.delay) {
          this.x = this.targets[0].x;
          this.y = this.targets[0].y;
          this.setState('act');
          this.step = 99; // just recover
        }
        break;
    }
    if (d.move === 'hover' || this.moveMode === 'hover') {
      if (this.state !== 'act' || this.pattern !== 'slam') this.h = 6 + Math.sin(this.time * 2) * 3;
    }
  }

  _move() {
    const sp = this.speed * this.speedMult;
    this.faceX(v.x);
    this.anim.play('walk');
    switch (this.moveMode) {
      case 'chase':
        this.chase(sp);
        break;
      case 'keepRange': {
        const [near, far] = this.def.range;
        if (v.dist < near) {
          this.vx = (-v.x / v.dist) * sp;
          this.vy = (-v.y / v.dist) * sp;
        } else if (v.dist > far) this.chase(sp);
        else {
          this.vx = (-v.y / v.dist) * this.orbit * sp * 0.7;
          this.vy = (v.x / v.dist) * this.orbit * sp * 0.7;
        }
        break;
      }
      case 'circle': {
        const radial = (v.dist - 110) / 110;
        const tx = (-v.y / v.dist) * this.orbit + (v.x / v.dist) * radial;
        const ty = (v.x / v.dist) * this.orbit + (v.y / v.dist) * radial;
        const l = Math.hypot(tx, ty) || 1;
        this.vx = (tx / l) * sp;
        this.vy = (ty / l) * sp;
        this.faceX(this.vx);
        break;
      }
      default: {
        // hover: drift to a point a little way above Wren
        const b = this.room.bounds;
        const tx = Math.max(b.x0 + 30, Math.min(b.x1 - 30, this.game.player.x + Math.sin(this.time * 0.7) * 90));
        const ty = Math.max(b.y0 + 30, Math.min(b.y1 - 30, this.game.player.y + 90));
        this.walkTo(tx, ty, sp);
        this.anim.play('idle');
      }
    }
  }

  _windup() {
    const p = this.p;
    this.stop();
    this.anim.play(p.anim || (CAST.has(this.pattern) ? 'cast' : 'windup'));
    if (this.pattern === 'charge' || this.pattern === 'sweep' || this.pattern === 'lines' || this.pattern === 'fan') this.faceX(Math.cos(this.aim));
    if (this.stateTime < p.windup / Math.max(1, this.speedMult * 0.9)) return;
    this.setState('act');
    this.step = 0;
    this.acc = 0;
    this._begin();
  }

  /** The moment the attack goes off. */
  _begin() {
    const p = this.p;
    const g = this.game;
    const hz = g.enemies.hazards;
    const shots = g.enemies.shots;
    const src = this.def.name;
    switch (this.pattern) {
      case 'lob':
        for (let i = 0; i < this.nTargets; i++) {
          const t = this.targets[i];
          shots.lobFireball(this.x + this.facing * 10, this.y, 24, t.x, t.y, p.time + i * 0.06, {
            patchRadius: p.patch ? p.patchRadius : 0,
            patchTime: p.patchTime,
            patchDamage: 1,
            patchKind: p.patch,
            shards: p.shards || 0,
            frame: p.frame,
            source: src,
          });
        }
        g.audio.play('fireThrow', 0.8);
        break;
      case 'rain':
        for (let i = 0; i < this.nTargets; i++) {
          const t = this.targets[i];
          hz.erupt(t.x, t.y, p.delay + i * 0.08, p.radius, { visual: p.visual, shards: p.shards || 0, shardFrame: p.shardFrame, source: src });
        }
        if (p.burrow) {
          this.setState('burrowed');
          g.effects.landDust(this.x, this.y, 16);
          g.audio.play('thud', 0.6);
          this.sprite.visible = false;
        }
        break;
      case 'summon':
        for (let i = 0; i < p.count; i++) {
          const a = (i / p.count) * Math.PI * 2 + fxRng.float(0, 1);
          g.enemies.spawn(p.type, this.room, this.x + Math.cos(a) * 34, this.y + Math.sin(a) * 24);
        }
        g.audio.play('roar', 0.5);
        break;
      case 'spiral':
        this.spin = this.aim;
        break;
      case 'charge':
        this.cx = Math.cos(this.aim);
        this.cy = Math.sin(this.aim);
        this.lastX = this.x;
        this.lastY = this.y;
        g.audio.play('swing');
        break;
      case 'pounce':
      case 'slam':
        this.fx = this.x;
        this.fy = this.y;
        this.tx = this.targets[0].x = g.player.x;
        this.ty = this.targets[0].y = g.player.y;
        g.audio.play('hop', 1);
        break;
      case 'ring':
        this.spin = fxRng.float(0, 1);
        this.next = 0;
        break;
      case 'fan':
        this.next = 0;
        break;
      case 'lines':
        for (let k = 0; k < p.directions; k++) {
          const a = this.aim + (k - (p.directions - 1) / 2) * p.spread;
          for (let i = 1; i <= p.steps; i++) hz.erupt(this.x + Math.cos(a) * i * p.spacing, this.y + Math.sin(a) * i * p.spacing * 0.85, i * p.delay, p.radius, { visual: p.visual, source: src });
        }
        g.audio.play('thud');
        g.feel.shake(0.3);
        break;
      case 'blink':
        g.audio.play('blink');
        break;
      case 'sweep': {
        g.audio.play('swing', 1);
        this.toPlayer(v);
        let diff = Math.atan2(v.y, v.x) - this.aim;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (v.dist < p.reach && Math.abs(diff) < p.arc) g.player.hurt(1, this.x, this.y, src);
        g.feel.shake(0.2);
        break;
      }
      case 'dash':
        this.dashesLeft = p.count;
        this._aimDash();
        break;
      case 'boomerang':
        for (let i = 0; i < p.count; i++) {
          const a = this.aim + (p.count > 1 ? (i / (p.count - 1) - 0.5) * p.spread * 2 : 0);
          shots.fireOrb(this.x, this.y, 18 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src, { reverseAt: p.reverseAt, life: p.reverseAt * 2.6 });
        }
        g.audio.play('swing', 1);
        break;
      case 'pull':
        g.audio.play(p.strength < 0 ? 'breath' : 'inhale', 1);
        break;
      case 'cross':
        this.spin = this.spin0;
        this.acc = 0;
        break;
      case 'minefield': {
        const b = this.room.bounds;
        for (let i = 0; i < p.count; i++) {
          const x = fxRng.float(b.x0 + 16, b.x1 - 16);
          const y = fxRng.float(b.y0 + 16, b.y1 - 16);
          const delay = fxRng.float(...p.spread);
          hz.erupt(x, y, delay, p.radius, { visual: p.visual, source: src });
          if (p.patch) this.mines.push({ x, y, t: delay });
        }
        // one always lands where Wren stands
        hz.erupt(g.player.x, g.player.y, p.spread[0] + 0.3, p.radius, { visual: p.visual, source: src });
        break;
      }
      case 'laser':
      case 'breath':
        g.audio.play(this.pattern === 'laser' ? 'cast' : 'breath', 1);
        this.beamAngle = this.aim - p.sweep * 0.5 * this.sweepDir;
        break;
      case 'wall':
        this.next = 0;
        this.wallGap = fxRng.float(0.2, 0.8);
        break;
      case 'bounce':
        for (let i = 0; i < p.count; i++) {
          const a = this.aim + (i / p.count) * Math.PI * 2 + fxRng.float(-0.1, 0.1);
          shots.fireOrb(this.x, this.y, 16 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src, { bounce: p.bounces, life: 7 });
        }
        g.audio.play('spit', 0.8);
        break;
      case 'homing':
        for (let i = 0; i < p.count; i++) {
          const a = this.aim + Math.PI + (i - (p.count - 1) / 2) * 0.6; // they leave backwards, then curl round
          shots.fireOrb(this.x, this.y, 18 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src, { homing: p.turn, life: 6, land: p.land });
        }
        break;
    }
  }

  /** Attacks that last a while (spirals, charges, leaps, volleys). Returns to rest when done. */
  _act(dt) {
    const p = this.p;
    const g = this.game;
    const shots = g.enemies.shots;
    const src = this.def.name;
    this.anim.play(CAST.has(this.pattern) ? 'cast' : 'attack');
    let done = this.stateTime >= 0.5;
    if (this.step === 99) {
      // popped back up out of the ground
      this.sprite.visible = true;
      this.stop();
      if (this.stateTime >= 0.6) this.rest();
      return;
    }
    switch (this.pattern) {
      case 'spiral':
        this.stop();
        this.acc += dt * p.rate;
        while (this.acc >= 1) {
          this.acc -= 1;
          for (let k = 0; k < p.arms; k++) {
            const a = this.spin + (k / p.arms) * Math.PI * 2;
            shots.fireOrb(this.x, this.y, 16 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src);
          }
        }
        this.spin += p.turn * dt;
        done = this.stateTime >= p.duration;
        break;
      case 'ring':
      case 'fan': {
        this.stop();
        const count = this.pattern === 'ring' ? p.rings : p.volleys;
        if (this.stateTime >= this.next && this.step < count) {
          if (this.pattern === 'ring') {
            // holes: leave a gap of that many orbs (aimed near Wren, or wandering)
            if (p.holes && this.step === 0) {
              this.toPlayer(v);
              this.gapAt = p.gapAim ? Math.atan2(v.y, v.x) + fxRng.float(-0.6, 0.6) : fxRng.float(0, Math.PI * 2);
            }
            for (let i = 0; i < p.count; i++) {
              const a = this.spin + (i / p.count) * Math.PI * 2;
              if (p.holes) {
                let d = a - this.gapAt;
                d = Math.atan2(Math.sin(d), Math.cos(d));
                if (Math.abs(d) < (p.holes / p.count) * Math.PI) continue;
              }
              shots.fireOrb(this.x, this.y, 16 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src);
            }
            if (p.holes) this.gapAt += (p.gapSpin || 0) * (fxRng.chance(0.5) ? 1 : -1);
            this.spin += p.spin || Math.PI / p.count;
          } else {
            this.toPlayer(v);
            const aim = Math.atan2(v.y, v.x);
            for (let i = 0; i < p.count; i++) {
              const a = aim + (p.count > 1 ? (i / (p.count - 1) - 0.5) * p.spread : 0);
              shots.fireOrb(this.x + this.facing * 8, this.y, 16 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src, p.wave || p.land ? { wave: p.wave, land: p.land, life: p.land ? 1.4 : 4 } : null);
            }
          }
          g.audio.play('spit', 0.6);
          this.step++;
          this.next += p.gap || 0.3;
        }
        done = this.step >= count && this.stateTime >= this.next;
        break;
      }
      case 'charge': {
        this.vx = this.cx * p.speed;
        this.vy = this.cy * p.speed;
        this.faceX(this.cx);
        if (p.trail) {
          this.trailAcc = (this.trailAcc || 0) + dt;
          if (this.trailAcc >= 0.07) {
            this.trailAcc = 0;
            if (p.trail === 'roots') g.enemies.hazards.erupt(this.x, this.y, 0.45, 11, { visual: 0, source: src });
            else g.enemies.hazards.spawn(this.room, this.x, this.y, 10, 2.4, 1, p.trail);
          }
        }
        const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
        this.lastX = this.x;
        this.lastY = this.y;
        done = false;
        if ((this.stateTime > 0.12 && moved < p.speed * dt * 0.3) || this.stateTime > 2.5) {
          this.stop();
          g.audio.play('thud');
          g.feel.shake(0.45);
          g.effects.landDust(this.x + this.cx * 16, this.y, 14);
          this.setState('stunned');
          return;
        }
        break;
      }
      case 'pounce':
      case 'slam': {
        const T = this.pattern === 'pounce' ? p.time : p.air;
        const k = Math.min(1, this.stateTime / T);
        if (this.pattern === 'slam') {
          // the ring follows Wren for most of the leap, then locks in place
          if (k < 0.7) {
            this.tx = g.player.x;
            this.ty = g.player.y;
          }
          this.targets[0].x = this.tx;
          this.targets[0].y = this.ty;
        }
        this.x = this.fx + (this.tx - this.fx) * k;
        this.y = this.fy + (this.ty - this.fy) * k;
        this.h = 4 * (p.height || 70) * k * (1 - k);
        done = false;
        if (k >= 1) {
          this.h = 0;
          this.collide();
          this.toPlayer(v);
          const r = p.radius || 22;
          if (v.dist < r + PLAYER.radius) g.player.hurt(1, this.x, this.y, src);
          for (let i = 0; i < (p.shards || 0); i++) {
            const a = (i / p.shards) * Math.PI * 2;
            shots.fireOrb(this.x, this.y, 8, Math.cos(a), Math.sin(a), p.shardSpeed * this.shotMult, p.frame, 1, src);
          }
          g.enemies.shockwave(this.x, this.y, r * 1.4);
          g.effects.landDust(this.x, this.y, 16);
          g.audio.play('thud', 1);
          g.feel.shake(this.pattern === 'slam' ? 0.6 : 0.3);
          if (--this.repeatsLeft > 0) {
            this.toPlayer(v);
            this.setState('windup');
            this.stateTime = this.p.windup * 0.4; // follow-up leaps come quicker
          } else this.rest();
          return;
        }
        break;
      }
      case 'dash': {
        // a quick dash, a short breath, again
        done = false;
        if (this.dashPause > 0) {
          this.stop();
          this.dashPause -= dt;
          if (this.dashPause <= 0) this._aimDash();
          break;
        }
        this.vx = this.cx * p.speed;
        this.vy = this.cy * p.speed;
        this.faceX(this.cx);
        if (this.stateTime >= this.dashEnd) {
          this.stop();
          if (--this.dashesLeft > 0) this.dashPause = p.gap;
          else done = true;
        }
        break;
      }
      case 'pull': {
        // a vortex (or a gust): Wren is dragged in (or blown back), and it can't be outrun for long
        this.stop();
        const pl = g.player;
        const dx = this.x - pl.x;
        const dy = this.y - pl.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 18) {
          pl.x += (dx / d) * p.strength * dt;
          pl.y += (dy / d) * p.strength * dt;
        }
        if (fxRng.chance(0.5)) g.effects.glow.emit(g.effects.presets.holy, pl.x - (dx / d) * 30, pl.y - (dy / d) * 30, 10, (dx / d) * p.strength, (dy / d) * p.strength, 0);
        done = this.stateTime >= p.duration;
        if (done && p.ring) {
          for (let i = 0; i < p.ring; i++) {
            const a = (i / p.ring) * Math.PI * 2;
            shots.fireOrb(this.x, this.y, 16 + this.h, Math.cos(a), Math.sin(a), 110 * this.shotMult, p.frame, 1, src);
          }
          g.audio.play('spit', 0.8);
        }
        break;
      }
      case 'cross':
        this.stop();
        this.acc += dt * p.rate;
        while (this.acc >= 1) {
          this.acc -= 1;
          for (let k = 0; k < p.arms; k++) {
            const a = this.spin + (k / p.arms) * Math.PI * 2;
            shots.fireOrb(this.x, this.y, 16 + this.h, Math.cos(a), Math.sin(a), p.speed * this.shotMult, p.frame, 1, src);
          }
        }
        this.spin += p.turn * dt;
        done = this.stateTime >= p.duration;
        break;
      case 'minefield':
        this.stop();
        done = this.stateTime >= p.spread[1] + 0.3;
        // poison / spore clouds rise where the mines went off
        for (const m of this.mines) {
          if (!m.done && this.stateTime >= m.t) {
            m.done = true;
            g.enemies.hazards.spawn(this.room, m.x, m.y, 20, 2.5, 1, 'poison', p.patch === 'spores');
          }
        }
        if (done) this.mines.length = 0;
        break;
      case 'laser':
      case 'breath': {
        // a beam (or a cone of fire) that sweeps from one side of Wren to the other
        this.stop();
        const k = Math.min(1, this.stateTime / p.duration);
        this.beamAngle = this.aim + p.sweep * (k - 0.5) * this.sweepDir;
        const pl = g.player;
        if (this.pattern === 'laser') {
          const beams = p.beams || 1;
          for (let i = 0; i < beams; i++) {
            const a = this.beamAngle + (i / beams) * Math.PI * 2;
            this.room.nav.raycast(this.x, this.y, Math.cos(a), Math.sin(a), p.length || 700, end);
            if (segDist(pl.x, pl.y, this.x, this.y, end.x, end.y) < p.width + PLAYER.radius) pl.hurt(1, this.x, this.y, src);
          }
        } else {
          const dx = pl.x - this.x;
          const dy = pl.y - this.y;
          let diff = Math.atan2(dy, dx) - this.beamAngle;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          if (Math.hypot(dx, dy) < p.reach && Math.abs(diff) < p.cone) pl.hurt(1, this.x, this.y, 'Dragonfire');
          const fx = g.effects;
          for (let i = 0; i < 4; i++) {
            const a = this.beamAngle + fxRng.float(-p.cone, p.cone);
            const sp = fxRng.float(160, 260);
            fx.glow.emit(fx.presets.ember, this.x + Math.cos(this.beamAngle) * 16, this.y + Math.sin(this.beamAngle) * 12, 18, Math.cos(a) * sp, Math.sin(a) * sp, fxRng.float(-10, 20));
          }
        }
        done = k >= 1;
        break;
      }
      case 'wall': {
        // rows of orbs march across the room from one side; each row has a gap somewhere
        this.stop();
        done = false;
        if (this.stateTime >= this.next && this.step < p.volleys) {
          const b = this.room.bounds;
          this.toPlayer(v);
          const horizontal = Math.abs(v.x) > Math.abs(v.y); // the wall comes from behind the boss, toward Wren
          const fromLow = horizontal ? v.x > 0 : v.y > 0;
          const span = horizontal ? b.y1 - b.y0 : b.x1 - b.x0;
          const n = Math.floor(span / 18);
          const gapStart = Math.floor(this.wallGap * (n - p.gapSize));
          for (let i = 0; i < n; i++) {
            if (i >= gapStart && i < gapStart + p.gapSize) continue;
            const along = (horizontal ? b.y0 : b.x0) + 9 + i * 18;
            const x = horizontal ? (fromLow ? b.x0 + 4 : b.x1 - 4) : along;
            const y = horizontal ? along : fromLow ? b.y0 + 4 : b.y1 - 4;
            const dx = horizontal ? (fromLow ? 1 : -1) : 0;
            const dy = horizontal ? 0 : fromLow ? 1 : -1;
            shots.fireOrb(x, y, 12, dx, dy, p.speed * this.shotMult, p.frame, 1, src, { life: 9 });
          }
          this.wallGap = Math.max(0.05, Math.min(0.95, this.wallGap + (fxRng.chance(0.5) ? 1 : -1) * 0.12 * (p.gapStep || 1)));
          g.audio.play('wail', 0.4);
          this.step++;
          this.next += 1.0;
        }
        if (this.step >= p.volleys && this.stateTime >= this.next - 0.4) done = true;
        break;
      }
      case 'blink':
        this.stop();
        done = false;
        if (this.stateTime >= 0.3) {
          this.setState('gone');
          return;
        }
        break;
      default:
        this.stop();
    }
    if (done) this.rest();
  }

  _aimDash() {
    this.toPlayer(v);
    this.cx = v.x / v.dist;
    this.cy = v.y / v.dist;
    this.dashEnd = this.stateTime + this.p.time;
    this.dashPause = 0;
    this.game.audio.play('hop', 0.8);
  }

  _reappear() {
    const b = this.room.bounds;
    const pl = this.game.player;
    let best = null;
    for (let i = 0; i < 10; i++) {
      const x = fxRng.float(b.x0 + 30, b.x1 - 30);
      const y = fxRng.float(b.y0 + 30, b.y1 - 30);
      const d = Math.hypot(x - pl.x, y - pl.y);
      if (d > 80 && this.room.nav.isWalkable(x, y) && (!best || Math.abs(d - 150) < Math.abs(best.d - 150))) best = { x, y, d };
    }
    if (best) {
      this.x = best.x;
      this.y = best.y;
    }
    this.game.effects.sparkle(this.x, this.y);
  }

  move(dt) {
    if (this.state === 'act' && (this.pattern === 'pounce' || this.pattern === 'slam')) return;
    if (this.state === 'act' && this.pattern === 'dash') {
      // dashes don't care about knockback
      this.kbx = this.kby = 0;
    }
    super.move(dt);
  }

  sync() {
    super.sync();
    if (this.dying) return;
    const hidden = this.state === 'gone' || this.state === 'burrowed';
    if (hidden) this.sprite.visible = false;
    else if (this.state === 'act' && this.pattern === 'blink') this.sprite.visible = Math.floor(this.stateTime * 30) % 2 === 0;
    else if (this.state === 'appear') this.sprite.visible = Math.floor(this.stateTime * 30) % 2 === 0;
    else if (this.state === 'transform') this.sprite.visible = this.stateTime > 0.9 || Math.floor(this.stateTime * 16) % 2 === 0;
    else this.sprite.visible = true;
    this.shadow.visible = !hidden;
  }

  drawOverlay(o, time) {
    if (this.dying) return;
    const p = this.p;
    if (this.state === 'windup') {
      const t = Math.min(1, this.stateTime / p.windup);
      const c = t > 0.75 ? TELE.dangerHot : TELE.danger;
      const a = telegraphAlpha(t, time);
      switch (this.pattern) {
        case 'lob':
          for (let i = 0; i < this.nTargets; i++) o.ring(this.targets[i].x, this.targets[i].y, p.patchRadius || 14, c, a);
          break;
        case 'rain':
          for (let i = 0; i < this.nTargets; i++) o.ring(this.targets[i].x, this.targets[i].y, p.radius * t, c, a * 0.6);
          break;
        case 'charge':
          this.room.nav.raycast(this.x, this.y, Math.cos(this.aim), Math.sin(this.aim), 700, end);
          for (const off of [-10, 10]) {
            const s = Math.sin(this.aim);
            const k = Math.cos(this.aim);
            o.line(this.x - s * off, this.y + k * off, end.x - s * off, end.y + k * off, c, a, 3, 3);
          }
          break;
        case 'pounce':
        case 'slam':
          o.ring(this.game.player.x, this.game.player.y, (p.radius || 22) * (1.3 - 0.3 * t), c, a);
          break;
        case 'lines':
          for (let k = 0; k < p.directions; k++) {
            const ang = this.aim + (k - (p.directions - 1) / 2) * p.spread;
            const L = p.steps * p.spacing;
            o.line(this.x, this.y, this.x + Math.cos(ang) * L * t, this.y + Math.sin(ang) * L * 0.85 * t, c, a, 3, 3);
          }
          break;
        case 'sweep':
          o.arc(this.x, this.y, p.reach, this.aim - p.arc, this.aim + p.arc, c, a, depthFor(this.y) + 0.001, 0.8);
          o.arc(this.x, this.y, p.reach * 0.6, this.aim - p.arc, this.aim + p.arc, c, a * 0.5, depthFor(this.y) + 0.001, 0.8);
          break;
        case 'dash':
          this.room.nav.raycast(this.x, this.y, Math.cos(this.aim), Math.sin(this.aim), p.speed * p.time, end);
          o.line(this.x, this.y, end.x, end.y, c, a, 3, 3);
          break;
        case 'boomerang':
          for (let i = 0; i < p.count; i++) {
            const ang = this.aim + (p.count > 1 ? (i / (p.count - 1) - 0.5) * p.spread * 2 : 0);
            const L = p.speed * p.reverseAt * 0.9;
            o.line(this.x, this.y, this.x + Math.cos(ang) * L, this.y + Math.sin(ang) * L, c, a, 3, 3);
          }
          break;
        case 'cross':
          for (let k = 0; k < p.arms; k++) {
            const ang = this.spin0 + (k / p.arms) * Math.PI * 2;
            o.line(this.x, this.y, this.x + Math.cos(ang) * 70, this.y + Math.sin(ang) * 70, c, a, 3, 3);
          }
          break;
        case 'pull':
          for (let r = 0; r < 3; r++) o.ring(this.x, this.y, (p.strength > 0 ? 70 - ((time * 60 + r * 23) % 70) : (time * 60 + r * 23) % 70) + 10, p.strength > 0 ? c : GUST, a * 0.6);
          break;
        case 'laser': {
          const beams = p.beams || 1;
          const start = this.aim - p.sweep * 0.5 * this.sweepDir;
          for (let i = 0; i < beams; i++) {
            const ang = start + (i / beams) * Math.PI * 2;
            this.room.nav.raycast(this.x, this.y, Math.cos(ang), Math.sin(ang), p.length || 700, end);
            o.line(this.x, this.y + 12, end.x, end.y + 8, c, a, 3, 2);
          }
          break;
        }
        case 'breath': {
          const start = this.aim - p.sweep * 0.5 * this.sweepDir;
          o.arc(this.x, this.y, p.reach, start - p.cone, start + p.cone, c, a, depthFor(this.y) + 0.001, 0.8);
          o.line(this.x, this.y, this.x + Math.cos(start - p.cone) * p.reach, this.y + Math.sin(start - p.cone) * p.reach, c, a, 3, 0);
          o.line(this.x, this.y, this.x + Math.cos(start + p.cone) * p.reach, this.y + Math.sin(start + p.cone) * p.reach, c, a, 3, 0);
          break;
        }
        case 'fan': {
          for (let i = 0; i < p.count; i++) {
            const ang = this.aim + (p.count > 1 ? (i / (p.count - 1) - 0.5) * p.spread : 0);
            o.line(this.x, this.y, this.x + Math.cos(ang) * 60, this.y + Math.sin(ang) * 60, c, a * 0.7, 3, 2);
          }
          break;
        }
        default:
          o.ring(this.x, this.y, 22 + t * 14, c, a * 0.7);
      }
    } else if (this.state === 'act' && this.pattern === 'slam') {
      const k = Math.min(1, this.stateTime / p.air);
      o.ring(this.tx, this.ty, p.radius * (1.2 - 0.4 * k), k > 0.7 ? TELE.dangerHot : TELE.danger, 0.9);
    } else if (this.state === 'act' && this.pattern === 'pounce') {
      o.ring(this.tx, this.ty, p.radius, TELE.dangerHot, 0.8);
    } else if (this.state === 'act' && this.pattern === 'laser') {
      // the beam itself: a flickering white-hot core in a coloured glow (render/BeamFX.js)
      const [glow, core] = BEAM[p.color] || BEAM.shadow;
      const beams = p.beams || 1;
      const fadeIn = Math.min(1, this.stateTime * 6);
      for (let i = 0; i < beams; i++) {
        const ang = this.beamAngle + (i / beams) * Math.PI * 2;
        this.room.nav.raycast(this.x, this.y, Math.cos(ang), Math.sin(ang), p.length || 700, end);
        this.game.enemies.beams.beam(this.x + Math.cos(ang) * 10, this.y + 12 + Math.sin(ang) * 8, end.x, end.y + 8, p.width, glow, core, time, fadeIn);
      }
    } else if (this.state === 'act' && this.pattern === 'breath') {
      // a roaring cone of fire, flickering
      // from the mouth (well up the body), not the feet
      const mouthH = Math.round(this.sprite.def.frameH * 0.55);
      this.game.enemies.beams.cone(this.x + Math.cos(this.beamAngle) * 10, this.y + mouthH, this.beamAngle, p.cone, p.reach, FIRE_OUTER, FIRE_INNER, time, Math.min(1, this.stateTime * 5));
    } else if (this.state === 'act' && this.pattern === 'pull') {
      for (let r = 0; r < 3; r++) o.ring(this.x, this.y, (p.strength > 0 ? 90 - ((time * 90 + r * 30) % 90) : (time * 90 + r * 30) % 90) + 8, p.strength > 0 ? TELE.danger : GUST, 0.5);
    }
  }

  onDeath() {
    this.game.audio.play('roar', 1);
    this.game.feel.shake(0.8);
    this.game.enemies.shots.clear();
    this.game.effects.explosion(this.x, this.y);
    // his court dies with him
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e !== this) {
        e.hp = 0;
        e.die();
      }
    });
  }
}

/** A tiny subclass per boss so the enemy pools stay separate. */
export function patternBossClass(type, look) {
  return class extends PatternBoss {
    constructor(game) {
      super(game, type, look);
    }
  };
}
