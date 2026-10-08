# Below the Keep

A top-down roguelike dungeon shooter in a dark medieval world. Built with Three.js + Vite.

**▶ Play it in your browser: https://below-the-keep.vercel.app** (keyboard, gamepad, or touch on a phone held sideways)
The full design lives in [GAME_DESIGN.md](GAME_DESIGN.md).

> For three hundred years the Keep of Hollowmere stood over its valley. Then a new king dug too deep, and found a
> crown that whispers. Now the Keep is sinking into the dark it woke - and the only way out is down.

6 heroes · 28 weapons · 125 relics · 70 enemies · 50 bosses · 3 secret realms · the Deep · a story told in pixel cutscenes · a Daily Descent leaderboard.

## Run it

```
npm install     # first time only
npm run dev     # then open the http://localhost:5173 link it prints
```

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | WASD | Left stick |
| Shoot (or swing, for the Iron Knight) | Arrow keys | Right stick |
| Dodge (each hero has their own: roll, blink, shield charge) | Shift | B |
| Active relic / scroll or potion / powder keg | Space / Q / E | RB / LB / LT (or A) |
| Menus: move / choose / back (the mouse works too) | W, S (or ↑ ↓) / Enter / Esc | D-pad / A / B |
| Title screen: change hero | A, D (or ← →) | D-pad left / right |
| Settings sliders and switches | A, D (or ← →) | D-pad left / right |
| Collection page: browse / next page / back | Arrows / Tab (or Q) / Esc | D-pad / RB / Start |
| Pause menu (resume, settings, controls, abandon run, quit) | Esc | Start |
| Debug: FPS + draw calls | F3 | |
| Debug: lighting-only view | F4 | |
| Debug: reveal map / open secret walls / next floor | F5 / F6 / F7 | |

Replay a run: add `?seed=XXXX-XXXX` to the URL.

On a phone: left thumb moves, right thumb shoots; BOMB / ITEM / USE buttons at the top, ROLL at the bottom centre. Tap a menu
choice to pick it; on the title screen tap the arrows beside the hero to change hero.

The title menu: **Begin the Descent**, **Daily Descent**, **Oaths** (after your first win), **Seeded Run**, **Collection**,
**Settings** (music and sound volume, screen shake, slow-mo on crits, damage numbers, fullscreen).

## Heroes

Three are open from the first run; three more unlock through deeds.

Each has their own weapon and their own dodge:

| Hero | Weapon | Dodge (Shift) | Best at | Worst at |
|---|---|---|---|---|
| **Wren, the Wandering Wizard** | Quick spell bolts that lean toward foes | **Blink** - teleports past enemies and over pits, leaving stinging sparks behind | Escaping crowds | Low damage per bolt |
| **Rowan, the Ranger Knight** | Crossbow: slow to reload, heavy bolts that fly far and pierce | **Roll** that reloads the crossbow. **Steady Aim:** stand still for half a second and the next bolt is a sure critical hit (a glint shows over his head) | Patient fights, lines of foes | Being swarmed |
| **Sir Aldwin, the Iron Knight** | Sword swing that knocks foes back and bats shots out of the air; a weak, short sword-wave | **Shield charge** - dashes forward, bashing and stunning whatever he hits | Brawling, fast kills | Taking hits; foes that keep their distance |

The three were balanced with a bot that plays each hero through the same fights on every chapter: they
take about the same damage for their health (within ~10%); the Iron Knight kills fastest but takes the most.

## The HUD

