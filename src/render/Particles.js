import * as THREE from 'three';
import { LIGHTING, PARTICLES } from '../data/config.js';
import { fxRng } from '../core/Rng.js';
import { depthFor, DEPTH_BIAS } from './Sprite.js';

// Batched pixel particles: ONE draw call per system, all memory allocated up front.
// Each particle is a square of 1-3 game pixels.
//
// Two systems exist (see Effects.js):
//  - lit:  dust, debris, smoke. Brightness comes from the same point lights as the sprites,
//          so dust motes sparkle near torches and vanish in the dark.
//  - glow: embers, sparks. Additive, self-lit, bright enough to bloom.
//
// Particles are spawned from PRESETS (plain objects defined once), so emitting never allocates:
//   particles.emit(PRESET, x, y, height, vx, vy, vh)

const vertexShader = /* glsl */ `
  attribute float size;
  attribute vec4 pcolor;
  uniform float uLit;
  uniform vec4 uLightPos[${LIGHTING.poolSize}];
  uniform vec3 uLightCol[${LIGHTING.poolSize}];
  uniform vec3 uAmbient;
  uniform float uDecay;
  varying vec4 vColor;
  void main() {
    vec3 c = pcolor.rgb;
    if (uLit > 0.5) {
      vec3 L = uAmbient * 2.0;
      for (int i = 0; i < ${LIGHTING.poolSize}; i++) {
        vec4 lp = uLightPos[i];
        vec3 d = vec3(lp.xy - position.xy, lp.z - 8.0);
        float dist = length(d);
        float w = clamp(1.0 - pow(dist / max(lp.w, 1.0), 4.0), 0.0, 1.0);
        L += uLightCol[i] * pow(lp.z / max(dist, 1.0), uDecay) * w * w;
      }
      c *= L;
    }
    vColor = vec4(c, pcolor.a);
    gl_PointSize = size;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec4 vColor;
  void main() {
    if (vColor.a <= 0.01) discard;
    gl_FragColor = vColor;
  }
`;

/** Shared material for square-pixel point batches (particles and the pixel overlay). */
export function makePointMaterial(lighting, lit, additive) {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uLit: { value: lit ? 1 : 0 },
      // uniform arrays of vec4/vec3 accept flat Float32Arrays
      uLightPos: { value: lighting.particlePos },
      uLightCol: { value: lighting.particleCol },
      uAmbient: { value: lighting.ambientLinear },
      uDecay: { value: LIGHTING.decay },
    },
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

/** Convert a '#rrggbb' palette list into linear-space THREE.Colors once (at load time). */
export function linearColors(hexList, multiplier = 1) {
  return hexList.map((h) => new THREE.Color(h).multiplyScalar(multiplier));
}

export class ParticleSystem {
  constructor(scene, capacity, { lit, additive, lighting }) {
    this.capacity = capacity;
    this.lighting = lighting;
    const n = capacity;
    // struct-of-arrays particle state
    this.x = new Float32Array(n);
    this.y = new Float32Array(n);
    this.h = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.vh = new Float32Array(n);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n);
    this.size = new Float32Array(n);
    this.r = new Float32Array(n);
    this.g = new Float32Array(n);
    this.b = new Float32Array(n);
    this.a = new Float32Array(n);
    this.gravity = new Float32Array(n);
    this.drag = new Float32Array(n);
    this.bounce = new Float32Array(n);
    this.wander = new Float32Array(n);
    this.fade = new Uint8Array(n); // 0 = fade out, 1 = fade in & out
    this.alive = new Uint8Array(n);
    this.freeList = new Int32Array(n);
    this.freeCount = n;
    for (let i = 0; i < n; i++) this.freeList[i] = n - 1 - i;
    this.activeCount = 0;

    this.geometry = new THREE.BufferGeometry();
    this.posAttr = new THREE.BufferAttribute(new Float32Array(n * 3), 3);
    this.colAttr = new THREE.BufferAttribute(new Float32Array(n * 4), 4);
    this.sizeAttr = new THREE.BufferAttribute(new Float32Array(n), 1);
    this.posAttr.setUsage(THREE.DynamicDrawUsage);
    this.colAttr.setUsage(THREE.DynamicDrawUsage);
    this.sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', this.posAttr);
    this.geometry.setAttribute('pcolor', this.colAttr);
    this.geometry.setAttribute('size', this.sizeAttr);
    this.geometry.setDrawRange(0, 0);

