import { MINIMAP, FLOOR, RENDER } from '../data/config.js';

// The minimap in the top-right corner. Rooms appear once seen (next to a room you've been in)
// and light up once visited. Special rooms get tiny icons.

const ICONS = {
  boss: { color: '#d8343c', rows: ['.###.', '#.#.#', '#####', '.###.', '.#.#.'] }, // skull
  armoury: { color: '#e2c46c', rows: ['.....', '#.#.#', '#####', '#####', '.....'] }, // crown
  merchant: { color: '#dcdee6', rows: ['.#.#.', '..#..', '.###.', '#####', '.###.'] }, // coin purse
  secret: { color: '#a898e8', rows: ['.###.', '...#.', '..#..', '.....', '..#..'] }, // ?
  supersecret: { color: '#e898d8', rows: ['.###.', '...#.', '..#..', '.....', '..#..'] },
  shrine: { color: '#c02634', rows: ['#...#', '##.##', '.###.', '.#.#.', '.###.'] }, // horned skull
  chapel: { color: '#f0d880', rows: ['..#..', '#####', '..#..', '..#..', '..#..'] }, // cross
  trial: { color: '#e05a3a', rows: ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'] }, // crossed blades
  den: { color: '#d0c090', rows: ['#####', '#.#.#', '#####', '#.#.#', '#####'] }, // dice
  crown: { color: '#b070ff', rows: ['#.#.#', '#####', '#####', '.....', '.....'] },
};

const COLORS = {
  current: '#ece4d2',
  visited: '#77705f',
  seen: '#2f3038',
  seenEdge: '#4a4b55',
};

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
  const ox = RENDER.width - MINIMAP.margin - w;
  const oy = MINIMAP.margin;
  ctx.fillStyle = 'rgba(5,4,8,0.6)';
  ctx.fillRect(ox - 3, oy - 3, w + 6, h + 6);

  for (const room of floor.rooms) {
    // (secret rooms only become "seen" once their wall has been opened)
    if (!revealAll && !room.visited && !room.seen) continue;
    const current = room.id === currentId;
    ctx.fillStyle = current ? COLORS.current : room.visited ? COLORS.visited : COLORS.seen;
    for (const c of room.cells) {
      const x = ox + c.x * pw;
      const y = oy + c.y * ph;
      ctx.fillRect(x, y, MINIMAP.cellW, MINIMAP.cellH);
      // join the cells of a large room so it reads as one shape
      if (inRoom(room, c.x + 1, c.y)) ctx.fillRect(x + MINIMAP.cellW, y, MINIMAP.gap, MINIMAP.cellH);
      if (inRoom(room, c.x, c.y + 1)) ctx.fillRect(x, y + MINIMAP.cellH, MINIMAP.cellW, MINIMAP.gap);
      if (inRoom(room, c.x + 1, c.y) && inRoom(room, c.x, c.y + 1) && inRoom(room, c.x + 1, c.y + 1)) {
        ctx.fillRect(x + MINIMAP.cellW, y + MINIMAP.cellH, MINIMAP.gap, MINIMAP.gap);
      }
    }
    if (!room.visited && !current) {
      // unexplored rooms get a faint outline
      ctx.fillStyle = COLORS.seenEdge;
      for (const c of room.cells) {
        const x = ox + c.x * pw;
        const y = oy + c.y * ph;
        ctx.fillRect(x, y, MINIMAP.cellW, 1);
      }
    }
    const icon = ICONS[room.type];
    if (icon) {
      const c = room.cells[0];
      const ix = ox + c.x * pw + Math.floor((MINIMAP.cellW - 5) / 2);
      const iy = oy + c.y * ph;
      ctx.fillStyle = icon.color;
      icon.rows.forEach((row, ry) => {
        for (let rx = 0; rx < 5; rx++) if (row[rx] === '#') ctx.fillRect(ix + rx, iy + ry, 1, 1);
      });
    }
  }
  return { x: ox, y: oy, w, h };
}
