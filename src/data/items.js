import { RELICS_4 } from './relics4.js';
import { RELICS_5 } from './relics5.js';
// Relics, pickups, drop tables and shop prices.
//
// A RELIC can have:
//   stats:      added to Wren's stats            e.g. { damage: 1, range: 40 }
//   statsMult:  multiplies Wren's stats          e.g. { fireDelay: 1.25 }  (bigger delay = slower)
//   hearts:     extra heart containers (in half hearts, so 2 = one heart)
//   pickups:    given once when picked up        e.g. { bombs: 5 }
//   mods:       projectile modifiers (they STACK and COMBINE with every other relic's mods):
//                 homing, pierce, bounce, split, burn, poison, spectral, size, orbit, chain, explode
//   look:       { wren: accessory drawn on Wren, stone: how his stones look }
//   type:       'passive' or 'active' (actives sit in the Space slot, need `charges` rooms to recharge)
//   perks:      special rules handled in code (see items/Perks.js), e.g. { multishot: 2, leech: 1 }
//   familiar:   a companion that follows Wren (see items/Familiars.js)
//   set:        plague | saint | beast | alchemy | menagerie - carry three of a set to transform (items/Sets.js)
//   heal:       half hearts restored when picked up
//   pools:      which rooms can offer it, with weights (armoury, boss, merchant, secret, shrine, chapel)
//
// Flavour lines are shown when you stand by an item. They hint, they never give numbers.

