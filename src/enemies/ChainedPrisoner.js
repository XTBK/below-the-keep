import { Enemy } from './Enemy.js';
import { Sprite, LAYER, depthFor } from '../render/Sprite.js';
import { TELE } from './telegraph.js';
import { fxRng } from '../core/Rng.js';

// 3. Chained Prisoner - shackled to an iron ring in the floor. When he can see you he crouches
// (telegraph: the chain rattles and he trembles), then lunges. His chain stops him dead at its full
// length, so keep your distance. Death: collapses; the chain falls slack.

const v = { x: 0, y: 0, dist: 0 };

export class ChainedPrisoner extends Enemy {
  constructor(game) {
    super(game, 'prisoner', 'prisoner', { anchorY: 2, shadow: 1, blood: 'blood' });
    this.anchorSprite = new Sprite(game.renderer.scene, 'chain_anchor', { anchorY: 0 });
    this.anchorSprite.visible = false;
  }

  onSpawn() {
    this.ax = this.x; // the ring he's chained to
    this.ay = this.y;
    this.anchorSprite.place(this.ax, this.ay - 8, 0, LAYER.floorDecal + 0.01);
    this.anchorSprite.visible = true;
    this.setState('idle');
    this.cooldown = fxRng.float(...this.def.cooldown);
    this._pickWander();
  }

  _pickWander() {
    const a = fxRng.float(0, Math.PI * 2);
    const r = fxRng.float(8, 36);
    this.wx = this.ax + Math.cos(a) * r;
    this.wy = this.ay + Math.sin(a) * r;
  }

  think(dt) {
    const d = this.def;
    this.toPlayer(v);
    switch (this.state) {
      case 'idle': {
        // shuffle about near the ring
        const left = this.walkTo(this.wx, this.wy, this.speed * 0.6);
        if (left < 3 || this.stateTime > 2.5) {
          this._pickWander();
          this.stateTime = 0;
        }
        this.faceX(left > 3 ? this.vx : v.x);
        this.anim.play(left > 3 ? 'walk' : 'idle');
        this.cooldown -= dt;
        const reachable = Math.hypot(this.game.player.x - this.ax, this.game.player.y - this.ay) < d.chainLength + 50;
        if (this.canAct && this.cooldown <= 0 && v.dist < d.sightRange && reachable && this.canSeePlayer()) {
          this.setState('windup');
          this.game.audio.play('chainRattle');
        }
        break;
      }
      case 'windup':
        this.stop();
        this.faceX(v.x);
        this.anim.play('windup');
        if (this.stateTime >= d.windupTime) {
          this.lx = v.x / v.dist;
          this.ly = v.y / v.dist;
          this.faceX(v.x);
          this.setState('lunge');
          this.game.audio.play('swing');
        }
        break;
      case 'lunge':
        this.vx = this.lx * d.lungeSpeed;
        this.vy = this.ly * d.lungeSpeed;
        this.anim.play('attack');
        if (this.stateTime >= d.lungeTime) this.setState('recover');
        break;
      case 'recover':
        this.stop();
        this.anim.play('idle');
        if (this.stateTime >= d.recoverTime) {
          this.setState('idle');
          this.cooldown = fxRng.float(...d.cooldown);
          this._pickWander();
        }
        break;
    }
  }

  move(dt) {
    super.move(dt);
    // the chain: never further than its length from the ring
    const d = this.def;
    const dx = this.x - this.ax;
    const dy = this.y - this.ay;
    const dist = Math.hypot(dx, dy);
    if (dist > d.chainLength) {
      this.x = this.ax + (dx / dist) * d.chainLength;
      this.y = this.ay + (dy / dist) * d.chainLength;
      if (this.state === 'lunge') {
        // yanked to a stop
        this.setState('recover');
        this.stop();
        this.kbx = this.kby = 0;
        this.game.audio.play('chainYank');
        this.game.feel.shake(0.12);
        this.game.effects.landDust(this.x, this.y, 8);
      }
    }
  }

  sync() {
    super.sync();
    // tremble while winding up
    if (this.state === 'windup' && !this.dying) this.sprite.mesh.position.x += Math.round(Math.sin(this.time * 60));
  }

  drawOverlay(tele, time, solid) {
    // the chain, drawn live from the floor ring to his collar, sagging when slack
    const cx = this.x + this.facing * 2;
    const cy = this.y + (this.dying ? 2 : 18);
    const dx = cx - this.ax;
    const dy = cy - this.ay;
    const len = Math.hypot(dx, dy);
    const slack = Math.max(0, 1 - len / this.def.chainLength);
    const sag = 4 + slack * 16;
    const steps = Math.max(2, Math.ceil(len / 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = this.ax + dx * t;
      const y = this.ay + dy * t - Math.sin(t * Math.PI) * sag;
      const groundY = this.ay + (this.y - this.ay) * t;
      solid.dot(x, y, depthFor(groundY), i % 2 === 0 ? TELE.chainLight : TELE.chainDark, 1);
    }
  }

  onDeath() {
    const fx = this.game.effects;
    this.game.audio.play('chainRattle');
    this.game.audio.play('thud', 0.5);
    fx.burst(fx.presets.blood, this.x, this.y, 8, 8, 60, 60);
    this.game.enemies.decal(this.room, 'blood', this.x, this.y - 3);
  }

  get corpseTime() {
    return 3; // he slumps against his chain a little longer
  }

  onRelease() {
    this.anchorSprite.visible = false;
  }
}
