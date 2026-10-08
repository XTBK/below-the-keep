import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { depthFor } from '../render/Sprite.js';

// 2. Gaoler - a fat jailer who plods after you. Telegraph: raises his key ring with a jangle, and a
// red arc shows exactly where the swing will land. Death: collapses face-down, keys flung aside.

const v = { x: 0, y: 0, dist: 0 };

export class Gaoler extends Enemy {
  constructor(game) {
    super(game, 'gaoler', 'gaoler', { anchorY: 2, shadow: 3, blood: 'blood' });
  }

  onSpawn() {
    this.setState('walk');
  }

  think() {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'walk':
        this.chase(this.speed);
        this.faceX(v.x);
        this.anim.play('walk');
        if (this.canAct && v.dist < d.swingRange) {
          this.setState('windup');
          this.swingAngle = Math.atan2(v.y, v.x); // the swing direction is decided now
          this.faceX(v.x);
          this.game.audio.play('keyJangle');
        }
        break;
      case 'windup':
        this.stop();
        this.anim.play('windup');
        if (this.stateTime >= d.windupTime) {
          this.setState('swing');
          this.game.audio.play('swing');
          this._resolveSwing();
        }
        break;
      case 'swing':
        // a small step into the swing
        this.vx = Math.cos(this.swingAngle) * 40;
        this.vy = Math.sin(this.swingAngle) * 40;
        this.anim.play('attack');
        if (this.stateTime >= d.swingTime) this.setState('recover');
        break;
      case 'recover':
        this.stop();
        this.anim.play('idle');
        if (this.stateTime >= d.recoverTime) this.setState('walk');
        break;
    }
  }

  _resolveSwing() {
    const d = this.def;
    this.toPlayer(v);
    if (v.dist > d.swingReach + 6) return;
    let diff = Math.atan2(v.y, v.x) - this.swingAngle;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    if (Math.abs(diff) <= d.swingArc) this.game.player.hurt(1, this.x, this.y, this.def.name);
  }

  drawOverlay(o, time) {
    if (this.state !== 'windup') return;
    const d = this.def;
    const t = this.stateTime / d.windupTime;
    const c = t > 0.75 ? TELE.dangerHot : TELE.danger;
    const a = telegraphAlpha(t, time);
    const z = depthFor(this.y) + 0.001;
    const a0 = this.swingAngle - d.swingArc;
    const a1 = this.swingAngle + d.swingArc;
    o.arc(this.x, this.y, d.swingReach, a0, a1, c, a, z, 1);
    o.line(this.x, this.y, this.x + Math.cos(a0) * d.swingReach, this.y + Math.sin(a0) * d.swingReach, c, a * 0.5, z, 2);
    o.line(this.x, this.y, this.x + Math.cos(a1) * d.swingReach, this.y + Math.sin(a1) * d.swingReach, c, a * 0.5, z, 2);
  }

  onDeath() {
    const fx = this.game.effects;
    this.game.audio.play('thud');
    this.game.audio.play('keyJangle', 0.8);
    this.game.feel.shake(0.35);
    fx.burst(fx.presets.ironBit, this.x + 8, this.y, 14, 6, 90, 120); // keys scatter
    fx.burst(fx.presets.blood, this.x, this.y, 10, 10, 70, 70);
    this.game.enemies.decal(this.room, 'blood', this.x, this.y - 4);
  }
}
