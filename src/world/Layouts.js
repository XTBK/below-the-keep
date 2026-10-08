import { CELLS_LAYOUTS } from '../data/rooms/cellsLayouts.js';
import { LAYOUTS_BY_CHAPTER, EXTRA_CELLS_LAYOUTS } from '../data/rooms/chapterLayouts.js';

for (const pool of ['easy', 'medium', 'hard']) CELLS_LAYOUTS[pool].push(...EXTRA_CELLS_LAYOUTS[pool]);
import { SPECIAL_LAYOUTS, SWORD_CHANCE } from '../data/rooms/specialLayouts.js';
import { FLOOR } from '../data/config.js';
import { SHAPED_LAYOUTS, ARENAS } from '../data/rooms/shapedLayouts.js';
import { GATEHOUSE_LAYOUT } from './Gatehouse.js';

// Picks a hand-made layout for each cell of each room, by room type and difficulty,
// and makes sure the chosen layout never blocks the way between that cell's doors.

const BY_CHAPTER = { cells: CELLS_LAYOUTS, ...LAYOUTS_BY_CHAPTER };
// the secret realms borrow a chapter's room shapes
BY_CHAPTER.cistern = BY_CHAPTER.cells;
BY_CHAPTER.chapel = BY_CHAPTER.catacombs;
BY_CHAPTER.forge = BY_CHAPTER.halls;
// every chapter also gets the shaped rooms (chasms, bridges, water)
for (const set of new Set(Object.values(BY_CHAPTER))) for (const pool of ['easy', 'medium', 'hard']) set[pool].push(...SHAPED_LAYOUTS[pool]);
const BY_NAME = new Map();
for (const set of new Set(Object.values(BY_CHAPTER))) {
  for (const pool of ['easy', 'medium', 'hard']) {
    for (const l of set[pool]) {
      if (BY_NAME.has(l.name) && BY_NAME.get(l.name) !== l) throw new Error(`Two room layouts are called "${l.name}"`);
      l.pool = pool; // remembered so 'e' spawns can match the room's difficulty
      BY_NAME.set(l.name, l);
    }
  }
}
for (const l of Object.values(CELLS_LAYOUTS.special)) BY_NAME.set(l.name, l);
for (const l of Object.values(SPECIAL_LAYOUTS)) BY_NAME.set(l.name, l);
for (const l of Object.values(ARENAS)) BY_NAME.set(l.name, l);
BY_NAME.set(GATEHOUSE_LAYOUT.name, GATEHOUSE_LAYOUT);
const SPECIAL = { ...CELLS_LAYOUTS.special, ...SPECIAL_LAYOUTS };

let layouts = CELLS_LAYOUTS;
let features = [];
let road = null; // the road taken to this floor (data/routes.js): harder or gentler rooms
/**
 * Which chapter's layouts the next generated floor uses, and which feature rooms (puzzle,
 * library, well, rug) it should slip in. Set by the Game before generating a floor.
 */
export function setLayoutChapter(key, featureList = [], route = null) {
  road = route;
  layouts = BY_CHAPTER[key] || CELLS_LAYOUTS;
  features = featureList.slice();
}

export function getLayout(name) {
  return BY_NAME.get(name);
}

// tiles you cannot walk through (barrels can be smashed, so they don't count)
const BLOCKING = new Set(['r', 'p', 'B', 'A', 'M', 'S', 'G', 'Y', 'H', 'L', 'Z', 'W', 'X', 'T', 'D', 'N']);

// door approach tiles inside a 13x7 layout, per side
export const DOOR_TILES = {
  up: { col: 6, row: 0 },
  down: { col: 6, row: 6 },
  left: { col: 0, row: 3 },
  right: { col: 12, row: 3 },
};

/** Can every entry tile reach every other entry tile? (flood fill over walkable tiles) */
function connects(layout, sides) {
  if (sides.length < 2) return true;
  const ok = (c, r) => c >= 0 && r >= 0 && c < 13 && r < 7 && !BLOCKING.has(layout.grid[r][c]);
  const start = DOOR_TILES[sides[0]];
  const seen = new Set([`${start.col},${start.row}`]);
  const stack = [start];
  while (stack.length) {
    const t = stack.pop();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const c = t.col + dc;
      const r = t.row + dr;
      const k = `${c},${r}`;
      if (seen.has(k) || !ok(c, r)) continue;
      seen.add(k);
      stack.push({ col: c, row: r });
    }
  }
  return sides.every((s) => seen.has(`${DOOR_TILES[s].col},${DOOR_TILES[s].row}`));
}

function weightedPool(weights, rng) {
  let total = 0;
  for (const k in weights) total += weights[k];
  let r = rng.next() * total;
  for (const k in weights) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return 'easy';
}

/**
 * Called by the floor generator for every cell of every room.
 * Returns a layout NAME (names are stored, so floors stay small and easy to debug).
 */
export function pickLayout(room, cell, rng, floorNumber) {
  if (room.type === 'supersecret' && rng.chance(SWORD_CHANCE)) return SPECIAL.supersecret_sword.name;
  if (room.type !== 'normal') return SPECIAL[room.type].name;
  // now and then an ordinary room is a feature room instead (one-cell rooms away from the start)
  if (features.length && room.cells.length === 1 && room.distance >= 2) return SPECIAL[features.shift()].name;

  // which sides of this cell lead somewhere: doors, plus openings into the rest of a large room
  const sides = [];
  for (const conn of room.connections) {
    if (conn.a === room.id && conn.cellA.x === cell.x && conn.cellA.y === cell.y) sides.push(conn.sideA);
    if (conn.b === room.id && conn.cellB.x === cell.x && conn.cellB.y === cell.y) sides.push(conn.sideB);
  }
  for (const [dx, dy, side] of [[0, -1, 'up'], [1, 0, 'right'], [0, 1, 'down'], [-1, 0, 'left']]) {
    if (room.cells.some((c) => c.x === cell.x + dx && c.y === cell.y + dy)) sides.push(side);
  }

  const diff = FLOOR.difficulty;
  let weights;
  if (room.distance <= 1 || (road && road.easy)) weights = diff.near;
  else {
    const bonus = diff.perFloorHardBonus * (floorNumber - 1) + (road && road.hard ? road.hard : 0);
    weights = { easy: Math.max(0, diff.far.easy - bonus), medium: diff.far.medium, hard: diff.far.hard + bonus };
  }

  for (let tries = 0; tries < 20; tries++) {
    const pool = layouts[weightedPool(weights, rng)];
    const layout = pool[Math.floor(rng.next() * pool.length)];
    if (connects(layout, sides)) return layout.name;
  }
  return layouts.easy[0].name; // always safe
}
