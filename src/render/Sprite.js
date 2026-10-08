import * as THREE from 'three';
import { getSheet, makeTexture, shareTexture } from './Assets.js';

// A sprite is a flat rectangle facing the camera, textured with one frame of a sprite sheet.
// Lit sprites use MeshLambertMaterial + a normal map so torches light them realistically.
//
// Depth: things lower on screen (smaller y) must draw in front. We use z for that:
//   z = LAYER.entity + (DEPTH_RANGE - groundY) * DEPTH_PER_PIXEL
// (DEPTH_RANGE covers the whole floor in world pixels), and alpha-test (no semi-transparent
// edges), so no sorting is ever needed. DEPTH_BIAS nudges something just in front of what
// stands at the same spot (a flame on its brazier, dust in front of a barrel).

export const LAYER = {
  background: 0,
  floorDecal: 0.5,
  shadow: 1,
  wall: 1.5,
  entity: 2,
};

const DEPTH_RANGE = 4000;
const DEPTH_PER_PIXEL = 0.0001;
export const DEPTH_BIAS = DEPTH_PER_PIXEL * 0.5;

export function depthFor(groundY) {
  return LAYER.entity + (DEPTH_RANGE - groundY) * DEPTH_PER_PIXEL;
}

// Shared by every sprite material: F4 debug view shows lighting on plain grey.
export const sharedUniforms = {
  uLightOnly: { value: 0 },
};

const geometryCache = new Map();
function planeGeometry(w, h) {
  const k = `${w}x${h}`;
  let g = geometryCache.get(k);
  if (!g) {
    g = new THREE.PlaneGeometry(w, h);
    geometryCache.set(k, g);
  }
  return g;
}

/**
 * Lit sprite material: Lambert + normal map, with two extra tricks injected into the shader:
 *  - uFlash: mixes the final colour toward white (the 1-frame hurt flash)
 *  - uLightOnly: debug view that replaces colours with grey to inspect lighting
 */
export function makeLitMaterial(map, normalMap, opts = {}) {
  const mat = new THREE.MeshLambertMaterial({
    map,
    normalMap,
    alphaTest: 0.5,
    transparent: false,
  });
  if (opts.emissive) {
    mat.emissive = new THREE.Color(opts.emissive);
    mat.emissiveMap = map;
  }
  const flash = { value: 0 };
  mat.userData.flash = flash;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFlash = flash;
    shader.uniforms.uLightOnly = sharedUniforms.uLightOnly;
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uFlash;\nuniform float uLightOnly;\nvoid main() {')
      .replace('#include <map_fragment>', '#include <map_fragment>\n\tif (uLightOnly > 0.5) diffuseColor.rgb = vec3(0.55);')
      .replace('#include <opaque_fragment>', '\toutgoingLight = mix(outgoingLight, vec3(1.6), uFlash);\n#include <opaque_fragment>');
  };
  return mat;
}

export class Sprite {
  /**
   * @param {string} key      asset manifest key
   * @param {object} opts
   *   lit        (default true)  use lighting + normal maps
   *   glow       HDR multiplier for unlit sprites (flames) so they bloom
   *   anchorY    pixels from the bottom of the frame to the character's feet
   *   shadow     true for blob shadow material (transparent black)
   */
  constructor(scene, key, opts = {}) {
    const sheet = getSheet(key);
    this.sheet = sheet;
    this.def = sheet.def;
    this.anchorY = opts.anchorY ?? 0;
    const { frameW, frameH, cols, rows } = this.def;

    // cloned textures share the same image on the GPU but have their own frame offset
    this.map = shareTexture(sheet.map);
    this.map.repeat.set(1 / cols, 1 / rows);

    if (opts.shadow) {
      this.material = new THREE.MeshBasicMaterial({ map: this.map, color: 0x000000, transparent: true, depthWrite: false });
    } else if (opts.lit === false || this.def.unlit) {
      const g = opts.glow ?? 1;
      this.material = new THREE.MeshBasicMaterial({ map: this.map, color: new THREE.Color(g, g, g), alphaTest: 0.5 });
    } else {
      this.normalMap = shareTexture(sheet.normalMap);
      this.normalMap.repeat.set(1 / cols, 1 / rows);
      this.material = makeLitMaterial(this.map, this.normalMap, opts);
      if (sheet.emissiveMap) {
        // this sheet has its own glow layer (lava, witch-fire...): it replaces any plain self-glow
        this.emitMap = shareTexture(sheet.emissiveMap);
        this.emitMap.repeat.set(1 / cols, 1 / rows);
        this.material.emissive = new THREE.Color(1, 1, 1);
        this.material.emissiveMap = this.emitMap;
      }
    }

    this.mesh = new THREE.Mesh(planeGeometry(frameW, frameH), this.material);
    this.mesh.matrixAutoUpdate = true;
    scene.add(this.mesh);

    this.col = -1;
    this.row = -1;
    this.flashTime = 0;
    this.setFrame(0, 0);
  }

