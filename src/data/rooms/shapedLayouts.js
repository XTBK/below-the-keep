// Shaped rooms and boss arenas, shared by every chapter.
//
// Same 13 x 7 grids as the chapter layouts. Two tiles matter most here:
//   p  pit: a chasm. Rooms are carved into crosses, rings, bridges and ledges with them.
//   w  shallow water: walkable, but it drags at your feet (and at anything else that walks).
// Shaped rooms use plain 'e' spawns, so each chapter fills them with its own creatures.

export const SHAPED_LAYOUTS = {
  easy: [
    {
      name: 'Rope Bridges',
      grid: [
        'pppp.....pppp',
        'pppp.....pppp',
        'pppp..e..pppp',
        '.............',
        'pppp..e..pppp',
        'pppp.....pppp',
        'pppp.....pppp',
      ],
    },
    {
      name: 'Flooded Passage',
      grid: [
        '.............',
        '.wwwwwwwwwww.',
        '.ww..e.e..ww.',
        '.............',
        '.ww..e....ww.',
        '.wwwwwwwwwww.',
        '.............',
      ],
    },
    {
      name: 'Puddled Floor',
      grid: [
        'ww.........ww',
        'w...e...e...w',
        '....ww.ww....',
        '.............',
        '....ww.ww....',
        'w...........w',
        'ww.........ww',
      ],
    },
  ],
  medium: [
    {
      name: 'Round Crypt',
      grid: [
        'ppp.......ppp',
        'pp..e...e..pp',
        'p...........p',
        '......r......',
        'p...........p',
        'pp..e...e..pp',
        'ppp.......ppp',
      ],
    },
    {
      name: 'The Ledge',
      grid: [
        '..e.......e..',
        'ppppp...ppppp',
        '.............',
        '.............',
        '....e...e....',
        '.............',
        '.............',
      ],
    },
    {
      name: 'The Moat',
      grid: [
        '.............',
        '.wwwwwwwwwww.',
        '.w.........w.',
        '.w..e.e.e..w.',
        '.w.........w.',
        '.wwwwwwwwwww.',
        '.............',
      ],
    },
    {
      name: 'Shattered Floor',
      grid: [
        '.............',
        '..pp..e..pp..',
        '..pp.....pp..',
        '.....p.p.....',
        '..pp.....pp..',
        '..pp..e..pp..',
        '.....e.......',
      ],
    },
  ],
  hard: [
    {
      name: 'Narrow Crossing',
      grid: [
        'ppppp...ppppp',
        'ppppp...ppppp',
        'pp..e...e..pp',
        '.............',
        'pp..e...e..pp',
        'ppppp...ppppp',
        'ppppp...ppppp',
      ],
    },
    {
      name: 'Island Keep',
      grid: [
        '.............',
        '.ppppp.ppppp.',
        '.p..e...e..p.',
        '...e..r..e...',
        '.p.........p.',
        '.ppppp.ppppp.',
        '.............',
      ],
    },
    {
      name: 'Sunken Hall',
      grid: [
        'www.......www',
        'w...x.e.x...w',
        '....w...w....',
        '.e....w....e.',
        '....w...w....',
        'w...x...x...w',
        'www.......www',
      ],
    },
  ],
};

// Boss arenas: every boss fights somewhere that suits it (see arenaFor below).
export const ARENAS = {
  round: {
    name: 'Round Arena',
    grid: [
      'pp.........pp',
      'p...........p',
      '.............',
      '......K......',
      '.............',
      'p...........p',
      'pp.........pp',
    ],
  },
  pillared: {
    name: 'Pillared Arena',
    grid: [
      'B...........B',
      '....r...r....',
      '.............',
      '......K......',
      '.............',
      '....r...r....',
      'B...........B',
    ],
  },
  flooded: {
    name: 'Flooded Arena',
    grid: [
      'wwwww...wwwww',
      'ww.........ww',
      'w...........w',
      '......K......',
      'w...........w',
      'ww.........ww',
      'wwwww...wwwww',
    ],
  },
  chasm: {
    name: 'Chasm Arena',
    grid: [
      '.............',
      '.ppp.....ppp.',
      '.p.........p.',
      '......K......',
      '.p.........p.',
      '.ppp.....ppp.',
      '.............',
    ],
  },
  braziers: {
    name: 'Ring of Fire',
    grid: [
      'c....B.B....c',
      '.............',
      'B...........B',
      '......K......',
      'B...........B',
      '.............',
      'c....B.B....c',
    ],
  },
  altar: {
    name: 'Altar Arena',
    grid: [
      'c.c.......c.c',
      'c...........c',
      '.............',
      '......K......',
      '.............',
      'c...........c',
      'c.c.......c.c',
    ],
  },
};

// which arenas each chapter's bosses fight in (one is picked per boss, always the same one)
const CHAPTER_ARENAS = {
  cells: ['pillared', 'round'],
  catacombs: ['altar', 'round'],
  hollow: ['flooded', 'chasm'],
  halls: ['braziers', 'pillared'],
  cistern: ['flooded'],
  chapel: ['altar'],
  forge: ['braziers'],
};
// a few bosses have a home that can't be anywhere else
const BOSS_ARENAS = { leviathan: 'flooded', organist: 'altar', facelesssaint: 'altar', firstking: 'pillared' };

/** The arena a boss fights in, or null for the plain old Arena. */
export function arenaFor(bossId, chapterKey) {
  if (BOSS_ARENAS[bossId]) return ARENAS[BOSS_ARENAS[bossId]];
  const opts = CHAPTER_ARENAS[chapterKey];
  if (!opts || !bossId) return null;
  let h = 0;
  for (const ch of bossId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return ARENAS[opts[h % opts.length]];
}
