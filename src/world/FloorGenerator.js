import { FLOOR } from '../data/config.js';

// Builds the map of one floor (which grid cells are rooms, what each room is, how they connect).
// It does NOT create any graphics; Room.js builds a room's visuals when you walk into it.
//
// The algorithm (see GAME_DESIGN.md section 5):
//  1. 9x8 grid. Room count = random(0..1) + 5 + floor * 2.6.
//  2. Start room in the centre, put it in a queue. For each queued cell try its 4 neighbours.
//     Skip a neighbour if: it is already a room / it already has more than one room next to it /
//     we have enough rooms / a 50% coin flip. Otherwise make it a room and queue it.
//  3. Rooms with only one neighbour are dead ends. The boss goes in the dead end farthest from
//     the start (never next to it). If the rules can't be met, throw it away and try again.
//  4. Other dead ends get the Armoury and the Merchant.
//  5. Secret room: an empty cell touching 3+ rooms, none of which are dead ends.
//     Super-secret room: an empty cell touching exactly one ordinary room.
//  6. Some ordinary rooms are merged into large shapes (2x1, 1x2, 2x2, L).
//
// Every random choice uses the seeded rng, so the same seed always builds the same floor.

const DIRS = [
  { dx: 0, dy: -1, side: 'up', opposite: 'down' },
  { dx: 1, dy: 0, side: 'right', opposite: 'left' },
  { dx: 0, dy: 1, side: 'down', opposite: 'up' },
  { dx: -1, dy: 0, side: 'left', opposite: 'right' },
];
export { DIRS };

const SPECIAL_DEAD_END_TYPES = new Set(['boss', 'armoury', 'merchant', 'trial', 'den']);

/**
 * @returns {Floor} {
 *   number, rooms: Room[], grid: Int16Array (room index per cell, -1 = empty),
 *   connections: Connection[], startId, bossId, attempts
 * }
 * Room: { id, type, cells: [{x,y}], minX, minY, w, h, distance, layouts: Map(cellKey -> layout name),
 *         visited, seen, cleared, destroyed: Set }
 * Connection: { id, a, b, cellA, cellB, sideA, sideB, kind, locked, hidden, hint }
 */
export function generateFloor(rng, floorNumber, layoutPicker, sizeAs = floorNumber) {
  for (let attempt = 1; attempt <= FLOOR.maxAttempts; attempt++) {
    const floor = tryGenerate(rng, floorNumber, sizeAs);
    if (floor) {
      floor.attempts = attempt;
      assignLayouts(floor, rng, layoutPicker);
      return floor;
    }
  }
  throw new Error('Floor generation failed: the rules in FLOOR (src/data/config.js) may be impossible to satisfy.');
}

