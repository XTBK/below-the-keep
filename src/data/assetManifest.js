// Every sprite sheet in the game, by name.
//
// To REPLACE generated art with your own:
//   1. Draw a PNG sprite sheet with the same layout (frameW x frameH frames; cols x rows).
//      Rows are animations / facing directions, columns are frames.
//   2. Save it as /public/assets/<key>.png  (optional normal map: /public/assets/<key>_n.png)
//   3. Add it to /public/assets/overrides.json, e.g.  { "wren": { "normal": true } }
//
// `generate(col, row)` returns a Painter for one frame (see src/render/art/*).

import { TILESETS, FLOOR_VARIANTS, WALL_TOP_VARIANTS, WALL_SIDE_VARIANTS, PIT_VARIANTS } from '../render/art/tilesets.js';
import { CHAPTERS } from './palettes.js';
import { doorTop, doorLeft, doorRight, doorBottom, DOOR_FRAMES } from '../render/art/doorsArt.js';
import { ratFrame, gaolerFrame, prisonerFrame, impFrame, ghoulFrame, flyFrame, crossbowmanFrame, mimicFrame, boltFrame, fireballFrame, splatFrame, chainAnchor, ENEMY_COLS, animsFor } from '../render/art/enemiesArt.js';
import { relicIcon, pickupFrame, bombLitFrame, stoneFrame, orbFrame, shopStand, trapdoor, rockRubble } from '../render/art/itemsArt.js';
import { ratMotherFrame, wardenFrame, BOSS_COLS, bossAnims } from '../render/art/bossesArt.js';
import { RELIC_IDS } from './items.js';
import { CURIO_FRAMES } from './curios.js';
import { curioFrame } from '../render/art/itemsArt2.js';
import * as E2 from '../render/art/enemiesArt2.js';
import * as B2 from '../render/art/bossesArt2.js';
import * as SA from '../render/art/secretsArt.js';
import * as E3 from '../render/art/enemiesArt3.js';
import * as B3 from '../render/art/bossesArt3.js';
import * as B4 from '../render/art/bossesArt4.js'; // redrawn bosses
import * as B5 from '../render/art/bossesArt5.js';
import * as B6 from '../render/art/bossesArt6.js';
import * as B7 from '../render/art/bossesArt7.js';
import * as E4 from '../render/art/enemiesArt4.js'; // redrawn enemies
import * as I3 from '../render/art/itemsArt3.js';
import { spellFrame, quarrelFrame } from '../render/art/wizardArt.js';
import { wrenFrame, WREN_FRAMES } from '../render/art/wrenArt.js';
import { barrel, barrelBroken, brazier, candles, flameFrame, slingStone, shadowFrame, pedestal, merchantTable } from '../render/art/propsArt.js';

const WITCHFIRE = ['#0a2a1a', '#1a6a3a', '#2ac070', '#6af0a0', '#c0ffd0', '#f0fff0', '#ffffff'];

