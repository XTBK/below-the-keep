import { PLAYER, FEEL } from '../data/config.js';
import { RELICS } from '../data/items.js';
import { Sprite, Animator, LAYER } from '../render/Sprite.js';
import { buildWrenSheet } from '../render/Assets.js';
import { pushCircleOutOfBox, clampCircleToRect } from '../world/Collision.js';
import { computeLoadout, useActive } from '../items/Relics.js';
import { Save } from '../core/Save.js';
import { TRINKETS, CURIO_FX } from '../data/curios.js';
import { ACTIVE } from '../data/items.js';
import { PERKS, onPlayerHurt } from '../items/Perks.js';
import { CHARACTERS } from '../data/characters.js';
import { DIFFICULTY } from '../data/difficulty.js';
import { quality } from '../data/quality.js';
import { WEAPONS, ROLL, COMBAT, SKILLS } from '../data/config.js';
import { WEAPON_DEFS, starterWeapon } from '../data/weapons.js';
import * as THREE from 'three';

const SLASH = new THREE.Color(2.2, 2.1, 1.8);
import { SETS, SET_SIZE } from '../data/sets.js';

// Wren (or whichever character was chosen: see data/characters.js). Moves with WASD / left
// stick, throws sling stones with the arrows / right stick.
// Carries relics: passives change his stats and stones (see items/Relics.js), one active relic
// sits in the Space slot and recharges as rooms are cleared. One trinket (always on), one scroll
// or potion in the Q slot, and the Seal Fragments he's found.

// where the sling hand releases a stone, per facing direction: [dx, dy, height]
const HAND = {
  down: [-6, -1, 12],
  up: [6, 2, 18],
  right: [7, 0, 15],
  left: [-7, 0, 15],
};

const DEAD_INPUT = { moveX: 0, moveY: 0, shootX: 0, shootY: 0 };

function approach(v, target, maxDelta) {
  if (v < target) return Math.min(v + maxDelta, target);
  return Math.max(v - maxDelta, target);
}

export class Player {
  constructor(game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = 'down';
    this.fireCooldown = 0;
    this.throwTimer = 0;
    this.invuln = 0;
    this.dead = false;
    this.lastHurtBy = 'the Dark';
    this.shotCounter = 0;
    this.slowT = 0; // > 0 while stuck in a web

    this.relics = []; // passive relic ids, in pickup order
    this.badLuck = 0; // weak relics in a row (see data/quality.js)
    this.active = null; // { id, charge, max }
    const ch = (this.character = CHARACTERS[game.characterId] || CHARACTERS.wren);
    this.weaponId = starterWeapon(ch.weapon); // the weapon in hand (data/weapons.js); null for sling heroes
    // the Oath of Glass: just two hearts
    const hearts = game.oath('glass') ? Math.min(ch.halfHearts, 4) : ch.halfHearts;
    this.halfHearts = hearts;
    this.baseMaxHalfHearts = hearts;
    this.pennies = ch.pickups.pennies;
    this.bombs = ch.pickups.bombs;
    this.keys = ch.pickups.keys;
    this.trinket = ch.trinket || null; // trinket id
    this.consumable = ch.consumable ? { ...ch.consumable } : null; // { type: 'scroll' | 'potion', id }
    this.seals = [false, false, false];
    this.soulKills = 0;
    this._iron = 0; // iron (armour) hearts, in half hearts: soak hits first, can't be healed back
    this.shieldReady = false; // Saint's Shroud: the first hit in each room is blocked
    this.martyrStacks = 0; // Martyr's Chain: hits taken this floor
    this.charge = 0; // Siege Crossbow: 0..1 while a shot is held
    this.rollT = 0; // > 0 while dodge-rolling
    this.rollCool = 0;
    this.rollDir = { x: 0, y: -1 };
    this.chargeT = 0; // > 0 while shield-charging
    this.stillT = 0; // how long he's stood still (Steady Aim)
    this.steady = false;
    this.slashT = 0; // the sword arc, fading
    this.slashAngle = 0;
    this.chargeDir = { x: 1, y: 0 };
    this.transforms = new Set(); // sets of three relics that changed him (data/sets.js)
    this.familiarList = []; // companions following him (items/Familiars.js)
    this._ready = false;
    // timed effects (seconds left): haste, drum, chalice, rage, warding, confusion
    this.buffs = { haste: 0, drum: 0, chalice: 0, rage: 0, warding: 0, confusion: 0 };
    // what potions did to him, for good (counted like one more relic)
    this.potionBonus = { stats: { damage: 0, luck: 0 }, statsMult: { moveSpeed: 1 }, mods: { size: 0 } };

    const scene = game.renderer.scene;
    this.shadow = new Sprite(scene, 'shadows', { shadow: true });
    this.shadow.setFrame(1, 0);
    this.sprite = new Sprite(scene, 'wren', { anchorY: 1 });
    this.anim = new Animator(this.sprite);
    this.anim.play('idle');
    this.light = game.lighting.add({ ...PLAYER.light, x, y });
    this._looks = '';
    this.recompute();
    for (const id of ch.relics) this.addRelic(id); // what the character starts with
    this._ready = true;
  }

