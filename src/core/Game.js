import { Renderer } from '../render/Renderer.js';
import { Lighting } from '../render/Lighting.js';
import { makeParticleSystems } from '../render/Particles.js';
import { Effects } from '../render/Effects.js';
import { sharedUniforms } from '../render/Sprite.js';
import { Input } from './Input.js';
import { Feel } from './Feel.js';
import { Audio } from './Audio.js';
import { Save } from './Save.js';
import { rngFromSeed, randomSeedString, normaliseSeed } from './Rng.js';
import { Room } from '../world/Room.js';
import { generateFloor } from '../world/FloorGenerator.js';
import { pickLayout, setLayoutChapter } from '../world/Layouts.js';
import { Player } from '../entities/Player.js';
import { Projectiles } from '../entities/Projectiles.js';
import { Pickups } from '../entities/Pickups.js';
import { Bombs } from '../entities/Bombs.js';
import { EnemyManager } from '../enemies/EnemyManager.js';
import { Hud } from '../ui/Hud.js';
import { TouchControls } from '../ui/TouchControls.js';
import { CHAPTERS } from '../data/palettes.js';
import { SIM, DEBUG, TRANSITION, PLAYER, FEEL } from '../data/config.js';
import { RELICS, RELIC_IDS, ROOM_DROPS, BOSS_DROPS, PRICES, SHOP_GOODS } from '../data/items.js';
import { BOSS_FX, BOSS_ROSTER, bossHome } from '../data/bosses.js';
import { enemyScale, bossScale, EARLY_BOSS_LIMIT } from '../data/difficulty.js';
import { OMENS, OMEN_IDS, OMEN_CHANCE, OMEN_FX } from '../data/omens.js';
import { Familiars } from '../items/Familiars.js';
import { DamageNumbers } from '../ui/DamageNumbers.js';
import { COMBAT } from '../data/config.js';
import { tickSets, setsOnFloorStart } from '../items/Sets.js';
import { FEATURES, SPECIAL_LAYOUTS } from '../data/rooms/specialLayouts.js';
import { PAGE_DROP_CHANCE, ALTAR, ACTIVE } from '../data/items.js';
import { PERKS, onEnemyKilled, onRoomCleared, onFloorStart, trySecondWind } from '../items/Perks.js';
import { shufflePotions, useConsumable, randomCurio, nextPage, curioInfo } from '../items/Curios.js';
import { SEALS } from '../data/curios.js';
import { CHARACTERS, CHARACTER_IDS } from '../data/characters.js';
import { COLLECTION_TABS } from '../ui/Collection.js';
import { CHAPTER_INFO, chapterForFloor, floorInChapter, floorSize, LAST_NORMAL_FLOOR, THRONE_FLOOR } from '../data/chapters.js';

// The Game owns every system and runs the main loop:
//   input -> update the current STATE -> sync visuals -> render
//
// States:
//   'title'     title screen (the start room glows behind it)
//   'play'      playing (or sliding between rooms)
//   'bossIntro' the boss title card; nothing moves
//   'dead'      Wren has fallen; the death screen appears after a moment
//   'victory'   the Mad King is beaten (or the Hollow Crown is broken: the true ending)
//   'collection' the collection page (from the title screen)
//
// The simulation uses the real frame time (clamped), so it is smooth on 60, 120 and 144 Hz screens.

const POOL_FOR_ROOM = { armoury: 'armoury', boss: 'boss', secret: 'secret', supersecret: 'secret', merchant: 'merchant', shrine: 'shrine', chapel: 'chapel' };
const SHRINE_INFO = { name: 'The Old God Stirs', flavour: 'A door has opened. It wants something of yours.' };
const CHAPEL_INFO = { name: 'A Chapel Remains', flavour: 'A door has opened. Something holy endured down here.' };
const SEALS_INFO = { name: 'The Seals Burn Bright', flavour: 'Bone, flame and thorn. The last door opens.' };
const SEALED_INFO = { name: 'A Door With Three Hollows', flavour: 'Bone, flame and thorn. Something waits beyond it.' };

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function weightedKey(rng, weights) {
  let total = 0;
  for (const k in weights) total += weights[k];
  let r = rng.next() * total;
  for (const k in weights) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return Object.keys(weights)[0];
}