The screen is framed by two stone-and-iron side panels (the Keep's ledger), so the room in the middle stays
clear. **Left:** the hero's portrait and weapon, **vigor** (one blood segment per heart, iron after them),
pennies, bombs, keys and embers, then what's in your hands (active relic and charge, trinket, Q item).
**Right:** the map, the floor's name and any omen, and the relics you carry.

## The Gatehouse

Every run (except the Daily Descent) begins at **the Gatehouse**, home above the Keep. Its walls hold five empty
sets of shackles: the king sent five people down before you, and they're still alive somewhere below, in chains.
Find one (from floor 2 on), clear their room and **spend a key** to free them. From then on they wait at the
Gatehouse and help you on every run:

| Prisoner | Found from | Their help |
|---|---|---|
| **Hollis the Smith** | floor 2 | Re-forges any weapon you've ever carried: touch him to pick the weapon you start with |
| **Bram the Quartermaster** | floor 2 | You set out with an extra bomb, an extra key and 5 pennies |
| **Sister Ottilie** | floor 3 | Her prayer: the first time you fall in a run, you rise again with 2 hearts |
| **Wynn the Cartographer** | floor 4 | Every floor's boss, armoury and merchant are on your map from the start |
| **Old Ambrose** | floor 5 | Opens a forgotten stair in the Gatehouse: start in the Catacombs with a relic in hand |

## Embers and the Hearth

Every run brings something home. You earn **embers** as you go: each boss is worth more the deeper you are and
the tougher it is, a floor with no damage taken earns a bonus, champions drop one, and winning earns 25. Oaths
(heat) and the Stalked mode multiply them. When the run ends, won or lost, they're carried home. Spend them at
**the Hearth** in the Gatehouse on lasting upgrades. Most are taught by a prisoner you've freed:

| Upgrade | Teacher | Ranks |
|---|---|---|
| Kindled Heart | (always) | +1 heart, +2 hearts |
| Tempered Steel | Hollis | +0.25 / +0.5 / +0.75 damage |
| Fuller Stores | Bram | +5 pennies, then another bomb |
| Deeper Prayer | Ottilie | the prayer lifts you with 3 hearts, then is answered twice |
| Keen Eye | Wynn | secret rooms on the map, then the whole floor |
| Old Knowledge | Ambrose | a rare relic down his stair, then a relic every run |

(The Daily Descent never earns or uses embers, so its board stays fair.)

## Stalked: Beatrix the Wandering

A separate mode, from the title menu (**STALKED**). Beatrix can't be killed. A little while after you reach a
floor she starts walking toward you, room by room. You hear her before you see her: a heartbeat that quickens,
whispers, the light thinning, the edges of the screen going dark. Then she comes through the door and drifts
straight at you, through rocks and walls. If you keep your distance too long, she's suddenly behind you.

- Her touch costs **a heart and a half**; then she lets you go for a while (about 24 seconds).
- She takes a moment to become solid when she arrives, and while you're fighting the room she drifts slower and won't appear behind you.
- A **dodge** passes through her unharmed. A **bomb** beside her drives her off.
- Leave the room and she follows, a few seconds behind. She won't enter a boss's room while the boss lives.
- Embers x1.5.

## The Deep (after the Mad King)

When the Mad King falls, his crown rolls away into the dark beneath the throne. You choose: **return to the
Gatehouse** (the run ends, a win) or **hunt the crown below** - ten more floors, five places no one has seen:

| Floors | Place | Its creatures | Its guardian |
|---|---|---|---|
| 10-11 | **The Rootdeep** - the roots of the world, amber sap glowing in them | Root Hounds, Sap Bulbs | The World-Root |
| 12-13 | **The Frozen Deep** - a kingdom that froze itself rather than fall | Rime Wraiths, Ice Golems | The Rime Queen |
| 14-15 | **The Sunken Kingdom** - the drowned kingdom that stood before the Keep | Drowned Knights, Tide Sirens | The Sunken King |
| 16-17 | **The Amethyst Caverns** - violet crystal, and something coiled round the light | Crystal Spiders, Shard Magi | The Crystal Wyrm |
| 18-19 | **The Hollow Heart** - the living dark at the bottom of everything | Heart Leeches, Hollowborn | **The Hollow** |

Each place has its own colours, air, music and arrival scene (with the Crown's whisper). Each first floor ends with
a Deadly boss from the whole roster; each second floor with the place's own guardian; floor 19 with the Hollow, in
three phases, wearing the crown at last. Beating it is the deepest ending (and +50 embers). Forks in the road
continue between the Deep's floors. (Not on the Daily Descent.)

## Encounters

Now and then a floor has **a quiet room** with no fight in it - just someone (or something) and a choice. Seven of them,
never the same twice in a run:

- **A Dying Knight**: give him a heart of your health for pennies and a key, or take his sword (a weapon) and his curse.
- **The Crown's Echo**: take its rare relic (and the next floor is cursed), smash it with a bomb, or walk away.
- **A Locked Cell**: spend a key on the stranger inside. Usually grateful. Not always.
- **Beatrix's Candle**: blow it out (a key and embers - and in Stalked mode she loses your trail), or let it heal you.
- **A Mapmaker's Satchel**: Wynn's maps (the floor revealed) or her coins.
- **An Altar of Old Blood**: a heart for good in exchange for damage, or a draught for luck.
- **A Gaoler's Body**: take his keyring and face what guards it, or try to slip one key off quietly.

Esc walks away without choosing; you can come back.

## The road forks

After each floor's boss, the trapdoor drops you at **a fork in the road**: three ways down, shown on a map. The
Old Stair is always there; the other two are drawn from:

- **The Bloodied Road**: harder rooms and more champions, but its boss leaves an extra relic.
- **The Pilgrim's Way**: gentler rooms, and you're healed 2 hearts on arrival.
- **The Market Road**: 12 pennies on arrival, and the floor's merchant sells for 25% less.
- **The Whispering Road**: an omen always hangs over the floor, but a relic waits where you land.
- **The Hidden Way** (now and then): straight down into a secret realm. You skip the ordinary floor above it.

## Rooms and arenas

Rooms aren't all open boxes any more. Some rooms are **shaped by their own walls**: round chambers, diamonds,
octagons, crosses, triangles (the Wedge and the Spire), an hourglass, a ring round a solid block, twin pillars.
Others are carved with **chasms** (crosses, rings, ledges, islands,
rope bridges with planks) and **shallow water** that slows anyone walking through it (dodge-rolling skims over it).
Each boss fights in an **arena that suits it**: pillared halls, round pits, flooded chambers, chasm rims, rings of
fire and candlelit altars (`src/data/rooms/shapedLayouts.js`).

## Weapons

Wren, Rowan and Sir Aldwin can find new weapons on pedestals (in treasure rooms now and then, from Deadly and
Legendary bosses, and always at the bottom of a secret realm). Taking one puts yours down in its place, so you can
always change your mind. Every weapon is a trade, not a strict upgrade (`src/data/weapons.js`):

| Wren's wands | Rowan's bows and crossbows | Sir Aldwin's blades |
|---|---|---|
| **Ember Wand** - bolts set foes burning | **Yew Longbow** - lighter arrows, loosed far faster | **Bearded Greataxe** - slow, huge, a wide sweep |
| **Tide Wand** - heavy globes that bowl foes over | **Siege Arbalest** - enormous bolts, a long winch | **Longsword** - the longest reach |
| **Rime Wand** - freezes, and pierces | **Repeating Crossbow** - three bolts at once | **Twin Daggers** - fast, close, relentless |
| **Storm Wand** - lightning that jumps foe to foe | **Huntsman's Bow** - quick, and finds weak spots (more crits) | **War Hammer** - stuns, and the floor shockwaves |
| **Adder Wand** - weaving, poisonous bolts | **Dragonbreath Crossbow** - burning, bursting bolts | **Morning Star Flail** - hits all around him |
| | | **Emberbrand** - a sword that sets foes alight |

Each shows in the hero's hands (a wand tip glows in its element's colour) and in the HUD beside the active relic.

## Secret realms

Somewhere in a floor's secret rooms there may be a **Sealed Stair** (ringed with violet runes). Below it lies a
secret realm - a short floor of creatures found nowhere else, and one of **five secret bosses** at the bottom:

- **The Drowned Cistern** (under floors 2-3): Drowned Pilgrims spit slowing water; Cistern Eels swim unseen and burst up.
- **The Starless Chapel** (floors 4-5): Hollow Nuns blink close and cast seeking curses; Censer Acolytes trail poison smoke.
- **The First King's Forge** (floors 6-7): Bellows Imps breathe cinders; Anvil Knights charge and hammer out rings of iron.
- Secret bosses (one at random each time, never twice a run): the Cistern Leviathan, the Mirror Queen, the First King's
  Shade, the Bone Organist and the Faceless Saint.

Beat the boss for a **weapon and a rare relic** (both yours), then its trapdoor drops you onto the next floor. Each
realm has its own colours, music and story scene.

## The story

Under the Keep of Hollowmere lies the Hollow, sealed behind the Deep Door by the First King with a crown forged
from fallen-star iron. King Varick dug for silver and found the First King's tomb instead. The **Hollow Crown** on
the skull whispered to him to take it home, down to the door it was made to lock. He sent his people down to dig
(the five prisoners among them) and his bride **Beatrix** followed with a single candle. None came back. Now the
Keep is sinking, and your hero goes down.

The cutscenes are staged with the game's own art (the same tiles, props, heroes, creatures and bosses, lit by
torchlight), with close-ups for the important moments. The Crown speaks to you in purple as you reach each new
place, and both endings have their own scenes. The first Stalked run tells who Beatrix is.