  /** Iron hearts (half hearts). Red and iron hearts together never exceed twelve hearts. */
  get ironHalfHearts() {
    return this._iron;
  }

  set ironHalfHearts(v) {
    this._iron = Math.max(0, Math.min(24 - this.maxHalfHearts, v));
    if (this.game.hud) this.game.hud.markDirty();
  }

  /** The power of a transformation Wren has, or null (see data/sets.js). */
  setPower(name) {
    return this.transforms.has(name) ? SETS[name] : null;
  }

  /** What something costs him (the Merchant's Seal haggles 30% off). */
  priceOf(price) {
    if (this.game.oath('purse')) price = Math.ceil(price * 1.5); // the Oath of the Lean Purse
    return this.perks.haggle ? Math.max(1, Math.ceil(price * 0.7)) : price;
  }

  // ------------------------------------------------------------------------------------------
  // Relics
  // ------------------------------------------------------------------------------------------

  /** Recalculate stats + shot profile from the relics (and redraw Wren if his look changed). */
  recompute() {
    this._updateTransforms();
    const items = this.relics.slice();
    for (const t of this.transforms) items.push(SETS[t]); // a transformation's own strengths
    if (this.active) items.push(this.active.id); // actives can still change his look
    if (this.trinket) items.push(TRINKETS[this.trinket]);
    items.push(this.character); // the character's own strengths and weaknesses
    const wd = this.weapon;
    if (wd) items.push({ stats: wd.stats, statsMult: wd.statsMult, mods: wd.mods, perks: wd.perks, look: wd.tint ? { stone: wd.tint } : null });
    items.push(this.potionBonus);
    const lo = computeLoadout(items);
    this.stats = lo.stats;
    this.shot = lo.shot;
    this.perks = lo.perks;
    if (this.light) {
      // the Hermit's Lantern lights up much more of the room
      this.light.radius = PLAYER.light.radius * (this.perks.lantern ? 1.45 : 1);
      this.light.light.distance = this.light.radius;
      this.light.brightness = PLAYER.light.brightness * (this.perks.lantern ? 1.3 : 1);
    }
    const prevMax = this.maxHalfHearts || this.baseMaxHalfHearts;
    this.maxHalfHearts = Math.min(24, this.baseMaxHalfHearts + lo.bonusHalfHearts);
    if (this.maxHalfHearts > prevMax) this.halfHearts += this.maxHalfHearts - prevMax; // new hearts come full
    this.halfHearts = Math.min(this.halfHearts, this.maxHalfHearts);
    // companions: one per familiar relic, plus the Beastmaster's extra owl
    const fam = [];
    for (const id of this.relics) if (RELICS[id].familiar) fam.push(RELICS[id].familiar);
    if (this.transforms.has('menagerie')) fam.push(SETS.menagerie.bonusFamiliar);
    this.familiarList = fam;
    // the weapon shows in his hands: it adds a look, or replaces the starting one
    let looks = this.character.looks.concat(lo.looks);
    if (wd && wd.look && wd.look.replace) looks = looks.map((l) => (l === wd.look.replace[0] ? wd.look.replace[1] : l));
    if (wd && wd.look && wd.look.add) looks = looks.concat([wd.look.add]);
    const key = looks.join(',');
    if (key !== this._looks) {
      this._looks = key;
      const sheet = buildWrenSheet(looks, this.character.recolor);
      this.sprite.swapSheet(sheet.color, sheet.normal);
    }
  }