function tryGenerate(rng, floorNumber, sizeAs) {
  const W = FLOOR.gridW;
  const H = FLOOR.gridH;
  const occupied = new Uint8Array(W * H);
  const idx = (x, y) => y * W + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const isRoom = (x, y) => inside(x, y) && occupied[idx(x, y)] === 1;
  const roomNeighbours = (x, y) => {
    let n = 0;
    for (const d of DIRS) if (isRoom(x + d.dx, y + d.dy)) n++;
    return n;
  };

  // --- step 1 + 2: grow the floor from the start room ---
  const target = Math.min(FLOOR.maxRooms, Math.floor(rng.int(0, 1) + FLOOR.baseRooms + sizeAs * FLOOR.roomsPerFloor));
  const start = { x: FLOOR.startX, y: FLOOR.startY };
  occupied[idx(start.x, start.y)] = 1;
  let count = 1;
  const queue = [start];
  let restarts = 0;
  while (count < target) {
    if (queue.length === 0) {
      // ran out of cells to grow from before reaching the target: grow again from the start
      if (++restarts > FLOOR.maxRestarts) return null;
      queue.push(start);
    }
    const cell = queue.shift();
    for (const d of DIRS) {
      const nx = cell.x + d.dx;
      const ny = cell.y + d.dy;
      if (!inside(nx, ny)) continue;
      if (occupied[idx(nx, ny)]) continue; // already a room
      if (roomNeighbours(nx, ny) > 1) continue; // would touch more than one room
      if (count >= target) continue; // enough rooms
      if (rng.chance(FLOOR.skipChance)) continue; // 50% coin flip
      occupied[idx(nx, ny)] = 1;
      count++;
      queue.push({ x: nx, y: ny });
    }
  }

  // --- distances from the start (walking through rooms) ---
  const dist = new Int16Array(W * H).fill(-1);
  dist[idx(start.x, start.y)] = 0;
  const bfs = [start];
  while (bfs.length) {
    const c = bfs.shift();
    for (const d of DIRS) {
      const nx = c.x + d.dx;
      const ny = c.y + d.dy;
      if (!isRoom(nx, ny) || dist[idx(nx, ny)] >= 0) continue;
      dist[idx(nx, ny)] = dist[idx(c.x, c.y)] + 1;
      bfs.push({ x: nx, y: ny });
    }
  }

  // --- step 3: dead ends and the boss ---
  const deadEnds = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!isRoom(x, y) || (x === start.x && y === start.y)) continue;
      if (roomNeighbours(x, y) === 1) deadEnds.push({ x, y, d: dist[idx(x, y)] });
    }
  }
  if (deadEnds.length < 3) return null; // need boss + armoury + merchant
  // farthest first; ties broken by the seeded rng
  for (const de of deadEnds) de.tie = rng.next();
  deadEnds.sort((a, b) => b.d - a.d || a.tie - b.tie);
  const bossCell = deadEnds[0];
  if (bossCell.d <= 1) return null; // the boss may never be next to the start

  // cell -> type
  const type = new Array(W * H).fill(null);
  for (let i = 0; i < W * H; i++) if (occupied[i]) type[i] = 'normal';
  type[idx(start.x, start.y)] = 'start';
  type[idx(bossCell.x, bossCell.y)] = 'boss';

  // --- step 4: armoury and merchant in other dead ends ---
  const others = deadEnds.slice(1);
  shuffle(others, rng);
  type[idx(others[0].x, others[0].y)] = 'armoury';
  type[idx(others[1].x, others[1].y)] = 'merchant';
  // more dead ends may hold a Trial Chamber and a Gambler's Den
  if (others[2] && rng.chance(FLOOR.trialChance)) type[idx(others[2].x, others[2].y)] = 'trial';
  if (others[3] && rng.chance(FLOOR.denChance)) type[idx(others[3].x, others[3].y)] = 'den';

  // --- step 6: merge some ordinary rooms into large shapes ---
  const group = new Int16Array(W * H).fill(-1); // which room each cell belongs to
  const rooms = [];
  const makeRoom = (cells, t) => {
    const id = rooms.length;
    for (const c of cells) group[idx(c.x, c.y)] = id;
    const xs = cells.map((c) => c.x);
    const ys = cells.map((c) => c.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const room = {
      id,
      type: t,
      cells,
      minX,
      minY,
      w: Math.max(...xs) - minX + 1,
      h: Math.max(...ys) - minY + 1,
      distance: Math.min(...cells.map((c) => dist[idx(c.x, c.y)])),
      layouts: new Map(),
      visited: false,
      seen: false,
      cleared: false,
      destroyed: new Set(), // tiles whose props have been broken (so they stay broken)
      connections: [],
    };
    rooms.push(room);
    return room;
  };

  const isFreeNormal = (x, y) => isRoom(x, y) && type[idx(x, y)] === 'normal' && group[idx(x, y)] === -1;
  const normalCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isFreeNormal(x, y)) normalCells.push({ x, y });
  shuffle(normalCells, rng);
  for (const c of normalCells) {
    if (group[idx(c.x, c.y)] !== -1 || !rng.chance(FLOOR.largeRoomChance)) continue;
    const shapes = weightedOrder(FLOOR.largeShapes, rng);
    for (const shape of shapes) {
      const cells = tryShape(shape, c, rng, { isFreeNormal, isRoom, inside, type, idx, dist, occupied });
      if (cells) {
        // a filled-in empty cell (for 2x2) becomes part of the floor
        for (const k of cells) {
          occupied[idx(k.x, k.y)] = 1;
          type[idx(k.x, k.y)] = 'normal';
          if (dist[idx(k.x, k.y)] < 0) dist[idx(k.x, k.y)] = 99;
        }
        makeRoom(cells, 'normal');
        break;
      }
    }
  }
  // everything not merged is its own 1x1 room
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isRoom(x, y) && group[idx(x, y)] === -1) makeRoom([{ x, y }], type[idx(x, y)]);
    }
  }

  // --- step 5: secret room ---
  const deadEndRoomIds = new Set(rooms.filter((r) => SPECIAL_DEAD_END_TYPES.has(r.type)).map((r) => r.id));
  const emptyCandidates = (test) => {
    const out = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (isRoom(x, y)) continue;
        const neighbourRooms = new Set();
        let touchesDeadEnd = false;
        for (const d of DIRS) {
          if (!isRoom(x + d.dx, y + d.dy)) continue;
          const g = group[idx(x + d.dx, y + d.dy)];
          neighbourRooms.add(g);
          if (deadEndRoomIds.has(g)) touchesDeadEnd = true;
        }
        if (test(neighbourRooms, touchesDeadEnd, x, y)) out.push({ x, y, n: neighbourRooms.size, tie: rng.next() });
      }
    }
    return out;
  };
  let secretCands = emptyCandidates((n, dead) => n.size >= FLOOR.secretMinNeighbours && !dead);
  if (secretCands.length === 0) secretCands = emptyCandidates((n, dead) => n.size >= 2 && !dead);
  if (secretCands.length === 0) return null;
  secretCands.sort((a, b) => b.n - a.n || a.tie - b.tie);
  const secretCell = secretCands[0];
  occupied[idx(secretCell.x, secretCell.y)] = 1;
  type[idx(secretCell.x, secretCell.y)] = 'secret';
  makeRoom([{ x: secretCell.x, y: secretCell.y }], 'secret');

  // --- super-secret room: touches exactly one ordinary room, and not the secret room ---
  const superCands = emptyCandidates((n, dead, x, y) => {
    if (n.size !== 1 || dead) return false;
    const only = rooms[[...n][0]];
    if (only.type !== 'normal') return false;
    return Math.abs(x - secretCell.x) + Math.abs(y - secretCell.y) > 1;
  });
  if (superCands.length > 0) {
    const s = superCands[Math.floor(rng.next() * superCands.length)];
    occupied[idx(s.x, s.y)] = 1;
    type[idx(s.x, s.y)] = 'supersecret';
    makeRoom([{ x: s.x, y: s.y }], 'supersecret');
  }

  // --- the altar room: sealed, beside the boss. Beating the boss may open it (a Shrine of the Old
  // God, or a Chapel); on the last floor it hides the way to the Hollow Crown. ---
  const altarCands = emptyCandidates((n, dead, x, y) => n.size === 1 && group[idx(x, y)] === -1 && [...n][0] === group[idx(bossCell.x, bossCell.y)]);
  if (altarCands.length > 0) {
    const a = altarCands[Math.floor(rng.next() * altarCands.length)];
    occupied[idx(a.x, a.y)] = 1;
    type[idx(a.x, a.y)] = 'altar';
    makeRoom([{ x: a.x, y: a.y }], 'altar');
  }

  // --- connections: one per shared cell edge between two different rooms ---
  const connections = [];
  for (const room of rooms) {
    for (const c of room.cells) {
      for (const d of DIRS) {
        if (d.side !== 'right' && d.side !== 'down') continue; // each edge once
        const nx = c.x + d.dx;
        const ny = c.y + d.dy;
        if (!isRoom(nx, ny)) continue;
        const other = rooms[group[idx(nx, ny)]];
        if (other.id === room.id) continue;
        const types = [room.type, other.type];
        let kind = 'normal';
        if (types.includes('secret') || types.includes('supersecret')) kind = 'secret';
        else if (types.includes('altar') && !types.includes('boss')) continue; // the altar only opens off the boss room
        else if (types.includes('boss') || types.includes('trial')) kind = 'boss'; // (a trial's door looks just as grim)
        else if (types.includes('armoury')) kind = 'armoury';
        const conn = {
          id: connections.length,
          a: room.id,
          b: other.id,
          cellA: c,
          cellB: { x: nx, y: ny },
          sideA: d.side,
          sideB: d.opposite,
          kind,
          locked: kind === 'armoury', // needs a key from outside
          hidden: kind === 'secret' || types.includes('altar'), // must be blasted open (bombs, Phase 4)
          hint: types.includes('secret'), // secret rooms show a crack; super-secret rooms show nothing
          sealed: types.includes('altar'), // no bomb opens it: only beating the boss (or the Seals)
          illusory: false, // a wall you can simply walk through
        };
        connections.push(conn);
        room.connections.push(conn);
        other.connections.push(conn);
      }
    }
  }

  // --- an illusory wall: an ordinary doorway that looks like solid wall. Only ever a SHORTCUT (a
  // doorway the floor can do without), so it never hides the way forward. ---
  if (rng.chance(FLOOR.illusoryChance)) {
    const cands = connections.filter((c) => c.kind === 'normal' && rooms[c.a].type === 'normal' && rooms[c.b].type === 'normal');
    shuffle(cands, rng);
    for (const c of cands) {
      if (!stillConnected(rooms, connections, c)) continue;
      c.hidden = true;
      c.illusory = true;
      break;
    }
  }

  const startRoom = rooms[group[idx(start.x, start.y)]];
  const bossRoom = rooms[group[idx(bossCell.x, bossCell.y)]];
  return {
    number: floorNumber,
    rooms,
    grid: group,
    connections,
    startId: startRoom.id,
    bossId: bossRoom.id,
    targetRooms: target,
  };
}

