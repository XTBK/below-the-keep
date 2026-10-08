import { VARIANT } from './Enemy.js';
import * as B3 from './bestiary3.js';
import { BeamFX } from '../render/BeamFX.js';
import * as THREE from 'three';
import { PlagueRat } from './PlagueRat.js';
import { Gaoler } from './Gaoler.js';
import { ChainedPrisoner } from './ChainedPrisoner.js';
import { TorchImp } from './TorchImp.js';
import { Ghoul } from './Ghoul.js';
import { Fly } from './Fly.js';
import { Crossbowman } from './Crossbowman.js';
import { BarrelMimic } from './BarrelMimic.js';
import { Echo } from './Echo.js';
import { MotherOfRats } from './bosses/MotherOfRats.js';
import { Warden } from './bosses/Warden.js';
import * as CATACOMBS from './catacombs.js';
import * as HOLLOW from './hollow.js';
import * as HALLS from './halls.js';
import * as B2 from './bestiary2.js';
import { patternBossClass } from './bosses/PatternBoss.js';
import { EnemyShots } from './EnemyShots.js';
import { Hazards } from './Hazards.js';
import { Decals } from './Decals.js';
import { PixelOverlay } from '../render/PixelOverlay.js';
import { ENEMY_FX } from '../data/enemies.js';
import { PLAYER, ATTACK_BUDGET } from '../data/config.js';

// Spawns, updates and draws every enemy, plus their shots, burning patches and splats.
//
// Enemies are pooled per type: the first time a room needs three ghouls, three Ghoul objects are
// created; after that they are reused forever.

const STAR = new THREE.Color(2.2, 2.0, 0.6);
const WAVE = new THREE.Color(2.2, 1.6, 1.0);

