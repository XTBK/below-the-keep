import { Boss } from './Boss.js';
import { TELE, telegraphAlpha } from '../telegraph.js';
import { depthFor } from '../../render/Sprite.js';
import { fxRng } from '../../core/Rng.js';

// Floor 2 boss: THE WARDEN. Every attack is telegraphed:
//  1. Iron Sweep - raises his burning cage-lantern; a wide red arc shows the swing.
//  2. Lock-Down Slam - crouches, a red ring marks where he'll land, leaps, and lands in a ring
//     of flying stone shards.
//  3. Turnkey's Volley - raises a fistful of iron keys; red lines show where each one will fly.
// Below half health he roars for his guards (two crossbowmen, once) and throws bigger volleys.

const v = { x: 0, y: 0, dist: 0 };

export class Warden extends Boss {
  constructor(game) {
    super(game, 'warden', { anchorY: 4, shadow: 3, blood: 'iron' });
  }

  onSpawn() {
    this.grace = 0;
    this.calledGuards = false;
    this.rest();
  }

  _chooseAttack() {
    const d = this.def;
    this.toPlayer(v);
    if (this.enraged && !this.calledGuards) {
      this.calledGuards = true;
      this.setState('callGuards');
      this.game.audio.play('roar', 1);
      this.game.feel.shake(0.4);
      return;
    }
    const r = fxRng.next();
    if (v.dist < d.sweepRange && r < 0.55) {
      this.setState('sweepWindup');
      this.angle = Math.atan2(v.y, v.x);
      this.faceX(v.x);
      this.game.audio.play('chainRattle');
    } else if (r < 0.75) {
      this.setState('crouch');
      this.fromX = this.x;
      this.fromY = this.y;
      this.toX = this.game.player.x;
      this.toY = this.game.player.y;
      const b = this.room.bounds;
      this.toX = Math.max(b.x0 + 24, Math.min(b.x1 - 24, this.toX));
      this.toY = Math.max(b.y0 + 24, Math.min(b.y1 - 24, this.toY));
    } else {
      this.setState('throwWindup');
      this.angle = Math.atan2(v.y, v.x);
      this.faceX(v.x);
      this.game.audio.play('keyJangle');
    }
  }

  get volleyCount() {
    return this.enraged ? this.def.enrageVolley : this.def.volleyCount;
  }

