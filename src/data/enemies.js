// Enemy stats and behaviour tunables. Speeds in px/s, times in seconds, damage in half hearts.
//
// Every enemy has:
//   hp, speed, radius (body/collision), hitRadius (how big a target it is for stones),
//   contactDamage (touching it hurts; 0 = only its attacks hurt), mass (heavier = less knockback)
// plus its own behaviour numbers.

export const ENEMIES = {
  rat: {
    name: 'Plague Rat',
    hp: 4,
    speed: 78,
    radius: 5,
    hitRadius: 7,
    contactDamage: 1,
    mass: 0.6,
    packSize: [3, 4], // rats come in packs: one spawn point = several rats
    jitterTime: [0.15, 0.45], // how often it changes its erratic direction
    jitterAngle: 1.3, // radians of randomness added to its heading
    biteRange: 34,
    rearTime: 0.28, // telegraph: rears up before lunging
    biteSpeed: 210,
    biteTime: 0.22,
    biteCooldown: [1.2, 2.0],
  },
  gaoler: {
    name: 'Gaoler',
    hp: 24,
    speed: 30,
    radius: 11,
    hitRadius: 13,
    contactDamage: 1,
    mass: 3,
    swingRange: 46, // starts a swing when this close
    swingReach: 44, // radius of the key-ring arc
    swingArc: 1.1, // half-angle of the arc, radians
    windupTime: 0.55,
    swingTime: 0.16,
    recoverTime: 0.6,
  },
  prisoner: {
    name: 'Chained Prisoner',
    hp: 12,
    speed: 34,
    radius: 7,
    hitRadius: 9,
    contactDamage: 1,
    mass: 1,
    chainLength: 104, // how far from his anchor ring he can ever get
    sightRange: 170,
    windupTime: 0.5,
    lungeSpeed: 330,
    lungeTime: 0.45,
    recoverTime: 0.9,
    cooldown: [0.6, 1.2],
  },
  imp: {
    name: 'Torch Imp',
    hp: 9,
    speed: 62,
    radius: 6,
    hitRadius: 8,
    contactDamage: 1,
    mass: 0.8,
    preferredRange: [110, 175], // backs off if closer, approaches if farther
    attackInterval: [2.2, 3.4],
    windupTime: 0.65,
    lobTime: 0.85, // flight time of a fireball
    patchTime: 2.6, // burning patch lifetime
    patchRadius: 14,
    patchDamage: 1,
  },
  ghoul: {
    name: 'Ghoul',
    hp: 14,
    speed: 36,
    radius: 8,
    hitRadius: 10,
    contactDamage: 1,
    mass: 1.4,
    swipeRange: 30,
    windupTime: 0.45,
    swipeTime: 0.18,
    swipeLunge: 120,
    recoverTime: 0.55,
    fliesOnDeath: 3,
  },
  fly: {
    name: 'Carrion Fly',
    hp: 2,
    speed: 58,
    radius: 3,
    hitRadius: 6,
    contactDamage: 1,
    mass: 0.3,
    flying: true,
    wobble: 70, // sideways buzzing strength
  },
  crossbowman: {
    name: 'Crossbowman',
    hp: 12,
    speed: 44,
    radius: 7,
    hitRadius: 9,
    contactDamage: 1,
    mass: 1.2,
    repositionTime: [0.9, 1.6],
    aimTime: 0.9, // red line tracks you
    lockTime: 0.28, // red line stops tracking and flashes: dodge now!
    reloadTime: 1.1,
    boltSpeed: 330,
    boltDamage: 1,
    preferredRange: [90, 220],
  },
  mimic: {
    name: 'Barrel Mimic',
    hp: 16,
    speed: 0,
    radius: 9,
    hitRadius: 11,
    contactDamage: 1,
    mass: 2,
    wakeRange: 52, // wakes up when you come this close (or shoot it)
    wakeTime: 0.6,
    crouchTime: 0.36, // telegraph: squashes down before every hop
    hopTime: 0.5,
    hopDistance: 70,
    hopHeight: 22,
    landRadius: 16, // landing on you hurts
    restTime: 0.35,
  },

  // ===================== Chapter 2: The Catacombs =====================
  skeleton: {
    name: 'Skeleton Footman', hp: 12, speed: 36, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1.2,
    slashRange: 30, windupTime: 0.45, slashTime: 0.18, recoverTime: 0.5,
    shieldArc: 0.35, // stones coming at his shield side are blocked (dot product threshold)
  },
  archer: {
    name: 'Bone Archer', hp: 9, speed: 40, radius: 6, hitRadius: 8, contactDamage: 1, mass: 1,
    preferredRange: [100, 200], aimTime: 0.75, arrows: 3, spread: 0.32, arrowSpeed: 230, reloadTime: 1.4,
  },
  wraith: {
    name: 'Candle Wraith', hp: 14, speed: 30, radius: 7, hitRadius: 9, contactDamage: 1, mass: 0.8, flying: true,
    appearTime: 0.45, castTime: 0.65, wisps: 2, wispSpeed: 72, wispTurn: 1.6, lingerTime: 1.2, vanishTime: 0.4,
    weakenedDamage: 2, // takes this much more damage once every candle in the room is snuffed
  },
  golem: {
    name: 'Ossuary Golem', hp: 30, speed: 22, radius: 12, hitRadius: 14, contactDamage: 1, mass: 4,
    sightRange: 240, windupTime: 0.85, chargeSpeed: 270, stunTime: 1.6, cooldown: [1.2, 2.2],
  },
  spider: {
    name: 'Crypt Spider', hp: 10, speed: 70, radius: 6, hitRadius: 8, contactDamage: 1, mass: 0.7,
    ceilingTime: [1.4, 2.4], dropWarn: 0.8, dropRadius: 14, spitTime: 0.45, webSpeed: 140, webTime: 4, scuttleTime: [2.5, 4],
  },
  worm: {
    name: 'Grave Worm', hp: 14, speed: 60, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.5,
    burrowTime: [1.2, 2.0], warnTime: 0.85, eruptRadius: 16, shards: 8, shardSpeed: 120, surfaceTime: 1.4,
  },
  doctor: {
    name: 'Plague Doctor', hp: 12, speed: 46, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1,
    preferredRange: [110, 180], attackInterval: [2.0, 3.0], windupTime: 0.6, lobTime: 0.8,
    cloudRadius: 26, cloudTime: 3.2, cloudDamage: 1, retreatTime: 0.9,
  },
  spectre: {
    name: 'Mourning Spectre', hp: 11, speed: 72, radius: 6, hitRadius: 8, contactDamage: 1, mass: 0.6, flying: true, ghost: true,
    glideTime: 1.3, stillTime: 1.1, warnTime: 0.35, // only visible (and hittable) while moving
  },

  // ===================== Chapter 3: The Hollow =====================
  witch: {
    name: 'Hedge Witch', hp: 14, speed: 38, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1,
    preferredRange: [100, 190], castTime: 0.6, bolts: 5, boltSpeed: 120, waveAmp: 26, waveFreq: 6,
    summonChance: 0.25, summonTime: 0.9, summonCount: 2, attackInterval: [1.8, 2.8],
  },
  thornling: {
    name: 'Thornling', hp: 16, speed: 0, radius: 9, hitRadius: 11, contactDamage: 1, mass: 99,
    rhythm: 2.2, warnTime: 0.55, thorns: 8, thornSpeed: 140,
  },
  direwolf: {
    name: 'Dire Wolf', hp: 14, speed: 110, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.4,
    circleRadius: 80, circleTime: [1.4, 2.4], crouchTime: 0.42, pounceTime: 0.45, pounceHeight: 18, recoverTime: 0.6,
  },
  bloater: {
    name: 'Spore Bloater', hp: 10, speed: 26, radius: 9, hitRadius: 11, contactDamage: 0, mass: 1.5,
    popRange: 34, swellTime: 0.75, cloudRadius: 32, cloudTime: 3.5, cloudDamage: 1,
  },
  wisp: {
    name: 'Wisp', hp: 8, speed: 34, radius: 5, hitRadius: 8, contactDamage: 1, mass: 0.5, flying: true,
    attackInterval: [2.4, 3.4], chargeTime: 0.6, spiralTime: 1.1, spiralRate: 11, orbSpeed: 92,
  },
  scarecrow: {
    name: 'Scarecrow', hp: 22, speed: 0, radius: 8, hitRadius: 10, contactDamage: 0, mass: 99,
    triggerRange: 44, // a stone passing this close sets the crows off
    warnTime: 0.35, crows: 3, cooldown: 2.4,
  },
  crow: {
    name: 'Crow', hp: 3, speed: 130, radius: 4, hitRadius: 7, contactDamage: 1, mass: 0.3, flying: true,
    lifeTime: 4,
  },
  sapling: {
    name: 'Root Sapling', hp: 16, speed: 24, radius: 8, hitRadius: 10, contactDamage: 1, mass: 2,
    attackInterval: [2.2, 3.2], windupTime: 0.75, rootSteps: 8, rootSpacing: 18, rootDelay: 0.06, rootRadius: 11,
  },
  cutpurse: {
    name: 'Goblin Cutpurse', hp: 9, speed: 125, radius: 6, hitRadius: 8, contactDamage: 0, mass: 0.8,
    grabTime: 0.3, steal: 3, fleeSpeed: 150, escapeTime: 7,
  },

  // ===================== Chapter 4: The Burning Halls =====================
  blackknight: {
    name: 'Black Knight', hp: 26, speed: 34, radius: 9, hitRadius: 11, contactDamage: 1, mass: 3,
    windupTime: 0.85, chargeSpeed: 300, stunTime: 0.9, cooldown: [1.4, 2.4],
  },
  flailbrute: {
    name: 'Flail Brute', hp: 28, speed: 32, radius: 10, hitRadius: 12, contactDamage: 1, mass: 3,
    spinRange: 76, windupTime: 0.6, spinTime: 2.2, spinRadius: 54, spinSpeed: 6.5, dizzyTime: 0.9,
  },
  gargoyle: {
    name: 'Gargoyle', hp: 18, speed: 0, radius: 9, hitRadius: 11, contactDamage: 1, mass: 2, flying: true,
    wakeRange: 130, stoneTime: [2.2, 3.2], wakeTime: 0.6, swoopSpeed: 230, swoopTime: 0.9,
  },
  magus: {
    name: 'Court Magus', hp: 16, speed: 30, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1,
    castTime: 0.75, rings: 2, ringCount: 12, ringSpeed: 95, ringGap: 0.35, blinkTime: 0.35, restTime: [1.0, 1.6],
  },
  livingarmour: {
    name: 'Living Armour', hp: 20, speed: 32, radius: 8, hitRadius: 10, contactDamage: 1, mass: 2,
    slashRange: 30, windupTime: 0.5, slashTime: 0.18, recoverTime: 0.6,
    pileTime: 2.6, pileHits: 2, // hit the collapsed pile this often to stop it reassembling
  },
  drake: {
    name: 'Drake Whelp', hp: 18, speed: 44, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.5,
    preferredRange: [60, 120], inhaleTime: 0.9, breathTime: 0.85, coneLength: 96, coneAngle: 0.45, cooldown: [1.6, 2.6],
  },
  executioner: {
    name: 'Executioner', hp: 30, speed: 30, radius: 10, hitRadius: 12, contactDamage: 1, mass: 3,
    slamRange: 120, windupTime: 0.9, waves: 3, waveSpread: 0.5, waveSteps: 10, waveSpacing: 18, waveDelay: 0.045, recoverTime: 1.0,
  },
  // ===================== The second bestiary (5 more per chapter) =====================
  // --- the Cells ---
  hound: {
    name: 'Kennel Hound', hp: 9, speed: 70, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1, tier: 'easy',
    // the Kennel Hound barks (a cone that shoves you back) and snaps in short hop-bites;
    // the Hellhound (which shares its body) keeps the long dashes
    barkRange: 64, barkWarn: 0.45, barkCone: 0.7, barkPush: 260, biteRange: 120, biteWarn: 0.28, biteSpeed: 230, biteTime: 0.2,
    dashWarn: 0.4, dashSpeed: 260, dashTime: 0.35, restTime: [0.6, 1.2],
  },
  torturer: {
    name: 'Torturer', hp: 22, speed: 34, radius: 9, hitRadius: 11, contactDamage: 1, mass: 2.5, tier: 'medium',
    hookRange: 180, aimTime: 0.75, hookSpeed: 300, pullStrength: 260, cooldown: [2.2, 3.2],
  },
  ratnest: {
    name: 'Rat Nest', hp: 26, speed: 0, radius: 12, hitRadius: 14, contactDamage: 0, mass: 99, tier: 'medium',
    birthEvery: 3.2, warnTime: 0.6, maxRats: 5,
  },
  monk: {
    name: 'Mad Monk', hp: 14, speed: 32, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1, tier: 'medium',
    castTime: 0.7, arms: 4, perArm: 3, orbSpeed: 115, cooldown: [1.8, 2.6], preferredRange: [80, 160],
  },
  slime: {
    name: 'Sewer Slime', hp: 14, speed: 30, radius: 9, hitRadius: 11, contactDamage: 1, mass: 1.5, tier: 'easy',
    hopWarn: 0.35, hopTime: 0.5, hopDistance: 60, restTime: [0.7, 1.3], splits: 2,
  },
  slimelet: {
    name: 'Slimelet', hp: 5, speed: 40, radius: 5, hitRadius: 7, contactDamage: 1, mass: 0.6,
    hopWarn: 0.25, hopTime: 0.35, hopDistance: 45, restTime: [0.4, 0.9], splits: 0,
  },
  // --- the Catacombs ---
  skull: {
    name: 'Flying Skull', hp: 7, speed: 95, radius: 6, hitRadius: 8, contactDamage: 1, mass: 0.6, flying: true, tier: 'easy',
  },
  banshee: {
    name: 'Banshee', hp: 18, speed: 34, radius: 7, hitRadius: 9, contactDamage: 1, mass: 0.8, flying: true, tier: 'hard',
    wailTime: 1.0, ringCount: 22, gap: 4, ringSpeed: 85, cooldown: [2.6, 3.6],
  },
  necromancer: {
    name: 'Necromancer', hp: 20, speed: 30, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1, tier: 'hard',
    raiseTime: 1.1, raiseCount: 2, maxRaised: 4, boltSpeed: 120, cooldown: [2.4, 3.4], preferredRange: [120, 200],
  },
  mummy: {
    name: 'Mummy', hp: 28, speed: 22, radius: 8, hitRadius: 10, contactDamage: 1, mass: 2, tier: 'medium',
    // it unravels: strips of grave-linen whirl around it; caught, you're hurt and your legs are bound (slowed)
    unwindRange: 70, unwindWarn: 0.7, unwindTime: 1.8, stripLength: 50, strips: 4, spin: 2.6, bindTime: 1.2,
    enrageAt: 0.5, enrageSpeed: 1.6, cooldown: [1.8, 2.6],
  },
  bat: {
    name: 'Crypt Bat', hp: 4, speed: 85, radius: 5, hitRadius: 8, contactDamage: 1, mass: 0.3, flying: true, tier: 'easy', packSize: [2, 3],
    swoopWarn: 0.35, swoopSpeed: 220, swoopTime: 0.45,
  },
  // --- the Hollow ---
  puffcap: {
    name: 'Puffcap', hp: 12, speed: 26, radius: 8, hitRadius: 10, contactDamage: 0, mass: 1.5, tier: 'easy',
    wakeRange: 90, warnTime: 0.5, spores: 10, sporeSpeed: 80, cooldown: [1.6, 2.4],
  },
  toad: {
    name: 'Bog Toad', hp: 12, speed: 0, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.2, tier: 'easy',
    hopWarn: 0.35, hopTime: 0.55, hopDistance: 70, tongueRange: 70, tongueWarn: 0.45, restTime: [0.6, 1.1],
  },
  treant: {
    name: 'Elder Treant', hp: 46, speed: 18, radius: 13, hitRadius: 16, contactDamage: 1, mass: 6, tier: 'hard',
    stompWarn: 0.9, rootRings: 2, ringRadius: [44, 76], swipeRange: 48, swipeWarn: 0.6, cooldown: [1.6, 2.4],
  },
  pixie: {
    name: 'Hollow Sprite', hp: 8, speed: 60, radius: 5, hitRadius: 8, contactDamage: 0, mass: 0.4, flying: true, tier: 'medium',
    aimTime: 0.4, dartSpeed: 260, blinkTime: 0.25, cooldown: [0.9, 1.5],
  },
  boar: {
    name: 'Tusked Boar', hp: 20, speed: 40, radius: 10, hitRadius: 12, contactDamage: 1, mass: 3, tier: 'medium',
    chargeWarn: 0.5, chargeSpeed: 240, chargeTime: 0.9, charges: 3, stunTime: 1.0, cooldown: [1.2, 2.0],
  },
  // --- the Burning Halls ---
  hellhound: {
    name: 'Hellhound', hp: 18, speed: 80, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.5, tier: 'hard',
    dashWarn: 0.45, dashSpeed: 300, dashTime: 0.45, fireEvery: 0.06, fireTime: 2.2, restTime: [0.8, 1.4],
  },
  ballista: {
    name: 'Ballista', hp: 30, speed: 0, radius: 12, hitRadius: 14, contactDamage: 0, mass: 99, tier: 'medium',
    aimTime: 1.2, lockTime: 0.3, boltSpeed: 420, reloadTime: 2.0,
  },
  jester: {
    name: 'Mad Jester', hp: 16, speed: 70, radius: 7, hitRadius: 9, contactDamage: 1, mass: 1, tier: 'medium',
    throwTime: 0.5, knives: 8, knifeSpeed: 150, spin: 0.35, cartwheelTime: 0.6, cooldown: [1.4, 2.2],
  },
  moltengolem: {
    name: 'Molten Golem', hp: 40, speed: 24, radius: 12, hitRadius: 14, contactDamage: 1, mass: 5, tier: 'hard',
    footprintEvery: 0.5, smashWarn: 0.8, smashRange: 60, shards: 10, embers: 3, cooldown: [2.0, 3.0],
  },
  ember: {
    name: 'Ember', hp: 3, speed: 90, radius: 4, hitRadius: 7, contactDamage: 1, mass: 0.3,
    lifeTime: 6,
  },
  // ---- the secret bestiary (only in the secret realms) ----
  drowned: {
    name: 'Drowned Pilgrim', hp: 20, speed: 30, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.6, tier: 'medium',
    spitRange: 120, windup: 0.6, count: 3, spread: 0.7, speed: 115, life: 1.1, cooldown: [1.8, 2.6],
  },
  eel: {
    name: 'Cistern Eel', hp: 18, speed: 70, radius: 8, hitRadius: 11, contactDamage: 1, mass: 1.2, tier: 'hard',
    underTime: 1.2, riseTime: 0.6, teeth: 8, toothSpeed: 100, lungeSpeed: 220, upTime: 1.4,
  },
  nun: {
    name: 'Hollow Nun', hp: 18, speed: 40, radius: 7, hitRadius: 9, contactDamage: 1, mass: 0.8, flying: true, tier: 'hard',
    preferredRange: [80, 150], blinkDist: 70, castTime: 0.7, orbSpeed: 80, homing: 1.2, cooldown: [2.4, 3.2],
  },
  acolyte: {
    name: 'Censer Acolyte', hp: 22, speed: 34, radius: 8, hitRadius: 10, contactDamage: 1, mass: 1.4, tier: 'medium',
    smokeEvery: 1.6, smokeRadius: 16, smokeTime: 3, spinRange: 70, windup: 0.7, ring: 10, orbSpeed: 95, cooldown: [2.2, 3.0],
  },
  bellows: {
    name: 'Bellows Imp', hp: 16, speed: 60, radius: 7, hitRadius: 9, contactDamage: 1, mass: 0.8, tier: 'medium',
    preferredRange: [50, 110], coneRange: 80, windup: 0.55, count: 6, spread: 0.8, speed: 150, cooldown: [1.8, 2.6],
  },
  anvilknight: {
    name: 'Anvil Knight', hp: 44, speed: 26, radius: 11, hitRadius: 13, contactDamage: 1, mass: 6, tier: 'hard',
    chargeRange: 160, aimTime: 0.7, chargeSpeed: 260, chargeTime: 0.45, slamWind: 0.45, ring: 14, ringSpeed: 100, cooldown: [2.4, 3.2],
  },
  bannerman: {
    name: 'Banner Bearer', hp: 22, speed: 30, radius: 8, hitRadius: 10, contactDamage: 1, mass: 2, tier: 'medium',
    auraRadius: 110, plantTime: 0.8, buffSpeed: 1.35, buffArmour: 0.6, preferredRange: [120, 200],
  },
};

