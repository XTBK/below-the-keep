// OMENS: now and then a floor is cursed. The omen is announced with the floor's name and shown
// under the minimap. (Chance per floor from floor 2 on; never the throne or the Vault.)

export const OMEN_CHANCE = 0.28;

export const OMENS = {
  darkness: { name: 'Omen of Darkness', flavour: 'The torches gutter. Something likes the dark.' },
  maze: { name: 'Omen of the Maze', flavour: 'The floor goes on, and on, and on.' },
  lost: { name: 'Omen of the Lost', flavour: 'Your map is blank. You cannot remember the way.' },
  unknown: { name: 'Omen of the Unknown', flavour: 'You cannot tell how badly you are hurt.' },
  blind: { name: 'Omen of the Blind', flavour: 'Every relic looks the same in this gloom.' },
  hunt: { name: 'Omen of the Hunt', flavour: 'The strongest of them have come out to play.' },
};
export const OMEN_IDS = Object.keys(OMENS);

export const OMEN_FX = {
  darknessAmbient: 0.4, // ambient light is multiplied by this
  mazeExtraSize: 2, // the floor is generated as if this many floors deeper (more rooms)
  huntChampions: 3, // champion chance multiplied by this
};
