import { Sprite, LAYER } from '../render/Sprite.js';
import { fxRng } from '../core/Rng.js';

// Splats left on the floor (blood, goo, scorch marks). A fixed ring of sprites: when they run out,
// the oldest splat is reused. They belong to a room and vanish when you leave it.

const CAPACITY = 48;
const FRAME = { blood: [0, 1], goo: [2, 2], scorch: [3, 3] };

export class Decals {
  constructor(game) {
    this.game = game;
    this.items = [];
    for (let i = 0; i < CAPACITY; i++) {
      const s = new Sprite(game.renderer.scene, 'splats', { anchorY: 8 });
      s.visible = false;
      this.items.push({ sprite: s, room: null });
    }
    this.next = 0;
  }

  add(room, kind, x, y) {
    const d = this.items[this.next];
    // every decal gets its own tiny depth so overlapping splats never flicker
    const z = LAYER.floorDecal + 0.05 + this.next * 0.0005;
    this.next = (this.next + 1) % CAPACITY;
    const [a, b] = FRAME[kind];
    d.sprite.setFrame(fxRng.int(a, b), 0);
    d.sprite.place(x, y, 0, z);
    d.sprite.visible = true;
    d.room = room;
  }

  clearRoom(room) {
    for (const d of this.items) {
      if (d.room !== room) continue;
      d.sprite.visible = false;
      d.room = null;
    }
  }

  reassign(oldRoom, newRoom) {
    for (const d of this.items) if (d.room === oldRoom) d.room = newRoom;
  }

  clearAll() {
    for (const d of this.items) {
      d.sprite.visible = false;
      d.room = null;
    }
  }
}
