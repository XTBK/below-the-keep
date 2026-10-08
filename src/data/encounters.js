// Encounters: a quiet room with someone (or something) in it, and a choice. No fight unless you
// pick one. One per floor at most (a feature room, see FEATURES in rooms/specialLayouts.js), never
// the same one twice in a run.
//
// Each: { name, look: [sheet, col, row], text, options: [{ label, note, can?(g) -> reason or null,
//        run(g, room, x, y) -> what happened (text) }] }

import { revealFloor } from '../items/Perks.js';
import { SPAWN_POOLS } from './enemies.js';

const heal = (g, n) => g.player.heal(n);
const loseHealth = (g, n) => {
  const p = g.player;
  p.halfHearts = Math.max(1, p.halfHearts - n);
  g.hud.markDirty();
};
const statBonus = (g, stat, n) => {
  g.player.potionBonus.stats[stat] = (g.player.potionBonus.stats[stat] || 0) + n;
  g.player.recompute();
};
const pedestal = (g, room, x, y, slot) => room.addRewardPedestal(x, y + 40, { price: 0, gone: false, ...slot });
const relicFor = (g, room, minQuality = 0) => ({ kind: 'relic', id: g.pickRelic('armoury', room.rng, { minQuality }) });

/** Something nasty, from this chapter's own creatures. */
function ambush(g, room, x, y, n) {
  const pool = (SPAWN_POOLS[g.chapterInfo.enemies] || SPAWN_POOLS.cells).medium;
  const types = Object.keys(pool);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.enemies.spawn(types[Math.floor(room.rng.next() * types.length)], room, x + Math.cos(a) * 70, y + Math.sin(a) * 50);
  }
  room.locked = true;
  g.audio.play('doorSlam');
  g.feel.shake(0.3);
}

