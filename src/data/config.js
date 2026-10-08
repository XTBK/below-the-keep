// ============================================================================
// ALL tunable numbers live here (and in the other /src/data files).
// Units: 1 world unit = 1 game pixel. Times are in seconds. Speeds in pixels/second.
// ============================================================================

export const RENDER = {
  width: 640, // low-res internal resolution
  height: 360,
  clearColor: 0x050407,
  bloom: {
    threshold: 0.9, // linear brightness above which pixels start to glow
    knee: 0.5, // softness of the threshold
    strength: 0.55,
    blurPasses: 2,
  },
  vignette: { strength: 0.55, radius: 0.78, softness: 0.45 },
  exposure: 1.15,
  normalStrength: 0.7, // how strongly generated height maps bend the light
};

export const SIM = {
  maxDt: 1 / 30, // clamp long frames so physics never explodes
};

export const ROOM = {
  tile: 32,
  cols: 13, // floor tiles across (one cell)
  rows: 7, // floor tiles down (one cell)
  wallTop: 64, // top wall: 16px cap + 48px brick front face
  wallTopCap: 16,
  wallSide: 32,
  wallBottom: 32,
  hudBand: 40, // pixels of screen above the room reserved for HUD
  cellW: 480, // one grid cell of a floor = one 1x1 room including walls
  cellH: 320,
  maxLights: 10, // lights a single room may use (two rooms are lit during a transition)
  torchChance: 0.85, // chance a stretch of top wall gets torches
  torchSpacing: 6, // tiles between torches along a wall
  chainChance: 0.12, // per top-wall tile
  windowChance: 0.08,
};

// Floor generation (see GAME_DESIGN.md section 5)
export const FLOOR = {
  gridW: 9,
  gridH: 8,
  startX: 4,
  startY: 3,
  baseRooms: 5, // room count = random(0..1) + baseRooms + floorNumber * roomsPerFloor
  roomsPerFloor: 2.6,
  maxRooms: 20,
  skipChance: 0.5, // chance to skip a free neighbour while growing
  maxAttempts: 200,
  maxRestarts: 30,
  largeRoomChance: 0.3, // per eligible normal room: try to merge it into a large shape
  largeShapes: { '2x2': 1, L: 2, '2x1': 3, '1x2': 3 }, // relative weights
  secretMinNeighbours: 3,
  trialChance: 0.6, // a Trial Chamber in a spare dead end
  denChance: 0.5, // a Gambler's Den in another
  illusoryChance: 0.55, // chance a floor has one illusory wall (a walk-through shortcut)
  // difficulty pool weights for normal rooms
  difficulty: {
    near: { easy: 1, medium: 0, hard: 0 }, // rooms touching the start room
    far: { easy: 0.45, medium: 0.4, hard: 0.15 },
    perFloorHardBonus: 0.05,
  },
};

export const TRANSITION = {
  duration: 0.42, // seconds for the camera to slide to the next room
  entryInset: 22, // how far inside the new room Wren appears
  lockDelay: 0.25, // doors slam shut this long after entering a room with enemies
};

export const DOOR = {
  triggerHalfWidth: 13, // how close to the door centre Wren must be to walk through
};

export const MINIMAP = {
  cellW: 6, // a room cell on the parchment map, in pixels
  cellH: 5,
  gap: 2, // room for the inked corridors between rooms
  margin: 3,
};

export const HAZARDS = {
  spikeDamage: 1, // half hearts
  spikeInset: 7, // spike hitbox is this much smaller than the tile on each side
};

// How each weapon handles. (Damage itself comes from Wren's stats and relics.)
export const WEAPONS = {
  sling: { recoil: 18, shake: 0 },
  wand: { recoil: 14, shake: 0 },
  crossbow: { recoil: 70, shake: 0.08 }, // a hard kick back
  sword: {
    reach: 40, // how far the swing reaches
    arc: 1.25, // half the width of the swing (radians)
    damage: 2.5, // x his damage stat
    knockback: 300,
    cooldown: 1.65, // x his fire delay
    lunge: 70, // a step forward into the swing
    waveDamage: 0.35, // the thrown sword-wave: weak...
    waveRange: 80, //            ...and short
  },
};

// The weight of a fight: crits, numbers, little freezes on hits, squash on the struck.
export const COMBAT = {
  critChance: 0.08, // +2% per point of luck
  critMultiplier: 2,
  critHitStop: 0.07, // seconds of slow motion on a critical hit (ordinary hits never slow the game)
  squash: 0.14, // how long a struck enemy squashes
  damageNumbers: true,
};

// The dodge roll (Shift / gamepad B / the ROLL button): a quick tumble you can't be hurt in.
// The attack budget: only so many ordinary enemies may be mid-attack at once (bosses don't count).
// A crowded room takes turns instead of firing everything at once. Each enemy's turn lasts `turn`
// seconds; afterwards it waits `rest` before it may take another, so the turns go round.
export const ATTACK_BUDGET = {
  early: 3, // floors 1-4
  late: 4, // floors 5 and deeper
  turn: 1.4,
  rest: 0.6,
};