// Rare tougher variant of any enemy: tinted, buffed, drops something special (Phase 4).
export const CHAMPION = {
  chance: 0.05,
  hpMult: 2,
  speedMult: 1.15,
  tint: [1.45, 0.72, 0.62], // multiplies the sprite's colours (a sickly crimson)
};

// Which enemy each digit (and 9 0 j k v, the second bestiary) in a room layout spawns, per chapter.
// 'e' picks from SPAWN_POOLS instead.
// ================================================================ the Deep's creatures (floors 10-19)
// Each fights like an older creature (the behaviour named in brackets) with a body of its own.
Object.assign(ENEMIES, {
  roothound: { ...ENEMIES.direwolf, name: 'Root Hound', hp: 20, speed: 118 }, // (Dire Wolf) circles, then pounces
  sapbulb: { ...ENEMIES.puffcap, name: 'Sap Bulb', hp: 18, spores: 12, sporeSpeed: 85 }, // (Puffcap) sinks into the floor, then sprays sap
  rimewraith: { ...ENEMIES.spectre, name: 'Rime Wraith', hp: 15, speed: 80 }, // (Spectre) unseen while still, glides at you
  icegolem: { ...ENEMIES.golem, name: 'Ice Golem', hp: 40, chargeSpeed: 290 }, // (Ossuary Golem) winds up and charges
  drownedknight: { ...ENEMIES.blackknight, name: 'Drowned Knight', hp: 34, chargeSpeed: 310 }, // (Black Knight) lance charge
  tidesiren: { ...ENEMIES.banshee, name: 'Tide Siren', hp: 22, ringCount: 20, gap: 5 }, // (Banshee) wails rings of water
  crystalspider: { ...ENEMIES.spider, name: 'Crystal Spider', hp: 14 }, // (Crypt Spider) drops from the ceiling
  shardmagus: { ...ENEMIES.magus, name: 'Shard Magus', hp: 22, ringCount: 12 }, // (Court Magus) blinks, casts rings
  heartleech: { ...ENEMIES.bat, name: 'Heart Leech', hp: 7, swoopSpeed: 230 }, // (Crypt Bat) swoops in packs
  hollowborn: { ...ENEMIES.executioner, name: 'Hollowborn', hp: 42 }, // (Executioner) slams waves across the floor
});