export const ASSETS = {
  // --- Characters ---
  wren: {
    frameW: 32,
    frameH: 32,
    cols: WREN_FRAMES,
    rows: 4,
    generate: wrenFrame,
    // rows: facing direction
    dirs: { down: 0, up: 1, right: 2, left: 3 },
    anims: {
      idle: { start: 0, count: 2, fps: 1.6 },
      walk: { start: 2, count: 4, fps: 10 },
      wind: { start: 6, count: 1, fps: 1 },
      release: { start: 7, count: 1, fps: 1 },
    },
  },

  // --- Props ---
  barrel: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => barrel() },
  barrel_broken: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => barrelBroken() },
  brazier: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => brazier() },
  candles: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => candles() },
  pedestal: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => pedestal() },
  merchant_table: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => merchantTable() },

  // --- Chapter 1 enemies (row 0 = facing right, row 1 = facing left; animations in render/art/enemiesArt.js) ---
  rat: { frameW: 24, frameH: 16, cols: ENEMY_COLS.rat, rows: 2, generate: ratFrame, anims: animsFor('rat') },
  gaoler: { frameW: 40, frameH: 40, cols: ENEMY_COLS.gaoler, rows: 2, generate: gaolerFrame, anims: animsFor('gaoler') },
  prisoner: { frameW: 32, frameH: 32, cols: ENEMY_COLS.prisoner, rows: 2, generate: prisonerFrame, anims: animsFor('prisoner') },
  imp: { frameW: 24, frameH: 24, cols: ENEMY_COLS.imp, rows: 2, generate: impFrame, anims: animsFor('imp') },
  ghoul: { frameW: 32, frameH: 32, cols: ENEMY_COLS.ghoul, rows: 2, generate: ghoulFrame, anims: animsFor('ghoul') },
  fly: { frameW: 8, frameH: 8, cols: ENEMY_COLS.fly, rows: 1, generate: flyFrame, anims: animsFor('fly') },
  crossbowman: { frameW: 32, frameH: 32, cols: ENEMY_COLS.crossbowman, rows: 2, generate: crossbowmanFrame, anims: animsFor('crossbowman') },
  mimic: { frameW: 32, frameH: 32, cols: ENEMY_COLS.mimic, rows: 2, generate: mimicFrame, anims: animsFor('mimic') },
  chain_anchor: { frameW: 16, frameH: 16, cols: 1, rows: 1, generate: () => chainAnchor() },
  splats: { frameW: 16, frameH: 16, cols: 4, rows: 1, generate: (c) => splatFrame(c) },

  // --- Chapter 1 bosses ---
  ratmother: { frameW: 80, frameH: 56, cols: BOSS_COLS.ratmother, rows: 2, generate: ratMotherFrame, anims: bossAnims('ratmother') },
  warden: { frameW: 96, frameH: 96, cols: BOSS_COLS.warden, rows: 2, generate: wardenFrame, anims: bossAnims('warden') },

  // --- Items (relic icons follow the order of RELIC_IDS in src/data/items.js) ---
  relics: { frameW: 16, frameH: 16, cols: RELIC_IDS.length, rows: 1, generate: (c) => relicIcon(c) },
  // curios: 0-9 trinkets, 10-19 scrolls, 20-29 potion colours, 30-32 Seal Fragments, 33 journal page
  curios: { frameW: 16, frameH: 16, cols: CURIO_FRAMES, rows: 1, generate: (c) => curioFrame(c) },
  // pickups: 0 penny, 1 purse, 2 heart, 3 half heart, 4 bomb, 5 key
  pickups: { frameW: 16, frameH: 16, cols: 7, rows: 1, generate: (c) => pickupFrame(c) },
  bomb_lit: { frameW: 16, frameH: 16, cols: 2, rows: 1, generate: (c) => bombLitFrame(c) },
  stones: { frameW: 16, frameH: 16, cols: 3, rows: 1, generate: (c) => stoneFrame(c) },
  // orbs: 0 glob, 1 shard, 2 key, 3 bone, 4 wisp, 5 thorn, 6 curse, 7 coin, 8 fire, 9 web, 10 shadow, 11 iron ball, 12 rune
  orbs: { frameW: 12, frameH: 12, cols: 13, rows: 1, generate: (c) => B2.orbFrame2(c, orbFrame) },
  // eruptions: 0 root spike, 1 bone spike, 2 fire pillar, 3 dirt burst, 4 shockwave, 5 falling skull, 6 shadow spear
  eruptions: { frameW: 32, frameH: 32, cols: 7, rows: 1, generate: (c) => E2.eruptionFrame(c) },
  web: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => E2.webDecal() },
  shop_stand: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => shopStand() },
  trapdoor: { frameW: 48, frameH: 48, cols: 1, rows: 1, generate: () => trapdoor() },
  rock_rubble: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => rockRubble() },

  // --- Effects (unlit / glowing) ---
  bolt: { frameW: 16, frameH: 16, cols: 8, rows: 1, unlit: true, generate: (c) => boltFrame(c) },
  fireball: { frameW: 12, frameH: 12, cols: 3, rows: 1, unlit: true, generate: (c) => fireballFrame(c), anims: { burn: { start: 0, count: 3, fps: 14 } } },
  flame: { frameW: 10, frameH: 16, cols: 4, rows: 1, unlit: true, generate: (c) => flameFrame(c, 10, 16), anims: { burn: { start: 0, count: 4, fps: 11 } } },
  flame_big: { frameW: 16, frameH: 22, cols: 4, rows: 1, unlit: true, generate: (c) => flameFrame(c, 16, 22), anims: { burn: { start: 0, count: 4, fps: 9 } } },
  flame_witch: { frameW: 10, frameH: 16, cols: 4, rows: 1, unlit: true, generate: (c) => flameFrame(c, 10, 16, WITCHFIRE), anims: { burn: { start: 0, count: 4, fps: 11 } } },
  flame_small: { frameW: 4, frameH: 6, cols: 4, rows: 1, unlit: true, generate: (c) => flameFrame(c, 4, 6), anims: { burn: { start: 0, count: 4, fps: 13 } } },
  sling_stone: { frameW: 8, frameH: 8, cols: 1, rows: 1, generate: () => slingStone() },
  shadows: { frameW: 32, frameH: 12, cols: 4, rows: 1, unlit: true, generate: (c) => shadowFrame(c) },
};

