import * as THREE from 'three';

// Big attack visuals for bosses: sweeping laser beams and cones of breath fire.
// (They used to be drawn dot by dot on the telegraph overlay, which ran out of dots on long beams.)
// Each beam is two stretched quads - a coloured glow and a white-hot core - with a pixel-banded
// texture, a flickering width, a flare where it starts and a splash of light where it hits.
// Call begin() each frame, draw what's needed, then end() to hide the rest.

const Z = 2.95; // above every creature, just under the telegraph overlay

function bandTexture() {
  // 1 x 16: hard pixel bands from transparent edges to an opaque middle
  const c = document.createElement('canvas');
  c.width = 1;
  c.height = 16;
  const g = c.getContext('2d');
  const prof = [0, 0.15, 0.3, 0.5, 0.7, 0.85, 1, 1, 1, 1, 0.85, 0.7, 0.5, 0.3, 0.15, 0];
  prof.forEach((a, y) => {
    g.fillStyle = `rgba(255,255,255,${a})`;
    g.fillRect(0, y, 1, 1);
  });
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}

function radialTexture() {
  // 16 x 16 stepped radial falloff (for flares and the breath cone)
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16) / 16;
      const a = d >= 1 ? 0 : Math.round((1 - d) * 5) / 5;
      g.fillStyle = `rgba(255,255,255,${a})`;
      g.fillRect(x, y, 1, 1);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}

const additive = (map) =>
  new THREE.MeshBasicMaterial({ map, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true });

export class BeamFX {
  constructor(scene, max = 6) {
    const band = bandTexture();
    const radial = radialTexture();
    const quad = new THREE.PlaneGeometry(1, 1);
    this.beams = [];
    for (let i = 0; i < max; i++) {
      const glow = new THREE.Mesh(quad, additive(band));
      const core = new THREE.Mesh(quad, additive(band));
      const flare = new THREE.Mesh(quad, additive(radial));
      const hit = new THREE.Mesh(quad, additive(radial));
      for (const m of [glow, core, flare, hit]) {
        m.visible = false;
        m.frustumCulled = false;
        scene.add(m);
      }
      this.beams.push({ glow, core, flare, hit });
    }
    // breath fire: each cone is drawn as flickering tongues of flame (fixed wedge shapes,
    // squashed and stretched per frame - no geometry is rebuilt)
    this.wedge = new THREE.CircleGeometry(1, 16, -0.5, 1);
    this.tongues = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(this.wedge, additive(radial));
      m.visible = false;
      m.frustumCulled = false;
      scene.add(m);
      this.tongues.push(m);
    }
    this.used = 0;
    this.usedTongues = 0;
  }

  begin() {
    this.used = 0;
    this.usedTongues = 0;
  }

  end() {
    for (let i = this.used; i < this.beams.length; i++) for (const m of Object.values(this.beams[i])) m.visible = false;
    for (let i = this.usedTongues; i < this.tongues.length; i++) this.tongues[i].visible = false;
  }

  /** A beam from (x0,y0) to (x1,y1) on screen, half-width w. glow/core: THREE.Color (may exceed 1 to bloom). */
  beam(x0, y0, x1, y1, w, glowColor, coreColor, time, alpha = 1) {
    if (this.used >= this.beams.length) return;
    const b = this.beams[this.used++];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const ang = Math.atan2(dy, dx);
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    // the width flickers fast, like something barely contained
    const flick = 1 + Math.sin(time * 47) * 0.12 + Math.sin(time * 23.3) * 0.08;
    const set = (m, width, color, a) => {
      m.position.set(Math.round(mx), Math.round(my), Z);
      m.rotation.z = ang;
      m.scale.set(len, Math.max(2, Math.round(width)), 1);
      m.material.color.copy(color);
      m.material.opacity = a;
      m.visible = true;
    };
    set(b.glow, w * 2.6 * flick, glowColor, 0.85 * alpha);
    set(b.core, w * 1.0 * flick, coreColor, alpha);
    b.core.position.z = Z + 0.001;
    // a flare where it leaves the boss, a splash where it strikes
    const fs = w * 3.2 * (1 + Math.sin(time * 31) * 0.2);
    b.flare.position.set(Math.round(x0), Math.round(y0), Z + 0.002);
    b.flare.scale.set(fs, fs, 1);
    b.flare.material.color.copy(coreColor);
    b.flare.material.opacity = alpha;
    b.flare.visible = true;
    const hs = w * 2.4 * (1 + Math.sin(time * 37 + 1) * 0.3);
    b.hit.position.set(Math.round(x1), Math.round(y1), Z + 0.002);
    b.hit.scale.set(hs, hs, 1);
    b.hit.material.color.copy(glowColor);
    b.hit.material.opacity = alpha * 0.9;
    b.hit.visible = true;
  }

  /** A cone of breath fire from (x,y): facing angle, half-angle, reach. */
  cone(x, y, angle, half, reach, outerColor, innerColor, time, alpha = 1) {
    const tongue = (ang, h, len, color, a, z) => {
      if (this.usedTongues >= this.tongues.length) return;
      const m = this.tongues[this.usedTongues++];
      m.position.set(Math.round(x), Math.round(y), z);
      m.rotation.z = ang;
      // the wedge geometry opens 0.5 rad either way; squash it to this tongue's opening
      m.scale.set(len, len * (Math.tan(Math.min(1.2, h)) / Math.tan(0.5)), 1);
      m.material.color.copy(color);
      m.material.opacity = a;
      m.visible = true;
    };
    // outer tongues: each licks out to its own length and sways
    const n = 6;
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1;
      const sway = Math.sin(time * (9 + i * 1.7) + i * 2.1) * 0.12;
      const len = reach * (0.7 + 0.3 * Math.abs(Math.sin(time * (7 + i * 2.3) + i))) * (1 - Math.abs(u) * 0.2);
      tongue(angle + (u * 0.75 + sway) * half, half * 0.42, len, outerColor, 0.55 * alpha, 2.95 + i * 0.0002);
    }
    // the hot heart of it
    for (let i = 0; i < 3; i++) {
      const sway = Math.sin(time * (13 + i * 3) + i) * 0.1;
      const len = reach * (0.45 + 0.15 * Math.abs(Math.sin(time * (11 + i * 4))));
      tongue(angle + ((i - 1) * 0.3 + sway) * half, half * 0.3, len, innerColor, 0.8 * alpha, 2.96 + i * 0.0002);
    }
  }
}
