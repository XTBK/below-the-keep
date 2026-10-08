import { Enemy } from './Enemy.js';
import { TELE, telegraphAlpha } from './telegraph.js';
import { fxRng } from '../core/Rng.js';
import { buildWrenSheet } from '../render/Assets.js';
import { CHARACTERS } from '../data/characters.js';
import { RELICS } from '../data/items.js';
import { quality } from '../data/quality.js';
import { EMBERS } from '../data/embers.js';
import { Save } from '../core/Save.js';

// ECHOES OF YOUR LAST RUN.
//
// When a hero dies below, something of them stays where they fell. On a later descent, on that same
// floor, one room holds their Echo: a pale copy wearing their weapon and carrying the relics they
// died with, fighting the way that hero fights (and rolling out of the way of your shots, as a
// player would). Lay it to rest and it gives back one of those relics.
//
// The record is kept in Save.data.echo (see recordEcho below); a new death replaces it, laying the
// Echo to rest clears it. The Daily Descent neither leaves nor meets one.

/** What the death leaves behind (called once, when a run ends in death). */
export function recordEcho(game) {
  const p = game.player;
  if (!p || game.daily || game.realm || game.inVault || game.floorNumber < 1) return;
  Save.data.echo = {
    hero: game.characterId,
    looks: p._looks ? p._looks.split(',') : CHARACTERS[game.characterId].looks,
    relics: p.relics.filter((id) => RELICS[id] && RELICS[id].type !== 'active').slice(0, 30),
    floor: game.floorNumber,
    killer: p.lastHurtBy || 'the Dark',
    run: Save.data.stats.runsStarted,
  };
}

/** Is there an Echo waiting on the floor being built? */
export function echoForFloor(game) {
  const e = Save.data.echo;
  if (!e || game.daily || game.realm || game.inVault) return null;
  if (e.floor !== game.floorNumber || !CHARACTERS[e.hero]) return null;
  return e;
}

// each hero's way of fighting, played back
const STYLE = {
  wand: { range: [95, 140], windup: 0.38, cooldown: 1.25 },
  crossbow: { range: [130, 180], windup: 0.75, cooldown: 1.5 },
  hex: { range: [100, 150], windup: 0.5, cooldown: 1.7 },
  soul: { range: [90, 140], windup: 0.55, cooldown: 2.1 },
  sword: { range: [0, 46], windup: 0.42, cooldown: 0.95, lunge: { time: 0.26, speed: 270 } },
  spear: { range: [0, 70], windup: 0.55, cooldown: 1.1, lunge: { time: 0.3, speed: 330 } },
};

export const ECHO_DEF = {
  name: 'The Echo',
  hp: 120,
  speed: 62,
  radius: 8,
  hitRadius: 11,
  contactDamage: 1,
  mass: 3,
  hpPerRelic: 0.035, // every relic it carries makes it a little harder to lay to rest
  roll: { time: 0.24, speed: 250, cooldown: 1.7, sense: 52 },
};

// a cold light it carries, so it reads in the darkest room
const ECHO_LIGHT = { brightness: 1.1, height: 20, radius: 95, color: 0x8fdcff, flicker: 0.18, flickerSpeed: 3 };

/** The hero's own sprite, drained of colour into a pale spectral blue (shading kept, so you know them). */
function ghostly(canvas) {
  const out = document.createElement('canvas');
  out.width = canvas.width;
  out.height = canvas.height;
  const g = out.getContext('2d');
  g.drawImage(canvas, 0, 0);
  const img = g.getImageData(0, 0, out.width, out.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    const l = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    const k = 0.25 + 0.75 * Math.pow(l, 0.8); // lift the darks: it glows from within
    d[i] = Math.round(70 + 150 * k);
    d[i + 1] = Math.round(130 + 120 * k);
    d[i + 2] = Math.round(175 + 80 * k);
  }
  g.putImageData(img, 0, 0);
  return out;
}

const v = { x: 0, y: 0, dist: 0 };
const end = { x: 0, y: 0 };
const DIRS = { down: 0, up: 1, right: 2, left: 3 };

export class Echo extends Enemy {
  constructor(game) {
    super(game, 'echo', 'wren', { anchorY: 1, shadow: 1, blood: 'ash' }, ECHO_DEF);
    this.twoFacings = false; // the hero sheet's rows are four facings, set in think()
  }

  spawn(room, x, y, opts) {
    this.isBoss = false; // scaled as a creature of this floor; it becomes a boss in onSpawn
    super.spawn(room, x, y, opts);
  }

