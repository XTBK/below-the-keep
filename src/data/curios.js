// Trinkets, scrolls, potions, Seal Fragments and journal pages ("curios").
//
//   TRINKETS  one slot. Picking up another drops the one you carry. Same fields as relics
//             (stats, statsMult, mods, perks).
//   SCROLLS   single use, in the Q slot. Their effect is written on them.
//   POTIONS   single use, in the Q slot. You don't know what one does until you drink it; which
//             colour is which changes every run (seeded). Some are bad for you!
//
// All sprites live on the 'curios' sheet: 0-9 trinkets, 10-19 scrolls, 20-29 potion colours,
// 30-32 the three Seal Fragments, 33 a journal page, 34 an unknown relic.

export const TRINKETS = {
  rabbits_foot: { name: "Rabbit's Foot", flavour: 'Not so lucky for the rabbit.', stats: { luck: 1 } },
  cracked_monocle: { name: 'Cracked Monocle', flavour: 'Sharper than it looks.', stats: { range: 40 }, statsMult: { shotSpeed: 1.1 } },
  rusted_key: { name: 'Rusted Key', flavour: 'It turns, sometimes, and stays in your pocket.', perks: { keySaver: 1 } },
  copper_ring: { name: 'Copper Ring', flavour: 'Green on the finger, coin in the purse.', perks: { greed: 1 } },
  bloody_rag: { name: 'Bloody Rag', flavour: 'Every wound makes you angrier.', perks: { rage: 1 } },
  crow_feather: { name: 'Crow Feather', flavour: 'Light as a whisper over the pit.', perks: { flight: 1 } },
  bent_nail: { name: 'Bent Nail', flavour: 'Pulled from a coffin lid.', stats: { damage: 0.5 } },
  hourglass_pin: { name: 'Hourglass Pin', flavour: 'Time runs a little faster for your relics.', perks: { battery: 1 } },
  powder_charm: { name: 'Powder Charm', flavour: 'The blast knows your name and spares it.', perks: { bombImmune: 1 } },
  moth_wing: { name: 'Moth Wing', flavour: 'Drawn to the flame, quick to flee it.', statsMult: { moveSpeed: 1.1, fireDelay: 0.92 } },
};

export const SCROLLS = {
  mending: { name: 'Scroll of Mending', flavour: 'Heals every wound.' },
  revealing: { name: 'Scroll of Revealing', flavour: 'Shows this floor, and its secrets.' },
  fire: { name: 'Scroll of Fire', flavour: 'Sets every foe in the room ablaze.' },
  lightning: { name: 'Scroll of Lightning', flavour: 'Strikes every foe in the room.' },
  warding: { name: 'Scroll of Warding', flavour: 'Nothing can touch you, for a while.' },
  passage: { name: 'Scroll of Passage', flavour: 'Returns you to where the floor began.' },
  plenty: { name: 'Scroll of Plenty', flavour: 'Gifts fall from nowhere.' },
  haste: { name: 'Scroll of Haste', flavour: 'Quick feet, quick hands, for a while.' },
  unlocking: { name: 'Scroll of Unlocking', flavour: 'Every lock on this floor opens.' },
  banishing: { name: 'Scroll of Banishing', flavour: 'Sends the lesser dead back to sleep.' },
};

// What a potion DOES (unknown until drunk). good: true/false only matters for the flavour text.
export const POTIONS = {
  healing: { name: 'Potion of Healing', flavour: 'Warm, and tastes of honey.', good: true },
  sickness: { name: 'Potion of Sickness', flavour: 'That was not wine.', good: false },
  strength: { name: 'Potion of Strength', flavour: 'Your arm feels heavier. Better.', good: true },
  swiftness: { name: 'Potion of Swiftness', flavour: 'Your feet barely touch the floor.', good: true },
  fortune: { name: 'Potion of Fortune', flavour: 'You cough up a coin. Several.', good: true },
  vigour: { name: 'Potion of Vigour', flavour: 'A new heart beats beside the old.', good: true },
  confusion: { name: 'Potion of Confusion', flavour: 'Left is right. Up is down.', good: false },
  giants: { name: "Giant's Brew", flavour: 'Your shots swell to twice their size.', good: true },
  fire_breath: { name: 'Potion of Fire Breath', flavour: 'You belch flame.', good: true },
  clarity: { name: 'Potion of Clarity', flavour: 'You see the luck in things.', good: true },
};