export const RELICS = {
  blessed_sling: {
    name: 'Blessed Rune',
    flavour: "A shepherd's prayer, carved into a scrap of rood-wood.",
    type: 'passive',
    stats: { damage: 1 },
    look: { stone: 'gold' },
    pools: { armoury: 3, boss: 2, merchant: 1 },
  },
  rams_horn: {
    name: "Ram's Horn",
    flavour: 'Every wall remembers the last trumpet.',
    type: 'active',
    charges: 3,
    effect: 'horn',
    look: { wren: 'horns' },
    pools: { armoury: 2, merchant: 2 },
  },
  alchemists_eye: {
    name: "Alchemist's Eye",
    flavour: 'It sees the soft parts, and points.',
    type: 'passive',
    mods: { homing: 1 },
    look: { wren: 'monocle', stone: 'violet' },
    set: 'alchemy',
    pools: { armoury: 2, boss: 2 },
  },
  plague_mask: {
    name: 'Plague Mask',
    flavour: 'What the doctor breathed, your shots now carry.',
    type: 'passive',
    mods: { poison: 1 },
    look: { wren: 'mask', stone: 'green' },
    set: 'plague',
    pools: { armoury: 2, secret: 1 },
  },
  holy_water: {
    name: 'Holy Water Flask',
    flavour: 'Blessed at a font no one remembers.',
    type: 'active',
    charges: 4,
    effect: 'holyWater',
    look: { wren: 'flask' },
    set: 'saint',
    pools: { armoury: 2, merchant: 2 },
  },
  crown_of_thorns: {
    name: 'Crown of Thorns',
    flavour: 'Pain goes straight through.',
    type: 'passive',
    stats: { damage: 0.5 },
    mods: { pierce: 1 },
    look: { wren: 'thorns', stone: 'crimson' },
    pools: { armoury: 1, boss: 2, secret: 2 },
  },
  wolf_pelt: {
    name: 'Wolf Pelt',
    flavour: 'Still warm. Still hungry.',
    type: 'passive',
    hearts: 2,
    statsMult: { moveSpeed: 1.18 },
    look: { wren: 'wolf' },
    set: 'beast',
    pools: { armoury: 2, boss: 3 },
  },
  black_powder: {
    name: 'Black Powder Pouch',
    flavour: 'Keep it away from the candles. Or don’t.',
    type: 'passive',
    pickups: { bombs: 5 },
    mods: { explode: 1 },
    look: { wren: 'soot', stone: 'black' },
    set: 'alchemy',
    pools: { armoury: 1, merchant: 2, secret: 2 },
  },
  hazel_fork: {
    name: 'Hazel Fork',
    flavour: 'The diviner’s twig always finds two ways.',
    type: 'passive',
    mods: { split: 1 },
    look: { stone: 'hazel' },
    pools: { armoury: 2, merchant: 1 },
  },
  tinder_box: {
    name: 'Tinder Box',
    flavour: 'Flint, steel, and a grudge.',
    type: 'passive',
    mods: { burn: 1 },
    look: { stone: 'fire' },
    set: 'alchemy',
    pools: { armoury: 2, boss: 1 },
  },
  jesters_ball: {
    name: "Jester's Ball",
    flavour: 'He juggled for the king until the king stopped laughing.',
    type: 'passive',
    mods: { bounce: 2 },
    look: { stone: 'motley' },
    pools: { armoury: 2, merchant: 2 },
  },
  ghost_candle: {
    name: 'Ghost Candle',
    flavour: 'Its light falls on things that are not there.',
    type: 'passive',
    stats: { range: 50 },
    mods: { spectral: 1 },
    look: { stone: 'ghost' },
    pools: { armoury: 2, secret: 2 },
  },
  millstone: {
    name: 'Millstone',
    flavour: 'Grinds slowly. Grinds everything.',
    type: 'passive',
    stats: { damage: 1.5 },
    statsMult: { fireDelay: 1.25, shotSpeed: 0.85 },
    mods: { size: 1 },
    look: { stone: 'big' },
    pools: { armoury: 2, boss: 2 },
  },
  thunder_nail: {
    name: 'Thunder Nail',
    flavour: 'Pulled from a gallows struck by lightning.',
    type: 'passive',
    mods: { chain: 1 },
    look: { stone: 'storm' },
    set: 'alchemy',
    pools: { armoury: 1, boss: 2, secret: 1 },
  },
  rosary: {
    name: 'Rosary of Bone Beads',
    flavour: 'Some prayers circle back.',
    type: 'passive',
    mods: { orbit: 1 },
    look: { stone: 'bead' },
    set: 'saint',
    pools: { armoury: 2, merchant: 1 },
  },

  // ===================== Phase 7: the rest of the passives =====================
  iron_gauntlet: {
    name: 'Iron Gauntlet',
    flavour: 'Too big for your hand. It hits harder anyway.',
    type: 'passive',
    stats: { damage: 0.8 },
    look: { stone: 'iron' },
    pools: { armoury: 3, boss: 2, merchant: 1 },
  },
  falcon_feather: {
    name: 'Falcon Feather',
    flavour: 'It remembers the sky.',
    type: 'passive',
    stats: { range: 45 },
    statsMult: { shotSpeed: 1.25 },
    pools: { armoury: 3, merchant: 1 },
  },
  poachers_glove: {
    name: "Poacher's Glove",
    flavour: 'Quick hands, before the gamekeeper looks.',
    type: 'passive',
    statsMult: { fireDelay: 0.78 },
    pools: { armoury: 3, boss: 1, merchant: 1 },
  },
  pilgrim_boots: {
    name: "Pilgrim's Boots",
    flavour: 'They have walked to every shrine and back.',
    type: 'passive',
    statsMult: { moveSpeed: 1.2 },
    pools: { armoury: 2, merchant: 2, chapel: 2 },
  },
  heart_of_oak: {
    name: 'Heart of Oak',
    flavour: 'Slow to grow. Slower to fall.',
    type: 'passive',
    hearts: 2,
    heal: 99,
    set: 'saint',
    pools: { boss: 3, chapel: 3 },
  },
  bent_horseshoe: {
    name: 'Bent Horseshoe',
    flavour: 'Hung upside down, it pours luck all over you.',
    type: 'passive',
    stats: { luck: 2 },
    pools: { armoury: 2, merchant: 2, secret: 1 },
  },
  triple_sling: {
    name: 'Threefold Rune',
    flavour: 'Why cast one?',
    type: 'passive',
    perks: { multishot: 2 },
    statsMult: { fireDelay: 1.3, damage: 0.8 },
    pools: { armoury: 1, boss: 2, secret: 2 },
  },
  two_faced_mask: {
    name: 'Two-Faced Mask',
    flavour: 'One face for the king, one for the gallows.',
    type: 'passive',
    perks: { rearShot: 1 },
    pools: { armoury: 2, secret: 1, shrine: 1 },
  },
  leech_jar: {
    name: 'Jar of Leeches',
    flavour: 'They feed on what you fell.',
    type: 'passive',
    perks: { leech: 1 },
    set: 'plague',
    pools: { shrine: 3, secret: 1 },
  },
  briar_mail: {
    name: 'Briar Mail',
    flavour: 'Whoever holds you, bleeds.',
    type: 'passive',
    perks: { thornMail: 1 },
    hearts: 2,
    pools: { armoury: 2, boss: 1 },
  },
  cartographers_map: {
    name: "Cartographer's Map",
    flavour: 'Drawn by someone who never found the way out.',
    type: 'passive',
    perks: { mapReveal: 1 },
    pools: { armoury: 2, merchant: 2 },
  },
  dowsing_rod: {
    name: 'Dowsing Rod',
    flavour: 'It twitches toward the hollow places.',
    type: 'passive',
    perks: { compass: 1 },
    pools: { armoury: 2, merchant: 2, secret: 1 },
  },
  gaolers_ring: {
    name: "Gaoler's Ring",
    flavour: 'Every key in the Keep, and a few that fit nothing.',
    type: 'passive',
    pickups: { keys: 2 },
    perks: { keySaver: 1 },
    pools: { armoury: 2, merchant: 2 },
  },
  powder_horn: {
    name: 'Powder Horn',
    flavour: 'More powder, more prayer.',
    type: 'passive',
    pickups: { bombs: 3 },
    perks: { bigBombs: 1 },
    pools: { armoury: 2, merchant: 2 },
  },
  misers_purse: {
    name: "Miser's Purse",
    flavour: 'Every corpse owes you something.',
    type: 'passive',
    pickups: { pennies: 8 },
    perks: { greed: 1 },
    pools: { armoury: 2, merchant: 1, shrine: 1 },
  },
  phoenix_feather: {
    name: 'Phoenix Feather',
    flavour: 'Burn once. Rise once.',
    type: 'passive',
    perks: { secondWind: 1 },
    look: { stone: 'fire' },
    pools: { chapel: 2, secret: 2, boss: 1 },
  },
  bat_wings: {
    name: 'Bat Wings',
    flavour: 'The pits are only holes now.',
    type: 'passive',
    perks: { flight: 1 },
    statsMult: { moveSpeed: 1.08 },
    set: 'beast',
    pools: { secret: 2, shrine: 2, boss: 1 },
  },
  berserker_braid: {
    name: "Berserker's Braid",
    flavour: 'Closest to death, furthest from fear.',
    type: 'passive',
    perks: { berserk: 1 },
    stats: { damage: 0.3 },
    set: 'beast',
    pools: { shrine: 3, boss: 1 },
  },
  hermits_lantern: {
    name: "Hermit's Lantern",
    flavour: 'It burns brighter the deeper you go.',
    type: 'passive',
    perks: { lantern: 1 },
    stats: { range: 30, luck: 0.5 },
    pools: { armoury: 2, chapel: 2 },
  },
  adders_fang: {
    name: "Adder's Fang",
    flavour: 'Still wet.',
    type: 'passive',
    stats: { damage: 0.3 },
    mods: { poison: 1 },
    look: { stone: 'venom' },
    set: 'plague',
    pools: { armoury: 2, secret: 1, shrine: 1 },
  },
  comet_shard: {
    name: 'Comet Shard',
    flavour: 'It fell burning and never cooled.',
    type: 'passive',
    stats: { damage: 0.5 },
    mods: { size: 1, burn: 1 },
    look: { stone: 'comet' },
    set: 'alchemy',
    pools: { boss: 2, secret: 2 },
  },
  mirror_shard: {
    name: 'Mirror Shard',
    flavour: 'It shows you the way around.',
    type: 'passive',
    mods: { bounce: 1, pierce: 1 },
    look: { stone: 'mirror' },
    pools: { armoury: 2, boss: 1 },
  },
  saints_finger: {
    name: "Saint's Finger Bone",
    flavour: 'It points at what is wicked.',
    type: 'passive',
    hearts: 2,
    stats: { damage: 0.4 },
    mods: { homing: 1 },
    look: { stone: 'holy' },
    set: 'saint',
    pools: { chapel: 4 },
  },
  ember_heart: {
    name: 'Ember Heart',
    flavour: 'What dies near you, burns.',
    type: 'passive',
    perks: { corpseBurst: 1 },
    set: 'beast',
    pools: { shrine: 2, boss: 1, secret: 1 },
  },
  soul_jar: {
    name: 'Soul Jar',
    flavour: 'It hums when something dies.',
    type: 'passive',
    perks: { soulJar: 1 },
    set: 'plague',
    pools: { shrine: 2, armoury: 1 },
  },

  witchs_thimble: {
    name: "Witch's Thimble",
    flavour: 'Sewn a thousand curses. Your aim is quicker for it.',
    type: 'passive',
    stats: { damage: 0.3 },
    statsMult: { fireDelay: 0.9 },
    look: { stone: 'violet' },
    pools: { armoury: 2, secret: 1, shrine: 1 },
  },

  // ===================== Phase 7: the rest of the actives =====================
  war_drum: {
    name: 'War Drum',
    flavour: 'Faster. Faster. Faster.',
    type: 'active',
    charges: 3,
    effect: 'warDrum',
    pools: { armoury: 2, merchant: 1 },
  },
  warding_bell: {
    name: 'Warding Bell',
    flavour: 'The dark cannot abide its note.',
    type: 'active',
    charges: 3,
    effect: 'wardingBell',
    set: 'saint',
    pools: { chapel: 3, armoury: 1 },
  },
  thunder_jar: {
    name: 'Thunder Jar',
    flavour: 'A storm, bottled by a very foolish monk.',
    type: 'active',
    charges: 4,
    effect: 'thunderJar',
    pools: { armoury: 2, boss: 1 },
  },
  sand_glass: {
    name: 'Hourglass of Grey Sand',
    flavour: 'Every grain is a moment you stole.',
    type: 'active',
    charges: 4,
    effect: 'hourglass',
    pools: { armoury: 1, secret: 2 },
  },
  gilded_die: {
    name: 'Gilded Die',
    flavour: 'Fortune favours the bold, and the cheat.',
    type: 'active',
    charges: 5,
    effect: 'reroll',
    pools: { merchant: 2, secret: 1 },
  },
  blood_chalice: {
    name: 'Blood Chalice',
    flavour: 'Drink deep. Pay later.',
    type: 'active',
    charges: 1,
    effect: 'bloodChalice',
    pools: { shrine: 3 },
  },
  masons_hammer: {
    name: "Mason's Hammer",
    flavour: 'Every wall has a weak stone.',
    type: 'active',
    charges: 3,
    effect: 'hammer',
    pools: { armoury: 1, merchant: 2 },
  },
  raven_cage: {
    name: 'Raven Cage',
    flavour: 'They are hungry, and you are not on the menu.',
    type: 'active',
    charges: 3,
    effect: 'ravens',
    set: 'beast',
    pools: { armoury: 2, shrine: 1 },
  },

  // ===================== The third chest of relics =====================
  // --- companions (familiars follow Wren and fight beside him; see items/Familiars.js) ---
  barn_owl: {
    name: 'Barn Owl',
    flavour: 'It hunts what you cannot see.',
    type: 'passive',
    familiar: 'owl',
    set: 'menagerie',
    pools: { armoury: 2, boss: 2 },
  },
  spectral_page: {
    name: 'Spectral Page',
    flavour: 'A boy who died serving a knight. He serves you now.',
    type: 'passive',
    familiar: 'page',
    set: 'menagerie',
    pools: { armoury: 2, chapel: 2, secret: 1 },
  },
  moth_guardian: {
    name: 'Moth Guardian',
    flavour: 'Its wings are edged like knives.',
    type: 'passive',
    familiar: 'moth',
    set: 'menagerie',
    pools: { armoury: 2, secret: 1 },
  },
  pet_raven: {
    name: 'Pet Raven',
    flavour: 'It pecks the eyes out. Sometimes it brings you coins.',
    type: 'passive',
    familiar: 'raven',
    set: 'menagerie',
    pools: { armoury: 2, shrine: 1 },
  },
  little_squire: {
    name: 'Little Squire',
    flavour: 'He copies everything you do. Badly, but bravely.',
    type: 'passive',
    familiar: 'squire',
    set: 'menagerie',
    pools: { armoury: 2, boss: 1, merchant: 1 },
  },
  // --- what the stones do ---
  boomerang_sling: {
    name: 'Returning Rune',
    flavour: 'What you cast comes back.',
    type: 'passive',
    mods: { boomerang: 1 },
    stats: { range: 30 },
    look: { stone: 'hazel' },
    pools: { armoury: 2, merchant: 1 },
  },
  frost_shard: {
    name: 'Shard of Winter',
    flavour: 'Chipped from a glacier that buried a kingdom.',
    type: 'passive',
    mods: { frost: 1 },
    look: { stone: 'frost' },
    set: 'alchemy',
    pools: { armoury: 2, boss: 2 },
  },
  lodestone: {
    name: 'Lodestone',
    flavour: 'Your shots remember the shape of the sea.',
    type: 'passive',
    mods: { wave: 1 },
    stats: { damage: 0.4 },
    look: { stone: 'iron' },
    set: 'alchemy',
    pools: { armoury: 2, secret: 1 },
  },
  midas_coin: {
    name: 'The Midas Penny',
    flavour: 'A greedy king\'s last coin. It turns flesh to gold.',
    type: 'passive',
    mods: { gild: 1 },
    look: { stone: 'gold' },
    pools: { secret: 2, merchant: 1, shrine: 1 },
  },
  siege_crossbow: {
    name: 'Siege Crossbow',
    flavour: 'Hold. Hold. Loose.',
    type: 'passive',
    perks: { chargeShot: 1 },
    stats: { damage: 0.5 },
    pools: { boss: 2, armoury: 1 },
  },
  ballista_bolt: {
    name: 'Ballista Bolt',
    flavour: 'It knocks down castle doors. And worse.',
    type: 'passive',
    mods: { knockback: 1 },
    stats: { damage: 0.5 },
    statsMult: { shotSpeed: 1.1 },
    pools: { armoury: 2, boss: 1 },
  },
  wraith_shroud: {
    name: 'Wraith Shroud',
    flavour: 'Whatever you strike sees its own death.',
    type: 'passive',
    mods: { fear: 1 },
    look: { stone: 'ghost' },
    pools: { secret: 2, shrine: 1 },
  },
  // --- keeping you alive, making you rich ---
  saints_shroud: {
    name: "Saint's Shroud",
    flavour: 'The first blow in every room finds only linen.',
    type: 'passive',
    perks: { shield: 1 },
    set: 'saint',
    pools: { chapel: 3, boss: 1 },
  },
  martyrs_chain: {
    name: "Martyr's Chain",
    flavour: 'Every wound makes the next blow heavier.',
    type: 'passive',
    perks: { martyr: 1 },
    pools: { shrine: 2, armoury: 1 },
  },
  bottomless_purse: {
    name: 'Bottomless Purse',
    flavour: 'Things fall in. More fall out.',
    type: 'passive',
    perks: { doubleDrops: 1 },
    pools: { merchant: 2, secret: 1 },
  },
  dead_mans_hand: {
    name: "Dead Man's Hand",
    flavour: 'Aces and eights. It always finds a chest.',
    type: 'passive',
    perks: { chestOnClear: 1 },
    pools: { armoury: 1, secret: 2 },
  },
  wyrm_scale: {
    name: 'Wyrm Scale',
    flavour: 'Harder than any plate a smith could hammer.',
    type: 'passive',
    pickups: { ironHalfHearts: 4 },
    pools: { boss: 2, armoury: 1 },
  },
  merchants_seal: {
    name: "Merchant's Seal",
    flavour: 'Every shopkeeper owes this guild a favour.',
    type: 'passive',
    perks: { haggle: 1 },
    stats: { luck: 0.5 },
    pools: { merchant: 3 },
  },
  // --- actives ---
  powder_bag: {
    name: 'Bag of Powder Kegs',
    flavour: 'Three at once. Run.',
    type: 'active',
    charges: 3,
    effect: 'bombBag',
    set: 'alchemy',
    pools: { armoury: 2, merchant: 1 },
  },
  shepherds_crook: {
    name: "Shepherd's Crook",
    flavour: 'Every stray comes home.',
    type: 'active',
    charges: 2,
    effect: 'crook',
    pools: { armoury: 1, merchant: 2 },
  },
  mirror_of_truth: {
    name: 'Mirror of Truth',
    flavour: 'It shows the floor as it truly is.',
    type: 'active',
    charges: 5,
    effect: 'mirror',
    pools: { secret: 2, chapel: 1 },
  },
  censer: {
    name: 'Censer of Strange Smoke',
    flavour: 'Breathe it in, and forget who you were fighting.',
    type: 'active',
    charges: 3,
    effect: 'censer',
    set: 'plague',
    pools: { armoury: 2, chapel: 1 },
  },
  horn_of_plenty: {
    name: 'Horn of Plenty',
    flavour: 'It never empties. It never asks why.',
    type: 'active',
    charges: 4,
    effect: 'plenty',
    pools: { merchant: 2, secret: 1 },
  },
  executioners_sword: {
    name: "Executioner's Sword",
    flavour: 'One swing. Everyone kneels.',
    type: 'active',
    charges: 2,
    effect: 'spin',
    pools: { boss: 2, armoury: 1 },
  },
  war_banner: {
    name: 'War Banner',
    flavour: 'Plant it. Stand by it. Win.',
    type: 'active',
    charges: 3,
    effect: 'banner',
    pools: { armoury: 2, boss: 1 },
  },

  // ===================== not in any pool: found only one way =====================
  kings_blade: {
    name: "The King's First Blade",
    flavour: 'Drawn from the stone. Meant for a better king.',
    type: 'passive',
    stats: { damage: 1.5 },
    mods: { pierce: 1 },
    statsMult: { shotSpeed: 1.15 },
    look: { stone: 'holy' },
    pools: {},
  },
};