/** Try to grow a large room of `shape` that includes cell c. Returns its cells or null. */
function tryShape(shape, c, rng, g) {
  const { isFreeNormal, isRoom, inside, type, idx } = g;
  // all placements of the shape's bounding box that include c
  const boxes = {
    '2x1': { w: 2, h: 1 },
    '1x2': { w: 1, h: 2 },
    '2x2': { w: 2, h: 2 },
    L: { w: 2, h: 2 },
  }[shape];
  const placements = [];
  for (let oy = 0; oy < boxes.h; oy++) for (let ox = 0; ox < boxes.w; ox++) placements.push({ x: c.x - ox, y: c.y - oy });
  shuffle(placements, rng);

  for (const p of placements) {
    const cells = [];
    for (let y = 0; y < boxes.h; y++) for (let x = 0; x < boxes.w; x++) cells.push({ x: p.x + x, y: p.y + y });
    if (!cells.every((k) => inside(k.x, k.y))) continue;

    if (shape === '2x1' || shape === '1x2') {
      if (cells.every((k) => isFreeNormal(k.x, k.y))) return cells;
    } else if (shape === 'L') {
      // three free normal cells; the fourth cell of the box must NOT be part of this room
      const free = cells.filter((k) => isFreeNormal(k.x, k.y));
      if (free.length !== 3) continue;
      const missing = cells.find((k) => !isFreeNormal(k.x, k.y));
      if (missing.x === c.x && missing.y === c.y) continue;
      return free;
    } else if (shape === '2x2') {
      const free = cells.filter((k) => isFreeNormal(k.x, k.y));
      const empty = cells.filter((k) => !isRoom(k.x, k.y));
      if (free.length === 4) return cells;
      if (free.length === 3 && empty.length === 1) {
        // fill the empty corner, but only if it doesn't touch any special room
        const e = empty[0];
        let ok = true;
        for (const d of DIRS) {
          const nx = e.x + d.dx;
          const ny = e.y + d.dy;
          if (!isRoom(nx, ny)) continue;
          if (cells.some((k) => k.x === nx && k.y === ny)) continue;
          if (type[idx(nx, ny)] !== 'normal') ok = false;
        }
        if (ok) return cells;
      }
    }
  }
  return null;
}

