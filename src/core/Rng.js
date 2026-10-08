// Seeded random number generator (mulberry32).
// The same seed always produces the same sequence, so a run can be replayed from its seed.
// IMPORTANT: run generation must ONLY use a seeded Rng. Cosmetic effects use `fxRng`
// so that particles or flicker can never change what a seed generates.

const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789'; // no easily-confused chars (I/1, O/0, U/V)

export class Rng {
  constructor(seed = 1) {
    this.state = seed >>> 0;
  }

  /** float in [0, 1) */
  next() {
    let t = (this.state = (this.state + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** float in [min, max) */
  float(min, max) {
    return min + (max - min) * this.next();
  }

  /** integer in [min, max] (inclusive) */
  int(min, max) {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(p) {
    return this.next() < p;
  }

  /** Shuffle an array in place. */
  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = array[i];
      array[i] = array[j];
      array[j] = t;
    }
    return array;
  }

  pick(array) {
    return array[Math.floor(this.next() * array.length)];
  }

  /** derive an independent child generator (e.g. one per floor) */
  fork(label = '') {
    return new Rng(hashString(`${this.state}:${label}`));
  }
}

/** Turns any string into a 32-bit number (FNV-1a + avalanche). */
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}

/** A fresh human-friendly seed like "K7QM-3XRA". */
export function randomSeedString() {
  const buf = new Uint32Array(8);
  crypto.getRandomValues(buf);
  let s = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) s += '-';
    s += SEED_ALPHABET[buf[i] % SEED_ALPHABET.length];
  }
  return s;
}

/** Normalises a typed/pasted seed ("k7qm 3xra" -> "K7QM-3XRA"). Returns null if invalid. */
export function normaliseSeed(text) {
  if (!text) return null;
  const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== 8) return null;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

export function rngFromSeed(seedString) {
  return new Rng(hashString(seedString));
}

/** Unseeded generator for purely cosmetic randomness. */
export const fxRng = new Rng((Math.random() * 4294967296) >>> 0);
