// Colour palettes. Every procedural sprite draws ONLY from these ramps (dark -> light).
// Shared ramps are used by all chapters; each chapter adds its own material ramps + colour grade.

export const SHARED = {
  outline: '#0b0a0d',
  skin: ['#3b2218', '#6b4030', '#a06a4c', '#c98e68', '#e8b48c'],
  hair: ['#1e120c', '#3a2416', '#5c3a22', '#7e5432'],
  tunic: ['#1a2214', '#2b3a1f', '#425430', '#5d7142', '#748a52'],
  trousers: ['#211c17', '#352d25', '#4d4236', '#655746'],
  leather: ['#24150c', '#432816', '#6a4226', '#906038'],
  scarf: ['#3e120c', '#6e2216', '#9c3820', '#c25430'],
  eye: '#140c08',
  wood: ['#1f140d', '#36231a', '#523523', '#704a2f', '#8f6440', '#ad8152'],
  iron: ['#121216', '#25262d', '#3d3f48', '#5d606c', '#888c99', '#b8bcc6'],
  rust: ['#4a2614', '#6e3a1e', '#93532c'],
  brass: ['#4a3612', '#806224', '#b8963c', '#e2c46c'],
  fire: ['#4a1206', '#8e2a0a', '#d4521a', '#f68c2c', '#ffc35a', '#ffe9a6', '#fffbe8'],
  wax: ['#6e6250', '#a8987a', '#d4c6a2', '#efe5c8'],
  pebble: ['#2a2a30', '#4a4a52', '#6c6c74', '#9a9aa2', '#c8c8cc'],
  heart: ['#3a0a10', '#7a1420', '#c02634', '#ee5a5a', '#ffb0a0'],
  silver: ['#3a3c44', '#6a6e7a', '#a4a8b4', '#dcdee6'],
};

// Creature ramps (dark -> light) used by the enemy art.
export const CREATURES = {
  ratFur: ['#1c1714', '#2e2621', '#463a31', '#5e4e40', '#7a6855'],
  ratPink: ['#6a3a38', '#a0605a', '#c88a80'],
  sore: ['#3a4a1a', '#5a7224', '#86a03a'],
  jailerSkin: ['#3a1a12', '#6a3222', '#984e36', '#bc6e52', '#d88e70'],
  linen: ['#2e2a22', '#4a4436', '#6a614c', '#8a7e64', '#a89a7a'],
  prisonerSkin: ['#3a342c', '#5e564a', '#847a68', '#a89c84', '#c8bca2'],
  rags: ['#3a3630', '#5a554a', '#7c7666', '#9c9682'], // dirty prison sackcloth
  soot: ['#160f0d', '#2a1c18', '#3e2a22', '#5a3a2c'],
  ghoulSkin: ['#1a221c', '#2e3a2c', '#46543e', '#627258', '#7e8e72'],
  gambeson: ['#161a22', '#252c38', '#38424f', '#4e5a6a', '#667486'],
  royal: ['#4a3a10', '#7a6218', '#a8862a', '#d0aa40'], // the Mad King's mustard livery
  goo: ['#1e3010', '#36561a', '#5a8a26', '#8ac040'],
  blood: ['#2a0606', '#4a0c0c', '#6e1414', '#922020'],
  teeth: ['#8a8068', '#c8bea0', '#ece4cc'],
  tongue: ['#4a1018', '#7a1c2a', '#a8303e'],
};