export const LAYOUT_DIGITS = {
  cells: { 1: 'rat', 2: 'gaoler', 3: 'prisoner', 4: 'imp', 5: 'ghoul', 6: 'crossbowman', 7: 'mimic', 9: 'hound', 0: 'torturer', j: 'ratnest', k: 'monk', v: 'slime' },
  catacombs: { 1: 'skeleton', 2: 'archer', 3: 'wraith', 4: 'golem', 5: 'spider', 6: 'worm', 7: 'doctor', 8: 'spectre', 9: 'skull', 0: 'banshee', j: 'necromancer', k: 'mummy', v: 'bat' },
  hollow: { 1: 'witch', 2: 'thornling', 3: 'direwolf', 4: 'bloater', 5: 'wisp', 6: 'scarecrow', 7: 'sapling', 8: 'cutpurse', 9: 'puffcap', 0: 'toad', j: 'treant', k: 'pixie', v: 'boar' },
  halls: { 1: 'blackknight', 2: 'flailbrute', 3: 'gargoyle', 4: 'magus', 5: 'livingarmour', 6: 'drake', 7: 'executioner', 8: 'mimic', 9: 'hellhound', 0: 'ballista', j: 'jester', k: 'moltengolem', v: 'bannerman' },
};
// the secret realms borrow a chapter's room layouts; their digits call up the realm's own creatures
LAYOUT_DIGITS.cistern = { ...LAYOUT_DIGITS.cells, 1: 'drowned', 2: 'drowned', 3: 'eel', 5: 'drowned', 9: 'eel', 0: 'eel', j: 'slime', k: 'drowned' };
LAYOUT_DIGITS.chapel = { ...LAYOUT_DIGITS.catacombs, 1: 'acolyte', 3: 'nun', 4: 'acolyte', 5: 'nun', 9: 'nun', 0: 'acolyte', k: 'nun' };
// the Deep borrows chapters' room layouts; their digits call up the Deep's creatures
LAYOUT_DIGITS.rootdeep = { ...LAYOUT_DIGITS.hollow, 1: 'roothound', 2: 'sapbulb', 3: 'roothound', 5: 'sapbulb', 9: 'roothound', 0: 'sapbulb' };
LAYOUT_DIGITS.frozen = { ...LAYOUT_DIGITS.catacombs, 1: 'rimewraith', 2: 'icegolem', 4: 'rimewraith', 5: 'icegolem', 9: 'rimewraith', 0: 'icegolem' };
LAYOUT_DIGITS.sunken = { ...LAYOUT_DIGITS.halls, 1: 'drownedknight', 2: 'tidesiren', 3: 'tidesiren', 5: 'drownedknight', 9: 'tidesiren', v: 'drownedknight' };
LAYOUT_DIGITS.amethyst = { ...LAYOUT_DIGITS.catacombs, 1: 'crystalspider', 2: 'shardmagus', 4: 'crystalspider', 5: 'shardmagus', 9: 'shardmagus', 0: 'crystalspider' };
LAYOUT_DIGITS.heart = { ...LAYOUT_DIGITS.hollow, 1: 'heartleech', 2: 'hollowborn', 3: 'heartleech', 5: 'hollowborn', 9: 'heartleech', 0: 'hollowborn' };
LAYOUT_DIGITS.forge = { ...LAYOUT_DIGITS.halls, 1: 'anvilknight', 2: 'bellows', 3: 'bellows', 5: 'anvilknight', 9: 'bellows', j: 'bellows', v: 'anvilknight' };

