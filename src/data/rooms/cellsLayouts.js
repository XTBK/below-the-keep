// Chapter 1 (The Cells) room layouts.
//
// Every layout is 13 columns x 7 rows, one character per floor tile. Large rooms (2x1, L, 2x2)
// are built by putting one of these layouts in each of their cells.
//
// Legend:
//   .  empty floor          r  rock (blocks you and stones)
//   b  barrel (breakable)   B  brazier (solid, big light)
//   c  candles (light)      s  straw pile (decoration)
//   p  pit (blocks walking, stones fly over)
//   x  floor spikes (hurt!)
//   e  enemy spawn point: a random enemy that suits the layout's difficulty (easy/medium/hard)
//   1-7  a specific enemy:  1 Plague Rats (a pack)  2 Gaoler  3 Chained Prisoner (chained right there)
//        4 Torch Imp  5 Ghoul  6 Crossbowman  7 Barrel Mimic (looks just like a barrel!)
//   A  relic pedestal       M  merchant's table      S  merchant's stand (goods for sale)
//   K  the floor's boss (boss rooms only)
//
// Keep these tiles free so doors are never blocked (the game also clears them for you):
//   row 3, columns 0 and 12  (left/right doors)   and   column 6, rows 0 and 6 (top/bottom doors)
//
// To add a layout: copy one, change the picture, give it a new name. That's it.

export const CELLS_LAYOUTS = {
  easy: [
    {
      name: 'Four Stones',
      grid: [
        '.............',
        '..r.......r..',
        '.............',
        '.....e.e.....',
        '.............',
        '..r.......r..',
        '.............',
      ],
    },
    {
      name: 'Barrel Store',
      grid: [
        'bb.........bb',
        'b...........b',
        '.............',
        '......e......',
        '.............',
        'b...........b',
        'bb.........bb',
      ],
    },
    {
      name: 'Straw Beds',
      grid: [
        's...........s',
        '.............',
        '...e.....e...',
        '.............',
        '.............',
        '.....r.r.....',
        's...........s',
      ],
    },
    {
      name: 'Single Guard',
      grid: [
        '.............',
        '.............',
        '....r...r....',
        '......e......',
        '....r...r....',
        '.............',
        '.............',
      ],
    },
    {
      name: 'Candle Vigil',
      grid: [
        'c...........c',
        '.............',
        '.............',
        '...e.....e...',
        '.............',
        '.............',
        'c...........c',
      ],
    },
    {
      name: 'Rubble',
      grid: [
        '.............',
        '.r.r.....r.r.',
        '.............',
        '.....1.1.....',
        '.............',
        '.r.r.....r.r.',
        '.............',
      ],
    },
  ],

  medium: [
    {
      name: 'Pit Trench',
      grid: [
        '.............',
        '.............',
        '..ppp...ppp..',
        '..p.6...6.p..',
        '..ppp...ppp..',
        '.............',
        '.............',
      ],
    },
    {
      name: 'Spike Row',
      grid: [
        '.............',
        '..e.......e..',
        '.............',
        '.xxxx...xxxx.',
        '.............',
        '.....e.......',
        '.............',
      ],
    },
    {
      name: 'Brazier Hall',
      grid: [
        '.............',
        '..b.......7..',
        '.............',
        '...e..B..e...',
        '.............',
        '..b...e...b..',
        '.............',
      ],
    },
    {
      name: 'Broken Floor',
      grid: [
        '.............',
        '.pp.......pp.',
        '.p..e...e..p.',
        '.............',
        '.p....e....p.',
        '.pp.......pp.',
        '.............',
      ],
    },
    {
      name: 'Cell Block',
      grid: [
        '.r.r.....r.r.',
        '.r.r3....r.r.',
        '.............',
        '.............',
        '.............',
        '.r.r....3r.r.',
        '.r.r.....r.r.',
      ],
    },
    {
      name: 'Gauntlet',
      grid: [
        '.............',
        '.6.........e.',
        '.xx.......xx.',
        '.............',
        '.xx.......xx.',
        '.e.........e.',
        '.............',
      ],
    },
  ],

  hard: [
    {
      name: 'Pit Island',
      grid: [
        '.............',
        '.ppppp.ppppp.',
        '.p.........p.',
        '...e..e..e...',
        '.p.........p.',
        '.ppppp.ppppp.',
        '.............',
      ],
    },
    {
      name: 'Spike Cross',
      grid: [
        '.............',
        '......x......',
        '..e...x...e..',
        '.xx.e...e.xx.',
        '..e...x...e..',
        '......x......',
        '.............',
      ],
    },
    {
      name: 'The Maze',
      grid: [
        '.....r.r.....',
        '.e...r.r...e.',
        '.rrr.....rrr.',
        '.....e.e.....',
        '.rrr.....rrr.',
        '.e...r.r...e.',
        '.....r.r.....',
      ],
    },
    {
      name: 'Barrel Fort',
      grid: [
        '.............',
        '..bb7...bbb..',
        '..b.e...e.b..',
        '......4......',
        '..b.e...e.b..',
        '..bbb...bbb..',
        '.............',
      ],
    },
    {
      name: 'Sunken Cell',
      grid: [
        '.............',
        '...ppppppp...',
        '.4.p.....p.4.',
        '...p..B..p...',
        '.e.p.....p.e.',
        '...ppp.ppp...',
        '.............',
      ],
    },
    {
      name: 'Execution Yard',
      grid: [
        'x...........x',
        '.x..6...e..x.',
        '.............',
        '....r.2.r....',
        '.............',
        '.x..e...e..x.',
        'x...........x',
      ],
    },
  ],

  // one layout per special room type
  special: {
    start: {
      name: 'The Cell You Woke In',
      grid: [
        'c...........c',
        '.............',
        '.............',
        '.............',
        '.............',
        '.............',
        'c...........c',
      ],
    },
    boss: {
      name: 'Arena',
      grid: [
        'B...........B',
        '.............',
        '.............',
        '......K......',
        '.............',
        '.............',
        'B...........B',
      ],
    },
    armoury: {
      name: 'Armoury',
      grid: [
        'c...........c',
        '.............',
        '.............',
        '......A......',
        '.............',
        '.............',
        'c...........c',
      ],
    },
    merchant: {
      name: 'Merchant',
      grid: [
        '.............',
        '..s...M...s..',
        '.............',
        '...S..S..S...',
        '.............',
        '.............',
        '.............',
      ],
    },
    secret: {
      name: 'Hidden Cellar',
      grid: [
        '.............',
        '.............',
        '...c.....c...',
        '......A......',
        '...c.....c...',
        '.............',
        '.............',
      ],
    },
    supersecret: {
      name: 'Forgotten Hollow',
      grid: [
        '.............',
        '.............',
        '.....c.c.....',
        '......A......',
        '.............',
        '.............',
        '.............',
      ],
    },
  },
};

// Check every layout once at startup and warn (in the browser console) about mistakes.
function validate() {
  const all = [...CELLS_LAYOUTS.easy, ...CELLS_LAYOUTS.medium, ...CELLS_LAYOUTS.hard, ...Object.values(CELLS_LAYOUTS.special)];
  for (const l of all) {
    if (l.grid.length !== 7 || l.grid.some((row) => row.length !== 13)) {
      console.warn(`Room layout "${l.name}" must be 13 x 7 characters.`);
    }
  }
}
validate();
