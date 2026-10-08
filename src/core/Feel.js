import { FEEL } from '../data/config.js';
import { fxRng } from './Rng.js';

// "Game feel": screen shake (trauma model) and hit-stop (freeze-frames on big hits).

export class Feel {
  constructor() {
    this.trauma = 0;
    this.hitStopTime = 0;
    this.shakeX = 0;
    this.shakeY = 0;
  }

  /** amount 0..1, stacks up to 1 */
  shake(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  /** freeze the simulation for `seconds` (the longest request wins) */
  hitStop(seconds) {
    this.hitStopTime = Math.max(this.hitStopTime, seconds);
  }

  /** Returns true if the simulation should be frozen this frame. */
  update(dt) {
    this.trauma = Math.max(0, this.trauma - FEEL.shakeDecay * dt);
    const s = this.trauma * this.trauma * FEEL.shakeMax;
    // whole pixels only, so the image stays crisp while shaking
    this.shakeX = Math.round((fxRng.next() * 2 - 1) * s);
    this.shakeY = Math.round((fxRng.next() * 2 - 1) * s);

    if (this.hitStopTime > 0) {
      this.hitStopTime -= dt;
      return true;
    }
    return false;
  }
}
