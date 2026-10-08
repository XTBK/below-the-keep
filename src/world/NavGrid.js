import { ROOM } from '../data/config.js';

// Pathfinding and line of sight for one room, on its grid of 32 px slots.
//
// Pathfinding uses a "flow field": every time Wren steps onto a new slot we flood-fill the room
// from his slot, counting steps. An enemy just moves to whichever neighbouring slot has a smaller
// count, so walking enemies go around rocks, pits and barrels. One flood fill serves every enemy.
// All arrays are allocated once per room - nothing is allocated while playing.

const T = ROOM.tile;
const WALK_BLOCK = new Set(['r', 'B', 'A', 'M', 'S', 'p', 'G', 'Y', 'H', 'L', 'Z', 'W', 'X', 'T', 'D', 'N']);
const SIGHT_BLOCK = new Set(['r', 'B', 'A', 'M', 'S', 'G', 'Y', 'H', 'L', 'Z', 'W', 'X']); // pits don't block sight or stones
const NEIGHBOURS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export class NavGrid {
  constructor(room) {
    this.room = room;
    this.gw = room.gw;
    this.gh = room.gh;
    const n = this.gw * this.gh;
    this.walkBlocked = new Uint8Array(n);
    this.sightBlocked = new Uint8Array(n);
    this.dist = new Int16Array(n);
    this.queue = new Int32Array(n);
    this.dirty = true;
    this.tc = -1;
    this.tr = -1;
    this.targetX = 0;
    this.targetY = 0;
  }

  markDirty() {
    this.dirty = true;
  }

  slotOf(x, y) {
    return {
      c: Math.floor((x - this.room.rect.x0) / T),
      r: Math.floor((this.room.rect.y1 - y) / T),
    };
  }

  _rebuild() {
    const { room, gw, gh } = this;
    for (let r = 0; r < gh; r++) {
      for (let c = 0; c < gw; c++) {
        const i = r * gw + c;
        const t = room.tileAt(c, r);
        const wall = !room.isFloor(c, r);
        this.walkBlocked[i] = wall || WALK_BLOCK.has(t) ? 1 : 0;
        this.sightBlocked[i] = wall || SIGHT_BLOCK.has(t) ? 1 : 0;
      }
    }
    // rocks destroyed by bombs no longer block
    for (const k of room.data.destroyed) {
      const [c, r] = k.split(',').map(Number);
      if (room.tileAt(c, r) === 'r') {
        this.walkBlocked[r * gw + c] = 0;
        this.sightBlocked[r * gw + c] = 0;
      }
    }
    // intact barrels block both
    for (const p of room.props) {
      if (p.broken) continue;
      const [c, r] = p.tileKey.split(',').map(Number);
      this.walkBlocked[r * gw + c] = 1;
      this.sightBlocked[r * gw + c] = 1;
    }
    this.dirty = false;
  }

  /** Recompute the flow field toward (x, y) if the target changed slot (or the room changed). */
  update(x, y) {
    this.targetX = x;
    this.targetY = y;
    const force = this.dirty;
    if (this.dirty) this._rebuild();
    const c0 = Math.floor((x - this.room.rect.x0) / T);
    const r0 = Math.floor((this.room.rect.y1 - y) / T);
    if (!force && c0 === this.tc && r0 === this.tr) return;
    this.tc = c0;
    this.tr = r0;
    const { gw, gh, dist, queue, walkBlocked } = this;
    dist.fill(-1);
    if (c0 < 0 || r0 < 0 || c0 >= gw || r0 >= gh) return;
    let head = 0;
    let tail = 0;
    dist[r0 * gw + c0] = 0;
    queue[tail++] = r0 * gw + c0;
    while (head < tail) {
      const i = queue[head++];
      const c = i % gw;
      const r = (i - c) / gw;
      for (let k = 0; k < 4; k++) {
        const nc = c + NEIGHBOURS[k][0];
        const nr = r + NEIGHBOURS[k][1];
        if (nc < 0 || nr < 0 || nc >= gw || nr >= gh) continue;
        const j = nr * gw + nc;
        if (dist[j] >= 0 || walkBlocked[j]) continue;
        dist[j] = dist[i] + 1;
        queue[tail++] = j;
      }
    }
  }

  /**
   * Direction an enemy at (x, y) should walk to reach the target. Writes a unit vector into out.
   * Falls back to a straight line when already close or when no path exists.
   */
  dirTo(x, y, out) {
    const { gw, gh, dist, walkBlocked } = this;
    const c = Math.floor((x - this.room.rect.x0) / T);
    const r = Math.floor((this.room.rect.y1 - y) / T);
    let tx = this.targetX;
    let ty = this.targetY;
    const here = c >= 0 && r >= 0 && c < gw && r < gh ? dist[r * gw + c] : -1;
    if (here > 1) {
      let best = here;
      let bc = -1;
      let br = -1;
      for (let k = 0; k < 8; k++) {
        const nc = c + NEIGHBOURS[k][0];
        const nr = r + NEIGHBOURS[k][1];
        if (nc < 0 || nr < 0 || nc >= gw || nr >= gh) continue;
        const d = dist[nr * gw + nc];
        if (d < 0 || d >= best) continue;
        // no cutting corners past blocked slots
        if (k >= 4 && (walkBlocked[r * gw + nc] || walkBlocked[nr * gw + c])) continue;
        best = d;
        bc = nc;
        br = nr;
      }
      if (bc >= 0) {
        tx = this.room.rect.x0 + bc * T + T / 2;
        ty = this.room.rect.y1 - br * T - T / 2;
      }
    }
    const dx = tx - x;
    const dy = ty - y;
    const len = Math.hypot(dx, dy) || 1;
    out.x = dx / len;
    out.y = dy / len;
    return out;
  }

  _sightBlockedAt(x, y) {
    const c = Math.floor((x - this.room.rect.x0) / T);
    const r = Math.floor((this.room.rect.y1 - y) / T);
    if (c < 0 || r < 0 || c >= this.gw || r >= this.gh) return true;
    return this.sightBlocked[r * this.gw + c] === 1;
  }

  /** Can something at (x0, y0) see (x1, y1)? */
  lineOfSight(x0, y0, x1, y1) {
    if (this.dirty) this._rebuild();
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.ceil(Math.hypot(dx, dy) / 6);
    for (let i = 1; i < steps; i++) {
      if (this._sightBlockedAt(x0 + (dx * i) / steps, y0 + (dy * i) / steps)) return false;
    }
    return true;
  }

  /** March from (x, y) along a unit direction until something blocks it; writes the end point into out. */
  raycast(x, y, dirX, dirY, maxDist, out) {
    if (this.dirty) this._rebuild();
    let d = 0;
    while (d < maxDist) {
      const nx = x + dirX * (d + 4);
      const ny = y + dirY * (d + 4);
      if (this._sightBlockedAt(nx, ny)) break;
      d += 4;
    }
    out.x = x + dirX * d;
    out.y = y + dirY * d;
    return out;
  }

  isWalkable(x, y) {
    if (this.dirty) this._rebuild();
    const { c, r } = this.slotOf(x, y);
    if (c < 0 || r < 0 || c >= this.gw || r >= this.gh) return false;
    return this.walkBlocked[r * this.gw + c] === 0;
  }
}
