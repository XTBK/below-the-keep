import { Enemy } from '../Enemy.js';
import { BOSSES, BOSS_FX } from '../../data/bosses.js';
import { fxRng } from '../../core/Rng.js';

// Shared boss behaviour: a name and subtitle for the title card and health bar, a second
// phase below `enrageAt` health, and a pause between attacks. Each boss picks its attacks in
// `chooseAttack()`.

export class Boss extends Enemy {
  constructor(game, type, look) {
    super(game, type, type, look, BOSSES[type]);
    this.isBoss = true;
  }

  get name() {
    return this.def.name;
  }

  get subtitle() {
    return this.def.subtitle;
  }

  /** Second phase: below `enrageAt` of its health. */
  get enraged() {
    return this.hp < this.maxHp * this.def.enrageAt;
  }

  get corpseTime() {
    return BOSS_FX.deathTime;
  }

  rest() {
    this.setState('rest');
    this.restFor = fxRng.float(...this.def.restTime) * (this.enraged ? 0.7 : 1);
  }

  /** Bosses barely flinch: they shrug off stuns quickly. */
  stun(time) {
    super.stun(Math.min(time, 0.6));
  }
}
