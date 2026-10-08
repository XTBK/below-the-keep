// Phase 7 special rooms and secret "feature" rooms (shared by every chapter).
// Same 13 x 7 format as cellsLayouts.js. New tiles:
//
//   G  the Old God's idol (Shrine)       Y  the Chapel altar
//   T  a puzzle candle stand (snuff them with stones, in the right order)
//   H  the stone tablet that shows the order
//   L  a bookcase (walk into it to push it one tile)
//   Z  a bookcase with something hidden underneath
//   W  the wishing well (walk into it to throw in a penny)
//   U  a dusty rug (something is under it... a bomb would tell)
//   X  the sword in the stone
//   D  the dice table (Gambler's Den)  N  a beggar
//
// The FEATURE rooms (puzzle, library, well, rug) replace an ordinary room now and then; see
// world/Layouts.js and FEATURES below.

const L = (name, ...grid) => ({ name, grid });

export const SPECIAL_LAYOUTS = {
  // sealed beside the boss room until the boss is beaten (then it becomes a shrine or a chapel)
  altar: L('Sealed Chamber', '.............', '.............', '.............', '.............', '.............', '.............', '.............'),
  shrine: L('Shrine of the Old God', 'B...........B', '.............', '...A..G..A...', '.............', '......A......', '.............', 'B...........B'),
  chapel: L('Chapel', 'c...........c', '.............', '....A...A....', '......Y......', '.............', 'c...........c', '.............'),
  // behind the sealed door on the throne floor
  crown: L('The Crown Chamber', 'B...........B', '.............', '.............', '......K......', '.............', '.............', 'B...........B'),
  // survive three waves for a relic
  trial: L('Trial Chamber', 'B...........B', '.............', '.............', '.............', '.............', '.............', 'B...........B'),
  // dice and a beggar
  den: L("Gambler's Den", 'c...........c', '.............', '.............', '...D.....N...', '.............', '.............', 'c...........c'),
  // the super-secret room, sometimes
  supersecret_sword: L('The Stone and the Blade', '.............', '.....c.c.....', '.............', '......X......', '.............', '.............', '.............'),
  // feature rooms
  feature_puzzle: L('Chamber of Candles', '.............', '..T.......T..', '.............', '......H......', '.............', '..T.......T..', '.............'),
  feature_library: L('Forgotten Library', 'c...........c', '.L..L...L..L.', '.............', '....c...c....', '.............', '.L..L...L..L.', 'c...........c'),
  feature_well: L('Wishing Well', 'c...........c', '.............', '.............', '......W......', '.............', '.............', 'c...........c'),
  feature_encounter: L('A Quiet Room', 'c...........c', '.............', '.............', '......Q......', '.............', '.............', 'c...........c'),
  feature_rug: L('Dusty Parlour', 'c...........c', '..b.......b..', '.............', '.....eUe.....', '.............', '..b.......b..', 'c...........c'),
};

// Which feature rooms a floor may have, and how likely each is (at most one of each per floor).
export const FEATURES = {
  feature_puzzle: { chance: 0.4 },
  feature_library: { chance: 0.35 },
  feature_well: { chance: 0.35 },
  feature_encounter: { chance: 0.6 }, // someone (or something) and a choice (data/encounters.js)
  feature_rug: { chance: 0.4, minFloor: 2, maxFloor: 7 }, // the trapdoor to the Forgotten Vault
};

export const SWORD_CHANCE = 0.45; // chance a super-secret room holds the sword in the stone