export const CHAPTERS = {
  cells: {
    name: 'The Cells',
    stone: ['#16171c', '#22232a', '#2f3038', '#3e4049', '#50535e', '#666a76', '#80848f'],
    mortar: ['#0c0c10', '#141419'],
    moss: ['#1f2a1a', '#2f3d24', '#43552f', '#5a6d3c'],
    straw: ['#4a3a1a', '#6e5728', '#94783a', '#b89a52', '#d6bc76'],
    water: ['#0e141c', '#182230', '#2a3a4e', '#4d6680'],
    ambient: { color: 0x5870b8, level: 0.3 }, // cold blue darkness (high enough to read enemies in unlit corners)
    // Colour grade applied after lighting (see render/PostShaders.js)
    grade: {
      saturation: 0.88,
      contrast: 1.08,
      shadowTint: [0.8, 0.92, 1.22], // cool shadows
      highlightTint: [1.05, 1.0, 0.92], // gently warm highlights
      lift: 0.004,
    },
  },

  // pale bone and sickly green
  catacombs: {
    name: 'The Catacombs',
    stone: ['#121009', '#1e1b14', '#2c281e', '#3c3628', '#504836', '#686048', '#857c62'],
    mortar: ['#0a0806', '#14110c'],
    bone: ['#5a5040', '#8a7e64', '#b8ab8a', '#ddd2b4'],
    moss: ['#16200e', '#24361a', '#3e5a24', '#5a7e30'],
    ambient: { color: 0x6a8a68, level: 0.27 },
    grade: { saturation: 0.78, contrast: 1.06, shadowTint: [0.86, 1.06, 0.94], highlightTint: [1.07, 1.03, 0.88], lift: 0.006 },
  },

  // deep teal and toxic purple
  hollow: {
    name: 'The Hollow',
    stone: ['#0a1210', '#121e1a', '#1a2a26', '#243a34', '#305046', '#40665a', '#568274'],
    mortar: ['#060a08', '#0c1410'],
    earth: ['#26221a', '#342e24', '#433b2e', '#544a3a'], // lifted: the floor must read in the gloom
    bark: ['#160f0a', '#2a1c12', '#3e2a1a', '#583c26', '#765236'],
    moss: ['#0e2a1e', '#18402c', '#28603e', '#3a8050'],
    leaf: ['#2a1a3a', '#4a2a5a', '#3a6a4a'],
    glowTeal: ['#0e3a36', '#1a8a7a', '#4ae0c8', '#c0fff0'],
    glowPurple: ['#2a0e3a', '#6a1a8a', '#b04ae0', '#f0c0ff'],
    ambient: { color: 0x5a9a98, level: 0.42 },
    grade: { saturation: 1.0, contrast: 1.04, shadowTint: [0.85, 1.0, 1.1], highlightTint: [1.08, 0.94, 1.1], lift: 0.02 },
  },

  // crimson, black and gold
  halls: {
    name: 'The Burning Halls',
    stone: ['#0c0808', '#181010', '#241614', '#32201c', '#442c26', '#5a3a32', '#744a40'],
    mortar: ['#060404', '#0c0808'],
    marbleA: ['#2a181a', '#3a2226', '#4c2e32', '#5e3a3e', '#764a4c'], // lifted: rooms must read in the gloom
    marbleB: ['#1e1e24', '#2a2a32', '#383842', '#484852', '#5c5c66'],
    gold: ['#4a3612', '#806224', '#b8963c', '#e2c46c'],
    crimson: ['#3a0a0a', '#6a1212', '#9a1c1c', '#c83a2a'],
    lava: ['#7a2208', '#d4521a', '#ff9a3a', '#ffe0a0'],
    ash: ['#1a1816', '#2a2724', '#3c3834', '#55504a'],
    ambient: { color: 0xa86050, level: 0.4 },
    grade: { saturation: 0.95, contrast: 1.06, shadowTint: [1.0, 0.86, 0.88], highlightTint: [1.12, 0.98, 0.82], lift: 0.02 },
  },

  // ---- the secret realms (each borrows a chapter's shapes, in its own colours) ----
  // the Drowned Cistern: sunken stone, green water, weed where the straw was
  cistern: {
    name: 'The Drowned Cistern',
    stone: ['#0c1416', '#142024', '#1e2e32', '#2a3e42', '#3a5256', '#4e6a6c', '#688886'],
    mortar: ['#060c0e', '#0c1416'],
    moss: ['#10261e', '#1a3a2c', '#28543c', '#3a724e'],
    straw: ['#14261e', '#1e3a2a', '#2a5236', '#3a6c44', '#56905a'],
    water: ['#08202a', '#0e3442', '#1a5266', '#3a8aa2'],
    ambient: { color: 0x4a8aa0, level: 0.42 },
    grade: { saturation: 0.95, contrast: 1.05, shadowTint: [0.8, 0.98, 1.15], highlightTint: [0.98, 1.06, 1.02], lift: 0.02 },
  },
  // the Starless Chapel: violet dark, reliquaries of tarnished gold
  chapel: {
    name: 'The Starless Chapel',
    stone: ['#0e0a14', '#18121e', '#22182a', '#2e2038', '#3c2a48', '#4e385c', '#664a74'],
    mortar: ['#08060c', '#0e0a14'],
    bone: ['#5a4a2a', '#8a7038', '#b8964a', '#e0c070'],
    moss: ['#1a0e2a', '#2a1640', '#401e5a', '#5a2a7a'],
    ambient: { color: 0x8a6ab0, level: 0.4 },
    grade: { saturation: 0.9, contrast: 1.06, shadowTint: [0.95, 0.85, 1.15], highlightTint: [1.1, 1.0, 0.9], lift: 0.02 },
  },
  // the First King's Forge: soot-black iron, molten gold, banners of beaten copper
  forge: {
    name: "The First King's Forge",
    stone: ['#0e0c0a', '#1a1612', '#26201a', '#342a22', '#46382c', '#5c4838', '#765c46'],
    mortar: ['#060504', '#0c0a08'],
    marbleA: ['#2a2018', '#382a20', '#48362a', '#5a4434', '#705642'],
    marbleB: ['#1c1c1e', '#28282c', '#36363c', '#46464e', '#5a5a62'],
    gold: ['#5a3a10', '#9a6a1a', '#d89a2a', '#ffd060'],
    crimson: ['#3a1a08', '#6a3010', '#9a4a18', '#c86a28'],
    lava: ['#8a2a08', '#e06a1a', '#ffaa3a', '#fff0b0'],
    ash: ['#1a1816', '#2a2724', '#3c3834', '#55504a'],
    ambient: { color: 0xc07850, level: 0.42 },
    grade: { saturation: 1.0, contrast: 1.06, shadowTint: [1.0, 0.88, 0.8], highlightTint: [1.12, 1.0, 0.8], lift: 0.02 },
  },
};

// Colour grades for the special floors (they borrow a chapter's tileset).
export const SPECIAL_GRADES = {
  throne: { saturation: 0.85, contrast: 1.15, shadowTint: [0.9, 0.78, 1.0], highlightTint: [1.15, 1.0, 0.78], lift: 0.003 },
  vault: { saturation: 0.7, contrast: 1.05, shadowTint: [0.9, 0.95, 1.05], highlightTint: [1.1, 1.06, 0.85], lift: 0.008 },
};

// the Gatehouse (home, above the Keep): warm sandstone in firelight
CHAPTERS.gatehouse = {
  ...CHAPTERS.cells,
  name: 'The Gatehouse',
  stone: ['#1e1814', '#2c241c', '#3c3226', '#4e4232', '#625440', '#7a6a52', '#968468'],
  mortar: ['#100c0a', '#18120e'],
  ambient: { color: 0xffc890, level: 0.42 },
  grade: { ...CHAPTERS.cells.grade, saturation: 0.95, shadowTint: [1.0, 0.94, 0.88], highlightTint: [1.08, 1.0, 0.88] },
};
