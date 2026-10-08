// Oaths: after your first victory you may swear oaths before a run. Each makes the descent harder and
// adds HEAT; the hotter the run, the better the relics (every point of heat leans pedestals toward
// better ones) and the prouder the record (the best heat beaten is kept per hero, and shown).
// Effects are applied where noted in brackets.

export const OATHS = {
  stone: {
    name: 'Oath of Stone',
    text: 'Every foe has 35% more health.',
    heat: 1,
    // [Game.scaleFor]
    enemyHp: 1.35,
  },
  haste: {
    name: 'Oath of Haste',
    text: 'Every foe attacks 20% more often.',
    heat: 2,
    // [Game.scaleFor]
    enemyTempo: 1.2,
  },
  horde: {
    name: 'Oath of the Horde',
    text: 'Champions are far more common.',
    heat: 1,
    // [Room spawns]
    championBonus: 0.22,
  },
  ruin: {
    name: 'Oath of Ruin',
    text: 'Every boss is one rank deadlier.',
    heat: 2,
    // [Game.bossTierOf]
    bossRank: 1,
  },
  iron: {
    name: 'Oath of Iron',
    text: 'Red hearts on the floor heal half as much.',
    heat: 1,
    // [Pickups]
    healing: 0.5,
  },
  purse: {
    name: 'Oath of the Lean Purse',
    text: 'Prices are half again as high.',
    heat: 1,
    // [Player.priceOf]
    prices: 1.5,
  },
  moon: {
    name: 'Oath of the Pale Moon',
    text: 'An omen falls on every floor.',
    heat: 1,
    // [Game._rollOmen]
    alwaysOmen: true,
  },
  blind: {
    name: 'Oath of the Unseen',
    text: 'No map. Find your own way.',
    heat: 1,
    // [Hud]
    noMap: true,
  },
  glass: {
    name: 'Oath of Glass',
    text: 'Begin with only two hearts.',
    heat: 3,
    // [Player]
    startHalfHearts: 4,
  },
};

export const OATH_IDS = Object.keys(OATHS);
export const MAX_HEAT = OATH_IDS.reduce((a, k) => a + OATHS[k].heat, 0);

// how much each point of heat leans relic pedestals toward better relics (see Game.pickRelic)
export const HEAT_RELIC_BIAS = 0.08;

export function heatOf(ids) {
  let h = 0;
  for (const id of ids) h += OATHS[id] ? OATHS[id].heat : 0;
  return h;
}