Beaten bosses open a **stairway** in the floor (two stone slabs grind apart) instead of a trapdoor, and healing
comes from **healing draughts** (crimson vials; half-full ones heal half a heart), never from hearts lying around.

Any key moves on, Esc skips; they can be switched off in Settings (`src/ui/Cutscenes.js`).

## Every run counts

- **125 relics.** Every one is Common, Fine, Rare or Legendary (`src/data/quality.js`). After two weak relics in a row
  the next pedestal is guaranteed Rare or better (bad-luck protection).
- **Choices.** Some treasure rooms offer two relics: take one and the other crumbles.
- **The Blacksmith's Anvil** (in every merchant's room): stand beside it to melt your newest relic and forge one a step better.
- **Boss ranks.** All 50 bosses are ranked **Normal**, **Hard**, **Deadly** or **Legendary** (skulls on the title card). Higher
  ranks hit harder and only appear deeper - and drop better relics; Deadly and Legendary ones offer a choice of two, and a
  Legendary also leaves an iron chest.
- **Oaths** (after your first win): swear oaths before a run - more health or speed on foes, more champions, deadlier bosses,
  weaker healing, dearer shops, an omen every floor, no map, only two hearts. Each adds **heat** (up to 13); hotter runs find
  better relics, and each hero's best heat won is remembered.
