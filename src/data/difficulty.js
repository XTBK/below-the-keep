// How the dungeon gets harder the deeper you go. Floor 1 is the baseline; every number here is
// added PER FLOOR below the first (floor 9, the throne, gets 8 lots).
//
// Enemies: more health, a little faster, quicker to attack (their wind-ups, cooldowns and timers
// all run faster), and champions become more common. From the Burning Halls on, a hit costs a
// whole heart instead of half.
//
// Bosses are drawn at random from the whole roster, so each one is scaled from its HOME floor
// (the floor it was designed for) to the floor it actually appears on: an early boss met late is
// tougher and faster, a late boss met early is weaker and slower. Wherever it lands, it's a fair fight.

export const DIFFICULTY = {
  enemyHpPerFloor: 0.12, // floor 9: x1.96 health
  enemySpeedPerFloor: 0.025, // floor 9: x1.2 speed
  enemyTempoPerFloor: 0.03, // floor 9: attacks come x1.24 as often
  championPerFloor: 0.012, // floor 9: about 15% of enemies are champions
  fullHeartFrom: 7, // from this floor on, every hit costs a whole heart

  bossHpPerFloor: 0.32,
  bossTempoPerFloor: 0.035,
  bossShotPerFloor: 0.03, // how fast boss shots fly
};

// The first few floors only draw from the gentler bosses, so a run eases in. For each early floor:
// the highest HOME floor a boss may have to be drawn there. From floor 5 on, any boss at all.
export const EARLY_BOSS_LIMIT = { 1: 2, 2: 2, 3: 4, 4: 4 };

const D = DIFFICULTY;

/** Multipliers for an ordinary enemy on floor n. */
export function enemyScale(n) {
  const k = Math.max(0, n - 1);
  return { hp: 1 + D.enemyHpPerFloor * k, speed: 1 + D.enemySpeedPerFloor * k, tempo: 1 + D.enemyTempoPerFloor * k, shot: 1 };
}

/** Multipliers for a boss tuned for floor `home`, met on floor n. */
export function bossScale(n, home) {
  const f = (per, x) => 1 + per * Math.max(0, x - 1);
  return {
    hp: f(D.bossHpPerFloor, n) / f(D.bossHpPerFloor, home),
    speed: 1,
    tempo: f(D.bossTempoPerFloor, n) / f(D.bossTempoPerFloor, home),
    shot: f(D.bossShotPerFloor, n) / f(D.bossShotPerFloor, home),
  };
}

// Boss ranks. On top of depth scaling, a boss's rank makes it tougher and quicker - and its reward
// better. Higher ranks only turn up deeper (minFloor). Unlisted bosses are rank 1.
export const BOSS_TIERS = {
  // 1 Normal
  ratmother: 1, mastiff: 1, friar: 1, warden: 1, ratking: 1, gravedigger: 1, briarhound: 1, greattoad: 1,
  // 2 Hard
  headsman: 2, maiden: 2, choir: 2, physician: 2, colossus: 2, thornwitch: 2, matron: 2, stag: 2, entombed: 2,
  // 3 Deadly
  gravemother: 3, lich: 3, ancientoak: 3, mothqueen: 3, pyrebishop: 3, courtjester: 3, moltenknight: 3, gargoylelord: 3,
  // 4 Legendary
  champion: 4, ashwing: 4, burnedqueen: 4,
  // the third roster
  // the secret bosses: all Deadly
  leviathan: 3, mirrorqueen: 3, firstking: 3, organist: 3, facelesssaint: 3,
  turnkey: 1, bellringer: 1, widow: 2, hangedman: 2, fenhag: 2, wickerman: 3, inquisitor: 3, dreadknight: 4, abyssaleye: 4,
};

export const TIER_INFO = [
  null,
  { name: 'NORMAL', color: '#b8b0a0', hp: 1, tempo: 1, minFloor: 1, reward: { bias: 0 } },
  { name: 'HARD', color: '#e0a040', hp: 1.15, tempo: 1.05, minFloor: 2, reward: { bias: 0.5 } },
  { name: 'DEADLY', color: '#e04030', hp: 1.35, tempo: 1.1, minFloor: 4, reward: { bias: 0.9, minQuality: 2, choice: true } },
  { name: 'LEGENDARY', color: '#c070ff', hp: 1.6, tempo: 1.16, minFloor: 6, reward: { bias: 1.2, minQuality: 3, choice: true, chest: true } },
];

export function bossTier(type) {
  return BOSS_TIERS[type] || 1;
}

export function championChance(base, n) {
  return base + D.championPerFloor * Math.max(0, n - 1);
}