    this.material = makePointMaterial(lighting, lit, additive);
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  /** Spawn one particle from a preset. Returns false if the pool is full. */
  emit(preset, x, y, h, vx, vy, vh) {
    if (this.freeCount === 0) return false;
    const i = this.freeList[--this.freeCount];
    this.alive[i] = 1;
    this.x[i] = x;
    this.y[i] = y;
    this.h[i] = h;
    this.vx[i] = vx;
    this.vy[i] = vy;
    this.vh[i] = vh;
    const life = fxRng.float(preset.life[0], preset.life[1]);
    this.life[i] = life;
    this.maxLife[i] = life;
    this.size[i] = fxRng.int(preset.size[0], preset.size[1]);
    const c = preset.colors[(fxRng.next() * preset.colors.length) | 0];
    this.r[i] = c.r;
    this.g[i] = c.g;
    this.b[i] = c.b;
    this.a[i] = preset.alpha ?? 1;
    this.gravity[i] = preset.gravity ?? 0;
    this.drag[i] = preset.drag ?? 0;
    this.bounce[i] = preset.bounce ?? 0;
    this.wander[i] = preset.wander ?? 0;
    this.fade[i] = preset.fadeInOut ? 1 : 0;
    this.activeCount++;
    return true;
  }

  kill(i) {
    this.alive[i] = 0;
    this.freeList[this.freeCount++] = i;
    this.activeCount--;
  }

  clear() {
    for (let i = 0; i < this.capacity; i++) if (this.alive[i]) this.kill(i);
  }

  update(dt, time) {
    for (let i = 0; i < this.capacity; i++) {
      if (!this.alive[i]) continue;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.kill(i);
        continue;
      }
      const d = Math.max(0, 1 - this.drag[i] * dt);
      this.vx[i] *= d;
      this.vy[i] *= d;
      if (this.wander[i] > 0) {
        this.vx[i] += Math.sin(time * 3 + i * 1.7) * this.wander[i] * dt;
      }
      this.vh[i] -= this.gravity[i] * dt;
      this.x[i] += this.vx[i] * dt;
      this.y[i] += this.vy[i] * dt;
      this.h[i] += this.vh[i] * dt;
      if (this.h[i] < 0 && this.gravity[i] > 0) {
        // hit the floor: bounce and slide (debris clattering)
        this.h[i] = 0;
        this.vh[i] = -this.vh[i] * this.bounce[i];
        this.vx[i] *= 0.55;
        this.vy[i] *= 0.55;
        if (this.vh[i] < 12) this.vh[i] = 0;
      }
    }
  }

  /** Copy living particles into the GPU buffers (compacted, so the draw range is tight). */
  sync() {
    const pos = this.posAttr.array;
    const col = this.colAttr.array;
    const siz = this.sizeAttr.array;
    let n = 0;
    for (let i = 0; i < this.capacity; i++) {
      if (!this.alive[i]) continue;
      const s = this.size[i];
      // snap to the pixel grid: odd sizes centre on a pixel, even sizes on a pixel corner
      const sx = s % 2 === 1 ? Math.floor(this.x[i]) + 0.5 : Math.round(this.x[i]);
      const sy = s % 2 === 1 ? Math.floor(this.y[i] + this.h[i]) + 0.5 : Math.round(this.y[i] + this.h[i]);
      pos[n * 3] = sx;
      pos[n * 3 + 1] = sy;
      pos[n * 3 + 2] = depthFor(this.y[i]) + DEPTH_BIAS;
      const t = this.life[i] / this.maxLife[i]; // 1 -> 0
      let fade = Math.min(1, t * 3);
      if (this.fade[i] === 1) fade = Math.min(fade, (1 - t) * 4);
      col[n * 4] = this.r[i];
      col[n * 4 + 1] = this.g[i];
      col[n * 4 + 2] = this.b[i];
      col[n * 4 + 3] = this.a[i] * fade;
      siz[n] = s;
      n++;
    }
    this.geometry.setDrawRange(0, n);
    this.posAttr.needsUpdate = true;
    this.colAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }
}

export function makeParticleSystems(scene, lighting) {
  return {
    lit: new ParticleSystem(scene, PARTICLES.maxLit, { lit: true, additive: false, lighting }),
    glow: new ParticleSystem(scene, PARTICLES.maxGlow, { lit: false, additive: true, lighting }),
    dust: new ParticleSystem(scene, PARTICLES.dust.count, { lit: true, additive: false, lighting }),
  };
}