// It bursts out fast and eases off (speed x burst at the start, x settle at the end), can be steered
// a little, carries its momentum out, and a press just before it's ready is remembered (buffer).
export const ROLL = {
  time: 0.28,
  speed: 300,
  burst: 1.3,
  settle: 0.6,
  steer: 7, // how fast the tumble bends toward the stick (per second)
  cooldown: 0.42,
  buffer: 0.2, // seconds a dodge press waits for the cooldown
  hop: 5, // pixels of hop at the top of the tumble
};

// Each starting hero's own take on the dodge button (see 'dodge' in data/characters.js).
export const SKILLS = {
  // Wren: a short teleport. Passes enemies and pits, stops at walls and rocks.
  blink: { distance: 84, cooldown: 1.2, invuln: 0.25, burst: 1.5, burstRadius: 36 }, // burst: sparks left behind (x damage)
  // Rowan: a normal roll that also reloads the crossbow at once...
  // ...and standing still steadies the aim: the next bolt is a sure critical hit.
  steady: { still: 0.5 },
  // Sir Aldwin: a short shield-first dash that knocks foes aside and stuns them.
  charge: { time: 0.25, speed: 350, cooldown: 0.68, damage: 1, knockback: 260, stun: 0.8, burst: 1.25, settle: 0.65, steer: 3.5 },
};

export const PLAYER = {
  startHalfHearts: 6, // 3 full hearts
  maxHalfHearts: 6,
  radius: 6, // collision circle at the feet
  moveSpeed: 120,
  accel: 1300,
  friction: 1500,
  // shooting
  damage: 3.5,
  fireDelay: 0.36, // seconds between stones
  shotSpeed: 270,
  range: 200, // pixels a stone flies before it starts to drop
  luck: 0,
  inheritVelocity: 0.35, // how much of Wren's movement carries into his stones
  throwAnimTime: 0.16,
  // getting hurt
  invulnTime: 1.0, // seconds of invincibility after a hit
  hurtKnockback: 160,
  blinkRate: 14, // blinks per second while invincible
  deathRestartDelay: 2.2, // placeholder until the Phase 5 death screen
  light: { brightness: 0.75, height: 40, radius: 150, color: 0xffd8b0 },
};

export const PROJECTILE = {
  poolSize: 256,
  hitRadius: 3,
  dropGravity: 520, // how fast a stone falls once out of range
  knockback: 90, // used by enemies in Phase 3
};

export const FEEL = {
  shakeDecay: 2.6, // trauma lost per second
  shakeMax: 5, // max pixel offset at full trauma
  impactShake: 0.06,
  barrelHitShake: 0.1,
  barrelBreakShake: 0.35,
  barrelBreakHitStop: 0.06, // seconds of frozen time
  hitFlashTime: 0.07,
  hurtShake: 0.45,
  hurtHitStop: 0.08,
  doorSlamShake: 0.15,
};

export const PROPS = {
  barrel: { hp: 7, radius: 10, wobbleTime: 0.18, wobblePixels: 2, sprite: 'barrel', broken: 'barrel_broken', effect: 'wood', enemy: false },
  rock: { halfSize: 13 },
  brazier: { halfSize: 9 },
  pedestal: { halfSize: 11 },
  table: { halfSize: 14 },
};

export const PARTICLES = {
  maxLit: 2048, // dust, debris, smoke (affected by lights)
  maxGlow: 1024, // embers, sparks (additive, self-lit)
  dust: { count: 90, speed: 4, life: [6, 12], size: [1, 1], alpha: 0.55 },
  embers: {
    perSecondTorch: 5,
    perSecondBrazier: 14,
    rise: [18, 40],
    life: [0.6, 1.6],
    wander: 22,
  },
  stoneImpact: { chips: 5, puffs: 4 },
  barrelBreak: { splinters: 22, chunks: 6, dust: 14 },
  crackDust: { perSecond: 1.4 }, // dust trickling from a cracked (secret) wall
  doorDust: 8, // puffs per door when doors slam
  gravity: 380,
};

export const LIGHTING = {
  poolSize: 24, // fixed number of point lights (never changes = no shader recompiles)
  decay: 1.5, // physical falloff exponent (2 = realistic, lower = softer)
  torch: { brightness: 1.5, height: 46, radius: 230, color: 0xffa860, flicker: 0.22, flickerSpeed: 9 },
  brazier: { brightness: 2.0, height: 52, radius: 300, color: 0xffac60, flicker: 0.18, flickerSpeed: 7 },
  candle: { brightness: 0.8, height: 20, radius: 110, color: 0xffc070, flicker: 0.12, flickerSpeed: 12 },
  lantern: { brightness: 0.9, height: 30, radius: 150, color: 0xffd090, flicker: 0.06, flickerSpeed: 5 },
  bossGlow: { brightness: 0.8, height: 30, radius: 130, color: 0xff3020, flicker: 0.3, flickerSpeed: 3 },
  jitterPixels: 1.5, // how far lights wander as flames dance
  flameIntensity: 2.6, // HDR multiplier on flame sprites so they bloom
};

export const DEBUG = {
  fpsSampleTime: 0.5,
};
