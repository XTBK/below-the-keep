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

export function championChance(base, n) {
  return base + D.championPerFloor * Math.max(0, n - 1);
}