  /** Three relics of a set: Wren transforms (announced once, kept for the run). */
  _updateTransforms() {
    const count = {};
    const ids = this.relics.slice();
    if (this.active) ids.push(this.active.id);
    for (const id of ids) {
      const set = RELICS[id] && RELICS[id].set;
      if (set) count[set] = (count[set] || 0) + 1;
    }
    for (const set in count) {
      if (count[set] < SET_SIZE || this.transforms.has(set)) continue;
      this.transforms.add(set);
      if (this._ready) {
        const def = SETS[set];
        this.game.hud.banner({ name: `${this.character.name.toUpperCase()} BECOMES ${def.name.toUpperCase()}`, flavour: def.flavour });
        this.game.audio.play('relic');
        this.game.audio.play('gong', 0.7);
        this.game.effects.relicBurst(this.x, this.y);
        const seen = Save.data.unlocks.itemsSeen;
        if (!seen.includes('set:' + set)) seen.push('set:' + set);
        if (set === 'saint') this.ironHalfHearts += SETS.saint.ironPerFloor;
      }
    }
  }

  /**
   * Pick up a relic. Returns the id of an active relic that was swapped out (to put back on the
   * pedestal), or null.
   */
  addRelic(id) {
    const r = RELICS[id];
    let dropped = null;
    if (r.type === 'active') {
      if (this.active) dropped = this.active.id;
      this.active = { id, charge: r.charges, max: r.charges };
    } else {
      this.relics.push(id);
    }
    for (const k in r.pickups || {}) this[k] += r.pickups[k];
    // bad-luck protection keeps count of weak relics in a row
    const q = quality(id);
    if (q <= 1) this.badLuck++;
    else if (q >= 3) this.badLuck = 0;
    this.recompute();
    if (r.heal) this.heal(r.heal);
    const seen = Save.data.unlocks.itemsSeen;
    if (!seen.includes(id)) seen.push(id);
    this.game.hud.markDirty();
    return dropped;
  }

  /** The weapon in hand (data/weapons.js), or null. */
  get weapon() {
    return this.weaponId ? WEAPON_DEFS[this.weaponId] : null;
  }

  /** The swing of the melee weapon in hand. */
  get melee() {
    const wd = this.weapon;
    return wd && wd.melee ? { ...WEAPONS.sword, ...wd.melee } : WEAPONS.sword;
  }

  /** Take up a weapon; returns the one put down (left on the pedestal). */
  equipWeapon(id) {
    const old = this.weaponId;
    this.weaponId = id;
    this.recompute();
    this.game.hud.markDirty();
    return old;
  }

  /** Take a passive relic away again (the Blacksmith's Anvil melts it down). */
  removeRelic(id) {
    const i = this.relics.lastIndexOf(id);
    if (i < 0) return false;
    this.relics.splice(i, 1);
    this.recompute();
    this.game.hud.markDirty();
    return true;
  }

  hasRelic(id) {
    return this.relics.includes(id) || (this.active && this.active.id === id);
  }

  /** Clearing a room charges the active relic by one. */
  chargeActive(n = 1) {
    if (!this.active) return;
    const before = this.active.charge;
    this.active.charge = Math.min(this.active.max, this.active.charge + n);
    if (this.active.charge === this.active.max && before < this.active.max) this.game.audio.play('charged');
    this.game.hud.markDirty();
  }

  tryUseActive() {
    const a = this.active;
    if (!a || this.dead) return;
    if (a.charge < a.max) {
      this.game.audio.play('deny', 0.6);
      return;
    }
    if (useActive(this.game, a.id)) {
      a.charge = 0;
      this.game.hud.markDirty();
    }
  }

  heal(halfHearts) {
    this.halfHearts = Math.min(this.maxHalfHearts, this.halfHearts + halfHearts);
    this.game.hud.markDirty();
  }

  // ------------------------------------------------------------------------------------------

