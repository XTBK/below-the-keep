// Boss stats. Each chapter has a smaller boss (first floor) and a main boss (second floor).

export const BOSSES = {
  ratmother: {
    home: 1,
    name: 'Mother of Rats',
    subtitle: 'She Who Breeds in the Drains',
    hp: 150,
    speed: 34,
    radius: 22,
    hitRadius: 26,
    contactDamage: 1,
    mass: 30,
    restTime: [0.8, 1.3], // pause between attacks
    // Gnashing Charge
    chargeWindup: 0.75,
    chargeSpeed: 270,
    chargeStun: 0.9, // dazed after hitting a wall
    // Brood Call
    broodWindup: 0.8,
    broodCount: 3,
    maxRats: 6,
    // Plague Spit
    spitWindup: 0.55,
    spitCount: 5,
    spitSpread: 0.9, // radians across the whole fan
    spitSpeed: 140,
    // second phase (below this fraction of health): faster, charges twice
    enrageAt: 0.5,
    enrageSpeed: 1.3,
  },
  warden: {
    home: 2,
    name: 'The Warden',
    subtitle: 'Keeper of Every Lock Below',
    hp: 260,
    speed: 30,
    radius: 22,
    hitRadius: 26,
    contactDamage: 1,
    mass: 40,
    restTime: [0.7, 1.1],
    // Iron Sweep: a flail of chain and burning cage in a wide arc
    sweepRange: 90,
    sweepReach: 84,
    sweepArc: 1.25,
    sweepWindup: 0.85,
    // Lock-Down Slam: leaps onto you, ring of stone shards on landing
    slamWindup: 0.5,
    slamAir: 0.65,
    slamRadius: 40,
    shardCount: 10,
    shardSpeed: 150,
    // Turnkey's Volley: a fan of thrown iron keys
    volleyWindup: 0.6,
    volleyCount: 3,
    volleySpread: 0.45,
    volleySpeed: 250,
    enrageAt: 0.5,
    enrageVolley: 5,
    guards: 2, // crossbowmen called in once when enraged
  },
};

// ---------------------------------------------------------------------------------------------
// Pattern bosses: built from the attack PATTERNS in src/enemies/bosses/patterns.js.
// Each phase lists weighted attacks: [weight, pattern, params]. A phase starts when the boss's
// health drops below `below` (fraction). `move`: chase | keepRange | hover | circle.
// Orb frames: 0 glob, 1 shard, 2 key, 3 bone, 4 wisp, 5 thorn, 6 curse, 7 coin, 8 fire, 9 web,
// 10 shadow, 11 iron ball, 12 rune.
// ---------------------------------------------------------------------------------------------
import { PATTERN_BOSSES_2 } from './bosses2.js';

