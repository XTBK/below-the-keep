// The secret bosses: they wait only at the bottom of the secret realms (the Drowned Cistern, the
// Starless Chapel and the First King's Forge), drawn at random from these five, never twice in a run.
// Same format as the other rosters; 'secret: true' keeps them out of the ordinary floors.

export const SECRET_BOSS_IDS = ['leviathan', 'mirrorqueen', 'firstking', 'organist', 'facelesssaint'];

export const PATTERN_BOSSES_4 = {
  leviathan: {
    name: 'The Cistern Leviathan', subtitle: 'It Was Here Before The Water', sheet: 'leviathan', home: 4, secret: true,
    hp: 520, speed: 30, radius: 18, hitRadius: 22, contactDamage: 1, mass: 80, move: 'hover', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'wall', { windup: 0.8, speed: 75, frame: 0, gapSize: 3, volleys: 2, gapStep: 1 }],
        [3, 'bounce', { windup: 0.6, count: 7, speed: 125, frame: 0, bounces: 2 }],
        [2, 'pull', { windup: 0.7, duration: 2.0, strength: 55, ring: 14, frame: 0 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'ring', { windup: 0.6, count: 20, speed: 105, frame: 0, rings: 2, holes: 3, gapSpin: 0.5, anim: 'cast' }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 85, turn: 1.6, frame: 0 }],
        [2, 'wall', { windup: 0.7, speed: 85, frame: 0, gapSize: 3, volleys: 3, gapStep: 1 }],
      ] },
    ],
  },
  mirrorqueen: {
    name: 'The Mirror Queen', subtitle: 'She Only Loves What She Sees', sheet: 'mirrorqueen', home: 5, secret: true,
    hp: 480, speed: 40, radius: 14, hitRadius: 17, contactDamage: 1, mass: 30, move: 'hover', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'cross', { windup: 0.6, arms: 4, rate: 9, duration: 2.4, speed: 115, turn: 0.7, frame: 1 }],
        [3, 'homing', { windup: 0.6, count: 4, speed: 85, turn: 1.7, frame: 1 }],
        [2, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'spiral', { windup: 0.6, arms: 3, rate: 10, duration: 2.4, speed: 100, turn: -1.2, frame: 1 }],
        [3, 'fan', { windup: 0.5, count: 9, spread: 1.4, speed: 130, frame: 1, volleys: 2, gap: 0.35 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  firstking: {
    name: "The First King's Shade", subtitle: 'He Built The Keep. He Never Left It', sheet: 'firstking', home: 6, secret: true,
    hp: 560, speed: 44, radius: 16, hitRadius: 19, contactDamage: 1, mass: 60, move: 'chase', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'dash', { windup: 0.5, count: 3, speed: 300, time: 0.3, gap: 0.32 }],
        [3, 'sweep', { windup: 0.6, reach: 90, arc: 1.4 }],
        [2, 'lines', { windup: 0.8, directions: 4, spread: 0.5, steps: 11, spacing: 18, delay: 0.04, radius: 11, visual: 0 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'laser', { windup: 0.8, duration: 1.8, sweep: 1.8, width: 6, beams: 2, color: 'holy' }],
        [3, 'dash', { windup: 0.45, count: 4, speed: 320, time: 0.28, gap: 0.3 }],
        [2, 'slam', { windup: 0.5, air: 0.6, height: 70, radius: 48, shards: 12, shardSpeed: 125, frame: 12 }],
      ] },
    ],
  },
  organist: {
    name: 'The Bone Organist', subtitle: 'Every Pipe Was Once Someone', sheet: 'organist', home: 5, secret: true,
    hp: 540, speed: 14, radius: 18, hitRadius: 22, contactDamage: 1, mass: 99, move: 'circle', restTime: [0.6, 1.0],
    summonOnHurt: ['skeleton', 0.05, 3],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.7, count: 18, speed: 100, frame: 3, rings: 3, holes: 3, anim: 'cast' }],
        [3, 'wall', { windup: 0.7, speed: 80, frame: 3, gapSize: 3, volleys: 2, gapStep: 1 }],
        [2, 'summon', { windup: 0.9, type: 'skeleton', count: 2, max: 4, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1.0, attacks: [
        [3, 'spiral', { windup: 0.6, arms: 4, rate: 10, duration: 2.6, speed: 100, turn: 1.0, frame: 3 }],
        [3, 'rain', { windup: 0.4, count: 3, onPlayer: true, radius: 18, delay: 0.8, visual: 3, shards: 6, shardFrame: 3 }],
        [2, 'wall', { windup: 0.6, speed: 90, frame: 3, gapSize: 3, volleys: 3, gapStep: 1 }],
      ] },
    ],
  },
  facelesssaint: {
    name: 'The Faceless Saint', subtitle: 'It Answered Every Prayer', sheet: 'facelesssaint', home: 7, secret: true,
    hp: 600, speed: 36, radius: 15, hitRadius: 18, contactDamage: 1, mass: 50, move: 'hover', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'laser', { windup: 0.9, duration: 1.8, sweep: 1.6, width: 6, beams: 2, color: 'holy' }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 85, turn: 1.6, frame: 12 }],
        [2, 'rain', { windup: 0.4, count: 3, onPlayer: true, radius: 18, delay: 0.8, visual: 0, shards: 6, shardFrame: 12 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'laser', { windup: 0.8, duration: 2.0, sweep: 2.0, width: 6, beams: 3, color: 'holy' }],
        [3, 'ring', { windup: 0.6, count: 22, speed: 110, frame: 12, rings: 2, holes: 3, gapSpin: 0.6, anim: 'cast' }],
        [2, 'blink', {}],
      ] },
    ],
  },
};
