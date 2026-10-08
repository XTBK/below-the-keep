// The playable characters. Wren is there from the start; the others are unlocked by deeds.
//
//   halfHearts   starting (and maximum) health, in half hearts
//   stats        added to the base stats (same as relics)      statsMult  multiplied
//   relics       relics they start with                         trinket    a trinket they start with
//   pickups      { pennies, bombs, keys } to start with
//   looks        accessories drawn on the sprite (render/art/wrenArt.js); 'wizard' is a whole outfit
//   weapon       'wand' (spell bolts), 'crossbow' (heavy piercing bolts), 'sword' (a strong melee
//                swing plus a weak short sword-wave), 'spear' (a long narrow thrust), 'hex' (slow
//                poison thorn-seeds), 'soul' (bolts through stone), or 'sling' (stones, the default)
//   passive      'riposte' | 'bloom' | 'hunger' (see Player)
//   starter      true: can be chosen from the very first run
//   dodge        what the dodge button does: 'roll' (the default), 'blink', 'reload' (roll + reload),
//                'charge' (shield charge), 'lunge', 'bramble' (a roll leaving thorns), 'phase'.
//                See SKILLS in data/config.js
//   steadyAim    standing still makes the next shot a sure critical hit
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
    mods: { homing: 0.3 }, // the bolts lean gently toward foes
    dodge: 'blink',
    starter: true,
  },
  ranger: {
    name: 'Rowan',
    title: 'The Ranger Knight',
    flavour: 'Warden of the royal forest. Slow to reload, slower to miss.',
    halfHearts: 6,
    // heavy bolts: hit hard, fly fast and far, pass through a foe - but the crossbow is slow to wind
    stats: { damage: 2.8, range: 70 },
    statsMult: { fireDelay: 1.75, shotSpeed: 1.45 },
    mods: { pierce: 1 },
    pickups: { pennies: 0, bombs: 1, keys: 2 },
    relics: [],
    looks: ['rangerhood', 'crossbow'],
    recolor: {
      tunic: ['#1a1a10', '#2c2c18', '#424226', '#5a5a36', '#727248'],
      hair: ['#2a1608', '#4a2a10', '#6a4018', '#8a5a26'],
    },
    weapon: 'crossbow',
    dodge: 'reload',
    steadyAim: true,
    starter: true,
  },
  ironknight: {
    name: 'Sir Aldwin',
    title: 'The Iron Knight',
    flavour: 'Too heavy to throw anything well. Too stubborn to fall.',
    halfHearts: 8,
    // the sword does the work: a mighty swing that also turns aside shots; his thrown sword-wave is weak and short
    stats: { range: -110 },
    statsMult: { moveSpeed: 0.92 },
    pickups: { pennies: 0, bombs: 2, keys: 1 },
    relics: [],
    looks: ['greathelm', 'sword'],
    recolor: {
      tunic: ['#121418', '#22262e', '#383e4a', '#535a68', '#707888'],
      hair: ['#2a2a2e', '#3e3e44', '#56565e', '#707078'],
    },
    weapon: 'sword',
    dodge: 'charge',
    starter: true,
  },
  knight: {
    name: 'Maud',
    title: 'The Squire Without a Knight',
    flavour: 'Her lord fell in the Halls. She came down with his spear to finish the job.',
    halfHearts: 8,
    // the spear does the work: a long thrust through a line of foes; her thrown spear-wave is weak
    stats: { range: -90 },
    statsMult: { moveSpeed: 0.97 },
    pickups: { pennies: 0, bombs: 1, keys: 1 },
    relics: [],
    looks: ['helm', 'spear'],
    recolor: {
      tunic: ['#14181f', '#232a36', '#384356', '#55627a', '#7584a0'],
      hair: ['#3a2210', '#6a4220', '#9a6a34', '#c89a54'],
    },
    weapon: 'spear',
    dodge: 'lunge',
    passive: 'riposte', // the first thrust after a lunge is a sure critical
    unlock: 'Draw the blade from the stone.',
  },
  witch: {
    name: 'Agnes',
    title: "The Witch's Apprentice",
    flavour: "The queen's garden still remembers her. Whatever she curses, blooms.",
    halfHearts: 6,
    // slow thorn-seeds that poison; foes that die poisoned burst into thorns
    stats: { range: 30 },
    statsMult: { shotSpeed: 0.82, damage: 0.88 },
    mods: { poison: 1 },
    pickups: { pennies: 0, bombs: 1, keys: 1 },
    relics: [],
    looks: ['witchhat', 'staff'],
    recolor: {
      tunic: ['#1a0e24', '#2e1a40', '#4a2a62', '#6a3e86', '#8a5aa8'],
      hair: ['#0e0e10', '#1a1a1e', '#2a2a30', '#3e3e46'],
    },
    weapon: 'hex',
    dodge: 'bramble',
    passive: 'bloom',
    unlock: 'Defeat the Mad King.',
  },
  ghost: {
    name: 'The Nameless',
    title: 'Who Died in the Cells',
    flavour: 'Not every prisoner left. Not every prisoner stopped trying.',
    halfHearts: 6,
    // soul bolts pass through stone and through a foe; a kill now and then feeds it
    statsMult: { moveSpeed: 1.06, damage: 0.95 },
    mods: { spectral: 1, pierce: 1 },
    pickups: { pennies: 0, bombs: 1, keys: 1 },
    relics: [],
    looks: ['shackles', 'lantern'],
    recolor: {
      skin: ['#3a4250', '#56627a', '#7a88a0', '#9eacc0', '#c4d0e0'],
      tunic: ['#1a1c22', '#2a2e36', '#40444e', '#5a5e68', '#767a84'],
      hair: ['#5a6070', '#7a8090', '#9aa0b0', '#c0c6d4'],
    },
    weapon: 'soul',
    dodge: 'phase',
    passive: 'hunger', // kills sometimes restore half a heart
    unlock: 'Break the Hollow Crown.',
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS);