export const PATTERN_BOSSES = {
  gravedigger: {
    home: 3,
    name: 'The Gravedigger',
    subtitle: 'He Has Dug a Hole For You',
    sheet: 'gravedigger',
    hp: 230, speed: 36, radius: 14, hitRadius: 17, contactDamage: 1, mass: 30, move: 'chase', restTime: [0.8, 1.3],
    phases: [
      { below: 1, attacks: [
        [3, 'lob', { windup: 0.6, count: 3, spread: 46, time: 0.8, patch: null, shards: 5, frame: 3 }],
        [3, 'rain', { windup: 0.4, count: 1, onPlayer: true, radius: 18, delay: 0.9, visual: 3, shards: 8, shardFrame: 3, burrow: true }],
        [2, 'summon', { windup: 0.9, type: 'skeleton', count: 2, max: 4 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'lob', { windup: 0.5, count: 5, spread: 60, time: 0.75, patch: null, shards: 5, frame: 3 }],
        [3, 'rain', { windup: 0.4, count: 2, onPlayer: true, radius: 18, delay: 0.8, visual: 3, shards: 8, shardFrame: 3, burrow: true }],
        [2, 'summon', { windup: 0.8, type: 'skeleton', count: 2, max: 4 }],
      ] },
    ],
  },
  colossus: {
    home: 4,
    name: 'The Bone Colossus',
    subtitle: 'Ten Thousand Dead, Standing As One',
    sheet: 'colossus',
    hp: 420, speed: 22, radius: 24, hitRadius: 28, contactDamage: 1, mass: 80, move: 'chase', restTime: [0.9, 1.4],
    phases: [
      { below: 1, attacks: [
        [3, 'rain', { windup: 0.7, count: 3, nearPlayer: 50, radius: 26, delay: 0.9, visual: 1, shards: 6, shardFrame: 3, anim: 'cast' }],
        [3, 'rain', { windup: 0.5, count: 7, spread: 130, radius: 14, delay: 1.1, visual: 5 }],
        [2, 'spiral', { windup: 0.6, arms: 2, rate: 11, duration: 2.2, speed: 100, turn: 1.6, frame: 3 }],
      ] },
      { below: 0.5, speedMult: 1.25, attacks: [
        [3, 'rain', { windup: 0.6, count: 4, nearPlayer: 55, radius: 26, delay: 0.85, visual: 1, shards: 8, shardFrame: 3, anim: 'cast' }],
        [2, 'rain', { windup: 0.5, count: 10, spread: 150, radius: 14, delay: 1.0, visual: 5 }],
        [2, 'spiral', { windup: 0.6, arms: 3, rate: 13, duration: 2.4, speed: 105, turn: 1.8, frame: 3 }],
        [2, 'charge', { windup: 0.8, speed: 240, stun: 1.2, repeats: 1 }],
      ] },
    ],
  },
  briarhound: {
    home: 5,
    name: 'The Briar Hound',
    subtitle: 'The Forest Hunts You Back',
    sheet: 'briarhound',
    hp: 280, speed: 115, radius: 16, hitRadius: 19, contactDamage: 1, mass: 25, move: 'circle', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [4, 'pounce', { windup: 0.45, time: 0.5, height: 26, repeats: 2, radius: 22 }],
        [2, 'ring', { windup: 0.6, count: 16, speed: 130, frame: 5, rings: 1 }],
        [2, 'summon', { windup: 0.8, type: 'direwolf', count: 2, max: 3 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [4, 'pounce', { windup: 0.4, time: 0.45, height: 26, repeats: 3, radius: 22 }],
        [3, 'ring', { windup: 0.55, count: 20, speed: 135, frame: 5, rings: 2, gap: 0.3 }],
        [1, 'summon', { windup: 0.8, type: 'direwolf', count: 2, max: 3 }],
      ] },
    ],
  },
  thornwitch: {
    home: 6,
    name: 'The Thorn Witch',
    subtitle: 'Mother of the Hollow, Bride of Rot',
    sheet: 'thornwitch',
    hp: 440, speed: 32, radius: 14, hitRadius: 17, contactDamage: 1, mass: 40, move: 'keepRange', range: [120, 200], restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'lines', { windup: 0.7, directions: 3, spread: 0.5, steps: 12, spacing: 18, delay: 0.05, radius: 12, visual: 0 }],
        [3, 'fan', { windup: 0.6, count: 5, spread: 0.9, speed: 110, frame: 6, volleys: 2, gap: 0.4, wave: [24, 6] }],
        [2, 'lob', { windup: 0.6, count: 4, spread: 80, time: 0.85, patch: 'poison', patchRadius: 26, patchTime: 3.2, frame: 0 }],
        [1, 'blink', {}],
      ] },
      { below: 0.5, attacks: [
        [3, 'lines', { windup: 0.6, directions: 5, spread: 0.45, steps: 13, spacing: 18, delay: 0.045, radius: 12, visual: 0 }],
        [2, 'spiral', { windup: 0.5, arms: 3, rate: 12, duration: 2.2, speed: 95, turn: 1.5, frame: 6 }],
        [2, 'summon', { windup: 0.8, type: 'thornling', count: 2, max: 3 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  pyrebishop: {
    home: 7,
    name: 'The Pyre Bishop',
    subtitle: 'He Blesses Every Flame',
    sheet: 'pyrebishop',
    hp: 330, speed: 30, radius: 13, hitRadius: 16, contactDamage: 1, mass: 30, move: 'keepRange', range: [90, 170], restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.65, count: 16, speed: 105, frame: 8, rings: 2, gap: 0.4, spin: 0.2, anim: 'cast' }],
        [3, 'lob', { windup: 0.6, count: 5, spread: 80, time: 0.85, patch: 'fire', patchRadius: 14, patchTime: 2.6, frame: 8 }],
        [2, 'rain', { windup: 0.5, count: 4, spread: 110, radius: 18, delay: 1.0, visual: 2 }],
      ] },
      { below: 0.5, speedMult: 1.15, attacks: [
        [3, 'ring', { windup: 0.55, count: 20, speed: 110, frame: 8, rings: 3, gap: 0.35, spin: 0.15, anim: 'cast' }],
        [2, 'rain', { windup: 0.5, count: 6, spread: 130, radius: 18, delay: 0.95, visual: 2 }],
        [3, 'spiral', { windup: 0.5, arms: 2, rate: 14, duration: 2.0, speed: 110, turn: 2.0, frame: 8 }],
      ] },
    ],
  },
  champion: {
    home: 8,
    name: 'The Black Champion',
    subtitle: 'The King’s Last Sword',
    sheet: 'champion',
    hp: 520, speed: 42, radius: 18, hitRadius: 21, contactDamage: 1, mass: 50, move: 'chase', restTime: [0.7, 1.1],
    phases: [
      { below: 1, attacks: [
        [3, 'charge', { windup: 0.8, speed: 320, stun: 0.8, repeats: 1 }],
        [3, 'lines', { windup: 0.8, directions: 3, spread: 0.42, steps: 12, spacing: 18, delay: 0.04, radius: 12, visual: 4 }],
        [3, 'sweep', { windup: 0.7, reach: 84, arc: 1.3 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'charge', { windup: 0.7, speed: 330, stun: 0.6, repeats: 2 }],
        [3, 'lines', { windup: 0.7, directions: 5, spread: 0.4, steps: 13, spacing: 18, delay: 0.035, radius: 12, visual: 4 }],
        [2, 'sweep', { windup: 0.6, reach: 88, arc: 1.4 }],
        [1, 'summon', { windup: 0.8, type: 'blackknight', count: 1, max: 2 }],
      ] },
    ],
  },
  madking: {
    home: 9,
    name: 'The Mad King',
    subtitle: 'Long May He Reign',
    sheet: 'madking1',
    hp: 900, speed: 30, radius: 18, hitRadius: 21, contactDamage: 1, mass: 60, move: 'hover', restTime: [0.7, 1.1],
    phases: [
      { below: 1, title: 'The Mad King', attacks: [
        [3, 'ring', { windup: 0.65, count: 18, speed: 100, frame: 7, rings: 3, gap: 0.35, spin: 0.17, anim: 'cast' }],
        [3, 'fan', { windup: 0.6, count: 7, spread: 1.2, speed: 160, frame: 7, volleys: 3, gap: 0.3 }],
        [2, 'summon', { windup: 0.9, type: 'crossbowman', count: 2, max: 3 }],
      ] },
      { below: 0.66, sheet: 'madking2', move: 'chase', speedMult: 1.3, title: 'The King Unthroned', attacks: [
        [3, 'charge', { windup: 0.7, speed: 320, stun: 0.6, repeats: 2 }],
        [3, 'lob', { windup: 0.5, count: 6, spread: 100, time: 0.8, patch: 'fire', patchRadius: 14, patchTime: 2.6, frame: 8 }],
        [3, 'spiral', { windup: 0.5, arms: 3, rate: 13, duration: 2.4, speed: 105, turn: 1.7, frame: 8 }],
      ] },
      { below: 0.33, sheet: 'madking3', move: 'hover', speedMult: 1.2, title: 'The Crown Wears The King', attacks: [
        [2, 'blink', {}],
        [3, 'rain', { windup: 0.5, count: 9, spread: 150, radius: 16, delay: 1.0, visual: 6 }],
        [3, 'spiral', { windup: 0.5, arms: 4, rate: 16, duration: 2.6, speed: 100, turn: 1.4, frame: 10 }],
        [2, 'homing', { windup: 0.6, count: 4, speed: 80, turn: 1.8, frame: 10 }],
      ] },
    ],
  },
  crownwraith: {
    home: 9,
    name: 'The Hollow Crown',
    subtitle: 'What Whispered In The King’s Ear',
    sheet: 'crownwraith',
    hp: 1000, speed: 40, radius: 14, hitRadius: 17, contactDamage: 1, mass: 60, move: 'hover', restTime: [0.6, 1.0],
    phases: [
      { below: 1, attacks: [
        [3, 'spiral', { windup: 0.5, arms: 2, rate: 18, duration: 2.6, speed: 100, turn: 2.2, frame: 10 }],
        [3, 'homing', { windup: 0.6, count: 6, speed: 85, turn: 2.0, frame: 4 }],
        [3, 'ring', { windup: 0.6, count: 24, speed: 95, frame: 12, rings: 3, gap: 0.3, spin: 0.13, anim: 'cast' }],
        [2, 'blink', {}],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'lines', { windup: 0.6, directions: 6, spread: 1.05, steps: 14, spacing: 18, delay: 0.035, radius: 12, visual: 6 }],
        [3, 'rain', { windup: 0.5, count: 12, spread: 160, radius: 16, delay: 0.95, visual: 6 }],
        [3, 'spiral', { windup: 0.4, arms: 4, rate: 20, duration: 2.8, speed: 105, turn: 2.4, frame: 10 }],
        [2, 'blink', {}],
      ] },
    ],
  },
  keeper: {
    home: 5,
    name: 'The Forgotten Keeper',
    subtitle: 'Guardian of What Was Buried',
    sheet: 'keeper',
    hp: 360, speed: 26, radius: 16, hitRadius: 19, contactDamage: 1, mass: 60, move: 'chase', restTime: [0.8, 1.2],
    phases: [
      { below: 1, attacks: [
        [3, 'ring', { windup: 0.6, count: 14, speed: 100, frame: 12, rings: 2, gap: 0.4, spin: 0.22, anim: 'cast' }],
        [3, 'slam', { windup: 0.5, air: 0.65, radius: 40, shards: 10, shardSpeed: 140, frame: 12 }],
        [2, 'summon', { windup: 0.9, type: 'golem', count: 1, max: 2 }],
      ] },
      { below: 0.5, speedMult: 1.2, attacks: [
        [3, 'ring', { windup: 0.5, count: 18, speed: 105, frame: 12, rings: 3, gap: 0.35, spin: 0.2, anim: 'cast' }],
        [3, 'slam', { windup: 0.45, air: 0.6, radius: 44, shards: 14, shardSpeed: 145, frame: 12 }],
        [2, 'homing', { windup: 0.6, count: 3, speed: 80, turn: 1.6, frame: 12 }],
      ] },
    ],
  },
};

Object.assign(PATTERN_BOSSES, PATTERN_BOSSES_2);

// Every boss that can guard an ordinary floor. Each floor draws one AT RANDOM (seeded, no repeats in a
// run) and scales it to the floor's depth (data/difficulty.js). The Mad King always waits on the
// throne floor, the Forgotten Keeper in the Vault, the Hollow Crown behind the sealed door.
export const BOSS_ROSTER = ['ratmother', 'warden', ...Object.keys(PATTERN_BOSSES).filter((k) => !['madking', 'crownwraith', 'keeper'].includes(k))];

/** The floor a boss is tuned for. */
export function bossHome(type) {
  return BOSSES[type] ? BOSSES[type].home : PATTERN_BOSSES[type].home;
}

export const BOSS_FX = {
  introTime: 2.4, // title card
  deathTime: 2.2, // death animation before the room opens
};
