import { TRINKETS, SCROLLS, POTIONS, POTION_LOOKS, POTION_IDS, SEALS, PAGES, CURIO_FRAME, CURIO_FX, TRINKET_IDS, SCROLL_IDS } from '../data/curios.js';
import { ROOM_DROPS } from '../data/items.js';
import { Save } from '../core/Save.js';
import { revealFloor } from './Perks.js';

// Trinkets, scrolls, potions, Seal Fragments and journal pages: picking them up, what they look
// like, what they're called, and using scrolls and potions (the Q slot).
//
// A curio is a small object: { type: 'trinket' | 'scroll' | 'potion' | 'seal' | 'page', id }
// (a potion's id is what it DOES; which colour it looks like is shuffled every run).

// what an undrunk potion says about itself (made once, so the HUD can tell when it changes)
const UNKNOWN = POTION_LOOKS.map((l) => ({ name: l.name, flavour: 'Who knows what it does? Drink it and see.' }));

/** Shuffle which potion colour hides which effect (once per run, seeded). */
export function shufflePotions(rng) {
  const ids = POTION_IDS.slice();
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids; // ids[lookIndex] = effect
}

export function curioFrame(game, item) {
  if (item.type === 'potion') return CURIO_FRAME.potion(game.potionLooks.indexOf(item.id));
  return CURIO_FRAME[item.type](item.id);
}

/** Name + flavour for the hover text and banners. Unknown potions keep their secret. */
export function curioInfo(game, item) {
  switch (item.type) {
    case 'trinket':
      return TRINKETS[item.id];
    case 'scroll':
      return SCROLLS[item.id];
    case 'potion':
      if (game.potionsKnown.has(item.id)) return POTIONS[item.id];
      return UNKNOWN[game.potionLooks.indexOf(item.id)];
    case 'seal':
      return SEALS[item.id];
    case 'page':
      return PAGES[item.id];
  }
  return { name: '?', flavour: '' };
}

/** A random trinket / scroll / potion (seeded). */
export function randomCurio(rng, type) {
  if (type === 'trinket') return { type, id: TRINKET_IDS[Math.floor(rng.next() * TRINKET_IDS.length)] };
  if (type === 'scroll') return { type, id: SCROLL_IDS[Math.floor(rng.next() * SCROLL_IDS.length)] };
  return { type: 'potion', id: POTION_IDS[Math.floor(rng.next() * POTION_IDS.length)] };
}

/** The next journal page Wren hasn't read yet (across all runs), or null if he has them all. */
export function nextPage() {
  const read = Save.data.unlocks.pages;
  for (let i = 0; i < PAGES.length; i++) if (!read.includes(i)) return { type: 'page', id: i };
  return null;
}

/**
 * Wren walks over (or buys) a curio. Returns the curio he had to put down to take it (a trinket
 * or a consumable swapped out), or null.
 */
export function takeCurio(game, item) {
  const p = game.player;
  let dropped = null;
  const info = curioInfo(game, item);
  switch (item.type) {
    case 'trinket':
      dropped = p.trinket ? { type: 'trinket', id: p.trinket } : null;
      p.trinket = item.id;
      p.recompute();
      remember(item.type + ':' + item.id);
      break;
    case 'scroll':
    case 'potion':
      dropped = p.consumable;
      p.consumable = { type: item.type, id: item.id };
      if (item.type === 'scroll') remember('scroll:' + item.id);
      break;
    case 'seal':
      p.seals[item.id] = true;
      game.audio.play('gong', 0.8);
      remember('seal:' + item.id);
      break;
    case 'page':
      if (!Save.data.unlocks.pages.includes(item.id)) Save.data.unlocks.pages.push(item.id);
      Save.write();
      break;
  }
  game.hud.banner(info);
  game.audio.play(item.type === 'page' ? 'buy' : 'relic', 0.7);
  game.hud.markDirty();
  return dropped;
}

function remember(key) {
  const seen = Save.data.unlocks.itemsSeen;
  if (!seen.includes(key)) seen.push(key);
}

/** Q: read the scroll / drink the potion in the consumable slot. */
export function useConsumable(game) {
  const p = game.player;
  const c = p.consumable;
  if (!c || p.dead) return;
  const ok = c.type === 'scroll' ? readScroll(game, c.id) : drinkPotion(game, c.id);
  if (!ok) {
    game.audio.play('deny', 0.6);
    return;
  }
  p.consumable = null;
  game.hud.markDirty();
}

