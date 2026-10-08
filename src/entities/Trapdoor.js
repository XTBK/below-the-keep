import { Sprite, LAYER } from '../render/Sprite.js';

// The way down: a stairway that grinds open out of the floor when a floor's boss falls (two slabs
// crack and slide apart). Step onto the steps once they're open to descend to the next floor.
// (Or, under a burnt rug, the way down to the Forgotten Vault.) The Gatehouse's stair is open already.

const OPEN_TIME = 1.3; // seconds for the slabs to slide apart
const FRAMES = 8;

export class Trapdoor {
  constructor(game, x, y, toVault = false, alreadyOpen = false) {
    this.game = game;
    this.toVault = toVault;
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(game.renderer.scene, 'stairway', { anchorY: 0 });
    this.sprite.place(x, y - 24, 0, LAYER.floorDecal + 0.02);
    this.openT = alreadyOpen ? OPEN_TIME : 0;
    this.sprite.setFrame(alreadyOpen ? FRAMES - 1 : 0, 0);
    if (!alreadyOpen) {
      game.audio.play('stairOpen');
      game.feel.shake(0.12);
      game.effects.landDust(x, y, 6);
    }
    this.armed = false; // you must step off it once before it works (no instant fall when it appears)
  }

  get open() {
    return this.openT >= OPEN_TIME;
  }

  update(dt = 1 / 60) {
    if (!this.open) {
      this.openT += dt;
      this.sprite.setFrame(Math.min(FRAMES - 1, Math.floor((this.openT / OPEN_TIME) * (FRAMES - 1))), 0);
      if (this.open) {
        this.game.audio.play('thud', 0.6);
        this.game.effects.landDust(this.x, this.y, 10);
      }
      return;
    }
    const pl = this.game.player;
    const d = Math.hypot(pl.x - this.x, pl.y - (this.y + 2));
    if (d > 26) this.armed = true;
    if (this.armed && d < 12 && !pl.dead && this.game.state === 'play') this.game.descend(this.toVault);
  }

  dispose() {
    this.sprite.dispose(this.game.renderer.scene);
  }
}