// --- Chapter tilesets (baked into each room's background) and doors, one set per chapter ---
//   <chapter>_floor, _wall_top, _wall_side, _pit (frame = neighbour mask: 1 up, 2 right, 4 down, 8 left),
//   _spikes, _decor, _rock, and _door_top / _door_left / _door_right / _door_bottom
//   (door frame = kind * 3 + state; kinds: normal, armoury, boss, secret; states: open, barred, locked)
for (const [key, ts] of Object.entries(TILESETS)) {
  const pal = CHAPTERS[key];
  ASSETS[`${key}_floor`] = { frameW: 32, frameH: 32, cols: FLOOR_VARIANTS, rows: 1, tile: true, generate: (c) => ts.floor(c) };
  ASSETS[`${key}_wall_top`] = { frameW: 32, frameH: 64, cols: WALL_TOP_VARIANTS, rows: 1, tile: true, generate: (c) => ts.wallTop(c) };
  ASSETS[`${key}_wall_side`] = { frameW: 32, frameH: 32, cols: WALL_SIDE_VARIANTS, rows: 1, tile: true, generate: (c) => ts.wallSide(c) };
  ASSETS[`${key}_pit`] = { frameW: 32, frameH: 32, cols: PIT_VARIANTS, rows: 1, tile: true, generate: (c) => ts.pit(c) };
  ASSETS[`${key}_spikes`] = { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => ts.spikes() };
  ASSETS[`${key}_decor`] = { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => ts.decor() };
  ASSETS[`${key}_rock`] = { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => ts.rock() };
  ASSETS[`${key}_door_top`] = { frameW: 48, frameH: 64, cols: DOOR_FRAMES, rows: 1, generate: (c) => doorTop(c, pal) };
  ASSETS[`${key}_door_left`] = { frameW: 32, frameH: 48, cols: DOOR_FRAMES, rows: 1, generate: (c) => doorLeft(c, pal) };
  ASSETS[`${key}_door_right`] = { frameW: 32, frameH: 48, cols: DOOR_FRAMES, rows: 1, generate: (c) => doorRight(c, pal) };
  ASSETS[`${key}_door_bottom`] = { frameW: 48, frameH: 32, cols: DOOR_FRAMES, rows: 1, generate: (c) => doorBottom(c, pal) };
}

// --- Chapters 2-4: enemies (standard layout: 0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death, 11+ extras) ---
const E2_SHEETS = {
  skeleton: [32, 32, 11, E2.skeletonFrame, E2.SKELETON_ANIMS],
  archer: [32, 32, 11, E2.archerFrame, E2.ARCHER_ANIMS],
  wraith: [32, 32, 12, E2.wraithFrame, E2.WRAITH_ANIMS],
  golem: [44, 40, 12, E2.golemFrame, E2.GOLEM_ANIMS],
  spider: [32, 24, 11, E2.spiderFrame, E2.SPIDER_ANIMS],
  worm: [32, 32, 12, E2.wormFrame, E2.WORM_ANIMS],
  doctor: [32, 32, 11, E2.doctorFrame, E2.DOCTOR_ANIMS],
  spectre: [32, 32, 11, E2.spectreFrame, E2.SPECTRE_ANIMS],
  witch: [32, 32, 12, E2.witchFrame, E2.WITCH_ANIMS],
  thornling: [32, 32, 11, E2.thornlingFrame, E2.THORNLING_ANIMS],
  direwolf: [44, 30, 11, E2.direwolfFrame, E2.DIREWOLF_ANIMS],
  bloater: [32, 32, 11, E2.bloaterFrame, E2.BLOATER_ANIMS],
  wisp: [16, 16, 11, E2.wispFrame, E2.WISP_ANIMS],
  scarecrow: [32, 40, 11, E2.scarecrowFrame, E2.SCARECROW_ANIMS],
  crow: [16, 12, 11, E2.crowFrame, E2.CROW_ANIMS],
  sapling: [32, 36, 11, E2.saplingFrame, E2.SAPLING_ANIMS],
  cutpurse: [24, 24, 12, E2.cutpurseFrame, E2.CUTPURSE_ANIMS],
  blackknight: [36, 32, 12, E2.blackknightFrame, E2.BLACKKNIGHT_ANIMS],
  flailbrute: [40, 40, 11, E4.flailbruteFrame, E2.FLAILBRUTE_ANIMS],
  gargoyle: [36, 32, 12, E2.gargoyleFrame, E2.GARGOYLE_ANIMS],
  magus: [32, 36, 12, E2.magusFrame, E2.MAGUS_ANIMS],
  livingarmour: [32, 32, 13, E2.livingarmourFrame, E2.LIVINGARMOUR_ANIMS],
  drake: [40, 32, 11, E2.drakeFrame, E2.DRAKE_ANIMS],
  executioner: [40, 44, 11, E4.executionerFrame, E2.EXECUTIONER_ANIMS],
};
for (const [key, [w, h, cols, generate, anims]] of Object.entries(E2_SHEETS)) {
  ASSETS[key] = { frameW: w, frameH: h, cols, rows: 2, generate, anims, selfLight: 0x8a / 255 };
}

