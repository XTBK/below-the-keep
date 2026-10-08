import { RELICS } from '../data/items.js';
import { fxRng } from '../core/Rng.js';
import { CURIO_FX } from '../data/curios.js';

// PERKS are special rules a relic or trinket switches on (its `perks` field). Each one is handled
// at one moment of the game, all of them here:
//
//   kills       leech (sometimes heal), greed (sometimes a penny), corpseBurst (enemies burst into
//               flame), soulJar (kills charge the active relic)
//   getting hurt  thornMail (thorns burst out), rage (a burst of damage)
//   room cleared  battery (sometimes an extra charge)
//   new floor   mapReveal (the map), compass (secret rooms)
//   shooting    multishot, rearShot, berserk (handled in Player.fire)
//   other       secondWind (Game), flight (Player), keySaver (Game), bigBombs + bombImmune (Bombs)

export const PERKS = {
  leechChance: 1 / 12,
  greedChance: 1 / 7,
  corpseBurst: { radius: 34, damage: 4 },
  soulJarKills: 4, // kills per charge
  batteryChance: 0.5,
  thornCount: 8,
  berserk: 1.6, // damage multiplier at one heart or less
  bigBombs: 1.35,
  keySaverChance: 1 / 3,
  roomHealChance: 0.25, // the Physician's Kit: per room cleared
  killHasteTime: 1.2, // the Hunting Horn: seconds of haste per kill
};

export function onEnemyKilled(game, e) {
  const p = game.player;
  const k = p.perks;
  if (!k) return;
  // the Hunting Horn: a kill sends you running on
  if (k.killHaste) p.buffs.haste = Math.max(p.buffs.haste, PERKS.killHasteTime * k.killHaste);
  if (e.isBoss) return;
  if (k.leech && fxRng.chance(PERKS.leechChance * k.leech) && p.halfHearts < p.maxHalfHearts) {
    p.heal(1);
    game.effects.burst(game.effects.presets.blood, p.x, p.y, 16, 6, 40, 60);
    game.audio.play('heart', 0.6);
  }
  if (k.greed && fxRng.chance(PERKS.greedChance * k.greed)) game.pickups.spawn(e.room, 'penny', e.x, e.y);
  if (k.corpseBurst) {
    const c = PERKS.corpseBurst;
    game.effects.fireBurst(e.x, e.y);
    game.enemies.forEachAlive(e.room, (o) => {
      if (o !== e && Math.hypot(o.x - e.x, o.y - e.y) < c.radius) {
        o.hit(c.damage * k.corpseBurst, 0, 0, true);
        o.applyStatus('burn', 2, 1);
      }
    });
  }
  if (k.soulJar && p.active) {
    p.soulKills = (p.soulKills || 0) + 1;
    if (p.soulKills >= PERKS.soulJarKills) {
      p.soulKills = 0;
      p.chargeActive(1);
    }
  }
}

export function onPlayerHurt(game) {
  const p = game.player;
  const k = p.perks;
  if (k.thornMail) {
    const shot = { ...p.shot, tint: [0.7, 1.3, 0.5] };
    for (let i = 0; i < PERKS.thornCount; i++) {
      const a = (i / PERKS.thornCount) * Math.PI * 2;
      game.projectiles.spawn(p.x, p.y, 10, Math.cos(a) * 240, Math.sin(a) * 240, shot);
    }
  }
  if (k.rage) p.buffs.rage = CURIO_FX.rageTime;
}

export function onRoomCleared(game) {
  const p = game.player;
  // the Physician's Kit: a room cleared, a wound dressed (now and then)
  if (p.perks.roomHeal && p.halfHearts < p.maxHalfHearts && fxRng.chance(PERKS.roomHealChance * p.perks.roomHeal)) {
    p.heal(1);
    game.audio.play('heart', 0.5);
  }
  if (p.perks.battery && fxRng.chance(PERKS.batteryChance)) p.chargeActive(1);
}

export function onFloorStart(game) {
  const p = game.player;
  if (!p) return;
  if (p.perks.mapReveal) revealFloor(game, false);
  if (p.perks.compass) for (const r of game.floor.rooms) if (r.type === 'secret' || r.type === 'supersecret') r.seen = true;
}

/** Show the whole floor on the map (and, if `secrets`, the secret rooms too). */
export function revealFloor(game, secrets) {
  for (const r of game.floor.rooms) {
    const hiddenRoom = r.type === 'secret' || r.type === 'supersecret' || r.type === 'altar';
    if (!hiddenRoom || (secrets && r.type !== 'altar')) r.seen = true;
  }
  game.hud.markDirty();
}

/** The Phoenix Feather: Wren gets back up, once. Returns true if he did. */
export function trySecondWind(game) {
  const p = game.player;
  if (!p.perks.secondWind) return false;
  // it burns away (the Phoenix Feather, the Last Candle - whichever gave it)
  const i = p.relics.findIndex((id) => RELICS[id] && RELICS[id].perks && RELICS[id].perks.secondWind);
  if (i >= 0) p.relics.splice(i, 1); // it burns away
  p.dead = false;
  p.halfHearts = Math.min(p.maxHalfHearts, 4);
  p.invuln = 2.5;
  p.recompute();
  game.effects.relicBurst(p.x, p.y);
  game.effects.fireBurst(p.x, p.y);
  game.audio.play('relic');
  game.hud.markDirty();
  return true;
}