  /** Swap in new sheet images (same layout), e.g. Wren wearing a new relic. */
  swapSheet(colorCanvas, normalCanvas) {
    const { cols, rows } = this.def;
    const make = (canvas, isColor) => {
      const t = makeTexture(canvas, isColor);
      t.repeat.set(1 / cols, 1 / rows);
      return t;
    };
    this.map.dispose();
    this.map = make(colorCanvas, true);
    this.material.map = this.map;
    if (this.material.emissiveMap && !this.emitMap) this.material.emissiveMap = this.map;
    if (this.normalMap) {
      this.normalMap.dispose();
      this.normalMap = make(normalCanvas, false);
      this.material.normalMap = this.normalMap;
    }
    const c = this.col;
    const r = this.row;
    this.col = this.row = -1;
    this.setFrame(c, r);
  }

  /** Switch to another sheet with the same frame layout (the Mad King changing form). */
  useSheet(key) {
    const sheet = getSheet(key);
    if (sheet === this.sheet) return;
    this.sheet = sheet;
    const { cols, rows } = this.def;
    const swap = (old, tex) => {
      if (old) old.dispose();
      const t = shareTexture(tex);
      t.repeat.set(1 / cols, 1 / rows);
      return t;
    };
    this.map = swap(this.map, sheet.map);
    this.material.map = this.map;
    if (this.normalMap) {
      this.normalMap = swap(this.normalMap, sheet.normalMap);
      this.material.normalMap = this.normalMap;
    }
    if (this.emitMap && sheet.emissiveMap) {
      this.emitMap = swap(this.emitMap, sheet.emissiveMap);
      this.material.emissiveMap = this.emitMap;
    }
    this.material.needsUpdate = true;
    const c = this.col;
    const r = this.row;
    this.col = this.row = -1;
    this.setFrame(c, r);
  }

  setFrame(col, row) {
    if (col === this.col && row === this.row) return;
    this.col = col;
    this.row = row;
    const { cols, rows } = this.def;
    const ox = col / cols;
    const oy = 1 - (row + 1) / rows;
    this.map.offset.set(ox, oy);
    if (this.normalMap) this.normalMap.offset.set(ox, oy);
    if (this.emitMap) this.emitMap.offset.set(ox, oy);
  }

  /**
   * Place the sprite. (x, groundY) is where its feet touch the floor, height lifts it visually
   * (jumping, flying stones). Everything is snapped to whole pixels.
   */
  place(x, groundY, height = 0, z = depthFor(groundY)) {
    const { frameH } = this.def;
    this.mesh.position.set(Math.round(x), Math.round(groundY + height) - this.anchorY + frameH / 2, z);
  }

  flash(seconds) {
    this.flashTime = seconds;
  }

  update(dt) {
    if (this.flashTime > 0) {
      this.flashTime -= dt;
      if (this.material.userData.flash) this.material.userData.flash.value = this.flashTime > 0 ? 1 : 0;
    }
  }

  set visible(v) {
    this.mesh.visible = v;
  }

  get visible() {
    return this.mesh.visible;
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.material.dispose();
    this.map.dispose();
    if (this.normalMap) this.normalMap.dispose();
    if (this.emitMap) this.emitMap.dispose();
  }
}

/** Plays a named animation from the manifest on a Sprite. */
export class Animator {
  constructor(sprite) {
    this.sprite = sprite;
    this.anims = sprite.def.anims || {};
    this.current = null;
    this.time = 0;
    this.row = 0;
  }

  /** true once a one-shot animation has reached its last frame */
  get finished() {
    const a = this.anims[this.current];
    return !!a && this.time * a.fps >= a.count;
  }

  play(name, restart = false) {
    if (this.current === name && !restart) return;
    this.current = name;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    const a = this.anims[this.current];
    if (!a) return;
    // looping animations wrap around; one-shot ones (loop: false, e.g. death) hold their last frame
    const n = Math.floor(this.time * a.fps);
    const f = a.loop === false ? Math.min(n, a.count - 1) : n % a.count;
    this.sprite.setFrame(a.start + f, this.row);
  }
}