// --- Pattern bosses (0-1 idle, 2-5 walk, 6 wind-up, 7 attack, 8-10 death, 11 cast) ---
const B2_SHEETS = {
  gravedigger: [56, 56, B7.gravediggerFrame],
  colossus: [96, 96, B2.colossusFrame],
  briarhound: [72, 48, B2.briarhoundFrame],
  thornwitch: [64, 64, B7.thornwitchFrame],
  pyrebishop: [56, 64, B7.pyrebishopFrame],
  champion: [72, 72, B2.championFrame],
  madking1: [64, 72, B2.madking1Frame],
  madking2: [64, 72, B2.madking2Frame],
  madking3: [64, 72, B2.madking3Frame],
  crownwraith: [64, 64, B6.crownwraithFrame],
  keeper: [64, 72, B6.keeperFrame],
};
for (const [key, [w, h, generate]] of Object.entries(B2_SHEETS)) {
  ASSETS[key] = { frameW: w, frameH: h, cols: B2.BOSS2_COLS, rows: 2, generate, anims: B2.boss2Anims(), selfLight: 0x8a / 255 };
}

// --- special rooms and secrets ---
Object.assign(ASSETS, {
  idol: { frameW: 32, frameH: 48, cols: 1, rows: 1, generate: () => SA.idolFrame() },
  chapel_altar: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => SA.chapelAltarFrame() },
  puzzle_stand: { frameW: 16, frameH: 32, cols: 2, rows: 1, generate: (c) => SA.puzzleStandFrame(c) }, // 0 lit, 1 snuffed
  tablet: { frameW: 32, frameH: 32, cols: 1, rows: 1, generate: () => SA.tabletFrame() },
  bookcase: { frameW: 32, frameH: 44, cols: 2, rows: 1, generate: (c) => SA.bookcaseFrame(c) },
  well: { frameW: 40, frameH: 40, cols: 2, rows: 1, generate: (c) => SA.wellFrame(c) }, // 0 water, 1 dry
  rug: { frameW: 32, frameH: 32, cols: 2, rows: 1, generate: (c) => SA.rugFrame(c) }, // 0 rug, 1 burnt
  sword_stone: { frameW: 32, frameH: 40, cols: 2, rows: 1, generate: (c) => SA.swordStoneFrame(c) }, // 0 sword, 1 empty
});

// --- the second bestiary (same column layout as chapters 2-4) ---
const E3_SHEETS = {
  hound: [36, 28, 11, E3.houndFrame, E3.HOUND_ANIMS],
  torturer: [32, 36, 11, E4.torturerFrame, E3.TORTURER_ANIMS],
  ratnest: [36, 28, 11, E3.ratnestFrame, E3.RATNEST_ANIMS],
  monk: [32, 34, 11, E3.monkFrame, E3.MONK_ANIMS],
  slime: [32, 24, 11, E3.slimeFrame, E3.SLIME_ANIMS],
  slimelet: [20, 16, 11, E3.slimeletFrame, E3.SLIME_ANIMS],
  skull: [20, 20, 11, E3.skullFrame, E3.SKULL_ANIMS],
  banshee: [32, 36, 11, E3.bansheeFrame, E3.BANSHEE_ANIMS],
  necromancer: [32, 36, 11, E3.necromancerFrame, E3.NECROMANCER_ANIMS],
  mummy: [32, 34, 12, E3.mummyFrame, E3.MUMMY_ANIMS],
  bat: [24, 16, 11, E3.batFrame, E3.BAT_ANIMS],
  puffcap: [28, 28, 12, E3.puffcapFrame, E3.PUFFCAP_ANIMS],
  toad: [32, 24, 11, E3.toadFrame, E3.TOAD_ANIMS],
  treant: [44, 48, 11, E3.treantFrame, E3.TREANT_ANIMS],
  pixie: [20, 20, 12, E3.pixieFrame, E3.PIXIE_ANIMS],
  boar: [40, 28, 12, E3.boarFrame, E3.BOAR_ANIMS],
  hellhound: [36, 28, 11, E3.hellhoundFrame, E3.HELLHOUND_ANIMS],
  ballista: [40, 28, 11, E3.ballistaFrame, E3.BALLISTA_ANIMS],
  jester: [28, 34, 12, E3.jesterFrame, E3.JESTER_ANIMS],
  moltengolem: [40, 40, 11, E3.moltengolemFrame, E3.MOLTENGOLEM_ANIMS],
  ember: [14, 14, 11, E3.emberFrame, E3.EMBER_ANIMS],
  bannerman: [32, 44, 11, E3.bannermanFrame, E3.BANNERMAN_ANIMS],
};
for (const [key, [w, h, cols, generate, anims]] of Object.entries(E3_SHEETS)) {
  ASSETS[key] = { frameW: w, frameH: h, cols, rows: 2, generate, anims, selfLight: 0x8a / 255 };
}

