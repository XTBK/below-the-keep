// The structure of a run: 4 chapters x 2 floors, then the Mad King's throne.
// Each chapter (and the two special floors) picks its tileset, colour grade, ambient light,
// atmosphere particles, torch light, enemy pools and bosses here.

import { CHAPTERS, SPECIAL_GRADES } from './palettes.js';
import { SECRET_BOSS_IDS } from './bosses4.js';

export const CHAPTER_ORDER = ['cells', 'catacombs', 'hollow', 'halls'];
export const FLOORS_PER_CHAPTER = 2;
export const LAST_NORMAL_FLOOR = CHAPTER_ORDER.length * FLOORS_PER_CHAPTER; // 8
export const THRONE_FLOOR = LAST_NORMAL_FLOOR + 1; // 9

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

/** Which secret realm lies under a floor (by depth). */
export function realmForFloor(n) {
  if (n < 2 || n > 7) return null;
  return n <= 3 ? 'cistern' : n <= 5 ? 'chapel' : 'forge';
}

/** How big a floor is generated (the throne and the vault are short). */
export function floorSize(key, n) {
  if (key === 'throne') return 2;
  if (REALMS[key]) return 2;
  if (key === 'vault') return 1;
  return n;
}

/** Which chapter a floor number belongs to. */
export function chapterForFloor(n) {
  if (n >= THRONE_FLOOR) return 'throne';
  return CHAPTER_ORDER[Math.min(CHAPTER_ORDER.length - 1, Math.floor((n - 1) / FLOORS_PER_CHAPTER))];
}

/** 1 or 2: the first or second floor of its chapter. */
export function floorInChapter(n) {
  return ((n - 1) % FLOORS_PER_CHAPTER) + 1;
}
