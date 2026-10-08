import { SETS } from '../data/sets.js';

// The powers of the transformations that need a hook of their own (the rest are plain stats, a
// tint, or handled where they apply: the Alchemist in Projectiles, the Beastmaster in Familiars).

let auraAcc = 0;

/** Every frame while playing. */
export function tickSets(game, dt) {
  const p = game.player;
  const plague = p.setPower('plague');
  if (plague) {
    // Plaguebearer: enemies close to Wren sicken
    auraAcc += dt;
    if (auraAcc >= 0.5) {
      auraAcc = 0;
      const r = plague.aura.radius;
      game.enemies.forEachAlive(game.room, (e) => {
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < r * r) e.applyStatus('poison', 1.5, p.stats.damage * plague.aura.dps);
      });
      game.effects.glow.emit(game.effects.presets.goo, p.x + (Math.random() - 0.5) * r, p.y + (Math.random() - 0.5) * r * 0.7, 4, 0, 0, 6);
    }
  }
}

/** A new floor begins. */
export function setsOnFloorStart(game) {
  const p = game.player;
  if (p && p.setPower('saint')) p.ironHalfHearts += SETS.saint.ironPerFloor;
}
