import { MINIMAP, FLOOR, RENDER } from '../data/config.js';

// The map in the top-right corner: a cartographer's scrap of parchment, inked as you explore.
//   explored rooms    a sepia wash inside an ink outline
//   glimpsed rooms    (next to one you've been in) a dotted ink outline, nothing inside
//   corridors         inked between rooms whose doorway you know
//   you               a red wax seal
//   special rooms     a little ink mark (a skull for the boss, a crown for the armoury...)

const ICONS = {
  boss: { color: '#7a0e12', rows: ['.###.', '#.#.#', '#####', '.###.', '.#.#.'] }, // skull
  armoury: { color: '#8a6210', rows: ['.....', '#.#.#', '#####', '#####', '.....'] }, // crown
  merchant: { color: '#3a2a14', rows: ['.#.#.', '..#..', '.###.', '#####', '.###.'] }, // coin purse
  secret: { color: '#3a2a6a', rows: ['.###.', '...#.', '..#..', '.....', '..#..'] }, // ?
  supersecret: { color: '#6a1a5a', rows: ['.###.', '...#.', '..#..', '.....', '..#..'] },
  shrine: { color: '#7a0e12', rows: ['#...#', '##.##', '.###.', '.#.#.', '.###.'] }, // horned skull
  chapel: { color: '#8a6210', rows: ['..#..', '#####', '..#..', '..#..', '..#..'] }, // cross
  trial: { color: '#7a2a10', rows: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'] }, // crossed blades
  den: { color: '#3a2a14', rows: ['#####', '#.#.#', '#####', '#.#.#', '#####'] }, // dice
  crown: { color: '#4a1a7a', rows: ['#.#.#', '#####', '#####', '.....', '.....'] },
};

const INK = '#2e1c0c';
const INK_FAINT = 'rgba(46,28,12,0.55)';
const WASH = '#a88a5c';
const WASH_HERE = '#c8ac7a';
const SEAL = ['#5a0810', '#a01822', '#d84a40'];

// the parchment itself is painted once per size and kept
let parchment = null;

function makeParchment(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const d = img.data;
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // distance to the nearest edge, roughened so the edge looks torn and burnt
      const edge = Math.min(x, y, w - 1 - x, h - 1 - y) + (rnd() - 0.5) * 2.2;
      const i = (y * w + x) * 4;
      if (edge < 0.4) continue; // torn away
      const n = rnd() * 18 - 9;
      let r = 206 + n;
      let gg = 184 + n;
      let b = 136 + n * 0.8;
      // age: darker toward the edges, a scorched rim
      const k = Math.min(1, edge / 7);
      r = r * (0.55 + 0.45 * k);
      gg = gg * (0.48 + 0.52 * k);
      b = b * (0.4 + 0.6 * k);
      if (edge < 1.6) {
        r = 70;
        gg = 40;
        b = 20;
      }
      d[i] = r;
      d[i + 1] = gg;
      d[i + 2] = b;
      d[i + 3] = 255;
    }
  }
  // a couple of old stains
  for (let s = 0; s < 3; s++) {
    const cx = 8 + rnd() * (w - 16);
    const cy = 8 + rnd() * (h - 16);
    const rad = 3 + rnd() * 5;
    for (let y = Math.floor(cy - rad); y < cy + rad; y++) {
      for (let x = Math.floor(cx - rad); x < cx + rad; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > rad * rad || x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = (y * w + x) * 4;
        if (!d[i + 3]) continue;
        d[i] *= 0.9;
        d[i + 1] *= 0.86;
        d[i + 2] *= 0.8;
      }
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

function inRoom(room, x, y) {
  return room.cells.some((c) => c.x === x && c.y === y);
}

export function minimapSize() {
  const pw = MINIMAP.cellW + MINIMAP.gap;
  const ph = MINIMAP.cellH + MINIMAP.gap;
  return { w: FLOOR.gridW * pw - MINIMAP.gap, h: FLOOR.gridH * ph - MINIMAP.gap, pw, ph };
}

export function drawMinimap(ctx, floor, currentId, revealAll) {
  const { w, h, pw, ph } = minimapSize();
  const pad = 4;
  const ox = RENDER.width - MINIMAP.margin - w - pad;
  const oy = MINIMAP.margin + pad;
  if (!parchment || parchment.width !== w + pad * 2) parchment = makeParchment(w + pad * 2, h + pad * 2);
  ctx.drawImage(parchment, ox - pad, oy - pad);

  const shown = (room) => revealAll || room.visited || room.seen;
  const cellX = (c) => ox + c.x * pw;
  const cellY = (c) => oy + c.y * ph;

  // corridors first, so the rooms sit on top of them
  ctx.fillStyle = INK;
  for (const conn of floor.connections) {
    if (conn.hidden && !revealAll) continue;
    const a = floor.rooms[conn.a];
    const b = floor.rooms[conn.b];
    if (!shown(a) || !shown(b) || (!a.visited && !b.visited && !revealAll)) continue;
    const c = conn.cellA;
    const x = cellX(c);
    const y = cellY(c);
    if (conn.sideA === 'right') ctx.fillRect(x + MINIMAP.cellW, y + Math.floor(MINIMAP.cellH / 2), MINIMAP.gap, 1);
    else if (conn.sideA === 'down') ctx.fillRect(x + Math.floor(MINIMAP.cellW / 2), y + MINIMAP.cellH, 1, MINIMAP.gap);
    else if (conn.sideA === 'left') ctx.fillRect(x - MINIMAP.gap, y + Math.floor(MINIMAP.cellH / 2), MINIMAP.gap, 1);
    else ctx.fillRect(x + Math.floor(MINIMAP.cellW / 2), y - MINIMAP.gap, 1, MINIMAP.gap);
  }

  for (const room of floor.rooms) {
    if (!shown(room)) continue;
    const current = room.id === currentId;
    const explored = room.visited || current;
    for (const c of room.cells) {
      const x = cellX(c);
      const y = cellY(c);
      // a large room is one shape: extend into the gaps toward its own other cells
      const r = inRoom(room, c.x + 1, c.y) ? MINIMAP.gap : 0;
      const dn = inRoom(room, c.x, c.y + 1) ? MINIMAP.gap : 0;
      if (explored) {
        ctx.fillStyle = current ? WASH_HERE : WASH;
        ctx.fillRect(x, y, MINIMAP.cellW + r, MINIMAP.cellH + dn);
      }
      // the outline: solid ink when explored, dotted when only glimpsed
      ctx.fillStyle = explored ? INK : INK_FAINT;
      const W = MINIMAP.cellW;
      const H = MINIMAP.cellH;
      const dot = (px, py) => {
        if (explored || (px + py) % 2 === 0) ctx.fillRect(px, py, 1, 1);
      };
      if (!inRoom(room, c.x, c.y - 1)) for (let i = 0; i < W + r; i++) dot(x + i, y);
      if (!inRoom(room, c.x, c.y + 1)) for (let i = 0; i < W + r; i++) dot(x + i, y + H - 1);
      if (!inRoom(room, c.x - 1, c.y)) for (let i = 0; i < H + dn; i++) dot(x, y + i);
      if (!inRoom(room, c.x + 1, c.y)) for (let i = 0; i < H + dn; i++) dot(x + W - 1, y + i);
    }
    // a special room's ink mark
    const icon = ICONS[room.type];
    if (icon) {
      const c = room.cells[0];
      const ix = cellX(c) + Math.floor((MINIMAP.cellW - 5) / 2);
      const iy = cellY(c) + Math.floor((MINIMAP.cellH - 5) / 2);
      ctx.fillStyle = icon.color;
      icon.rows.forEach((row, ry) => {
        for (let rx = 0; rx < 5; rx++) if (row[rx] === '#') ctx.fillRect(ix + rx, iy + ry, 1, 1);
      });
    }
    // you are here: a red wax seal
    if (current && !icon) {
      const c = room.cells[0];
      const sx = cellX(c) + Math.floor(MINIMAP.cellW / 2) - 1;
      const sy = cellY(c) + Math.floor(MINIMAP.cellH / 2) - 1;
      ctx.fillStyle = SEAL[1];
      ctx.fillRect(sx, sy - 1, 3, 5);
      ctx.fillRect(sx - 1, sy, 5, 3);
      ctx.fillStyle = SEAL[0];
      ctx.fillRect(sx + 1, sy + 1, 1, 1);
      ctx.fillStyle = SEAL[2];
      ctx.fillRect(sx, sy, 1, 1);
    } else if (current) {
      // in a special room the seal sits in its corner, beside the mark
      const c = room.cells[0];
      ctx.fillStyle = SEAL[1];
      ctx.fillRect(cellX(c) + MINIMAP.cellW - 3, cellY(c) + 1, 2, 2);
    }
  }
  return { x: ox - pad, y: oy - pad, w: w + pad * 2, h: h + pad * 2 };
}
