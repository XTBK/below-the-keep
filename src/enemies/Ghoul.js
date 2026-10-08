import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { depthFor } from '../render/Sprite.js';
import { fxRng } from '../core/Rng.js';

// 5. Ghoul - shambles toward you in lurching steps. Telegraph: throws both arms up (with a groan)
// before a lunging swipe; a red arc shows the swipe. Death: bloats, then bursts into a swarm of
// carrion flies.

const v = { x: 0, y: 0, dist: 0 };
const LURCH = [1.5, 0.3, 1.3, 0.3]; // speed multiplier per walk frame: step, drag, step, drag

export class Ghoul extends Enemy {
  constructor(game) {
    super(game, 'ghoul', 'ghoul', { anchorY: 2, shadow: 1, blood: 'goo' });
  }

  onSpawn() {
    this.setState('walk');
    this.burst = false;
  }

  think() {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'walk': {
        this.anim.play('walk');
        const frame = Math.floor(this.anim.time * 5) % 4;
        this.chase(this.speed * LURCH[frame]);
        this.faceX(v.x);
        if (this.canAct && v.dist < d.swipeRange) {
          this.setState('windup');
          this.angle = Math.atan2(v.y, v.x);
          this.game.audio.play('ghoulGroan');
        }
        break;
      }
      case 'windup':
        this.stop();
        this.anim.play('windup');
        if (this.stateTime >= d.windupTime) {
          this.setState('swipe');
          this.hitDone = false;
          this.game.audio.play('swing', 0.8);
        }
        break;
      case 'swipe': {
        const k = 1 - this.stateTime / d.swipeTime;
        this.vx = Math.cos(this.angle) * d.swipeLunge * k;
        this.vy = Math.sin(this.angle) * d.swipeLunge * k;
        this.anim.play('attack');
        if (!this.hitDone) {
          // the swipe hits a short arc in front of it
          this.toPlayer(v);
          let diff = Math.atan2(v.y, v.x) - this.angle;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          if (v.dist < 28 && Math.abs(diff) < 1.1) {
            this.game.player.hurt(1, this.x, this.y, this.def.name);
            this.hitDone = true;
          }
        }
        if (this.stateTime >= d.swipeTime) this.setState('recover');
        break;
      }
      case 'recover':
        this.stop();
        this.anim.play('idle');
        if (this.stateTime >= d.recoverTime) this.setState('walk');
        break;
    }
  }

  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const t = this.stateTime / this.def.windupTime;
    const z = depthFor(this.y) + 0.001;
    o.arc(this.x, this.y, 26, this.angle - 1.1, this.angle + 1.1, t > 0.75 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time), z, 1);
  }

  onDeath() {
    this.game.audio.play('ghoulGroan', 0.6);
  }

  whileDying() {
    // bloat for a moment, then burst
    if (!this.burst && this.deathTime > 0.16) {
      this.burst = true;
      const fx = this.game.effects;
      this.game.audio.play('splat');
      this.game.feel.shake(0.2);
      fx.burst(fx.presets.goo, this.x, this.y, 10, 22, 110, 120);
      fx.burst(fx.presets.bone, this.x, this.y, 10, 5, 90, 110);
      this.game.enemies.decal(this.room, 'goo', this.x, this.y - 2);
      for (let i = 0; i < this.def.fliesOnDeath; i++) {
        const a = (i / this.def.fliesOnDeath) * Math.PI * 2 + fxRng.float(0, 1);
        this.game.enemies.spawn('fly', this.room, this.x + Math.cos(a) * 8, this.y + Math.sin(a) * 6, { quiet: true, champion: this.champion });
      }
    }
  }
}
