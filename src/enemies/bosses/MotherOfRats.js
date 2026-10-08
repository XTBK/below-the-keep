import { Boss } from './Boss.js';
import { TELE, telegraphAlpha } from '../telegraph.js';
import { fxRng } from '../../core/Rng.js';

// Floor 1 boss: MOTHER OF RATS. Three attacks, each telegraphed:
//  1. Gnashing Charge - crouches low while three red lines show her path, then charges until she
//     slams into a wall and is dazed (free hits!). Enraged: charges twice in a row.
//  2. Brood Call - rears up squealing, belly swelling, and births a pack of plague rats.
//  3. Plague Spit - rears her head back (a fan of red lines shows the spread), spits a fan of globs.

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };

export class MotherOfRats extends Boss {
  constructor(game) {
    super(game, 'ratmother', { anchorY: 4, shadow: 3, blood: 'blood' });
  }

  onSpawn() {
    this.grace = 0;
    this.rest();
  }

  _ratsAlive() {
    let n = 0;
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e.type === 'rat') n++;
    });
    return n;
  }

  _chooseAttack() {
    const d = this.def;
    this.toPlayer(v);
    const canBrood = this._ratsAlive() < d.maxRats;
    const r = fxRng.next();
    if (r < 0.42) this._startCharge(this.enraged ? 2 : 1);
    else if (r < 0.7 && canBrood) {
      this.setState('broodWindup');
      this.game.audio.play('ratSqueak', 1);
      this.game.audio.play('roar', 0.6);
    } else {
      this.setState('spitWindup');
      this.aim = Math.atan2(v.y, v.x);
    }
  }

  _startCharge(count) {
    this.toPlayer(v);
    this.chargesLeft = count;
    this.cx = v.x / v.dist;
    this.cy = v.y / v.dist;
    this.faceX(v.x);
    this.setState('chargeWindup');
    this.game.audio.play('ratSqueak', 1);
  }

  think() {
    const d = this.def;
    const speedMult = this.enraged ? d.enrageSpeed : 1;
    this.toPlayer(v);
    switch (this.state) {
      case 'rest':
        this.chase(this.speed * 0.7 * speedMult);
        this.faceX(v.x);
        this.anim.play('walk');
        if (this.stateTime >= this.restFor) this._chooseAttack();
        break;
      case 'chargeWindup':
        this.stop();
        this.anim.play('chargeWindup');
        if (this.stateTime >= d.chargeWindup / speedMult) {
          this.setState('charge');
          this.lastX = this.x;
          this.lastY = this.y;
          this.game.audio.play('swing');
        }
        break;
      case 'charge': {
        this.vx = this.cx * d.chargeSpeed * speedMult;
        this.vy = this.cy * d.chargeSpeed * speedMult;
        this.anim.play('charge');
        // crashed into something? (she barely moved last frame)
        const moved = Math.hypot(this.x - this.lastX, this.y - this.lastY);
        this.lastX = this.x;
        this.lastY = this.y;
        if (this.stateTime > 0.15 && moved < 1) {
          this.setState('dazed');
          this.stop();
          this.game.audio.play('thud');
          this.game.feel.shake(0.5);
          this.game.effects.landDust(this.x + this.cx * 20, this.y, 18);
          this.chargesLeft--;
        }
        if (this.stateTime > 3) this.setState('dazed');
        break;
      }
      case 'dazed':
        this.stop();
        this.anim.play('dazed');
        if (this.stateTime >= (this.chargesLeft > 0 ? 0.35 : d.chargeStun)) {
          if (this.chargesLeft > 0) this._startCharge(this.chargesLeft);
          else this.rest();
        }
        break;
      case 'broodWindup':
        this.stop();
        this.anim.play('brood');
        if (this.stateTime >= d.broodWindup) {
          for (let i = 0; i < d.broodCount; i++) {
            const a = (i / d.broodCount) * Math.PI * 2;
            this.game.enemies.spawn('rat', this.room, this.x + Math.cos(a) * 26, this.y + Math.sin(a) * 14);
          }
          this.game.effects.burst(this.game.effects.presets.blood, this.x, this.y, 8, 14, 80, 60);
          this.rest();
        }
        break;
      case 'spitWindup':
        this.stop();
        this.faceX(Math.cos(this.aim));
        this.anim.play('spit');
        if (this.stateTime >= d.spitWindup) {
          const n = d.spitCount;
          for (let i = 0; i < n; i++) {
            const a = this.aim - d.spitSpread / 2 + (d.spitSpread * i) / (n - 1);
            this.game.enemies.shots.fireOrb(this.x + this.facing * 26, this.y, 14, Math.cos(a), Math.sin(a), d.spitSpeed, 0, 1, this.def.name);
          }
          this.game.audio.play('splat', 0.6);
          this.rest();
        }
        break;
    }
  }

  drawOverlay(o, time) {
    const d = this.def;
    if (this.state === 'chargeWindup') {
      const t = this.stateTime / d.chargeWindup;
      const c = t > 0.75 ? TELE.dangerHot : TELE.danger;
      const a = telegraphAlpha(t, time);
      const px = -this.cy;
      const py = this.cx;
      for (const off of [-14, 0, 14]) {
        const sx = this.x + px * off;
        const sy = this.y + py * off;
        this.room.nav.raycast(sx, sy, this.cx, this.cy, 600, end);
        o.line(sx, sy, end.x, end.y, c, a, 3, off === 0 ? 0 : 3);
      }
    } else if (this.state === 'spitWindup') {
      const t = this.stateTime / d.spitWindup;
      for (let i = 0; i < d.spitCount; i++) {
        const a = this.aim - d.spitSpread / 2 + (d.spitSpread * i) / (d.spitCount - 1);
        o.line(this.x + this.facing * 26, this.y, this.x + Math.cos(a) * 70, this.y + Math.sin(a) * 70, TELE.danger, telegraphAlpha(t, time) * 0.7, 3, 2);
      }
    }
  }

  onDeath() {
    const fx = this.game.effects;
    this.game.audio.play('roar', 1);
    this.game.audio.play('splat');
    this.game.feel.shake(0.8);
    fx.burst(fx.presets.blood, this.x, this.y, 12, 40, 160, 160);
    for (let i = 0; i < 4; i++) this.game.enemies.decal(this.room, 'blood', this.x + fxRng.float(-24, 24), this.y + fxRng.float(-8, 8));
    // her brood dies with her
    this.game.enemies.forEachAlive(this.room, (e) => {
      if (e.type === 'rat') e.die();
    });
  }
}
