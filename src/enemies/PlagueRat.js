import { Enemy } from './Enemy.js';
import { fxRng } from '../core/Rng.js';

// 1. Plague Rat - scurries erratically in packs. Telegraph: rears up (with a squeak) before a
// short lunging bite. Touching it also hurts. Death: flips over in a little pool of blood.

const v = { x: 0, y: 0, dist: 0 };
const nav = { x: 0, y: 0 };

export class PlagueRat extends Enemy {
  constructor(game) {
    super(game, 'rat', 'rat', { anchorY: 2, shadow: 0, blood: 'blood' });
  }

  onSpawn() {
    this.setState('scurry');
    this.heading = fxRng.float(0, Math.PI * 2);
    this.jitter = 0;
    this.biteCd = fxRng.float(...this.def.biteCooldown);
  }

  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'scurry': {
        this.jitter -= dt;
        if (this.jitter <= 0) {
          // head roughly toward Wren, but never in a straight line
          this.jitter = fxRng.float(...d.jitterTime);
          this.room.nav.dirTo(this.x, this.y, nav);
          this.heading = Math.atan2(nav.y, nav.x) + fxRng.float(-d.jitterAngle, d.jitterAngle);
        }
        this.vx = Math.cos(this.heading) * this.speed;
        this.vy = Math.sin(this.heading) * this.speed;
        this.faceX(this.vx);
        this.anim.play('walk');
        this.biteCd -= dt;
        if (this.canAct && this.biteCd <= 0 && v.dist < d.biteRange && this.canSeePlayer()) {
          this.setState('rear');
          this.stop();
          this.game.audio.play('ratSqueak', 0.7);
        }
        break;
      }
      case 'rear':
        this.stop();
        this.faceX(v.x);
        this.anim.play('windup');
        if (this.stateTime >= d.rearTime) {
          this.setState('bite');
          this.biteX = v.x / v.dist;
          this.biteY = v.y / v.dist;
          this.game.audio.play('ratBite');
        }
        break;
      case 'bite':
        this.vx = this.biteX * d.biteSpeed;
        this.vy = this.biteY * d.biteSpeed;
        this.anim.play('attack');
        if (this.stateTime >= d.biteTime) {
          this.setState('scurry');
          this.biteCd = fxRng.float(...d.biteCooldown);
          this.jitter = 0;
        }
        break;
    }
  }

  onDeath() {
    this.game.audio.play('ratDie', 0.8);
    this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 4, 8, 60, 60);
    this.game.enemies.decal(this.room, 'blood', this.x, this.y - 2);
  }
}
