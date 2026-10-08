import { PROPS, FEEL } from '../data/config.js';
import { Sprite, LAYER } from '../render/Sprite.js';
import { Save } from '../core/Save.js';
import { BARREL_DROPS } from '../data/items.js';

// Something you can smash with stones (barrels).
// Flashes and wobbles when hit, bursts (with hit-stop and screen shake) when its health runs out,
// and leaves walk-through debris behind. Broken props are remembered by the room, so they stay
// broken when you come back.
//
// `kind` is a key of PROPS in src/data/config.js ('barrel').

export class Breakable {
  constructor(game, room, kind, x, ground, tileKey, alreadyBroken = false) {
    this.game = game;
    this.room = room;
    this.cfg = PROPS[kind];
    this.kind = kind;
    this.x = x;
    this.ground = ground;
    this.tileKey = tileKey;
    this.hp = this.cfg.hp;
    this.broken = false;
    this.wobble = 0;
    this.time = 0;
    const scene = game.renderer.scene;
    this.shadow = new Sprite(scene, 'shadows', { shadow: true });
    this.shadow.setFrame(2, 0);
    this.shadow.place(x, ground - 4, 0, LAYER.shadow);
    if (alreadyBroken) {
      this._becomeDebris();
      return;
    }
    this.sprite = new Sprite(scene, this.cfg.sprite, { anchorY: 2 });
    const r = this.cfg.radius;
    this.solid = { x0: x - r, x1: x + r, y0: ground - 2, y1: ground + 12, owner: this };
    room.solids.push(this.solid);
  }

  get alive() {
    return !this.broken;
  }

  /** Called by projectiles. */
  hit(damage) {
    if (this.broken) return;
    this.hp -= damage;
    this.sprite.flash(FEEL.hitFlashTime);
    this.wobble = this.cfg.wobbleTime;
    this.game.effects.barrelHit(this.x, this.ground + 4, 14);
    this.game.audio.play('woodHit');
    this.game.feel.shake(FEEL.barrelHitShake);
    if (this.hp <= 0) this.smash();
  }

  smash() {
    this.room.removeSolid(this.solid);
    this.sprite.dispose(this.game.renderer.scene);
    this._becomeDebris();
    this.game.effects.barrelBreak(this.x, this.ground + 4);
    this.game.audio.play('woodBreak');
    Save.data.stats.barrelsBroken++;
    this.game.dropFrom(BARREL_DROPS, this.x, this.ground + 6, 1);
    this.game.feel.hitStop(FEEL.barrelBreakHitStop);
    this.game.feel.shake(FEEL.barrelBreakShake);
    this.room.data.destroyed.add(this.tileKey);
    this.room.onPropBroken(this);
  }

  _becomeDebris() {
    this.broken = true;
    this.shadow.visible = false;
    // debris lies flat on the floor, so it draws under everything
    this.sprite = new Sprite(this.game.renderer.scene, this.cfg.broken, { anchorY: 8 });
    this.sprite.place(this.x, this.ground, 0, LAYER.floorDecal);
  }

  update(dt) {
    this.time += dt;
    this.sprite.update(dt);
    if (this.wobble > 0) this.wobble -= dt;
  }

  sync() {
    if (this.broken) return;
    let ox = 0;
    if (this.wobble > 0) {
      const k = this.wobble / this.cfg.wobbleTime;
      ox = Math.round(Math.sin(this.time * 70) * this.cfg.wobblePixels * k);
    }
    this.sprite.place(this.x + ox, this.ground);
  }

  dispose() {
    const scene = this.game.renderer.scene;
    this.sprite.dispose(scene);
    this.shadow.dispose(scene);
  }
}
