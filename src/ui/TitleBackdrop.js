import { VISUAL } from '../render/Sprite.js';
import { RENDER } from '../data/config.js';

// The title screen's backdrop: a castle on a crag under a huge moon, mountains behind, a dark pine
// forest in layers in front, mist drifting between them, bats, candlelit windows and now and then a
// flash of distant lightning. Painted once into layers (pixel by pixel, seeded so it never changes),
// then the moving parts are drawn on top every frame.

const W = RENDER.width;
const H = RENDER.height;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function layer() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g };
}

const MOON = { x: 588, y: 104, r: 28 };
const SKY = ['#06040c', '#0a0614', '#0f081c', '#160a22', '#200c26', '#2e0f28', '#3e1228', '#521626'];

// ---------------------------------------------------------------- the sky, stars and moon
function paintSky() {
  const { c, g } = layer();
  // banded, dithered gradient: pixel art skies step rather than blend
  const top = 0;
  const bottom = 250;
  for (let y = top; y < H; y++) {
    const t = Math.min(1, (y - top) / (bottom - top));
    const f = t * (SKY.length - 1);
    const i = Math.floor(f);
    const frac = f - i;
    for (let x = 0; x < W; x++) {
      // ordered dither between two bands
      const d = ((x & 1) * 2 + (y & 1)) / 4 + 0.125;
      g.fillStyle = SKY[Math.min(SKY.length - 1, i + (frac > d ? 1 : 0))];
      g.fillRect(x, y, 1, 1);
    }
  }
  // a faint glow around the moon, in rings
  for (let r = 110; r > MOON.r; r -= 6) {
    g.fillStyle = `rgba(190,170,200,${0.012 + (1 - r / 110) * 0.05})`;
    g.beginPath();
    g.arc(MOON.x, MOON.y, r, 0, Math.PI * 2);
    g.fill();
  }
  // the moon: pale, pitted, lit from its right
  const rand = rng(77);
  for (let y = -MOON.r; y <= MOON.r; y++) {
    for (let x = -MOON.r; x <= MOON.r; x++) {
      const d = Math.hypot(x, y);
      if (d > MOON.r) continue;
      const shade = (x - y * 0.4) / MOON.r; // -1 dark side .. 1 lit
      let col = shade > 0.35 ? '#f4ead2' : shade > -0.2 ? '#e2d6b8' : shade > -0.65 ? '#c6b896' : '#a49676';
      if (d > MOON.r - 1.2) col = '#c8bc9c';
      g.fillStyle = col;
      g.fillRect(MOON.x + x, MOON.y + y, 1, 1);
    }
  }
  // craters
  for (const [cx, cy, cr] of [[-10, -8, 6], [8, 6, 4], [-4, 14, 5], [14, -14, 3], [-18, 6, 3], [4, -2, 2.5], [18, 12, 2]]) {
    for (let y = -cr; y <= cr; y++) {
      for (let x = -cr; x <= cr; x++) {
        if (x * x + y * y > cr * cr) continue;
        g.fillStyle = x + y < 0 ? 'rgba(90,76,56,0.45)' : 'rgba(255,250,235,0.25)';
        g.fillRect(MOON.x + cx + x, MOON.y + cy + y, 1, 1);
      }
    }
  }
  // stars: fixed, the twinkle is drawn per frame
  const stars = [];
  for (let i = 0; i < 140; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * 200);
    if (Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + 26) continue;
    stars.push({ x, y, b: rand(), p: rand() * 6 });
  }
  return { c, stars };
}

// ---------------------------------------------------------------- mountains
function ridge(g, rand, baseY, amp, color, rough, step = 1) {
  let y = baseY;
  let v = 0;
  g.fillStyle = color;
  const pts = [];
  for (let x = 0; x <= W; x += step) {
    v += (rand() - 0.5) * rough;
    v *= 0.94;
    y += v;
    y = Math.max(baseY - amp, Math.min(baseY + amp * 0.3, y));
    pts.push(y);
    g.fillRect(x, Math.round(y), step, H - Math.round(y));
  }
  return pts;
}

