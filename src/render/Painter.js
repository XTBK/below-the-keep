// A tiny pixel-art canvas that paints COLOUR and HEIGHT at the same time.
//
// - colour: what you see.
// - height: how far each pixel "sticks out" (in pixels). We turn it into a normal map,
//   so the real-time lights wrap around rounded heads, bevelled bricks, barrel staves...
// - tilt:   extra base slope for surfaces that face the viewer (e.g. the front face of a wall
//           tilts toward the bottom of the screen).
//
// All drawing takes palette colours as '#rrggbb' strings.

const colorCache = new Map();
function rgb(c) {
  let v = colorCache.get(c);
  if (!v) {
    const n = parseInt(c.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    colorCache.set(c, v);
  }
  return v;
}

export class Painter {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.rgba = new Uint8ClampedArray(w * h * 4);
    this.height = new Float32Array(w * h);
    this.tiltX = new Float32Array(w * h);
    this.tiltY = new Float32Array(w * h);
  }

  /**
   * Make a pixel GLOW (emissive): it lights itself, even in darkness. Used for lava cracks,
   * glowing mushrooms, witch-fire. The glow layer is optional (only created when used).
   */
  glow(x, y, c, strength = 1) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.inside(x, y)) return;
    if (!this.emit) this.emit = new Uint8ClampedArray(this.w * this.h * 4);
    const v = rgb(c);
    const i = (y * this.w + x) * 4;
    this.emit[i] = v[0] * strength;
    this.emit[i + 1] = v[1] * strength;
    this.emit[i + 2] = v[2] * strength;
    this.emit[i + 3] = 255;
  }

  /** Paint a pixel AND make it glow. */
  lit(x, y, c, h, strength = 1) {
    this.px(x, y, c, h);
    this.glow(x, y, c, strength);
  }

  toEmissiveCanvas() {
    if (!this.emit) return null;
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    c.getContext('2d').putImageData(new ImageData(this.emit, this.w, this.h), 0, 0);
    return c;
  }

  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  filled(x, y) {
    if (!this.inside(x, y)) return false;
    return this.rgba[(y * this.w + x) * 4 + 3] > 0;
  }

  /** set one pixel. c = colour or null (keep colour), h = height or undefined (keep height) */
  px(x, y, c, h, alpha = 255) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    if (c) {
      const v = rgb(c);
      this.rgba[i * 4] = v[0];
      this.rgba[i * 4 + 1] = v[1];
      this.rgba[i * 4 + 2] = v[2];
      this.rgba[i * 4 + 3] = alpha;
    }
    if (h !== undefined) this.height[i] = h;
  }

  /** only paint where something is already drawn (for details on top of a shape) */
  dot(x, y, c, h) {
    if (this.filled(Math.floor(x), Math.floor(y))) this.px(x, y, c, h);
  }

  getHeight(x, y) {
    if (!this.inside(x, y)) return 0;
    return this.height[y * this.w + x];
  }

  addHeight(x, y, dh) {
    if (!this.inside(x, y)) return;
    this.height[y * this.w + x] += dh;
  }

  rect(x, y, w, h, c, ht) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, ht);
  }

  hline(x0, x1, y, c, ht) {
    for (let x = x0; x <= x1; x++) this.px(x, y, c, ht);
  }

  vline(x, y0, y1, c, ht) {
    for (let y = y0; y <= y1; y++) this.px(x, y, c, ht);
  }

  line(x0, y0, x1, y1, c, ht) {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.px(x0, y0, c, ht);
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

  /**
   * Filled ellipse. `ramp` may be a single colour or a dark->light array: with an array the
   * ellipse is shaded like a ball lit from the top-left. If `dome` is true the height map is
   * rounded (sqrt profile), otherwise flat at `ht`.
   */
  ellipse(cx, cy, rx, ry, ramp, ht, dome = true, highlight = true) {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry);
    const y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const prof = Math.sqrt(1 - d);
        let c = ramp;
        if (Array.isArray(ramp)) {
          // light from top-left, darker toward the bottom-right rim
          let t = prof * 0.75 + (-nx - ny) * 0.22 + 0.1;
          if (!highlight) t = Math.min(t, 0.75);
          c = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(t * ramp.length)))];
        }
        this.px(x, y, c, dome ? ht * prof : ht);
      }
    }
  }

  /**
   * A cylinder lying along the y axis (arms, legs, torsos, barrels): shaded and height-rounded across x.
   * `lightBias` shifts the highlight column (-1 = left, 1 = right).
   */
  cyl(x, y, w, h, ramp, ht, lightBias = -0.35) {
    for (let i = 0; i < w; i++) {
      const t = (i + 0.5) / w;
      const u = t * 2 - 1;
      const prof = Math.sqrt(Math.max(0, 1 - u * u));
      const shade = prof * 0.8 - (u - lightBias) * (u - lightBias) * 0.25 + 0.15;
      const c = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(shade * ramp.length)))];
      for (let j = 0; j < h; j++) this.px(x + i, y + j, c, ht * (0.35 + 0.65 * prof));
    }
  }

  /** Raised block with a bevelled edge: highlight on top/left, shadow on bottom/right. */
  bevelRect(x, y, w, h, ramp, ht, bevel = 1) {
    const n = ramp.length;
    const base = ramp[Math.floor(n / 2)];
    const hi = ramp[Math.min(n - 1, Math.floor(n / 2) + 1)];
    const lo = ramp[Math.max(0, Math.floor(n / 2) - 1)];
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const edge = Math.min(i, j, w - 1 - i, h - 1 - j);
        let c = base;
        if (edge < bevel) c = i < bevel || j < bevel ? hi : lo;
        const e = Math.min(1, (edge + 1) / (bevel + 1));
        this.px(x + i, y + j, c, ht * e);
      }
    }
  }

  /** Mix an existing pixel toward colour c by t (0..1). Keeps alpha and height. */
  tint(x, y, c, t) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!this.filled(x, y)) return;
    const v = rgb(c);
    const i = (y * this.w + x) * 4;
    this.rgba[i] += (v[0] - this.rgba[i]) * t;
    this.rgba[i + 1] += (v[1] - this.rgba[i + 1]) * t;
    this.rgba[i + 2] += (v[2] - this.rgba[i + 2]) * t;
  }

  setTilt(x, y, w, h, tx, ty) {
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (!this.inside(x + i, y + j)) continue;
        const k = (y + j) * this.w + x + i;
        this.tiltX[k] = tx;
        this.tiltY[k] = ty;
      }
    }
  }

  /** Draws a 1px outline in every empty pixel that touches a filled one. */
  outline(c, diagonal = false) {
    const w = this.w;
    const h = this.h;
    const mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = this.rgba[i * 4 + 3] > 0 ? 1 : 0;
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) continue;
        let touch = on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1);
        if (!touch && diagonal) touch = on(x - 1, y - 1) || on(x + 1, y - 1) || on(x - 1, y + 1) || on(x + 1, y + 1);
        if (touch) this.px(x, y, c, 0);
      }
    }
  }

  /** Copy another painter into this one (only its filled pixels). */
  blit(src, dx, dy) {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const si = y * src.w + x;
        if (src.rgba[si * 4 + 3] === 0) continue;
        const tx = dx + x;
        const ty = dy + y;
        if (!this.inside(tx, ty)) continue;
        const ti = ty * this.w + tx;
        this.rgba[ti * 4] = src.rgba[si * 4];
        this.rgba[ti * 4 + 1] = src.rgba[si * 4 + 1];
        this.rgba[ti * 4 + 2] = src.rgba[si * 4 + 2];
        this.rgba[ti * 4 + 3] = src.rgba[si * 4 + 3];
        this.height[ti] = src.height[si];
        this.tiltX[ti] = src.tiltX[si];
        this.tiltY[ti] = src.tiltY[si];
        if (src.emit && src.emit[si * 4 + 3] > 0) {
          if (!this.emit) this.emit = new Uint8ClampedArray(this.w * this.h * 4);
          for (let k = 0; k < 4; k++) this.emit[ti * 4 + k] = src.emit[si * 4 + k];
        }
      }
    }
  }

  /** A left-right mirrored copy (normals are flipped correctly, unlike scaling the sprite by -1). */
  /** A copy flipped top-to-bottom (for art drawn with y pointing up). */
  flippedV() {
    const m = new Painter(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const s = y * this.w + x;
        const d = (this.h - 1 - y) * this.w + x;
        for (let k = 0; k < 4; k++) m.rgba[d * 4 + k] = this.rgba[s * 4 + k];
        m.height[d] = this.height[s];
        m.tiltX[d] = this.tiltX[s];
        m.tiltY[d] = -this.tiltY[s];
        if (this.emit) {
          if (!m.emit) m.emit = new Uint8ClampedArray(m.w * m.h * 4);
          for (let k = 0; k < 4; k++) m.emit[d * 4 + k] = this.emit[s * 4 + k];
        }
      }
    }
    return m;
  }

  mirrored() {
    const m = new Painter(this.w, this.h);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const s = y * this.w + x;
        const d = y * this.w + (this.w - 1 - x);
        for (let k = 0; k < 4; k++) m.rgba[d * 4 + k] = this.rgba[s * 4 + k];
        m.height[d] = this.height[s];
        m.tiltX[d] = -this.tiltX[s];
        m.tiltY[d] = this.tiltY[s];
        if (this.emit) {
          if (!m.emit) m.emit = new Uint8ClampedArray(m.w * m.h * 4);
          for (let k = 0; k < 4; k++) m.emit[d * 4 + k] = this.emit[s * 4 + k];
        }
      }
    }
    return m;
  }

  /**
   * A copy rotated 90 degrees counter-clockwise (the right edge becomes the top edge).
   * Tilts are rotated too, so lighting stays correct.
   */
  rotatedCCW() {
    const m = new Painter(this.h, this.w);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const s = y * this.w + x;
        const d = (this.w - 1 - x) * m.w + y;
        for (let k = 0; k < 4; k++) m.rgba[d * 4 + k] = this.rgba[s * 4 + k];
        m.height[d] = this.height[s];
        m.tiltX[d] = -this.tiltY[s];
        m.tiltY[d] = this.tiltX[s];
        if (this.emit) {
          if (!m.emit) m.emit = new Uint8ClampedArray(m.w * m.h * 4);
          for (let k = 0; k < 4; k++) m.emit[d * 4 + k] = this.emit[s * 4 + k];
        }
      }
    }
    return m;
  }

  toColorCanvas() {
    const c = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    c.getContext('2d').putImageData(new ImageData(this.rgba, this.w, this.h), 0, 0);
    return c;
  }

  /**
   * Builds a tangent-space normal map from the height buffer (central differences).
   * Empty pixels count as height 0 so every shape gets a natural rounded rim.
   */
  toNormalCanvas(strength = 0.7, clampEdges = false) {
    const { w, h } = this;
    const out = new Uint8ClampedArray(w * h * 4);
    const H = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) {
        if (!clampEdges) return 0;
        x = Math.max(0, Math.min(w - 1, x));
        y = Math.max(0, Math.min(h - 1, y));
      }
      const i = y * w + x;
      return this.rgba[i * 4 + 3] > 0 ? this.height[i] : 0;
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let nx = 0;
        let ny = 0;
        let nz = 1;
        if (this.rgba[i * 4 + 3] > 0) {
          const dhdx = (H(x + 1, y) - H(x - 1, y)) * 0.5;
          // canvas y grows downward, texture v grows upward
          const dhdv = (H(x, y - 1) - H(x, y + 1)) * 0.5;
          nx = this.tiltX[i] - dhdx * strength;
          ny = this.tiltY[i] - dhdv * strength;
          const len = Math.hypot(nx, ny, 1);
          nx /= len;
          ny /= len;
          nz = 1 / len;
        }
        out[i * 4] = (nx * 0.5 + 0.5) * 255;
        out[i * 4 + 1] = (ny * 0.5 + 0.5) * 255;
        out[i * 4 + 2] = (nz * 0.5 + 0.5) * 255;
        out[i * 4 + 3] = 255;
      }
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
    return c;
  }
}