  /**
   * Take damage in half hearts. (fromX, fromY) is where the hit came from, for knockback.
   * `source` names what hurt him (shown on the death screen).
   */
  hurt(halfHearts, fromX, fromY, source = 'the Dark') {
    if (this.invuln > 0 || this.dead || this.buffs.warding > 0 || this.rollT > 0 || this.chargeT > 0) return false;
    // deep down, every hit costs a whole heart
    if (halfHearts === 1 && this.game.floorNumber >= DIFFICULTY.fullHeartFrom) halfHearts = 2;
    if (this.shieldReady && this.perks.shield) {
      // the Saint's Shroud takes the blow
      this.shieldReady = false;
      this.invuln = PLAYER.invulnTime * 0.6;
      this.game.audio.play('holy', 0.8);
      this.game.effects.holySplash(this.x, this.y, 30);
      this.game.hud.markDirty();
      return false;
    }
    // iron hearts soak the blow first
    const soaked = Math.min(this._iron, halfHearts);
    this._iron -= soaked;
    if (soaked) this.game.audio.play('clang', 0.6);
    this.halfHearts = Math.max(0, this.halfHearts - (halfHearts - soaked));
    if (this.perks.martyr) this.martyrStacks = Math.min(5, this.martyrStacks + 1);
    this.lastHurtBy = source;
    this.invuln = PLAYER.invulnTime;
    this.sprite.flash(FEEL.hitFlashTime * 1.5);
    const dx = this.x - fromX;
    const dy = this.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    this.vx = (dx / len) * PLAYER.hurtKnockback;
    this.vy = (dy / len) * PLAYER.hurtKnockback;
    const g = this.game;
    g.feel.shake(FEEL.hurtShake);
    g.feel.hitStop(FEEL.hurtHitStop);
    g.audio.play('hurt');
    g.hud.markDirty();
    g.tookDamageThisFloor = true;
    if (this.halfHearts === 0) this.dead = true;
    else onPlayerHurt(g);
    return true;
  }