/** Can every ordinary room still be reached from the first room without connection `skip`? */
function stillConnected(rooms, connections, skip) {
  const open = connections.filter((c) => c !== skip && !c.hidden);
  const seen = new Set([0]);
  const stack = [0];
  while (stack.length) {
    const id = stack.pop();
    for (const c of open) {
      const other = c.a === id ? c.b : c.b === id ? c.a : -1;
      if (other >= 0 && !seen.has(other)) {
        seen.add(other);
        stack.push(other);
      }
    }
  }
  return rooms.every((r) => seen.has(r.id) || r.type === 'secret' || r.type === 'supersecret' || r.type === 'altar');
}

/** Pick a layout for every cell of every room (seeded). */
function assignLayouts(floor, rng, layoutPicker) {
  for (const room of floor.rooms) {
    for (const c of room.cells) {
      room.layouts.set(`${c.x},${c.y}`, layoutPicker(room, c, rng, floor.number));
    }
  }
}

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
  }
  return arr;
}

function weightedOrder(weights, rng) {
  const entries = Object.entries(weights).map(([k, w]) => ({ k, key: Math.pow(rng.next(), 1 / w) }));
  entries.sort((a, b) => b.key - a.key);
  return entries.map((e) => e.k);
}

/** Room of the floor at grid cell (x, y), or null. */
export function roomAt(floor, x, y) {
  if (x < 0 || y < 0 || x >= FLOOR.gridW || y >= FLOOR.gridH) return null;
  const g = floor.grid[y * FLOOR.gridW + x];
  return g >= 0 ? floor.rooms[g] : null;
}
