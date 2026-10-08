// The Deep's bosses (floors 10-19): one at the bottom of each place, and the Hollow itself at the
// Deep Door. The first floor of each place draws a Deadly boss from the whole roster;
// the second floor always ends with that place's own. 'deep: true' keeps them out of the Keep above.

export const DEEP_BOSS_IDS = ['worldroot', 'rimequeen', 'sunkenking', 'crystalwyrm', 'hollow'];

export const PATTERN_BOSSES_5 = {
  worldroot: {
    name: 'The World-Root', subtitle: 'Everything Above Is Held Up By It', sheet: 'worldroot', home: 11, deep: true,
    hp: 900, speed: 0, radius: 22, hitRadius: 26, contactDamage: 1, mass: 99, move: 'hover', restTime: [0.6, 1.0],
    summonOnHurt: ['roothound', 0.04, 3],
    phases: [
      { below: 1, attacks: [
        [3, 'lines', { windup: 0.8, directions: 4, spread: 0.6, steps: 12, spacing: 18, delay: 0.04, radius: 11, visual: 0 }],
        [3, 'lob', { windup: 0.6, count: 4, spread: 80, time: 0.85, patch: 'poison', patchRadius: 24, patchTime: 3, frame: 0 }],
        [2, 'summon', { windup: 0.8, type: 'sapbulb', count: 2, max: 3, anim: 'cast' }],
      ] },
      { below: 0.5, speedMult: 1, attacks: [
        [3, 'lines', { windup: 0.7, directions: 6, spread: 0.5, steps: 12, spacing: 18, delay: 0.035, radius: 11, visual: 0 }],
        [3, 'ring', { windup: 0.6, count: 22, speed: 100, frame: 5, rings: 2, holes: 3, gapSpin: 0.5, anim: 'cast' }],
        [2, 'rain', { windup: 0.4, count: 3, onPlayer: true, radius: 18, delay: 0.85, visual: 3, shards: 6, shardFrame: 5, burrow: true }],
      ] },
    ],
  },
  rimequeen: {
    name: 'The Rime Queen', subtitle: 'She Froze Her Kingdom To Keep It', sheet: 'rimequeen', home: 13, deep: true,
    hp: 860, speed: 36, radius: 15, hitRadius: 18, contactDamage: 1, mass: 40, move: 'hover', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'spiral', { windup: 0.6, arms: 3, rate: 10, duration: 2.4, speed: 100, turn: 1.1, frame: 1 }],
        [3, 'fan', { windup: 0.5, count: 9, spread: 1.3, speed: 130, frame: 1, volleys: 2, gap: 0.35 }],
        [2, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'wall', { windup: 0.7, speed: 85, frame: 1, gapSize: 3, volleys: 3, gapStep: 1 }],
        [3, 'cross', { windup: 0.6, arms: 4, rate: 9, duration: 2.6, speed: 110, turn: -0.8, frame: 1 }],
        [2, 'summon', { windup: 0.8, type: 'rimewraith', count: 2, max: 3, anim: 'cast' }],
        [2, 'blink', {}],
      ] },
    ],
  },
  sunkenking: {
    name: 'The Sunken King', subtitle: 'Crowned Before The Keep Was Built', sheet: 'sunkenking', home: 15, deep: true,
    hp: 980, speed: 42, radius: 17, hitRadius: 20, contactDamage: 1, mass: 70, move: 'chase', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'charge', { windup: 0.75, speed: 280, stun: 0.9, repeats: 2 }],
        [3, 'sweep', { windup: 0.6, reach: 92, arc: 1.4 }],
        [2, 'wall', { windup: 0.8, speed: 80, frame: 0, gapSize: 3, volleys: 2, gapStep: 1 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'ring', { windup: 0.6, count: 20, speed: 105, frame: 0, rings: 2, holes: 3, gapSpin: 0.5, anim: 'cast' }],
        [3, 'charge', { windup: 0.65, speed: 300, stun: 0.8, repeats: 3 }],
        [2, 'summon', { windup: 0.8, type: 'drownedknight', count: 1, max: 2, anim: 'cast' }],
        [2, 'pull', { windup: 0.7, duration: 2.0, strength: 50, ring: 14, frame: 0 }],
      ] },
    ],
  },
  crystalwyrm: {
    name: 'The Crystal Wyrm', subtitle: 'It Sleeps Coiled Round The Light', sheet: 'crystalwyrm', home: 17, deep: true,
    hp: 1000, speed: 46, radius: 18, hitRadius: 22, contactDamage: 1, mass: 70, move: 'circle', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'bounce', { windup: 0.6, count: 7, speed: 130, frame: 1, bounces: 2 }],
        [3, 'breath', { windup: 0.8, duration: 1.4, sweep: 1.2, reach: 150, cone: 0.32 }],
        [2, 'homing', { windup: 0.6, count: 4, speed: 90, turn: 1.6, frame: 1 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'laser', { windup: 0.85, duration: 1.8, sweep: 1.4, width: 6, beams: 2, color: 'holy' }],
        [3, 'bounce', { windup: 0.5, count: 9, speed: 140, frame: 1, bounces: 3 }],
        [2, 'pounce', { windup: 0.5, time: 0.6, height: 40, repeats: 2, radius: 30 }],
      ] },
    ],
  },
  hollow: {
    name: 'The Hollow', subtitle: 'What The Crown Was Made To Lock Away', sheet: 'hollow', home: 19, deep: true,
    hp: 1450, speed: 26, radius: 24, hitRadius: 28, contactDamage: 1, mass: 99, move: 'hover', restTime: [0.55, 0.9],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.6, count: 22, speed: 100, frame: 10, rings: 2, holes: 3, gapSpin: 0.6, anim: 'cast' }],
        [3, 'homing', { windup: 0.6, count: 5, speed: 85, turn: 1.6, frame: 6 }],
        [2, 'summon', { windup: 0.8, type: 'heartleech', count: 3, max: 4, anim: 'cast' }],
      ] },
      { below: 0.66, speedMult: 1.1, attacks: [
        [3, 'laser', { windup: 0.85, duration: 1.8, sweep: 1.5, width: 6, beams: 2, color: 'abyss' }],
        [3, 'spiral', { windup: 0.6, arms: 4, rate: 10, duration: 2.6, speed: 100, turn: 1.2, frame: 10 }],
        [2, 'wall', { windup: 0.7, speed: 85, frame: 10, gapSize: 3, volleys: 3, gapStep: 1 }],
      ] },
      { below: 0.33, speedMult: 1.2, attacks: [
        [3, 'cross', { windup: 0.55, arms: 4, rate: 10, duration: 2.6, speed: 115, turn: 1.0, frame: 6 }],
        [3, 'pull', { windup: 0.7, duration: 2.2, strength: 60, ring: 16, frame: 10 }],
        [2, 'laser', { windup: 0.85, duration: 2.0, sweep: 1.6, width: 6, beams: 3, color: 'abyss' }],
        [2, 'summon', { windup: 0.8, type: 'hollowborn', count: 1, max: 2, anim: 'cast' }],
      ] },
    ],
  },
};
