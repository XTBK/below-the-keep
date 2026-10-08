import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { ENEMY_FX } from '../data/enemies.js';

// 7. Barrel Mimic - looks EXACTLY like a barrel (same sprite, same shadow, blocks you like a barrel)
// until you come close or shoot it. Then its lid creaks open and it hops after you.
// Telegraph: it squashes down before every hop, and a red ring shows where it will land.
// Death: bursts into splinters and green goo.

const v = { x: 0, y: 0, dist: 0 };

export class BarrelMimic extends Enemy {
  constructor(game) {
    super(game, 'mimic', 'mimic', { anchorY: 2, shadow: 2, blood: 'goo' });
  }

  onSpawn() {
    this.setState('dormant');
    this.anim.play('dormant', true);
    this.facing = 1; // the dormant frame must face the same way as every real barrel
    this.grace = 0;
    this.shadowOffset = 4; // same shadow placement as a real barrel
    // no glow, no champion tint: while asleep it must be indistinguishable from a barrel
    this.sprite.material.emissive.setRGB(0, 0, 0);
    this.hideTint = true;
    // while asleep it is a solid obstacle, exactly like a barrel
    const r = 10;
    this.solid = { x0: this.x - r, x1: this.x + r, y0: this.y - 2, y1: this.y + 12, owner: this };
    this.room.solids.push(this.solid);
  }

  _wake() {
    if (this.state !== 'dormant') return;
    this.room.removeSolid(this.solid);
    this.sprite.material.emissive.setHex(ENEMY_FX.selfLight);
    this.hideTint = false;
    this.setState('wake');
    this.anim.play('wake', true);
    this.game.audio.play('mimicCreak');
  }

  get touchDamage() {
    // a sleeping mimic is just a barrel, and it can't bite you while it's in the air
    return this.state === 'dormant' || this.h > 4 ? 0 : this.def.contactDamage;
  }

  hit(damage, dx, dy, quiet) {
    this._wake();
    return super.hit(damage, dx, dy, quiet);
  }

  think() {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'dormant':
        this.stop();
        if (v.dist < d.wakeRange) this._wake();
        break;
      case 'wake':
        this.faceX(v.x);
        if (this.stateTime >= d.wakeTime) this._startCrouch();
        break;
      case 'crouch':
        this.anim.play('crouch');
        if (this.stateTime >= d.crouchTime) {
          this.setState('hop');
          this.anim.play('air');
          this.game.audio.play('hop');
        }
        break;
      case 'hop': {
        const k = Math.min(1, this.stateTime / d.hopTime);
        this.x = this.fromX + (this.toX - this.fromX) * k;
        this.y = this.fromY + (this.toY - this.fromY) * k;
        this.h = 4 * d.hopHeight * k * (1 - k);
        if (k >= 1) {
          this.h = 0;
          this.setState('land');
          this.anim.play('land');
          this.game.audio.play('mimicChomp');
          this.game.feel.shake(0.12);
          this.game.effects.landDust(this.x, this.y, 12);
          this.toPlayer(v);
          if (v.dist < d.landRadius + 6) this.game.player.hurt(1, this.x, this.y, this.def.name);
        }
        break;
      }
      case 'land':
        if (this.stateTime >= d.restTime) this._startCrouch();
        break;
    }
  }

  _startCrouch() {
    const d = this.def;
    this.toPlayer(v);
    this.faceX(v.x);
    const hop = Math.min(d.hopDistance, v.dist);
    this.fromX = this.x;
    this.fromY = this.y;
    this.toX = this.x + (v.x / v.dist) * hop;
    this.toY = this.y + (v.y / v.dist) * hop;
    const b = this.room.bounds;
    this.toX = Math.max(b.x0 + 10, Math.min(b.x1 - 10, this.toX));
    this.toY = Math.max(b.y0 + 10, Math.min(b.y1 - 10, this.toY));
    this.setState('crouch');
  }

  move(dt) {
    // hops are scripted; only knockback and collisions apply on top
    if (this.state !== 'hop') super.move(dt);
    else if (this.toX !== undefined) this.collide();
  }

  drawOverlay(o, time) {
    if (this.state !== 'crouch' && this.state !== 'hop') return;
    const t = this.state === 'crouch' ? this.stateTime / this.def.crouchTime : 1;
    o.ring(this.toX, this.toY, this.def.landRadius, t >= 1 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t, time));
  }

  onDeath() {
    const fx = this.game.effects;
    if (this.state === 'dormant') this.room.removeSolid(this.solid);
    this.game.audio.play('woodBreak');
    this.game.audio.play('splat', 0.6);
    this.game.feel.shake(0.3);
    fx.barrelBreak(this.x, this.y + 4);
    fx.burst(fx.presets.goo, this.x, this.y, 10, 14, 90, 90);
    this.game.enemies.decal(this.room, 'goo', this.x, this.y - 2);
  }

  onRelease() {
    if (this.room && this.state === 'dormant') this.room.removeSolid(this.solid);
  }
}
