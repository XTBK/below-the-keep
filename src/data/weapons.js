// Weapons: found on pedestals (secret realms always have one; treasure rooms and deadly bosses
// sometimes do). Each hero class has its own family, and every weapon is a TRADE, not an upgrade:
// more damage costs speed, an element costs raw damage, reach costs a tighter swing.
//
// A weapon is applied like a relic (stats, statsMult, mods, perks are added to the loadout), plus:
//   class     'wand' | 'crossbow' | 'sword' | 'spear' | 'hex' | 'soul' - who can wield it (the hero's character.weapon)
//   tint      the colour of its shots (see STONE_TINTS in items/Relics.js)
//   look      how it shows on the hero: { add: 'wand_fire' } or { replace: ['sword', 'greataxe'] }
//   melee     for swords: overrides WEAPONS.sword in config (reach, arc, damage, cooldown, knockback,
//             lunge, waveDamage, waveRange) plus stun (seconds) and shockwave ({ radius, damage })
//   sound     the sound it makes (core/Sounds.js)
//   quality   1-4 like relics (how often it turns up, and how good the place that offers it is)
// The first weapon of each class is what that hero starts with.

export const WEAPON_DEFS = {
  // ================================================================ Wren's wands
  oak_wand: {
    class: 'wand', name: 'Oaken Wand', quality: 1, starter: true,
    flavour: 'Old, plain and true. It has never once misfired.',
  },
  ember_wand: {
    class: 'wand', name: 'Ember Wand', quality: 2,
    flavour: 'Its bolts catch fire in the air and keep burning in the wound.',
    stats: { damage: -0.4 },
    mods: { burn: 1 },
    tint: 'fire', look: { add: 'wand_fire' }, sound: 'castFire',
  },
  tide_wand: {
    class: 'wand', name: 'Tide Wand', quality: 2,
    flavour: 'Heavy globes of black water that bowl foes over.',
    stats: { damage: 0.7, range: -20 },
    statsMult: { fireDelay: 1.25, shotSpeed: 0.85 },
    mods: { size: 1, knockback: 2 },
    tint: 'tide', look: { add: 'wand_tide' }, sound: 'castWater',
  },
  frost_wand: {
    class: 'wand', name: 'Rime Wand', quality: 3,
    flavour: 'Cold enough to stop a heart. It does, sometimes.',
    statsMult: { fireDelay: 1.08 },
    mods: { frost: 1, pierce: 1 },
    tint: 'ghost', look: { add: 'wand_frost' }, sound: 'castFrost',
  },
  storm_wand: {
    class: 'wand', name: 'Storm Wand', quality: 3,
    flavour: 'Lightning that jumps from foe to foe, weaker with every leap.',
    stats: { damage: -0.4 },
    statsMult: { shotSpeed: 1.25 },
    mods: { chain: 1 },
    tint: 'storm', look: { add: 'wand_storm' }, sound: 'castStorm',
  },
  venom_wand: {
    class: 'wand', name: 'Adder Wand', quality: 2,
    flavour: 'Its bolts wriggle on the way, and their bite festers.',
    stats: { damage: -0.5 },
    statsMult: { fireDelay: 0.9 },
    mods: { poison: 1, wave: 1 },
    tint: 'venom', look: { add: 'wand_venom' }, sound: 'castFire',
  },

  // ================================================================ Rowan's bows and crossbows
  ranger_crossbow: {
    class: 'crossbow', name: "Warden's Crossbow", quality: 1, starter: true,
    flavour: 'The royal forest\'s own. Heavy, slow, honest.',
  },
  longbow: {
    class: 'crossbow', name: 'Yew Longbow', quality: 2,
    flavour: 'A bow as tall as a man. Lighter arrows, loosed far quicker.',
    stats: { damage: -1.1, range: 50 },
    statsMult: { fireDelay: 0.65, shotSpeed: 1.05 },
    look: { replace: ['crossbow', 'longbow'] }, sound: 'bow',
  },
  arbalest: {
    class: 'crossbow', name: 'Siege Arbalest', quality: 3,
    flavour: 'Cranked with a winch. Each bolt goes through a door, and the man behind it.',
    stats: { damage: 3.2 },
    statsMult: { fireDelay: 1.6, shotSpeed: 1.2 },
    mods: { pierce: 1, knockback: 1 },
    tint: 'iron', look: { replace: ['crossbow', 'arbalest'] }, sound: 'xbow',
  },
  repeater: {
    class: 'crossbow', name: 'Repeating Crossbow', quality: 3,
    flavour: 'A box of bolts on top, a lever to work it. Three at a time.',
    stats: { damage: -2.0 },
    perks: { multishot: 2 },
    look: { replace: ['crossbow', 'repeater'] }, sound: 'xbow',
  },
  hunting_bow: {
    class: 'crossbow', name: "Huntsman's Bow", quality: 2,
    flavour: 'Made for one clean shot through the eye. It finds weak spots.',
    stats: { damage: -0.5 },
    statsMult: { fireDelay: 0.8 },
    perks: { critBonus: 0.15 },
    look: { replace: ['crossbow', 'huntbow'] }, sound: 'bow',
  },
  dragon_crossbow: {
    class: 'crossbow', name: 'Dragonbreath Crossbow', quality: 3,
    flavour: 'Its bolts are tipped with pitch and lit as they leave.',
    stats: { damage: -1.4 },
    mods: { burn: 1, explode: 1 },
    statsMult: { fireDelay: 1.2 },
    tint: 'fire', look: { replace: ['crossbow', 'firebow'] }, sound: 'xbow',
  },

  // ================================================================ Sir Aldwin's swords, axes and hammers
  knight_sword: {
    class: 'sword', name: 'Arming Sword', quality: 1, starter: true,
    flavour: 'A knight\'s plain sword. It has done this before.',
  },
  greataxe: {
    class: 'sword', name: 'Bearded Greataxe', quality: 3,
    flavour: 'Slow to lift. Nothing gets up afterwards.',
    melee: { damage: 3.8, cooldown: 2.15, arc: 1.45, reach: 44, knockback: 440, lunge: 50 },
    look: { replace: ['sword', 'greataxe'] }, sound: 'axe',
  },
  longsword: {
    class: 'sword', name: 'Longsword', quality: 2,
    flavour: 'Reach is its own kind of armour.',
    melee: { damage: 2.55, cooldown: 1.6, arc: 1.0, reach: 56, knockback: 260 },
    look: { replace: ['sword', 'longsword'] },
  },
  twin_daggers: {
    class: 'sword', name: 'Twin Daggers', quality: 2,
    flavour: 'Get close. Stay close. Never stop.',
    melee: { damage: 1.4, cooldown: 0.8, arc: 1.1, reach: 32, knockback: 120, lunge: 95, waveDamage: 0.2 },
    statsMult: { moveSpeed: 1.08 },
    look: { replace: ['sword', 'daggers'] }, sound: 'sword',
  },
  warhammer: {
    class: 'sword', name: 'War Hammer', quality: 3,
    flavour: 'It does not cut. It rings, and everything near it falls.',
    melee: { damage: 2.6, cooldown: 2.2, arc: 1.2, reach: 40, knockback: 320, stun: 0.7, shockwave: { radius: 60, damage: 0.8 } },
    look: { replace: ['sword', 'warhammer'] }, sound: 'hammer',
  },
  flail: {
    class: 'sword', name: 'Morning Star Flail', quality: 2,
    flavour: 'Swung round and round. Whatever is near him, wherever it is.',
    melee: { damage: 2.5, cooldown: 1.9, arc: Math.PI, reach: 46, knockback: 280, lunge: 0 },
    look: { replace: ['sword', 'flail'] }, sound: 'axe',
  },
  emberblade: {
    class: 'sword', name: 'Emberbrand', quality: 3,
    flavour: 'Quenched in a dragon\'s blood. It never quite stopped burning.',
    melee: { damage: 2.2, cooldown: 1.55 },
    mods: { burn: 1 },
    tint: 'fire', look: { replace: ['sword', 'emberblade'] }, sound: 'sword',
  },

  // ================================================================ Maud's spears
  squire_spear: {
    class: 'spear', name: "Her Lord's Spear", quality: 1, starter: true,
    flavour: 'Long, plain ash and a good steel point. He taught her well.',
    sound: 'thrust',
  },
  boar_spear: {
    class: 'spear', name: 'Boar Spear', quality: 2,
    flavour: 'Heavy, with a crossbar to stop whatever runs onto it.',
    melee: { damage: 2.45, cooldown: 1.55, knockback: 380, reach: 62, arc: 0.34, stun: 0.3 },
    look: { replace: ['spear', 'boarspear'] }, sound: 'axe',
  },
  halberd: {
    class: 'spear', name: 'Halberd', quality: 3,
    flavour: 'A spear with an axe on it. The point reaches; the blade sweeps.',
    melee: { damage: 2.2, cooldown: 1.42, reach: 72, arc: 0.72, knockback: 260 },
    look: { replace: ['spear', 'halberd'] }, sound: 'axe',
  },

  // ================================================================ Agnes's staves
  apprentice_staff: {
    class: 'hex', name: 'Apprentice Staff', quality: 1, starter: true,
    flavour: 'Cut from the queen\'s garden. It still grows a little, when no one looks.',
    tint: 'green', sound: 'hexCast',
  },
  nightshade_staff: {
    class: 'hex', name: 'Nightshade Staff', quality: 3,
    flavour: 'The seeds it casts are black, and so is what grows from them.',
    stats: { damage: -0.3 },
    statsMult: { fireDelay: 1.12 },
    mods: { poison: 1 },
    tint: 'violet', look: { replace: ['staff', 'nightshade'] }, sound: 'hexCast',
  },
  briar_staff: {
    class: 'hex', name: 'Briar Staff', quality: 2,
    flavour: 'Every seed splits in two before it lands.',
    stats: { damage: -1.1 },
    perks: { multishot: 1 },
    tint: 'green', look: { replace: ['staff', 'briarstaff'] }, sound: 'hexCast',
  },

  // ================================================================ the Nameless's lanterns
  grave_lantern: {
    class: 'soul', name: 'Grave Lantern', quality: 1, starter: true,
    flavour: 'It lit the cells for the gaolers. Now it lights the way for the dead.',
    tint: 'ghost', sound: 'soulCast',
  },
  cell_chain: {
    class: 'soul', name: 'Chain of the Cells', quality: 2,
    flavour: 'Its bolts leap from one foe to the next, like a chain gang.',
    stats: { damage: -0.4 },
    mods: { chain: 1 },
    tint: 'storm', look: { replace: ['lantern', 'chainlantern'] }, sound: 'soulCast',
  },
  death_bell: {
    class: 'soul', name: 'Bell of the Dead', quality: 3,
    flavour: 'Rung once for every prisoner who never came up. It is still ringing.',
    stats: { damage: 1.6 },
    statsMult: { fireDelay: 1.6, shotSpeed: 0.8 },
    mods: { size: 1, frost: 1 },
    tint: 'ghost', look: { replace: ['lantern', 'deathbell'] }, sound: 'castFrost',
  },
};

export const WEAPON_IDS = Object.keys(WEAPON_DEFS);

/** The weapon a hero starts with, for their class. */
export function starterWeapon(cls) {
  return WEAPON_IDS.find((id) => WEAPON_DEFS[id].class === cls && WEAPON_DEFS[id].starter) || null;
}

// how often a weapon turns up instead of a relic
export const WEAPON_CHANCE = {
  armoury: 0.14, // a treasure room's pedestal
  bossChoice: 0.4, // one of a Deadly or Legendary boss's two pedestals
};
