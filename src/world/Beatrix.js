// Beatrix the Wandering (the Stalked mode). She can't be killed. A while after you reach a floor
// she starts walking toward you, room by room. You don't see her coming - you hear it: a heartbeat
// that quickens, whispers, the light going thin and the edges of the world going dark. Then she
// comes through the door you came through, and drifts at you through rocks and walls.
//
// Her touch costs two hearts, and then she lets go for a while. A dodge passes through her
// unharmed. A bomb beside her drives her off. Leave the room and she follows, a few seconds behind.
// She will not enter a boss's room while the boss lives (she waits outside, close, listening).

import { Sprite, LAYER } from '../render/Sprite.js';

export const BEATRIX = {
  firstDelay: 22, // seconds on a floor before she starts walking (less deeper down)
  minDelay: 11,
  stepTime: 8, // seconds to cross one room while she wanders (less deeper down)
  minStep: 4.5,
  arrive: 1.8, // the creak at the door before she steps in
  follow: 2.8, // how far behind you she is when you run into the next room
  speed: 34, // drifting speed in a room (+3.5 per floor)
  maxSpeed: 64,
  blinkEvery: 7, // if you've kept your distance this long, she is suddenly behind you
  blinkFar: 150,
  damage: 4, // half hearts: two hearts
  rest: 14, // after her touch, how long she lets you be
  banish: 22, // after a bomb
  radius: 12,
};

const NAME = 'Beatrix the Wandering';

export class Beatrix {
  constructor(game) {
    this.game = game;
    const n = game.floorNumber;
    this.state = 'dormant';
    this.t = Math.max(BEATRIX.minDelay, BEATRIX.firstDelay - n * 1.4);
    this.roomId = this._farthestRoom();
    this.speed = Math.min(BEATRIX.maxSpeed, BEATRIX.speed + n * 3.5);
    this.stepTime = Math.max(BEATRIX.minStep, BEATRIX.stepTime - n * 0.45);
    this.x = 0;
    this.y = 0;
    this.alpha = 0; // how solid she is (she flickers in and out)
    this.dread = 0;
    this.beatT = 0;
    this.blinkT = BEATRIX.blinkEvery;
    this.anim = 0;
    this.sprite = new Sprite(game.renderer.scene, 'beatrix', { lit: false, glow: 0.85, anchorY: 2 });
    this.sprite.visible = false;
    this.shadow = new Sprite(game.renderer.scene, 'shadows', { shadow: true });
    this.shadow.setFrame(1, 0);
    this.shadow.visible = false;
  }

  dispose() {
    const scene = this.game.renderer.scene;
    this.sprite.dispose(scene);
    this.shadow.dispose(scene);
    this.game.dread = 0;
  }

  // --- where she is on the floor ---------------------------------------------------------------

  _farthestRoom() {
    const f = this.game.floor;
    const here = this.game.room ? this.game.room.data.id : f.startId;
    const d = this._distances(here);
    let best = here;
    for (const r of f.rooms) if (r.type !== 'boss' && (d.get(r.id) ?? -1) > (d.get(best) ?? -1)) best = r.id;
    return best;
  }

  /** Rooms apart, from one room to all others (she knows every hidden way). */
  _distances(from) {
    const f = this.game.floor;
    const dist = new Map([[from, 0]]);
    const q = [from];
    while (q.length) {
      const id = q.shift();
      for (const c of f.rooms[id].connections) {
        const o = c.a === id ? c.b : c.a;
        if (dist.has(o)) continue;
        dist.set(o, dist.get(id) + 1);
        q.push(o);
      }
    }
    return dist;
  }

  _bossAlive(roomId) {
    const r = this.game.floor.rooms[roomId];
    return r.type === 'boss' && !r.cleared;
  }

  /** One room closer to you. */
  _step() {
    const here = this.game.room.data.id;
    const d = this._distances(here);
    const mine = d.get(this.roomId);
    if (mine === undefined) return;
    for (const c of this.game.floor.rooms[this.roomId].connections) {
      const o = c.a === this.roomId ? c.b : c.a;
      if (d.get(o) === mine - 1) {
        if (o === here && this._bossAlive(here)) return; // she waits outside
        this.roomId = o;
        return;
      }
    }
  }

  // --- the game tells her things -----------------------------------------------------------

  /** You walked into another room. */
  onRoomChange(entryX, entryY) {
    if (this.state === 'hunting' || this.state === 'arriving') {
      // she follows you through the same door, a few seconds behind
      this._vanish();
      this.state = 'arriving';
      this.t = BEATRIX.follow;
      this.roomId = this.game.room.data.id;
      this.entryX = entryX;
      this.entryY = entryY;
      if (this._bossAlive(this.roomId)) {
        this.state = 'roaming';
        this.t = this.stepTime;
      }
    }
  }

  /** A bomb went off. */
  explosion(x, y, r) {
    if (this.state !== 'hunting' || Math.hypot(this.x - x, this.y - y) > r + 30) return;
    this._withdraw(BEATRIX.banish);
    this.game.hud.banner({ name: 'Beatrix Recoils', flavour: 'The blast drives her back into the dark. Not for long.' });
  }

  // --- each frame ---------------------------------------------------------------------------

