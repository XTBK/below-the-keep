// The playable characters. Wren is there from the start; the others are unlocked by deeds.
//
//   halfHearts   starting (and maximum) health, in half hearts
//   stats        added to the base stats (same as relics)      statsMult  multiplied
//   relics       relics they start with                         trinket    a trinket they start with
//   pickups      { pennies, bombs, keys } to start with
//   looks        accessories drawn on the sprite (render/art/wrenArt.js); 'wizard' is a whole outfit
//   weapon       'wand' (spell bolts) or 'sling' (stones, the default)
//   recolor      swaps colours of Wren's sprite: { tunic, hair, skin } -> new colour ramps
//   unlock       how to unlock them (shown on the title screen while locked)

export const CHARACTERS = {
  wren: {
    name: 'Wren',
    title: 'The Wandering Wizard',
    flavour: 'An old grey wizard, thrown below for a spell the king did not like.',
    halfHearts: 6,
    pickups: { pennies: 0, bombs: 1, keys: 1 },
    relics: [],
    looks: ['wizard'],
    weapon: 'wand', // casts spell bolts instead of slinging stones
  },
  knight: {
    name: 'Maud',
    title: 'The Squire Without a Knight',
    flavour: 'Her lord fell in the Halls. She came down to finish the job.',
    halfHearts: 8,
    stats: { damage: 0.6 },
    statsMult: { moveSpeed: 0.92, fireDelay: 1.1 },
    pickups: { pennies: 0, bombs: 1, keys: 1 },
    relics: ['iron_gauntlet'],
    looks: ['helm'],
    recolor: {
      tunic: ['#14181f', '#232a36', '#384356', '#55627a', '#7584a0'],
      hair: ['#3a2210', '#6a4220', '#9a6a34', '#c89a54'],
    },
    unlock: 'Draw the blade from the stone.',
  },
  witch: {
    name: 'Agnes',
    title: "The Witch's Apprentice",
    flavour: 'The queen\'s garden still remembers her.',
    halfHearts: 4,
    stats: { range: 40, luck: 1 },
    statsMult: { fireDelay: 0.85, damage: 0.9 },
    pickups: { pennies: 5, bombs: 0, keys: 1 },
    relics: ['alchemists_eye'],
    consumable: { type: 'potion', id: 'healing' },
    looks: ['witchhat'],
    recolor: {
      tunic: ['#1a0e24', '#2e1a40', '#4a2a62', '#6a3e86', '#8a5aa8'],
      hair: ['#0e0e10', '#1a1a1e', '#2a2a30', '#3e3e46'],
    },
    unlock: 'Defeat the Mad King.',
  },
  ghost: {
    name: 'The Nameless',
    title: 'Who Died in the Cells',
    flavour: 'Not every prisoner left. Not every prisoner stopped trying.',
    halfHearts: 4,
    statsMult: { moveSpeed: 1.12 },
    pickups: { pennies: 0, bombs: 2, keys: 0 },
    relics: ['ghost_candle'],
    trinket: 'crow_feather',
    looks: ['shackles'],
    recolor: {
      skin: ['#3a4250', '#56627a', '#7a88a0', '#9eacc0', '#c4d0e0'],
      tunic: ['#1a1c22', '#2a2e36', '#40444e', '#5a5e68', '#767a84'],
      hair: ['#5a6070', '#7a8090', '#9aa0b0', '#c0c6d4'],
    },
    unlock: 'Break the Hollow Crown.',
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);
