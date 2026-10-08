import * as THREE from 'three';
import { RENDER, ROOM } from '../data/config.js';
import { fullscreenVertex, brightPassFragment, blurFragment, compositeFragment, copyFragment } from './PostShaders.js';

// The pixel-perfect pipeline:
//
//   scene ──► sceneRT (640x360, HDR, nearest)
//                │
//                ├─► bright pass ─► bloomA (160x90) ─► blur H/V ... ─► bloom texture
//                │
//                └─► composite (scene + bloom, tone map, grade, vignette, HUD) ─► finalRT (640x360)
//
//   finalRT ──► screen, scaled by the largest WHOLE number that fits (black bars around it),
//               so every game pixel becomes an exact NxN square of screen pixels.

export class Renderer {
  constructor() {
    const W = RENDER.width;
    const H = RENDER.height;
    this.W = W;
    this.H = H;

    this.gl = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', alpha: false });
    this.gl.setPixelRatio(1); // we size the canvas in real device pixels ourselves
    this.gl.autoClear = false;
    document.body.appendChild(this.gl.domElement);

    this.scene = new THREE.Scene();
    // camera looks straight down the -Z axis; 1 world unit = 1 game pixel
    this.camera = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, 0.1, 500);
    this.cameraBase = new THREE.Vector2(0, 0);
    this.lookAt(0, 0);