  update(dt, input, room) {
    const st = this.stats;
    if (this.invuln > 0) this.invuln -= dt;
    if (this.dead) input = DEAD_INPUT;

    // --- movement: accelerate toward the stick direction, brake with friction when released ---
    if (this.slowT > 0) this.slowT -= dt;
    const b = this.buffs;
    for (const k in b) if (b[k] > 0) b[k] -= dt;
    const speed = st.moveSpeed * (this.slowT > 0 ? 0.45 : 1) * (b.haste > 0 ? CURIO_FX.haste.moveSpeed : 1);
    const flip = b.confusion > 0 ? -1 : 1; // a Potion of Confusion swaps every direction
    const tx = input.moveX * speed * flip;
    const ty = input.moveY * speed * flip;
    const moving = input.moveX !== 0 || input.moveY !== 0;
    const rate = (moving ? PLAYER.accel : PLAYER.friction) * dt;
    if (this.rollCool > 0) this.rollCool -= dt;
    if (this.slashT > 0) this.slashT -= dt;
    if (this.rollT > 0) {
      // mid-roll: a fixed burst of speed, a puff of dust
      this.rollT -= dt;
      this.vx = this.rollDir.x * ROLL.speed;
      this.vy = this.rollDir.y * ROLL.speed;
      if (Math.random() < 0.5) this.game.effects.landDust(this.x, this.y, 1);
    } else if (this.chargeT > 0) {
      this.chargeT -= dt;
      this.vx = this.rollDir.x * SKILLS.charge.speed;
      this.vy = this.rollDir.y * SKILLS.charge.speed;
      this._chargeHits();
      if (Math.random() < 0.7) this.game.effects.landDust(this.x, this.y, 1);
    } else {
      this.vx = approach(this.vx, tx, rate);
      this.vy = approach(this.vy, ty, rate);
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // --- collisions ---
    const r = PLAYER.radius;
    const flying = this.perks.flight > 0;
    for (let i = 0; i < room.solids.length; i++) {
      if (flying && room.solids[i].pit) continue; // wings carry him over pits
      pushCircleOutOfBox(this, r, room.solids[i]);
    }
    clampCircleToRect(this, r, room.bounds);

    // --- facing: shooting direction wins, otherwise the way we're walking ---
    const shooting = input.shootX !== 0 || input.shootY !== 0;
    if (shooting) {
      this.facing = input.shootX > 0 ? 'right' : input.shootX < 0 ? 'left' : input.shootY > 0 ? 'up' : 'down';
    } else if (moving) {
      if (Math.abs(input.moveX) > Math.abs(input.moveY)) this.facing = input.moveX * flip > 0 ? 'right' : 'left';
      else this.facing = input.moveY * flip > 0 ? 'up' : 'down';
    }

    // --- shooting ---
    this.fireCooldown -= dt;
    this.throwTimer -= dt;
    // Steady Aim: stand still and the next bolt is a sure crit
    if (this.character.steadyAim) {
      if (Math.hypot(this.vx, this.vy) < 14 && this.rollT <= 0) {
        this.stillT += dt;
        if (!this.steady && this.stillT >= SKILLS.steady.still) {
          this.steady = true;
          this.game.audio.play('steady');
          this.game.effects.sparkle(this.x, this.y + 20);
        }
      } else {
        this.stillT = 0;
        this.steady = false;
      }
    }
    if (this.rollT > 0 || this.chargeT > 0) {
      // no shooting mid-dodge
    } else if (this.perks.chargeShot) {
      // the Siege Crossbow: hold to draw, let go to loose one great bolt
      const full = Math.max(0.5, st.fireDelay * 2.5);
      if (shooting) {
        this.charge = Math.min(1, this.charge + dt / full);
        this.chargeDir.x = input.shootX;
        this.chargeDir.y = input.shootY;
      } else if (this.charge > 0.15 && this.fireCooldown <= 0) {
        this.fireCharged(this.chargeDir.x, this.chargeDir.y, this.charge);
        this.charge = 0;
      } else this.charge = 0;
    } else if (shooting && this.fireCooldown <= 0) this.fire(input.shootX, input.shootY);

    // --- animation ---
    this.anim.row = this.sprite.def.dirs[this.facing];
    if (this.throwTimer > 0) this.anim.play('release');
    else if (shooting) this.anim.play('wind');
    else if (Math.hypot(this.vx, this.vy) > 12) this.anim.play('walk');
    else this.anim.play('idle');
    this.anim.update(dt);
    this.sprite.update(dt);
  }

  /** Dodge roll: a quick tumble in the direction he's moving, untouchable while it lasts. */
  tryRoll(input) {
    if (this.dead || this.rollT > 0 || this.chargeT > 0 || this.rollCool > 0) return;
    let dx = input.moveX;
    let dy = input.moveY;
    if (!dx && !dy) {
      const f = { right: [1, 0], left: [-1, 0], up: [0, 1], down: [0, -1] }[this.facing];
      dx = f[0];
      dy = f[1];
    }
    const l = Math.hypot(dx, dy) || 1;
    this.rollDir.x = dx / l;
    this.rollDir.y = dy / l;
    const kind = this.character.dodge || 'roll';
    if (kind === 'blink') return this._blink();
    if (kind === 'charge') return this._charge();
    if (kind === 'reload') {
      this.fireCooldown = 0; // the crossbow is wound mid-tumble
      this.game.audio.play('reload');
    }
    this.rollT = ROLL.time;
    this.rollCool = ROLL.time + ROLL.cooldown;
    this.game.audio.play('roll');
    this.game.effects.landDust(this.x, this.y, 6);
  }

  /** Wren's blink: vanish, and appear a little way off. */
  _blink() {
    const g = this.game;
    const cfg = SKILLS.blink;
    const room = g.room;
    const r = PLAYER.radius;
    const inside = (x, y, box) => x + r > box.x0 && x - r < box.x1 && y + r > box.y0 && y - r < box.y1;
    const b = room.bounds;
    let land = null;
    // walk the line: pits and enemies can be passed over, walls and rocks can't
    for (let d = 4; d <= cfg.distance; d += 4) {
      const x = this.x + this.rollDir.x * d;
      const y = this.y + this.rollDir.y * d;
      if (x - r < b.x0 || x + r > b.x1 || y - r < b.y0 || y + r > b.y1) break;
      let blocked = false;
      let onPit = false;
      for (const s of room.solids) {
        if (!inside(x, y, s)) continue;
        if (s.pit) onPit = true;
        else blocked = true;
      }
      if (blocked) break;
      if (!onPit) land = { x, y };
    }
    if (!land) return; // nowhere to go: the blink isn't spent
    g.effects.spellImpact(this.x, this.y, 14); // where he was
    g.effects.burst(g.effects.presets.holy, this.x, this.y, 14, 10, 60, 40);
    // the sparks left behind sting anything crowding him
    g.enemies.forEachAlive(room, (e) => {
      if (!e.hittable) return;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d > cfg.burstRadius + e.def.hitRadius) return;
      const dmg = this.stats.damage * cfg.burst * this.damageScale;
      const before = e.hp;
      e.hit(dmg, (e.x - this.x) / (d || 1), (e.y - this.y) / (d || 1));
      g.combatFeedback(e, Math.min(dmg, Math.max(0, before)), false);
    });
    this.x = land.x;
    this.y = land.y;
    this.vx = this.rollDir.x * 60;
    this.vy = this.rollDir.y * 60;
    g.effects.spellImpact(this.x, this.y, 14); // where he lands
    this.invuln = Math.max(this.invuln, cfg.invuln);
    this.rollCool = cfg.cooldown;
    g.audio.play('wizBlink');
  }

  /** Sir Aldwin's shield charge. */
  _charge() {
    const cfg = SKILLS.charge;
    this.chargeT = cfg.time;
    this.rollCool = cfg.time + cfg.cooldown;
    this.chargeHit = new Set();
    this.game.audio.play('shieldCharge');
    this.game.effects.landDust(this.x, this.y, 6);
  }

