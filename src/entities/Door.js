import { Sprite, LAYER } from '../render/Sprite.js';
import { DOOR_KINDS, DOOR_STATES } from '../render/art/doorsArt.js';
import { DOOR } from '../data/config.js';

// One door of a room. Its look comes from the shared Connection (kind, locked, hidden, illusory,
// sealed),
// plus whether its room is currently locked in combat.
//
// Placement is worked out by Room.js; this class just knows where it is and how to look.

const SHEET = { up: 'door_top', down: 'door_bottom', left: 'door_left', right: 'door_right' }; // prefixed with the chapter

export class Door {
  /**
   * @param conn    the Connection from the floor generator (shared with the room on the other side)
   * @param side    'up' | 'down' | 'left' | 'right' as seen from THIS room
   * @param pos     { x, y }        world centre of the door sprite
   * @param edge    world x or y of the floor edge the door sits on
   * @param center  world x (up/down doors) or y (left/right doors) of the doorway's middle
   */
  constructor(game, room, conn, side, pos, edge, center) {
    this.game = game;
    this.room = room;
    this.conn = conn;
    this.side = side;
    this.edge = edge;
    this.center = center;
    this.targetId = conn.a === room.data.id ? conn.b : conn.a;
    this.kindIndex = DOOR_KINDS.indexOf(conn.kind);
    this.sprite = new Sprite(game.renderer.scene, `${room.ts}_${SHEET[side]}`, { anchorY: 0 });
    // place by centre: Sprite.place() takes the bottom edge
    const h = this.sprite.def.frameH;
    this.sprite.place(pos.x, pos.y - h / 2, 0, LAYER.wall + 0.1);
    this.lastFrame = -1;
    this.sync();
  }

  get state() {
    if (this.conn.hidden) return 'hidden';
    if (this.conn.locked) return 'locked';
    if (this.room.locked) return 'barred';
    return 'open';
  }

  get isOpen() {
    return this.state === 'open';
  }

  /** Is the player standing in this doorway, pressed against the wall edge? */
  playerTouching(p, r) {
    const w = DOOR.triggerHalfWidth;
    switch (this.side) {
      case 'up':
        return Math.abs(p.x - this.center) < w && p.y >= this.edge - r - 1;
      case 'down':
        return Math.abs(p.x - this.center) < w && p.y <= this.edge + r + 1;
      case 'left':
        return Math.abs(p.y - this.center) < w && p.x <= this.edge + r + 1;
      default:
        return Math.abs(p.y - this.center) < w && p.x >= this.edge - r - 1;
    }
  }

  /** Where Wren appears when he arrives in this room through this door. */
  entryPoint(inset) {
    switch (this.side) {
      case 'up':
        return { x: this.center, y: this.edge - inset };
      case 'down':
        return { x: this.center, y: this.edge + inset };
      case 'left':
        return { x: this.edge + inset, y: this.center };
      default:
        return { x: this.edge - inset, y: this.center };
    }
  }

  /** Point on the floor just in front of the door (for dust effects). */
  frontPoint() {
    return this.entryPoint(6);
  }

  sync() {
    let s = this.state;
    if (s === 'hidden' && this.conn.illusory) {
      // an illusory wall: for a blink, every few seconds, the doorway shows through
      const t = (this.game.time + this.conn.id * 1.7) % 4.5;
      this.sprite.visible = t < 0.06 || (t > 0.12 && t < 0.15);
      s = 'open';
    } else {
      this.sprite.visible = s !== 'hidden';
      if (s === 'hidden') return;
    }
    const frame = this.kindIndex * DOOR_STATES.length + DOOR_STATES.indexOf(s === 'barred' ? 'barred' : s);
    if (frame !== this.lastFrame) {
      this.sprite.setFrame(frame, 0);
      this.lastFrame = frame;
    }
  }

  dispose() {
    this.sprite.dispose(this.game.renderer.scene);
  }
}
