// Embers: what you carry home. Earned as you go deeper - the better the run, the more you bring
// back - and banked at the Gatehouse when the run ends, won or lost. They're spent at the Hearth
// (in the Gatehouse) on lasting upgrades, most of them taught by the prisoners you've freed.
// Never on the Daily Descent (everyone starts equal there).

import { Save } from '../core/Save.js';
import { rescued } from './prisoners.js';

export const EMBERS = {
  boss: 3, // each boss beaten...
  perFloor: 1, // ...plus 1 per floor of depth
  perTier: 2, // ...plus 2 per skull of the boss's rank
  flawless: 4, // a whole floor without being hurt
  champion: 1, // each champion slain
  realm: 6, // a secret realm's boss
  victory: 25, // the Mad King (or the Crown) falls
  deepVictory: 50, // ...and the Hollow, at the bottom of the Deep
  heatBonus: 0.1, // x(1 + 0.1 per heat) on everything
  stalked: 1.5, // x1.5 in the Stalked mode (Beatrix is hunting you)
};

// The Hearth's upgrades. `by`: the prisoner who must be home to teach it (null: always there).
// costs: one per rank.
export const UPGRADES = {
  heart: { name: 'Kindled Heart', by: null, costs: [40, 120], text: ['Start every run with one more heart.', 'Start with two more hearts.'] },
  steel: { name: 'Tempered Steel', by: 'smith', costs: [30, 70, 140], text: ['+0.25 damage.', '+0.5 damage.', '+0.75 damage.'] },
  stores: { name: 'Fuller Stores', by: 'quartermaster', costs: [25, 60], text: ['Set out with 5 more pennies.', 'Set out with 5 more pennies and another bomb.'] },
  prayer: { name: 'Deeper Prayer', by: 'priest', costs: [40, 110], text: ['Her prayer lifts you with 3 hearts.', 'Her prayer is answered twice a run.'] },
  eye: { name: 'Keen Eye', by: 'cartographer', costs: [50, 120], text: ['Secret rooms are marked on your map.', 'The whole floor is mapped from the start.'] },
  lore: { name: 'Old Knowledge', by: 'archivist', costs: [60, 150], text: ["Ambrose's stair gives a rare relic.", 'Start every run with a relic.'] },
};
export const UPGRADE_IDS = Object.keys(UPGRADES);

export function rank(id) {
  return (Save.data.upgrades && Save.data.upgrades[id]) || 0;
}

export function bank() {
  return Save.data.embers || 0;
}

/** Can this upgrade be learnt (its teacher is home)? */
export function taught(id) {
  const by = UPGRADES[id].by;
  return !by || rescued(by);
}

/** Buy the next rank. Returns true if it worked. */
export function buy(id) {
  const u = UPGRADES[id];
  const r = rank(id);
  if (!taught(id) || r >= u.costs.length || bank() < u.costs[r]) return false;
  Save.data.embers = bank() - u.costs[r];
  if (!Save.data.upgrades) Save.data.upgrades = {};
  Save.data.upgrades[id] = r + 1;
  Save.write();
  return true;
}
