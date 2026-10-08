// The second roster: twenty more bosses. Same format as PATTERN_BOSSES in bosses.js, plus:
//   home          the floor this boss is tuned for (it is scaled up or down when it appears elsewhere)
//   summonOnHurt  [type, chance per hit, max alive]: hurting it can shake loose a minion
//
// Patterns (see enemies/bosses/PatternBoss.js): lob, rain, summon, spiral, charge, pounce, ring
// (holes: leave a gap in the ring to slip through), lines, fan, blink, sweep, slam, homing, and new ones:
//   dash       several quick dashes at Wren, no daze
//   boomerang  thrown things fly out, then turn back
//   pull       a vortex drags Wren toward the boss (negative strength = a gust that pushes away)
//   cross      a rotating cross of orb streams
//   minefield  eruptions all over the room, at random moments
//   laser      a beam (thin telegraph line first) that sweeps across the room
//   breath     a cone of fire that sweeps
//   wall       a row of orbs sweeps across the room - find the gap
//   bounce     orbs that ricochet off the walls
//   charge + trail: 'fire' | 'poison' | 'roots' leaves a hazard behind it

export const PATTERN_BOSSES_2 = {
  // ===================== THE CELLS =====================
  mastiff: {
    name: 'Old Gnasher', subtitle: "The Jailer's Mastiff", sheet: 'mastiff', home: 1,
    hp: 170, speed: 70, radius: 15, hitRadius: 18, contactDamage: 1, mass: 25, move: 'chase', restTime: [0.8, 1.3],
    phases: [
      { below: 1, attacks: [
        [4, 'dash', { windup: 0.5, count: 3, speed: 290, time: 0.32, gap: 0.35 }],
        [2, 'summon', { windup: 0.8, type: 'hound', count: 2, max: 3, anim: 'cast' }],
        [2, 'pounce', { windup: 0.5, time: 0.5, height: 24, repeats: 1, radius: 20 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [4, 'dash', { windup: 0.4, count: 4, speed: 310, time: 0.3, gap: 0.3 }],
        [2, 'ring', { windup: 0.6, count: 12, speed: 110, frame: 3, rings: 1, anim: 'cast' }],
        [2, 'summon', { windup: 0.8, type: 'hound', count: 2, max: 3, anim: 'cast' }],
      ] },
    ],
  },
  friar: {
    name: 'The Bloated Friar', subtitle: "He Ate The Abbey's Winter Stores", sheet: 'friar', home: 1,
    hp: 210, speed: 26, radius: 17, hitRadius: 20, contactDamage: 1, mass: 50, move: 'chase', restTime: [0.9, 1.4],
    phases: [
      { below: 1, attacks: [
        [3, 'slam', { windup: 0.5, air: 0.75, height: 60, radius: 42, shards: 10, shardSpeed: 120, frame: 0 }],
        [3, 'fan', { windup: 0.6, count: 7, spread: 1.1, speed: 120, frame: 0, volleys: 1 }],
        [2, 'lob', { windup: 0.6, count: 3, spread: 70, time: 0.85, patch: 'poison', patchRadius: 24, patchTime: 3, frame: 0 }],
      ] },
      { below: 0.5, attacks: [
        [3, 'charge', { windup: 0.8, speed: 230, stun: 1.0, repeats: 2 }],
        [3, 'minefield', { windup: 0.5, count: 9, radius: 18, visual: 3, spread: [0.5, 1.6] }],
        [2, 'fan', { windup: 0.5, count: 9, spread: 1.3, speed: 125, frame: 0, volleys: 2, gap: 0.35 }],
      ] },
    ],
  },
  ratking: {
    name: 'The Rat King', subtitle: 'A Crown Of Tangled Tails', sheet: 'ratking', home: 2,
    hp: 260, speed: 44, radius: 16, hitRadius: 19, contactDamage: 1, mass: 30, move: 'chase', restTime: [0.8, 1.2],
    summonOnHurt: ['rat', 0.12, 7],
    phases: [
      { below: 1, attacks: [
        [3, 'summon', { windup: 0.8, type: 'rat', count: 4, max: 7, anim: 'cast' }],
        [3, 'spiral', { windup: 0.6, arms: 2, rate: 10, duration: 2.0, speed: 95, turn: 1.5, frame: 0 }],
        [2, 'charge', { windup: 0.8, speed: 260, stun: 1.0, repeats: 1 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'ring', { windup: 0.6, count: 20, speed: 95, frame: 0, rings: 2, holes: 4, gapSpin: 0.6, anim: 'cast' }],
        [3, 'rain', { windup: 0.4, count: 2, onPlayer: true, radius: 18, delay: 0.8, visual: 3, shards: 6, shardFrame: 0, burrow: true }],
        [2, 'charge', { windup: 0.7, speed: 280, stun: 0.8, repeats: 2 }],
      ] },
    ],
  },
  headsman: {
    name: 'The Headsman', subtitle: 'The Block Is Always Hungry', sheet: 'headsman', home: 2,
    hp: 340, speed: 34, radius: 17, hitRadius: 20, contactDamage: 1, mass: 50, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'lines', { windup: 0.8, directions: 3, spread: 0.45, steps: 11, spacing: 18, delay: 0.045, radius: 11, visual: 4 }],
        [3, 'sweep', { windup: 0.7, reach: 80, arc: 1.3 }],
        [3, 'boomerang', { windup: 0.6, count: 1, spread: 0, speed: 200, frame: 11, reverseAt: 0.9 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'lines', { windup: 0.7, directions: 5, spread: 0.4, steps: 12, spacing: 18, delay: 0.04, radius: 11, visual: 4 }],
        [3, 'boomerang', { windup: 0.5, count: 2, spread: 0.5, speed: 210, frame: 11, reverseAt: 0.85 }],
        [2, 'slam', { windup: 0.5, air: 0.6, height: 70, radius: 44, shards: 12, shardSpeed: 130, frame: 1 }],
      ] },
    ],
  },
  maiden: {
    name: 'The Iron Maiden', subtitle: 'Embrace Her', sheet: 'maiden', home: 2,
    hp: 320, speed: 24, radius: 15, hitRadius: 18, contactDamage: 1, mass: 70, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.7, count: 16, speed: 110, frame: 1, rings: 2, spin: 0.2, anim: 'cast' }],
        [3, 'pull', { windup: 0.6, duration: 2.0, strength: 55, ring: 14, frame: 1 }],
        [2, 'charge', { windup: 0.9, speed: 230, stun: 1.2, repeats: 1 }],
      ] },
      { below: 0.5, attacks: [
        [3, 'cross', { windup: 0.6, arms: 4, rate: 9, duration: 2.6, speed: 120, turn: 0.6, frame: 1 }],
        [3, 'pull', { windup: 0.5, duration: 2.4, strength: 65, ring: 18, frame: 1 }],
        [2, 'ring', { windup: 0.6, count: 20, speed: 115, frame: 1, rings: 3, spin: 0.16, anim: 'cast' }],
      ] },
    ],
  },
  // ===================== THE CATACOMBS =====================
  choir: {
    name: 'The Ossuary Choir', subtitle: 'They Sing Of Your Death', sheet: 'choir', home: 3,
    hp: 260, speed: 34, radius: 16, hitRadius: 19, contactDamage: 1, mass: 40, move: 'hover', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.7, count: 22, speed: 90, frame: 4, rings: 3, holes: 4, gapSpin: 0.5, gapAim: true, anim: 'cast' }],
        [3, 'homing', { windup: 0.6, count: 4, speed: 80, turn: 1.6, frame: 3 }],
        [1, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'wall', { windup: 0.7, speed: 75, frame: 3, gapSize: 3, volleys: 2, gapStep: 1 }],
        [3, 'spiral', { windup: 0.5, arms: 3, rate: 12, duration: 2.2, speed: 95, turn: 1.6, frame: 4 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  gravemother: {
    name: 'The Gravemother', subtitle: 'Queen Of The Crypt Spiders', sheet: 'gravemother', home: 3,
    hp: 290, speed: 52, radius: 17, hitRadius: 20, contactDamage: 1, mass: 30, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'fan', { windup: 0.6, count: 5, spread: 0.9, speed: 140, frame: 9, volleys: 1, land: 'web' }],
        [3, 'slam', { windup: 0.4, air: 0.8, height: 160, radius: 34, shards: 0, shardSpeed: 0, frame: 9 }],
        [2, 'summon', { windup: 0.8, type: 'spider', count: 3, max: 4, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'dash', { windup: 0.45, count: 3, speed: 260, time: 0.35, gap: 0.3 }],
        [3, 'fan', { windup: 0.5, count: 7, spread: 1.2, speed: 150, frame: 9, volleys: 2, gap: 0.35, land: 'web' }],
        [2, 'slam', { windup: 0.4, air: 0.75, height: 160, radius: 36, shards: 8, shardSpeed: 120, frame: 3 }],
      ] },
    ],
  },
  physician: {
    name: 'The Plague Physician', subtitle: 'Bleeding Is The Only Cure', sheet: 'physician', home: 3,
    hp: 250, speed: 40, radius: 14, hitRadius: 17, contactDamage: 1, mass: 30, move: 'keepRange', range: [100, 180], restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'lob', { windup: 0.6, count: 5, spread: 80, time: 0.85, patch: 'poison', patchRadius: 24, patchTime: 3, frame: 0 }],
        [3, 'charge', { windup: 0.7, speed: 240, stun: 0.6, repeats: 2, trail: 'poison' }],
        [2, 'homing', { windup: 0.6, count: 3, speed: 85, turn: 1.4, frame: 0, land: 'poison' }],
      ] },
      { below: 0.5, attacks: [
        [3, 'minefield', { windup: 0.5, count: 10, radius: 20, visual: 3, spread: [0.6, 1.8], patch: 'poison' }],
        [3, 'lob', { windup: 0.5, count: 7, spread: 100, time: 0.8, patch: 'poison', patchRadius: 22, patchTime: 3, frame: 0 }],
        [2, 'homing', { windup: 0.6, count: 4, speed: 90, turn: 1.6, frame: 0, land: 'poison' }],
      ] },
    ],
  },
  lich: {
    name: 'The Lich', subtitle: 'Death Was A Door He Kept Open', sheet: 'lich', home: 4,
    hp: 320, speed: 30, radius: 14, hitRadius: 17, contactDamage: 1, mass: 50, move: 'hover', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'lines', { windup: 0.7, directions: 4, spread: 1.5708, steps: 13, spacing: 18, delay: 0.04, radius: 11, visual: 6 }],
        [3, 'laser', { windup: 0.9, duration: 1.6, sweep: 1.6, width: 6, beams: 1, color: 'shadow' }],
        [2, 'summon', { windup: 0.9, type: 'skeleton', count: 3, max: 4, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'laser', { windup: 0.8, duration: 2.0, sweep: 3.1, width: 6, beams: 2, color: 'shadow' }],
        [3, 'spiral', { windup: 0.5, arms: 3, rate: 13, duration: 2.4, speed: 100, turn: 1.8, frame: 10 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  entombed: {
    name: 'The Entombed Bishop', subtitle: 'Bound In Linen, Unbound In Spite', sheet: 'entombed', home: 4,
    hp: 420, speed: 26, radius: 15, hitRadius: 18, contactDamage: 1, mass: 50, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'pull', { windup: 0.6, duration: 1.8, strength: 60, ring: 12, frame: 12 }],
        [3, 'bounce', { windup: 0.6, count: 6, speed: 130, frame: 12, bounces: 2 }],
        [2, 'rain', { windup: 0.5, count: 7, spread: 130, radius: 16, delay: 1.0, visual: 6 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'bounce', { windup: 0.5, count: 9, speed: 140, frame: 12, bounces: 3 }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 85, turn: 1.7, frame: 6 }],
        [2, 'pull', { windup: 0.5, duration: 2.2, strength: 70, ring: 16, frame: 12 }],
      ] },
    ],
  },
  // ===================== THE HOLLOW =====================
  greattoad: {
    name: 'The Great Toad', subtitle: 'King Of The Bog', sheet: 'greattoad', home: 5,
    hp: 320, speed: 30, radius: 18, hitRadius: 21, contactDamage: 1, mass: 50, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [4, 'pounce', { windup: 0.5, time: 0.6, height: 40, repeats: 3, radius: 26 }],
        [3, 'laser', { windup: 0.6, duration: 0.35, sweep: 0, width: 7, beams: 1, length: 150, color: 'tongue' }],
        [2, 'summon', { windup: 0.8, type: 'toad', count: 3, max: 4, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [4, 'slam', { windup: 0.4, air: 0.65, height: 60, radius: 40, shards: 12, shardSpeed: 120, frame: 0 }],
        [3, 'ring', { windup: 0.6, count: 18, speed: 100, frame: 0, rings: 2, spin: 0.17, anim: 'cast' }],
        [2, 'laser', { windup: 0.5, duration: 0.35, sweep: 0, width: 7, beams: 1, length: 170, color: 'tongue' }],
      ] },
    ],
  },
  matron: {
    name: 'The Fungal Matron', subtitle: 'Her Children Are Everywhere', sheet: 'matron', home: 5,
    hp: 330, speed: 22, radius: 17, hitRadius: 20, contactDamage: 1, mass: 70, move: 'keepRange', range: [100, 180], restTime: [0.9, 1.3],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.7, count: 20, speed: 85, frame: 6, rings: 2, holes: 4, gapSpin: 0.7, anim: 'cast' }],
        [2, 'summon', { windup: 0.8, type: 'puffcap', count: 2, max: 3, anim: 'cast' }],
        [3, 'minefield', { windup: 0.5, count: 10, radius: 20, visual: 3, spread: [0.6, 1.8], patch: 'spores' }],
      ] },
      { below: 0.5, attacks: [
        [3, 'spiral', { windup: 0.5, arms: 4, rate: 10, duration: 2.4, speed: 85, turn: 1.3, frame: 6 }],
        [3, 'minefield', { windup: 0.4, count: 14, radius: 20, visual: 3, spread: [0.5, 1.8], patch: 'spores' }],
        [2, 'wall', { windup: 0.7, speed: 70, frame: 6, gapSize: 3, volleys: 2, gapStep: 2 }],
      ] },
    ],
  },
  stag: {
    name: 'The Stag Of Thorns', subtitle: "The Forest's Last Hart", sheet: 'stag', home: 5,
    hp: 310, speed: 110, radius: 17, hitRadius: 20, contactDamage: 1, mass: 30, move: 'circle', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'charge', { windup: 0.6, speed: 300, stun: 0.6, repeats: 2 }],
        [3, 'lines', { windup: 0.7, directions: 3, spread: 0.5, steps: 12, spacing: 18, delay: 0.045, radius: 11, visual: 0 }],
        [2, 'fan', { windup: 0.5, count: 7, spread: 1.0, speed: 150, frame: 5, volleys: 2, gap: 0.3 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [4, 'charge', { windup: 0.5, speed: 320, stun: 0.5, repeats: 3, trail: 'roots' }],
        [3, 'ring', { windup: 0.5, count: 18, speed: 130, frame: 5, rings: 2, spin: 0.17 }],
        [2, 'lines', { windup: 0.6, directions: 5, spread: 0.45, steps: 12, spacing: 18, delay: 0.04, radius: 11, visual: 0 }],
      ] },
    ],
  },
  ancientoak: {
    name: 'The Ancient Oak', subtitle: 'It Remembers The First Seed', sheet: 'ancientoak', home: 6,
    hp: 480, speed: 14, radius: 24, hitRadius: 28, contactDamage: 1, mass: 90, move: 'chase', restTime: [0.9, 1.3],
    phases: [
      { below: 1, attacks: [
        [3, 'lines', { windup: 0.8, directions: 6, spread: 1.047, steps: 13, spacing: 18, delay: 0.045, radius: 11, visual: 0 }],
        [3, 'slam', { windup: 0.6, air: 0.7, height: 30, radius: 56, shards: 14, shardSpeed: 120, frame: 5 }],
        [2, 'summon', { windup: 0.9, type: 'sapling', count: 2, max: 3, anim: 'cast' }],
      ] },
      { below: 0.5, attacks: [
        [3, 'rain', { windup: 0.5, count: 10, spread: 150, radius: 16, delay: 1.0, visual: 0 }],
        [3, 'lines', { windup: 0.7, directions: 8, spread: 0.785, steps: 13, spacing: 18, delay: 0.04, radius: 11, visual: 0 }],
        [2, 'summon', { windup: 0.8, type: 'treant', count: 1, max: 1, anim: 'cast' }],
      ] },
    ],
  },
  mothqueen: {
    name: 'The Moth Queen', subtitle: 'Drawn To Your Little Light', sheet: 'mothqueen', home: 6,
    hp: 420, speed: 44, radius: 18, hitRadius: 22, contactDamage: 1, mass: 40, move: 'hover', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'wall', { windup: 0.7, speed: 80, frame: 4, gapSize: 3, volleys: 1 }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 80, turn: 1.6, frame: 4 }],
        [3, 'bounce', { windup: 0.6, count: 6, speed: 120, frame: 12, bounces: 2 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'spiral', { windup: 0.5, arms: 4, rate: 14, duration: 2.4, speed: 95, turn: 1.7, frame: 4 }],
        [3, 'wall', { windup: 0.6, speed: 85, frame: 4, gapSize: 3, volleys: 3, gapStep: 2 }],
        [2, 'pull', { windup: 0.5, duration: 1.6, strength: -90, ring: 0, frame: 4 }],
      ] },
    ],
  },
  // ===================== THE BURNING HALLS =====================
  courtjester: {
    name: 'The Court Jester', subtitle: "The King's Favourite Fool", sheet: 'courtjester', home: 7,
    hp: 320, speed: 95, radius: 14, hitRadius: 17, contactDamage: 1, mass: 25, move: 'circle', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'bounce', { windup: 0.5, count: 5, speed: 150, frame: 7, bounces: 3 }],
        [3, 'spiral', { windup: 0.5, arms: 3, rate: 12, duration: 1.8, speed: 140, turn: 2.2, frame: 1 }],
        [2, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'boomerang', { windup: 0.5, count: 5, spread: 0.45, speed: 220, frame: 1, reverseAt: 0.7 }],
        [3, 'bounce', { windup: 0.4, count: 8, speed: 160, frame: 7, bounces: 4 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  moltenknight: {
    name: 'The Molten Knight', subtitle: "Forged In The King's Furnace", sheet: 'moltenknight', home: 7,
    hp: 460, speed: 36, radius: 16, hitRadius: 19, contactDamage: 1, mass: 60, move: 'chase', restTime: [0.8, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'charge', { windup: 0.7, speed: 290, stun: 0.7, repeats: 2, trail: 'fire' }],
        [3, 'rain', { windup: 0.5, count: 5, spread: 120, radius: 18, delay: 1.0, visual: 2 }],
        [2, 'slam', { windup: 0.5, air: 0.6, height: 70, radius: 44, shards: 12, shardSpeed: 130, frame: 8 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'charge', { windup: 0.6, speed: 310, stun: 0.6, repeats: 3, trail: 'fire' }],
        [3, 'ring', { windup: 0.5, count: 20, speed: 115, frame: 8, rings: 3, spin: 0.16, anim: 'cast' }],
        [2, 'rain', { windup: 0.5, count: 7, spread: 140, radius: 18, delay: 0.95, visual: 2 }],
      ] },
    ],
  },
  gargoylelord: {
    name: 'The Gargoyle Lord', subtitle: 'He Watched The Halls A Thousand Years', sheet: 'gargoylelord', home: 7,
    hp: 450, speed: 46, radius: 18, hitRadius: 22, contactDamage: 1, mass: 60, move: 'hover', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'charge', { windup: 0.7, speed: 280, stun: 0.5, repeats: 2 }],
        [3, 'rain', { windup: 0.5, count: 8, spread: 140, radius: 15, delay: 1.0, visual: 5 }],
        [2, 'ring', { windup: 0.6, count: 16, speed: 115, frame: 1, rings: 2, spin: 0.2, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'cross', { windup: 0.6, arms: 4, rate: 10, duration: 2.4, speed: 125, turn: -0.8, frame: 1 }],
        [3, 'rain', { windup: 0.4, count: 11, spread: 160, radius: 15, delay: 0.95, visual: 5 }],
        [2, 'charge', { windup: 0.6, speed: 300, stun: 0.4, repeats: 3 }],
      ] },
    ],
  },
  ashwing: {
    name: 'Ashwing', subtitle: 'The Last Dragon Under The Keep', sheet: 'ashwing', home: 8,
    hp: 560, speed: 34, radius: 22, hitRadius: 26, contactDamage: 1, mass: 90, move: 'keepRange', range: [90, 170], restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'breath', { windup: 0.9, duration: 1.4, sweep: 1.4, reach: 150, cone: 0.32 }],
        [3, 'rain', { windup: 0.5, count: 6, spread: 140, radius: 18, delay: 1.0, visual: 2 }],
        [2, 'pull', { windup: 0.6, duration: 1.4, strength: -110, ring: 0, frame: 8 }],
      ] },
      { below: 0.5, speedMult: 1.15, move: 'hover', attacks: [
        [3, 'breath', { windup: 0.7, duration: 1.8, sweep: 2.4, reach: 170, cone: 0.35 }],
        [3, 'spiral', { windup: 0.5, arms: 3, rate: 14, duration: 2.4, speed: 110, turn: 1.9, frame: 8 }],
        [2, 'rain', { windup: 0.4, count: 9, spread: 160, radius: 18, delay: 0.95, visual: 2 }],
      ] },
    ],
  },
  burnedqueen: {
    name: 'The Burned Queen', subtitle: 'She Was No Witch', sheet: 'burnedqueen', home: 8,
    hp: 540, speed: 38, radius: 14, hitRadius: 17, contactDamage: 1, mass: 50, move: 'hover', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'laser', { windup: 0.9, duration: 1.8, sweep: 2.0, width: 6, beams: 1, color: 'fire' }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 85, turn: 1.8, frame: 6 }],
        [3, 'ring', { windup: 0.6, count: 24, speed: 95, frame: 8, rings: 3, holes: 4, gapSpin: 0.5, gapAim: true, anim: 'cast' }],
        [1, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'laser', { windup: 0.8, duration: 2.2, sweep: 3.2, width: 6, beams: 2, color: 'fire' }],
        [3, 'cross', { windup: 0.5, arms: 6, rate: 9, duration: 2.6, speed: 110, turn: 0.9, frame: 8 }],
        [2, 'wall', { windup: 0.6, speed: 90, frame: 8, gapSize: 3, volleys: 3, gapStep: 2 }],
        [1, 'blink', {}],
      ] },
    ],
  },
};
