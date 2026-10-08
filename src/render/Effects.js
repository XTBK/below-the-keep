import { PARTICLES } from '../data/config.js';
import { SHARED, CHAPTERS, CREATURES } from '../data/palettes.js';
import { fxRng } from '../core/Rng.js';
import { linearColors } from './Particles.js';

// Particle recipes. Presets are created once; spawning only copies numbers.

const P = PARTICLES;

// What floats in the air of each chapter. 'keep' systems hold a steady number of motes;
// the glowing ones are emitted at a steady rate instead.
const ATMOSPHERES = {
  dust: { keep: P.dust.count, preset: 'dust' },
  fog: { keep: 70, preset: 'fog' },
  spores: { keep: 40, preset: 'dust', rate: 3, glowPreset: 'spore' }, // sparse: glowing motes must not be mistaken for shots
  embers: { keep: 30, preset: 'ash', rate: 6, glowPreset: 'risingEmber' },
};

export const PRESETS = {
  dust: {
    life: P.dust.life,
    size: P.dust.size,
    colors: linearColors(['#d8d0c0', '#c8bca8', '#e8e0d0']),
    alpha: P.dust.alpha,
    fadeInOut: true,
    wander: 2,
  },
  fog: {
    life: [7, 13],
    size: [2, 3],
    colors: linearColors(['#9aa4b0', '#7a8490', '#b8c0c8']),
    alpha: 0.22,
    fadeInOut: true,
    wander: 3,
  },
  spore: {
    life: [3, 6],
    size: [1, 1],
    colors: linearColors([CHAPTERS.hollow.glowTeal[2], CHAPTERS.hollow.glowPurple[2], CHAPTERS.hollow.glowTeal[3]], 1.8),
    alpha: 0.9,
    fadeInOut: true,
    gravity: -3,
    wander: 8,
  },
  risingEmber: {
    life: [2, 4],
    size: [1, 1],
    colors: linearColors([SHARED.fire[3], SHARED.fire[4], SHARED.fire[5]], 2.6),
    alpha: 1,
    fadeInOut: true,
    gravity: -12,
    wander: 14,
  },
  ember: {
    life: P.embers.life,
    size: [1, 1],
    colors: linearColors([SHARED.fire[3], SHARED.fire[4], SHARED.fire[5]], 3.0),
    alpha: 1,
    drag: 0.6,
    wander: P.embers.wander,
  },
  spark: {
    life: [0.1, 0.25],
    size: [1, 1],
    colors: linearColors([SHARED.fire[4], SHARED.fire[5], SHARED.fire[6]], 2.4),
    alpha: 1,
    drag: 6,
  },
  stoneChip: {
    life: [0.35, 0.7],
    size: [1, 2],
    colors: linearColors(SHARED.pebble.slice(1, 4)),
    gravity: P.gravity,
    bounce: 0.35,
    drag: 1.5,
  },
  stoneDust: {
    life: [0.25, 0.5],
    size: [1, 2],
    colors: linearColors(['#9a948a', '#7a756e']),
    alpha: 0.7,
    drag: 7,
  },
  splinter: {
    life: [0.8, 1.6],
    size: [1, 2],
    colors: linearColors(SHARED.wood.slice(2, 6)),
    gravity: P.gravity,
    bounce: 0.3,
    drag: 1.2,
  },
  ironBit: {
    life: [1.0, 1.8],
    size: [2, 2],
    colors: linearColors(SHARED.iron.slice(2, 5)),
    gravity: P.gravity,
    bounce: 0.45,
    drag: 1,
  },
  blood: {
    life: [0.4, 0.8],
    size: [1, 2],
    colors: linearColors(CREATURES.blood.slice(1)),
    gravity: P.gravity,
    bounce: 0.1,
    drag: 2,
  },
  goo: {
    life: [0.5, 1.0],
    size: [1, 2],
    colors: linearColors(CREATURES.goo.slice(1)),
    gravity: P.gravity,
    bounce: 0.15,
    drag: 2,
  },
  ash: {
    life: [0.8, 1.6],
    size: [1, 2],
    colors: linearColors(['#3e3b38', '#5a5652', '#7a756e']),
    alpha: 0.85,
    gravity: -12, // drifts upward
    drag: 2.5,
    wander: 14,
    fadeInOut: true,
  },
  bone: {
    life: [0.7, 1.4],
    size: [1, 2],
    colors: linearColors(['#8a7e64', '#b8ab8a', '#ddd2b4']),
    gravity: P.gravity,
    bounce: 0.35,
    drag: 1.2,
  },
  smoke: {
    life: [0.8, 1.8],
    size: [2, 3],
    colors: linearColors(['#2a2622', '#3a3530', '#4a443d']),
    alpha: 0.75,
    gravity: -20,
    drag: 2.5,
    wander: 10,
    fadeInOut: true,
  },
  gold: {
    life: [0.5, 1.2],
    size: [1, 1],
    colors: linearColors([SHARED.brass[2], SHARED.brass[3], '#fff4c8'], 2.6),
    gravity: 80,
    drag: 1.5,
  },
  spellFlash: {
    life: [0.08, 0.12],
    size: [3, 4],
    colors: linearColors(['#e8f4ff', '#ffffff'], 2.4),
    drag: 0,
  },
  holy: {
    life: [0.3, 0.6],
    size: [1, 2],
    colors: linearColors(['#a8d0f0', '#e0f0ff', '#ffffff'], 2.2),
    drag: 4,
  },
  crackDust: {
    life: [1.6, 2.6],
    size: [1, 1],
    colors: linearColors(['#b8b0a0', '#9a948a']),
    alpha: 0.8,
    gravity: 14,
    fadeInOut: true,
  },
  straw: {
    life: [0.9, 1.8],
    size: [1, 2],
    colors: linearColors(CHAPTERS.cells.straw.slice(2)),
    gravity: P.gravity * 0.5,
    bounce: 0.15,
    drag: 2.2,
    wander: 30,
  },
  woodDust: {
    life: [0.4, 0.9],
    size: [2, 3],
    colors: linearColors(['#6a5a48', '#54473a', CHAPTERS.cells.stone[4]]),
    alpha: 0.55,
    drag: 4,
    fadeInOut: true,
  },
};

