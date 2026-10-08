// An encounter (data/encounters.js) standing in the middle of its room: walk up to it to make
// your choice. The choice is made once; afterwards it's only scenery.

import { ENCOUNTERS } from '../data/encounters.js';

export class Encounter {
  constructor(room, x, ground) {
    this.room = room;
    this.game = room.game;
    const d = room.data;
    if (!d.encounter) d.encounter = this.game.drawEncounter(room.rng);
    this.id = d.encounter;
    this.def = ENCOUNTERS[this.id];
    this.x = x;
    this.y = ground;
    const [key, col, row] = this.def.look;
    this.sprite = room._staticSprite(key, x, ground, 2, 3);
    this.sprite.setFrame(col, row);
    room.solids.push({ x0: x - 10, x1: x + 10, y0: ground - 2, y1: ground + 10, owner: null });
    this.armed = true;
  }

  update() {
    const g = this.game;
    const pl = g.player;
    const d = Math.hypot(pl.x - this.x, pl.y - this.y);
    const done = this.room.data.encounterDone;
    if (d < 52) g.hud.setHover({ name: this.def.name, flavour: done ? 'There is nothing more for you here.' : 'Walk up to it.' }, 0);
    if (d > 46) this.armed = true;
    if (this.armed && d < 26 && !done && g.state === 'play' && !g.paused && !pl.dead) {
      this.armed = false;
      g.paused = true;
      g.menus.reset(null);
      g.menus.open('encounter', { enc: this });
      g.touch.setPaused(true);
      g.hud.markDirty();
      g.audio.play('menuChoose');
    }
  }

  /** The player chose option i: do it, and remember. Returns what happened. */
  choose(i) {
    const opt = this.def.options[i];
    this.room.data.encounterDone = true;
    return opt.run(this.game, this.room, this.x, this.y);
  }
}
