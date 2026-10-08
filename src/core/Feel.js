import { FEEL } from '../data/config.js';
import { fxRng } from './Rng.js';

// "Game feel": screen shake (trauma model) and hit-stop (freeze-frames on big hits).

export class Feel {
  constructor() {
    this.trauma = 0;
    this.hitStopTime = 0;
    this.shakeScale = 1; // Settings: screen shake strength
    this.shakeX = 0;
    this.shakeY = 0;
  }

  /** amount 0..1, stacks up to 1 */
  shake(amount) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  /** slow the world almost to a stop for `seconds` (the longest request wins). A dip into slow
   *  motion rather than a dead freeze, so it reads as weight, never as a stutter. */
  hitStop(seconds) {
    this.hitStopTime = Math.max(this.hitStopTime, seconds);
  }

  /** Returns how fast the world runs this frame (1 = normal). */
  update(dt) {
    this.trauma = Math.max(0, this.trauma - FEEL.shakeDecay * dt);
    const s = this.trauma * this.trauma * FEEL.shakeMax * this.shakeScale;
    // whole pixels only, so the image stays crisp while shaking
    this.shakeX = Math.round((fxRng.next() * 2 - 1) * s);
    this.shakeY = Math.round((fxRng.next() * 2 - 1) * s);

    if (this.hitStopTime > 0) {
      this.hitStopTime -= dt;
      return 0.2;
    }
    return 1;
  }
}