// Order of the relic icon sheet (src/render/art/itemsArt.js draws them in this order).
Object.assign(RELICS, RELICS_4); // the fourth chest: one hundred in all
Object.assign(RELICS, RELICS_5); // the fifth chest: one hundred and twenty-five
export const RELIC_IDS = Object.keys(RELICS);

// How each projectile modifier behaves (per stack of the modifier).
export const MODS = {
  homing: { turnRate: 5.5, seekRange: 170 }, // radians per second
  pierce: { hits: 2 }, // extra enemies it passes through
  bounce: { bounces: 1 }, // (the relic gives 2 stacks)
  split: { children: 2, spread: 0.6, damage: 0.5 }, // on hitting something: 2 smaller stones fan out
  burn: { time: 3, dps: 0.7 }, // damage per second as a fraction of stone damage
  poison: { time: 4, dps: 0.45, slow: 0.6 }, // poisoned enemies also move slower
  spectral: {}, // passes through rocks and barrels (no numbers to tune)
  size: { scale: 1.6, hitRadius: 2.5 },
  orbit: { every: 3, radius: 34, speed: 4.2, time: 3.6 }, // every 3rd stone circles Wren
  chain: { jumps: 2, range: 85, damage: 0.55 },
  explode: { radius: 26, damage: 0.8 },
  boomerang: {}, // at the end of its range the stone flies back to Wren (and can hit again)
  frost: { time: 2.5, slow: 0.45, shards: 6 }, // chilled enemies are slowed; killed while chilled, they shatter into ice
  wave: { amplitude: 14, frequency: 14 }, // stones weave from side to side
  gild: { chance: 0.18, time: 1.6 }, // chance per hit to turn an enemy to gold for a moment (it drops a penny if killed so)
  knockback: { force: 2.2 }, // extra knockback per stack
  fear: { chance: 0.25, time: 2.2 }, // chance per hit that the enemy flees in terror
};

