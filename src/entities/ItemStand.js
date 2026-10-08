import * as THREE from 'three';
import { Sprite, depthFor, DEPTH_BIAS } from '../render/Sprite.js';
import { RELICS, RELIC_IDS, PICKUPS } from '../data/items.js';
import { PLAYER } from '../data/config.js';
import { glyphPixels } from '../ui/PixelFont.js';
import { takeCurio, curioFrame, curioInfo } from '../items/Curios.js';

// Something you can take or buy: a relic floating over an Armoury / boss / secret pedestal,
// or goods on a merchant's stand with a price tag.
//
// `slot` is a plain object stored in the room's data, so what happened to it (taken, sold, swapped
// for your old active relic) is remembered when you come back:
//   { kind: 'relic' | 'pickup' | 'curio', id, item (curios), price (pennies), hearts (a dark deal:
//     paid in heart containers, in half hearts), gone }

const PRICE_COLOR = new THREE.Color(1.3, 1.3, 1.45);
const PRICE_DIM = new THREE.Color(0.7, 0.3, 0.3);
const HEART_COLOR = new THREE.Color(1.6, 0.25, 0.3);

const SHEET = { relic: 'relics', pickup: 'pickups', curio: 'curios' };
const BLIND_INFO = { name: '???', flavour: 'The Omen of the Blind hides what this is.' };
// a 5 x 4 pixel heart
const HEART_PX = [[0, 0], [1, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [2, 3]];

export class ItemStand {
  constructor(game, room, x, y, slot, standKey) {
    this.game = game;
    this.room = room;
    this.x = x;
    this.y = y;
    this.slot = slot;
    this.time = Math.random() * 10;
    this.touching = false;
    const scene = game.renderer.scene;
    this.sprites = [];
    if (standKey) {
      const s = new Sprite(scene, standKey, { anchorY: 2 });
      s.place(x, y);
      this.sprites.push(s);
      room.solids.push({ x0: x - 9, x1: x + 9, y0: y - 2, y1: y + 8, owner: null });
    }
    this.item = new Sprite(scene, SHEET[slot.kind], { anchorY: 0, emissive: 0x8a8a8a });
    this.sprites.push(this.item);
    this._showItem();
  }

  _showItem() {
    const s = this.slot;
    this.item.visible = !s.gone;
    if (s.gone) return;
    if (s.kind === 'relic' && this.blind) {
      // the Omen of the Blind: every relic looks the same
      if (this.item.sheet.key !== 'curios') this._swapToCurios();
      this.item.setFrame(34, 0);
    } else if (s.kind === 'relic') this.item.setFrame(RELIC_IDS.indexOf(s.id), 0);
    else if (s.kind === 'curio') this.item.setFrame(curioFrame(this.game, s.item), 0);
    else this.item.setFrame(PICKUPS[s.id].frame, 0);
  }

  get blind() {
    return this.game.omen === 'blind' && this.slot.kind === 'relic';
  }

  _swapToCurios() {
    const scene = this.game.renderer.scene;
    this.item.dispose(scene);
    this.sprites.splice(this.sprites.indexOf(this.item), 1);
    this.item = new Sprite(scene, 'curios', { anchorY: 0, emissive: 0x8a8a8a });
    this.sprites.push(this.item);
  }

  /** What this costs Wren right now. */
  get price() {
    return this.slot.price ? this.game.player.priceOf(this.slot.price) : 0;
  }

  /** The slot changed under us (the Gilded Die). */
  refresh() {
    this._showItem();
  }

  get info() {
    const s = this.slot;
    if (s.kind === 'relic') return this.blind ? BLIND_INFO : RELICS[s.id];
    if (s.kind === 'curio') return curioInfo(this.game, s.item);
    return null;
  }

  update(dt) {
    this.time += dt;
    if (this.slot.gone) return;
    const pl = this.game.player;
    const d = Math.hypot(pl.x - this.x, pl.y - (this.y + 4));
    // stand near a relic to read what it is
    if (d < 44 && this.slot.kind !== 'pickup') this.game.hud.setHover(this.info, this.price, this.slot.hearts);
    const touching = d < PLAYER.radius + 12 && !pl.dead;
    if (touching && !this.touching) this._interact();
    this.touching = touching;
  }

  _interact() {
    const s = this.slot;
    const g = this.game;
    const pl = g.player;
    const price = this.price;
    if (price > 0 && pl.pennies < price) {
      g.audio.play('deny');
      return;
    }
    // a dark deal costs heart containers - and Wren must keep at least one
    if (s.hearts && pl.baseMaxHalfHearts - s.hearts < 2) {
      g.audio.play('deny');
      return;
    }
    if (s.hearts) {
      pl.baseMaxHalfHearts -= s.hearts;
      pl.recompute();
      g.darkDeal = true;
      g.audio.play('roar', 0.5);
      g.effects.burst(g.effects.presets.blood, this.x, this.y + 20, 20, 16, 50, 70);
    }
    if (s.kind === 'pickup' && PICKUPS[s.id].needsMissingHealth && pl.halfHearts >= pl.maxHalfHearts) {
      g.audio.play('deny');
      return;
    }
    if (price > 0) {
      pl.pennies -= price;
      g.audio.play('buy');
    }
    if (s.kind === 'curio') {
      const dropped = takeCurio(g, s.item);
      g.effects.relicBurst(this.x, this.y + 18);
      if (dropped) {
        s.item = dropped; // what Wren was carrying is left on the stand, free
        s.price = 0;
        s.hearts = 0;
      } else s.gone = true;
    } else if (s.kind === 'relic') {
      const swapped = pl.addRelic(s.id);
      g.hud.banner(RELICS[s.id]); // (taking it reveals it, even under the Omen of the Blind)
      g.audio.play('relic');
      g.effects.relicBurst(this.x, this.y + 18);
      if (swapped) {
        // your old active relic is left on the pedestal, free to take back
        s.id = swapped;
        s.price = 0;
        s.hearts = 0;
      } else {
        s.gone = true;
      }
    } else {
      const give = PICKUPS[s.id].give;
      for (const k in give) {
        if (k === 'halfHearts') pl.heal(give[k]);
        else pl[k] += give[k];
      }
      g.audio.play(PICKUPS[s.id].sound);
      s.gone = true;
    }
    g.hud.markDirty();
    this._showItem();
  }

  sync() {
    if (this.slot.gone) return;
    const bob = Math.round(Math.sin(this.time * 2.5) * 2);
    // floats above the stand, drawn just in front of it
    this.item.place(this.x, this.y, 22 + bob, depthFor(this.y) + DEPTH_BIAS);
  }

  /** Price tag under shop goods (pixel digits on the glowing overlay). */
  drawOverlay(o) {
    if (this.slot.gone) return;
    if (this.slot.hearts) {
      // the price of a dark deal: a little heart per heart container
      const n = this.slot.hearts / 2;
      const x0 = Math.round(this.x - (n * 7 - 1) / 2);
      for (let i = 0; i < n; i++) {
        for (const [dx, dy] of HEART_PX) o.dot(x0 + i * 7 + dx, this.y - 6 - dy, 3, HEART_COLOR, 1);
      }
      return;
    }
    if (!this.slot.price) return;
    const text = String(this.price);
    const pl = this.game.player;
    const c = pl.pennies >= this.price ? PRICE_COLOR : PRICE_DIM;
    const w = text.length * 6 - 1 + 4;
    const x0 = Math.round(this.x - w / 2);
    const y0 = Math.round(this.y - 10);
    glyphPixels(text, (px, py) => o.dot(x0 + px, y0 - py, 3, c, 1));
    // a tiny coin after the number
    const cx = x0 + text.length * 6 + 1;
    for (const [dx, dy] of [[0, -2], [1, -1], [1, -3], [2, -2], [1, -2]]) o.dot(cx + dx, y0 + dy, 3, c, 0.9);
  }

  dispose() {
    const scene = this.game.renderer.scene;
    for (const s of this.sprites) s.dispose(scene);
  }
}