  think() {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'rest':
        this.chase(this.speed * (this.enraged ? 1.3 : 1));
        this.faceX(v.x);
        this.anim.play('walk');
        if (this.stateTime >= this.restFor) this._chooseAttack();
        break;
      case 'callGuards':
        this.stop();
        this.anim.play('throwWindup');
        if (this.stateTime >= 0.9) {
          const b = this.room.bounds;
          for (let i = 0; i < d.guards; i++) {
            const x = i === 0 ? b.x0 + 30 : b.x1 - 30;
            this.game.enemies.spawn('crossbowman', this.room, x, b.y1 - 30);
          }
          this.rest();
        }
        break;
      case 'sweepWindup':
        this.stop();
        this.anim.play('sweepWindup');
        if (this.stateTime >= d.sweepWindup) {
          this.setState('sweep');
          this.game.audio.play('swing');
          this.toPlayer(v);
          let diff = Math.atan2(v.y, v.x) - this.angle;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          if (v.dist < d.sweepReach + 8 && Math.abs(diff) <= d.sweepArc) this.game.player.hurt(1, this.x, this.y, this.def.name);
          this.game.effects.fireBurst(this.x + Math.cos(this.angle) * 50, this.y + Math.sin(this.angle) * 40);
          this.game.feel.shake(0.25);
        }
        break;
      case 'sweep':
        this.anim.play('sweep');
        if (this.stateTime >= 0.3) this.rest();
        break;
      case 'crouch':
        this.stop();
        this.anim.play('crouch');
        if (this.stateTime >= d.slamWindup) {
          this.setState('air');
          this.game.audio.play('hop', 1);
        }
        break;
      case 'air': {
        const k = Math.min(1, this.stateTime / d.slamAir);
        this.x = this.fromX + (this.toX - this.fromX) * k;
        this.y = this.fromY + (this.toY - this.fromY) * k;
        this.h = 4 * 60 * k * (1 - k);
        this.anim.play('air');
        if (k >= 1) {
          this.h = 0;
          this.setState('land');
          this.game.audio.play('thud');
          this.game.audio.play('explosion', 0.5);
          this.game.feel.shake(0.7);
          this.game.effects.landDust(this.x, this.y, 30);
          this.toPlayer(v);
          if (v.dist < d.slamRadius + 6) this.game.player.hurt(1, this.x, this.y, this.def.name);
          const n = d.shardCount;
          const off = fxRng.float(0, 1);
          for (let i = 0; i < n; i++) {
            const a = ((i + off) / n) * Math.PI * 2;
            this.game.enemies.shots.fireOrb(this.x, this.y, 8, Math.cos(a), Math.sin(a), d.shardSpeed, 1, 1, this.def.name);
          }
        }
        break;
      }
      case 'land':
        this.stop();
        this.anim.play('land');
        if (this.stateTime >= 0.5) this.rest();
        break;
      case 'throwWindup':
        this.stop();
        this.anim.play('throwWindup');
        if (this.stateTime >= d.volleyWindup) {
          this.setState('throw');
          const n = this.volleyCount;
          for (let i = 0; i < n; i++) {
            const a = this.angle - d.volleySpread + (2 * d.volleySpread * i) / (n - 1);
            this.game.enemies.shots.fireOrb(this.x + this.facing * 20, this.y, 30, Math.cos(a), Math.sin(a), d.volleySpeed, 2, 1, this.def.name);
          }
          this.game.audio.play('swing');
        }
        break;
      case 'throw':
        this.anim.play('throw');
        if (this.stateTime >= 0.3) this.rest();
        break;
    }
  }

  move(dt) {
    if (this.state === 'air') this.collide();
    else super.move(dt);
  }

  drawOverlay(o, time) {
    const d = this.def;
    if (this.state === 'sweepWindup') {
      const t = this.stateTime / d.sweepWindup;
      const c = t > 0.75 ? TELE.dangerHot : TELE.danger;
      const a = telegraphAlpha(t, time);
      const z = depthFor(this.y) + 0.001;
      const a0 = this.angle - d.sweepArc;
      const a1 = this.angle + d.sweepArc;
      o.arc(this.x, this.y, d.sweepReach, a0, a1, c, a, z, 1);
      o.arc(this.x, this.y, d.sweepReach * 0.5, a0, a1, c, a * 0.4, z, 1);
      o.line(this.x, this.y, this.x + Math.cos(a0) * d.sweepReach, this.y + Math.sin(a0) * d.sweepReach, c, a * 0.6, z, 2);
      o.line(this.x, this.y, this.x + Math.cos(a1) * d.sweepReach, this.y + Math.sin(a1) * d.sweepReach, c, a * 0.6, z, 2);
    } else if (this.state === 'crouch' || this.state === 'air') {
      const t = this.state === 'crouch' ? this.stateTime / d.slamWindup : 1;
      o.ring(this.toX, this.toY, d.slamRadius, t >= 1 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time));
      o.ring(this.toX, this.toY, d.slamRadius * 0.5, TELE.danger, telegraphAlpha(t, time) * 0.5);
    } else if (this.state === 'throwWindup') {
      const t = this.stateTime / d.volleyWindup;
      const n = this.volleyCount;
      for (let i = 0; i < n; i++) {
        const ang = this.angle - d.volleySpread + (2 * d.volleySpread * i) / (n - 1);
        o.line(this.x, this.y, this.x + Math.cos(ang) * 120, this.y + Math.sin(ang) * 120, TELE.danger, telegraphAlpha(t, time) * 0.7, 3, 3);
      }
    }
  }

  onDeath() {
    const fx = this.game.effects;
    this.game.audio.play('roar', 1);
    this.game.audio.play('clatter');
    this.game.feel.shake(1);
    fx.clatter(this.x, this.y);
    fx.clatter(this.x + 20, this.y + 5);
    fx.fireBurst(this.x + this.facing * 28, this.y - 6);
    this.game.enemies.decal(this.room, 'scorch', this.x + this.facing * 28, this.y - 8);
    // his guards lay down their crossbows
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (!e.isBoss) e.die();
    });
  }
}
