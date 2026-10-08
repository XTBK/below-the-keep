import * as THREE from 'three';
import { glyphPixels } from './PixelFont.js';

// Little pixel numbers that pop up from a struck enemy and float away. White for a normal hit,
// big and gold for a critical one. Drawn on the glowing telegraph overlay, so they read anywhere.

const WHITE = new THREE.Color(1.6, 1.55, 1.45);
const GOLD = new THREE.Color(2.4, 1.8, 0.5);

export class DamageNumbers {
  constructor() {
    this.list = [];
    for (let i = 0; i < 32; i++) this.list.push({ t: 0, x: 0, y: 0, text: '', crit: false, dx: 0 });
    this.next = 0;
  }

  add(x, y, amount, crit) {
    const n = this.list[this.next];
    this.next = (this.next + 1) % this.list.length;
    n.t = crit ? 0.9 : 0.6;
    n.x = x;
    n.y = y;
    n.crit = crit;
    n.dx = (Math.random() - 0.5) * 14;
    n.text = amount >= 10 ? String(Math.round(amount)) : String(Math.round(amount * 10) / 10);
  }

  update(dt) {
    for (const n of this.list) if (n.t > 0) n.t -= dt;
  }

  draw(o) {
    for (const n of this.list) {
      if (n.t <= 0) continue;
      const life = n.crit ? 0.9 : 0.6;
      const k = 1 - n.t / life;
      const rise = 22 + Math.sqrt(k) * 18;
      const x0 = Math.round(n.x + n.dx * k - (n.text.length * 6 - 1) / 2);
      const y0 = Math.round(n.y + rise);
      const a = Math.min(1, n.t * 4);
      const c = n.crit ? GOLD : WHITE;
      if (n.crit) {
        // crits are drawn twice as big
        glyphPixels(n.text, (px, py) => {
          for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) o.dot(x0 - n.text.length * 3 + px * 2 + ox, y0 + 6 - py * 2 - oy, 3, c, a);
        });
      } else glyphPixels(n.text, (px, py) => o.dot(x0 + px, y0 - py, 3, c, a));
    }
  }

  clear() {
    for (const n of this.list) n.t = 0;
  }
}
