// Object pool: every object is created once up front and reused forever,
// so the garbage collector never has to run during gameplay (no stutters).
//
// Usage:
//   const pool = new Pool(() => ({ x: 0, y: 0 }), 256);
//   const p = pool.acquire();      // null if the pool is full
//   for (let i = pool.count - 1; i >= 0; i--) { const o = pool.active[i]; ...; if (dead) pool.release(o); }
// Always iterate BACKWARDS if you release while iterating.

export class Pool {
  constructor(create, capacity) {
    this.capacity = capacity;
    this.items = new Array(capacity);
    this.active = new Array(capacity).fill(null);
    this.free = new Array(capacity);
    this.count = 0;
    for (let i = 0; i < capacity; i++) {
      const o = create(i);
      o._poolIndex = -1;
      this.items[i] = o;
      this.free[i] = o;
    }
    this.freeCount = capacity;
  }

  acquire() {
    if (this.freeCount === 0) return null;
    const o = this.free[--this.freeCount];
    o._poolIndex = this.count;
    this.active[this.count++] = o;
    return o;
  }

  release(o) {
    const i = o._poolIndex;
    if (i < 0) return;
    const last = this.active[--this.count];
    this.active[i] = last;
    last._poolIndex = i;
    this.active[this.count] = null;
    o._poolIndex = -1;
    this.free[this.freeCount++] = o;
  }

  releaseAll() {
    for (let i = this.count - 1; i >= 0; i--) this.release(this.active[i]);
  }
}
