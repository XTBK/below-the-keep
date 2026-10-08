// The prisoners. The king sent them down into the Keep before you; some are still alive, in
// chains, somewhere below. Free one (it takes a key) and they make their way back up to the
// Gatehouse, where every run begins - and from then on they help you, every run.
//
// minFloor: the shallowest floor they can be found on. Order matters: it's the order of their
// spots in the Gatehouse.

import { Save } from '../core/Save.js';

export const PRISONERS = {
  smith: {
    name: 'Hollis the Smith',
    minFloor: 2,
    chained: 'Hollis the Smith, in chains. A key would open these shackles.',
    freed: 'Hollis is free! He will wait for you at the Gatehouse, by a forge.',
    service: 'Re-forges any weapon you have carried before. Touch him to choose the one you start with.',
  },
  quartermaster: {
    name: 'Bram the Quartermaster',
    minFloor: 2,
    chained: 'Bram the Quartermaster, in chains. A key would open these shackles.',
    freed: 'Bram is free! He will keep the Gatehouse stores for you.',
    service: 'Every run, you set out with an extra bomb, an extra key and 5 pennies.',
  },
  priest: {
    name: 'Sister Ottilie',
    minFloor: 3,
    chained: 'Sister Ottilie, in chains. A key would open these shackles.',
    freed: 'Sister Ottilie is free! She will pray for you at the Gatehouse.',
    service: 'Her prayer goes down with you: the first time you fall in a run, you rise again.',
  },
  cartographer: {
    name: 'Wynn the Cartographer',
    minFloor: 4,
    chained: 'Wynn the Cartographer, in chains. A key would open these shackles.',
    freed: 'Wynn is free! She will draw up her maps at the Gatehouse.',
    service: "Every floor's boss, armoury and merchant are on your map from the start.",
  },
  archivist: {
    name: 'Old Ambrose',
    minFloor: 5,
    chained: 'Old Ambrose the Archivist, in chains. A key would open these shackles.',
    freed: 'Ambrose is free! He remembers an old stair, and will show you.',
    service: "Knows a forgotten stair: start in the Catacombs with a relic in hand.",
  },
};

export const PRISONER_IDS = Object.keys(PRISONERS);

/** Has this prisoner been freed (in any run)? */
export function rescued(id) {
  return (Save.data.rescued || []).includes(id);
}

export function rescue(id) {
  if (!Save.data.rescued) Save.data.rescued = [];
  if (!Save.data.rescued.includes(id)) Save.data.rescued.push(id);
  Save.write();
}

/** The weapons the smith can re-forge for a hero class (any carried before), starter first. */
export function forgeable(cls, ids, defs, starter) {
  const carried = new Set(Save.data.weaponsCarried || []);
  return [starter, ...ids.filter((id) => id !== starter && defs[id].class === cls && carried.has(id))];
}