  update(dt) {
    const g = this.game;
    const pl = g.player;
    const here = g.room.data.id;
    this.anim += dt;
    switch (this.state) {
      case 'dormant':
        this.t -= dt;
        if (this.t <= 0) {
          this.state = 'roaming';
          this.t = this.stepTime;
          if (!g.beatrixAnnounced) {
            g.beatrixAnnounced = true;
            g.hud.banner({ name: 'Beatrix is Wandering', flavour: 'She has your scent. Do not let her touch you.' });
          }
          g.audio.play('beatrixHum', 0.8);
        }
        break;
      case 'roaming':
        this.t -= dt;
        if (this.t <= 0) {
          this.t = this.stepTime;
          this._step();
          if (this.roomId === here) {
            // she's at the door
            this.state = 'arriving';
            this.t = BEATRIX.arrive;
            const door = this._doorToward();
            this.entryX = door.x;
            this.entryY = door.y;
            g.audio.play('creak');
          }
        }
        break;
      case 'arriving':
        this.t -= dt;
        if (this.t <= 0) {
          this.state = 'hunting';
          this.x = this.entryX;
          this.y = this.entryY;
          this.alpha = 0;
          this.blinkT = BEATRIX.blinkEvery;
          g.audio.play('beatrixHum');
        }
        break;
      case 'hunting': {
        this.alpha = Math.min(1, this.alpha + dt * 1.6);
        const dx = pl.x - this.x;
        const dy = pl.y - this.y;
        const d = Math.hypot(dx, dy) || 1;
        // she drifts straight at you, through everything; a little faster when you look away
        const v = this.speed * (d > 160 ? 1.25 : 1);
        this.x += (dx / d) * v * dt;
        this.y += (dy / d) * v * dt;
        // keep your distance too long, and she's suddenly behind you
        this.blinkT -= dt;
        if (this.blinkT <= 0) {
          this.blinkT = BEATRIX.blinkEvery;
          if (d > BEATRIX.blinkFar) this._blinkBehind();
        }
        // whispers
        if (Math.random() < dt * 0.45) g.audio.play('whisper', 0.5 + 0.5 * this.dread);
        // her touch
        if (d < BEATRIX.radius + 6 && this.alpha > 0.8 && !pl.dead) {
          if (pl.hurt(BEATRIX.damage, this.x, this.y, NAME)) {
            g.audio.play('sting');
            g.feel.shake(0.4);
            this._withdraw(BEATRIX.rest);
          }
        }
        break;
      }
      case 'gone':
        this.t -= dt;
        if (this.t <= 0) {
          this.state = 'roaming';
          this.roomId = this._farthestRoom();
          this.t = this.stepTime;
        }
        break;
    }
    this._updateDread(dt);
  }

  /** Where she comes in: the doorway on the side she's walking from (or the far side of the room). */
  _doorToward() {
    const g = this.game;
    const room = g.room;
    const b = room.bounds;
    const pl = g.player;
    // the far side from you
    const left = pl.x > (b.x0 + b.x1) / 2;
    return { x: left ? b.x0 + 20 : b.x1 - 20, y: (b.y0 + b.y1) / 2 };
  }

  _blinkBehind() {
    const g = this.game;
    const pl = g.player;
    const f = { right: [1, 0], left: [-1, 0], up: [0, 1], down: [0, -1] }[pl.facing] || [0, -1];
    const b = g.room.bounds;
    this.x = Math.max(b.x0 + 16, Math.min(b.x1 - 16, pl.x - f[0] * 70));
    this.y = Math.max(b.y0 + 16, Math.min(b.y1 - 16, pl.y - f[1] * 70));
    this.alpha = 0.2;
    g.audio.play('sting', 0.8);
    g.hud.dreadFlash = 0.5;
  }

  _vanish() {
    this.alpha = 0;
    this.sprite.visible = false;
    this.shadow.visible = false;
  }

  _withdraw(seconds) {
    this._vanish();
    this.state = 'gone';
    this.t = seconds;
  }

  /** How afraid you should be, 0..1: heartbeat, dim light, a dark edge to the world. */
  _updateDread(dt) {
    const g = this.game;
    let target = 0;
    if (this.state === 'hunting') target = Math.max(0.4, 1 - Math.hypot(g.player.x - this.x, g.player.y - this.y) / 320);
    else if (this.state === 'arriving') target = 0.75;
    else if (this.state === 'roaming') {
      const d = this._distances(g.room.data.id).get(this.roomId);
      target = d === 1 ? 0.4 : d === 2 ? 0.18 : 0;
    }
    this.dread += (target - this.dread) * Math.min(1, dt * 1.5);
    g.dread = this.dread;
    // the heartbeat quickens as she nears
    if (this.dread > 0.25) {
      this.beatT -= dt;
      if (this.beatT <= 0) {
        this.beatT = 1.35 - this.dread * 0.85;
        g.audio.play('heartbeat', 0.4 + this.dread * 0.6);
      }
    }
    // the light thins
    const amb = g.chapterInfo.ambient;
    const level = amb.level * (1 - 0.4 * this.dread);
    if (Math.abs(level - (this._lastLevel ?? -1)) > 0.004) {
      this._lastLevel = level;
      g.lighting.setAmbient({ color: amb.color, level });
    }
  }

  sync() {
    const show = this.state === 'hunting';
    // she flickers: solid once she's fully here, stuttering in and out while she arrives
    const vis = show && (this.alpha >= 1 || Math.random() < this.alpha * 0.9);
    this.sprite.visible = vis;
    this.shadow.visible = show && this.alpha > 0.5;
    if (!show) return;
    const pl = this.game.player;
    const reaching = Math.hypot(pl.x - this.x, pl.y - this.y) < 40;
    const col = this.alpha < 0.5 ? 7 + (Math.floor(this.anim * 8) % 2) : reaching ? 6 : 2 + (Math.floor(this.anim * 5) % 4);
    this.sprite.setFrame(col, 0);
    const hover = 3 + Math.sin(this.anim * 2.2) * 2; // she floats
    this.sprite.place(this.x, this.y, hover);
    this.sprite.mesh.scale.x = pl.x < this.x ? -1 : 1;
    this.shadow.place(this.x, this.y - 6, 0, LAYER.shadow);
  }
}
