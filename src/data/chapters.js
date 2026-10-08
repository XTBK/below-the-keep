// The structure of a run: 4 chapters x 2 floors, then the Mad King's throne.
// Each chapter (and the two special floors) picks its tileset, colour grade, ambient light,
// atmosphere particles, torch light, enemy pools and bosses here.

import { CHAPTERS, SPECIAL_GRADES } from './palettes.js';
import { SECRET_BOSS_IDS } from './bosses4.js';

export const CHAPTER_ORDER = ['cells', 'catacombs', 'hollow', 'halls'];
export const FLOORS_PER_CHAPTER = 2;
export const LAST_NORMAL_FLOOR = CHAPTER_ORDER.length * FLOORS_PER_CHAPTER; // 8
export const THRONE_FLOOR = LAST_NORMAL_FLOOR + 1; // 9
// the Deep: five more places, two floors each, for those who hunt the crown below the throne
export const DEEP_ORDER = ['rootdeep', 'frozen', 'sunken', 'amethyst', 'heart'];
export const DEEP_FIRST = THRONE_FLOOR + 1; // 10
export const DEEP_LAST = DEEP_FIRST + DEEP_ORDER.length * FLOORS_PER_CHAPTER - 1; // 19

export const CHAPTER_INFO = {
  cells: {
    enemies: 'cells', // whose creatures (and room layouts) fill this floor
    name: 'The Cells',
    tileset: 'cells',
    grade: CHAPTERS.cells.grade,
    ambient: CHAPTERS.cells.ambient,
    atmosphere: 'dust',
    torch: { color: 0xffa860, flame: 'flame' },
    bosses: ['ratmother', 'warden'],
  },
  catacombs: {
    enemies: 'catacombs', // whose creatures (and room layouts) fill this floor
    name: 'The Catacombs',
    tileset: 'catacombs',
    grade: CHAPTERS.catacombs.grade,
    ambient: CHAPTERS.catacombs.ambient,
    atmosphere: 'fog',
    torch: { color: 0xffd8a0, flame: 'flame' },
    bosses: ['gravedigger', 'colossus'],
  },
  hollow: {
    enemies: 'hollow', // whose creatures (and room layouts) fill this floor
    name: 'The Hollow',
    tileset: 'hollow',
    grade: CHAPTERS.hollow.grade,
    ambient: CHAPTERS.hollow.ambient,
    atmosphere: 'spores',
    torch: { color: 0x58ffc8, flame: 'flame_witch' }, // witch-fire burns green
    bosses: ['briarhound', 'thornwitch'],
  },
  halls: {
    enemies: 'halls', // whose creatures (and room layouts) fill this floor
    name: 'The Burning Halls',
    tileset: 'halls',
    grade: CHAPTERS.halls.grade,
    ambient: CHAPTERS.halls.ambient,
    atmosphere: 'embers',
    torch: { color: 0xff7a34, flame: 'flame' },
    bosses: ['pyrebishop', 'champion'],
  },
  // the final floor: the Mad King's throne
  throne: {
    enemies: 'halls', // whose creatures (and room layouts) fill this floor
    name: 'The Throne of the Mad King',
    tileset: 'halls',
    grade: SPECIAL_GRADES.throne,
    ambient: { color: 0x8a5a8a, level: 0.36 },
    atmosphere: 'embers',
    torch: { color: 0xff6a3a, flame: 'flame' },
    bosses: ['madking'],
  },
  // a hidden floor under a rug (see GAME_DESIGN.md, Secrets)
  vault: {
    enemies: 'catacombs', // whose creatures (and room layouts) fill this floor
    name: 'The Forgotten Vault',
    tileset: 'catacombs',
    grade: SPECIAL_GRADES.vault,
    ambient: { color: 0xa0905a, level: 0.36 },
    atmosphere: 'dust',
    torch: { color: 0xffd060, flame: 'flame' },
    bosses: ['keeper'],
  },
};