const CLASSES = {
  rat: PlagueRat,
  gaoler: Gaoler,
  prisoner: ChainedPrisoner,
  imp: TorchImp,
  ghoul: Ghoul,
  fly: Fly,
  crossbowman: Crossbowman,
  mimic: BarrelMimic,
  echo: Echo, // what your last hero left behind (see Echo.js)
  ratmother: MotherOfRats,
  warden: Warden,
  // chapter 2
  skeleton: CATACOMBS.Skeleton,
  archer: CATACOMBS.BoneArcher,
  wraith: CATACOMBS.CandleWraith,
  golem: CATACOMBS.OssuaryGolem,
  spider: CATACOMBS.CryptSpider,
  worm: CATACOMBS.GraveWorm,
  doctor: CATACOMBS.PlagueDoctor,
  spectre: CATACOMBS.MourningSpectre,
  // chapter 3
  witch: HOLLOW.HedgeWitch,
  thornling: HOLLOW.Thornling,
  direwolf: HOLLOW.DireWolf,
  bloater: HOLLOW.SporeBloater,
  wisp: HOLLOW.Wisp,
  scarecrow: HOLLOW.Scarecrow,
  crow: HOLLOW.Crow,
  sapling: HOLLOW.RootSapling,
  cutpurse: HOLLOW.GoblinCutpurse,
  // chapter 4
  blackknight: HALLS.BlackKnight,
  flailbrute: HALLS.FlailBrute,
  gargoyle: HALLS.Gargoyle,
  magus: HALLS.CourtMagus,
  livingarmour: HALLS.LivingArmour,
  drake: HALLS.DrakeWhelp,
  executioner: HALLS.Executioner,
  // the second bestiary
  hound: B2.KennelHound,
  torturer: B2.Torturer,
  ratnest: B2.RatNest,
  monk: B2.MadMonk,
  slime: B2.SewerSlime,
  slimelet: B2.Slimelet,
  skull: B2.FlyingSkull,
  banshee: B2.Banshee,
  necromancer: B2.Necromancer,
  mummy: B2.Mummy,
  bat: B2.CryptBat,
  puffcap: B2.Puffcap,
  toad: B2.BogToad,
  treant: B2.ElderTreant,
  pixie: B2.HollowSprite,
  boar: B2.TuskedBoar,
  hellhound: B2.Hellhound,
  ballista: B2.Ballista,
  jester: B2.MadJester,
  moltengolem: B2.MoltenGolem,
  ember: B2.Ember,
  bannerman: B2.BannerBearer,
  // pattern bosses
  gravedigger: patternBossClass('gravedigger', { anchorY: 3, shadow: 3, blood: 'blood' }),
  colossus: patternBossClass('colossus', { anchorY: 6, shadow: 3, blood: 'iron' }),
  briarhound: patternBossClass('briarhound', { anchorY: 3, shadow: 3, blood: 'blood' }),
  thornwitch: patternBossClass('thornwitch', { anchorY: 3, shadow: 3, blood: 'goo' }),
  pyrebishop: patternBossClass('pyrebishop', { anchorY: 3, shadow: 3, blood: 'ash' }),
  champion: patternBossClass('champion', { anchorY: 3, shadow: 3, blood: 'iron' }),
  madking: patternBossClass('madking', { anchorY: 3, shadow: 3, blood: 'blood' }),
  crownwraith: patternBossClass('crownwraith', { anchorY: 6, shadow: 2, blood: 'ash' }),
  keeper: patternBossClass('keeper', { anchorY: 3, shadow: 3, blood: 'iron' }),
  // the second roster
  mastiff: patternBossClass('mastiff', { anchorY: 3, shadow: 3, blood: 'blood' }),
  friar: patternBossClass('friar', { anchorY: 3, shadow: 3, blood: 'goo' }),
  ratking: patternBossClass('ratking', { anchorY: 3, shadow: 3, blood: 'blood' }),
  headsman: patternBossClass('headsman', { anchorY: 3, shadow: 3, blood: 'blood' }),
  maiden: patternBossClass('maiden', { anchorY: 3, shadow: 3, blood: 'iron' }),
  choir: patternBossClass('choir', { anchorY: 6, shadow: 2, blood: 'iron' }),
  gravemother: patternBossClass('gravemother', { anchorY: 3, shadow: 3, blood: 'goo' }),
  physician: patternBossClass('physician', { anchorY: 3, shadow: 3, blood: 'blood' }),
  lich: patternBossClass('lich', { anchorY: 6, shadow: 2, blood: 'ash' }),
  entombed: patternBossClass('entombed', { anchorY: 3, shadow: 3, blood: 'ash' }),
  greattoad: patternBossClass('greattoad', { anchorY: 3, shadow: 3, blood: 'goo' }),
  matron: patternBossClass('matron', { anchorY: 3, shadow: 3, blood: 'goo' }),
  stag: patternBossClass('stag', { anchorY: 3, shadow: 3, blood: 'blood' }),
  ancientoak: patternBossClass('ancientoak', { anchorY: 4, shadow: 3, blood: 'iron' }),
  mothqueen: patternBossClass('mothqueen', { anchorY: 6, shadow: 2, blood: 'ash' }),
  courtjester: patternBossClass('courtjester', { anchorY: 3, shadow: 3, blood: 'blood' }),
  moltenknight: patternBossClass('moltenknight', { anchorY: 3, shadow: 3, blood: 'ash' }),
  gargoylelord: patternBossClass('gargoylelord', { anchorY: 6, shadow: 3, blood: 'iron' }),
  ashwing: patternBossClass('ashwing', { anchorY: 4, shadow: 3, blood: 'ash' }),
  burnedqueen: patternBossClass('burnedqueen', { anchorY: 6, shadow: 2, blood: 'ash' }),
  // the secret bestiary
  drowned: B3.DrownedPilgrim,
  eel: B3.CisternEel,
  nun: B3.HollowNun,
  acolyte: B3.CenserAcolyte,
  bellows: B3.BellowsImp,
  anvilknight: B3.AnvilKnight,
  // the Deep's creatures: older behaviours in new bodies (see VARIANTS)
  roothound: HOLLOW.DireWolf,
  sapbulb: B2.Puffcap,
  rimewraith: CATACOMBS.MourningSpectre,
  icegolem: CATACOMBS.OssuaryGolem,
  drownedknight: HALLS.BlackKnight,
  tidesiren: B2.Banshee,
  crystalspider: CATACOMBS.CryptSpider,
  shardmagus: HALLS.CourtMagus,
  heartleech: B2.CryptBat,
  hollowborn: HALLS.Executioner,
  // the Deep's bosses
  worldroot: patternBossClass('worldroot', { anchorY: 6, shadow: 3, blood: 'goo' }),
  rimequeen: patternBossClass('rimequeen', { anchorY: 4, shadow: 2, blood: 'ash' }),
  sunkenking: patternBossClass('sunkenking', { anchorY: 4, shadow: 2, blood: 'goo' }),
  crystalwyrm: patternBossClass('crystalwyrm', { anchorY: 4, shadow: 3, blood: 'ash' }),
  hollow: patternBossClass('hollow', { anchorY: 6, shadow: 3, blood: 'ash' }),
  // the secret bosses
  leviathan: patternBossClass('leviathan', { anchorY: 4, shadow: 3, blood: 'goo' }),
  mirrorqueen: patternBossClass('mirrorqueen', { anchorY: 4, shadow: 2, blood: 'ash' }),
  firstking: patternBossClass('firstking', { anchorY: 4, shadow: 2, blood: 'ash' }),
  organist: patternBossClass('organist', { anchorY: 6, shadow: 3, blood: 'iron' }),
  facelesssaint: patternBossClass('facelesssaint', { anchorY: 4, shadow: 2, blood: 'ash' }),
  // the third roster
  turnkey: patternBossClass('turnkey', { anchorY: 2, shadow: 3, blood: 'blood' }),
  bellringer: patternBossClass('bellringer', { anchorY: 2, shadow: 3, blood: 'blood' }),
  widow: patternBossClass('widow', { anchorY: 6, shadow: 2, blood: 'ash' }),
  hangedman: patternBossClass('hangedman', { anchorY: 6, shadow: 2, blood: 'blood' }),
  fenhag: patternBossClass('fenhag', { anchorY: 2, shadow: 3, blood: 'goo' }),
  wickerman: patternBossClass('wickerman', { anchorY: 4, shadow: 3, blood: 'ash' }),
  inquisitor: patternBossClass('inquisitor', { anchorY: 4, shadow: 2, blood: 'blood' }),
  dreadknight: patternBossClass('dreadknight', { anchorY: 2, shadow: 3, blood: 'iron' }),
  abyssaleye: patternBossClass('abyssaleye', { anchorY: 6, shadow: 2, blood: 'goo' }),
};