  _chargeHits() {
    const g = this.game;
    const cfg = SKILLS.charge;
    g.enemies.forEachAlive(g.room, (e) => {
      if (!e.hittable || this.chargeHit.has(e)) return;
      const ex = e.x - this.x;
      const ey = e.y - this.y;
      const d = Math.hypot(ex, ey) || 1;
      if (d > PLAYER.radius + e.def.hitRadius + 8) return;
      this.chargeHit.add(e);
      const dmg = this.stats.damage * cfg.damage * this.damageScale;
      const before = e.hp;
      e.hit(dmg, ex / d, ey / d);
      e.kbx += (ex / d) * (cfg.knockback / e.def.mass);
      e.kby += (ey / d) * (cfg.knockback / e.def.mass);
      e.stun(cfg.stun);
      g.combatFeedback(e, Math.min(dmg, Math.max(0, before)), false);
      g.audio.play('shieldBash');
      g.feel.shake(0.15);
    });
  }

  /** The Iron Knight's swing: a mighty arc that also bats enemy shots out of the air. */
  swing(dx, dy) {
    const g = this.game;
    const w = this.melee;
    const angle = Math.atan2(dy, dx);
    this.slashAngle = angle;
    this.slashT = 0.16;
    // a step into the blow
    this.vx += Math.cos(angle) * w.lunge;
    this.vy += Math.sin(angle) * w.lunge;
    let hits = 0;
    const shot = this.shot;
    g.enemies.forEachAlive(g.room, (e) => {
      if (!e.hittable) return;
      const ex = e.x - this.x;
      const ey = e.y - this.y;
      const d = Math.hypot(ex, ey);
      if (d > w.reach + e.def.hitRadius) return;
      let diff = Math.atan2(ey, ex) - angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) > w.arc && d > e.def.hitRadius + 4) return;
      const crit = g.rollCrit();
      const dmg = this.stats.damage * w.damage * this.damageScale * (crit ? COMBAT.critMultiplier : 1);
      const before = e.hp;
      e.hit(dmg, ex / (d || 1), ey / (d || 1));
      e.kbx += (ex / (d || 1)) * (w.knockback / e.def.mass);
      e.kby += (ey / (d || 1)) * (w.knockback / e.def.mass);
      // the blade carries the relics' powers too
      if (shot.burn) e.applyStatus('burn', 3, dmg * 0.25 * shot.burn);
      if (shot.poison) e.applyStatus('poison', 4, dmg * 0.18 * shot.poison);
      if (shot.frost) e.chill(2.5 * shot.frost);
      if (shot.gild && Math.random() < 0.18 * shot.gild) e.gild(1.6);
      if (shot.fear && Math.random() < 0.25 * shot.fear) e.scare(2.2);
      if (w.stun) e.stun(w.stun); // the war hammer rings their heads
      g.combatFeedback(e, Math.min(dmg, Math.max(0, before)), crit);
      g.effects.enemyHit(e.x, e.y, 12, ex / (d || 1), ey / (d || 1), e.look.blood);
      hits++;
    });
    // parry: enemy shots caught in the arc are knocked away
    const shots = g.enemies.shots;
    for (let i = shots.orbs.count - 1; i >= 0; i--) {
      const o = shots.orbs.active[i];
      const ox = o.x - this.x;
      const oy = o.y - this.y;
      if (Math.hypot(ox, oy) > w.reach + 6) continue;
      let diff = Math.atan2(oy, ox) - angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (Math.abs(diff) > w.arc) continue;
      g.effects.sparkle(o.x, o.y);
      shots._releaseOrb(o);
      g.audio.play('parry', 0.6);
    }
    for (let i = shots.bolts.count - 1; i >= 0; i--) {
      const b = shots.bolts.active[i];
      if (Math.hypot(b.x - this.x, b.y - this.y) < w.reach + 6) {
        g.effects.sparkle(b.x, b.y);
        shots._releaseBolt(b);
        g.audio.play('parry', 0.6);
      }
    }
    // barrels and the like
    for (const prop of g.room.props) {
      if (!prop.broken && prop.hit && Math.hypot(prop.x - this.x, prop.ground + 6 - this.y) < w.reach + 10) prop.hit(this.stats.damage * w.damage);
    }
    // the war hammer's blow shakes the floor: a shockwave around the point of impact
    if (w.shockwave) {
      const sx = this.x + Math.cos(angle) * w.reach * 0.7;
      const sy = this.y + Math.sin(angle) * w.reach * 0.7;
      g.enemies.forEachAlive(g.room, (e) => {
        if (!e.hittable) return;
        const d = Math.hypot(e.x - sx, e.y - sy);
        if (d > w.shockwave.radius + e.def.hitRadius) return;
        const dmg = this.stats.damage * w.shockwave.damage * this.damageScale;
        const before = e.hp;
        e.hit(dmg, (e.x - sx) / (d || 1), (e.y - sy) / (d || 1));
        g.combatFeedback(e, Math.min(dmg, Math.max(0, before)), false);
      });
      g.effects.landDust(sx, sy, 10);
      this.shockT = 0.25;
      this.shockAt = { x: sx, y: sy, r: w.shockwave.radius };
      g.feel.shake(0.2);
    }
    g.audio.play((this.weapon && this.weapon.sound) || 'sword');
    if (hits) {
      g.audio.play('slash');
      g.feel.shake(0.18);
    }
    // ...and a weak, short wave of steel flies on
    const hand = HAND[this.facing];
    g.projectiles.spawn(this.x + hand[0], this.y + hand[1], hand[2], dx * this.stats.shotSpeed, dy * this.stats.shotSpeed, { ...shot, range: w.waveRange }, 0, w.waveDamage * this.damageScale);
  }

  /** The sword's arc, drawn bright for a blink. */
  drawOverlay(o, time) {
    // Steady Aim: a glint over his head when the next bolt will crit
    if (this.steady) {
      const a = 0.6 + 0.4 * Math.sin(time * 12);
      for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) o.dot(this.x + dx, this.y + 38 + dy, 3, SLASH, a * (Math.abs(dx) + Math.abs(dy) > 1 ? 0.5 : 1));
    }
    if (this.shockT > 0 && this.shockAt) {
      this.shockT -= 1 / 60;
      const k = 1 - this.shockT / 0.25;
      o.ring(this.shockAt.x, this.shockAt.y + 6, this.shockAt.r * (0.4 + 0.6 * k), SLASH, 1 - k, 3);
    }
    if (this.slashT <= 0) return;
    const w = this.melee;
    const k = this.slashT / 0.16;
    for (const r of [w.reach * 0.6, w.reach * 0.85, w.reach]) o.arc(this.x, this.y + 10, r, this.slashAngle - w.arc, this.slashAngle + w.arc, SLASH, k * (r === w.reach ? 1 : 0.5), 3, 0.8);
  }

  /** Throw a stone (or, for a wizard, cast a spell bolt). */
  fire(dx, dy) {
    const weapon = this.character.weapon || 'sling';
    if (weapon === 'sword') {
      this.swing(dx, dy);
      const st0 = this.stats;
      this.fireCooldown = st0.fireDelay * this.melee.cooldown * (this.buffs.haste > 0 ? CURIO_FX.haste.fireDelay : 1) * (this.buffs.drum > 0 ? ACTIVE.warDrum.fireDelay : 1) * (this.rallied ? ACTIVE.banner.fireDelay : 1);
      this.throwTimer = PLAYER.throwAnimTime * 1.3;
      return;
    }
    // recoil: a little kick back with every shot (a hard one from the crossbow)
    const wcfg = WEAPONS[weapon] || WEAPONS.sling;
    this.vx -= dx * wcfg.recoil;
    this.vy -= dy * wcfg.recoil;
    if (wcfg.shake) this.game.feel.shake(wcfg.shake);
    const st = this.stats;
    const shot = this.shot;
    this.shotCounter++;
    if (shot.orbitEvery && this.shotCounter % shot.orbitEvery === 0) {
      // this one circles Wren instead (orbit modifier)
      this.game.projectiles.spawnOrbit(shot, Math.atan2(dy, dx));
    } else {
      const hand = HAND[this.facing];
      // a little of Wren's own movement carries into the stone (feels natural when strafing)
      const inherit = PLAYER.inheritVelocity;
      const scale = this.damageScale;
      const extra = this.perks.multishot || 0;
      for (let i = 0; i <= extra; i++) {
        // extra stones fan out either side of the aim
        const a = Math.atan2(dy, dx) + (i - extra / 2) * 0.22;
        const vx = Math.cos(a) * st.shotSpeed + this.vx * inherit;
        const vy = Math.sin(a) * st.shotSpeed + this.vy * inherit;
        const p = this.game.projectiles.spawn(this.x + hand[0], this.y + hand[1], hand[2], vx, vy, shot, 0, scale);
        if (p && this.steady) p.sureCrit = true;
      }
      if (this.steady) {
        this.steady = false;
        this.stillT = -0.15; // a moment before it steadies again
        this.game.audio.play('aimedShot');
      }
      if (this.perks.rearShot) this.game.projectiles.spawn(this.x, this.y, hand[2], -dx * st.shotSpeed, -dy * st.shotSpeed, shot, 0, scale * 0.7);
      this.game.familiars.onPlayerFire(dx, dy);
    }
    const b = this.buffs;
    this.fireCooldown = st.fireDelay * (b.haste > 0 ? CURIO_FX.haste.fireDelay : 1) * (b.drum > 0 ? ACTIVE.warDrum.fireDelay : 1) * (this.rallied ? ACTIVE.banner.fireDelay : 1);
    this.throwTimer = PLAYER.throwAnimTime;
    this.game.audio.play((this.weapon && this.weapon.sound) || { wand: 'wand', crossbow: 'xbow' }[this.character.weapon] || 'sling');
    Save.data.stats.stonesThrown++;
  }

  /** One great drawn shot (the Siege Crossbow). */
  fireCharged(dx, dy, charge) {
    const st = this.stats;
    const shot = { ...this.shot, tier: 2, pierce: this.shot.pierce + 2 };
    const hand = HAND[this.facing];
    const sp = st.shotSpeed * 1.35;
    this.game.projectiles.spawn(this.x + hand[0], this.y + hand[1], hand[2], dx * sp, dy * sp, shot, 0, this.damageScale * (1 + 2.5 * charge));
    this.fireCooldown = st.fireDelay;
    this.throwTimer = PLAYER.throwAnimTime;
    this.game.audio.play('crossbowFire', 0.6 + charge * 0.4);
    this.game.feel.shake(0.1 * charge);
  }

  /** Standing by a planted War Banner? */
  get rallied() {
    const b = this.game.warBanner;
    return b && b.t > 0 && Math.hypot(b.x - this.x, b.y - this.y) < ACTIVE.banner.radius;
  }

  /** Damage multiplier right now (berserk at low health, the Blood Chalice, a Bloody Rag...). */
  get damageScale() {
    let k = 1;
    if (this.martyrStacks) k *= 1 + 0.12 * this.martyrStacks;
    if (this.rallied) k *= ACTIVE.banner.damage;
    if (this.perks.berserk && this.halfHearts <= 2) k *= PERKS.berserk;
    if (this.buffs.chalice > 0) k *= ACTIVE.bloodChalice.damage;
    if (this.buffs.rage > 0) k *= CURIO_FX.rageDamage;
    return k;
  }

  sync() {
    this.sprite.place(this.x, this.y);
    if (this.rollT > 0) {
      const k = Math.sin((1 - this.rollT / ROLL.time) * Math.PI);
      this.sprite.mesh.scale.set(1 + 0.25 * k, 1 - 0.35 * k, 1);
    } else if (this.chargeT > 0) {
      this.sprite.mesh.scale.set(1.12, 0.92, 1); // braced behind the shield
    } else if (this.sprite.mesh.scale.x !== 1) this.sprite.mesh.scale.set(1, 1, 1);
    // transformations tint him
    if (this.transforms.size) {
      const c = this.sprite.material.color;
      c.setRGB(1, 1, 1);
      for (const t of this.transforms) c.setRGB(c.r * SETS[t].tint[0], c.g * SETS[t].tint[1], c.b * SETS[t].tint[2]);
    }
    // blink while invincible
    const onTitle = this.game.state === 'title' || this.game.state === 'collection';
    this.sprite.visible = !onTitle && (this.invuln <= 0 || Math.floor(this.invuln * PLAYER.blinkRate) % 2 === 0);
    this.shadow.visible = !onTitle;
    if (this.buffs.warding > 0 && Math.random() < 0.3) this.game.effects.glow.emit(this.game.effects.presets.holy, this.x + (Math.random() - 0.5) * 14, this.y, Math.random() * 24, 0, 0, 20);
    this.shadow.place(this.x, this.y - 6, 0, LAYER.shadow);
    if (this.light) {
      this.light.x = this.x;
      this.light.y = this.y + 4;
    }
  }

  dispose() {
    const scene = this.game.renderer.scene;
    this.sprite.dispose(scene);
    this.shadow.dispose(scene);
    this.game.lighting.remove(this.light);
  }
}
