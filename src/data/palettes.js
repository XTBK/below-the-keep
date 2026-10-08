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
    earth: ['#140f0c', '#1e1712', '#2a2018', '#38291e'],
    bark: ['#160f0a', '#2a1c12', '#3e2a1a', '#583c26', '#765236'],
    moss: ['#0e2a1e', '#18402c', '#28603e', '#3a8050'],
    leaf: ['#2a1a3a', '#4a2a5a', '#3a6a4a'],
    glowTeal: ['#0e3a36', '#1a8a7a', '#4ae0c8', '#c0fff0'],
    glowPurple: ['#2a0e3a', '#6a1a8a', '#b04ae0', '#f0c0ff'],
    ambient: { color: 0x4a8a90, level: 0.34 },
    grade: { saturation: 1.0, contrast: 1.08, shadowTint: [0.8, 1.0, 1.15], highlightTint: [1.08, 0.94, 1.1], lift: 0.005 },
  },

  // crimson, black and gold
  halls: {
    name: 'The Burning Halls',
    stone: ['#0c0808', '#181010', '#241614', '#32201c', '#442c26', '#5a3a32', '#744a40'],
    mortar: ['#060404', '#0c0808'],
    marbleA: ['#140c0c', '#22141a', '#301e22', '#40282c', '#58363a'],
    marbleB: ['#0e0e10', '#18181c', '#24242a', '#32323a', '#46464e'],
    gold: ['#4a3612', '#806224', '#b8963c', '#e2c46c'],
    crimson: ['#3a0a0a', '#6a1212', '#9a1c1c', '#c83a2a'],
    lava: ['#7a2208', '#d4521a', '#ff9a3a', '#ffe0a0'],
    ash: ['#1a1816', '#2a2724', '#3c3834', '#55504a'],
    ambient: { color: 0x8a4a3a, level: 0.24 },
    grade: { saturation: 0.95, contrast: 1.12, shadowTint: [1.0, 0.82, 0.86], highlightTint: [1.12, 0.98, 0.82], lift: 0.004 },
  },
};

// Colour grades for the special floors (they borrow a chapter's tileset).
export const SPECIAL_GRADES = {
  throne: { saturation: 0.85, contrast: 1.15, shadowTint: [0.9, 0.78, 1.0], highlightTint: [1.15, 1.0, 0.78], lift: 0.003 },
  vault: { saturation: 0.7, contrast: 1.05, shadowTint: [0.9, 0.95, 1.05], highlightTint: [1.1, 1.06, 0.85], lift: 0.008 },
};