export class Game {
  constructor() {
    Save.load();
    this.renderer = new Renderer();
    this.input = new Input();
    this.touch = new TouchControls(this.input);
    this.input.touch = this.touch;
    this.touch.onTap = (fx, fy) => this._menuTap(fx, fy);
    this.feel = new Feel();
    this.audio = new Audio();
    this.chapterKey = 'cells';
    this.chapterInfo = CHAPTER_INFO.cells;
    this.renderer.setGrade(this.chapterInfo.grade);
    this.lighting = new Lighting(this.renderer.scene, this.chapterInfo.ambient);
    this.particles = makeParticleSystems(this.renderer.scene, this.lighting);
    this.effects = new Effects(this.particles, { x0: 0, y0: 0, x1: 1, y1: 1 });
    this.projectiles = new Projectiles(this);
    this.enemies = new EnemyManager(this);
    this.pickups = new Pickups(this);
    this.bombs = new Bombs(this);
    this.familiars = new Familiars(this);
    this.damageNumbers = new DamageNumbers();
    this.hitStopCool = 0;
    this.warBanner = null; // { x, y, t, room } while a War Banner stands
    this.hud = new Hud(this.renderer.hudCanvas, this.renderer.hudTexture);

    this.paused = false;
    this.time = 0;
    this.debug = false;
    this.debugReveal = false;
    this.fps = { frames: 0, acc: 0, value: 0 };
    this.lastTime = 0;
    this.room = null;
    this.nextRoom = null; // the room we're sliding into
    this.transition = null;
    this.lockTimer = 0;
    this.deathTimer = 0;
    this.introT = 0;
    this.fade = 0;
    this.descending = null; // { t, done }
    this.floorTitleT = 0;
    this.bossRewardT = 0;
    this.victoryT = 0;
    this.seedEntry = null; // string while typing a seed on the title screen

    // the starting heroes are always available
    for (const [id, c] of Object.entries(CHARACTERS)) if (c.starter && !Save.data.unlocks.characters.includes(id)) Save.data.unlocks.characters.push(id);
    // which character the next run uses (the last one picked, if it's still unlocked)
    const saved = Save.data.settings.character;
    this.characterId = saved && Save.data.unlocks.characters.includes(saved) ? saved : 'wren';
    this.unlockNotice = null;
    this.collection = { tab: 0, cursor: 0 };

    // the title screen shows a fresh start room behind it
    const urlSeed = normaliseSeed(new URLSearchParams(location.search).get('seed'));
    this.pendingSeed = urlSeed;
    this.state = 'title';
    this._buildRun(urlSeed || randomSeedString());

    window.addEventListener('keydown', (e) => this._seedTyping(e));
    window.addEventListener('blur', () => {
      if (this.state === 'play') this.setPaused(true);
    });
    window.addEventListener('beforeunload', () => Save.write());
    this._frame = this._frame.bind(this);
  }

  // ------------------------------------------------------------------------------------------
  // Runs and floors
  // ------------------------------------------------------------------------------------------

  /** Set up a run from a seed (everything random in the run comes from it). */
  _buildRun(seed) {
    this.seed = seed;
    this.rng = rngFromSeed(seed);
    this.floorNumber = 1;
    this.inVault = false; // on the hidden floor under the rug
    this.runTime = 0;
    this.offered = new Set(); // relics already shown this run (no duplicates)
    this.potionLooks = shufflePotions(this.rng.fork('potions')); // which colour hides which potion
    this.potionsKnown = new Set();
    this.darkDeal = false; // took a deal at a Shrine of the Old God (then no Chapel will open)
    this.sealsGiven = new Set(); // Seal Fragments already handed out this run
    this.vaultVisited = false;
    this.bossesUsed = new Set(); // bosses already met this run (no repeats)
    this.ending = 'king';
    this.slowTime = 0;
    if (this.player) this.player.dispose();
    this.player = null;
    this.startFloor();
  }

  /** Start playing a new run (from the title, the death screen or the pause menu). */
  startRun(seed) {
    if (!Save.data.unlocks.characters.includes(this.characterId)) this.characterId = 'wren';
    Save.data.settings.character = this.characterId;
    this.unlockNotice = null;
    this.descending = null; // never carry a half-finished descent into a new run
    this.fade = 0;
    this.victoryT = 0;
    this.bossRewardT = 0;
    this._buildRun(seed);
    Save.data.stats.runsStarted++;
    Save.write();
    this.state = 'play';
    this.deathTimer = 0;
    this.floorTitleT = 2.2;
    this.hud.markDirty();
    console.info(`Below the Keep - run seed ${seed}`);
  }

  /** Generate the current floor and put Wren in its start room. */
  startFloor() {
    this._clearRooms();
    this.enemies.clear();
    this.pickups.clear();
    this.bombs.clear();
    this.projectiles.clear();
    for (const k in this.particles) this.particles[k].clear();
    // each floor gets its own generators, derived from the run seed
    // which chapter: its tiles, light, colours, air, creatures and bosses
    this._setChapter(this.inVault ? 'vault' : chapterForFloor(this.floorNumber));
    const tag = this.inVault ? 'vault' : this.floorNumber;
    const floorRng = this.rng.fork(`floor${tag}`);
    this.dropRng = this.rng.fork(`drops${tag}`);
    setLayoutChapter(this.chapterKey, this._rollFeatures(this.rng.fork(`features${tag}`)));
    this.omen = this._rollOmen(this.rng.fork(`omen${tag}`));
    if (this.omen === 'darkness') this.lighting.setAmbient({ color: this.chapterInfo.ambient.color, level: this.chapterInfo.ambient.level * OMEN_FX.darknessAmbient });
    const size = floorSize(this.chapterKey, this.floorNumber) + (this.omen === 'maze' ? OMEN_FX.mazeExtraSize : 0);
    this.floor = generateFloor(floorRng, this.floorNumber, pickLayout, size);
    if (this.player) this.player.martyrStacks = 0;
    this.warBanner = null;
    if (this.inVault) this.vaultVisited = true;
    this._prepareAltar();
    this.floorBoss = this._drawBoss(this.rng.fork(`boss${tag}`));
    this.tookDamageThisFloor = false;
    const f = this.floor;
    const mainCells = f.rooms.filter((r) => r.type !== 'secret' && r.type !== 'supersecret').reduce((n, r) => n + r.cells.length, 0);
    console.info(
      `Floor ${f.number}: ${mainCells} room cells (target ${f.targetRooms}), ${f.rooms.length} rooms incl. secrets, ` +
        `${f.rooms.filter((r) => r.cells.length > 1).length} large, generated in ${f.attempts} attempt(s)`,
    );
    const start = f.rooms[f.startId];
    this.room = this._makeRoom(start);
    const c = this.room.slotCenter(7, 5);
    if (!this.player) {
      this.player = new Player(this, c.x, c.y);
      this.projectiles.setStyle(this.player.character.weapon); // spell bolts for a wizard, stones for the rest
    }
    this.player.x = c.x;
    this.player.y = c.y;
    this.player.vx = this.player.vy = 0;
    this._snapCamera();
    this.onEnteredRoom();
    onFloorStart(this);
    setsOnFloorStart(this);
    this.familiars.warp();
  }