// creatures that borrow another's class: built with their own data and sprite
const VARIANTS = new Set(['roothound', 'sapbulb', 'rimewraith', 'icegolem', 'drownedknight', 'tidesiren', 'crystalspider', 'shardmagus', 'heartleech', 'hollowborn']);

export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.turns = new Map(); // enemy -> when its attack turn started (see ATTACK_BUDGET)
    this.turnRest = new Map(); // enemy -> when it may have another turn
    this.pools = {};
    this.active = [];
    const scene = game.renderer.scene;
    // glowing telegraph lines/rings, and solid lit pixels (chains)
    this.tele = new PixelOverlay(scene, game.lighting, 4096, { lit: false, additive: true });
    this.solidOverlay = new PixelOverlay(scene, game.lighting, 2048, { lit: true, additive: false });
    this.shots = new EnemyShots(game, this);
    this.beams = new BeamFX(scene); // boss lasers and breath fire
    this.hazards = new Hazards(game, this);
    this.fire = this.hazards; // (older code calls it "fire")
    this.decals = new Decals(game);
    this.borrowedLights = 0;
    // expanding rings (bomb blasts, the Ram's Horn)
    this.waves = [];
    for (let i = 0; i < 6; i++) this.waves.push({ t: 1, x: 0, y: 0, r: 0 });
  }

  shockwave(x, y, r) {
    let w = this.waves[0];
    for (const it of this.waves) if (it.t > w.t) w = it;
    w.t = 0;
    w.x = x;
    w.y = y;
    w.r = r;
  }

  spawn(type, room, x, y, opts = {}) {
    const pool = this.pools[type] || (this.pools[type] = []);
    let e = null;
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].active) {
        e = pool[i];
        break;
      }
    }
    if (!e) {
      // a Deep creature borrows an older behaviour: build it as itself (see VARIANT in Enemy.js)
      if (VARIANTS.has(type)) VARIANT.type = type;
      e = new CLASSES[type](this.game);
      pool.push(e);
    }
    e.spawn(room, x, y, opts);
    this.active.push(e);
    return e;
  }

  /** Spawn everything a room's layout asks for (room.spawns is built by Room.js, seeded). */
  spawnRoom(room) {
    for (const s of room.spawns) {
      if (s.count > 1) {
        // a pack (rats): scattered around the spawn point
        for (let i = 0; i < s.count; i++) {
          const a = (i / s.count) * Math.PI * 2;
          this.spawn(s.type, room, s.x + Math.cos(a) * 10, s.y + Math.sin(a) * 7, { champion: s.champion });
        }
      } else {
        this.spawn(s.type, room, s.x, s.y, { champion: s.champion });
      }
    }
  }

  /** Remove a room's enemies (when its graphics are thrown away). */
  releaseRoom(room) {
    for (const e of this.active) if (e.room === room && e.active) e.release();
    this._compact();
    this.shots.clear();
    this.hazards.clear();
    this.decals.clearRoom(room);
  }

  /** The room was rebuilt (same place, new object): move its enemies over. */
  reassign(oldRoom, newRoom) {
    for (const e of this.active) {
      if (e.room !== oldRoom) continue;
      e.room = newRoom;
      if (e.solid && e.state === 'dormant') newRoom.solids.push(e.solid);
    }
    this.decals.reassign(oldRoom, newRoom);
  }

  countAlive(room) {
    let n = 0;
    for (const e of this.active) if (e.room === room && e.alive) n++;
    return n;
  }

  /**
   * First living enemy in the current room within r of (x, y), or null.
   * skip/skipCount: enemies to ignore (a piercing stone doesn't hit the same enemy twice).
   */
  hitTest(x, y, r, skip = null, skipCount = 0) {
    const room = this.game.room;
    for (const e of this.active) {
      if (e.room !== room || !e.alive || !e.hittable) continue;
      if (skip && skip.indexOf(e) >= 0 && skip.indexOf(e) < skipCount) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const rr = e.def.hitRadius + r;
      if (dx * dx + dy * dy < rr * rr) return e;
    }
    return null;
  }

  borrowLight(opts) {
    if (this.borrowedLights >= ENEMY_FX.maxDynamicLights) return null;
    const l = this.game.lighting.add(opts);
    if (l) this.borrowedLights++;
    return l;
  }

  returnLight(l) {
    if (!l) return;
    this.game.lighting.remove(l);
    this.borrowedLights--;
  }

  /** May this ordinary enemy attack now? Grants a turn if fewer than the budget are attacking. */
  mayAttack(e) {
    const t = this.game.time;
    const turns = this.turns;
    const B = ATTACK_BUDGET;
    const started = turns.get(e);
    if (started !== undefined) {
      if (t - started < B.turn) return true;
      turns.delete(e);
      this.turnRest.set(e, t + B.rest);
    }
    if ((this.turnRest.get(e) ?? -1) > t) return false;
    for (const [k, v] of turns) {
      if (t - v >= B.turn || !k.alive || k.room !== this.game.room) {
        turns.delete(k);
        this.turnRest.set(k, v + B.turn + B.rest);
      }
    }
    const budget = this.game.floorNumber >= 5 ? B.late : B.early;
    if (turns.size >= budget) return false;
    turns.set(e, t);
    return true;
  }

  decal(room, kind, x, y) {
    this.decals.add(room, kind, x, y);
  }

  update(dt) {
    const room = this.game.room;
    const p = this.game.player;
    // stragglers: if everything left in the room is hiding, it doesn't get to hide for long
    let alive = 0;
    let shown = 0;
    this.forEachAlive(room, (e) => {
      if (e.isBoss) return;
      alive++;
      if (e.hittable) shown++;
    });
    this.hidingT = alive > 0 && shown === 0 ? (this.hidingT || 0) + dt : 0;
    if (this.hidingT > 4) {
      this.hidingT = 0;
      this.forEachAlive(room, (e) => !e.isBoss && e.coax());
      this.game.audio.play('wail', 0.4);
    }
    room.nav.update(p.x, p.y);

    const n = this.active.length; // enemies spawned during this loop (flies) start next frame
    for (let i = 0; i < n; i++) {
      const e = this.active[i];
      if (e.active && e.room === room) e.update(dt);
    }

    // keep enemies from stacking on top of each other
    for (let i = 0; i < this.active.length; i++) {
      const a = this.active[i];
      if (!a.alive || a.room !== room) continue;
      for (let j = i + 1; j < this.active.length; j++) {
        const b = this.active[j];
        if (!b.alive || b.room !== room || b.state === 'dormant' || a.state === 'dormant') continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const min = a.def.radius + b.def.radius;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 0.0001) continue;
        const d = Math.sqrt(d2);
        const push = ((min - d) / min) * ENEMY_FX.separation * dt;
        const wa = b.def.mass / (a.def.mass + b.def.mass);
        a.x -= (dx / d) * push * wa;
        a.y -= (dy / d) * push * wa;
        b.x += (dx / d) * push * (1 - wa);
        b.y += (dy / d) * push * (1 - wa);
      }
    }

    // touching an enemy hurts
    if (!p.dead) {
      for (const e of this.active) {
        if (!e.alive || e.room !== room) continue;
        const dmg = e.touchDamage;
        if (dmg <= 0) continue;
        const dx = p.x - e.x;
        const dy = p.y - e.y;
        // a boss's body only hurts when it is coming at you - resting, dazed or winding up, standing
        // next to it is safe (its attacks still hurt). That is what makes a sword fair against it.
        if (e.isBoss && (e.vx || 0) * dx + (e.vy || 0) * dy <= 12 * Math.hypot(dx, dy)) continue;
        const r = e.def.radius + PLAYER.radius - 1;
        if (dx * dx + dy * dy < r * r && p.hurt(dmg, e.x, e.y, e.def.name)) {
          // whatever hit you with its body reels back for a moment, so one touch is one hit
          // (not a chain of them the moment your invulnerability runs out)
          const d = Math.hypot(dx, dy) || 1;
          const push = e.isBoss ? 230 : 150;
          e.kbx -= (dx / d) * push;
          e.kby -= (dy / d) * push;
          e.stun(e.isBoss ? 0.5 : 0.3);
        }
      }
    }

    this.shots.update(dt, room);
    this.hazards.update(dt);
    this._compact();
  }

  _compact() {
    let w = 0;
    for (let i = 0; i < this.active.length; i++) {
      const e = this.active[i];
      if (e.active) this.active[w++] = e;
    }
    this.active.length = w;
  }

  sync(time) {
    this.beams.begin();
    this.tele.begin();
    this.solidOverlay.begin();
    for (const e of this.active) {
      e.sync();
      e.drawOverlay(this.tele, time, this.solidOverlay);
      e.drawStatus(this.tele, time, STAR);
    }
    this.shots.drawOverlay(this.tele, time);
    this.hazards.drawOverlay(this.tele, time);
    this.game.projectiles.drawOverlay(this.tele); // chain-lightning arcs
    this.game.familiars.drawOverlay(this.tele, time); // the War Banner's ring
    this.game.damageNumbers.draw(this.tele);
    this.game.player.drawOverlay(this.tele, time); // the Iron Knight's sword arc
    this.game.room.drawOverlay(this.tele, time); // price tags, puzzle runes
    for (const w of this.waves) {
      if (w.t >= 0.35) continue;
      w.t += 1 / 60;
      const k = w.t / 0.35;
      this.tele.ring(w.x, w.y, w.r * (0.2 + 0.8 * k), WAVE, (1 - k) * 0.9);
      this.tele.ring(w.x, w.y, w.r * (0.1 + 0.6 * k), WAVE, (1 - k) * 0.4);
    }
    this.tele.end();
    this.beams.end();
    this.solidOverlay.end();
    this.shots.sync();
    this.hazards.sync();
  }

  clear() {
    for (const e of this.active) e.release();
    this.active.length = 0;
    this.shots.clear();
    this.hazards.clear();
    this.decals.clearAll();
  }

  /** Every living enemy in a room (for things that affect them all, like the Ram's Horn). */
  forEachAlive(room, fn) {
    for (const e of this.active) if (e.room === room && e.alive) fn(e);
  }

  /** The boss of the current room, if one is alive (for the health bar). */
  get boss() {
    for (const e of this.active) if (e.isBoss && e.room === this.game.room && e.active) return e;
    return null;
  }

  get count() {
    return this.active.length;
  }
}
