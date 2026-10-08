// TRANSFORMATIONS: carry three relics of the same set and Wren is changed by them for the rest of
// the run - a new look and a new power. Which relics belong to which set is the `set` field in
// data/items.js. The powers themselves are handled in items/Sets.js.

export const SET_SIZE = 3;

export const SETS = {
  plague: {
    name: 'Plaguebearer',
    flavour: 'You are the sickness now. Nearby foes rot.',
    tint: [0.75, 1.25, 0.65],
    aura: { radius: 56, dps: 0.6 }, // poisons enemies close to you
  },
  saint: {
    name: 'The Saint',
    flavour: 'A halo of old light. Iron grows over your heart each floor.',
    tint: [1.2, 1.15, 0.95],
    stats: { damage: 0.6 },
    ironPerFloor: 2, // half hearts of armour at the start of every floor
  },
  beast: {
    name: 'The Beast',
    flavour: 'Fur, fang and fury.',
    tint: [1.2, 0.85, 0.75],
    stats: { damage: 1 },
    statsMult: { moveSpeed: 1.15 },
  },
  alchemy: {
    name: 'The Alchemist',
    flavour: 'Every shot you loose is an experiment.',
    tint: [1.05, 0.9, 1.25],
    elementChance: 0.35, // chance a stone gains an extra element: fire, poison, frost, lightning or blast
  },
  menagerie: {
    name: 'The Beastmaster',
    flavour: 'Your companions answer to you alone.',
    tint: [1.1, 1.05, 0.9],
    familiarRate: 1.8, // companions act this much faster
    bonusFamiliar: 'owl', // and another owl joins them
  },
};