  /** Now and then a floor is cursed (data/omens.js). */
  _rollOmen(rng) {
    if (this.floorNumber < 2 || this.chapterKey === 'throne' || this.chapterKey === 'vault') return null;
    if (!rng.chance(OMEN_CHANCE)) return null;
    return OMEN_IDS[Math.floor(rng.next() * OMEN_IDS.length)];
  }

  get omenInfo() {
    return this.omen ? OMENS[this.omen] : null;
  }

  /** Which secret feature rooms this floor gets (puzzle, library, well, rug). */
  _rollFeatures(rng) {
    if (this.chapterKey === 'throne' || this.chapterKey === 'vault') return [];
    const out = [];
    for (const [name, f] of Object.entries(FEATURES)) {
      if (f.minFloor && this.floorNumber < f.minFloor) continue;
      if (f.maxFloor && this.floorNumber > f.maxFloor) continue;
      if (name === 'feature_rug' && this.vaultVisited) continue;
      if (rng.chance(f.chance)) out.push(name);
    }
    return rng.shuffle(out);
  }

  /** On the throne floor the sealed room beside the Mad King is the Crown Chamber, behind a visible sealed door. */
  _prepareAltar() {
    const altar = this.floor.rooms.find((r) => r.type === 'altar');
    if (!altar || this.chapterKey !== 'throne') return;
    altar.type = 'crown';
    for (const c of altar.cells) altar.layouts.set(`${c.x},${c.y}`, SPECIAL_LAYOUTS.crown.name);
    for (const conn of altar.connections) {
      conn.hidden = false;
      conn.locked = true; // shown as a locked door; only the three Seals open it
    }
  }

  /** After a boss: maybe the sealed altar opens - a Shrine of the Old God, or a Chapel. */
  _maybeOpenAltar() {
    const altar = this.floor.rooms.find((r) => r.type === 'altar');
    if (!altar) return;
    const chance = ALTAR.baseChance + (this.tookDamageThisFloor ? 0 : ALTAR.noDamageBonus);
    if (!this.dropRng.chance(chance)) return;
    const type = this.darkDeal || this.dropRng.chance(0.5) ? 'shrine' : 'chapel';
    altar.type = type;
    for (const c of altar.cells) altar.layouts.set(`${c.x},${c.y}`, SPECIAL_LAYOUTS[type].name);
    for (const conn of altar.connections) {
      conn.hidden = false;
      conn.sealed = false;
    }
    this.audio.play('secret');
    this.audio.play(type === 'shrine' ? 'roar' : 'holy', 0.6);
    this.hud.banner(type === 'shrine' ? SHRINE_INFO : CHAPEL_INFO);
    this.rebuildCurrentRoom();
  }

  /** The Mad King is dead. With all three Seals, the door in his throne room opens. */
  _throneCleared() {
    const p = this.player;
    this.unlockCharacter('witch');
    const crown = this.floor.rooms.find((r) => r.type === 'crown');
    if (crown && p.seals.every(Boolean)) {
      for (const conn of crown.connections) {
        conn.locked = false;
        conn.sealed = false;
      }
      this.audio.play('gong', 1);
      this.audio.play('secret');
      this.hud.banner(SEALS_INFO);
      this.feel.shake(0.6);
      this.rebuildCurrentRoom();
    } else {
      this.victoryT = 3.2;
    }
  }

  /** Is this blow a critical hit? (luck helps) */
  rollCrit() {
    return Math.random() < COMBAT.critChance + 0.02 * Math.max(0, this.player.stats.luck);
  }

  /** The feel of a landed blow: a tiny freeze, a number, and for a crit a gold flash. */
  combatFeedback(enemy, dmg, crit) {
    if (COMBAT.damageNumbers && dmg > 0) this.damageNumbers.add(enemy.x, enemy.y + (enemy.sprite.def.frameH - enemy.look.anchorY) * 0.6, dmg, crit);
    if (crit) {
      this.feel.hitStop(COMBAT.critHitStop);
      this.feel.shake(0.12);
      this.effects.burst(this.effects.presets.gold, enemy.x, enemy.y, 12, 12, 90, 60);
      this.audio.play('crit');
    } else if (this.hitStopCool <= 0) {
      this.feel.hitStop(COMBAT.hitStop);
      this.hitStopCool = 0.06;
    }
  }

