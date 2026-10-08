// The structure of a run: 4 chapters x 2 floors, then the Mad King's throne.
// Each chapter (and the two special floors) picks its tileset, colour grade, ambient light,
// atmosphere particles, torch light, enemy pools and bosses here.

import { CHAPTERS, SPECIAL_GRADES } from './palettes.js';

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
    ambient: { color: 0x6a3a6a, level: 0.22 },
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
    ambient: { color: 0x8a7a4a, level: 0.24 },
    atmosphere: 'dust',
    torch: { color: 0xffd060, flame: 'flame' },
    bosses: ['keeper'],
  },
};

/** How big a floor is generated (the throne and the vault are short). */
export function floorSize(key, n) {
  if (key === 'throne') return 2;
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