export class Effects {
  constructor(particles, bounds) {
    this.lit = particles.lit;
    this.glow = particles.glow;
    this.dust = particles.dust;
    this.presets = PRESETS;
    this.bounds = bounds; // { x0, y0, x1, y1 } area for ambient dust
    this.atmos = ATMOSPHERES.dust;
    this.atmosAcc = 0;
    this.emitters = []; // { owner, type, x, y, h, rate, spread, acc }
  }

  /** Continuous ember emitter (torches, braziers). `owner` is the room, so it can remove its own. */
  addEmberSource(owner, x, y, h, rate, spread = 2) {
    this.emitters.push({ owner, type: 'ember', x, y, h, rate, spread, acc: 0 });
  }

  /** Dust trickling down a cracked wall: the hint that a secret room is behind it. */
  addCrackDust(owner, x, y, h, spread) {
    this.emitters.push({ owner, type: 'crack', x, y, h, rate: P.crackDust.perSecond, spread, acc: 0 });
  }

  removeSources(owner) {
    for (let i = this.emitters.length - 1; i >= 0; i--) if (this.emitters[i].owner === owner) this.emitters.splice(i, 1);
  }

  update(dt) {
    this.impacts = 0; // shot impacts this frame (a shower of shots makes a few sparks, not a blizzard)
    for (let i = 0; i < this.emitters.length; i++) {
      const e = this.emitters[i];
      e.acc += e.rate * dt;
      while (e.acc >= 1) {
        e.acc -= 1;
        if (e.type === 'ember') {
          this.glow.emit(
            PRESETS.ember,
            e.x + fxRng.float(-e.spread, e.spread),
            e.y,
            e.h,
            fxRng.float(-6, 6),
            0,
            fxRng.float(P.embers.rise[0], P.embers.rise[1]),
          );
        } else {
          this.lit.emit(PRESETS.crackDust, e.x + fxRng.float(-e.spread, e.spread), e.y, e.h + fxRng.float(-4, 4), fxRng.float(-2, 2), 0, -fxRng.float(2, 8));
        }
      }
    }
    // keep the room full of slowly drifting motes (dust, fog, ash...)
    const b = this.bounds;
    const at = this.atmos;
    let guard = 8;
    while (this.dust.activeCount < at.keep && guard-- > 0) {
      const s = P.dust.speed;
      this.dust.emit(
        PRESETS[at.preset],
        fxRng.float(b.x0, b.x1),
        fxRng.float(b.y0, b.y1),
        fxRng.float(4, 40),
        fxRng.float(-s, s),
        fxRng.float(-s, s),
        fxRng.float(-s * 0.3, s * 0.3),
      );
    }
    // ...and the glowing ones (spores in the Hollow, embers in the Halls)
    if (at.rate) {
      this.atmosAcc += dt * at.rate;
      while (this.atmosAcc >= 1) {
        this.atmosAcc -= 1;
        this.glow.emit(PRESETS[at.glowPreset], fxRng.float(b.x0, b.x1), fxRng.float(b.y0, b.y1), fxRng.float(0, 20), fxRng.float(-4, 4), fxRng.float(-3, 3), fxRng.float(2, 8));
      }
    }
  }