  /** Hooks for relic perks. */
  onEnemyKilled(e) {
    onEnemyKilled(this, e);
  }

  /** A new character can be chosen on the title screen. */
  unlockCharacter(id) {
    const list = Save.data.unlocks.characters;
    if (list.includes(id)) return;
    list.push(id);
    Save.write();
    this.unlockNotice = id;
  }

  /** Build a room's graphics and, if it hasn't been cleared yet, its enemies. */
  _makeRoom(data) {
    const room = new Room(this, this.floor, data, this.seed);
    if (!data.cleared) this.enemies.spawnRoom(room);
    this.pickups.restoreRoom(room);
    return room;
  }

  _clearRooms() {
    if (this.room) this.room.dispose();
    if (this.nextRoom) this.nextRoom.dispose();
    this.room = null;
    this.nextRoom = null;
    this.transition = null;
    this.lockTimer = 0;
  }

  _snapCamera() {
    const t = this.room.cameraTarget(this.player.x, this.player.y);
    this.renderer.lookAt(t.x, t.y);
  }

  _setChapter(key) {
    this.chapterKey = key;
    const info = (this.chapterInfo = CHAPTER_INFO[key]);
    this.renderer.setGrade(info.grade);
    this.lighting.setAmbient(info.ambient);
    this.effects.setAtmosphere(info.atmosphere);
    setLayoutChapter(key);
  }

  /** The boss that guards the current floor: drawn at random, except on the throne and in the Vault. */
  bossForFloor() {
    if (this.chapterKey === 'throne' || this.chapterKey === 'vault') return this.chapterInfo.bosses[0];
    return this.floorBoss;
  }

  _drawBoss(rng) {
    if (this.chapterKey === 'throne' || this.chapterKey === 'vault') return this.chapterInfo.bosses[0];
    // early floors only draw from the gentler bosses (EARLY_BOSS_LIMIT); later, anything goes
    const limit = EARLY_BOSS_LIMIT[this.floorNumber] || 99;
    const allowed = BOSS_ROSTER.filter((b) => bossHome(b) <= limit);
    let pool = allowed.filter((b) => !this.bossesUsed.has(b));
    if (!pool.length) pool = allowed;
    const b = pool[Math.floor(rng.next() * pool.length)];
    this.bossesUsed.add(b);
    return b;
  }

  /** How much tougher an enemy is on this floor (see data/difficulty.js). */
  scaleFor(e) {
    if (e.isBoss) return bossScale(this.floorNumber, bossHome(e.type));
    return enemyScale(this.floorNumber);
  }

  /** "The Catacombs II", "The Throne of the Mad King"... */
  get floorName() {
    const ROMAN = ['I', 'II', 'III'];
    if (this.chapterKey === 'throne' || this.chapterKey === 'vault') return this.chapterInfo.name;
    return `${this.chapterInfo.name} ${ROMAN[floorInChapter(this.floorNumber) - 1]}`;
  }

  /** Step onto a trapdoor: fade out, build the next floor, fade in. */
  descend(toVault = false) {
    if (this.descending || this.state !== 'play') return;
    this.descending = { t: 0, done: false, toVault };
    this.audio.play('descend');
  }

  _updateDescend(dt) {
    const d = this.descending;
    d.t += dt;
    this.fade = d.t < 0.6 ? d.t / 0.6 : Math.max(0, 1 - (d.t - 0.6) / 0.6);
    if (!d.done && d.t >= 0.6) {
      d.done = true;
      if (d.toVault) this.inVault = true;
      else if (this.inVault) this.inVault = false; // the vault's trapdoor leads on to the next floor
      if (!d.toVault) this.floorNumber = Math.min(THRONE_FLOOR, this.floorNumber + 1);
      this.startFloor();
      this.floorTitleT = 2.4;
    }
    if (d.t >= 1.2) {
      this.descending = null;
      this.fade = 0;
    }
  }

  // ------------------------------------------------------------------------------------------
  // Items, drops and shops (all choices use the run's seeded generators)
  // ------------------------------------------------------------------------------------------

  /** Choose a relic for a room's pedestal from its pool. Never repeats within a run. */
  pickRelic(roomType, rng) {
    const pool = POOL_FOR_ROOM[roomType] || 'armoury';
    const weights = {};
    let any = false;
    for (const id of RELIC_IDS) {
      const w = (RELICS[id].pools || {})[pool];
      if (!w || this.offered.has(id) || (this.player && this.player.hasRelic(id))) continue;
      weights[id] = w;
      any = true;
    }
    if (!any) return null;
    const id = weightedKey(rng, weights);
    this.offered.add(id);
    return id;
  }

  /** What one of the merchant's stands sells. Slot 0 is a relic. */
  stockShopSlot(i, rng) {
    if (i === 0) {
      const id = this.pickRelic('merchant', rng);
      if (id) return { kind: 'relic', id, price: PRICES.relic, gone: false };
    }
    const id = weightedKey(rng, SHOP_GOODS);
    if (id === 'scroll' || id === 'potion' || id === 'trinket') return { kind: 'curio', item: randomCurio(rng, id), price: PRICES[id], gone: false };
    return { kind: 'pickup', id, price: PRICES[id], gone: false };
  }

