// The third roster: nine more bosses, bringing the dungeon to forty. Same format as bosses2.js.
// Their rank (Normal / Hard / Deadly / Legendary) is in data/difficulty.js (BOSS_TIERS).

export const PATTERN_BOSSES_3 = {
  // ===================== THE CELLS =====================
  turnkey: {
    name: 'The Turnkey', subtitle: 'Every Lock In The Keep Answers To Him', sheet: 'turnkey', home: 1,
    hp: 190, speed: 36, radius: 16, hitRadius: 19, contactDamage: 1, mass: 45, move: 'chase', restTime: [0.9, 1.4],
    summonOnHurt: ['rat', 0.08, 4],
    phases: [
      { below: 1, attacks: [
        [3, 'charge', { windup: 0.8, speed: 240, stun: 1.0, repeats: 1 }],
        [3, 'fan', { windup: 0.6, count: 5, spread: 0.9, speed: 125, frame: 11, volleys: 1 }],
        [2, 'summon', { windup: 0.8, type: 'prisoner', count: 2, max: 3, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'charge', { windup: 0.7, speed: 260, stun: 0.8, repeats: 2 }],
        [3, 'boomerang', { windup: 0.6, count: 2, spread: 0.6, speed: 190, frame: 11, reverseAt: 0.9 }],
        [2, 'slam', { windup: 0.5, air: 0.6, height: 50, radius: 40, shards: 8, shardSpeed: 120, frame: 11 }],
      ] },
    ],
  },
  bellringer: {
    name: 'The Bellringer', subtitle: 'He Rings For The Dead', sheet: 'bellringer', home: 2,
    hp: 260, speed: 40, radius: 16, hitRadius: 19, contactDamage: 1, mass: 40, move: 'chase', restTime: [0.8, 1.3],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.8, count: 16, speed: 105, frame: 1, rings: 2, holes: 3, anim: 'cast' }],
        [3, 'pounce', { windup: 0.5, time: 0.55, height: 30, repeats: 2, radius: 22 }],
        [2, 'slam', { windup: 0.6, air: 0.7, height: 64, radius: 46, shards: 12, shardSpeed: 120, frame: 1 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'ring', { windup: 0.6, count: 20, speed: 115, frame: 1, rings: 3, holes: 3, gapSpin: 0.5, anim: 'cast' }],
        [3, 'pounce', { windup: 0.45, time: 0.5, height: 30, repeats: 3, radius: 22 }],
        [2, 'wall', { windup: 0.7, speed: 80, frame: 1, gapSize: 3, volleys: 2, gapStep: 1 }],
      ] },
    ],
  },
  // ===================== THE CATACOMBS =====================
  widow: {
    name: 'The Weeping Widow', subtitle: 'She Still Waits At The Graveside', sheet: 'widow', home: 3,
    hp: 330, speed: 40, radius: 14, hitRadius: 17, contactDamage: 1, mass: 25, move: 'hover', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.7, count: 18, speed: 100, frame: 3, rings: 2, holes: 4, gapSpin: 0.4, anim: 'cast' }],
        [3, 'homing', { windup: 0.6, count: 4, speed: 80, turn: 1.6, frame: 3 }],
        [2, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'spiral', { windup: 0.6, arms: 3, rate: 9, duration: 2.4, speed: 95, turn: 1.2, frame: 3 }],
        [3, 'homing', { windup: 0.5, count: 6, speed: 85, turn: 1.8, frame: 3 }],
        [2, 'blink', {}],
        [2, 'pull', { windup: 0.6, duration: 1.8, strength: 50, ring: 12, frame: 3 }],
      ] },
    ],
  },
  hangedman: {
    name: 'The Hanged Man', subtitle: 'The Rope Never Broke', sheet: 'hangedman', home: 4,
    hp: 380, speed: 34, radius: 14, hitRadius: 17, contactDamage: 1, mass: 30, move: 'circle', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'boomerang', { windup: 0.6, count: 3, spread: 0.7, speed: 200, frame: 2, reverseAt: 0.85 }],
        [3, 'bounce', { windup: 0.6, count: 6, speed: 130, frame: 2, bounces: 2 }],
        [2, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'bounce', { windup: 0.5, count: 8, speed: 140, frame: 2, bounces: 3 }],
        [3, 'cross', { windup: 0.6, arms: 4, rate: 9, duration: 2.4, speed: 115, turn: 0.7, frame: 2 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  // ===================== THE HOLLOW =====================
  fenhag: {
    name: 'The Fen Hag', subtitle: 'Her Pot Is Always On The Boil', sheet: 'fenhag', home: 5,
    hp: 420, speed: 30, radius: 15, hitRadius: 18, contactDamage: 1, mass: 40, move: 'circle', restTime: [0.8, 1.2],
    summonOnHurt: ['toad', 0.06, 3],
    phases: [
      { below: 1, attacks: [
        [3, 'lob', { windup: 0.7, count: 3, spread: 80, time: 0.95, patch: 'poison', patchRadius: 24, patchTime: 3.5, frame: 0 }],
        [3, 'minefield', { windup: 0.5, count: 6, radius: 18, visual: 3, spread: [0.4, 1.5] }],
        [2, 'summon', { windup: 0.9, type: 'toad', count: 2, max: 3, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'pull', { windup: 0.6, duration: 2.0, strength: 60, ring: 14, frame: 0 }],
        [3, 'lob', { windup: 0.6, count: 4, spread: 100, time: 0.9, patch: 'poison', patchRadius: 26, patchTime: 3.5, frame: 0 }],
        [2, 'homing', { windup: 0.6, count: 5, speed: 80, turn: 1.6, frame: 0 }],
      ] },
    ],
  },
  wickerman: {
    name: 'The Wicker Man', subtitle: 'Something Burns Inside', sheet: 'wickerman', home: 6,
    hp: 560, speed: 38, radius: 18, hitRadius: 22, contactDamage: 1, mass: 70, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'breath', { windup: 0.9, duration: 1.4, sweep: 1.4, reach: 150, cone: 0.32 }],
        [3, 'charge', { windup: 0.7, speed: 280, stun: 0.7, repeats: 2, trail: 'fire' }],
        [2, 'slam', { windup: 0.6, air: 0.75, height: 70, radius: 48, shards: 12, shardSpeed: 130, frame: 2 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'wall', { windup: 0.7, speed: 80, frame: 2, gapSize: 3, volleys: 3, gapStep: 1 }],
        [3, 'breath', { windup: 0.8, duration: 1.6, sweep: 1.8, reach: 160, cone: 0.34 }],
        [3, 'charge', { windup: 0.6, speed: 300, stun: 0.6, repeats: 3, trail: 'fire' }],
      ] },
    ],
  },
  // ===================== THE BURNING HALLS =====================
  inquisitor: {
    name: 'The Grand Inquisitor', subtitle: 'Confess, And Burn Anyway', sheet: 'inquisitor', home: 7,
    hp: 640, speed: 34, radius: 14, hitRadius: 17, contactDamage: 1, mass: 35, move: 'hover', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'cross', { windup: 0.6, arms: 4, rate: 10, duration: 2.6, speed: 120, turn: 0.7, frame: 3 }],
        [3, 'lines', { windup: 0.8, directions: 4, spread: 0.5, steps: 12, spacing: 18, delay: 0.04, radius: 11, visual: 0 }],
        [2, 'laser', { windup: 0.9, duration: 1.6, sweep: 1.6, width: 6, beams: 1, color: 'holy' }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'laser', { windup: 0.8, duration: 1.8, sweep: 2.0, width: 6, beams: 2, color: 'holy' }],
        [3, 'spiral', { windup: 0.6, arms: 4, rate: 10, duration: 2.4, speed: 105, turn: 1.0, frame: 3 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  dreadknight: {
    name: 'The Dread Knight', subtitle: 'He Swore An Oath To The Mad King', sheet: 'dreadknight', home: 8,
    hp: 670, speed: 46, radius: 17, hitRadius: 20, contactDamage: 1, mass: 70, move: 'chase', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [4, 'dash', { windup: 0.5, count: 3, speed: 320, time: 0.3, gap: 0.3 }],
        [3, 'sweep', { windup: 0.6, reach: 90, arc: 1.5 }],
        [2, 'slam', { windup: 0.5, air: 0.6, height: 70, radius: 50, shards: 14, shardSpeed: 140, frame: 1 }],
      ] },
      { below: 0.66, speedMult: 1.15, attacks: [
        [3, 'dash', { windup: 0.45, count: 4, speed: 340, time: 0.28, gap: 0.28 }],
        [3, 'spiral', { windup: 0.6, arms: 3, rate: 11, duration: 2.2, speed: 115, turn: 1.4, frame: 1 }],
        [2, 'summon', { windup: 0.8, type: 'blackknight', count: 1, max: 2, anim: 'cast' }],
      ] },
      { below: 0.33, speedMult: 1.3, attacks: [
        [3, 'dash', { windup: 0.4, count: 4, speed: 330, time: 0.26, gap: 0.3 }],
        [3, 'sweep', { windup: 0.5, reach: 100, arc: 1.7 }],
        [3, 'wall', { windup: 0.7, speed: 85, frame: 1, gapSize: 4, volleys: 2, gapStep: 1 }],
      ] },
    ],
  },
  abyssaleye: {
    name: 'The Eye Below', subtitle: 'It Was Watching Before The Keep Was Built', sheet: 'abyssaleye', home: 8,
    hp: 640, speed: 32, radius: 16, hitRadius: 19, contactDamage: 1, mass: 50, move: 'hover', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'laser', { windup: 0.9, duration: 1.8, sweep: 1.8, width: 7, beams: 1, color: 'abyss' }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 85, turn: 1.8, frame: 3 }],
        [2, 'ring', { windup: 0.6, count: 20, speed: 110, frame: 3, rings: 2, holes: 3, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'laser', { windup: 0.7, duration: 2.0, sweep: 2.0, width: 6, beams: 2, color: 'abyss' }],
        [3, 'spiral', { windup: 0.5, arms: 4, rate: 10, duration: 2.6, speed: 110, turn: 1.2, frame: 3 }],
        [2, 'blink', {}],
        [2, 'pull', { windup: 0.6, duration: 2.0, strength: 65, ring: 16, frame: 3 }],
      ] },
    ],
  },
};