  /** What floats in the air: 'dust' | 'fog' | 'spores' | 'embers'. */
  setAtmosphere(kind) {
    this.atmos = ATMOSPHERES[kind] || ATMOSPHERES.dust;
    this.dust.clear();
  }

  /** A spell bolt bursts: a ring of pale arcane sparks. */
  spellImpact(x, y, h) {
    this.impacts = (this.impacts || 0) + 1;
    const n = this.impacts > 4 ? 1 : 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + fxRng.float(0, 0.5);
      const sp = fxRng.float(30, 70);
      this.glow.emit(PRESETS.holy, x, y, h, Math.cos(a) * sp, Math.sin(a) * sp, fxRng.float(-10, 30));
    }
    if (this.impacts <= 3) this.glow.emit(PRESETS.spellFlash, x, y, h + 1, 0, 0, 0);
  }

  /** A sling stone smacks into something: grey chips + a puff + a couple of sparks. */
  stoneImpact(x, y, h, dirX, dirY) {
    this.impacts = (this.impacts || 0) + 1;
    if (this.impacts > 6) return this.lit.emit(PRESETS.stoneDust, x, y, h, 0, 0, 10);
    for (let i = 0; i < P.stoneImpact.chips; i++) {
      this.lit.emit(PRESETS.stoneChip, x, y, h, -dirX * fxRng.float(20, 70) + fxRng.float(-40, 40), -dirY * fxRng.float(20, 70) + fxRng.float(-40, 40), fxRng.float(30, 90));
    }
    for (let i = 0; i < P.stoneImpact.puffs; i++) {
      this.lit.emit(PRESETS.stoneDust, x, y, h, fxRng.float(-40, 40), fxRng.float(-40, 40), fxRng.float(-10, 20));
    }
    if (fxRng.chance(0.5)) this.glow.emit(PRESETS.spark, x, y, h, fxRng.float(-90, 90), fxRng.float(-90, 90), fxRng.float(0, 60));
  }

  /** A stone ran out of range and hit the floor. */
  stoneLand(x, y) {
    for (let i = 0; i < 3; i++) this.lit.emit(PRESETS.stoneDust, x, y, 1, fxRng.float(-30, 30), fxRng.float(-15, 15), fxRng.float(0, 10));
    this.lit.emit(PRESETS.stoneChip, x, y, 1, fxRng.float(-30, 30), fxRng.float(-20, 20), fxRng.float(40, 70));
  }

  barrelHit(x, y, h) {
    for (let i = 0; i < 4; i++) this.lit.emit(PRESETS.splinter, x, y, h, fxRng.float(-60, 60), fxRng.float(-40, 40), fxRng.float(40, 110));
  }

  /** Generic burst of `preset` particles flying out from (x, y, h). */
  burst(preset, x, y, h, count, speed, up = 80) {
    for (let i = 0; i < count; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      const sp = fxRng.float(speed * 0.3, speed);
      this.lit.emit(preset, x, y, h, Math.cos(a) * sp, Math.sin(a) * sp * 0.7, fxRng.float(up * 0.3, up));
    }
  }

  /** A stone hits a creature. `kind`: 'blood' | 'goo' | 'ash' | 'iron' */
  enemyHit(x, y, h, dirX, dirY, kind) {
    const preset = kind === 'goo' ? PRESETS.goo : kind === 'ash' ? PRESETS.ash : kind === 'iron' ? PRESETS.stoneChip : PRESETS.blood;
    for (let i = 0; i < 5; i++) {
      this.lit.emit(preset, x, y, h, dirX * fxRng.float(20, 80) + fxRng.float(-30, 30), dirY * fxRng.float(20, 80) + fxRng.float(-30, 30), fxRng.float(20, 80));
    }
    if (kind === 'iron' || fxRng.chance(0.3)) this.glow.emit(PRESETS.spark, x, y, h, fxRng.float(-80, 80), fxRng.float(-80, 80), fxRng.float(0, 50));
  }

  /** Puff of dust where an enemy appears. */
  spawnPuff(x, y) {
    for (let i = 0; i < 10; i++) {
      this.lit.emit(PRESETS.woodDust, x + fxRng.float(-8, 8), y + fxRng.float(-4, 4), fxRng.float(0, 10), fxRng.float(-30, 30), fxRng.float(-20, 20), fxRng.float(5, 25));
    }
  }

  /** Something heavy lands (mimic hop, prisoner yanked short by his chain). */
  landDust(x, y, amount = 10) {
    for (let i = 0; i < amount; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      this.lit.emit(PRESETS.woodDust, x + Math.cos(a) * 6, y + Math.sin(a) * 3, 1, Math.cos(a) * fxRng.float(30, 70), Math.sin(a) * fxRng.float(20, 40), fxRng.float(5, 20));
    }
  }

  /** Fireball bursts on the floor. */
  fireBurst(x, y) {
    for (let i = 0; i < 18; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      const sp = fxRng.float(30, 110);
      this.glow.emit(PRESETS.ember, x, y, 2, Math.cos(a) * sp, Math.sin(a) * sp * 0.7, fxRng.float(20, 70));
    }
    for (let i = 0; i < 6; i++) this.glow.emit(PRESETS.spark, x, y, 4, fxRng.float(-120, 120), fxRng.float(-80, 80), fxRng.float(10, 60));
  }

  /** Armour and weapons clattering to the floor. */
  clatter(x, y) {
    this.burst(PRESETS.ironBit, x, y, 10, 10, 110, 150);
    for (let i = 0; i < 6; i++) this.glow.emit(PRESETS.spark, x, y, 8, fxRng.float(-100, 100), fxRng.float(-60, 60), fxRng.float(20, 90));
  }

  /** Glint when a pickup is collected. */
  sparkle(x, y) {
    for (let i = 0; i < 8; i++) this.glow.emit(PRESETS.spark, x, y, fxRng.float(4, 14), fxRng.float(-50, 50), fxRng.float(-30, 30), fxRng.float(20, 70));
  }

  /** A powder keg goes off: fireball, smoke, debris and sparks. */
  explosion(x, y) {
    for (let i = 0; i < 40; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      const sp = fxRng.float(40, 200);
      this.glow.emit(PRESETS.ember, x, y, fxRng.float(2, 20), Math.cos(a) * sp, Math.sin(a) * sp * 0.7, fxRng.float(30, 140));
    }
    for (let i = 0; i < 14; i++) this.glow.emit(PRESETS.spark, x, y, 8, fxRng.float(-220, 220), fxRng.float(-150, 150), fxRng.float(20, 120));
    for (let i = 0; i < 26; i++) {
      this.lit.emit(PRESETS.smoke, x + fxRng.float(-14, 14), y + fxRng.float(-8, 8), fxRng.float(4, 24), fxRng.float(-40, 40), fxRng.float(-25, 25), fxRng.float(10, 40));
    }
    this.burst(PRESETS.stoneChip, x, y, 6, 14, 160, 160);
  }

  /** Taking a relic: a fountain of golden sparks. */
  relicBurst(x, y) {
    for (let i = 0; i < 30; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      this.glow.emit(PRESETS.gold, x, y, fxRng.float(10, 30), Math.cos(a) * fxRng.float(20, 70), Math.sin(a) * fxRng.float(15, 50), fxRng.float(30, 110));
    }
  }

  /** Holy water splashes out in a ring. */
  holySplash(x, y, r) {
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const sp = r * fxRng.float(1.6, 2.4);
      this.glow.emit(PRESETS.holy, x, y, 8, Math.cos(a) * sp, Math.sin(a) * sp * 0.7, fxRng.float(20, 60));
    }
  }

  /** Dust shaken loose when a door slams shut or swings open. */
  doorDust(x, y, h) {
    for (let i = 0; i < P.doorDust; i++) {
      this.lit.emit(PRESETS.woodDust, x + fxRng.float(-14, 14), y + fxRng.float(-6, 6), h + fxRng.float(0, 20), fxRng.float(-25, 25), fxRng.float(-25, 25), fxRng.float(-10, 10));
    }
  }

  barrelBreak(x, y) {
    const cfg = P.barrelBreak;
    for (let i = 0; i < cfg.splinters; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      const sp = fxRng.float(40, 150);
      this.lit.emit(PRESETS.splinter, x, y, fxRng.float(4, 20), Math.cos(a) * sp, Math.sin(a) * sp * 0.7, fxRng.float(60, 180));
    }
    for (let i = 0; i < cfg.chunks; i++) {
      const a = fxRng.float(0, Math.PI * 2);
      this.lit.emit(PRESETS.ironBit, x, y, 10, Math.cos(a) * 70, Math.sin(a) * 50, fxRng.float(80, 150));
    }
    for (let i = 0; i < cfg.dust; i++) {
      this.lit.emit(PRESETS.woodDust, x + fxRng.float(-8, 8), y + fxRng.float(-4, 4), fxRng.float(2, 16), fxRng.float(-50, 50), fxRng.float(-30, 30), fxRng.float(0, 25));
    }
  }
}
