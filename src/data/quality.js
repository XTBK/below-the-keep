// How good each relic is, 1-4. Used for:
//   - bad-luck protection: after two weak relics in a row, the next pedestal offers a good one
//   - harder bosses lean toward better relics (see BOSS_TIERS)
//   - the Blacksmith's Anvil reforges a relic into a better one
// 1 = situational / weak, 2 = solid, 3 = strong, 4 = run-defining. Anything not listed is 2.

export const QUALITY = {
  // 4: run-defining
  kings_blade: 4,
  phoenix_feather: 4,
  triple_sling: 4,
  thunder_nail: 4,
  saints_finger: 4,
  // 3: strong
  blessed_sling: 3,
  alchemists_eye: 3,
  crown_of_thorns: 3,
  hazel_fork: 3,
  millstone: 3,
  poachers_glove: 3,
  heart_of_oak: 3,
  bat_wings: 3,
  comet_shard: 3,
  mirror_shard: 3,
  black_powder: 3,
  siege_crossbow: 3,
  saints_shroud: 3,
  sand_glass: 3,
  blood_chalice: 3,
  executioners_sword: 3,
  // 1: situational
  rams_horn: 1,
  pilgrim_boots: 1,
  bent_horseshoe: 1,
  cartographers_map: 1,
  dowsing_rod: 1,
  gaolers_ring: 1,
  powder_horn: 1,
  misers_purse: 1,
  hermits_lantern: 1,
  masons_hammer: 1,
  boomerang_sling: 1,
  midas_coin: 1,
  merchants_seal: 1,
  powder_bag: 1,
  shepherds_crook: 1,
  mirror_of_truth: 1,
};

export function quality(id) {
  return QUALITY[id] ?? 2;
}

export const QUALITY_NAMES = ['', 'COMMON', 'FINE', 'RARE', 'LEGENDARY'];

// Bad-luck protection: this many weak (quality 1) relics in a row, and the next pedestal is rare or better.
export const BAD_LUCK_LIMIT = 2;

// Some treasure rooms offer two relics side by side: take one and the other crumbles to dust.
export const CHOICE_CHANCE = { armoury: 0.35 };

// The Blacksmith's Anvil (in every merchant's room): stand on it to melt your newest relic and
// reforge it into a different one a step better (common -> fine -> rare -> legendary). Once per anvil.
export const ANVIL = { holdTime: 1.4, bias: 1 };
