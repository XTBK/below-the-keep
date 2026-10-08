// The roads down. After each floor's boss, the trapdoor drops you at a fork in the dark, and you
// choose which way to go on. The Old Stair is always there; two other roads are drawn at random.
// A road changes the next floor only.
//
// Fields (all optional):
//   hard        extra weight on hard rooms (0..1)        easy      every room is drawn like a near room
//   champions   added to the champion chance             bossBonus the boss also leaves an extra relic
//   heal        half hearts healed when you arrive       pennies   pennies found when you arrive
//   discount    the floor's merchant sells for less      omen      an omen always hangs over the floor
//   relic       a relic waits where you land             realm     straight down into a secret realm

export const ROUTES = {
  stair: {
    name: 'The Old Stair',
    text: 'The way the prisoners were taken. No better and no worse.',
    color: '#c8b890',
  },
  blood: {
    name: 'The Bloodied Road',
    text: 'Harder rooms and more champions. Its boss guards an extra relic.',
    color: '#d04a3a',
    hard: 0.3,
    champions: 0.12,
    bossBonus: true,
  },
  pilgrim: {
    name: "The Pilgrim's Way",
    text: 'Gentler rooms. A hermit binds your wounds when you arrive.',
    color: '#e8d890',
    easy: true,
    heal: 4,
  },
  market: {
    name: 'The Market Road',
    text: 'Traders came this way: a purse of pennies, and the merchant sells for less.',
    color: '#e8c46c',
    pennies: 12,
    discount: 0.25,
  },
  whisper: {
    name: 'The Whispering Road',
    text: 'An omen always hangs over it, but a relic waits where you land.',
    color: '#a080e0',
    omen: true,
    relic: true,
  },
  hidden: {
    name: 'The Hidden Way',
    text: 'Straight down into a secret realm. You will miss the floor above it.',
    color: '#60c0d0',
    realm: true,
  },
};

const OTHERS = ['blood', 'pilgrim', 'market', 'whisper'];

/** The three roads offered at a fork: the Old Stair, and two more (the Hidden Way now and then). */
export function rollRoutes(rng, realmOpen) {
  const pool = OTHERS.slice();
  const out = ['stair'];
  if (realmOpen && rng.chance(0.3)) out.push('hidden');
  while (out.length < 3) out.push(pool.splice(Math.floor(rng.next() * pool.length), 1)[0]);
  return out;
}