function paintMountains() {
  const { c, g } = layer();
  const rand = rng(1234);
  // far range: sharp peaks, faintly moonlit
  let y = 200;
  const peaks = [];
  for (let x = 0; x <= W; x++) {
    const p = Math.abs(Math.sin(x * 0.019 + 1.3)) * 38 + Math.abs(Math.sin(x * 0.047)) * 16 + Math.sin(x * 0.11) * 3;
    y = 228 - p;
    peaks.push(y);
    g.fillStyle = '#1c1030';
    g.fillRect(x, Math.round(y), 1, H);
  }
  // moonlit snowcaps on the right faces of the far peaks
  for (let x = 1; x < W - 1; x++) {
    if (peaks[x] < 196 && peaks[x + 1] > peaks[x]) {
      g.fillStyle = '#3a2c50';
      g.fillRect(x, Math.round(peaks[x]), 1, 2);
    }
  }
  // the nearer range, darker
  ridge(g, rand, 236, 22, '#140b22', 2.2);
  return { c };
}

// ---------------------------------------------------------------- clouds
/** A soft cloud: overlapping puffs, dark violet, the moon catching their upper edges. */
function paintCloud(w, seed) {
  const h = 22;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const rand = rng(seed * 31);
  const puffs = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const r = 5 + Math.sin(t * Math.PI) * 6 + rand() * 2;
    puffs.push({ x: 8 + t * (w - 16) + (rand() - 0.5) * 6, y: h - 5 - r * 0.55, r });
  }
  // the moonlit tops first, then the body over them, shifted down a pixel
  g.fillStyle = 'rgba(92,72,120,0.55)';
  for (const p of puffs) {
    g.beginPath();
    g.ellipse(p.x, p.y, p.r * 1.25, p.r * 0.7, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(24,16,38,0.9)';
  for (const p of puffs) {
    g.beginPath();
    g.ellipse(p.x, p.y + 1.5, p.r * 1.25, p.r * 0.7, 0, 0, Math.PI * 2);
    g.fill();
  }
  // a flat, fading underside
  const grad = g.createLinearGradient(0, h - 8, 0, h);
  grad.addColorStop(0, 'rgba(24,16,38,0.9)');
  grad.addColorStop(1, 'rgba(24,16,38,0)');
  g.fillStyle = grad;
  g.fillRect(4, h - 8, w - 8, 8);
  // the whole cloud is thin: see the sky through it
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const o = out.getContext('2d');
  o.globalAlpha = 0.6;
  o.drawImage(c, 0, 0);
  return out;
}

// ---------------------------------------------------------------- the castle on its crag
const STONE = '#0e0a16';
const STONE_LIT = '#2c2440';
const STONE_RIM = '#463c60';
const ROOF = '#120a16';
const ROOF_LIT = '#2e1e34';

function paintCastle() {
  const { c, g } = layer();
  const rand = rng(99);
  const windows = [];
  const rect = (x, y, w, h, col = STONE) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  // the crag: a jagged rock rising out of the forest
  for (let x = 196; x < 452; x++) {
    const t = (x - 196) / 256;
    const top = 238 - Math.sin(t * Math.PI) * 26 + Math.sin(x * 0.31) * 3 + (rand() - 0.5) * 3;
    rect(x, Math.round(top), 1, H - Math.round(top), '#0a0712');
    // moonlit right-facing ledges
    if (Math.sin(x * 0.31) > 0.6) rect(x, Math.round(top), 1, 1, '#241c34');
  }
  // a tower: walls, battlements or a pointed roof, slit windows, a lit right edge
  const tower = (x, top, w, base, roofH, opts = {}) => {
    rect(x, top, w, base - top);
    rect(x + w - 1, top, 1, base - top, STONE_RIM); // moonlight on the right edge
    rect(x + w - 3, top, 2, base - top, STONE_LIT);
    // stone courses
    for (let y = top + 6; y < base; y += 7) for (let xx = x + ((y / 7) % 2 ? 2 : 5); xx < x + w - 3; xx += 6) rect(xx, y, 2, 1, '#151020');
    if (roofH) {
      // a gothic roof: flared at the eaves, curving to a needle point, tiles in courses, moonlit right side
      const cx = x + w / 2;
      for (let i = 0; i < roofH; i++) {
        const t = i / roofH;
        const half = Math.max(0.5, ((w + 4) / 2) * Math.pow(1 - t, 1.45));
        const x0 = Math.round(cx - half);
        const x1 = Math.round(cx + half);
        rect(x0, top - 1 - i, Math.max(1, x1 - x0), 1, i % 4 === 3 ? '#0a0610' : ROOF);
        if (x1 - x0 > 2) rect(x1 - Math.max(1, Math.round(half * 0.45)), top - 1 - i, Math.max(1, Math.round(half * 0.45)), 1, ROOF_LIT);
      }
      rect(Math.round(cx) - 1, top - 1, 2, 1, ROOF_LIT); // the eave's lip catches the light
      rect(Math.round(cx), top - roofH - 7, 1, 7, ROOF_LIT); // the finial
      rect(Math.round(cx) - 1, top - roofH - 4, 3, 1, ROOF_LIT); // ...with a little cross-bar
      if (opts.flag) {
        // a long banner, flying to the right
        rect(Math.round(cx) + 1, top - roofH - 7, 7, 2, '#7a1622');
        rect(Math.round(cx) + 1, top - roofH - 5, 5, 1, '#5a1018');
        rect(Math.round(cx) + 8, top - roofH - 6, 2, 1, '#5a1018');
      }
    } else {
      // battlements
      for (let xx = x - 1; xx < x + w + 1; xx += 4) rect(xx, top - 3, 2, 3);
      rect(x - 1, top - 1, w + 2, 1);
    }
    // windows: some lit, some dark
    const rows = Math.floor((base - top - 10) / 18);
    for (let r = 0; r < rows; r++) {
      const wy = top + 8 + r * 18;
      const cols = w >= 22 ? 2 : 1;
      for (let k = 0; k < cols; k++) {
        const wx = cols === 2 ? x + Math.round(w * (k ? 0.64 : 0.24)) : x + Math.round(w / 2) - 1;
        const lit = rand() < (opts.lit ?? 0.45);
        rect(wx, wy, 2, 4, '#050308');
        rect(wx, wy - 1, 2, 1, '#050308'); // an arched top
        if (lit) windows.push({ x: wx, y: wy, ph: rand() * 10, sp: 2 + rand() * 4 });
      }
    }
  };
  // curtain walls first (behind the towers)
  const wall = (x0, x1, top, base) => {
    rect(x0, top, x1 - x0, base - top);
    for (let xx = x0; xx < x1; xx += 4) rect(xx, top - 3, 2, 3);
    for (let y = top + 5; y < base; y += 6) for (let xx = x0 + ((y / 6) % 2 ? 1 : 4); xx < x1; xx += 7) rect(xx, y, 2, 1, '#151020');
  };
  wall(230, 412, 206, 246); // the outer curtain wall
  wall(262, 380, 176, 212); // the inner ward
  // the great keep and its towers, back to front: one tall spire in the middle, the rest stepping
  // down to either side in matching pairs
  tower(232, 200, 10, 246, 0, { lit: 0.3 }); // corner turrets on the outer wall
  tower(400, 200, 10, 246, 0, { lit: 0.3 });
  tower(244, 178, 14, 240, 20, { lit: 0.35 }); // the outer towers
  tower(384, 178, 14, 240, 20, { lit: 0.35 });
  tower(266, 146, 20, 236, 28, { lit: 0.5 }); // the flanking towers
  tower(354, 146, 20, 236, 28, { lit: 0.5 });
  tower(294, 124, 52, 234, 0, { lit: 0.55 }); // the great keep, battlemented
  tower(290, 112, 8, 128, 12, { lit: 0.7 }); // turrets on the keep's corners
  tower(342, 112, 8, 128, 12, { lit: 0.7 });
  tower(311, 114, 18, 126, 25, { flag: true, lit: 0.85 }); // the spire, crowning it all
  // the gate: a dark arch with a sliver of firelight, under the keep
  rect(313, 214, 14, 20, '#050308');
  rect(314, 212, 12, 2, '#050308');
  rect(316, 211, 8, 1, '#050308');
  windows.push({ x: 319, y: 228, ph: 1, sp: 1.5, gate: true });
  // a narrow bridge down the crag to the left
  for (let x = 196; x < 232; x++) {
    const y = 246 + Math.round((232 - x) * 0.35);
    rect(x, y, 1, 2, '#0c0814');
    if (x % 6 === 0) rect(x, y + 2, 1, 6, '#0c0814');
  }
  return { c, windows };
}

// ---------------------------------------------------------------- the forest
function pine(g, x, base, h, col, lit) {
  const w = Math.max(3, Math.round(h * 0.36));
  for (let i = 0; i < h; i++) {
    const t = i / h;
    // tiers: the outline steps in and out
    const tier = (i % Math.max(3, Math.round(h / 6))) / Math.max(3, Math.round(h / 6));
    const half = Math.max(0, Math.round(w * (1 - t) * (0.75 + tier * 0.3)));
    g.fillStyle = col;
    g.fillRect(x - half, base - i, half * 2 + 1, 1);
    if (lit && half > 1 && (i % 3 === 0)) {
      g.fillStyle = lit;
      g.fillRect(x + half, base - i, 1, 1);
    }
  }
  g.fillStyle = col;
  g.fillRect(x, base - h - 2, 1, 3);
}

function deadTree(g, rand, x, base, h, col) {
  g.fillStyle = col;
  // trunk
  for (let i = 0; i < h; i++) g.fillRect(x + Math.round(Math.sin(i * 0.15) * 1.5), base - i, i < h * 0.3 ? 3 : 2, 1);
  // crooked branches
  const branch = (bx, by, dir, len, depth) => {
    let px = bx;
    let py = by;
    for (let i = 0; i < len; i++) {
      px += dir * (rand() < 0.7 ? 1 : 0);
      py -= rand() < 0.6 ? 1 : 0;
      g.fillRect(Math.round(px), Math.round(py), 1, 1);
      if (depth > 0 && rand() < 0.08) branch(px, py, rand() < 0.5 ? -1 : 1, Math.round(len * 0.5), depth - 1);
    }
  };
  for (let k = 0; k < 6; k++) branch(x + 1, base - h * (0.45 + rand() * 0.5), rand() < 0.5 ? -1 : 1, Math.round(6 + rand() * 12), 2);
}

function paintForest(seed, base, minH, maxH, density, col, lit, opts = {}) {
  const { c, g } = layer();
  const rand = rng(seed);
  // a ground band under the trees
  g.fillStyle = col;
  g.fillRect(0, base, W, H - base);
  for (let x = -10; x < W + 10; x += density) {
    if (opts.gap && x > opts.gap[0] && x < opts.gap[1]) continue;
    const h = minH + rand() * (maxH - minH);
    const xx = Math.round(x + (rand() - 0.5) * density * 0.8);
    const bb = Math.round(base + (rand() - 0.5) * 6);
    if (opts.dead && rand() < opts.dead) deadTree(g, rand, xx, bb, Math.round(h * 1.1), col);
    else pine(g, xx, bb, Math.round(h), col, lit);
  }
  return { c };
}

// ---------------------------------------------------------------- the near ground: the hero's cliff
function paintForeground() {
  const { c, g } = layer();
  const rand = rng(555);
  // a rocky outcrop on the right where the hero stands
  for (let x = 420; x < W; x++) {
    const t = (x - 420) / (W - 420);
    const top = 268 - Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * 6 + (rand() - 0.5) * 2;
    g.fillStyle = '#050309';
    g.fillRect(x, Math.round(top), 1, H);
    if (rand() < 0.3) {
      g.fillStyle = '#1a1424';
      g.fillRect(x, Math.round(top), 1, 1);
    }
  }
  // dark brambles and grass along the very bottom
  g.fillStyle = '#030206';
  g.fillRect(0, 334, W, H - 334);
  for (let x = 0; x < W; x += 2) {
    const h = 3 + rand() * 9;
    g.fillRect(x, 334 - h, 1, h);
  }
  // a dead tree on the far left, framing the menu
  deadTree(g, rand, 14, 340, 150, '#030206');
  return { c };
}

// ---------------------------------------------------------------- the moving parts
const BAT = [
  ['#..#', '####', '.##.'],
  ['....', '####', '#..#'],
];

export class TitleBackdrop {
  constructor() {
    this.ready = false;
    this.bats = [];
    this.flash = 0;
    this.nextBolt = 6 + Math.random() * 8;
  }

  _build() {
    const sky = paintSky();
    this.sky = sky.c;
    this.stars = sky.stars;
    this.mountains = paintMountains().c;
    const castle = paintCastle();
    this.castle = castle.c;
    this.windows = castle.windows;
    this.forestFar = paintForest(31, 262, 16, 30, 7, '#0b0716', '#1c1430', { gap: [214, 436] }).c;
    this.forestMid = paintForest(47, 288, 26, 46, 11, '#07050d', '#151022', { dead: 0.08 }).c;
    this.foreground = paintForeground().c;
    for (let i = 0; i < 4; i++) this._newBat(Math.random() * W);
    this.ready = true;
  }

  _newBat(x = -10) {
    this.bats.push({ x, y: 70 + Math.random() * 110, sp: 18 + Math.random() * 22, amp: 4 + Math.random() * 10, ph: Math.random() * 6, dir: Math.random() < 0.5 ? 1 : -1 });
  }

  draw(ctx, time, dt = 1 / 60) {
    if (!this.ready) this._build();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.sky, 0, 0);
    // stars twinkle
    for (const s of this.stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(time * (0.6 + s.b) + s.p));
      ctx.fillStyle = `rgba(230,220,255,${(a * (0.4 + s.b * 0.6)).toFixed(2)})`;
      ctx.fillRect(s.x, s.y, 1, 1);
    }
    // soft clouds drifting slowly across the moon (painted once, see paintCloud)
    if (!this.clouds) this.clouds = [paintCloud(150, 1), paintCloud(110, 2), paintCloud(180, 3)];
    for (let k = 0; k < 3; k++) {
      const cl = this.clouds[k];
      const cx = ((time * (3 + k * 1.5) + k * 260) % (W + cl.width + 40)) - cl.width - 20;
      ctx.drawImage(cl, Math.round(cx), 40 + k * 26);
    }
    // distant lightning: the sky flashes, a bolt cracks behind the mountains
    this.nextBolt -= dt;
    if (this.nextBolt <= 0) {
      if (!VISUAL.calm) this.flash = 0.35; // (no lightning with Reduce Flashing)
      this.boltX = 40 + Math.random() * 160;
      this.nextBolt = 10 + Math.random() * 14;
    }
    if (this.flash > 0) {
      this.flash -= dt;
      const on = this.flash > 0.24 || (this.flash > 0.08 && this.flash < 0.16);
      if (on) {
        ctx.fillStyle = 'rgba(170,150,220,0.16)';
        ctx.fillRect(0, 0, W, 240);
        ctx.fillStyle = '#e8e0ff';
        let x = this.boltX;
        for (let y = 90; y < 210; y += 3) {
          x += Math.round((Math.sin(y * 1.7 + this.boltX) + (y % 9 === 0 ? 1.5 : 0)) * 2);
          ctx.fillRect(x, y, 1, 3);
        }
      }
    }
    ctx.drawImage(this.mountains, 0, 0);
    // mist behind the castle
    this._mist(ctx, time, 226, 0.1, 6);
    ctx.drawImage(this.castle, 0, 0);
    // candlelit windows flicker
    for (const w of this.windows) {
      const f = 0.65 + 0.35 * Math.sin(time * w.sp + w.ph) * Math.sin(time * w.sp * 0.37 + w.ph * 2);
      ctx.fillStyle = w.gate ? `rgba(255,120,40,${(0.5 * f).toFixed(2)})` : f > 0.9 ? '#ffd27a' : f > 0.6 ? '#f0a040' : '#b0601c';
      ctx.fillRect(w.x, w.y, 2, w.gate ? 2 : 4);
    }
    ctx.drawImage(this.forestFar, 0, 0);
    this._mist(ctx, time, 268, 0.14, 9);
    ctx.drawImage(this.forestMid, 0, 0);
    this._mist(ctx, time * 1.4, 300, 0.1, 7);
    ctx.drawImage(this.foreground, 0, 0);
    // bats
    for (const b of this.bats) {
      b.x += b.sp * b.dir * dt;
      const y = Math.round(b.y + Math.sin(time * 2 + b.ph) * b.amp);
      const frame = BAT[Math.floor(time * 10 + b.ph) % 2];
      ctx.fillStyle = '#05030a';
      frame.forEach((row, ry) => {
        for (let rx = 0; rx < 4; rx++) if (row[rx] === '#') ctx.fillRect(Math.round(b.x) + rx, y + ry, 1, 1);
      });
    }
    for (let i = this.bats.length - 1; i >= 0; i--) {
      const b = this.bats[i];
      if (b.x < -20 || b.x > W + 20) {
        this.bats.splice(i, 1);
        const dir = Math.random() < 0.5 ? 1 : -1;
        this._newBat(dir > 0 ? -10 : W + 10);
        this.bats[this.bats.length - 1].dir = dir;
      }
    }
  }

  /** A band of mist drifting sideways. */
  _mist(ctx, time, y, alpha, h) {
    for (let k = 0; k < 3; k++) {
      const off = ((time * (6 + k * 3)) % 220) - 110;
      for (let x = -120; x < W + 120; x += 220) {
        const cx = x + off + k * 70;
        for (let i = 0; i < h; i++) {
          const w = 150 - Math.abs(i - h / 2) * 14;
          ctx.fillStyle = `rgba(150,130,180,${(alpha * (1 - Math.abs(i - h / 2) / h)).toFixed(3)})`;
          ctx.fillRect(Math.round(cx - w / 2), y + i + k * 3, Math.round(w), 1);
        }
      }
    }
  }
}
