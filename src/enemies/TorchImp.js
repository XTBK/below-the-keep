import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { fxRng } from '../core/Rng.js';

// 4. Torch Imp - keeps its distance and lobs arcing fireballs that leave burning patches.
// Telegraph: it raises a glowing fireball, and an orange ring marks where it will land (the ring
// stays until the fireball arrives). Death: crumbles into a heap of ash and embers.

const v = { x: 0, y: 0, dist: 0 };

export class TorchImp extends Enemy {
  constructor(game) {
    super(game, 'imp', 'imp', { anchorY: 2, shadow: 0, blood: 'ash' });
  }

  onSpawn() {
    this.setState('move');
    this.attackTimer = fxRng.float(...this.def.attackInterval);
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
  }

  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'move': {
        const [near, far] = d.preferredRange;
        if (v.dist < near) {
          // too close: back away (and sideways, so it doesn't just run into a wall)
          this.vx = (-v.x / v.dist + (-v.y / v.dist) * this.strafe * 0.5) * this.speed;
          this.vy = (-v.y / v.dist + (v.x / v.dist) * this.strafe * 0.5) * this.speed;
        } else if (v.dist > far) {
          this.chase(this.speed);
        } else {
          // circle at a comfortable range
          this.vx = (-v.y / v.dist) * this.strafe * this.speed * 0.6;
          this.vy = (v.x / v.dist) * this.strafe * this.speed * 0.6;
          if (fxRng.chance(dt * 0.4)) this.strafe = -this.strafe;
        }
        this.faceX(v.x);
        this.anim.play('walk');
        this.attackTimer -= dt;
        if (this.canAct && this.attackTimer <= 0) {
          this.setState('windup');
          // aim a little ahead of where Wren is going
          const p = this.game.player;
          this.tx = p.x + p.vx * 0.35;
          this.ty = p.y + p.vy * 0.35;
          this.game.audio.play('fireCharge');
        }
        break;
      }
      case 'windup':
        this.stop();
        this.faceX(this.tx - this.x);
        this.anim.play('windup');
        if (this.stateTime >= d.windupTime) {
          this.setState('throw');
          this.game.enemies.shots.lobFireball(this.x + this.facing * 6, this.y, 16, this.tx, this.ty, d.lobTime, d);
          this.game.audio.play('fireThrow');
        }
        break;
      case 'throw':
        this.anim.play('attack');
        if (this.stateTime >= 0.3) {
          this.setState('move');
          this.attackTimer = fxRng.float(...d.attackInterval);
        }
        break;
    }
  }

  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const t = this.stateTime / this.def.windupTime;
    o.ring(this.tx, this.ty, this.def.patchRadius * (0.5 + 0.5 * t), TELE.fire, telegraphAlpha(t, time));
  }

  onDeath() {
    const fx = this.game.effects;
    this.game.audio.play('sizzle');
    fx.burst(fx.presets.ash, this.x, this.y, 8, 16, 40, 30);
    fx.fireBurst(this.x, this.y);
    this.game.enemies.decal(this.room, 'scorch', this.x, this.y - 2);
  }
}
