import { Sprite, LAYER } from '../render/Sprite.js';

// The way down. Appears when a floor's boss falls; step onto it to descend to the next floor.
// (Or, under a burnt rug, the way down to the Forgotten Vault.)

export class Trapdoor {
  constructor(game, x, y, toVault = false) {
    this.game = game;
    this.toVault = toVault;
    this.x = x;
    this.y = y;
    this.sprite = new Sprite(game.renderer.scene, 'trapdoor', { anchorY: 0 });
    this.sprite.place(x, y - 24, 0, LAYER.floorDecal + 0.02);
    this.armed = false; // you must step off it once before it works (no instant fall when it appears)
  }

  update() {
    const pl = this.game.player;
    const d = Math.hypot(pl.x - this.x, pl.y - (this.y + 2));
    if (d > 26) this.armed = true;
    if (this.armed && d < 12 && !pl.dead && this.game.state === 'play') this.game.descend(this.toVault);
  }

  dispose() {
    this.sprite.dispose(this.game.renderer.scene);
  }
}