// Pickups lying on the floor.
export const PICKUPS = {
  penny: { frame: 0, give: { pennies: 1 }, sound: 'coin' },
  purse: { frame: 1, give: { pennies: 5 }, sound: 'coins' },
  heart: { frame: 2, give: { halfHearts: 2 }, sound: 'heart', needsMissingHealth: true },
  halfHeart: { frame: 3, give: { halfHearts: 1 }, sound: 'heart', needsMissingHealth: true },
  bomb: { frame: 4, give: { bombs: 1 }, sound: 'bombPickup' },
  key: { frame: 5, give: { keys: 1 }, sound: 'key' },
  ironHeart: { frame: 6, give: { ironHalfHearts: 2 }, sound: 'clang' }, // armour: soaks hits, can't be healed back
};

// Chests: wooden (open freely), iron (needs a key, better loot), cursed (a gamble).
export const CHESTS = {
  chest: { frame: 0, loot: [2, 3], curio: 0.1, relic: 0 },
  ironchest: { frame: 2, loot: [3, 4], curio: 0.35, relic: 0.14, needsKey: true },
  cursedchest: { frame: 4, loot: [2, 3], curio: 0.3, relic: 0.25, curse: 0.5 },
};
export const CHEST_LOOT = { penny: 6, purse: 2, heart: 2, halfHeart: 2, bomb: 3, key: 3, ironHeart: 2 };