    const nearest = { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false };
    const linear = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, generateMipmaps: false };
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, { ...nearest, type: THREE.HalfFloatType, depthBuffer: true });
    const bw = Math.floor(W / 4);
    const bh = Math.floor(H / 4);
    this.bloomA = new THREE.WebGLRenderTarget(bw, bh, { ...linear, type: THREE.HalfFloatType, depthBuffer: false });
    this.bloomB = new THREE.WebGLRenderTarget(bw, bh, { ...linear, type: THREE.HalfFloatType, depthBuffer: false });
    this.finalRT = new THREE.WebGLRenderTarget(W, H, { ...nearest, depthBuffer: false });

    // HUD canvas (drawn by ui/Hud.js), composited crisply at game resolution
    this.hudCanvas = document.createElement('canvas');
    this.hudCanvas.width = W;
    this.hudCanvas.height = H;
    this.hudTexture = new THREE.CanvasTexture(this.hudCanvas);
    this.hudTexture.minFilter = this.hudTexture.magFilter = THREE.NearestFilter;
    this.hudTexture.generateMipmaps = false;
    this.hudTexture.colorSpace = THREE.NoColorSpace; // the canvas already holds display colours

    // full-screen pass machinery
    this.passScene = new THREE.Scene();
    this.passCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.passScene.add(this.quad);

    const pass = (fragmentShader, uniforms) =>
      new THREE.ShaderMaterial({ vertexShader: fullscreenVertex, fragmentShader, uniforms, depthTest: false, depthWrite: false });

    this.brightMat = pass(brightPassFragment, {
      tScene: { value: this.sceneRT.texture },
      uTexel: { value: new THREE.Vector2(1 / W, 1 / H) },
      uThreshold: { value: RENDER.bloom.threshold },
      uKnee: { value: RENDER.bloom.knee },
    });
    this.blurMat = pass(blurFragment, {
      tInput: { value: null },
      uDir: { value: new THREE.Vector2() },
    });
    this.compositeMat = pass(compositeFragment, {
      tScene: { value: this.sceneRT.texture },
      tBloom: { value: this.bloomA.texture },
      tHud: { value: this.hudTexture },
      uBloomStrength: { value: RENDER.bloom.strength },
      uExposure: { value: RENDER.exposure },
      uSaturation: { value: 1 },
      uContrast: { value: 1 },
      uLift: { value: 0 },
      uShadowTint: { value: new THREE.Vector3(1, 1, 1) },
      uHighlightTint: { value: new THREE.Vector3(1, 1, 1) },
      uVignette: { value: new THREE.Vector3(RENDER.vignette.strength, RENDER.vignette.radius, RENDER.vignette.softness) },
      uRes: { value: new THREE.Vector2(W, H) },
    });
    this.copyMat = pass(copyFragment, { tInput: { value: this.finalRT.texture } });

    this.stats = { calls: 0, triangles: 0 };
    this.scale = 1;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /** Centre the camera on a world point (whole pixels only). */
  lookAt(x, y) {
    this.cameraBase.set(Math.round(x), Math.round(y));
    this.camera.position.set(this.cameraBase.x, this.cameraBase.y, 100);
  }

  /** Apply a chapter's colour grade (see src/data/palettes.js). */
  setGrade(grade) {
    const u = this.compositeMat.uniforms;
    u.uSaturation.value = grade.saturation;
    u.uContrast.value = grade.contrast;
    u.uLift.value = grade.lift;
    u.uShadowTint.value.fromArray(grade.shadowTint);
    u.uHighlightTint.value.fromArray(grade.highlightTint);
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssW = window.innerWidth;
    const cssH = window.innerHeight;
    // canvas backing store in real device pixels, so integer scaling is exact on the physical screen
    this.screenW = Math.max(1, Math.floor(cssW * dpr));
    this.screenH = Math.max(1, Math.floor(cssH * dpr));
    this.gl.setSize(this.screenW, this.screenH, false);
    const canvas = this.gl.domElement;
    canvas.style.width = `${this.screenW / dpr}px`;
    canvas.style.height = `${this.screenH / dpr}px`;
    this.scale = Math.max(1, Math.floor(Math.min(this.screenW / this.W, this.screenH / this.H)));
  }

  _pass(material, target) {
    this.quad.material = material;
    this.gl.setRenderTarget(target);
    this.gl.render(this.passScene, this.passCamera);
  }

  render(shakeX = 0, shakeY = 0) {
    const gl = this.gl;
    this.camera.position.set(this.cameraBase.x + shakeX, this.cameraBase.y + shakeY, 100);

    // 1. scene at low resolution
    gl.setRenderTarget(this.sceneRT);
    gl.setClearColor(RENDER.clearColor, 1);
    gl.clear(true, true, false);
    gl.render(this.scene, this.camera);
    this.stats.calls = gl.info.render.calls;
    this.stats.triangles = gl.info.render.triangles;

    // 2. bloom
    this._pass(this.brightMat, this.bloomA);
    const u = this.blurMat.uniforms;
    for (let i = 0; i < RENDER.bloom.blurPasses; i++) {
      u.tInput.value = this.bloomA.texture;
      u.uDir.value.set(1 / this.bloomA.width, 0);
      this._pass(this.blurMat, this.bloomB);
      u.tInput.value = this.bloomB.texture;
      u.uDir.value.set(0, 1 / this.bloomA.height);
      this._pass(this.blurMat, this.bloomA);
    }

    // 3. composite (tone map + grade + vignette + HUD) at game resolution
    this._pass(this.compositeMat, this.finalRT);

    // 4. integer upscale to the screen, centred, black bars around
    gl.setRenderTarget(null);
    gl.setViewport(0, 0, this.screenW, this.screenH);
    gl.setClearColor(0x000000, 1);
    gl.clear(true, true, false);
    const vw = this.W * this.scale;
    const vh = this.H * this.scale;
    const ox = Math.floor((this.screenW - vw) / 2);
    const oy = Math.floor((this.screenH - vh) / 2);
    gl.setViewport(ox, oy, vw, vh);
    this.quad.material = this.copyMat;
    gl.render(this.passScene, this.passCamera);
    gl.setViewport(0, 0, this.screenW, this.screenH);
  }
}

// The room occupies the bottom 320 pixels of the screen; the HUD band sits above it.
export function roomCameraCenter(roomX, roomY) {
  const roomW = ROOM.wallSide * 2 + ROOM.cols * ROOM.tile;
  return { x: roomX + roomW / 2, y: roomY + RENDER.height / 2 };
}
