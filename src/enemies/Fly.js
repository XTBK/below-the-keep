import { Enemy } from './Enemy.js';
import { fxRng } from '../core/Rng.js';

// Carrion Fly - bursts out of dead ghouls. Buzzes toward you in a wobbly line and hurts on
// contact; one or two stones swat it. Flies over pits.

const v = { x: 0, y: 0, dist: 0 };

export class Fly extends Enemy {
  constructor(game) {
    super(game, 'fly', 'fly', { anchorY: 0, shadow: 0, blood: 'blood' });
  }

  onSpawn() {
    this.phase = fxRng.float(0, Math.PI * 2);
    this.grace = 0.35;
    this.h = 12;
  }

  think() {
    this.toPlayer(v);
    const nx = v.x / v.dist;
    const ny = v.y / v.dist;
    const wobble = Math.sin(this.time * 9 + this.phase) * this.def.wobble;
    const speed = this.canAct ? this.speed : this.speed * 0.3;
    this.vx = nx * speed - ny * wobble;
    this.vy = ny * speed + nx * wobble;
    this.h = 12 + Math.sin(this.time * 6 + this.phase) * 3;
    this.anim.play('idle');
  }

  get corpseTime() {
    return 0;
  }

  onDeath() {
    const fx = this.game.effects;
    fx.burst(fx.presets.blood, this.x, this.y, this.h, 4, 40, 30);
    this.sprite.visible = false;
  }
}
