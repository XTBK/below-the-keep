import * as THREE from 'three';
import { makePointMaterial } from './Particles.js';

// Crisp 1-pixel lines, rings and arcs, rebuilt every frame. Used for attack telegraphs
// (aim lines, target rings, swing arcs) and for things like the prisoner's chain.
//
//   overlay.begin();
//   overlay.line(x0, y0, x1, y1, COLOR, alpha, z, dash);
//   overlay.end();
//
// Colours are linear-space THREE.Colors (made once, never per frame).

export class PixelOverlay {
  constructor(scene, lighting, capacity, { lit = false, additive = true } = {}) {
    this.capacity = capacity;
    this.count = 0;
    this.geometry = new THREE.BufferGeometry();
    this.pos = new Float32Array(capacity * 3);
    this.col = new Float32Array(capacity * 4);
    this.size = new Float32Array(capacity).fill(1);
    this.posAttr = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage);
    this.colAttr = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('pcolor', this.colAttr);
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.size, 1));
    this.geometry.setDrawRange(0, 0);
    this.points = new THREE.Points(this.geometry, makePointMaterial(lighting, lit, additive));
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  begin() {
    this.count = 0;
  }

  /** one pixel at world (x, y) */
  dot(x, y, z, c, a) {
    if (this.count >= this.capacity) return;
    const i = this.count++;
    this.pos[i * 3] = Math.floor(x) + 0.5;
    this.pos[i * 3 + 1] = Math.floor(y) + 0.5;
    this.pos[i * 3 + 2] = z;
    this.col[i * 4] = c.r;
    this.col[i * 4 + 1] = c.g;
    this.col[i * 4 + 2] = c.b;
    this.col[i * 4 + 3] = a;
  }

  /** dash: 0 = solid, n = draw n pixels, skip n pixels */
  line(x0, y0, x1, y1, c, a, z = 3, dash = 0) {
    x0 = Math.floor(x0);
    y0 = Math.floor(y0);
    x1 = Math.floor(x1);
    y1 = Math.floor(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let n = 0;
    for (let guard = 0; guard < 2000; guard++) {
      if (dash === 0 || Math.floor(n / dash) % 2 === 0) this.dot(x0, y0, z, c, a);
      n++;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /** arc of radius r from angle a0 to a1 (radians); squash < 1 flattens it into a floor ellipse */
  arc(x, y, r, a0, a1, c, a, z = 3, squash = 0.75) {
    const steps = Math.max(8, Math.ceil(r * Math.abs(a1 - a0)));
    let lx = null;
    let ly = null;
    for (let i = 0; i <= steps; i++) {
      const t = a0 + ((a1 - a0) * i) / steps;
      const px = Math.floor(x + Math.cos(t) * r);
      const py = Math.floor(y + Math.sin(t) * r * squash);
      if (px !== lx || py !== ly) this.dot(px, py, z, c, a);
      lx = px;
      ly = py;
    }
  }

  ring(x, y, r, c, a, z = 3, squash = 0.75) {
    this.arc(x, y, r, 0, Math.PI * 2, c, a, z, squash);
  }

  end() {
    this.geometry.setDrawRange(0, this.count);
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
  }
}