// The secret realms: found down a Sealed Stair hidden in a secret room. Each is a short floor of
// its own creatures in borrowed room shapes, with one of five secret bosses at the bottom - and a
// weapon for whoever beats it. Its trapdoor leads on to the next ordinary floor.
export const REALMS = {
  cistern: {
    enemies: 'cistern', layouts: 'cistern', name: 'The Drowned Cistern', tileset: 'cistern', secret: true,
    grade: CHAPTERS.cistern.grade, ambient: CHAPTERS.cistern.ambient, atmosphere: 'fog',
    torch: { color: 0x60d0e0, flame: 'flame_witch' }, bosses: SECRET_BOSS_IDS,
  },
  chapel: {
    enemies: 'chapel', layouts: 'chapel', name: 'The Starless Chapel', tileset: 'chapel', secret: true,
    grade: CHAPTERS.chapel.grade, ambient: CHAPTERS.chapel.ambient, atmosphere: 'dust',
    torch: { color: 0xb070ff, flame: 'flame_witch' }, bosses: SECRET_BOSS_IDS,
  },
  forge: {
    enemies: 'forge', layouts: 'forge', name: "The First King's Forge", tileset: 'forge', secret: true,
    grade: CHAPTERS.forge.grade, ambient: CHAPTERS.forge.ambient, atmosphere: 'embers',
    torch: { color: 0xff9040, flame: 'flame' }, bosses: SECRET_BOSS_IDS,
  },
};
Object.assign(CHAPTER_INFO, REALMS);

// the Deep (floors 10-19): reached by choosing to hunt the crown below the Mad King's throne
export const DEEP = {
  rootdeep: { name: 'The Rootdeep', enemies: 'rootdeep', layouts: 'hollow', tileset: 'rootdeep', atmosphere: 'sap', torch: { color: 0xffa040, flame: 'flame' }, bosses: ['worldroot'] },
  frozen: { name: 'The Frozen Deep', enemies: 'frozen', layouts: 'catacombs', tileset: 'frozen', atmosphere: 'snow', torch: { color: 0x9ad0ff, flame: 'flame_witch' }, bosses: ['rimequeen'] },
  sunken: { name: 'The Sunken Kingdom', enemies: 'sunken', layouts: 'halls', tileset: 'sunken', atmosphere: 'drowned', torch: { color: 0x60e0c8, flame: 'flame_witch' }, bosses: ['sunkenking'] },
  amethyst: { name: 'The Amethyst Caverns', enemies: 'amethyst', layouts: 'catacombs', tileset: 'amethyst', atmosphere: 'crystal', torch: { color: 0xd070ff, flame: 'flame_witch' }, bosses: ['crystalwyrm'] },
  heart: { name: 'The Hollow Heart', enemies: 'heart', layouts: 'hollow', tileset: 'heart', atmosphere: 'heart', torch: { color: 0xff4050, flame: 'flame' }, bosses: ['hollow'] },
};
for (const [k, d] of Object.entries(DEEP)) CHAPTER_INFO[k] = { ...d, deep: true, grade: CHAPTERS[k].grade, ambient: CHAPTERS[k].ambient };

// home: the Gatehouse above the Keep, where runs begin (world/Gatehouse.js)
CHAPTER_INFO.gatehouse = {
  enemies: 'cells', name: 'The Gatehouse', tileset: 'gatehouse',
  grade: CHAPTERS.gatehouse.grade, ambient: CHAPTERS.gatehouse.ambient, atmosphere: 'dust',
  torch: { color: 0xffb070, flame: 'flame' }, bosses: [],
};

/** Which secret realm lies under a floor (by depth). */
export function realmForFloor(n) {
  if (n < 2 || n > 7) return null;
  return n <= 3 ? 'cistern' : n <= 5 ? 'chapel' : 'forge';
}

/** How big a floor is generated (the throne and the vault are short). */
export function floorSize(key, n) {
  if (key === 'throne') return 2;
  if (REALMS[key]) return 2;
  if (DEEP[key]) return LAST_NORMAL_FLOOR; // full-sized floors (the grid only grows so far)
  if (key === 'vault') return 1;
  return n;
}

/** Which chapter a floor number belongs to. */
export function chapterForFloor(n) {
  if (n >= DEEP_FIRST) return DEEP_ORDER[Math.min(DEEP_ORDER.length - 1, Math.floor((n - DEEP_FIRST) / FLOORS_PER_CHAPTER))];
  if (n >= THRONE_FLOOR) return 'throne';
  return CHAPTER_ORDER[Math.min(CHAPTER_ORDER.length - 1, Math.floor((n - 1) / FLOORS_PER_CHAPTER))];
}

/** 1 or 2: the first or second floor of its chapter. */
export function floorInChapter(n) {
  if (n >= DEEP_FIRST) return ((n - DEEP_FIRST) % FLOORS_PER_CHAPTER) + 1;
  return ((n - 1) % FLOORS_PER_CHAPTER) + 1;
}
