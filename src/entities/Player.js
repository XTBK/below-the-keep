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
    this.active = null; // { id, charge, max }
    const ch = (this.character = CHARACTERS[game.characterId] || CHARACTERS.wren);
    this.halfHearts = ch.halfHearts;
    this.baseMaxHalfHearts = ch.halfHearts;
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
    const looks = this.character.looks.concat(lo.looks);
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
    this.recompute();
    if (r.heal) this.heal(r.heal);
    const seen = Save.data.unlocks.itemsSeen;
    if (!seen.includes(id)) seen.push(id);
    this.game.hud.markDirty();
    return dropped;
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
    if (this.invuln > 0 || this.dead || this.buffs.warding > 0) return false;
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
    this.vx = approach(this.vx, tx, rate);
    this.vy = approach(this.vy, ty, rate);
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
    if (this.perks.chargeShot) {
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

  /** Throw a stone (or, for a wizard, cast a spell bolt). */
  fire(dx, dy) {
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
        this.game.projectiles.spawn(this.x + hand[0], this.y + hand[1], hand[2], vx, vy, shot, 0, scale);
      }
      if (this.perks.rearShot) this.game.projectiles.spawn(this.x, this.y, hand[2], -dx * st.shotSpeed, -dy * st.shotSpeed, shot, 0, scale * 0.7);
      this.game.familiars.onPlayerFire(dx, dy);
    }
    const b = this.buffs;
    this.fireCooldown = st.fireDelay * (b.haste > 0 ? CURIO_FX.haste.fireDelay : 1) * (b.drum > 0 ? ACTIVE.warDrum.fireDelay : 1) * (this.rallied ? ACTIVE.banner.fireDelay : 1);
    this.throwTimer = PLAYER.throwAnimTime;
    this.game.audio.play(this.character.weapon === 'wand' ? 'wand' : 'sling');
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