- **The Daily Descent**: one seed and one hero for everyone, each day (UTC). Your first run of the day goes on the leaderboard
  (deepest floor, then fastest time); replays are practice.

### Putting it on itch.io

Everything is in `itch/`: the browser build (`below-the-keep-web.zip`), the cover (630 x 500), a header banner
(960 x 300), a 23-second trailer GIF (plus a lighter backup), eight 1280 x 720 screenshots in upload order, and
`ITCH_PAGE.md` with the page text, tags, theme colours and the upload steps. The trailer and screenshots are recorded
straight from the game (staged scenes, a bot at the controls, damage numbers off, a light brightness lift). Rebuild the zip with `npm run build:itch` (it uses relative paths,
which itch needs) and zip the contents of `dist-itch/`. The itch copy uses the website's Daily Descent board.

### Turning on the Daily Descent leaderboard

The board is a tiny serverless function (`api/daily.js`) that keeps scores in Redis. To switch it on for the Vercel site:

1. In the Vercel dashboard open the **below-the-keep** project, then **Storage** → **Create** → **Upstash for Redis** (free tier is fine).
2. Connect it to the project. Vercel adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` settings by itself.
3. **Redeploy** (Deployments → the latest → Redeploy). The Daily Descent screen now shows the live board.

Until then the game still works: the board says it's unreachable and your best daily run is kept on your device.

## Sound and music

Everything you hear is synthesised live, no sound files: plucked lute and harp strings, cast bells, clanging
metal, frame drums, war horns, a choir and beastly growls, all in a stone-dungeon reverb (`src/core/Synth.js`
builds the instruments, `src/core/Sounds.js` has a recipe per sound effect). The music is generated too
(`src/core/Ambience.js`): each place has its own song, written as rules - a mode, a chord progression, a bass
line, harp or lute picking, a melody built from a motif that repeats and varies, drums and bells - and played
note by note, so it never repeats exactly. A funeral march on the title, a grim lute for the Cells, choir and
bells for the Catacombs, a strange pipe dance in the Hollow, war horns in the Burning Halls, drums for bosses. To use your own music instead, put a file in `public/assets/music/` and name it in `src/data/music.js`
(e.g. `cells: 'assets/music/cells.ogg'`); set `generated: false` there to turn the generated music off.

## Where things live

- `src/data/` — **every tunable number** (speeds, damage, lights, particles), palettes, controls, room layouts, asset list
- `src/data/chapters.js` — the four chapters, the throne and the Forgotten Vault (tiles, light, air, bosses)
- `src/data/characters.js` — the six playable characters; `src/data/curios.js` — trinkets, scrolls, potions, seals, journal pages
- `src/data/music.js` — which music file plays when
- `src/data/difficulty.js` — **how much harder each floor gets**, and how random bosses are scaled
- `src/data/omens.js`, `src/data/sets.js` — floor curses and the five transformations
- `src/data/bosses2.js`, `src/data/bosses3.js` — the second and third boss rosters (every boss is data: phases + attack patterns)
- `src/data/quality.js` — relic quality, bad-luck protection, choice pedestals, the anvil; `src/data/oaths.js` — the oaths
- `src/data/settings.js` — the player's settings; `src/core/Daily.js` + `api/daily.js` — the Daily Descent and its board
- `src/ui/Menus.js` — every menu (title, pause, settings, controls, oaths, daily); `src/ui/TitleBackdrop.js` — the castle
- `src/render/` — pixel-perfect render pipeline, lighting, particles, procedural art (`render/art/`)
- `src/core/` — game loop, input, seeded RNG, object pool, save data, sound
- `src/world/` — floor generator, layout picker, rooms and collision
- `src/data/rooms/` — **room layouts as text grids** (add your own here): Cells, chapters 2-4, special and secret rooms
- `src/entities/` — Wren, sling stones, props, doors
- `src/enemies/` — the enemy framework; Cells enemies (one file each), `catacombs.js`, `hollow.js`, `halls.js`,
  floor hazards (`Hazards.js`) and bosses (`bosses/`; chapters 2-4 and the finale all run on `PatternBoss.js`)
- `src/data/enemies.js` — **every enemy number** (health, speed, timings, spawn pools, champions)
- `src/data/items.js` — **every relic, pickup, drop table and shop price**; `src/data/bosses.js` — boss numbers
- `src/items/` — relics → stats + shot profile, active relic effects (`Relics.js`), perks (`Perks.js`), trinkets / scrolls / potions (`Curios.js`), companions (`Familiars.js`), transformations (`Sets.js`)
- `src/world/Secrets.js` — the candle puzzle, bookcases, wishing well, rug and sword in the stone
- `src/ui/` — HUD, minimap, collection page, touch controls, pixel font
- `public/assets/` — drop-in PNG art overrides (see the README there)