/**
 * Build a sprite sheet: draw(col, row) returns a Painter of frame size for each frame (or null),
 * and the frames are packed into one sheet (rows = animations/directions, cols = frames).
 * Normals are computed per frame so frames never bleed into each other.
 * clampEdges: true for tiles (their surface continues past the edge), false for sprites.
 * Returns { color, normal, emissive } canvases (emissive is null when nothing glows).
 */
export function buildSheet(frameW, frameH, cols, rows, draw, { normalStrength = 0.7, clampEdges = false } = {}) {
  const color = document.createElement('canvas');
  const normal = document.createElement('canvas');
  color.width = normal.width = frameW * cols;
  color.height = normal.height = frameH * rows;
  const cctx = color.getContext('2d');
  const nctx = normal.getContext('2d');
  nctx.fillStyle = 'rgb(128,128,255)';
  nctx.fillRect(0, 0, normal.width, normal.height);
  let emissive = null;
  let ectx = null;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = draw(c, r);
      if (!p) continue;
      cctx.drawImage(p.toColorCanvas(), c * frameW, r * frameH);
      nctx.drawImage(p.toNormalCanvas(normalStrength, clampEdges), c * frameW, r * frameH);
      const e = p.toEmissiveCanvas();
      if (e) {
        if (!emissive) {
          emissive = document.createElement('canvas');
          emissive.width = color.width;
          emissive.height = color.height;
          ectx = emissive.getContext('2d');
          ectx.fillStyle = '#000';
          ectx.fillRect(0, 0, emissive.width, emissive.height);
        }
        ectx.drawImage(e, c * frameW, r * frameH);
      }
    }
  }
  return { color, normal, emissive };
}
