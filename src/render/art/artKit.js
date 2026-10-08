// Drawing tools for big creatures (bosses): shapes that shade themselves like the rest of the game
// (light from the top-left, a height map so the real-time lights wrap around them).
//   limb     a tapered capsule between two points - arms, legs, tails, horns, necks, hafts
//   shape    any polygon, pillow-shaded (rounded toward its middle) - cloaks, wings, blades, bellies
//   spots    a scatter of darker / lighter flecks inside what's already painted (warts, rust, mottling)
//   rim      a thin lit edge on the right-hand side of what's painted (moonlight / rim light)
// All take colour ramps dark -> light.

import { Rng } from '../../core/Rng.js';

const LX = -0.62;
const LY = -0.78; // light comes from the top-left

/** A tapered capsule from (x0,y0) radius r0 to (x1,y1) radius r1, shaded as a cylinder. */
export function limb(p, x0, y0, x1, y1, r0, r1, ramp, ht, base = 0) {
  const minX = Math.floor(Math.min(x0 - r0, x1 - r1)) - 1;
  const maxX = Math.ceil(Math.max(x0 + r0, x1 + r1)) + 1;
  const minY = Math.floor(Math.min(y0 - r0, y1 - r1)) - 1;
  const maxY = Math.ceil(Math.max(y0 + r0, y1 + r1)) + 1;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy || 1;
  const len = Math.sqrt(len2);
  // the side normal, and how much it faces the light
  const nx = -dy / len;
  const ny = dx / len;
  const facing = nx * LX + ny * LY;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      let t = ((px - x0) * dx + (py - y0) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const cx = x0 + dx * t;
      const cy = y0 + dy * t;
      const r = r0 + (r1 - r0) * t;
      const ox = px - cx;
      const oy = py - cy;
      const d = Math.sqrt(ox * ox + oy * oy);
      if (d > r) continue;
      const u = r > 0 ? (ox * nx + oy * ny) / r : 0; // -1..1 across the limb
      const prof = Math.sqrt(Math.max(0, 1 - (d / Math.max(r, 0.5)) ** 2));
      let s = prof * 0.62 + u * facing * 0.32 + 0.22;
      // the round end caps catch light too
      s += ((ox * LX + oy * LY) / Math.max(r, 1)) * 0.12;
      const c = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(s * ramp.length)))];
      p.px(x, y, c, base + ht * (0.4 + 0.6 * prof));
    }
  }
}

/** Fill a polygon [[x,y],...] with pillow shading (rounded toward the middle, lit from the top-left). */
export function shape(p, pts, ramp, ht, opts = {}) {
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const minX = Math.max(0, Math.floor(Math.min(...xs)));
  const maxX = Math.min(p.w - 1, Math.ceil(Math.max(...xs)));
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(p.h - 1, Math.ceil(Math.max(...ys)));
  if (maxX < minX || maxY < minY) return; // entirely off the frame
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const mask = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (inside(pts, minX + x + 0.5, minY + y + 0.5)) mask[y * w + x] = 1;
    }
  }
  const dist = distanceField(mask, w, h);
  const soft = opts.soft || Math.max(2, Math.min(w, h) * 0.3);
  const cx = minX + w / 2;
  const cy = minY + h / 2;
  const flat = opts.flat || 0; // 0 = round pillow, 1 = flat plate
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      const prof = Math.min(1, dist[y * w + x] / soft);
      const dir = (-(minX + x - cx) / w) * 0.35 + (-(minY + y - cy) / h) * 0.45;
      let s = (1 - flat) * (prof * 0.55 + 0.2) + flat * 0.5 + dir * (opts.dir ?? 1) + (opts.bias || 0);
      if (opts.folds) s += Math.sin((minX + x) * opts.folds + (minY + y) * 0.12) * 0.09;
      const c = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(s * ramp.length)))];
      p.px(minX + x, minY + y, c, (opts.base || 0) + ht * (flat ? 1 : 0.35 + 0.65 * Math.sqrt(prof)));
    }
  }
}

function inside(pts, x, y) {
  let c = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Chamfer distance to the nearest empty pixel. */
function distanceField(mask, w, h) {
  const INF = 1e6;
  const d = new Float32Array(w * h);
  for (let i = 0; i < d.length; i++) d[i] = mask[i] ? INF : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.414, at(x + 1, y - 1) + 1.414);
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      if (!d[i]) continue;
      d[i] = Math.min(d[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.414, at(x - 1, y + 1) + 1.414);
    }
  }
  return d;
}

/** Flecks over what's already painted inside the box: c (or each of colors) at density. */
export function spots(p, x0, y0, w, h, colors, density, seed, size = 1) {
  const rng = new Rng(seed);
  const cols = Array.isArray(colors) ? colors : [colors];
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      if (!p.filled(x, y) || !rng.chance(density)) continue;
      const c = cols[Math.floor(rng.next() * cols.length)];
      for (let k = 0; k < size; k++) for (let j = 0; j < size; j++) if (p.filled(x + k, y + j)) p.px(x + k, y + j, c, p.getHeight(x + k, y + j) + 0.3);
    }
  }
}

/** A lit edge: every painted pixel whose right (or top) neighbour is empty gets colour c. */
export function rim(p, c, x0 = 0, y0 = 0, x1 = p.w, y1 = p.h, side = 'right') {
  const hits = [];
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (!p.filled(x, y)) continue;
      const open = side === 'right' ? !p.filled(x + 1, y) : side === 'top' ? !p.filled(x, y - 1) : !p.filled(x - 1, y);
      if (open) hits.push([x, y]);
    }
  }
  for (const [x, y] of hits) p.px(x, y, c, p.getHeight(x, y));
}

/** Glowing eyes (a 2x1 slit or a dot), with a dark socket around them. */
export function glowEye(p, x, y, c, h, w = 2) {
  for (let i = -1; i <= w; i++) p.px(x + i, y - 1, '#0a0608', h - 0.2);
  for (let i = 0; i < w; i++) p.lit(x + i, y, c, h, 1.8);
}
