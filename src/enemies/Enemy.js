import { ENEMIES, CHAMPION, ENEMY_FX } from '../data/enemies.js';
import { COMBAT } from '../data/config.js';
import { Sprite, Animator, LAYER } from '../render/Sprite.js';
import { pushCircleOutOfBox, clampCircleToRect } from '../world/Collision.js';
import { fxRng } from '../core/Rng.js';
import { MODS, CHAMPION_DROPS } from '../data/items.js';

// The base every enemy builds on.
//
// An enemy is a small STATE MACHINE: it is always in exactly one state ('walk', 'windup', 'attack',
// 'recover', ...) and `stateTime` counts how long it has been there. Subclasses override:
//   onSpawn(opts)    set up their starting state
//   think(dt)        decide what to do this frame (set vx/vy, change state, attack)
//   drawOverlay(o)   draw telegraphs (aim lines, target rings) on the pixel overlay
//   onDeath()        their own death effect
//
// Enemies are POOLED: the EnemyManager creates each one once and reuses it, so spawning a room full
// of enemies never allocates memory mid-game.

const _dir = { x: 0, y: 0 };

export class Enemy {
  /**
   * @param sheet   asset key of the sprite sheet
   * @param look    { anchorY, shadow (size 0-3), blood ('blood'|'goo'|'ash'|'iron') }
   */
  constructor(game, type, sheet, look, def = ENEMIES[type]) {
    this.game = game;
    this.type = type;
    this.def = def;
    this.look = look;
    const scene = game.renderer.scene;
    this.shadow = new Sprite(scene, 'shadows', { shadow: true });
    this.shadow.setFrame(look.shadow, 0);
    this.sprite = new Sprite(scene, sheet, { anchorY: look.anchorY, emissive: ENEMY_FX.selfLight });
    this.anim = new Animator(this.sprite);
    this.twoFacings = this.sprite.def.rows > 1;
    this.active = false;
    this._hide();
  }

  _hide() {
    this.sprite.visible = false;
    this.shadow.visible = false;
  }

  spawn(room, x, y, opts = {}) {
    this.room = room;
    this.x = x;
    this.y = y;
    this.h = 0; // height above the floor (jumps, flying)
    this.shadowOffset = 6;
    this.hideTint = false;
    this.vx = 0;
    this.vy = 0;
    this.kbx = 0; // knockback velocity
    this.kby = 0;
    this.facing = fxRng.chance(0.5) ? 1 : -1;
    this.champion = !!opts.champion;
    const d = this.def;
    // deeper floors make everything tougher (data/difficulty.js)
    const k = this.game.scaleFor(this);
    this.maxHp = d.hp * (this.champion ? CHAMPION.hpMult : 1) * k.hp;
    this.hp = this.maxHp;
    this.speed = d.speed * (this.champion ? CHAMPION.speedMult : 1) * k.speed;
    this.tempo = k.tempo; // how quickly its timers run: wind-ups, cooldowns, attack rhythm
    this.shotMult = k.shot;
    this.buffT = 0; // > 0 while a Banner Bearer rallies it
    this.dying = false;
    this.deathTime = 0;
    this.grace = opts.noGrace ? 0 : ENEMY_FX.spawnGrace;
    this.state = '';
    this.stateTime = 0;
    // status effects (from Wren's relics)
    this.burnTime = 0;
    this.burnDps = 0;
    this.poisonTime = 0;
    this.poisonDps = 0;
    this.stunTime = 0;
    this.chillTime = 0; // slowed; killed while chilled it shatters into ice
    this.gildTime = 0; // turned to gold: can't move; killed so, it drops a penny
    this.fearTime = 0; // runs away from Wren
    this.dazeTime = 0; // stumbles about, forgetting to fight
    this.statusTick = 0;
    this.emberAcc = 0;
    this.time = fxRng.float(0, 10);
    this.active = true;
    this.sprite.visible = true;
    this.shadow.visible = this.look.shadow >= 0;
    this.sprite.material.color.setRGB(1, 1, 1);
    if (this.sprite.emitMap) this.sprite.material.emissive.setRGB(1, 1, 1);
    else this.sprite.material.emissive.setHex(ENEMY_FX.selfLight);
    this.sprite.material.opacity = 1;
    if (this.champion) this.sprite.material.color.fromArray(CHAMPION.tint);
    this.anim.play('idle', true);
    this.onSpawn(opts);
    if (!opts.quiet) this.game.effects.spawnPuff(x, y);
  }