function readScroll(game, id) {
  const p = game.player;
  const room = game.room;
  const fx = game.effects;
  switch (id) {
    case 'mending':
      if (p.halfHearts >= p.maxHalfHearts) return false;
      p.heal(99);
      fx.holySplash(p.x, p.y, 40);
      break;
    case 'revealing':
      revealFloor(game, true);
      break;
    case 'fire':
      game.enemies.forEachAlive(room, (e) => e.applyStatus('burn', CURIO_FX.fireTime, CURIO_FX.fireDps * p.stats.damage));
      fx.fireBurst(p.x, p.y);
      break;
    case 'lightning':
      game.enemies.forEachAlive(room, (e) => {
        game.projectiles.addArc(e.x, e.y + 200, e.x, e.y + 10);
        e.hit(CURIO_FX.lightningDamage, 0, 0);
      });
      game.feel.shake(0.5);
      game.audio.play('zap', 1);
      break;
    case 'warding':
      p.buffs.warding = CURIO_FX.wardingTime;
      break;
    case 'passage':
      if (room.locked || game.transition) return false;
      game.debugEnterRoom(game.floor.startId);
      break;
    case 'plenty': {
      const table = { ...ROOM_DROPS, none: 0 };
      for (let i = 0; i < 3; i++) game.dropFrom(table, p.x, p.y, 1);
      break;
    }
    case 'haste':
      p.buffs.haste = CURIO_FX.hasteTime;
      break;
    case 'unlocking':
      for (const conn of game.floor.connections) conn.locked = false;
      game.audio.play('unlock');
      break;
    case 'banishing':
      game.enemies.forEachAlive(room, (e) => {
        if (e.isBoss) e.hit(CURIO_FX.banishBossDamage, 0, 0);
        else {
          e.hp = 0;
          e.die();
        }
      });
      fx.holySplash(p.x, p.y, 120);
      break;
  }
  game.hud.banner(SCROLLS[id]);
  game.audio.play('cast', 0.9);
  return true;
}

function drinkPotion(game, id) {
  const p = game.player;
  const fx = game.effects;
  game.potionsKnown.add(id);
  remember('potion:' + id);
  switch (id) {
    case 'healing':
      p.heal(4);
      break;
    case 'sickness':
      // hurts, but never kills
      p.halfHearts = Math.max(1, p.halfHearts - 2);
      fx.burst(fx.presets.goo, p.x, p.y, 14, 12, 60, 60);
      break;
    case 'strength':
      p.potionBonus.stats.damage += 0.5;
      break;
    case 'swiftness':
      p.potionBonus.statsMult.moveSpeed *= 1.08;
      break;
    case 'fortune':
      p.pennies += 7;
      break;
    case 'vigour':
      p.baseMaxHalfHearts = Math.min(24, p.baseMaxHalfHearts + 2);
      p.recompute();
      p.heal(2);
      break;
    case 'confusion':
      p.buffs.confusion = CURIO_FX.confusionTime;
      break;
    case 'giants':
      p.potionBonus.mods.size += 1;
      break;
    case 'fire_breath': {
      // a cone of flame the way Wren is facing
      const dir = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 }[p.facing];
      game.enemies.forEachAlive(game.room, (e) => {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        let diff = Math.atan2(dy, dx) - dir;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        if (Math.hypot(dx, dy) < 120 && Math.abs(diff) < 0.6) {
          e.hit(8, Math.cos(dir), Math.sin(dir));
          e.applyStatus('burn', 3, 2);
        }
      });
      for (let i = 0; i < 40; i++) {
        const a = dir + (Math.random() - 0.5) * 1.1;
        const sp = 120 + Math.random() * 120;
        fx.glow.emit(fx.presets.ember, p.x, p.y, 14, Math.cos(a) * sp, Math.sin(a) * sp, 10);
      }
      game.audio.play('breath');
      break;
    }
    case 'clarity':
      p.potionBonus.stats.luck += 1;
      break;
  }
  p.recompute();
  game.hud.banner(POTIONS[id]);
  game.audio.play('heart', 0.7);
  return true;
}
