import { RELICS, MODS, ACTIVE, ROOM_DROPS } from '../data/items.js';
import { revealFloor } from './Perks.js';
import { PLAYER } from '../data/config.js';
import { fxRng } from '../core/Rng.js';

// Turns everything Wren carries (relics, his trinket, what potions did to him) into his stats,
// his PERKS (special rules, see items/Perks.js) and his SHOT PROFILE (what every stone he throws
// carries). Called whenever any of that changes.

// How each relic's `look.stone` tints his stones. Several tints blend together.
export const STONE_TINTS = {
  gold: [1.6, 1.3, 0.55],
  violet: [1.15, 0.75, 1.6],
  green: [0.65, 1.45, 0.55],
  crimson: [1.6, 0.5, 0.5],
  black: [0.45, 0.42, 0.5],
  hazel: [1.25, 1.0, 0.7],
  fire: [1.9, 0.95, 0.4],
  motley: [1.5, 1.15, 0.55],
  ghost: [0.8, 1.25, 1.8],
  storm: [0.85, 1.15, 1.9],
  bead: [1.45, 1.35, 1.1],
  big: [1, 1, 1],
  iron: [0.95, 1.0, 1.15],
  venom: [0.8, 1.6, 0.45],
  comet: [1.8, 1.1, 0.9],
  mirror: [1.3, 1.45, 1.6],
  holy: [1.7, 1.55, 1.0],
  frost: [0.75, 1.2, 1.9],
};

const MOD_NAMES = Object.keys(MODS);

/**
 * @param items  relic ids, or item definitions (a trinket, potion effects...) with the same fields
 * @returns { stats, shot, looks, perks, bonusHalfHearts }
 */
export function computeLoadout(items) {
  const stats = {
    damage: PLAYER.damage,
    fireDelay: PLAYER.fireDelay,
    shotSpeed: PLAYER.shotSpeed,
    range: PLAYER.range,
    moveSpeed: PLAYER.moveSpeed,
    luck: PLAYER.luck,
  };
  const mult = { damage: 1, fireDelay: 1, shotSpeed: 1, range: 1, moveSpeed: 1, luck: 1 };
  const mods = {};
  for (const m of MOD_NAMES) mods[m] = 0;
  const perks = {};
  const looks = [];
  const tints = [];
  let bonusHalfHearts = 0;

  for (const it of items) {
    const r = typeof it === 'string' ? RELICS[it] : it;
    if (!r) continue;
    for (const k in r.stats || {}) stats[k] += r.stats[k];
    for (const k in r.statsMult || {}) mult[k] *= r.statsMult[k];
    for (const k in r.mods || {}) mods[k] += r.mods[k];
    for (const k in r.perks || {}) perks[k] = (perks[k] || 0) + r.perks[k];
    if (r.look && r.look.wren) looks.push(r.look.wren);
    if (r.look && r.look.stone && r.look.stone !== 'big') tints.push(STONE_TINTS[r.look.stone]);
    bonusHalfHearts += r.hearts || 0;
  }
  for (const k in mult) stats[k] *= mult[k];
  if (perks.multishot) perks.multishot = Math.min(4, perks.multishot); // at most four extra shots
  // sanity limits, so no pile of relics can break the game
  stats.fireDelay = Math.max(0.1, stats.fireDelay);
  stats.damage = Math.max(0.5, stats.damage);
  stats.range = Math.max(70, stats.range);
  stats.shotSpeed = Math.max(130, Math.min(560, stats.shotSpeed));
  stats.moveSpeed = Math.max(60, Math.min(230, stats.moveSpeed));

  // blend the stone tints (no relics = plain grey stone)
  const tint = [1, 1, 1];
  if (tints.length) {
    tint[0] = tint[1] = tint[2] = 0;
    for (const t of tints) for (let i = 0; i < 3; i++) tint[i] += t[i] / tints.length;
  }

  const shot = {
    damage: stats.damage,
    range: stats.range,
    tier: Math.min(2, mods.size),
    tint,
    ...mods,
    orbitEvery: mods.orbit > 0 ? Math.max(1, MODS.orbit.every - (mods.orbit - 1)) : 0,
  };
  return { stats, shot, looks, perks, bonusHalfHearts };
}

