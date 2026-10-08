import { ENEMIES } from '../data/enemies.js';
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
import { recordEcho, echoForFloor } from '../enemies/Echo.js';
import { CHAPTERS } from '../data/palettes.js';
import { SIM, DEBUG, TRANSITION, PLAYER, FEEL } from '../data/config.js';
import { RELICS, RELIC_IDS, ROOM_DROPS, BOSS_DROPS, PRICES, SHOP_GOODS } from '../data/items.js';
import { BOSS_FX, BOSS_ROSTER, bossHome } from '../data/bosses.js';
import { arenaFor } from '../data/rooms/shapedLayouts.js';
import { ROUTES, rollRoutes } from '../data/routes.js';
import { gatehouseFloor } from '../world/Gatehouse.js';
import { Beatrix } from '../world/Beatrix.js';
import { ENCOUNTER_IDS } from '../data/encounters.js';
import { PRISONERS, PRISONER_IDS, rescued } from '../data/prisoners.js';
import { EMBERS, rank } from '../data/embers.js';
import { enemyScale, bossScale, EARLY_BOSS_LIMIT, TIER_INFO, bossTier, DIFFICULTY } from '../data/difficulty.js';
import { OMENS, OMEN_IDS, OMEN_CHANCE, OMEN_FX } from '../data/omens.js';
import { Familiars } from '../items/Familiars.js';
import { DamageNumbers } from '../ui/DamageNumbers.js';
import { quality, BAD_LUCK_LIMIT } from '../data/quality.js';
import { WEAPON_DEFS, WEAPON_IDS, WEAPON_CHANCE } from '../data/weapons.js';
import { OATHS, heatOf, HEAT_RELIC_BIAS } from '../data/oaths.js';
import { Menus } from '../ui/Menus.js';
import { Cutscene } from '../ui/Cutscenes.js';
import { settingsOf } from '../data/settings.js';
import { preloadTextures } from '../render/Assets.js';
import { applySettings } from '../data/settings.js';
import { daily, submitDaily } from './Daily.js';
import { cleanName } from '../data/dailySeed.js';
import { COMBAT } from '../data/config.js';
import { tickSets, setsOnFloorStart } from '../items/Sets.js';
import { FEATURES, SPECIAL_LAYOUTS } from '../data/rooms/specialLayouts.js';
import { PAGE_DROP_CHANCE, ALTAR, ACTIVE } from '../data/items.js';
import { PERKS, onEnemyKilled, onRoomCleared, onFloorStart, trySecondWind } from '../items/Perks.js';
import { shufflePotions, useConsumable, randomCurio, nextPage, curioInfo } from '../items/Curios.js';
import { SEALS } from '../data/curios.js';
import { CHARACTERS, CHARACTER_IDS } from '../data/characters.js';
import { COLLECTION_TABS } from '../ui/Collection.js';
import { CHAPTER_INFO, chapterForFloor, floorInChapter, floorSize, LAST_NORMAL_FLOOR, THRONE_FLOOR, REALMS, realmForFloor, DEEP_LAST } from '../data/chapters.js';

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
    this.menus = new Menus(this);
    this.menus.reset('title');
    this.nameEntry = null; // { value, then } while typing a name for the Daily Descent board
    this.cutscene = null; // a story scene playing over everything (ui/Cutscenes.js)
    this.daily = null; // { date } during a Daily Descent run
    applySettings(this, Save);

    // the title screen shows a fresh start room behind it
    const urlSeed = normaliseSeed(new URLSearchParams(location.search).get('seed'));
    this.pendingSeed = urlSeed;
    this.state = 'title';
    this._buildRun(urlSeed || randomSeedString());

    window.addEventListener('keydown', (e) => this._seedTyping(e));
    // the mouse works in menus too: hover to point, click to choose
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || !this._menuOpen) return;
      const { fx, fy } = this.renderer.toPicture(e.clientX, e.clientY);
      this.menus.hover(fx, fy);
    });
    window.addEventListener('click', (e) => {
      if (!this._menuOpen || this.input.touchMode) return;
      const { fx, fy } = this.renderer.toPicture(e.clientX, e.clientY);
      this._menuTap(fx, fy, true);
    });
    window.addEventListener('blur', () => {
      if (this.state === 'play') this.setPaused(true);
    });
    // switching to another tab or app: pause, and go quiet until you're back
    document.addEventListener('visibilitychange', () => {
      const ctx = this.audio && this.audio.ctx;
      if (document.hidden) {
        if (this.state === 'play' && !this.paused) this.setPaused(true);
        if (ctx && ctx.state === 'running') ctx.suspend();
        Save.write();
      } else if (ctx && ctx.state === 'suspended') ctx.resume();
    });
    // the graphics device was reset (it happens on laptops and phones): say so, and offer a reload
    this.renderer.gl.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      Save.write();
      if (window.showTrouble) window.showTrouble('The graphics device was reset. Your unlocks and embers are saved - reload to carry on.');
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
    this.floorNumber = this.daily ? 1 : 0; // 0: the Gatehouse, home (the Daily Descent starts in the Keep)
    this.prisonerHere = null; // { roomId, id }: a prisoner in chains on this floor
    this.loreGiven = false;
    this.beatrixAnnounced = false;
    this.encountersSeen = new Set();
    this.omenOwed = false; // the Crown's Echo: its gift curses the next floor
    this.embersBanked = 0;
    this.prisonerFreed = null;
    this.inVault = false; // on the hidden floor under the rug
    this.runTime = 0;
    this.offered = new Set(); // relics already shown this run (no duplicates)
    this.potionLooks = shufflePotions(this.rng.fork('potions')); // which colour hides which potion
    this.potionsKnown = new Set();
    this.darkDeal = false; // took a deal at a Shrine of the Old God (then no Chapel will open)
    this.sealsGiven = new Set(); // Seal Fragments already handed out this run
    this.vaultVisited = false;
    this.route = null; // the road taken to this floor (data/routes.js)
    this.deep = false; // hunting the crown below the throne (floors 10-19)
    this.beyondT = 0;
    this.realm = null; // the secret realm we're in, if any (data/chapters.js REALMS)
    this.realmsVisited = new Set();
    this.secretBossesUsed = new Set();
    this.realmEntrance = null; // { roomId, realm } on a floor with a Sealed Stair
    this.bossesUsed = new Set(); // bosses already met this run (no repeats)
    this.ending = 'king';
    this.slowTime = 0;
    // the oaths sworn for this run (only once a run has been won, and never on the Daily Descent)
    this.oaths = new Set(this.daily || !Save.data.stats.victories ? [] : Save.data.oaths.filter((id) => OATHS[id]));
    this.heat = heatOf(this.oaths);
    if (this.player) this.player.dispose();
    this.player = null;
    this.startFloor();
  }

  /** Start playing a new run (from the title, the death screen or the pause menu). */
  startRun(seed, opts = {}) {
    if (!Save.data.unlocks.characters.includes(this.characterId)) this.characterId = 'wren';
    Save.data.settings.character = this.characterId;
    // the Daily Descent: everyone plays the same hero today (your own pick is kept for next time)
    this.daily = opts.daily ? { date: daily.date } : null;
    this.mode = !this.daily && opts.mode === 'stalked' ? 'stalked' : 'descent'; // Stalked: Beatrix hunts you
    this.heroBeforeDaily = this.daily ? this.characterId : null;
    if (this.daily) this.characterId = daily.hero;
    this.menus.reset(null);
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
    // each hero's first descent opens with the story of the Keep
    const seen = (Save.data.unlocks.introSeen = Save.data.unlocks.introSeen || []);
    if (!seen.includes(this.characterId) && !this.daily) {
      seen.push(this.characterId);
      this.playCutscene('intro', () => (this.floorTitleT = 2.2));
    }
    // the first Stalked run: who Beatrix is
    if (this.mode === 'stalked' && !Save.data.unlocks.beatrixSeen) {
      Save.data.unlocks.beatrixSeen = true;
      const after = this.cutscene ? this.cutscene.onDone : null;
      if (this.cutscene) this.cutscene.onDone = () => { if (after) after(); this.playCutscene('beatrix'); };
      else this.playCutscene('beatrix');
    }
    this.hud.markDirty();
    console.info(`Below the Keep - run seed ${seed}`);
  }

  /** Generate the current floor and put Wren in its start room. */
  startFloor() {
    if (this.floorNumber === 0) return this._startGatehouse();
    this._clearRooms();
    this.enemies.clear();
    this.pickups.clear();
    this.bombs.clear();
    this.projectiles.clear();
    for (const k in this.particles) this.particles[k].clear();
    // each floor gets its own generators, derived from the run seed
    // which chapter: its tiles, light, colours, air, creatures and bosses
    this._setChapter(this.realm || (this.inVault ? 'vault' : chapterForFloor(this.floorNumber)));
    const tag = this.realm ? `realm_${this.realm}` : this.inVault ? 'vault' : this.floorNumber;
    const floorRng = this.rng.fork(`floor${tag}`);
    this.dropRng = this.rng.fork(`drops${tag}`);
    setLayoutChapter(this.chapterInfo.layouts || this.chapterKey, this._rollFeatures(this.rng.fork(`features${tag}`)), this.route && ROUTES[this.route]);
    this.omen = this._rollOmen(this.rng.fork(`omen${tag}`));
    if (this.omen === 'darkness') this.lighting.setAmbient({ color: this.chapterInfo.ambient.color, level: this.chapterInfo.ambient.level * OMEN_FX.darknessAmbient });
    const size = floorSize(this.chapterKey, this.floorNumber) + (this.omen === 'maze' ? OMEN_FX.mazeExtraSize : 0);
    this.floor = generateFloor(floorRng, this.floorNumber, pickLayout, size);
    if (this.player) this.player.martyrStacks = 0;
    this.warBanner = null;
    if (this.inVault) this.vaultVisited = true;
    if (this.realm) this.realmsVisited.add(this.realm);
    this.realmEntrance = this._rollRealmEntrance(this.rng.fork(`realm${tag}`));
    this.prisonerHere = this._rollPrisoner(this.rng.fork(`prisoner${tag}`));
    // Wynn the Cartographer's maps: the boss, armoury and merchant are known from the start
    if (!this.daily && rescued('cartographer')) {
      const eye = rank('eye'); // Keen Eye: secret rooms too, then everything
      for (const r of this.floor.rooms) {
        if (['boss', 'armoury', 'merchant'].includes(r.type)) r.seen = true;
        if (eye >= 1 && (r.type === 'secret' || r.type === 'supersecret')) r.seen = true;
        if (eye >= 2) r.seen = true;
      }
    }
    this._prepareAltar();
    this.floorBoss = this._drawBoss(this.rng.fork(`boss${tag}`));
    // the boss fights in an arena that suits it
    const arena = arenaFor(this.floorBoss, this.chapterKey);
    const bossRoom = this.floor.rooms.find((r) => r.type === 'boss');
    if (arena && bossRoom) for (const c of bossRoom.cells) bossRoom.layouts.set(`${c.x},${c.y}`, arena.name);
    this._placeEcho(this.rng.fork(`echo${tag}`));
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
    // a breath on the stairs: arriving on a new floor of the Keep restores a little health
    // (a heart on floors 2-4, half a heart deeper) - early runs shouldn't die of attrition
    if (this.player && this.floorNumber >= 2 && !this.realm && !this.inVault) this.player.heal(this.floorNumber <= 4 ? DIFFICULTY.arrivalHealEarly : DIFFICULTY.arrivalHeal);
    this._arriveByRoute();
    this._summonBeatrix();
    // Old Knowledge II: every run starts with a relic
    if (!this.daily && !this.loreGiven && rank('lore') >= 2 && !this.realm && !this.inVault) {
      this.loreGiven = true;
      const id = this.pickRelic('armoury', this.rng.fork('lore'));
      const sc = this.room.slotCenter(5, 3);
      if (id) this.room.addRewardPedestal(sc.x, sc.y, { kind: 'relic', id, price: 0, gone: false });
    }
    if (this.shortcutGift) {
      // down Ambrose's stair: a relic for the road (a rare one, with Old Knowledge)
      this.shortcutGift = false;
      const id = this.pickRelic('armoury', this.rng.fork('shortcut'), { minQuality: rank('lore') >= 1 ? 3 : 2 });
      const sc = this.room.slotCenter(7, 3);
      if (id) this.room.addRewardPedestal(sc.x, sc.y, { kind: 'relic', id, price: 0, gone: false });
    }
    setsOnFloorStart(this);
    this.familiars.warp();
  }

  /** Now and then a floor is cursed (data/omens.js). */
  /** Is an oath sworn this run? */
  oath(id) {
    return this.oaths ? this.oaths.has(id) : false;
  }

  /** A boss's rank, after the Oath of Ruin. */
  bossTierOf(type) {
    return Math.min(4, bossTier(type) + (this.oath('ruin') ? 1 : 0));
  }

  /** A Sealed Stair to a secret realm, hidden in one of this floor's secret rooms (or not). */
  _rollRealmEntrance(rng) {
    if (this.realm || this.inVault) return null;
    const realm = realmForFloor(this.floorNumber);
    if (!realm || this.realmsVisited.has(realm)) return null;
    const secretRooms = this.floor.rooms.filter((r) => r.type === 'secret' || r.type === 'supersecret');
    // rare: the hardest-to-find secret room often has one, an ordinary secret room now and then
    const sup = secretRooms.find((r) => r.type === 'supersecret');
    if (sup && rng.chance(0.4)) return { roomId: sup.id, realm };
    const sec = secretRooms.find((r) => r.type === 'secret');
    if (sec && rng.chance(0.15)) return { roomId: sec.id, realm };
    return null;
  }

  _rollOmen(rng) {
    if (this.realm) return null;
    if (this.omenOwed && this.floorNumber >= 2 && this.chapterKey !== 'throne') {
      this.omenOwed = false;
      return OMEN_IDS[Math.floor(rng.next() * OMEN_IDS.length)];
    }
    if (this.route && ROUTES[this.route].omen) return OMEN_IDS[Math.floor(rng.next() * OMEN_IDS.length)];
    if (this.floorNumber < 2 || this.chapterKey === 'throne' || this.chapterKey === 'vault') return null;
    if (!rng.chance(this.oath('moon') ? 1 : OMEN_CHANCE)) return null;
    return OMEN_IDS[Math.floor(rng.next() * OMEN_IDS.length)];
  }

  get omenInfo() {
    return this.omen ? OMENS[this.omen] : null;
  }

  /** Which secret feature rooms this floor gets (puzzle, library, well, rug). */
  _rollFeatures(rng) {
    if (this.chapterKey === 'throne' || this.chapterKey === 'vault' || this.realm) return [];
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
    } else if (this.daily) {
      this.victoryT = 3.2;
    } else {
      this.beyondT = 2.4; // ...then: go home, or follow the crown down?
    }
  }

  /** The choice after the Mad King: hunt the crown below. A stairway opens in the throne room. */
  enterDeep() {
    this.deep = true;
    this.setPaused(false);
    this.room.addBossRewards(); // the stairway down (and a relic for the road)
    this.hud.banner({ name: 'The Deep', flavour: 'Ten more floors. The crown is waiting at the bottom.' });
    this.audio.play('horn');
  }

  /** ...or go home a hero. */
  returnHome() {
    this.setPaused(false);
    this.victoryT = 0.4;
  }

  /** Is this blow a critical hit? (luck helps) */
  rollCrit() {
    return Math.random() < COMBAT.critChance + 0.02 * Math.max(0, this.player.stats.luck) + (this.player.perks.critBonus || 0);
  }

  /** The feel of a landed blow: a tiny freeze, a number, and for a crit a gold flash. */
  combatFeedback(enemy, dmg, crit) {
    if (COMBAT.damageNumbers && this.damageNumbersOn !== false && dmg > 0) this.damageNumbers.add(enemy.x, enemy.y + (enemy.sprite.def.frameH - enemy.look.anchorY) * 0.6, dmg, crit, enemy);
    if (crit) {
      if (this.slowmoOnCrits !== false) this.feel.hitStop(COMBAT.critHitStop);
      this.feel.shake(0.12);
      this.effects.burst(this.effects.presets.gold, enemy.x, enemy.y, 12, 12, 90, 60);
      this.audio.play('crit');
    }
  }

  /** Hooks for relic perks. */
  onEnemyKilled(e) {
    onEnemyKilled(this, e);
    // the title screen counts every kind of creature you have fought and beaten
    if (!e.isBoss && ENEMIES[e.type] && !this.daily) {
      const met = (Save.data.unlocks.enemiesFought = Save.data.unlocks.enemiesFought || []);
      if (!met.includes(e.type)) met.push(e.type);
    }
    if (this.player) this.player.onKill(e);
  }

  /** A new character can be chosen on the title screen. */
  unlockCharacter(id) {
    const list = Save.data.unlocks.characters;
    if (list.includes(id)) return;
    list.push(id);
    Save.write();
    this.unlockNotice = id;
  }

  /** The Echo of your last hero waits in one ordinary room of the floor where they fell. */
  _placeEcho(rng) {
    if (!echoForFloor(this)) return;
    const f = this.floor;
    const rooms = f.rooms.filter((r) => r.type === 'normal' && r.id !== f.startId);
    if (!rooms.length) return;
    const single = rooms.filter((r) => r.cells.length === 1);
    const pool = single.length ? single : rooms;
    pool[Math.floor(rng.next() * pool.length)].echo = true;
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
    const from = this.chapterKey;
    if (this.state === 'play' && from && from !== key && ['catacombs', 'hollow', 'halls', 'throne', 'vault', 'cistern', 'chapel', 'forge', 'rootdeep', 'frozen', 'sunken', 'amethyst', 'heart'].includes(key)) {
      this.playCutscene(key, () => (this.floorTitleT = 2.4));
    }
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
    if (this.chapterInfo.deep) {
      // the Deep: each place's second floor ends with its own guardian (the last, with the Hollow);
      // its first floor with a Deadly boss from the whole roster
      if (floorInChapter(this.floorNumber) === 2) return this.chapterInfo.bosses[0];
      const tough = BOSS_ROSTER.filter((b) => bossTier(b) === 3 && !this.bossesUsed.has(b));
      const pool = tough.length ? tough : BOSS_ROSTER.filter((b) => bossTier(b) === 3);
      const b = pool[Math.floor(rng.next() * pool.length)];
      this.bossesUsed.add(b);
      return b;
    }
    if (this.realm) {
      // one of the five secret bosses, never twice in a run
      const ids = this.chapterInfo.bosses;
      let pool = ids.filter((b) => !this.secretBossesUsed.has(b));
      if (!pool.length) pool = ids;
      const b = pool[Math.floor(rng.next() * pool.length)];
      this.secretBossesUsed.add(b);
      return b;
    }
    // early floors only draw from the gentler bosses (EARLY_BOSS_LIMIT); later, anything goes
    const limit = EARLY_BOSS_LIMIT[this.floorNumber] || 99;
    // ...and harder ranks only turn up deeper down
    const allowed = BOSS_ROSTER.filter((b) => bossHome(b) <= limit && TIER_INFO[bossTier(b)].minFloor <= this.floorNumber);
    let pool = allowed.filter((b) => !this.bossesUsed.has(b));
    if (!pool.length) pool = allowed;
    const b = pool[Math.floor(rng.next() * pool.length)];
    this.bossesUsed.add(b);
    return b;
  }

  /** How much tougher an enemy is on this floor (see data/difficulty.js). */
  scaleFor(e) {
    const o = this.oaths;
    const hp = o && o.has('stone') ? OATHS.stone.enemyHp : 1;
    const tempo = o && o.has('haste') ? OATHS.haste.enemyTempo : 1;
    if (e.isBoss) {
      const s = bossScale(this.floorNumber, bossHome(e.type));
      const t = TIER_INFO[this.bossTierOf(e.type)];
      const ease = DIFFICULTY.bossEase[this.floorNumber] || { hp: 1, tempo: 1 }; // the first bosses ease you in
      return { ...s, hp: s.hp * t.hp * hp * ease.hp, tempo: s.tempo * t.tempo * tempo * ease.tempo };
    }
    const s = enemyScale(this.floorNumber);
    return { ...s, hp: s.hp * hp, tempo: s.tempo * tempo };
  }

  /** "The Catacombs II", "The Throne of the Mad King"... */
  get floorName() {
    const ROMAN = ['I', 'II', 'III'];
    if (this.chapterKey === 'throne' || this.chapterKey === 'vault' || this.chapterKey === 'gatehouse' || this.realm) return this.chapterInfo.name;
    return `${this.chapterInfo.name} ${ROMAN[floorInChapter(this.floorNumber) - 1]}`;
  }

  /** Home: the Gatehouse, one room above the Keep. */
  _startGatehouse() {
    this._clearRooms();
    this.enemies.clear();
    this.pickups.clear();
    this.bombs.clear();
    this.projectiles.clear();
    for (const k in this.particles) this.particles[k].clear();
    this._setChapter('gatehouse');
    this.dropRng = this.rng.fork('dropsGatehouse');
    this.omen = null;
    this.realmEntrance = null;
    this.prisonerHere = null;
    this.floorBoss = null;
    this.floor = gatehouseFloor();
    this._summonBeatrix(); // (she never comes to the Gatehouse)
    this.room = this._makeRoom(this.floor.rooms[0]);
    const c = this.room.slotCenter(7, 4);
    if (!this.player) {
      this.player = new Player(this, c.x, c.y);
      this.projectiles.setStyle(this.player.character.weapon);
    }
    this.player.x = c.x;
    this.player.y = c.y;
    this.player.vx = this.player.vy = 0;
    this._snapCamera();
    this.onEnteredRoom();
    this.familiars.warp();
  }

  /** An encounter for a quiet room: never the same one twice in a run. */
  drawEncounter(rng) {
    let pool = ENCOUNTER_IDS.filter((id) => !this.encountersSeen.has(id));
    if (!pool.length) pool = ENCOUNTER_IDS;
    const id = pool[Math.floor(rng.next() * pool.length)];
    this.encountersSeen.add(id);
    return id;
  }

  /** The Stalked mode: Beatrix comes to every floor of the Keep. */
  _summonBeatrix() {
    if (this.beatrix) this.beatrix.dispose();
    this.beatrix = null;
    this.dread = 0;
    if (this.mode === 'stalked' && this.chapterKey !== 'gatehouse' && this.floorNumber > 0) this.beatrix = new Beatrix(this);
  }

  /** Now and then, a prisoner still in chains (one you haven't freed yet). */
  _rollPrisoner(rng) {
    if (this.daily || this.realm || this.inVault || this.chapterKey === 'throne' || this.prisonerFreed) return null;
    const ids = PRISONER_IDS.filter((id) => !rescued(id) && PRISONERS[id].minFloor <= this.floorNumber);
    if (!ids.length || !rng.chance(0.4)) return null;
    const rooms = this.floor.rooms.filter((r) => r.type === 'normal' && r.cells.length === 1 && r.distance >= 2);
    if (!rooms.length) return null;
    return { roomId: rooms[Math.floor(rng.next() * rooms.length)].id, id: ids[Math.floor(rng.next() * ids.length)] };
  }

  /** Should a fork in the road be offered on the way down? (only between ordinary floors) */
  _routeDue(d) {
    if (d.toVault || d.toRealm || this.inVault) return false;
    const next = this.floorNumber + 1;
    return (next <= LAST_NORMAL_FLOOR || (this.deep && next <= DEEP_LAST)) && this.chapterKey !== 'throne' && this.chapterKey !== 'gatehouse' && !d.toFloor;
  }

  _nextFloorName() {
    const n = this.floorNumber + 1;
    const ch = CHAPTER_INFO[chapterForFloor(n)];
    return ch ? ch.name : '';
  }

  /** The player took a road at the fork. */
  chooseRoute(id) {
    this.route = id;
    this.paused = false;
    this.menus.reset(null);
    this.touch.setPaused(false);
    this.hud.markDirty();
    this.audio.play('menuChoose');
  }

  /** A road's gifts when you arrive on its floor. */
  _arriveByRoute() {
    const r = this.route && ROUTES[this.route];
    if (!r || !this.player) return;
    const p = this.player;
    if (r.heal) p.heal(r.heal);
    if (r.pennies) p.pennies += r.pennies;
    if (r.relic) {
      const id = this.pickRelic('armoury', this.rng.fork(`routeRelic${this.floorNumber}`), { minQuality: 2 });
      if (id) {
        const c = this.room.slotCenter(7, 3);
        this.room.addRewardPedestal(c.x, c.y, { kind: 'relic', id, price: 0, gone: false });
      }
    }
    this.hud.banner({ name: r.name, flavour: r.text });
  }

  /** Step onto a trapdoor: fade out, build the next floor, fade in. */
  descend(toVault = false, toRealm = null, toFloor = 0) {
    if (this.descending || this.state !== 'play') return;
    this.descending = { t: 0, done: false, toVault, toRealm, toFloor };
    this.audio.play('descend');
  }

  _updateDescend(dt) {
    const d = this.descending;
    d.t += dt;
    this.fade = d.t < 0.6 ? d.t / 0.6 : Math.max(0, 1 - (d.t - 0.6) / 0.6);
    if (!d.done && d.t >= 0.6) {
      // a fork in the road: wait in the dark while the player chooses
      if (!d.routeAsked && this._routeDue(d)) {
        d.routeAsked = true;
        d.t = 0.6;
        this.fade = 1;
        const realm = realmForFloor(this.floorNumber + 1);
        const routes = rollRoutes(this.rng.fork(`routes${this.floorNumber}${this.realm || ''}`), !!realm && !this.realmsVisited.has(realm));
        this.routeNextName = this._nextFloorName();
        this.paused = true;
        this.menus.reset(null);
        this.menus.open('route', { routes });
        this.touch.setPaused(true);
        this.hud.markDirty();
        return;
      }
      d.done = true;
      const road = d.routeAsked ? this.route : null;
      if (!d.routeAsked) this.route = null;
      if (d.toVault) this.inVault = true;
      else if (this.inVault) this.inVault = false; // the vault's trapdoor leads on to the next floor
      if (d.toRealm) this.realm = d.toRealm; // down the Sealed Stair (the floor number stays)
      else if (this.realm) this.realm = null; // a realm's trapdoor leads on to the next floor
      if (d.toFloor) {
        this.floorNumber = d.toFloor - 1; // Ambrose's stair skips ahead
        this.shortcutGift = true;
      }
      if (!d.toVault && !d.toRealm) this.floorNumber = Math.min(this.deep ? DEEP_LAST : THRONE_FLOOR, this.floorNumber + 1);
      // the Hidden Way: straight down into the secret realm under the next floor
      if (road && ROUTES[road].realm && !d.toVault && !d.toRealm) {
        const realm = realmForFloor(this.floorNumber);
        if (realm && !this.realmsVisited.has(realm)) {
          this.realm = realm;
          this.route = null;
        }
      }
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

  /**
   * Choose a relic for a room's pedestal from its pool. Never repeats within a run.
   * opts.minQuality: only relics at least this good (if any are left)
   * opts.bias: lean toward better relics (each quality step multiplies the weight by 1 + bias)
   * opts.pool: draw from another room's pool. Bad-luck protection may raise minQuality.
   */
  pickRelic(roomType, rng, opts = {}) {
    const pool = opts.pool || POOL_FOR_ROOM[roomType] || 'armoury';
    let minQ = opts.minQuality || 0;
    if (this.player && this.player.badLuck >= BAD_LUCK_LIMIT) minQ = Math.max(minQ, 3);
    const bias = (opts.bias || 0) + (this.heat || 0) * HEAT_RELIC_BIAS; // hotter runs, better relics
    const collect = (minQuality) => {
      const weights = {};
      let any = false;
      for (const id of RELIC_IDS) {
        const w = (RELICS[id].pools || {})[pool];
        if (!w || this.offered.has(id) || (this.player && this.player.hasRelic(id))) continue;
        const q = quality(id);
        if (q < minQuality) continue;
        weights[id] = w * Math.pow(1 + bias, q - 1);
        any = true;
      }
      return any ? weights : null;
    };
    // fall back to any quality, then to the armoury pool, rather than an empty pedestal
    const weights = collect(minQ) || collect(0) || (pool !== 'armoury' ? this._armouryWeights() : null);
    if (!weights) return null;
    const id = weightedKey(rng, weights);
    this.offered.add(id);
    return id;
  }

  /**
   * A weapon for the hero's class that isn't in hand and hasn't been offered this run.
   * opts.minQuality, opts.bias like pickRelic. null if the hero has no weapon family (sling heroes).
   */
  pickWeapon(rng, opts = {}) {
    const cls = this.player ? this.player.character.weapon : null;
    if (!cls || cls === 'sling') return null;
    const ids = WEAPON_IDS.filter((id) => {
      const w = WEAPON_DEFS[id];
      return w.class === cls && !w.starter && id !== this.player.weaponId && !this.offered.has('w:' + id) && w.quality >= (opts.minQuality || 0);
    });
    if (!ids.length) return null;
    const weights = {};
    for (const id of ids) weights[id] = Math.pow(1 + (opts.bias || 0), WEAPON_DEFS[id].quality - 1);
    const id = weightedKey(rng, weights);
    this.offered.add('w:' + id);
    return id;
  }

  _armouryWeights() {
    const weights = {};
    let any = false;
    for (const id of RELIC_IDS) {
      const w = (RELICS[id].pools || {}).armoury;
      if (!w || this.offered.has(id) || (this.player && this.player.hasRelic(id))) continue;
      weights[id] = w;
      any = true;
    }
    return any ? weights : null;
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
    if (this.beatrix && this.player) this.beatrix.onRoomChange(this.player.x, this.player.y);
    if (this.player) this.player.shieldReady = true; // the Saint's Shroud is ready again
    this.familiars.warp();
    data.visited = true;
    data.seen = true;
    this._revealNeighbours(this.room);
    this.effects.bounds = this.room.bounds;
    if (!data.cleared) {
      if ((data.type === 'boss' || data.type === 'crown' || data.echo) && this.room.enemiesAlive > 0) {
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
        // embers: more the deeper you are and the tougher the boss; a clean floor earns extra
        const tier = this.bossTierOf(this.bossForFloor());
        let earned = EMBERS.boss + this.floorNumber * EMBERS.perFloor + tier * EMBERS.perTier + (this.realm ? EMBERS.realm : 0);
        if (!this.tookDamageThisFloor) earned += EMBERS.flawless;
        this.earnEmbers(earned, !this.tookDamageThisFloor ? 'FLAWLESS' : null);
        Save.write();
        if (this.chapterKey === 'throne') this._throneCleared(); // the Mad King falls
        else if (this.deep && this.floorNumber === DEEP_LAST) {
          // the Hollow is slain: the true end of the descent
          this.ending = 'deep';
          this.victoryT = 3.6;
        }
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
    if (this.beyondT > 0) {
      this.beyondT -= dt;
      if (this.beyondT <= 0) {
        this.paused = true;
        this.menus.reset(null);
        this.menus.open('beyond');
        this.touch.setPaused(true);
        this.hud.markDirty();
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

  /** A run ended (won or lost): the Daily Descent posts its score; embers go home. */
  runEnded(won) {
    if (this.daily) submitDaily(this, won);
    this.embersBanked = 0;
    if (!this.daily && this.player && this.player.embers > 0) {
      this.embersBanked = this.player.embers;
      Save.data.embers = (Save.data.embers || 0) + this.player.embers;
      this.player.embers = 0;
    }
  }

  /** Embers found (scaled by heat and by Beatrix's hunt). */
  earnEmbers(n, why = null) {
    if (this.daily || !this.player || n <= 0) return;
    const k = (1 + (this.heat || 0) * EMBERS.heatBonus) * (this.mode === 'stalked' ? EMBERS.stalked : 1);
    const got = Math.max(1, Math.round(n * k));
    this.player.embers += got;
    this.hud.emberFlash(got, why);
  }

  /** The embers you'd bring home right now (shown at the Gatehouse and at the end). */
  get embersShown() {
    return !this.daily;
  }

  /** The run is won. */
  win() {
    if (this.state !== 'play') return;
    this.earnEmbers(EMBERS.victory + (this.ending === 'deep' ? EMBERS.deepVictory : 0));
    if (this.ending === 'deep') Save.data.stats.deepVictories = (Save.data.stats.deepVictories || 0) + 1;
    this.state = 'victory';
    this.playCutscene(this.ending === 'deep' ? 'endDeep' : this.ending === 'crown' ? 'endCrown' : 'endKing'); // the ending, told
    Save.data.stats.victories++;
    // the best heat beaten, per hero
    if (this.heat > (Save.data.heatRecord[this.characterId] || 0)) Save.data.heatRecord[this.characterId] = this.heat;
    this.runEnded(true);
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
    this.menus.reset(p ? 'pause' : null);
    this.hud.markDirty();
    this.touch.setPaused(p);
    if (p) Save.write();
  }

  start() {
    this._warmUp();
    requestAnimationFrame(this._frame);
  }

  /** Draw one hidden frame with an enemy, its shots and Wren's shots in it, so the graphics card
   *  prepares their shaders now (behind the title) instead of stuttering in the first fight. */
  _warmUp() {
    try {
      preloadTextures(this.renderer.gl); // every sprite sheet onto the GPU now, not mid-fight
      const c = this.room.slotCenter(7, 5);
      const e = this.enemies.spawn('rat', this.room, c.x, c.y, { noGrace: true });
      this.enemies.shots.fireOrb(c.x, c.y, 8, 1, 0, 1, 0, 1, 'warm-up');
      this.enemies.shots.fireBolt(c.x, c.y, 8, 1, 0, 1, 1);
      this.projectiles.spawn(c.x, c.y, 8, 1, 0, this.player.shot, 0, 1);
      e.sync?.();
      this.enemies.sync(0);
      this.projectiles.sync();
      this.renderer.render();
    } catch (err) {
      console.warn('warm-up skipped', err);
    }
    this.enemies.clear();
    this.enemies.shots.clear();
    this.projectiles.clear();
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

    if (this.cutscene) {
      this.cutscene.update(dt);
      this.hud.markDirty();
    } else if (!this.paused) {
      const timeScale = this.feel.update(dt); // a heavy blow slows the world for a moment
      this._updateState(dt * timeScale);
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
    if (this.beatrix) this.beatrix.sync();
    for (const k in this.particles) this.particles[k].sync();
    this.touch.setInRun(this.state === 'play' && !this.cutscene && !this.descending);
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
    tickSets(this, dt);
    if (this.warBanner) {
      this.warBanner.t -= dt;
      if (this.warBanner.t <= 0 || this.warBanner.room !== this.room) this.warBanner = null;
    }
    this.projectiles.update(dt, this.room);
    this.pickups.update(dt);
    this.bombs.update(dt);
    this.room.update(dt);
    if (this.beatrix && this.state === 'play') this.beatrix.update(dt);
    if (this.state === 'play') {
      if (this.player.dead && trySecondWind(this)) {
        // the Phoenix Feather burns, and Wren gets back up
      } else if (this.player.dead) {
        this.state = 'dead';
        this.deathTimer = 0;
        Save.data.stats.deaths++;
        recordEcho(this);
        this.runEnded(false);
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
    if (this.state === 'title' || this.state === 'collection' || (this.cutscene && this.cutscene.panels.length > 1)) m = 'title';
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
  /** A tap (or a mouse click) at (fx, fy): 0..1 across the game picture (window fractions for touch). */
  _menuTap(fx = 0.5, fy = 0.5, picture = false) {
    if (this.cutscene) {
      this.cutscene.advance();
      return true;
    }
    if (!picture) {
      const pt = this.renderer.toPicture(fx * window.innerWidth, fy * window.innerHeight);
      fx = pt.fx;
      fy = pt.fy;
    }
    if (this.state === 'collection') {
      // a tap flips the page; past the last page, back to the title
      if (this.collection.tab < COLLECTION_TABS.length - 1) this.collection.tab++;
      else this.state = 'title';
      this.collection.cursor = 0;
      this.hud.markDirty();
      return true;
    }
    if (this.state === 'title') {
      if (this.nameEntry || this.seedEntry !== null) return true; // typing (the keyboard pops up on phones)
      if (this.menus.tap(fx, fy)) return true;
      // on the title itself, the arrows beside the hero change hero
      if (this.menus.top && this.menus.top.id === 'title' && fy > 0.25 && fy < 0.75) {
        if (fx > 0.62 && fx < 0.74) this._cycleCharacter(-1);
        else if (fx > 0.9) this._cycleCharacter(1);
      }
      return true;
    }
    if (this.paused) {
      this.menus.tap(fx, fy);
      return true;
    }
    if ((this.state === 'dead' && this.deathTimer > 1.6) || this.state === 'victory') {
      this.startRun(randomSeedString(), { mode: this.mode });
      return true;
    }
    return false;
  }

  _seedTyping(e) {
    if (this.state === 'title' && this.nameEntry) {
      const n = this.nameEntry;
      if (/^[a-zA-Z0-9 ]$/.test(e.key) && n.value.length < 12) n.value += e.key.toUpperCase();
      else if (e.key === 'Backspace') n.value = n.value.slice(0, -1);
      this.hud.markDirty();
      return;
    }
    if (this.state !== 'title' || this.seedEntry === null) return;
    if (/^[a-zA-Z0-9]$/.test(e.key) && this.seedEntry.length < 8) this.seedEntry += e.key.toUpperCase();
    else if (e.key === 'Backspace') this.seedEntry = this.seedEntry.slice(0, -1);
    this.hud.markDirty();
  }

  _handleMenuInput() {
    const input = this.input;
    if (this.cutscene) {
      if (input.pressed('pause')) this.cutscene.finish();
      else if (['confirm', 'active', 'bomb', 'dodge', 'shootUp', 'shootDown', 'shootLeft', 'shootRight', 'consumable'].some((a) => input.pressed(a))) this.cutscene.advance();
      return;
    }

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
      if (this.nameEntry) {
        const n = this.nameEntry;
        if (input.pressed('confirm')) {
          const name = cleanName(n.value);
          if (!name) return this.audio.play('deny');
          daily.name = name;
          this.nameEntry = null;
          this.audio.play('menuChoose');
          if (n.then) n.then();
        }
        if (input.pressed('pause')) this.nameEntry = null;
        return;
      }
      if (this.menus.top && this.menus.top.id === 'title') {
        // on the title itself, left / right choose the hero; the shortcuts still work
        if (input.pressed('left') || input.pressed('shootLeft')) this._cycleCharacter(-1);
        if (input.pressed('right') || input.pressed('shootRight')) this._cycleCharacter(1);
        if (input.pressed('seed')) return this.openSeedEntry();
        if (input.pressed('collection')) return this.openCollection();
        if (input.pressed('up') || input.pressed('shootUp')) this.menus.move(-1);
        if (input.pressed('down') || input.pressed('shootDown')) this.menus.move(1);
        if (input.pressed('confirm')) this.menus.choose();
        return;
      }
      this.menus.handle(input);
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
      if (ready && (input.pressed('newRun') || input.pressed('confirm'))) this.startRun(randomSeedString(), { mode: this.mode });
      if (ready && input.pressed('pause')) this._toTitle();
      return;
    }

    if (this.paused) {
      // the phone's NEW RUN button (and R) still work as a shortcut
      if (input.pressed('newRun')) {
        this.setPaused(false);
        this.restartRun();
        return;
      }
      this.menus.handle(input);
      return;
    }
    if (input.pressed('pause')) {
      this.setPaused(true);
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
  _beginFromTitle(opts = {}) {
    if (!Save.data.unlocks.characters.includes(this.characterId)) {
      this.audio.play('deny');
      return;
    }
    this.startRun(this.pendingSeed || randomSeedString(), opts);
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

  /** Is a menu on screen (so the mouse works)? */
  get _menuOpen() {
    return this.state === 'title' || this.paused || !!this.cutscene;
  }

  /** Play a story scene (unless the player switched them off). */
  playCutscene(id, then = null, force = false) {
    // (automated browser tests skip the story unless they ask for it)
    if (!force && (!settingsOf(Save).story || navigator.webdriver)) {
      if (then) then();
      return;
    }
    this.cutscene = new Cutscene(id, this.characterId, () => {
      this.cutscene = null;
      this.hud.markDirty();
      if (then) then();
    });
  }

  // --- what the menus call ---
  beginFromTitle(opts = {}) {
    this._beginFromTitle(opts);
  }

  openSeedEntry() {
    this.seedEntry = '';
    this.hud.markDirty();
  }

  openCollection() {
    this._openCollection();
  }

  openNameEntry(then) {
    this.nameEntry = { value: daily.name || '', then };
    this.hud.markDirty();
  }

  /** The Daily Descent: today's seed and hero, no oaths. */
  startDaily() {
    this.menus.reset('title');
    this.startRun(daily.seed, { daily: true });
  }

  restartRun() {
    this.startRun(randomSeedString(), { mode: this.mode });
  }

  toTitle() {
    this._toTitle();
  }

  _toTitle() {
    if (this.heroBeforeDaily) {
      this.characterId = this.heroBeforeDaily;
      this.heroBeforeDaily = null;
    }
    this.descending = null;
    this.fade = 0;
    this.state = 'title';
    this.seedEntry = null;
    this.nameEntry = null;
    this.daily = null;
    this.menus.reset('title');
    if (!daily.board) daily.fetchBoard();
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