// Weighted picks for 'e' spawn points, by the layout's difficulty pool.
export const SPAWN_POOLS = {
  // the secret realms: their own creatures, with a few from the chapters above
  cistern: {
    easy: { drowned: 4, slime: 2, rat: 1, skull: 2 },
    medium: { drowned: 4, eel: 3, slime: 2, spider: 2, skull: 1 },
    hard: { drowned: 3, eel: 4, spider: 2, worm: 2, mummy: 1 },
  },
  chapel: {
    easy: { nun: 3, acolyte: 3, skeleton: 2, bat: 2 },
    medium: { nun: 3, acolyte: 3, wraith: 2, spectre: 1, banshee: 1 },
    hard: { nun: 4, acolyte: 3, wraith: 2, banshee: 2, necromancer: 1 },
  },
  forge: {
    easy: { bellows: 4, anvilknight: 1, livingarmour: 2, imp: 2 },
    medium: { bellows: 4, anvilknight: 2, livingarmour: 2, drake: 2 },
    hard: { bellows: 3, anvilknight: 3, moltengolem: 2, drake: 2, hellhound: 1 },
  },
  cells: {
    easy: { rat: 4, ghoul: 3, imp: 1, hound: 2, slime: 2 },
    medium: { rat: 3, ghoul: 3, imp: 2, crossbowman: 2, gaoler: 1, hound: 2, slime: 2, monk: 1, torturer: 1 },
    hard: { rat: 2, ghoul: 2, imp: 3, crossbowman: 3, gaoler: 2, torturer: 2, monk: 2, ratnest: 1, hound: 1 },
  },
  catacombs: {
    easy: { skeleton: 4, archer: 2, spider: 2, rat: 1, skull: 3, bat: 2 },
    medium: { skeleton: 3, archer: 3, spider: 2, worm: 2, doctor: 2, spectre: 1, skull: 2, bat: 2, mummy: 2 },
    hard: { skeleton: 2, archer: 3, golem: 2, worm: 2, doctor: 2, spectre: 2, wraith: 2, banshee: 2, necromancer: 2, mummy: 1 },
  },
  hollow: {
    easy: { direwolf: 2, bloater: 3, wisp: 2, witch: 1, puffcap: 3, toad: 3 },
    medium: { direwolf: 3, bloater: 2, wisp: 2, witch: 2, sapling: 2, cutpurse: 1, toad: 2, pixie: 2, boar: 2 },
    hard: { direwolf: 3, witch: 3, wisp: 2, sapling: 3, cutpurse: 1, bloater: 2, treant: 2, boar: 2, pixie: 2 },
  },
  halls: {
    easy: { livingarmour: 3, drake: 2, magus: 1, imp: 2, jester: 2 },
    medium: { livingarmour: 3, drake: 2, magus: 2, blackknight: 2, flailbrute: 1, gargoyle: 1, jester: 2, bannerman: 1, ballista: 1 },
    hard: { blackknight: 3, flailbrute: 2, magus: 3, drake: 2, executioner: 2, gargoyle: 2, hellhound: 2, moltengolem: 2, bannerman: 1 },
  },
  // the Deep
  rootdeep: {
    easy: { roothound: 3, sapbulb: 3, thornling: 1, wisp: 1 },
    medium: { roothound: 3, sapbulb: 3, treant: 1, direwolf: 1, sapling: 1 },
    hard: { roothound: 4, sapbulb: 3, treant: 2, boar: 1 },
  },
  frozen: {
    easy: { rimewraith: 3, icegolem: 1, skull: 2, bat: 1 },
    medium: { rimewraith: 3, icegolem: 2, banshee: 1, spectre: 1 },
    hard: { rimewraith: 3, icegolem: 3, banshee: 2, livingarmour: 1 },
  },
  sunken: {
    easy: { drownedknight: 2, tidesiren: 2, drowned: 2, eel: 1 },
    medium: { drownedknight: 3, tidesiren: 2, eel: 2, magus: 1 },
    hard: { drownedknight: 3, tidesiren: 3, executioner: 1, eel: 2 },
  },
  amethyst: {
    easy: { crystalspider: 3, shardmagus: 1, bat: 2 },
    medium: { crystalspider: 3, shardmagus: 2, gargoyle: 1, spectre: 1 },
    hard: { crystalspider: 3, shardmagus: 3, gargoyle: 2, necromancer: 1 },
  },
  heart: {
    easy: { heartleech: 3, hollowborn: 1, hellhound: 1 },
    medium: { heartleech: 3, hollowborn: 2, hellhound: 2, banshee: 1 },
    hard: { heartleech: 3, hollowborn: 3, hellhound: 2, moltengolem: 1 },
  },
};

export const ENEMY_FX = {
  rallySpeed: 1.35, // enemies near a Banner Bearer move this much faster...
  rallyArmour: 0.6, // ...and take only this much of the damage
  spawnGrace: 0.55, // seconds after appearing before an enemy may act (fairness)
  knockback: 190, // base push from a stone, divided by mass
  knockbackFriction: 9,
  separation: 40, // how strongly enemies push apart from each other
  deathFadeDelay: 1.6, // corpses linger this long...
  deathFadeTime: 0.4, // ...then blink out
  killHitStop: 0.035,
  bigKillHitStop: 0.07, // for heavy enemies
  maxDynamicLights: 3, // fireballs etc. may borrow this many lights from the pool
  selfLight: 0x8a8a8a, // faint glow on every enemy so they stay readable in dark corners
};