  onSpawn() {
    const rec = Save.data.echo || { hero: 'wren', looks: CHARACTERS.wren.looks, relics: [], killer: 'the Dark' };
    this.rec = rec;
    const ch = CHARACTERS[rec.hero] || CHARACTERS.wren;
    this.isBoss = true; // the health bar, the title card, no fear or gilding (set after spawn scaling)
    this.style = STYLE[ch.weapon] || STYLE.wand;
    this.weaponClass = ch.weapon || 'wand';
    this.name = `THE ECHO OF ${ch.name.toUpperCase()}`;
    this.subtitle = `Slain here by ${rec.killer}`;
    this.cardLine = 'YOUR LAST DESCENT';
    this.deep = this.game.floorNumber >= 10;
    // it wears what you wore
    const sheet = buildWrenSheet(rec.looks && rec.looks.length ? rec.looks : ch.looks, ch.recolor);
    this.sprite.swapSheet(ghostly(sheet.color), sheet.normal);
    const m = this.sprite.material;
    if (!m.transparent) {
      m.transparent = true; // it can fade, and does mid-roll
      m.needsUpdate = true;
    }
    const k = 1 + ECHO_DEF.hpPerRelic * rec.relics.length;
    this.maxHp *= k;
    this.hp = this.maxHp;
    this.dir = 'down';
    this.strafe = fxRng.chance(0.5) ? 1 : -1;
    this.strafeT = fxRng.float(1, 2.5);
    this.cool = 1.2;
    this.rollCool = 0.8;
    this.rollT = 0;
    this.aimX = 0;
    this.aimY = 1;
    this.setState('move');
    this.light = this.game.enemies.borrowLight({ ...ECHO_LIGHT, x: this.x, y: this.y });
    this.game.audio.play('wizBlink', 0.6);
  }

  get hittable() {
    return this.rollT <= 0; // mid-roll it slips past your shots, as you would
  }

  get touchDamage() {
    if (this.state === 'lunge') return this.deep ? 2 : 1;
    return this.rollT > 0 ? 0 : 1;
  }

  get corpseTime() {
    return 1.4;
  }

  _face(dx, dy) {
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'up' : 'down';
    this.facing = dx >= 0 ? 1 : -1;
    this.anim.row = DIRS[this.dir];
  }

  /** A shot of yours coming at it: roll aside, the way a player would. */
  _sense() {
    const pool = this.game.projectiles.pool;
    const R = ECHO_DEF.roll.sense;
    for (let i = 0; i < pool.count; i++) {
      const s = pool.active[i];
      const dx = this.x - s.x;
      const dy = this.y - s.y;
      if (dx * dx + dy * dy > R * R) continue;
      if ((s.vx || 0) * dx + (s.vy || 0) * dy <= 0) continue; // flying away
      return s;
    }
    return null;
  }

  _roll(threat) {
    const sp = Math.hypot(threat.vx, threat.vy) || 1;
    let ax = -threat.vy / sp;
    let ay = threat.vx / sp;
    // roll toward the middle of the room rather than into a wall
    const b = this.room.bounds;
    if (ax * ((b.x0 + b.x1) / 2 - this.x) + ay * ((b.y0 + b.y1) / 2 - this.y) < 0) {
      ax = -ax;
      ay = -ay;
    }
    this.rollT = ECHO_DEF.roll.time;
    this.rollCool = ECHO_DEF.roll.cooldown;
    this.vx = ax * ECHO_DEF.roll.speed;
    this.vy = ay * ECHO_DEF.roll.speed;
    this.game.effects.landDust(this.x, this.y, 6);
    this.game.audio.play('roll', 0.5);
  }

  think(dt) {
    const s = this.style;
    this.toPlayer(v);
    if (this.rollCool > 0) this.rollCool -= dt;
    if (this.rollT > 0) {
      this.rollT -= dt;
      this.anim.play('walk');
      return; // committed to the roll
    }
    // shots incoming (not mid-attack: it pays for greed, as you would)
    if ((this.state === 'move' || this.state === 'recover') && this.rollCool <= 0) {
      const threat = this._sense();
      if (threat) return this._roll(threat);
    }
    switch (this.state) {
      case 'move': {
        this.cool -= dt;
        const [near, far] = s.range;
        if (s.lunge) {
          // a fighter closes in
          if (v.dist > far) this.chase(this.speed);
          else this.stop();
        } else {
          // a shooter keeps its distance and circles
          this.strafeT -= dt;
          if (this.strafeT <= 0) {
            this.strafe *= -1;
            this.strafeT = fxRng.float(1.2, 2.6);
          }
          const nx = v.x / v.dist;
          const ny = v.y / v.dist;
          const radial = v.dist < near ? -1 : v.dist > far ? 1 : 0;
          this.vx = (nx * radial * 0.9 - ny * this.strafe * 0.75) * this.speed;
          this.vy = (ny * radial * 0.9 + nx * this.strafe * 0.75) * this.speed;
        }
        this._face(v.x, v.y);
        this.anim.play(Math.hypot(this.vx, this.vy) > 12 ? 'walk' : 'idle');
        if (this.cool <= 0 && v.dist <= far + (s.lunge ? 6 : 60) && this.canSeePlayer()) {
          this.setState('windup');
          this.aimX = v.x / v.dist;
          this.aimY = v.y / v.dist;
          this.game.audio.play(this.weaponClass === 'crossbow' ? 'crossbowClick' : 'charged', 0.5);
        }
        break;
      }
      case 'windup':
        this.stop();
        this.anim.play('wind');
        // it tracks you while it draws back, then commits
        if (this.stateTime < s.windup * 0.7) {
          this.aimX = v.x / v.dist;
          this.aimY = v.y / v.dist;
        }
        this._face(this.aimX, this.aimY);
        if (this.stateTime >= s.windup) this._attack();
        break;
      case 'lunge':
        this.anim.play('release');
        this.vx = this.aimX * s.lunge.speed;
        this.vy = this.aimY * s.lunge.speed;
        if (this.stateTime >= s.lunge.time) this.setState('recover');
        break;
      case 'recover':
        this.anim.play('release');
        this.vx *= 0.85;
        this.vy *= 0.85;
        if (this.stateTime >= 0.3) {
          this.setState('move');
          this.cool = s.cooldown * fxRng.float(0.85, 1.2);
        }
        break;
    }
  }

