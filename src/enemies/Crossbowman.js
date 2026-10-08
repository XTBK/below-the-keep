import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { fxRng } from '../core/Rng.js';

// 6. Crossbowman - repositions, stops, and takes aim: a red line tracks you (telegraph), then
// locks in place and flashes - move! - and a fast bolt flies down it. Then he cranks the string
// back. Death: armour and crossbow clatter to the floor.

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };
const MUZZLE_H = 18;

export class Crossbowman extends Enemy {
  constructor(game) {
    super(game, 'crossbowman', 'crossbowman', { anchorY: 2, shadow: 1, blood: 'iron' });
  }

  onSpawn() {
    this.setState('reposition');
    this.moveTime = fxRng.float(...this.def.repositionTime);
    this._pickSpot();
    this.aimX = 1;
    this.aimY = 0;
  }

  /** Somewhere walkable, at a good range from Wren. */
  _pickSpot() {
    const p = this.game.player;
    const [near, far] = this.def.preferredRange;
    for (let i = 0; i < 12; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      const r = fxRng.float(near, far);
      const x = p.x + Math.cos(a) * r;
      const y = p.y + Math.sin(a) * r;
      const b = this.room.bounds;
      if (x < b.x0 + 12 || x > b.x1 - 12 || y < b.y0 + 12 || y > b.y1 - 12) continue;
      if (!this.room.nav.isWalkable(x, y)) continue;
      this.sx = x;
      this.sy = y;
      return;
    }
    this.sx = this.x;
    this.sy = this.y;
  }

  /** where the bolt leaves the crossbow (x in world space; it flies at MUZZLE_H above the floor) */
  get muzzleX() {
    return this.x + this.facing * 12;
  }

  think() {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'reposition': {
        const left = this.walkTo(this.sx, this.sy, this.speed);
        this.faceX(left > 2 ? this.vx : v.x);
        this.anim.play(left > 2 ? 'walk' : 'idle');
        if ((left < 3 || this.stateTime > this.moveTime) && this.canAct) {
          if (this.canSeePlayer()) {
            this.setState('aim');
            this.game.audio.play('crossbowClick', 0.7);
          } else {
            this._pickSpot();
            this.stateTime = 0;
          }
        }
        break;
      }
      case 'aim':
        this.stop();
        this.faceX(v.x);
        this.aimX = v.x / v.dist;
        this.aimY = v.y / v.dist;
        this.anim.play('aim');
        if (this.stateTime >= d.aimTime) {
          this.setState('lock');
          this.game.audio.play('crossbowClick');
        }
        break;
      case 'lock':
        this.anim.play('aim');
        if (this.stateTime >= d.lockTime) {
          this.game.enemies.shots.fireBolt(this.muzzleX, this.y, MUZZLE_H, this.aimX, this.aimY, d.boltSpeed, d.boltDamage);
          this.game.audio.play('crossbowFire');
          this.setState('fired');
        }
        break;
      case 'fired':
        this.anim.play('attack');
        if (this.stateTime >= 0.2) {
          this.setState('reload');
          this.game.audio.play('crank');
        }
        break;
      case 'reload':
        this.anim.play('reload');
        if (this.stateTime >= d.reloadTime) {
          this.setState('reposition');
          this.moveTime = fxRng.float(...d.repositionTime);
          this._pickSpot();
        }
        break;
    }
  }

  drawOverlay(o, time) {
    if (this.state !== 'aim' && this.state !== 'lock') return;
    const mx = this.muzzleX;
    this.room.nav.raycast(mx, this.y, this.aimX, this.aimY, 420, end);
    if (this.state === 'aim') {
      const t = this.stateTime / this.def.aimTime;
      o.line(mx, this.y + MUZZLE_H - 2, end.x, end.y + 6, TELE.danger, telegraphAlpha(t * 0.7, time), 3, 3);
    } else {
      const on = Math.floor(this.stateTime * 30) % 2 === 0;
      o.line(mx, this.y + MUZZLE_H - 2, end.x, end.y + 6, on ? TELE.dangerHot : TELE.danger, 1, 3, 0);
    }
  }

  onDeath() {
    const fx = this.game.effects;
    this.game.audio.play('clatter');
    this.game.feel.shake(0.25);
    fx.clatter(this.x, this.y);
    this.game.enemies.decal(this.room, 'blood', this.x - 3, this.y - 3);
  }
}