/** Use an active relic. Returns true if something happened (and the charge is spent). */
export function useActive(game, id) {
  const r = RELICS[id];
  const p = game.player;
  const fx = game.effects;
  const room = game.room;
  switch (r.effect) {
    case 'horn': {
      // a deep blast: every enemy in the room is thrown back and stunned
      const a = ACTIVE.horn;
      game.enemies.forEachAlive(room, (e) => {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        e.kbx += (dx / d) * (a.knockback / e.def.mass);
        e.kby += (dy / d) * (a.knockback / e.def.mass);
        e.stun(e.isBoss ? a.bossStun : a.stun);
      });
      game.feel.shake(0.6);
      game.audio.play('horn');
      game.enemies.shockwave(p.x, p.y, 220);
      return true;
    }
    case 'holyWater': {
      const a = ACTIVE.holyWater;
      game.enemies.forEachAlive(room, (e) => {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < a.radius) e.hit(a.damage, dx / d, dy / d);
      });
      p.heal(a.heal);
      fx.holySplash(p.x, p.y, a.radius);
      game.audio.play('holy');
      return true;
    }
    case 'warDrum':
      // fire twice as fast for a few seconds
      p.buffs.drum = ACTIVE.warDrum.time;
      game.audio.play('thud', 1);
      game.enemies.shockwave(p.x, p.y, 40);
      return true;
    case 'wardingBell':
      // every enemy shot in the air vanishes, and nothing can hurt Wren for a moment
      game.enemies.shots.clear();
      p.buffs.warding = ACTIVE.wardingBell.time;
      game.enemies.shockwave(p.x, p.y, 160);
      game.audio.play('gong', 1);
      fx.holySplash(p.x, p.y, 60);
      return true;
    case 'thunderJar': {
      // lightning leaps to every enemy in the room
      let any = false;
      game.enemies.forEachAlive(room, (e) => {
        any = true;
        game.projectiles.addArc(p.x, p.y + 12, e.x, e.y + 10);
        e.hit(ACTIVE.thunderJar.damage, 0, 0);
        e.stun(0.5);
      });
      if (!any) return false;
      game.audio.play('zap', 1);
      game.feel.shake(0.4);
      return true;
    }
    case 'hourglass':
      // everything else slows down
      game.slowTime = ACTIVE.hourglass.time;
      game.audio.play('cast', 1);
      return true;
    case 'reroll': {
      // the relics on this room's pedestals turn into others
      let any = false;
      for (const st of room.stands) {
        const s = st.slot;
        if (s.gone || s.kind !== 'relic' || s.hearts) continue;
        const next = game.pickRelic(room.data.type, game.dropRng);
        if (!next) continue;
        s.id = next;
        st.refresh();
        fx.relicBurst(st.x, st.y + 18);
        any = true;
      }
      if (any) game.audio.play('relic');
      return any;
    }
    case 'bloodChalice':
      // half a heart for a lot more damage, a while
      if (p.halfHearts <= 1) return false;
      p.halfHearts -= 1;
      p.buffs.chalice = ACTIVE.bloodChalice.time;
      fx.burst(fx.presets.blood, p.x, p.y, 14, 14, 60, 80);
      game.audio.play('hurt', 0.6);
      game.hud.markDirty();
      return true;
    case 'hammer': {
      // every rock in the room shatters, and every hidden way in the walls opens
      const b = room.bounds;
      room.destroyRocksNear((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 9999);
      let opened = false;
      for (const d of room.doors) {
        if (d.conn.hidden && !d.conn.sealed) {
          d.conn.hidden = false;
          d.conn.illusory = false;
          opened = true;
        }
      }
      game.feel.shake(0.5);
      game.audio.play('thud', 1);
      if (opened) {
        game.audio.play('secret');
        game.rebuildCurrentRoom();
      }
      return true;
    }
    case 'bombBag': {
      // three lit kegs, flung in a fan the way Wren faces
      const a = ACTIVE.bombBag;
      const dir = { right: 0, down: -Math.PI / 2, left: Math.PI, up: Math.PI / 2 }[p.facing];
      for (let i = 0; i < a.count; i++) {
        const ang = dir + (i - (a.count - 1) / 2) * a.spread;
        const b = room.bounds;
        const x = Math.max(b.x0 + 6, Math.min(b.x1 - 6, p.x + Math.cos(ang) * a.distance));
        const y = Math.max(b.y0 + 6, Math.min(b.y1 - 6, p.y + Math.sin(ang) * a.distance));
        game.bombs.placeAt(x, y);
      }
      return true;
    }
    case 'crook': {
      // every pickup in the room comes to Wren
      const pool = game.pickups.pool;
      let any = false;
      for (let i = 0; i < pool.count; i++) {
        const q = pool.active[i];
        if (q.room !== room || (q.kind !== 'curio' && !game.pickups.isCollectible(q))) continue;
        q.x = p.x + fxRng.float(-4, 4);
        q.y = p.y + fxRng.float(-4, 4);
        q.age = 1;
        q.waitLeave = false;
        any = true;
      }
      if (any) game.audio.play('coins');
      return any;
    }
    case 'mirror':
      revealFloor(game, true);
      game.audio.play('secret');
      fx.holySplash(p.x, p.y, 50);
      return true;
    case 'censer': {
      let any = false;
      game.enemies.forEachAlive(room, (e) => {
        e.daze(ACTIVE.censer.time);
        any = true;
      });
      for (let i = 0; i < 30; i++) fx.glow.emit(fx.presets.goo, p.x + fxRng.float(-60, 60), p.y + fxRng.float(-40, 40), fxRng.float(4, 30), 0, 0, 8);
      game.audio.play('cast', 0.8);
      return any;
    }
    case 'plenty': {
      const table = { ...ROOM_DROPS, none: 0, chest: 0, ironchest: 0, cursedchest: 0 };
      for (let i = 0; i < ACTIVE.plenty.count; i++) game.dropFrom(table, p.x, p.y, 1);
      game.audio.play('coins');
      return true;
    }
    case 'spin': {
      // one great sweep of the headsman's sword
      const a = ACTIVE.spin;
      game.enemies.forEachAlive(room, (e) => {
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < a.radius + e.def.radius) {
          e.hit(p.stats.damage * a.damage * p.damageScale, dx / d, dy / d);
          e.kbx += (dx / d) * (a.knockback / e.def.mass);
          e.kby += (dy / d) * (a.knockback / e.def.mass);
        }
      });
      game.enemies.shockwave(p.x, p.y, a.radius);
      game.audio.play('swing', 1);
      game.audio.play('clang', 0.6);
      game.feel.shake(0.35);
      return true;
    }
    case 'banner':
      game.warBanner = { x: p.x, y: p.y, t: ACTIVE.banner.time, room };
      game.audio.play('horn', 0.5);
      return true;
    case 'ravens': {
      // six ghostly ravens: stones that seek, and fly through anything
      const shot = { ...p.shot, homing: p.shot.homing + 2, spectral: 1, tint: [0.5, 0.5, 0.75] };
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + fxRng.float(0, 0.5);
        game.projectiles.spawn(p.x, p.y, 14, Math.cos(a) * 200, Math.sin(a) * 200, shot);
      }
      game.audio.play('caw', 1);
      return true;
    }
  }
  return false;
}