// --- the second boss roster ---
const B3_SHEETS = {
  mastiff: [64, 44, B6.mastiffFrame],
  friar: [64, 64, B4.friarFrame],
  ratking: [64, 48, B4.ratkingFrame],
  headsman: [72, 80, B4.headsmanFrame],
  maiden: [56, 72, B5.maidenFrame],
  choir: [64, 56, B6.choirFrame],
  gravemother: [72, 48, B3.gravemotherFrame],
  physician: [56, 64, B7.physicianFrame],
  lich: [56, 72, B5.lichFrame],
  entombed: [56, 72, B5.entombedFrame],
  greattoad: [72, 56, B4.greattoadFrame],
  matron: [64, 64, B5.matronFrame],
  stag: [72, 64, B6.stagFrame],
  ancientoak: [88, 96, B5.ancientoakFrame],
  mothqueen: [80, 64, B3.mothqueenFrame],
  courtjester: [56, 64, B6.courtjesterFrame],
  moltenknight: [64, 72, B6.moltenknightFrame],
  gargoylelord: [80, 72, B5.gargoylelordFrame],
  ashwing: [96, 80, B6.ashwingFrame],
  burnedqueen: [64, 72, B6.burnedqueenFrame],
};
// the third roster
Object.assign(B3_SHEETS, {
  turnkey: [64, 64, B7.turnkeyFrame],
  bellringer: [64, 64, B7.bellringerFrame],
  widow: [56, 72, B7.widowFrame],
  hangedman: [56, 80, B7.hangedmanFrame],
  fenhag: [64, 64, B7.fenhagFrame],
  wickerman: [72, 96, B7.wickermanFrame],
  inquisitor: [56, 72, B7.inquisitorFrame],
  dreadknight: [72, 80, B7.dreadknightFrame],
  abyssaleye: [72, 72, B7.abyssaleyeFrame],
});
for (const [key, [w, h, generate]] of Object.entries(B3_SHEETS)) {
  ASSETS[key] = { frameW: w, frameH: h, cols: B2.BOSS2_COLS, rows: 2, generate, anims: B2.boss2Anims(), selfLight: 0x8a / 255 };
}

// --- companions, chests, the Gambler's Den, the war banner ---
Object.assign(ASSETS, {
  familiars: { frameW: 16, frameH: 16, cols: 10, rows: 1, generate: (c) => I3.familiarFrame(c) }, // owl, page, moth, raven, squire (2 frames each)
  chests: { frameW: 24, frameH: 20, cols: 7, rows: 1, generate: (c) => I3.chestFrame(c) }, // wooden, iron, cursed (shut/open), gem glint
  dice_table: { frameW: 40, frameH: 32, cols: 2, rows: 1, generate: (c) => I3.diceTableFrame(c) },
  beggar: { frameW: 24, frameH: 32, cols: 2, rows: 1, generate: (c) => I3.beggarFrame(c) },
  war_banner: { frameW: 20, frameH: 40, cols: 2, rows: 1, generate: (c) => I3.warBannerFrame(c) },
  anvil: { frameW: 36, frameH: 30, cols: 3, rows: 1, generate: (c) => I3.anvilFrame(c) }, // the Blacksmith's Anvil: cold, glowing, spent
});

// --- Wren's wand: spell bolts in the three stone sizes ---
ASSETS.spells = { frameW: 16, frameH: 16, cols: 3, rows: 1, generate: (c) => spellFrame(c) };
ASSETS.quarrels = { frameW: 16, frameH: 16, cols: 3, rows: 1, generate: (c) => quarrelFrame(c) }; // the Ranger's crossbow bolts
