import * as THREE from 'three';
import { LIGHTING } from '../data/config.js';
import { fxRng } from '../core/Rng.js';

// A fixed pool of point lights. The number of lights in the scene NEVER changes, so the GPU
// shaders compile once and never stutter. Unused lights simply have intensity 0.
//
// Brightness is a friendly number: 1.0 means "a surface directly under the light shows its
// full colour". It is converted to Three.js physical intensity here.

function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/** smooth 1D value noise in [0, 1] */
function noise1(t) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hash(i) * (1 - u) + hash(i + 1) * u;
}

export class Lighting {
  constructor(scene, ambient) {
    this.size = LIGHTING.poolSize;
    this.slots = [];
    // flat arrays the particle shader reads to light dust with the same lights
    this.particlePos = new Float32Array(this.size * 4); // x, y, height, radius
    this.particleCol = new Float32Array(this.size * 3); // linear rgb * brightness

    for (let i = 0; i < this.size; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 0, LIGHTING.decay);
      light.position.set(-1000, -1000, 10);
      scene.add(light);
      this.slots.push({
        light,
        active: false,
        x: 0,
        y: 0,
        height: 30,
        radius: 100,
        brightness: 1,
        flicker: 0,
        flickerSpeed: 8,
        phase: 0,
        color: new THREE.Color(),
        currentBrightness: 0,
      });
    }
    this.ambient = new THREE.AmbientLight(ambient.color, ambient.level * Math.PI);
    scene.add(this.ambient);
    this.ambientLinear = new THREE.Color(ambient.color).multiplyScalar(ambient.level);
  }

  /** A new floor, a new mood: { color, level }. */
  setAmbient(ambient) {
    this.ambient.color.set(ambient.color);
    this.ambient.intensity = ambient.level * Math.PI;
    this.ambientLinear.set(ambient.color).multiplyScalar(ambient.level);
    this._warned = false;
  }

  /** opts: { x, y, height, radius, brightness, color, flicker, flickerSpeed } (see LIGHTING presets) */
  add(opts) {
    const s = this.slots.find((sl) => !sl.active);
    if (!s) {
      if (!this._warned) console.warn('Light pool full - raise LIGHTING.poolSize in src/data/config.js');
      this._warned = true;
      return null;
    }
    s.active = true;
    s.x = opts.x;
    s.y = opts.y;
    s.height = opts.height;
    s.radius = opts.radius;
    s.brightness = opts.brightness;
    s.flicker = opts.flicker ?? 0;
    s.flickerSpeed = opts.flickerSpeed ?? 8;
    s.phase = fxRng.float(0, 1000);
    s.color.set(opts.color ?? 0xffffff);
    s.light.distance = opts.radius;
    return s;
  }

  remove(slot) {
    if (!slot) return;
    slot.active = false;
    slot.light.intensity = 0;
    slot.light.position.set(-1000, -1000, 10);
  }

  removeAll() {
    for (const s of this.slots) this.remove(s);
  }

  update(time) {
    const jitter = LIGHTING.jitterPixels;
    for (let i = 0; i < this.size; i++) {
      const s = this.slots[i];
      const pi = i * 4;
      const ci = i * 3;
      if (!s.active) {
        this.particleCol[ci] = this.particleCol[ci + 1] = this.particleCol[ci + 2] = 0;
        continue;
      }
      const t = time * s.flickerSpeed + s.phase;
      // two octaves of noise + a rare deeper gutter
      const n = noise1(t) * 0.65 + noise1(t * 2.3 + 17) * 0.35;
      const b = s.brightness * (1 - s.flicker * n);
      s.currentBrightness = b;
      const jx = (noise1(t * 0.7 + 31) - 0.5) * 2 * jitter * (s.flicker > 0 ? 1 : 0);
      const jy = (noise1(t * 0.6 + 77) - 0.5) * 2 * jitter * (s.flicker > 0 ? 1 : 0);
      s.light.position.set(s.x + jx, s.y + jy, s.height);
      s.light.intensity = b * Math.PI * Math.pow(s.height, LIGHTING.decay);
      // flames get slightly redder as they dip
      const warm = 1 - 0.12 * n * (s.flicker > 0 ? 1 : 0);
      s.light.color.setRGB(s.color.r, s.color.g * warm, s.color.b * warm * warm);

      this.particlePos[pi] = s.x + jx;
      this.particlePos[pi + 1] = s.y + jy;
      this.particlePos[pi + 2] = s.height;
      this.particlePos[pi + 3] = s.radius;
      this.particleCol[ci] = s.light.color.r * b;
      this.particleCol[ci + 1] = s.light.color.g * b;
      this.particleCol[ci + 2] = s.light.color.b * b;
    }
  }
}