export const ENCOUNTERS = {
  knight: {
    name: 'A Dying Knight',
    look: ['blackknight', 0, 0],
    text: "One of Varick's knights, leaning on his sword, blood pooling at his feet. 'The king sent us down to dig. I'm the last of my company.'",
    options: [
      {
        label: 'GIVE HIM A DRAUGHT',
        note: 'Costs a heart of your own health.',
        can: (g) => (g.player.halfHearts > 2 ? null : 'You have nothing to spare.'),
        run(g) {
          loseHealth(g, 2);
          g.player.pennies += 12;
          g.player.keys += 1;
          return 'He drinks, and presses his signet and a key into your hand. "Finish it," he says.';
        },
      },
      {
        label: 'TAKE HIS SWORD',
        note: 'A weapon - but he curses you with his last breath.',
        run(g, room, x, y) {
          const wid = g.pickWeapon(room.rng, { minQuality: 2 });
          pedestal(g, room, x, y, wid ? { kind: 'weapon', id: wid } : relicFor(g, room, 2));
          statBonus(g, 'luck', -1);
          return 'He does not let go easily. "May the dark know your name," he whispers, and is still.';
        },
      },
      { label: 'LEAVE HIM IN PEACE', note: '', run: () => 'You leave him with his company.' },
    ],
  },

  shrine: {
    name: "The Crown's Echo",
    look: ['idol', 0, 0],
    text: "A shrine of black iron, warm to the touch. The Crown's voice is very close: 'TAKE WHAT YOU NEED. WE CAN SETTLE LATER.'",
    options: [
      {
        label: 'TAKE ITS GIFT',
        note: 'A rare relic. The next floor will be cursed.',
        run(g, room, x, y) {
          pedestal(g, room, x, y, relicFor(g, room, 3));
          g.omenOwed = true;
          return 'Something rises out of the iron for you. Somewhere below, a debt is written down.';
        },
      },
      {
        label: 'SMASH IT',
        note: 'Needs a bomb. Embers, and a little healing.',
        can: (g) => (g.player.bombs > 0 ? null : 'You have no bomb.'),
        run(g, room, x, y) {
          g.player.bombs--;
          g.effects.explosion && g.effects.explosion(x, y);
          g.audio.play('explosion');
          g.earnEmbers(8);
          heal(g, 2);
          return 'The whisper screams, then stops. It is quieter in your head for a while.';
        },
      },
      { label: 'WALK AWAY', note: '', run: () => '"LATER, THEN," it says.' },
    ],
  },

  cell: {
    name: 'A Locked Cell',
    look: ['prisoner', 0, 0],
    text: "Someone behind the bars, too thin, too still. 'Please. The key. I'll give you everything I have.'",
    options: [
      {
        label: 'UNLOCK IT',
        note: 'Costs a key.',
        can: (g) => (g.player.keys > 0 ? null : 'You have no key.'),
        run(g, room, x, y) {
          g.player.keys--;
          g.audio.play('unlock');
          if (room.rng.chance(0.65)) {
            pedestal(g, room, x, y, relicFor(g, room, 1));
            return 'A grateful stranger. They press a small, strange thing into your hands and run for the stairs.';
          }
          ambush(g, room, x, y, 3);
          return 'It was never a prisoner. It was bait.';
        },
      },
      { label: 'LEAVE THEM', note: '', run: () => 'The voice follows you to the door.' },
    ],
  },

  candle: {
    name: "Beatrix's Candle",
    look: ['candles', 0, 0],
    text: 'A single candle, burned almost to nothing - and still lit. Someone has carried it a very long way.',
    options: [
      {
        label: 'BLOW IT OUT',
        note: 'A key, and embers. (If she is hunting you, she loses your trail for this floor.)',
        run(g) {
          g.player.keys += 1;
          g.earnEmbers(5);
          if (g.beatrix) g.beatrix._withdraw(9999);
          return 'Darkness. Somewhere, very far off, a woman starts to weep.';
        },
      },
      {
        label: 'LET IT BURN',
        note: 'Its warmth heals you.',
        run(g) {
          heal(g, 4);
          return 'You sit by it a while. It is the warmest thing in the Keep.';
        },
      },
    ],
  },

  satchel: {
    name: "A Mapmaker's Satchel",
    look: ['pickups', 1, 0],
    text: "Wynn's satchel - her name is stitched inside. Maps, chalk, and a few coins.",
    options: [
      {
        label: 'READ THE MAPS',
        note: 'This whole floor, mapped.',
        run(g) {
          revealFloor(g, false);
          return 'Her hand is neat and sure. The floor unfolds in your head.';
        },
      },
      {
        label: 'TAKE THE COINS',
        note: '10 pennies.',
        run(g) {
          g.player.pennies += 10;
          g.audio.play('coins');
          return 'Ten pennies. She would have wanted someone to have them. Probably.';
        },
      },
    ],
  },

  altar: {
    name: 'An Altar of Old Blood',
    look: ['chapel_altar', 0, 0],
    text: 'Older than the Keep. The stone drinks whatever is spilled on it, and it is always thirsty.',
    options: [
      {
        label: 'BLEED ON IT',
        note: 'Lose a heart for good. Hit harder for the rest of the run.',
        can: (g) => (g.player.baseMaxHalfHearts > 2 ? null : 'You would not survive it.'),
        run(g) {
          const p = g.player;
          p.baseMaxHalfHearts -= 2;
          statBonus(g, 'damage', 0.6);
          p.halfHearts = Math.min(p.halfHearts, p.maxHalfHearts);
          g.audio.play('roar', 0.5);
          return 'The stone drinks. Your arm feels heavier, and stronger.';
        },
      },
      {
        label: 'POUR A DRAUGHT ON IT',
        note: 'A heart of health, for luck and embers.',
        can: (g) => (g.player.halfHearts > 2 ? null : 'You have nothing to spare.'),
        run(g) {
          loseHealth(g, 2);
          statBonus(g, 'luck', 1);
          g.earnEmbers(4);
          return 'It hisses as it soaks in. Luck, the old gods say, is only blood remembered.';
        },
      },
      { label: 'LEAVE IT DRY', note: '', run: () => 'It waits. It is good at waiting.' },
    ],
  },

  gaoler: {
    name: "A Gaoler's Body",
    look: ['gaoler', 10, 0],
    text: 'A gaoler, long dead, his keyring still on his belt. Something in the dark is watching it.',
    options: [
      {
        label: 'TAKE THE KEYRING',
        note: 'Two keys - and whatever is watching.',
        run(g, room, x, y) {
          g.player.keys += 2;
          g.audio.play('keyJangle');
          ambush(g, room, x, y, 3);
          return 'The keys jangle. The dark answers.';
        },
      },
      {
        label: 'SEARCH HIM QUIETLY',
        note: 'Maybe a key. Maybe nothing.',
        run(g, room) {
          if (room.rng.chance(0.5)) {
            g.player.keys += 1;
            return 'You ease one key off the ring without a sound.';
          }
          return 'Nothing you can take without waking whatever watches.';
        },
      },
      { label: 'LEAVE HIM', note: '', run: () => 'He has kept his keys this long.' },
    ],
  },
};

export const ENCOUNTER_IDS = Object.keys(ENCOUNTERS);
