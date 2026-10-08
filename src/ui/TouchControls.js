import { TOUCH } from '../data/controls.js';

// Twin-stick touch controls. Put a thumb down anywhere on the LEFT half to move
// (the stick appears under your thumb), and anywhere on the RIGHT half to shoot.
// Plus a pause button, and a "new run" button while paused.
// The visuals are plain HTML elements laid over the game canvas.

function el(tag, className, parent, text) {
  const e = document.createElement(tag);
  e.className = className;
  if (text) e.textContent = text;
  parent.appendChild(e);
  return e;
}

export class TouchControls {
  constructor(input) {
    this.input = input;
    this.move = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
    this.shoot = { id: null, ox: 0, oy: 0, x: 0, y: 0 };

    const root = el('div', 'touch-ui', document.body);
    this.root = root;
    this.moveBase = el('div', 'stick', root);
    this.moveKnob = el('div', 'knob', this.moveBase);
    this.shootBase = el('div', 'stick stick-shoot', root);
    this.shootKnob = el('div', 'knob', this.shootBase);
    this.pauseBtn = el('button', 'touch-btn touch-pause', root, 'II');
    this.pauseBtn.setAttribute('aria-label', 'Pause');
    this.newRunBtn = el('button', 'touch-btn touch-newrun', root, 'NEW RUN');
    this.newRunBtn.hidden = true;
    this.bombBtn = el('button', 'touch-btn touch-bomb', root, 'BOMB');
    this.itemBtn = el('button', 'touch-btn touch-item', root, 'ITEM');
    this.useBtn = el('button', 'touch-btn touch-use', root, 'USE');
    this.rollBtn = el('button', 'touch-btn touch-roll', root, 'ROLL');
    this.onTap = null; // set by the Game: taps confirm menus (title, death screen)
    for (const [btn, action] of [[this.bombBtn, 'bomb'], [this.itemBtn, 'active'], [this.useBtn, 'consumable'], [this.rollBtn, 'dodge']]) {
      btn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        input.virtualTap(action);
      });
    }

    this.pauseBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      input.virtualTap('pause');
    });
    this.newRunBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      input.virtualTap('newRun');
    });

    window.addEventListener('pointerdown', (e) => this._down(e), { passive: false });
    window.addEventListener('pointermove', (e) => this._moveEvt(e), { passive: false });
    window.addEventListener('pointerup', (e) => this._up(e));
    window.addEventListener('pointercancel', (e) => this._up(e));
  }

  _down(e) {
    if (e.pointerType !== 'touch') return;
    e.preventDefault();
    document.body.classList.add('touch-mode');
    this.input.touchMode = true;
    if (this.onTap && this.onTap(e.clientX / window.innerWidth, e.clientY / window.innerHeight)) return; // a menu used the tap
    const stick = e.clientX < window.innerWidth / 2 ? this.move : this.shoot;
    if (stick.id !== null) return;
    stick.id = e.pointerId;
    stick.ox = stick.x = e.clientX;
    stick.oy = stick.y = e.clientY;
    this._render();
  }

  _moveEvt(e) {
    const s = e.pointerId === this.move.id ? this.move : e.pointerId === this.shoot.id ? this.shoot : null;
    if (!s) return;
    e.preventDefault();
    s.x = e.clientX;
    s.y = e.clientY;
    this._render();
  }

  _up(e) {
    for (const s of [this.move, this.shoot]) if (s.id === e.pointerId) s.id = null;
    this._render();
  }

  /** stick vector, length clamped to 1, y pointing UP (game convention) */
  _vec(s, out) {
    if (s.id === null) {
      out.x = 0;
      out.y = 0;
      return 0;
    }
    let dx = (s.x - s.ox) / TOUCH.stickRadius;
    let dy = -(s.y - s.oy) / TOUCH.stickRadius;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    out.x = dx;
    out.y = dy;
    return Math.min(1, len);
  }

  /** Called by Input.update(): writes the touch sticks into the input state. */
  apply(state) {
    const v = this._tmp || (this._tmp = { x: 0, y: 0 });
    const ml = this._vec(this.move, v);
    if (ml > TOUCH.deadzone) {
      state.moveX = v.x;
      state.moveY = v.y;
    }
    const sl = this._vec(this.shoot, v);
    if (sl > TOUCH.shootThreshold) {
      if (Math.abs(v.x) > Math.abs(v.y)) {
        state.shootX = Math.sign(v.x);
        state.shootY = 0;
      } else {
        state.shootX = 0;
        state.shootY = Math.sign(v.y);
      }
    }
  }

  setPaused(p) {
    this.newRunBtn.hidden = !p;
    this.pauseBtn.textContent = p ? '>' : 'II';
  }

  _render() {
    for (const [s, base, knob] of [
      [this.move, this.moveBase, this.moveKnob],
      [this.shoot, this.shootBase, this.shootKnob],
    ]) {
      if (s.id === null) {
        base.style.display = 'none';
        continue;
      }
      base.style.display = 'block';
      base.style.left = `${s.ox}px`;
      base.style.top = `${s.oy}px`;
      let dx = s.x - s.ox;
      let dy = s.y - s.oy;
      const len = Math.hypot(dx, dy);
      const r = TOUCH.stickRadius;
      if (len > r) {
        dx = (dx / len) * r;
        dy = (dy / len) * r;
      }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }
}