  /** Roll `count` pickups from a drop table and pop them out at (x, y). Luck makes 'none' rarer. */
  dropFrom(table, x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      const weights = { ...table };
      if (weights.none) weights.none = Math.max(0, weights.none - this.player.stats.luck * 5);
      const kind = weightedKey(this.dropRng, weights);
      if (kind === 'curio') {
        // a trinket, scroll or potion
        const r = this.dropRng.next();
        this.pickups.spawn(this.room, 'curio', x, y, true, randomCurio(this.dropRng, r < 0.25 ? 'trinket' : r < 0.6 ? 'scroll' : 'potion'));
      } else if (kind !== 'none') {
        this.pickups.spawn(this.room, kind, x, y);
        // the Bottomless Purse: sometimes it comes twice
        if (this.player.perks.doubleDrops && !kind.includes('chest') && this.dropRng.chance(0.35)) this.pickups.spawn(this.room, kind, x, y);
      }
    }
  }

  // ------------------------------------------------------------------------------------------
  // Rooms: entering, doors, combat lock
  // ------------------------------------------------------------------------------------------

  /** Mark rooms as visited / seen for the minimap and decide whether this room locks. */
  onEnteredRoom() {
    const data = this.room.data;
    if (this.player) this.player.shieldReady = true; // the Saint's Shroud is ready again
    this.familiars.warp();
    data.visited = true;
    data.seen = true;
    this._revealNeighbours(this.room);
    this.effects.bounds = this.room.bounds;
    if (!data.cleared) {
      if ((data.type === 'boss' || data.type === 'crown') && this.room.enemiesAlive > 0) {
        // boss title card: doors slam at once, nothing moves until it ends
        this.room.locked = true;
        this.audio.play('doorSlam');
        this.audio.play('roar');
        this.state = this.state === 'title' ? 'title' : 'bossIntro';
        this.introT = BOSS_FX.introTime;
      } else if (this.room.enemiesAlive > 0) this.lockTimer = TRANSITION.lockDelay;
      else data.cleared = true;
    }
    this.hud.markDirty();
  }

  _revealNeighbours(room) {
    for (const conn of room.data.connections) {
      if (conn.hidden) continue;
      const other = this.floor.rooms[conn.a === room.data.id ? conn.b : conn.a];
      other.seen = true;
    }
  }

  _checkDoors() {
    const p = this.player;
    for (const door of this.room.doors) {
      if (!door.playerTouching(p, PLAYER.radius)) continue;
      const s = door.state;
      if (s === 'open') {
        this._startTransition(door);
        return;
      }
      if (s === 'hidden' && door.conn.illusory && !this.room.locked) {
        // it was never really there
        door.conn.hidden = false;
        door.conn.illusory = false;
        this.audio.play('secret');
        Save.data.stats.secretsFound++;
        this._startTransition(door);
        return;
      }
      if (s === 'locked' && door.conn.sealed) {
        this.hud.setHover(SEALED_INFO, 0);
        continue;
      }
      if (s === 'locked' && p.keys > 0 && !this.room.locked) {
        // the Gaoler's Ring / Rusted Key sometimes saves the key
        if (!(p.perks.keySaver && this.dropRng.chance(PERKS.keySaverChance))) p.keys--;
        door.conn.locked = false;
        this.audio.play('unlock');
        const f = door.frontPoint();
        this.effects.doorDust(f.x, f.y, 10);
        this.hud.markDirty();
      }
    }
  }

  _startTransition(door) {
    const target = this.floor.rooms[door.targetId];
    const next = this._makeRoom(target);
    const entry = next.doors.find((d) => d.conn === door.conn);
    const p = entry.entryPoint(TRANSITION.entryInset);
    this.player.x = p.x;
    this.player.y = p.y;
    this.player.vx = this.player.vy = 0;
    this.projectiles.clear();
    this.bombs.clear();
    this.lockTimer = 0;
    const from = this.renderer.cameraBase.clone();
    const to = next.cameraTarget(p.x, p.y);
    this.nextRoom = next;
    this.transition = { t: 0, fromX: from.x, fromY: from.y, toX: to.x, toY: to.y };
    this.effects.bounds = next.bounds;
  }

  _updateTransition(dt) {
    const tr = this.transition;
    tr.t += dt;
    const k = smoothstep(Math.min(1, tr.t / TRANSITION.duration));
    this.renderer.lookAt(tr.fromX + (tr.toX - tr.fromX) * k, tr.fromY + (tr.toY - tr.fromY) * k);
    this.room.update(dt);
    this.nextRoom.update(dt);
    if (k >= 1) {
      this.room.dispose();
      this.room = this.nextRoom;
      this.nextRoom = null;
      this.transition = null;
      this.onEnteredRoom();
    }
  }

  _updateLock(dt) {
    const room = this.room;
    if (this.lockTimer > 0) {
      this.lockTimer -= dt;
      if (this.lockTimer <= 0) {
        room.locked = true;
        this.audio.play('doorSlam');
        this.feel.shake(FEEL.doorSlamShake);
        this._doorDust(room);
      }
    }
    if (room.locked && room.enemiesAlive === 0 && !room.onCleared()) {
      room.locked = false;
      room.data.cleared = true;
      this.audio.play('doorOpen');
      this._doorDust(room);
      this.hud.markDirty();
      this.player.chargeActive(1);
      onRoomCleared(this);
      this.familiars.onRoomCleared();
      // the Dead Man's Hand: sometimes a chest appears
      if (this.player.perks.chestOnClear && room.data.type !== 'boss' && this.dropRng.chance(0.25)) {
        const cell = room.data.cells[0];
        const cc = room.slotCenter((cell.x - room.data.minX) * 15 + 7, (cell.y - room.data.minY) * 10 + 5);
        this.pickups.spawn(room, this.dropRng.chance(0.2) ? 'ironchest' : 'chest', cc.x + 30, cc.y);
      }
      if (room.data.type === 'boss') {
        Save.data.stats.bossesBeaten++;
        Save.write();
        if (this.chapterKey === 'throne') this._throneCleared(); // the Mad King falls
        else {
          this.bossRewardT = 1.4; // let the death animation play first
        }
      } else if (room.data.type === 'crown') {
        // the Hollow Crown is broken: the true ending
        this.ending = 'crown';
        this.unlockCharacter('ghost');
        this.victoryT = 3.2;
      } else {
        // a cleared room may drop something in its middle
        const cell = room.data.cells[0];
        const c = room.slotCenter((cell.x - room.data.minX) * 15 + 7, (cell.y - room.data.minY) * 10 + 5);
        this.dropFrom(ROOM_DROPS, c.x, c.y, 1);
        const page = this.dropRng.chance(PAGE_DROP_CHANCE) ? nextPage() : null;
        if (page) this.pickups.spawn(room, 'curio', c.x, c.y, true, page);
      }
    }
    if (this.victoryT > 0) {
      this.victoryT -= dt;
      if (this.victoryT <= 0) this.win();
    }
    if (this.bossRewardT > 0) {
      this.bossRewardT -= dt;
      if (this.bossRewardT <= 0) {
        this._maybeOpenAltar(); // (may rebuild the room, so use this.room from here on)
        const room = this.room;
        room.addBossRewards();
        const c = room.slotCenter(7, 4);
        this.dropFrom(BOSS_DROPS, c.x + 30, c.y, 1);
        this.effects.relicBurst(c.x, c.y);
        this.audio.play('relic');
      }
    }
  }

  /** The run is won. */
  win() {
    if (this.state !== 'play') return;
    this.state = 'victory';
    Save.data.stats.victories++;
    Save.write();
    this.audio.play('victory');
  }

  _doorDust(room) {
    for (const d of room.doors) {
      if (d.state === 'hidden') continue;
      const f = d.frontPoint();
      this.effects.doorDust(f.x, f.y, 8);
    }
  }

  _checkHazards() {
    const p = this.player;
    const r = PLAYER.radius;
    for (const h of this.room.hazards) {
      const cx = Math.max(h.x0, Math.min(p.x, h.x1));
      const cy = Math.max(h.y0, Math.min(p.y, h.y1));
      if ((p.x - cx) ** 2 + (p.y - cy) ** 2 < r * r) {
        p.hurt(h.damage, (h.x0 + h.x1) / 2, (h.y0 + h.y1) / 2, 'Floor Spikes');
        return;
      }
    }
  }

  // ------------------------------------------------------------------------------------------
  // Main loop
  // ------------------------------------------------------------------------------------------

  setPaused(p) {
    if (this.paused === p) return;
    this.paused = p;
    this.hud.markDirty();
    this.touch.setPaused(p);
    if (p) Save.write();
  }

  start() {
    requestAnimationFrame(this._frame);
  }

  _frame(now) {
    requestAnimationFrame(this._frame);
    const t = now / 1000;
    const rawDt = this.lastTime ? t - this.lastTime : 1 / 60;
    this.lastTime = t;
    const dt = Math.min(rawDt, SIM.maxDt);

    this._debugStats(rawDt);
    this.input.update();
    this._handleMenuInput();

    if (!this.paused) {
      const frozen = this.feel.update(dt); // hit-stop freezes the world for a few frames
      if (!frozen) this._updateState(dt);
      this._updateAmbient(dt);
      Save.data.stats.playSeconds += dt;
    }

    // visuals
    this.player.sync();
    this.room.sync();
    if (this.nextRoom) this.nextRoom.sync();
    this.projectiles.sync();
    this.familiars.sync();
    this.pickups.sync();
    this.bombs.sync();
    this.enemies.sync(this.time);
    for (const k in this.particles) this.particles[k].sync();
    this.hud.tick(rawDt, this);
    this.hud.draw(this);
    this.renderer.render(this.paused ? 0 : this.feel.shakeX, this.paused ? 0 : this.feel.shakeY);
  }

  _updateState(dt) {
    if (this.floorTitleT > 0) this.floorTitleT -= dt;
    if (this.descending) {
      this._updateDescend(dt);
      return;
    }
    switch (this.state) {
      case 'title':
      case 'victory':
      case 'collection':
        this.room.update(dt);
        break;
      case 'bossIntro':
        this.room.update(dt);
        this.introT -= dt;
        if (this.introT <= 0) this.state = 'play';
        break;
      case 'dead':
        this.deathTimer += dt;
        this._simulate(dt); // the world carries on behind the death screen
        break;
      default:
        this.runTime += dt;
        if (this.transition) this._updateTransition(dt);
        else this._simulate(dt);
    }
  }

  _simulate(dt) {
    this.player.update(dt, this.input, this.room);
    // the Hourglass of Grey Sand slows everything but Wren
    let edt = dt;
    if (this.slowTime > 0) {
      this.slowTime -= dt;
      edt = dt * ACTIVE.hourglass.scale;
    }
    this.enemies.update(edt);
    this.familiars.update(dt);
    this.damageNumbers.update(dt);
    if (this.hitStopCool > 0) this.hitStopCool -= dt;
    tickSets(this, dt);
    if (this.warBanner) {
      this.warBanner.t -= dt;
      if (this.warBanner.t <= 0 || this.warBanner.room !== this.room) this.warBanner = null;
    }
    this.projectiles.update(dt, this.room);
    this.pickups.update(dt);
    this.bombs.update(dt);
    this.room.update(dt);
    if (this.state === 'play') {
      if (this.player.dead && trySecondWind(this)) {
        // the Phoenix Feather burns, and Wren gets back up
      } else if (this.player.dead) {
        this.state = 'dead';
        this.deathTimer = 0;
        Save.data.stats.deaths++;
        Save.write();
        this.audio.play('death');
      } else {
        this._checkHazards();
        this._updateLock(dt);
        if (!this.transition) this._checkDoors();
      }
    }
    // the camera follows Wren inside big rooms (and stays put in 1x1 rooms)
    if (!this.transition) this._snapCamera();
  }

  /** Which music fits this moment (see data/music.js). */
  _updateMusic() {
    let m = this.chapterKey;
    if (this.state === 'title' || this.state === 'collection') m = 'title';
    else if (this.state === 'victory') m = 'victory';
    else if (this.state === 'dead') m = 'death';
    else {
      const boss = this.enemies.boss;
      if (boss) m = boss.type === 'madking' || boss.type === 'crownwraith' ? 'finalBoss' : 'boss';
    }
    this.audio.music(m);
  }

  _updateAmbient(dt) {
    this.time += dt;
    this._updateMusic();
    this.effects.update(dt);
    for (const k in this.particles) this.particles[k].update(dt, this.time);
    this.lighting.update(this.time);
  }

  // ------------------------------------------------------------------------------------------
  // Menus and buttons
  // ------------------------------------------------------------------------------------------

  /** A touch tap anywhere: confirms menus. Returns true if it was used. */
  _menuTap(fx = 0.5, fy = 0.5) {
    if (this.state === 'collection') {
      // a tap flips the page; past the last page, back to the title
      if (this.collection.tab < COLLECTION_TABS.length - 1) this.collection.tab++;
      else this.state = 'title';
      this.collection.cursor = 0;
      this.hud.markDirty();
      return true;
    }
    if (this.state === 'title') {
      // tap the sides to change character, the bottom for the collection, anywhere else to begin
      if (fy > 0.84) this._openCollection();
      else if (fx < 0.22) this._cycleCharacter(-1);
      else if (fx > 0.78) this._cycleCharacter(1);
      else this._beginFromTitle();
      return true;
    }
    if ((this.state === 'dead' && this.deathTimer > 1.6) || this.state === 'victory') {
      this.startRun(randomSeedString());
      return true;
    }
    return false;
  }

  _seedTyping(e) {
    if (this.state !== 'title' || this.seedEntry === null) return;
    if (/^[a-zA-Z0-9]$/.test(e.key) && this.seedEntry.length < 8) this.seedEntry += e.key.toUpperCase();
    else if (e.key === 'Backspace') this.seedEntry = this.seedEntry.slice(0, -1);
    this.hud.markDirty();
  }

  _handleMenuInput() {
    const input = this.input;

    if (this.state === 'title') {
      if (this.seedEntry !== null) {
        if (input.pressed('confirm')) {
          const s = normaliseSeed(this.seedEntry);
          if (s) {
            this.seedEntry = null;
            this.startRun(s);
          } else this.audio.play('deny');
        }
        if (input.pressed('pause')) this.seedEntry = null;
        return;
      }
      if (input.pressed('confirm')) this._beginFromTitle();
      if (input.pressed('seed')) this.seedEntry = '';
      if (input.pressed('left') || input.pressed('shootLeft')) this._cycleCharacter(-1);
      if (input.pressed('right') || input.pressed('shootRight')) this._cycleCharacter(1);
      if (input.pressed('collection')) this._openCollection();
      return;
    }

    if (this.state === 'collection') {
      const c = this.collection;
      if (input.pressed('pause') || input.pressed('collection')) this.state = 'title';
      if (input.pressed('tab')) {
        c.tab = (c.tab + 1) % COLLECTION_TABS.length;
        c.cursor = 0;
      }
      const tab = COLLECTION_TABS[c.tab];
      const n = tab.count();
      const cols = tab.cols;
      const move = (d) => {
        c.cursor = Math.max(0, Math.min(n - 1, c.cursor + d));
        this.audio.play('land', 0.3);
      };
      if (input.pressed('left') || input.pressed('shootLeft')) move(-1);
      if (input.pressed('right') || input.pressed('shootRight')) move(1);
      if (input.pressed('up') || input.pressed('shootUp')) move(-cols);
      if (input.pressed('down') || input.pressed('shootDown')) move(cols);
      this.hud.markDirty();
      return;
    }

    if (this.state === 'dead' || this.state === 'victory') {
      const ready = this.state === 'victory' || this.deathTimer > 1.6;
      if (ready && (input.pressed('newRun') || input.pressed('confirm'))) this.startRun(randomSeedString());
      if (ready && input.pressed('pause')) this._toTitle();
      return;
    }

    if (input.pressed('pause')) this.setPaused(!this.paused);
    if (this.paused) {
      if (input.pressed('newRun')) {
        this.setPaused(false);
        this.startRun(randomSeedString());
      }
      if (input.pressed('quitTitle')) {
        this.setPaused(false);
        this._toTitle();
      }
      return;
    }

    if (this.state === 'play' && !this.transition && !this.descending) {
      if (input.pressed('bomb')) this.bombs.place();
      if (input.pressed('active')) this.player.tryUseActive();
      if (input.pressed('consumable')) useConsumable(this);
      if (input.pressed('dodge')) this.player.tryRoll(this.input);
    }

    if (input.pressed('debug')) {
      this.debug = !this.debug;
      this.hud.debugText = null;
      this.hud.markDirty();
    }
    if (input.pressed('debugLights')) sharedUniforms.uLightOnly.value = 1 - sharedUniforms.uLightOnly.value;
    if (input.pressed('debugMap')) {
      this.debugReveal = !this.debugReveal;
      this.hud.markDirty();
    }
    if (input.pressed('debugSecrets') && !this.transition) {
      // a free blast at every secret wall in this room (handy for testing)
      for (const d of this.room.doors) {
        if (!d.conn.hidden) continue;
        const f = d.entryPoint(4);
        this.bombs.explode(f.x, f.y, false);
        break;
      }
    }
    if (input.pressed('debugFloor') && !this.transition && this.state === 'play') {
      this.floorNumber++;
      this.startFloor();
      this.floorTitleT = 2.2;
    }
  }

  /** Title screen: begin a run with the chosen character (if they're unlocked). */
  _beginFromTitle() {
    if (!Save.data.unlocks.characters.includes(this.characterId)) {
      this.audio.play('deny');
      return;
    }
    this.startRun(this.pendingSeed || randomSeedString());
  }

  _cycleCharacter(d) {
    const i = CHARACTER_IDS.indexOf(this.characterId);
    this.characterId = CHARACTER_IDS[(i + d + CHARACTER_IDS.length) % CHARACTER_IDS.length];
    this.audio.play('land', 0.4);
    // rebuild the run behind the title so the right character stands in the start room
    if (Save.data.unlocks.characters.includes(this.characterId)) this._buildRun(this.seed);
    this.hud.markDirty();
  }

  _openCollection() {
    this.state = 'collection';
    this.collection.tab = 0;
    this.collection.cursor = 0;
    this.audio.play('buy', 0.5);
    this.hud.markDirty();
  }

  _toTitle() {
    this.descending = null;
    this.fade = 0;
    this.state = 'title';
    this.seedEntry = null;
    this._buildRun(randomSeedString());
    this.hud.markDirty();
  }

  /** Testing helper (browser console): game.debugEnterRoom(5) jumps straight into room 5. */
  debugEnterRoom(id) {
    this._clearRooms();
    const data = this.floor.rooms[id];
    this.room = this._makeRoom(data);
    // middle of the room's first cell (the middle of the bounding box may be outside an L shape)
    const cell = data.cells[0];
    const c = this.room.slotCenter((cell.x - data.minX) * 15 + 7, (cell.y - data.minY) * 10 + 5);
    this.player.x = c.x;
    this.player.y = c.y;
    this._snapCamera();
    this.onEnteredRoom();
  }

  /** Rebuild the room you're standing in (after a bomb opens a secret wall). */
  rebuildCurrentRoom() {
    const data = this.room.data;
    const old = this.room;
    this.room = new Room(this, this.floor, data, this.seed);
    this.room.locked = old.locked;
    this.enemies.reassign(old, this.room); // keep any fight going in the rebuilt room
    old.dispose(); // (remembers its pickups...)
    this.pickups.restoreRoom(this.room); // (...and puts them back)
    this._revealNeighbours(this.room);
    this.hud.markDirty();
  }

  _debugStats(rawDt) {
    const f = this.fps;
    f.frames++;
    f.acc += rawDt;
    if (f.acc >= DEBUG.fpsSampleTime) {
      f.value = Math.round(f.frames / f.acc);
      f.frames = 0;
      f.acc = 0;
      if (this.debug) {
        let parts = 0;
        for (const k in this.particles) parts += this.particles[k].activeCount;
        const r = this.renderer.stats;
        let lights = 0;
        for (const s of this.lighting.slots) if (s.active) lights++;
        this.hud.debugText = `FPS ${f.value}  CALLS ${r.calls}  PARTS ${parts}  LIGHTS ${lights}  ENEMIES ${this.enemies.count}  ROOM ${this.room.data.id} ${this.room.data.type.toUpperCase()}`;
        this.hud.markDirty();
      }
    }
  }
}
