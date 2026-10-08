import { KEYS, PAD } from '../data/controls.js';

// Reads keyboard + gamepad every frame and exposes simple game actions:
//   input.moveX / moveY      (-1..1, analog on a stick)
//   input.shootX / shootY    (one of the 4 directions, or 0,0)
//   input.pressed('pause')   true only on the frame the button went down
//   input.held('active')

const ACTIONS = ['active', 'consumable', 'bomb', 'dodge', 'pause', 'newRun', 'confirm', 'seed', 'quitTitle', 'collection', 'tab', 'debug', 'debugLights', 'debugMap', 'debugSecrets', 'debugFloor',
  // directions can be 'pressed' too (menus: the character picker, the collection page)
  'up', 'down', 'left', 'right', 'shootUp', 'shootDown', 'shootLeft', 'shootRight'];
const SHOOT_DIRS = {
  shootUp: [0, 1],
  shootDown: [0, -1],
  shootLeft: [-1, 0],
  shootRight: [1, 0],
};

export class Input {
  constructor() {
    this.keys = new Set();
    this.tapped = new Set(); // keys pressed since the last update (so very quick taps are never lost)
    this.shootOrder = []; // most recently pressed arrow key wins (like twin-stick shooters)
    this.moveX = 0;
    this.moveY = 0;
    this.shootX = 0;
    this.shootY = 0;
    this._held = {};
    this._prev = {};
    this._tap = {};
    for (const a of ACTIONS) {
      this._held[a] = false;
      this._prev[a] = false;
      this._tap[a] = false;
    }
    this.usingGamepad = false;
    this._tappedShoot = null;
    this._virtualTaps = new Set(); // on-screen buttons (touch)
    this.touch = null; // TouchControls, attached by the Game
    this.touchMode = false;

    this._codeToAction = new Map();
    for (const [action, codes] of Object.entries(KEYS)) {
      for (const c of codes) this._codeToAction.set(c, action);
    }

    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.tapped.clear();
      this.shootOrder.length = 0;
    });
  }

  _onKey(e, down) {
    const action = this._codeToAction.get(e.code);
    if (!action) return;
    e.preventDefault(); // stop arrows/space from scrolling the page
    if (down) {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.tapped.add(e.code);
      if (action in SHOOT_DIRS) {
        this._removeShoot(action);
        this.shootOrder.push(action);
        this._tappedShoot = action;
      }
    } else {
      this.keys.delete(e.code);
      if (action in SHOOT_DIRS) this._removeShoot(action);
    }
    this.usingGamepad = false;
  }

  _removeShoot(action) {
    const i = this.shootOrder.indexOf(action);
    if (i >= 0) this.shootOrder.splice(i, 1);
  }

  _keyHeld(action) {
    const codes = KEYS[action];
    for (let i = 0; i < codes.length; i++) if (this.keys.has(codes[i])) return true;
    return false;
  }

  /** Call once per frame before the game reads input. */
  update() {
    for (const a of ACTIONS) {
      this._prev[a] = this._held[a];
      this._held[a] = this._keyHeld(a);
      this._tap[a] = this._keyTapped(a) || this._virtualTaps.has(a);
    }
    this.tapped.clear();
    this._virtualTaps.clear();

    // keyboard movement
    let mx = (this._keyHeld('right') ? 1 : 0) - (this._keyHeld('left') ? 1 : 0);
    let my = (this._keyHeld('up') ? 1 : 0) - (this._keyHeld('down') ? 1 : 0);
    if (mx !== 0 && my !== 0) {
      mx *= Math.SQRT1_2;
      my *= Math.SQRT1_2;
    }

    // keyboard shooting: the last arrow pressed wins
    // (a tapped-and-released arrow still fires one stone)
    let sx = 0;
    let sy = 0;
    if (this.shootOrder.length === 0 && this._tappedShoot) {
      const d = SHOOT_DIRS[this._tappedShoot];
      sx = d[0];
      sy = d[1];
    }
    this._tappedShoot = null;
    if (this.shootOrder.length > 0) {
      const d = SHOOT_DIRS[this.shootOrder[this.shootOrder.length - 1]];
      sx = d[0];
      sy = d[1];
    }

    // gamepad (first connected one)
    const pads = navigator.getGamepads ? navigator.getGamepads() : null;
    const pad = pads && (pads[0] || pads[1] || pads[2] || pads[3]);
    if (pad) {
      const ax = pad.axes;
      const lx = ax[0] || 0;
      const ly = -(ax[1] || 0);
      const lLen = Math.hypot(lx, ly);
      if (lLen > PAD.deadzone) {
        const k = Math.min(1, (lLen - PAD.deadzone) / (1 - PAD.deadzone)) / lLen;
        mx = lx * k;
        my = ly * k;
        this.usingGamepad = true;
      }
      const rx = ax[2] || 0;
      const ry = -(ax[3] || 0);
      if (Math.hypot(rx, ry) > PAD.shootThreshold) {
        // snap the right stick to the closest of 4 directions
        if (Math.abs(rx) > Math.abs(ry)) {
          sx = Math.sign(rx);
          sy = 0;
        } else {
          sx = 0;
          sy = Math.sign(ry);
        }
        this.usingGamepad = true;
      }
      for (const a of ACTIONS) {
        const buttons = PAD[a];
        if (!buttons) continue;
        for (let i = 0; i < buttons.length; i++) {
          const b = pad.buttons[buttons[i]];
          if (b && b.pressed) {
            this._held[a] = true;
            this.usingGamepad = true;
          }
        }
      }
    }

    this.moveX = mx;
    this.moveY = my;
    this.shootX = sx;
    this.shootY = sy;
    if (this.touch) this.touch.apply(this); // on-screen sticks override while a thumb is down
  }

  /** An on-screen button press (touch), treated like a key tap for one frame. */
  virtualTap(action) {
    this._virtualTaps.add(action);
  }

  _keyTapped(action) {
    const codes = KEYS[action];
    for (let i = 0; i < codes.length; i++) if (this.tapped.has(codes[i])) return true;
    return false;
  }

  held(action) {
    return this._held[action];
  }

  /** true on the first frame a button is pressed (also catches taps shorter than one frame) */
  pressed(action) {
    return (this._held[action] && !this._prev[action]) || this._tap[action];
  }
}