// What a potion LOOKS like. Each run shuffles which look hides which effect.
export const POTION_LOOKS = [
  { name: 'Bilious Potion', glass: ['#1e2206', '#4a5214', '#8a9a2a', '#d0e070'] }, // (red is only ever healing)
  { name: 'Bubbling Green Potion', glass: ['#0e2a10', '#2a6a20', '#4aa83a', '#a0f080'] },
  { name: 'Cloudy Blue Potion', glass: ['#0e1a3a', '#24447a', '#4a7ac0', '#a0c8ff'] },
  { name: 'Golden Potion', glass: ['#3a2a08', '#7a5a14', '#d0aa40', '#fff0a0'] },
  { name: 'Black Potion', glass: ['#060608', '#141418', '#26262e', '#5a5a6a'] },
  { name: 'Violet Potion', glass: ['#1e0a2e', '#4a1a6a', '#8a3ac0', '#d8a0ff'] },
  { name: 'Milky Potion', glass: ['#4a4a46', '#8a8a82', '#cacac0', '#ffffff'] },
  { name: 'Amber Potion', glass: ['#3a1a06', '#7a3a10', '#c86a20', '#ffb060'] },
  { name: 'Teal Potion', glass: ['#062a2a', '#145a5a', '#2aa0a0', '#90ffee'] },
  { name: 'Rusty Potion', glass: ['#2a120a', '#5a2a14', '#8a4a2a', '#c88a60'] },
];

export const TRINKET_IDS = Object.keys(TRINKETS);
export const SCROLL_IDS = Object.keys(SCROLLS);
export const POTION_IDS = Object.keys(POTIONS);

// Sheet frames
export const CURIO_FRAME = {
  trinket: (id) => TRINKET_IDS.indexOf(id),
  scroll: (id) => 10 + SCROLL_IDS.indexOf(id),
  potion: (lookIndex) => 20 + lookIndex,
  seal: (i) => 30 + i,
  page: () => 33,
  mystery: () => 34, // an unknown relic (Omen of the Blind)
};
export const CURIO_FRAMES = 35;

// How strong the effects are.
export const CURIO_FX = {
  wardingTime: 6,
  hasteTime: 15,
  haste: { moveSpeed: 1.3, fireDelay: 0.7 },
  lightningDamage: 10,
  fireTime: 5,
  fireDps: 1.2,
  banishBossDamage: 20,
  confusionTime: 10,
  rageTime: 4,
  rageDamage: 1.5,
};

// The three Seal Fragments. All three open the sealed door before the Mad King's throne.
export const SEALS = [
  { name: 'Seal of Bone', flavour: 'Kept by the Keeper of the Forgotten Vault.' },
  { name: 'Seal of Flame', flavour: 'Won by the one who put out the right fires.' },
  { name: 'Seal of Thorn', flavour: 'Fished from the bottom of a wishing well.' },
];

// Torn journal pages: the true story, a page at a time. Read them on the collection page.
export const PAGES = [
  { title: 'Page I', text: 'King Varick hears voices. He says the crown speaks to him at night, and that it is hungry.' },
  { title: 'Page II', text: 'He had the old grey wizard thrown below for laughing. The wizard did not laugh. The crown said he did.' },
  { title: 'Page III', text: 'They are digging deeper under the cells. The diggers come back pale and do not speak.' },
  { title: 'Page IV', text: 'The crown was not made for this king. It was found in the First King\'s tomb, on a skull that still wore it.' },
  { title: 'Page V', text: 'The Hollow was a garden once, the queen\'s. The king burned her for a witch. The garden went on growing, in the dark.' },
  { title: 'Page VI', text: 'The court sorcerers say the crown is a key. Far below there is a door, and something on the other side is pushing.' },
  { title: 'Page VII', text: 'Three seals were made to bind it: bone, flame and thorn. They were hidden where no king would look.' },
  { title: 'Page VIII', text: 'The Black Champion swore to protect the king. I think now he only protects the crown.' },
  { title: 'Page IX', text: 'If you are reading this, the halls are already burning. Do not put on the crown. Break it.' },
  { title: 'Page X', text: 'My name was Tobiah. I was the king\'s chronicler. I am writing this in the dark. I hear him coming. Whatever you do, do not let the crown go home.' },
];