  setState(s) {
    this.state = s;
    this.stateTime = 0;
  }

  /** May this enemy start an attack yet? (short grace period after appearing) */
  get canAct() {
    return this.grace <= 0;
  }

  /** Half hearts dealt when Wren touches it (0 = harmless right now). */
  get touchDamage() {
    return this.def.contactDamage;
  }

  /** Can stones hit it right now? (burrowed worms, spiders on the ceiling, still spectres can't be hit) */
  get hittable() {
    return true;
  }

  get alive() {
    return this.active && !this.dying;
  }

  // --- helpers for subclasses ---------------------------------------------------------------

  /** Vector and distance to Wren, written into `out` ({ x, y, dist }). */
  toPlayer(out) {
    const p = this.game.player;
    out.x = p.x - this.x;
    out.y = p.y - this.y;
    out.dist = Math.hypot(out.x, out.y) || 0.0001;
    return out;
  }

  /** Walk toward Wren around obstacles (uses the room's flow field). */
  chase(speed) {
    this.room.nav.dirTo(this.x, this.y, _dir);
    this.vx = _dir.x * speed;
    this.vy = _dir.y * speed;
  }

  /** Walk straight toward a point. Returns the remaining distance. */
  walkTo(tx, ty, speed) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) {
      this.vx = this.vy = 0;
      return 0;
    }
    this.vx = (dx / d) * speed;
    this.vy = (dy / d) * speed;
    return d;
  }

  stop() {
    this.vx = 0;
    this.vy = 0;
  }

  faceX(dx) {
    if (Math.abs(dx) > 0.5) this.facing = dx > 0 ? 1 : -1;
  }

  canSeePlayer() {
    const p = this.game.player;
    return this.room.nav.lineOfSight(this.x, this.y + 4, p.x, p.y + 4);
  }

  // --- lifecycle -------------------------------------------------------------------------------

  update(dt) {
    this.time += dt;
    if (this.dying) {
      this.deathTime += dt;
      this.anim.update(dt);
      this.whileDying(dt);
      if (this.deathTime > this.corpseTime + ENEMY_FX.deathFadeTime) this.release();
      return;
    }
    const tdt = dt * this.tempo;
    this.stateTime += tdt;
    if (this.grace > 0) this.grace -= dt;
    if (this.buffT > 0) this.buffT -= dt;
    this._updateStatus(dt);
    if (this.dying) return; // a burn or poison tick may have just killed it
    if (this.chillTime > 0) this.chillTime -= dt;
    if (this.gildTime > 0) {
      this.gildTime -= dt;
      this.stop();
    } else if (this.stunTime > 0) {
      this.stunTime -= dt;
      this.stop();
    } else if (this.fearTime > 0 && !this.isBoss) {
      // terrified: flee from Wren
      this.fearTime -= dt;
      const p = this.game.player;
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      this.vx = (dx / d) * this.def.speed * 0.9 + 1;
      this.vy = (dy / d) * this.def.speed * 0.9;
      if (this.anim.anims && this.anim.anims.walk) this.anim.play('walk');
    } else if (this.dazeTime > 0 && !this.isBoss) {
      // dazed by strange smoke: wander aimlessly
      this.dazeTime -= dt;
      if (fxRng.chance(0.04)) this.dazeDir = fxRng.float(0, Math.PI * 2);
      this.vx = Math.cos(this.dazeDir || 0) * this.def.speed * 0.4;
      this.vy = Math.sin(this.dazeDir || 0) * this.def.speed * 0.4;
    } else {
      this.think(tdt);
    }
    this.move(dt);
    if (this.twoFacings) this.anim.row = this.facing > 0 ? 0 : 1;
    this.anim.update(dt);
    this.sprite.update(dt);
  }

  get corpseTime() {
    return ENEMY_FX.deathFadeDelay;
  }

  move(dt) {
    const fr = Math.exp(-ENEMY_FX.knockbackFriction * dt);
    this.kbx *= fr;
    this.kby *= fr;
    const slow = (this.poisonTime > 0 ? MODS.poison.slow : 1) * (this.buffT > 0 ? ENEMY_FX.rallySpeed : 1) * (this.chillTime > 0 ? MODS.frost.slow : 1);
    this.x += (this.vx * slow + this.kbx) * dt;
    this.y += (this.vy * slow + this.kby) * dt;
    this.collide();
  }

  collide() {
    const r = this.def.radius;
    const solids = this.room.solids;
    const flying = this.def.flying || this.h > 6;
    for (let i = 0; i < solids.length; i++) {
      const s = solids[i];
      if (s.owner === this) continue;
      if (flying && s.pit) continue; // flying (or jumping) creatures cross pits
      pushCircleOutOfBox(this, r, s);
    }
    clampCircleToRect(this, r, this.room.bounds);
  }

  /**
   * Something hits this enemy. Returns true if it took the hit.
   * quiet: a damage-over-time tick (no knockback, no hit sound).
   */
  hit(damage, dirX, dirY, quiet = false) {
    if (!this.alive) return false;
    if (this.buffT > 0) damage *= ENEMY_FX.rallyArmour; // rallied by a banner: tougher
    this.hp -= damage;
    if (!quiet) {
      this.sprite.flash(0.07);
      this.squashT = COMBAT.squash;
      const k = ENEMY_FX.knockback / this.def.mass;
      this.kbx += dirX * k;
      this.kby += dirY * k;
      this.game.effects.enemyHit(this.x, this.y, 10, dirX, dirY, this.look.blood);
      this.game.audio.play('enemyHit', 0.8);
      this.onHurt();
    }
    if (this.hp <= 0) this.die();
    return true;
  }

  /** Burning or poisoned for `time` seconds, taking `dps` damage per second (stronger effect wins). */
  applyStatus(kind, time, dps) {
    if (kind === 'burn') {
      this.burnTime = Math.max(this.burnTime, time);
      this.burnDps = Math.max(this.burnDps, dps);
    } else if (kind === 'poison') {
      this.poisonTime = Math.max(this.poisonTime, time);
      this.poisonDps = Math.max(this.poisonDps, dps);
    }
  }

  /** Stunned: does nothing for `time` seconds. */
  stun(time) {
    this.stunTime = Math.max(this.stunTime, time);
  }

  chill(time) {
    this.chillTime = Math.max(this.chillTime, time);
  }

  /** Turned to gold for a moment (bosses only shimmer: they shrug it off). */
  gild(time) {
    if (this.isBoss) return;
    this.gildTime = Math.max(this.gildTime, time);
    this.game.audio.play('coin', 0.5);
  }

  scare(time) {
    if (this.isBoss) return;
    this.fearTime = Math.max(this.fearTime, time);
  }

  daze(time) {
    if (this.isBoss) return;
    this.dazeTime = Math.max(this.dazeTime, time);
  }

  _updateStatus(dt) {
    if (this.burnTime > 0) this.burnTime -= dt;
    if (this.poisonTime > 0) this.poisonTime -= dt;
    if (this.burnTime <= 0 && this.poisonTime <= 0) return;
    this.statusTick -= dt;
    if (this.statusTick <= 0) {
      this.statusTick = 0.5;
      const dmg = (this.burnTime > 0 ? this.burnDps : 0) + (this.poisonTime > 0 ? this.poisonDps : 0);
      this.hit(dmg * 0.5, 0, 0, true);
    }
    if (this.burnTime > 0) {
      this.emberAcc += dt * 14;
      const fx = this.game.effects;
      while (this.emberAcc >= 1) {
        this.emberAcc -= 1;
        fx.glow.emit(fx.presets.ember, this.x + fxRng.float(-6, 6), this.y, fxRng.float(4, 16), fxRng.float(-6, 6), 0, fxRng.float(20, 40));
      }
    }
  }

  /** Little dizzy stars over a stunned enemy (drawn by the EnemyManager). */
  drawStatus(o, time, STAR) {
    if (this.stunTime <= 0 || this.dying) return;
    const top = this.y + this.sprite.def.frameH - this.look.anchorY + 2;
    for (let i = 0; i < 3; i++) {
      const a = time * 6 + (i * Math.PI * 2) / 3;
      o.dot(this.x + Math.cos(a) * 7, top + Math.sin(a) * 2, 3, STAR, 1);
    }
  }

  die() {
    this.dying = true;
    this.deathTime = 0;
    this.stop();
    this.kbx *= 0.3;
    this.kby *= 0.3;
    this.anim.play('death', true);
    this.shadow.visible = false;
    this.game.feel.hitStop(this.def.mass >= 2 ? ENEMY_FX.bigKillHitStop : ENEMY_FX.killHitStop);
    this.onDeath();
    this.game.onEnemyKilled(this);
    if (this.chillTime > 0) {
      // frozen solid, it shatters: shards of ice fly out and hurt its friends
      const shot = this.game.player.shot;
      const n = MODS.frost.shards;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        this.game.projectiles.spawn(this.x, this.y, 10, Math.cos(a) * 220, Math.sin(a) * 220, shot, 1, 0.5);
      }
      this.game.effects.burst(this.game.effects.presets.holy, this.x, this.y, 10, 14, 90, 60);
      this.game.audio.play('clang', 0.4);
    }
    if (this.gildTime > 0) this.game.pickups.spawn(this.room, 'penny', this.x, this.y);
    // champions always drop something good
    if (this.champion) this.game.dropFrom(CHAMPION_DROPS, this.x, this.y, 2);
  }

  release() {
    this.active = false;
    this._hide();
    this.onRelease();
  }

  sync() {
    if (!this.active) return;
    if (this.dying && this.corpseTime > 0 && this.deathTime > this.corpseTime) {
      // corpse blinks out
      this.sprite.visible = Math.floor(this.deathTime * 20) % 2 === 0;
    }
    // status tints: burning glows orange, poison turns green (on top of a champion's tint)
    const c = this.sprite.material.color;
    if (this.champion && !this.hideTint) c.fromArray(CHAMPION.tint);
    else c.setRGB(1, 1, 1);
    if (this.burnTime > 0) c.setRGB(c.r * 1.5, c.g * 0.85, c.b * 0.55);
    if (this.poisonTime > 0) c.setRGB(c.r * 0.65, c.g * 1.35, c.b * 0.55);
    if (this.chillTime > 0) c.setRGB(c.r * 0.7, c.g * 1.0, c.b * 1.6);
    if (this.gildTime > 0) c.setRGB(1.9, 1.5, 0.5);
    if (this.fearTime > 0) c.setRGB(c.r * 0.8, c.g * 0.8, c.b * 1.1);
    this.sprite.place(this.x, this.y, this.h);
    // a struck enemy squashes and springs back
    if (this.squashT > 0) {
      this.squashT -= 1 / 60;
      const k = Math.max(0, this.squashT / COMBAT.squash);
      this.sprite.mesh.scale.set(1 + 0.22 * k, 1 - 0.18 * k, 1);
    } else if (this.sprite.mesh.scale.x !== 1) this.sprite.mesh.scale.set(1, 1, 1);
    this.shadow.place(this.x, this.y - this.shadowOffset, 0, LAYER.shadow);
  }

  // --- overridables ----------------------------------------------------------------------------
  onSpawn() {}
  think() {}
  onHurt() {}
  onDeath() {}
  onRelease() {}
  whileDying() {}
  drawOverlay() {}
}