  _attack() {
    const shots = this.game.enemies.shots;
    const src = this.name.toLowerCase().replace('the echo', 'the Echo');
    const dmg = this.deep ? 2 : 1;
    const ax = this.aimX;
    const ay = this.aimY;
    const a = Math.atan2(ay, ax);
    const fire = (ang, speed, frame, opts) => shots.fireOrb(this.x, this.y, 14, Math.cos(ang), Math.sin(ang), speed * this.shotMult, frame, dmg, src, opts);
    switch (this.weaponClass) {
      case 'sword':
      case 'spear':
        this.setState('lunge');
        this.game.audio.play(this.weaponClass === 'spear' ? 'sword' : 'sword', 0.8);
        return;
      case 'crossbow':
        shots.fireBolt(this.x + ax * 10, this.y, 16, ax, ay, 300 * this.shotMult, dmg);
        this.game.audio.play('crossbowFire');
        break;
      case 'hex':
        fire(a - 0.35, 85, 6, { homing: 1.3, life: 3.5 });
        fire(a + 0.35, 85, 6, { homing: 1.3, life: 3.5 });
        this.game.audio.play('hexCast', 0.7);
        break;
      case 'soul':
        for (let i = 0; i < 8; i++) fire(a + (i / 8) * Math.PI * 2, 95, 10);
        this.game.audio.play('soulCast', 0.7);
        break;
      default:
        for (const d of [-0.16, 0, 0.16]) fire(a + d, 150, 4);
        this.game.audio.play('wand', 0.7);
    }
    this.setState('recover');
  }

  drawOverlay(o, time) {
    if (this.state !== 'windup' || this.dying) return;
    const t = this.stateTime / this.style.windup;
    const len = this.style.lunge ? this.style.lunge.speed * this.style.lunge.time + 10 : 420;
    this.room.nav.raycast(this.x, this.y, this.aimX, this.aimY, len, end);
    o.line(this.x, this.y + 10, end.x, end.y + 6, t > 0.7 ? TELE.dangerHot : TELE.danger, telegraphAlpha(t * 0.8, time), 2, this.style.lunge ? 0 : 3);
  }

  sync() {
    super.sync();
    if (!this.active) return;
    // a pale, cold copy of you; nearly transparent mid-roll
    const m = this.sprite.material;
    // it lights itself: always visible, even where the torches have gone out
    const pulse = 0.5 + 0.5 * Math.sin(this.game.time * 4);
    m.emissive.setRGB(0.42 + 0.12 * pulse, 0.5 + 0.12 * pulse, 0.6 + 0.14 * pulse);
    let alpha = this.rollT > 0 ? 0.4 : 0.82 + 0.1 * pulse;
    if (this.dying) alpha *= Math.max(0, 1 - this.deathTime / this.corpseTime);
    m.opacity = alpha;
    if (this.light) {
      this.light.x = this.x;
      this.light.y = this.y;
    }
  }

  onRelease() {
    this.game.enemies.returnLight(this.light);
    this.light = null;
  }

  onDeath() {
    const g = this.game;
    const fx = g.effects;
    fx.relicBurst(this.x, this.y);
    fx.burst(fx.presets.holy, this.x, this.y, 14, 24, 90, 60);
    g.audio.play('relic');
    g.feel.shake(0.3);
    // it gives back one of the relics it carried: the finest you don't already hold
    const rec = this.rec;
    const held = new Set(g.player.relics);
    const pool = rec.relics.filter((id) => RELICS[id] && !held.has(id));
    pool.sort((a, b) => quality(b) - quality(a));
    const id = pool.length ? pool[0] : g.pickRelic('armoury', g.dropRng, { minQuality: 2 });
    if (id) {
      const room = this.room;
      const cell = room.data.cells[0];
      const c = room.slotCenter((cell.x - room.data.minX) * 15 + 7, (cell.y - room.data.minY) * 10 + 4);
      room.addRewardPedestal(c.x, c.y, { kind: 'relic', id, price: 0, gone: false });
    }
    g.earnEmbers(EMBERS.champion * 4);
    g.hud.banner({ name: 'An Echo laid to rest', flavour: 'Something of your last descent is yours again.' });
    Save.data.echo = null;
    Save.data.stats.echoesLaid = (Save.data.stats.echoesLaid || 0) + 1;
    Save.write();
  }
}