// What a cleared room drops (weights; 'none' = nothing). Luck shifts weight away from 'none'.
export const ROOM_DROPS = { none: 40, penny: 22, purse: 4, heart: 8, halfHeart: 8, bomb: 9, key: 9, curio: 3, ironHeart: 2, chest: 2.5, ironchest: 1.2, cursedchest: 0.6 };
export const BARREL_DROPS = { none: 72, penny: 14, bomb: 6, halfHeart: 5, key: 3, ironHeart: 0.6 };
export const CHAMPION_DROPS = { penny: 3, purse: 3, heart: 3, bomb: 2, key: 2 }; // always drops 2 of these
export const BOSS_DROPS = { heart: 1 }; // plus a relic pedestal

// Merchant prices (in pennies).
export const PRICES = { relic: 15, heart: 3, bomb: 5, key: 5, scroll: 6, potion: 4, trinket: 9 };
// Shop slot 0 holds a relic; slots 1-2 hold pickups (or curios: scroll / potion / trinket) from this list.
export const SHOP_GOODS = { heart: 3, bomb: 2, key: 2, scroll: 1.2, potion: 1.2, trinket: 0.8 };
// A journal page now and then when a room is cleared (only while there are pages left to find).
export const PAGE_DROP_CHANCE = 1 / 40;
// After a boss: the sealed altar room opens this often (more if Wren took no damage on the floor).
export const ALTAR = { baseChance: 0.35, noDamageBonus: 0.35 };

export const BOMB = {
  fuse: 1.5,
  radius: 58,
  damage: 12, // to enemies
  playerDamage: 2, // half hearts
  knockback: 320,
  secretReach: 26, // extra reach for blasting open cracked walls
};

export const ACTIVE = {
  horn: { stun: 2.2, bossStun: 0.6, knockback: 340, radius: 999 },
  holyWater: { radius: 84, damage: 14, heal: 1 },
  warDrum: { time: 6, fireDelay: 0.5 }, // fire twice as fast
  wardingBell: { time: 2 },
  thunderJar: { damage: 9 },
  hourglass: { time: 5, scale: 0.35 }, // enemies move at 35% speed
  bloodChalice: { time: 12, damage: 1.6 },
  bombBag: { count: 3, spread: 0.6, distance: 46 },
  censer: { time: 5, radius: 999 },
  plenty: { count: 3 },
  spin: { radius: 74, damage: 4, knockback: 300 }, // damage is x Wren's stone damage
  banner: { time: 8, radius: 90, damage: 1.5, fireDelay: 0.75 },
};
