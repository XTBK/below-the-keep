# Below the Keep — Game Design Document

> Living document. Read this at the start of every work session and keep it updated.
> Last updated: 2026-10-07 (Phases 6, 7 + 8 complete, awaiting review)

---

## 0. Status / Build Plan

| Phase | Content | Status |
|---|---|---|
| 1 | Project setup, pixel-perfect render pipeline, lighting test room, Wren moving and shooting | Done |
| 2 | Room transitions, floor generation, minimap, locked doors | Done |
| 3 | Enemy framework (states, telegraphs, pooling) + Chapter 1 enemies with Cells art | Done |
| 4 | Pickups, bombs, keys, Armoury & Merchant, item + modifier system, first 15 relics | Done |
| 5 | Chapter 1 bosses, floor progression, death & restart, title screen | Done |
| 6 | Chapters 2, 3, 4 (enemies, art, layouts, bosses) | Done |
| 7 | All remaining items, special rooms and secrets | Done |
| 8 | Final boss, unlocks, characters, collection page, polish & performance pass | Done |
| E1 | Expansion: 20 enemies, 20 bosses, 25 relics, random scaled bosses, depth difficulty, classic roguelike systems | Done |
| E2 | Its own soul: songs per place, new title, Ranger + Iron Knight, parchment map, weighty combat, dodge roll | Done |
| E3 | Hero skills (blink / steady aim + reload roll / shield charge), bot-tested balance, punchier attack sounds | Done |
| E4 | Smooth hits, relic quality + anvil + choices, oaths, Daily Descent, 40 bosses with ranks, redrawn bosses, real menus, castle title | Done |
| E5 | No stutter, readable fights (attack budget, glowing shots, brighter Hollow and Halls), story cutscenes, new obstacles, 100 relics, real beams and fire, balance pass, itch.io + link preview | Done |
| E6 | Found weapons (18 + 3 starters) and three secret realms with 6 secret enemies and 5 secret bosses | Done |
| E7 | Its own shape: the Gatehouse and five prisoners to free, the fork in the road, shaped rooms, water, boss arenas | Done |
| E8 | Its own face: the ledger HUD, embers and the Hearth, the Stalked mode (Beatrix the Wandering); snappier dodges | **Done — awaiting OK** |

After each phase: runs with no console errors, explain how to test, STOP and wait for OK.

---

## 1. The Game

**Working title:** Below the Keep

A top-down roguelike dungeon shooter (twin-stick, room-by-room) set entirely in a dark medieval world.
**Use ONLY original names, characters, items and art.** Nothing copied from any other game (names, items, enemies, sprites, text).

**Premise (placeholder):** Wren, an old grey wandering wizard, is thrown into the dungeons beneath the castle of a paranoid, mad king.
Armed with a wand (the other heroes with slings), he escapes by going *deeper*: the cells, the catacombs, a witch-haunted underground forest,
and finally the burning lower halls of the keep, where the Mad King waits.

---

## 2. Tech

- **Three.js + Vite**, plain JavaScript ES modules. `npm install` then `npm run dev`.
- Folders: `/src/core`, `/src/render`, `/src/world`, `/src/entities`, `/src/enemies`, `/src/items`, `/src/ui`, `/src/data`, `/public/assets`.
- **All tunable numbers live in `/src/data`** (speeds, damage, drop rates, room counts, light settings...).
- Steady 60 fps: object pooling (projectiles, particles, enemies), no per-frame allocations, instanced/batched sprites.
- **Seeded RNG** for all run generation. Seed shown on pause screen. Cosmetic effects (particles, flicker) use a separate unseeded RNG so they never change a run.
- Save unlocks and stats in `localStorage`.
- Controls: WASD move, Arrow keys shoot (4 dirs), Space active item, Q consumable, E bomb, Esc pause.
  Gamepad: left stick move, right stick shoot, RB/RT active, LB consumable, LT/A bomb, Start pause (see `src/data/controls.js`).

### 2.1 Technical decisions (made during implementation)

- **Units:** 1 world unit = 1 game pixel. Low-res target is 640×360.
- **Camera:** orthographic, looking straight down the -Z axis at the XY plane. The "3/4 view" is faked in the art
  (top wall shows its brick front face; characters are drawn from a slight top-front angle). Depth order:
  `z = 2 + (4000 - y) * 0.0001` (`depthFor` in Sprite.js) so things lower on screen draw in front across a whole floor.
  Sprites use alpha-test (no sorting problems).
- **Pixel-perfect pipeline:** scene → 640×360 half-float render target (NearestFilter) → bloom (bright pass,
  quarter-res blur) → composite (bloom + colour grade + vignette + HUD) into a 640×360 target → blit to screen
  at the largest **whole-number scale** that fits, centred with black bars. All sprite positions are rounded to whole pixels.
- **Lighting:** Three.js `MeshStandardMaterial` with generated normal maps, lit by a **fixed pool of point lights**
  (count never changes → no shader recompiles; unused lights get intensity 0). Light brightness is specified as a
  friendly 0–N number in config and converted to physical intensity in `Lighting.js`.
- **Procedural art:** a `Painter` draws into both a colour buffer and a **height buffer** at the same time. Normal maps
  are derived from the height buffer (Sobel filter). So every shape has deliberate relief (bevelled bricks, rounded heads, etc).
- **Asset overrides:** every generated sprite has a key in `src/data/assetManifest.js`. To replace one with real art,
  drop `<key>.png` (and optionally `<key>_n.png` for a normal map) into `/public/assets/` and list it in
  `/public/assets/overrides.json`. Sprite sheet layout = rows are animations, columns are frames (frame size from the manifest).
- **Projectiles:** pooled, drawn with a single `InstancedMesh`.
- **HUD/menus:** drawn with an original 5×7 bitmap font onto a 640×360 canvas that's composited in the low-res pass (crisp).
- **Timestep:** the simulation uses the real frame time (clamped to 1/30 s), so movement is smooth on 60/120/144 Hz screens.
  Hit-stop freezes the simulation for N seconds. Input remembers key taps shorter than one frame.
- **Particles:** three batches: `lit` (debris, smoke), `dust` (ambient motes) and `glow` (embers/sparks, additive).
- **Audio:** everything synthesised with Web Audio, no sound files, aiming for an acoustic medieval sound (not chiptune):
  `core/Synth.js` builds instruments (Karplus-Strong plucked strings for lute/harp, inharmonic bells, metal clangs,
  frame drums, war horns, a formant choir, formant growls, filtered noise); `core/Sounds.js` is one recipe per sound
  effect; everything passes through a generated stone-room convolution reverb and a soft compressor. Jingles use the
  church modes (D dorian), with a major chord kept for victory.
- **Generated music** (`core/Ambience.js`): per moment a mode, tempo and parts (breathing drone, wandering lute,
  harp figures, bells, heartbeat drum, boss frame-drum patterns + lute riffs, horn stabs and choir for the final
  bosses, a funeral bell on death). Notes are scheduled a quarter second ahead each frame. A music file named in
  `data/music.js` replaces the generated music for that moment.
- **Room size:** 13×7 floor tiles of 32 px (416×224) + walls (top 64 px incl. front face, sides 32, bottom 32) = 480×320.
  Leaves a 40 px HUD band at the top of the 640×360 screen. One room = one grid cell of the floor.
- **World layout:** every floor grid cell (9×8) has a fixed world position (480×320 each), so neighbouring rooms sit side by
  side and the camera slides between them. Only the current room (plus the next one during a slide) exists as graphics.
- **Room shapes:** a room is built on a grid of 32 px "slots" (15×10 per cell). Each slot is floor or wall; the wall piece
  (top wall, side wall, corner, outer corner of an L) is chosen from which neighbours are floor. One rule handles
  1×1, 2×1, 1×2, 2×2 and L rooms. Large rooms put one 13×7 layout in each cell. The camera follows Wren in large rooms.
- **Floor data vs graphics:** `world/FloorGenerator.js` makes pure data (rooms, cells, connections); `world/Room.js` builds
  the graphics on entry. Room state (visited, cleared, broken props) lives in the data, so it persists when you return.
- **Connections** are shared by the two rooms they join: kind (normal / armoury / boss / secret), locked (needs a key),
  hidden (secret wall), hint (secret rooms show a crack + falling dust; super-secret rooms show nothing).
- **Light pool:** 24 lights; each room may use up to 10 (two rooms are lit during a slide).
- **Layouts** live in `src/data/rooms/cellsLayouts.js`. The picker checks that a layout never blocks the way between the
  doors of its cell, and the tile in front of every door is always cleared.
- **Enemies** (`src/enemies/`): each enemy is a state machine subclass of `Enemy.js` (states like walk / windup / attack /
  recover; `stateTime` counts time in the state). `EnemyManager` pools them per type (created once, reused), updates the
  ones in the current room, separates overlapping enemies, applies touch damage, and answers stone hit-tests.
  Stats live in `src/data/enemies.js`. Layout digits 1-7 spawn a specific enemy; `e` picks from a weighted pool for the
  layout's difficulty. Spawn choices, pack sizes and champions use the room's SEEDED rng; AI wiggle uses the cosmetic rng.
- **Pathfinding:** `world/NavGrid.js` flood-fills the room's 32 px slot grid from Wren's slot whenever he changes slot;
  walkers step to the neighbouring slot with the lowest count (around rocks, pits, barrels). Also does line of sight
  and raycasts (crossbow aim lines).
- **Telegraphs:** `render/PixelOverlay.js` draws crisp 1 px lines/rings/arcs each frame (additive glowing red/orange).
  A second, lit overlay draws chains. Every enemy attack shows a telegraph before it lands.
- **Enemy readability:** every enemy has a faint self-glow (`ENEMY_FX.selfLight`) so it reads in dark corners
  (a dormant Barrel Mimic has none, so it stays identical to a real barrel).
- **Enemy shots** (bolts, lobbed fireballs), **burning patches** and **floor splats** are pooled; fireballs and fire
  patches may borrow up to 3 lights from the light pool.
- **Chapters** (`src/data/chapters.js`): floor N → chapter (2 floors each), then floor 9 = the Throne. A chapter sets the
  tileset, colour grade, ambient light, atmosphere particles (dust / fog / spores / embers), torch colour, which
  creatures and room layouts fill it, and its bosses. The Forgotten Vault is a side floor with the Catacombs' look.
- **Tilesets** (`render/art/tilesets.js`): one `makeTileset(style)` builds floor / wall / pit / spike / decor / rock / door
  art for every chapter from a small style object. Sprites may have a **glow layer** (Painter `glow()` / `lit()` → an
  emissive map) for lava, mushrooms, witch-fire, eyes; enemy glow sheets get their soft self-light baked in.
- **Hazards** (`enemies/Hazards.js`): fire / poison / spore / web patches and telegraphed ERUPTIONS (roots, bone spikes,
  fire pillars, dirt, shockwaves, falling skulls, shadow spears); lines of eruptions are eruptions with growing delays.
  Orbs can home, weave in a wave, and leave webs or poison where they land.
- **Pattern bosses** (`enemies/bosses/PatternBoss.js`): one class runs nine bosses from data — phases by health, each
  a weighted list of attack patterns (lob, rain, summon, spiral, charge, pounce, ring, lines, fan, blink, sweep, slam,
  homing) with their numbers. Every pattern has a wind-up telegraph. Phase changes can swap the boss's sprite sheet.
- **Perks** (`items/Perks.js`): special rules switched on by relics / trinkets, each handled at one hook (kill, hurt,
  room cleared, floor start, firing). **Curios** (`items/Curios.js`): one trinket slot (always on), one Q slot (scroll /
  potion). Potion colours are shuffled per run (seeded); a potion is identified the first time it's drunk.
- **Altar room**: the generator puts a sealed room beside the boss (when there's space). Beating the boss may open it
  (35%, +35% if no damage was taken on the floor): a Shrine of the Old God (relics cost heart containers) or, if no dark
  deal was taken this run, a Chapel (free holy relics). On the throne floor it is the Crown Chamber behind a visible
  sealed door.
- **Feature rooms** (puzzle, library, well, rug) replace an ordinary one-cell room away from the start, at most one of
  each per floor (chances in `data/rooms/specialLayouts.js`). Super-secret rooms sometimes hold the sword in the stone.
  Illusory walls are only ever extra shortcuts (a doorway the floor can do without), never the only way forward.
- **Characters** reuse Wren's body: an outfit accessory + a colour swap (tunic / hair / skin ramps), plus their own
  health, stats, starting items.
- **Music hooks**: `audio.music(moment)` every frame picks title / chapter / boss / final boss / victory / death; files are
  listed in `data/music.js` (none yet → silent).

---

## 3. Visual Style: "HD Pixel Art"

Target: detailed, high-res pixel art (like Graveyard Keeper): rich palettes, detailed sprites, moody dynamic lighting,
soft shadows, atmospheric particles. NOT chunky 8-bit, NOT blurry.

- Orthographic, top-down with slight 3/4 perspective (walls show their front face).
- Render to ~640×360 with NearestFilter, upscale by whole-number multiples. Square, crisp pixels at all window sizes. Snap sprites to pixel grid.
- Characters 32×32 – 48×48, bosses 96×96+. Floor & wall tiles 32×32.
- All pixel art generated procedurally in code with a palette per chapter, using hand-designed shapes: outlines, shading,
  highlights, rivets, cracks, moss, cloth folds. Deliberate, not noise.
- Asset manifest so generated sprites can be replaced by PNG sprite sheets in `/public/assets` with the same name.
- **Lighting is the most important part of the look:** flickering torches & candles as real lights, generated normal maps
  for tiles and sprites, dark corners, blob shadows under every character.
- Atmosphere: dust motes, embers near fires, fog (catacombs), spores (forest), subtle bloom on fire & magic, vignette, colour grade per chapter.
- Animation for every character: idle, walk (4+ frames), attack wind-up, attack, hurt (1-frame white flash), death.
- Game feel: hit-stop on big hits, small screen shake, knockback, impact particles, satisfying death effects.

---

## 4. Core Gameplay

- Hearts (half-heart damage). Collect silver pennies, powder kegs (bombs), iron keys.
- Default attack: sling stones. Stats: damage, fire rate, shot speed, range, move speed, luck.
- Rooms lock while enemies are alive. Clearing a room may drop a pickup and charges the active item.
- Permadeath: restart from floor 1 with a new seed. Unlocks persist.

---

## 5. Floor Generation

1. 9×8 grid. Room count = `random(0..1) + 5 + floorNumber * 2.6`.
2. Start room in centre, add to queue. For each queued cell, try each of 4 neighbours. Skip if: already a room; it already has
   more than one room neighbour; we have enough rooms; 50% random chance. Otherwise make it a room and queue it.
3. Rooms that add no neighbours are dead ends. Boss room = dead end farthest from start (never adjacent to start). Retry floor if rules fail.
4. Special rooms in other dead ends: Armoury (treasure, needs key), Merchant (shop), plus random chances for others.
5. Secret room: empty cell touching ≥3 rooms, not touching dead ends. Hidden behind a cracked wall (bomb it).
6. Room interiors from hand-designed text-grid templates (rocks, pits, barrels, spikes, spawn points), easy/medium/hard pools. ≥15 layouts per chapter, in data files.
7. Occasional larger shapes (2×1, 2×2, L).
- Minimap reveals rooms as explored, icons for special rooms.

**Structure:** 4 chapters × 2 floors, then the final boss.
1. **The Cells:** damp stone, iron bars, straw, chains, torches (cold greys, warm torch orange)
2. **The Catacombs:** bone walls, skulls, candles, sarcophagi, mist (pale bone, sickly green)
3. **The Hollow:** underground forest, giant roots, glowing mushrooms, witch totems (deep teal, toxic purple)
4. **The Burning Halls:** collapsed throne halls, burning banners, lava cracks, gold (crimson, black, gold)

---

## 6. Items

- Passive relics, active relics (charge bars), trinkets, scrolls (single use), unknown potions (effect revealed on first drink).
- Start set: 40 passive, 10 active, 10 trinkets, 10 scrolls, 10 potions. Original, medieval
  (e.g. Blessed Sling, Ram's Horn, Alchemist's Eye, Plague Mask, Holy Water Flask, Crown of Thorns, Wolf Pelt, Black Powder Pouch).
- **Projectiles are a modifier pipeline**: relics add modifiers (split, homing, pierce, bounce, burning, poison, size, spectral,
  orbit, chain lightning, explode on hit). Modifiers stack and combine automatically → emergent synergies.
- Major relics change Wren's look or his stones' look.
- Item pools per room type: Armoury, Merchant, Secret, Boss, Shrine of the Old God, Chapel.
- Hover/inspect shows name + short cryptic flavour line, no exact numbers.

---

## 7. Enemies (30 + 20 in the second bestiary, see the Expansion log)

Each: unique silhouette, unique movement, readable telegraph before every attack, own death effect. Rare "champion" variant (tinted, buffed, special drop).

**Chapter 1 — The Cells**
1. Plague Rat — scurries erratically in packs, contact bite.
2. Gaoler — fat jailer, slow, swings key ring in a short arc when close.
3. Chained Prisoner — lunges when in line of sight; chain limits reach.
4. Torch Imp — keeps distance, lobs arcing fireballs leaving burning patches.
5. Ghoul — shambles toward you; bursts into a fly swarm on death.
6. Crossbowman — stops, red aim line, fires fast bolt.
7. Barrel Mimic — normal barrel until close, then hops after you.

**Chapter 2 — The Catacombs**
8. Skeleton Footman — walks toward you; shield blocks frontal shots.
9. Bone Archer — 3-arrow spread.
10. Candle Wraith — teleports between candles, slow homing wisps. Snuffed candles weaken it.
11. Ossuary Golem — charges in a line, stunned on wall hit.
12. Crypt Spider — drops from ceiling (shadow telegraph), spits slowing webs.
13. Grave Worm — burrows, erupts under you (dirt mound telegraph), ring of bone shards.
14. Plague Doctor — throws flasks leaving poison clouds, backs away.
15. Mourning Spectre — drifts through rocks & walls, only visible while moving.

**Chapter 3 — The Hollow**
16. Hedge Witch — wave-pattern curse bolts, sometimes summons rats.
17. Thornling — stationary bush, thorns in 8 directions on a rhythm.
18. Dire Wolf — circles you, then pounces.
19. Spore Bloater — waddles toward you, pops into spore cloud.
20. Wisp — floats, rotating spiral of small orbs.
21. Scarecrow — still; crows burst out when you shoot near it.
22. Root Sapling — slow; roots erupt along the ground in a line toward you.
23. Goblin Cutpurse — runs at you, steals pennies, flees. Kill to recover.

**Chapter 4 — The Burning Halls**
24. Black Knight — raises lance (telegraph), charges across room.
25. Flail Brute — spins ball-and-chain in a wide circle.
26. Gargoyle — invulnerable stone while dormant; wakes, swoops, returns to stone.
27. Court Magus — bullet-hell rings, then blinks away.
28. Living Armour — collapses on death, reassembles once unless you hit the pile.
29. Drake Whelp — deep inhale, then cone of fire.
30. Executioner — overhead axe slam, floor shockwaves.

---

## 8. Bosses

**Since Expansion 1:** every ordinary floor's boss is drawn AT RANDOM from the whole roster of 28 (seeded, no
repeats in a run) and scaled from its home floor to the floor it appears on (`data/difficulty.js`). Floor 9 is
always the Mad King, the Vault always the Forgotten Keeper, the sealed door always the Hollow Crown.

One boss per floor. Each chapter: smaller boss (floor 1) + main boss (floor 2).
Main bosses: **The Warden** (Cells), **The Bone Colossus** (Catacombs), **The Thorn Witch** (Hollow), **The Black Champion** (Burning Halls).
Smaller bosses: Mother of Rats, The Gravedigger, The Briar Hound, The Pyre Bishop.
Final boss: **The Mad King** (3 phases). Secret final boss: **The Hollow Crown** (needs all three Seal Fragments).
Hidden floor boss: **The Forgotten Keeper** (the Forgotten Vault). Every boss: ≥3 attack patterns, named health bar, intro title card.

---

## 9. Secrets

- Secret rooms behind cracked walls; hint = faint dust falling from the crack.
- Super-secret room per floor touching only one room, no visual hint, only faint echo sound near the wall.
- Illusory walls (walk-through), flicker very slightly every few seconds.
- Torch puzzles: snuff torches in the right order → hidden passage.
- Pushable bookcases in occasional library rooms.
- Wishing well: drop pennies; after a hidden number, something rare happens.
- Shrine of the Old God: risk-reward room sometimes after a boss (likelier if no damage taken). Trade max hearts for dark relics.
- Chapel: holy counterpart; only if no dark deal taken this run.
- Rug hiding a trapdoor → alternate path "The Forgotten Vault" with its own boss.
- Three Seal Fragments across the run → sealed door before the Mad King → secret final boss.
- Sword in the stone: pull only with a specific relic combination → unlocks a new character.
- Torn journal pages (rare drops) revealing the true story.
- Unlockable characters: Wren + 3 more, each with different stats and starting item.

---

## 10. UI & Audio

- Pixel-art HUD: hearts, pennies, bombs, keys, active charge, a parchment map. Pixel font.
- Title screen, pause menu (shows seed), death screen (what killed you + items), collection page.
- Web Audio API generated SFX and music in a medieval style (lute, harp, bells, drums, horns, choir; dungeon reverb). Music files can replace the generated music.

---

## 11. Phase Log

### Phase 1 — done
- Vite + Three.js project, folder structure, config files in `src/data`.
- Render pipeline: 640×360 target, integer upscale, bloom, vignette, per-chapter colour grade.
- Procedural Cells art: floor flagstones (cracks, moss, straw, puddles), brick walls with front face, torch sconces, chains,
  barrels, rocks, Wren (4 directions: idle 2f, walk 4f, throw 2f), sling stone, blob shadow — all with normal maps.
- Lighting test room: wall torches + brazier + candles, flickering point lights, Wren's faint lantern glow.
- Wren: WASD/stick movement with acceleration, arrow/stick shooting, sling stones with range + drop arc, impact particles.
- Breakable barrels (hit flash, wobble, hit-stop + shake on break, splinters).
- Atmosphere: dust motes, embers from fires.
- Seeded RNG, seed shown on pause screen (Esc). Save module (localStorage).
- Debug: F3 shows FPS / draw calls; F4 toggles lights-only view (normal map test).
- Touch controls (twin sticks + pause button) for phones; playable build published as a private claude.ai artifact.

### Phase 2 — done
- Floor generator exactly per section 5 (queue growth, dead ends, boss farthest and never next to start, Armoury + Merchant
  in dead ends, secret room touching 3+ rooms and no dead ends, super-secret touching one ordinary room, large 2×1 / 1×2 /
  2×2 / L rooms). Stress-tested on 8,000 floors: no failures, every rule holds, about 0.2 ms per floor.
- 18 Cells layouts (6 easy / 6 medium / 6 hard) + special-room layouts, as editable text grids.
- Doors: normal, armoury (gilded, key-locked), boss (horned, red glow), secret (blast hole); open / barred / locked states;
  face-on art for top walls, top-down art for side and bottom walls.
- Room transitions: the camera slides to the next room; Wren appears at the matching door.
- Combat lock: entering a room with enemies slams the doors (bars + dust + sound); they open when the room is cleared.
- Minimap (top-right): rooms appear when seen and light up when visited; icons for boss, armoury, merchant, secrets.
- Pits (auto-joining tiles; block walking, stones fly over) and floor spikes (half-heart damage).
- Wren can be hurt: knockback, flash, about 1 s of blinking invincibility.
- **Placeholders until later phases:** straw training dummies stand in for enemies (Phase 3); F6 opens secret walls instead
  of bombs (Phase 4); dying shows "Wren has fallen" and starts a new run (Phase 5 death screen); the boss room is empty (Phase 5).
- Debug keys: F5 reveal map, F6 open secret walls in this room, F7 next floor. Console: `game.debugEnterRoom(id)`.

### Phase 3 — done
- Enemy framework: state machines, spawn grace period, knockback by mass, hurt flash, death animation + corpse that
  blinks out, separation, touch damage, pooling, champions (5%: crimson tint, double HP, faster; drop hook for Phase 4).
- Chapter 1 enemies, each with its own art (idle, walk 4f, wind-up, attack, death; left/right), movement, telegraph
  and death effect:
  1. Plague Rat — packs of 3-4, erratic heading; rears up + squeak, then a lunging bite. Dies in a blood pool.
  2. Gaoler — slow chaser; raises key ring (jangle) with a red arc showing the swing. Collapses, keys scatter.
  3. Chained Prisoner — shackled to a floor ring (chain drawn live, sags when slack); trembles + rattles, then lunges;
     yanked to a stop at full chain length.
  4. Torch Imp — keeps range and circles; raises a fireball, orange ring marks the landing; leaves a burning patch.
     Crumbles to ash.
  5. Ghoul — lurching shamble; arms up + groan, red arc, lunging swipe. Bloats and bursts into 3 Carrion Flies.
  6. Crossbowman — repositions, aims (tracking red dotted line), locks (line flashes), fires a fast bolt, reloads.
     Armour clatters on death.
  7. Barrel Mimic — identical to a barrel (sprite, shadow, position, blocks like a barrel); wakes when close or shot;
     squashes before each hop with a red landing ring. Bursts into splinters and goo.
- Rooms lock while enemies (including a hidden mimic) are alive and unlock when the last one dies.
- Hand-placed encounters in several layouts (prisoners in Cell Block, crossbowmen behind pits, imps across pits,
  Gaoler + crossbowmen in Execution Yard, mimics among barrels).
- The training dummies from Phase 2 are gone.

### Phase 4 — done
- **Relic system** (`src/data/items.js`, `src/items/Relics.js`): relics give stats / stat multipliers / heart containers /
  one-off pickups / projectile modifiers / looks. `computeLoadout()` turns the relic list into Wren's stats and SHOT PROFILE.
- **Projectile modifier pipeline** (`src/entities/Projectiles.js`): homing, pierce, bounce, split, burn, poison, spectral,
  size, orbit, chain lightning, explode. Each is ONE independent step; stones carry every modifier's stack count, so
  combinations need no special code (split children inherit everything; explode + pierce explodes per enemy; etc.).
  Stone colour = blend of the relics' stone tints; 3 stone sizes; particle trails per modifier.
- **15 relics**: Blessed Sling, Ram's Horn (active), Alchemist's Eye, Plague Mask, Holy Water Flask (active),
  Crown of Thorns, Wolf Pelt, Black Powder Pouch, Hazel Fork, Tinder Box, Jester's Ball, Ghost Candle, Millstone,
  Thunder Nail, Rosary of Bone Beads. Major relics draw accessories on Wren (horns, mask, thorns, wolf hood + pelt,
  monocle, flask, soot) — his sprite sheet is rebuilt when his look changes.
- **Active relics**: Space; charge bar in the HUD; +1 charge per cleared room. Swapping actives leaves the old one on the pedestal.
- **Enemy status effects**: burn (orange, embers), poison (green, slowed), stun (dizzy stars).
- **Pickups**: penny, purse (5), heart, half heart, powder keg, key. Pop out with a bounce; left-behind pickups persist per room.
  Drops: cleared rooms, barrels, champions (2 guaranteed), bosses. All drop rolls use a seeded per-floor rng; luck makes "nothing" rarer.
- **Bombs** (E): fuse with faster blinking, blast hurts enemies and Wren, smashes barrels, turns rocks to rubble
  (remembered), blasts open cracked secret walls (room is rebuilt with the hole). Flash light, shockwave ring, scorch.
- **Armoury / secret / super-secret rooms**: relic pedestal from the room's pool (no repeats within a run).
- **Merchant**: three stands (slot 0 a relic for 15 pennies; others hearts / kegs / keys), pixel price tags.
- Standing near a relic shows its name + flavour line; taking one shows a banner.

### Phase 5 — done
- **Mother of Rats** (floor 1): Gnashing Charge (3 red path lines; dazed on hitting a wall), Brood Call (births rats),
  Plague Spit (fan of globs). Enraged below 50%: faster, double charge. Her brood dies with her.
- **The Warden** (floor 2): Iron Sweep (wide red arc), Lock-Down Slam (red landing ring, ring of stone shards),
  Turnkey's Volley (red lines per key). Enraged: calls two crossbowman guards once, bigger volleys.
- Boss rooms: title card intro (doors slam, nothing moves), named health bar, rewards after the death animation
  (relic pedestal from the boss pool + heart + trapdoor).
- **Floor progression**: trapdoor fades to black, next floor, floor title. After floor 2 (The Warden) → victory screen
  (Chapter 2 arrives in Phase 6).
- **Death screen**: what killed you (every damage source is named), floor, time, seed, relics; R / tap to descend again.
- **Title screen**: logo over the start room, Enter / tap to begin, F to type a seed, lifetime stats from the save.
- Save now tracks deaths, bosses beaten, victories, relics found.
- Touch: BOMB and ITEM buttons; tap to confirm menus.

### Phase 6 — done
- **Chapters 2-4** with their own tilesets, colour grades, ambient light, atmosphere and torch light:
  The Catacombs (bone walls, skulls, candles, fog), The Hollow (roots, glowing mushrooms, witch-fire, spores),
  The Burning Halls (dark marble and gold, burning banners, lava cracks, embers). Floor names per chapter.
- **24 new creatures** (enemies 8-30 + the Scarecrow's crows), each with its own art, movement, telegraph and death:
  Skeleton Footman (shield blocks stones from the front), Bone Archer (3-arrow fan), Candle Wraith (blinks between
  candles; snuff them with stones and it's stuck and takes double damage), Ossuary Golem (charge, dazed on walls),
  Crypt Spider (shadow ring, drops; spits slowing webs), Grave Worm (dirt-mound ring, erupts with bone shards),
  Plague Doctor (poison flasks, backs off), Mourning Spectre (passes through walls; only visible and hittable while
  moving), Hedge Witch (weaving curse bolts, summons rats), Thornling (8-way thorns on a rhythm), Dire Wolf (circles,
  pounces), Spore Bloater (swells and pops into spores), Wisp (spirals), Scarecrow (crows burst out when you shoot
  near it), Root Sapling (roots race along a line), Goblin Cutpurse (steals pennies; kill it to get them back),
  Black Knight (lance charge), Flail Brute (spinning ball and chain), Gargoyle (invulnerable stone; wakes, swoops),
  Court Magus (orb rings, then blinks), Living Armour (collapses; hit the pile or it reassembles), Drake Whelp
  (inhale, cone of fire), Executioner (axe slam, shockwaves along lines).
- **Six chapter bosses**: The Gravedigger, The Bone Colossus, The Briar Hound, The Thorn Witch, The Pyre Bishop,
  The Black Champion, each with 3+ patterns and a stronger second phase.
- **48 new layouts** (16 per chapter: 5 easy / 6 medium / 5 hard), all checked for size, tiles and door connectivity.
- Webs slow Wren; candles can be snuffed with stones.

### Phase 7 — done
- **Items**: 40 passive relics, 10 actives, 10 trinkets, 10 scrolls, 10 potions (+ The King's First Blade, from the
  stone). New actives: War Drum, Warding Bell, Thunder Jar, Hourglass of Grey Sand, Gilded Die (reroll pedestals),
  Blood Chalice, Mason's Hammer (smashes rocks, opens hidden walls), Raven Cage. New perks: multishot, rear shot,
  leech, thorn mail, map, dowsing (secret rooms), key saver, bigger kegs, greed, second wind, flight over pits,
  berserk, lantern, burning corpses, soul jar, rage, battery, keg-proof.
- **Q slot**: scrolls (Mending, Revealing, Fire, Lightning, Warding, Passage, Plenty, Haste, Unlocking, Banishing) and
  potions (some harmful!) whose colours are shuffled every run. **Trinket slot**: always on; picking another one
  swaps them. Curios drop from rooms, are sold by the Merchant, and show in the HUD.
- **Shrine of the Old God** (horned idol; three dark relics, each costs a heart container) and **Chapel** (only if no
  dark deal this run; two holy relics) behind the sealed door beside a beaten boss.
- **Secrets**: super-secret rooms echo faintly when you're near their wall; illusory walls flicker and can be walked
  through; candle puzzle (snuff the four candles in the tablet's order → Seal of Flame); library of pushable bookcases
  (one hides a journal page or a curio); wishing well (a secret number of pennies → Seal of Thorn); a dusty rug that a
  powder keg burns away to show the trapdoor to **the Forgotten Vault** (its own floor and boss, the Forgotten Keeper →
  Seal of Bone, then on to the next floor); the sword in the stone (needs Blessed Sling + Crown of Thorns → The King's
  First Blade, unlocks Maud); 10 torn journal pages telling the true story.
- Seal Fragments show in the HUD; new minimap icons for the Shrine, Chapel and Crown Chamber.

### Phase 8 — done
- **The Mad King** (throne floor, floor 9): The Mad King (scepter: coin rings, fans, crossbow guards) → The King
  Unthroned (sword: charges, fire, spirals) → The Crown Wears The King (shadow form: blinks, shadow spears, homing
  shadows). His sprite and title change with each phase.
- **The Hollow Crown**: with all three Seals, the sealed door in the throne room opens after the Mad King falls →
  the secret final boss → the true ending. Without them, the first ending (with a hint).
- **Characters**: Wren; Maud, the Squire (more health, harder hits, slower; Iron Gauntlet) — draw the sword from the
  stone; Agnes, the Witch's Apprentice (fragile, quick, homing stones, a healing potion) — defeat the Mad King;
  The Nameless (ghostly stones, flies over pits, fast) — break the Hollow Crown. Character picker on the title screen.
- **Collection page** (C on the title): relics, curios (unknown potions stay unknown), journal pages to read,
  characters (locked ones show how to unlock), lifetime deeds.
- **Polish & performance**: bigger shot pools for the final bosses, cached UI silhouettes, text normalising for the
  pixel font, music hooks with cross-fades, lit feature rooms. Heaviest fight (Hollow Crown phase 2, every relic, 96
  orbs, ~3,000 particles) simulates in about 0.8 ms per frame; 90 draw calls.


### Expansion 1 — done
- **Random bosses:** every floor draws its boss from all 28 (seeded, no repeats in a run). Each boss
  has a HOME floor; met elsewhere its health, tempo and shot speed scale from home to here, so an early boss
  late is dangerous and a late boss early is weaker and slower - a fair fight anywhere.
- **Depth difficulty** (`data/difficulty.js`): enemies gain health (+12%/floor), speed (+2.5%/floor) and tempo
  (wind-ups, cooldowns +3%/floor); champions get more common; from floor 7 every hit costs a whole heart.
- **20 new enemies** (`enemies/bestiary2.js`, art `render/art/enemiesArt3.js`), easy to hard, 5 per chapter:
  Cells: Kennel Hound (telegraphed dashes), Torturer (hook that drags you in), Rat Nest (spawner), Mad Monk
  (crosses of orbs), Sewer Slime (hops, splits into slimelets). Catacombs: Flying Skull (diagonal bouncer),
  Banshee (wail -> a ring of orbs with one gap), Necromancer (raises skeletons where bone spikes burst),
  Mummy (linen lash that pulls; enrages), Crypt Bats (flocks, swoops). Hollow: Puffcap (hides, spore ring),
  Bog Toad (hops, tongue lash), Elder Treant (rings of roots, swipes), Hollow Sprite (aim, dart, blink),
  Tusked Boar (triple charges). Halls: Hellhound (dashes leaving fire), Ballista (tracking line that locks,
  heavy bolt), Mad Jester (knife spirals, cartwheels), Molten Golem (burning footprints, smash, breaks into
  embers), Banner Bearer (allies near it are faster and tougher). 16 new layouts feature them (digits 9 0 j k v).
- **20 new bosses** (`data/bosses2.js`, art `render/art/bossesArt3.js`), each with two phases and 3-4 patterns:
  Old Gnasher, the Bloated Friar, the Rat King, the Headsman, the Iron Maiden, the Ossuary Choir, the
  Gravemother, the Plague Physician, the Lich, the Entombed Bishop, the Great Toad, the Fungal Matron, the Stag
  of Thorns, the Ancient Oak, the Moth Queen, the Court Jester, the Molten Knight, the Gargoyle Lord, Ashwing,
  the Burned Queen. New patterns: dash, boomerang, pull / gust, cross, minefield, laser (sweeping beams), breath
  (sweeping fire cone), wall (a row of orbs with a gap), bounce, charge trails (fire / poison / roots), rings
  with holes, minions shaken loose when hurt. Orbs can now ricochet and boomerang.
- **25 new relics:** 5 companions (Barn Owl, Spectral Page, Moth Guardian, Pet Raven, Little Squire -
  `items/Familiars.js`), new stone powers (boomerang, frost + shatter, wave, gild, knockback, fear, the Siege
  Crossbow's charge shot), Saint's Shroud, Martyr's Chain, Bottomless Purse, Dead Man's Hand, Wyrm Scale,
  Merchant's Seal, and actives (Powder Bag, Shepherd's Crook, Mirror of Truth, Censer, Horn of Plenty,
  Executioner's Sword, War Banner). 75 relics in all.
- **Classic roguelike systems with their own twist:** iron hearts (armour that soaks hits, can't be healed);
  chests (wooden / iron with a key / cursed gamble) and gem-studded rocks; **omens** (curses of a floor:
  Darkness, the Maze, the Lost, the Unknown, the Blind, the Hunt); **transformations** - carry three relics of a
  set (Plague, Saint, Beast, Alchemy, Menagerie) to become the Plaguebearer, the Saint, the Beast, the
  Alchemist or the Beastmaster (`data/sets.js`, `items/Sets.js`); the **Trial Chamber** (three waves for a
  relic) and the **Gambler's Den** (dice table, a beggar who repays kindness).

### Expansion 2 — its own soul — done

Goal: keep the classic room-and-relic roguelike skeleton but give the game its own feel.

- **Music** (`core/Ambience.js`): a small composer. Each moment is a song described as data: mode, tempo, chord
  progression, pad (choir or drone), bass rhythm, arpeggio, a melody grown from a 2-bar motif (A A' B A''; strong
  beats on chord tones, steps between), frame drums and bell tolls, alternating 4 quiet and 8 full bars. Title: a
  D-minor funeral march (choir, heartbeat drum, bell, horn). Cells: lute, D aeolian. Catacombs: choir and bells,
  E phrygian. Hollow: pipe and harp, A dorian dance. Burning Halls: horns and war drums, D harmonic minor. Vault,
  throne, boss, final boss, victory (the only major key), death. New instrument: the pipe (`Synth.pipe`).
- **Title screen:** only "THE ONLY WAY OUT IS DOWN" in pulsing red, embers rising, a slow red glow behind the logo,
  a "press any key for sound" hint until audio is allowed.
- **Two new starting heroes** (`starter: true` in `data/characters.js`, unlocked from the first run):
  - **Rowan, the Ranger Knight** - crossbow (`weapon: 'crossbow'`): damage +2.4, range +70, fire delay x1.75,
    shot speed x1.45, built-in pierce. Bolts are oriented to their flight (`quarrels` sheet). Hard recoil.
  - **Sir Aldwin, the Iron Knight** - sword (`weapon: 'sword'`, `WEAPONS.sword` in config): each "shot" is a
    swing - a 40 px arc of ±72°, x3.2 damage, heavy knockback, a lunge, carries burn/poison/frost/gild/fear, breaks
    props, and **parries** enemy orbs and bolts in the arc. Also throws a weak sword-wave (35% damage, 80 range).
    8 half hearts, move speed x0.92.
  - Wren's sling is hidden for heroes who carry another weapon; new looks: rangerhood, crossbow, greathelm, sword.
- **Parchment map** (`ui/Minimap.js`): a torn, scorched scrap of parchment; explored rooms in a sepia wash with
  an ink outline, glimpsed rooms dotted, corridors inked between known doors, ink marks for special rooms, a red
  wax seal for where you are.
- **Weight in combat** (`COMBAT` in config): crits (8% + 2% per luck, x2, gold burst, bigger freeze, a ring
  sound), hit-stop on every landed blow (rate-limited), floating pixel damage numbers (`ui/DamageNumbers.js`),
  enemies squash when struck, base knockback 140 -> 190, recoil per weapon.
- **Dodge roll** (`ROLL` in config; Shift / gamepad B / touch ROLL): 0.3 s tumble at 270 px/s, untouchable,
  can't shoot mid-roll, 0.7 s cooldown. The biggest change in how fights play.

### Expansion 3 — hero skills — done

Each starting hero gets their own dodge (`dodge` in `data/characters.js`, numbers in `SKILLS` in config):
- **Wren - Blink:** teleports 84 px (passes enemies and pits, stops at walls and rocks; nothing happens if there's
  nowhere to land), 0.25 s untouchable, 1.2 s cooldown. The sparks left behind hit foes within 36 px for x1.5
  damage. Her bolts also home gently (`mods: { homing: 0.3 }`).
- **Rowan - Reload roll + Steady Aim:** the normal roll, which also reloads the crossbow at once. Standing still
  for 0.5 s steadies his aim (a glint over his head, a soft chime): the next bolt is a sure critical hit. Damage
  stat +2.8.
- **Sir Aldwin - Shield charge:** a 0.22 s dash at 330 px/s, untouchable; foes it hits take x1 damage, are knocked
  back and stunned for 0.8 s. 1.1 s cooldown. Sword swing tuned to x2.5 damage, recovery x1.65 fire delay.

**Balance bot** (test script `balance.mjs`): each hero fights the same 8 encounters (an enemy group and a boss on
floors 1, 3, 5 and 7), 3 runs each, using a simple AI (keep range / close in, line up, dodge incoming shots).
Final results, damage taken as a share of starting health: Wren 1.60, Rowan 1.65, Aldwin 1.80; average clear
time: 24.7 s, 25.1 s, 15.2 s. Before tuning, the Knight was clearing twice as fast with no extra risk, and Wren
was the weakest.

**Sounds** redone in layers (new `Synth.sweep` for zaps and swells): the spell bolt (falling zap + thump +
glass sparks), crossbow (latch clack, string slam, stock kick, hiss), sword (rising-falling whoosh with weight),
blow landing (crunch, thud, iron ring), parry, crit, roll (cloth whip + boots on stone + grit), blink (air
rushing in, pop, shimmer), reload (windlass clicks + latch), steady chime, aimed-shot crack, shield charge (armour
rattle, pounding, grunt) and shield bash (booming clang).

### Expansion 4 — every run counts — done

- **The hitch on hits, fixed.** Every landed blow used to freeze the game for ~2 frames (hit-stop), which read as stutter
  with fast fire. Ordinary hits no longer slow anything; crits and big blows dip into slow motion (x0.2) instead of a dead
  freeze (`core/Feel.js`). The ~85 ms shader-compile spike the first time an enemy appeared in a run is gone: one hidden
  frame with an enemy, its shots and Wren's shots is drawn on the title (`Game._warmUp`). Measured: 99% of frames under
  1.3 ms during fights; walking through doors 1-2 ms per new room.
- **Relic quality** (`data/quality.js`): Common / Fine / Rare / Legendary. `Game.pickRelic(type, rng, { minQuality, bias })`;
  bad-luck protection after 2 weak relics in a row; **choice pedestals** (35% of treasure rooms; `slot.choiceOf` -
  taking one crumbles the other); the **Blacksmith's Anvil** (tile `F`, merchant room): hold still beside it for 1.4 s to
  melt the newest passive relic into one a quality step better.
- **Boss ranks** (`BOSS_TIERS`, `TIER_INFO` in `data/difficulty.js`): Normal / Hard (x1.15 hp, from floor 2) / Deadly (x1.35,
  from floor 4) / Legendary (x1.6, from floor 6), tempo up too. Rewards lean better (bias 0 / 0.5 / 0.9 / 1.2); Deadly and
  Legendary offer a choice of two, Legendary also leaves an iron chest. The rank shows as skulls on the title card.
- **Nine new bosses** (`data/bosses3.js`, art `render/art/bossesArt7.js`) for **40 in all**: the Turnkey, the Bellringer (Cells);
  the Weeping Widow, the Hanged Man (Catacombs); the Fen Hag, the Wicker Man (Hollow); the Grand Inquisitor, the Dread Knight,
  the Eye Below (Halls). New beam colours: holy, abyss. All tested through their phases.
- **Redrawn bosses** with a new art kit (`render/art/artKit.js`: tapered shaded limbs, pillow-shaded polygons, rim light):
  the Headsman, the Great Toad, the Bloated Friar, the Rat King, the Iron Maiden, the Lich, the Entombed Bishop, the Ancient Oak,
  the Gargoyle Lord, the Fungal Matron, the Court Jester, the Molten Knight, the Burned Queen, the Ossuary Choir, the Stag of
  Thorns, Old Gnasher, Ashwing, the Forgotten Keeper, the Hollow Crown, the Gravedigger, the Thorn Witch, the Pyre Bishop and the
  Plague Physician; and the enemies the Executioner, the Flail Brute and the Torturer (`enemiesArt4.js`).
- **Enemies made distinct**: the 50 already had their own attacks; the two clearest overlaps were reworked - the Kennel Hound now
  barks (a cone that shoves you back) and snaps in short hop-bites (the Hellhound keeps the long fiery dashes), and the Mummy
  unravels into whirling strips of linen that bind your legs (no longer a second Torturer-style pull).
- **Oaths** (`data/oaths.js`): 9 oaths, heat 1-3 each, max 13; each heat point adds 0.08 relic bias; best heat won per hero.
- **Daily Descent** (`data/dailySeed.js` shared with `api/daily.js`, `core/Daily.js`): UTC date -> seed + hero; score =
  depth x 100000 + (99999 - seconds); first run of the day posts; the server checks the seed and date, keeps each name's best,
  and keeps 14 days. Needs Upstash Redis env vars on Vercel (README); without them the board reports offline.
- **Menus** (`ui/Menus.js`): one cursor menu system for the title, pause (with the run's stats and relics), settings
  (music / sound / shake sliders, slow-mo, damage numbers, fullscreen - `data/settings.js`), controls, oaths, daily and yes/no
  confirmations; keyboard, gamepad, mouse hover/click and touch. New menu sounds.
- **The title**: a castle on a crag under a huge moon, mountains, layered pine forest, drifting mist, bats, flickering windows,
  distant lightning (`ui/TitleBackdrop.js`); the hero stands on a cliff to the right; the menu on the left.

### Expansion 5 — a soul of its own — done

- **The stutter, found and fixed.** Every new sprite cloned its sheet's texture and set `needsUpdate`, which in three.js
  re-uploads the whole sheet image to the GPU - so every spawn (flies, rats, embers, summoned minions, bosses) and every
  floor start pushed megabytes to the graphics card mid-game. Sprites now share the uploaded image (`shareTexture` in
  `render/Assets.js`), and every sheet is uploaded once behind the title (`preloadTextures`). Measured against all 50
  enemy types in real frames: no frame over 8 ms (it was 50-100 ms). Sounds are throttled too (the same sound can't
  restart within 35 ms; at most 22 new sounds per 0.1 s).
- **Readable fights.** An **attack budget** (`ATTACK_BUDGET` in config): at most 3 ordinary enemies (4 from floor 5) may be
  in an attack at once, each turn lasting 1.4 s with a 0.6 s rest after, so crowded rooms take turns (bosses exempt;
  `Enemy.canAct` -> `EnemyManager.mayAttack`). Enemy shots are unlit and glowing, so darkness never hides them. Your own
  shots dim when there are many; impact sparks are capped per frame; damage numbers on one foe merge into one rising
  total. The Hollow's floor and the Burning Halls' marble were lifted (they were near black), ambient light raised in the
  Hollow, Halls, throne and Vault; the spores and embers in the air thinned out (they read like shots).
- **The Hollow's walls fixed**: the great roots across its wall tiles had a random height and slope per tile, so they never
  met; they now run continuously (height and wave depend only on the position across the tile).
- **Obstacles of our own** (`render/art/rocksArt.js`): three per chapter, picked per tile - Cells: a masonry block with an
  iron ring, a broken pillar drum, the stocks; Catacombs: a mound of skulls, a sarcophagus lid, a fallen gravestone;
  Hollow: a mossy stump, a knot of roots, glowing toadstools; Halls: a crowned statue head, a column section, a golden urn.
- **The story** (`ui/Cutscenes.js`): the Keep of Hollowmere, the new king, the hollow crown found on a skull in the
  catacombs, the people sent down, and each hero's own reason to descend. Five animated pixel panels on each hero's first
  run; one on arriving in the Catacombs, the Hollow, the Halls, the throne and the Vault. Settings: Story Scenes on/off.
- **100 relics**: 25 more (`data/relics4.js`, icons `itemsArt4.js`) - 6 common, 10 fine, 6 rare, 3 legendary - built
  from proven effects only. Sanity limits on stacking: at most 4 extra shots, damage >= 0.5, range >= 70, shot speed
  130-560, move speed 60-230. The Collection shows each relic's quality.
- **Boss attacks redrawn** (`render/BeamFX.js`): lasers were drawn dot by dot on the telegraph overlay and ran out of dots on
  long beams (broken, flickering lines); they are now a white-hot core in a coloured glow with a flickering width, a flare
  at the source and a splash where they hit. Breath fire is a fan of licking tongues of flame from the mouth.
- **Animation polish**: every creature breathes when still and bounces in its stride (scaled from the feet); wind-ups pulse
  a warm glow on the body; enemy shots pop into being and pulse.
- **Balance pass**: a bot fought all 40 bosses on their floors with a typical build. Toned down: the Dread Knight (hp -18%,
  gentler finale), the Eye Below (hp -16%, two beams not three), the Fen Hag (fewer pots and mines), and the long fights of
  the Lich, the Court Jester and the Gravedigger (hp -15 to -20%).
- **Our own name for everything**: no mention of other games anywhere in the project; the one relic name close to a
  well-known item was renamed (Hare-Bone Charm).
- **Sharing**: a 1200x630 link-preview image and Open Graph / Twitter tags; an itch.io package in `itch/` (relative-path
  build, cover, page text, upload steps); the leaderboard API answers other sites (CORS) so the itch copy shares the board.

### Expansion 6 — weapons and secret realms — done

- **Weapons** (`data/weapons.js`): a weapon slot per hero. A weapon is applied like a relic (stats, statsMult, mods,
  perks, a shot tint) plus a look on the hero (`render/art/weaponLooks.js`: wand tips by element; longbow, arbalest,
  repeater, hunting bow, fire crossbow; greataxe, longsword, twin daggers, war hammer, flail, Emberbrand) and, for blades,
  its own swing (`melee`: reach, arc, damage, cooldown, knockback, lunge, plus stun and shockwave). Icons in
  `weaponIcons.js`. Pedestal kind 'weapon' (`ItemStand`): taking one leaves yours behind. Found: 14% of treasure
  pedestals, 40% of a Deadly/Legendary boss's second pedestal, and always at a secret boss. `Game.pickWeapon` only
  offers the hero's own class. Sling heroes have no weapon family. New `critBonus` perk (Huntsman's Bow).
  Balance: measured on a dummy for 4 s against each class's starter and tuned so raw damage sits within the starter's
  band; the specials (fire, frost, chain, pierce, area, stun, crowd hits) are what you pick them for.
- **Secret realms** (`REALMS` in `data/chapters.js`): the Drowned Cistern (floors 2-3), the Starless Chapel (4-5), the
  First King's Forge (6-7). A Sealed Stair (`SealedStair` in `world/Secrets.js`) sits in a floor's super-secret room
  (40%) or secret room (15%), once per realm per run. Down it, a short floor (`floorSize` 2) in the realm's palette
  (chapter tiles recoloured: `CISTERN`/`CHAPEL`/`FORGE` in tilesets.js), with the realm's spawn pools and layout
  digits, its own song (Ambience), and a story scene. The floor number doesn't change; the realm's trapdoor leads on
  to the next floor.
- **Secret bestiary** (`enemies/bestiary3.js`, art `enemiesArt5.js`): Drowned Pilgrim (water fan, slowing puddles),
  Cistern Eel (submerged, rises with a ring of teeth and a lunge), Hollow Nun (blinks beside you, a cross of homing
  curses), Censer Acolyte (poison smoke trail, a ring when close), Bellows Imp (hops, cinder cone), Anvil Knight (charge,
  then a ring of iron with gaps).
- **Secret bosses** (`data/bosses4.js`, art `bossesArt8.js`, ranked Deadly): the Cistern Leviathan, the Mirror Queen,
  the First King's Shade, the Bone Organist, the Faceless Saint - drawn at random, never twice in a run. Their spoils:
  a weapon for your class and a rare-or-better relic, both kept.

### Expansion 7 — its own shape — done

Three systems so a run feels like this game's own, not a borrowed loop.

- **The Gatehouse** (`world/Gatehouse.js`, `data/prisoners.js`, art `render/art/gatehouseArt.js`): floor 0, a
  hand-made one-room floor (`gatehouseFloor()`) in its own warm palette and song. Runs start there (the Daily
  Descent starts on floor 1). Five prisoners (`PRISONERS`, each with a `minFloor`) can be found in chains, at most
  one per floor (40% on a floor while any are left, `Game._rollPrisoner`), in a normal room away from the start;
  clear the room and touch them with a key. Saved in `Save.data.rescued`. Their help (never on the Daily Descent):
  smith = choose a starting weapon among `Save.data.weaponsCarried` (`Save.data.forged[class]`); quartermaster =
  +1 bomb, +1 key, +5 pennies; priest = `Player.prayer`, one revive at 2 hearts; cartographer = boss/armoury/merchant
  rooms `seen` at floor start; archivist = `ShortcutStair` to floor 3 (`descend(false, null, 3)`) plus a Q2+ relic.
- **The fork in the road** (`data/routes.js`, the `route` screen in `ui/Menus.js`): when a trapdoor leads from
  one ordinary floor to the next, the descent pauses at full black and offers three roads (`rollRoutes`): the Old
  Stair plus two of Bloodied (hard-room weight +0.3, champions +0.12, boss pair relic), Pilgrim's (near-room weights
  everywhere, heal 4), Market (+12 pennies, 25% discount via `priceOf`), Whispering (forced omen, a Q2+ relic
  pedestal at the start); and 30% of the time, if the next floor's realm is unvisited, the Hidden Way (into that realm,
  skipping the ordinary floor). `Game.route` holds the road for the floor it leads to.
- **Shaped rooms and arenas** (`data/rooms/shapedLayouts.js`): ten shaped layouts added to every chapter's pools
  (pits carve crosses, rings, ledges over chasms, islands; `w` shallow water: walkable, x0.75 speed for the player unless
  rolling and for walking enemies; rendered as a pool with a rim, flat normals). Walkways between two pits get rope
  bridge planks. Six boss arenas chosen by `arenaFor(boss, chapter)` (some bosses have a fixed home, otherwise a
  stable pick from the chapter's list) and written into the boss room after the boss is drawn.

### Expansion 8 — its own face (awaiting OK)

- **The ledger HUD** (`ui/Hud.js` `_drawPlayHud`): the 80 px margins either side of the 480 px room become stone
  panels with an iron edge (`sidePanel`). Left, top to bottom: a portrait in an iron medallion (the hero's own sheet,
  `Player.portraitCanvas`) beside the weapon plaque; VIGOR (`vigorSegment`: one segment per heart, halves fill
  half, iron in steel, Omen of the Unknown in grey, the Saint's Shroud as a gold segment); the supplies ledger
  (pennies, bombs, keys, embers with a +N flash); the active relic plaque with charge pips, trinket and Q slots;
  the Seal Fragments. Right: minimap, floor name and omen wrapped to the panel, STALKED, relics (newest kept in
  view). Banners and the Beatrix vignette stay inside the room area.
- **Embers** (`data/embers.js`): per boss `3 + floor + 2 x skulls` (+6 in a realm), +4 for a floor without damage,
  +1 per champion, +25 for a win; x(1 + 0.1 x heat), x1.5 when Stalked; none on the Daily Descent. `Game.earnEmbers`,
  banked into `Save.data.embers` by `runEnded` (shown on the death and victory screens). Spent at the Hearth (a
  brazier in the Gatehouse; the `hearth` menu screen) on `UPGRADES` (ranks in `Save.data.upgrades`); each needs its
  teacher freed. Applied in `Player` (hearts, damage, stores, prayer) and `Game.startFloor` (maps, relics).
  Full mastery costs about 1,000 embers: a death on floor 4 brings home ~35, a win ~180.
- **Stalked** (`world/Beatrix.js`, art `render/art/beatrixArt.js`, sounds heartbeat / whisper / sting / creak /
  beatrixHum): `Game.mode = 'stalked'` from the title. States: dormant (22 s, less deeper) -> roaming (one room
  closer every 8 s, less deeper; never into a living boss's room) -> arriving (a creak, 1.8 s) -> hunting (drifts
  through everything at 34 + 3.5/floor px/s; blinks behind you if you keep 150 px away for 7 s; touch = 2 hearts,
  then gone 14 s) -> gone. Follows through doors 2.8 s behind; a bomb banishes her 22 s. `dread` (0..1 by
  distance) drives the heartbeat rate, whispers, ambient light (-40%) and the HUD vignette. Unlit sprite that
  flickers in as she arrives.
- **Dodge feel**: the roll and the shield charge burst out and ease off, steer a little, buffer an early press
  (0.2 s); the roll tumbles with a hop; cooldowns 0.42 s (roll) and 0.68 s (charge).

### Expansion 8b — draughts, the stairway, the story (awaiting OK)

- **Healing draughts**: the heart / half-heart pickups are drawn as a tall crimson vial (full / half), the iron heart
  as an iron tonic flask (`itemsArt.js` `healingDraught`, `ironTonic`). The red mystery potion became Bilious so red
  only ever means healing. New sounds: heart (cork, gulps), relic (deep bell + low minor chord), secret (stone
  grinding + far bell), buy (coins + a nod). No rising harp runs.
- **The stairway** (`stairway` sheet, 8 frames; `entities/Trapdoor.js`): grinds open over 1.3 s (stairOpen sound,
  shake, dust) and only works once open; opens once per boss room (`data.stairOpen`); the Gatehouse's is open.
- **The story and cutscenes** (`ui/Cutscenes.js`): a `Stage` lays real tiles (`<ts>_floor`, `<ts>_wall_top`), props,
  hero sheets (`characterPreview`), creature and boss sheets at 1:1, then a torchlight pass (a dark overlay with the
  lights cut out, coloured glow added). `CLOSE` shows chosen scenes at 2x around a focus. A scene keeps playing
  across consecutive lines. Lines may have a `voice` (THE CROWN in purple, BEATRIX in pale red). New: a 7-panel intro
  (the tomb, the crown's whisper, the procession of the five, Beatrix), a Crown line for each chapter, the endings
  `endKing` / `endCrown` (played by `Game.win`) and `beatrix` (the first Stalked run).

### Expansion 9 — encounters, a fairer Beatrix, no hiding forever (awaiting OK)

- **Encounters** (`data/encounters.js`, `world/Encounter.js`, the `encounter` menu screen): a feature room
  (`feature_encounter`, chance 0.22, tile `Q`) with one of seven encounters (`Game.drawEncounter`, never twice a run).
  Walking up opens the choice; options can be unavailable with a reason (`can`). Choosing is final
  (`data.encounterDone`); Esc walks away. Effects: health, heart containers, pennies, keys, bombs, luck/damage (through
  `potionBonus`), reward pedestals, embers, a map reveal, an ambush (the chapter's medium pool, doors lock) and
  `Game.omenOwed` (the next floor's omen).
- **Beatrix tuned** after the playtest (5 touches in 2 floors): touch 4 -> 3 half hearts, rest 14 -> 24 s, bomb 22 -> 30 s,
  slower to become solid (~0.8 s of warning), and while the room's creatures are still fighting she drifts at 70% and
  never blinks behind you.
- **Stragglers** (`EnemyManager.update`, `Enemy.coax`): when every non-boss enemy left in the room has been hidden for
  4 s, they're hurried out (their wait is over and they get an attack turn; the eel rises where it is), with a wail
  and a puff of dust to show where.
- Playtest bot: `scratchpad/shot/playrun.mjs` + `botlib.js` play whole runs and log every room (the bot must advance
  `game.time` itself, or the attack budget never frees up).

### The difficulty curve (after playtesting)

Measured with a bot that plays each floor with a build typical of that depth (`scratchpad/shot/diffprobe.mjs`). Before:
floor 1-2 rooms were nearly free and their bosses spiked (a Hard boss could already appear on floor 2); floor 7 was a
cliff (whole-heart hits plus two runaway bosses); the sword hero took 2-3x the boss damage of the others. Changes:

- **Body contact**: a boss's body only hurts while it is moving at you (not resting, dazed or winding up), and anything
  that touches you reels back (knockback + a short daze), so one touch is one hit - no chains.
- **Bosses ease in**: `DIFFICULTY.bossEase` (floor 1: x0.85 health, x0.82 attack tempo; floor 2: x0.9 / x0.88;
  floor 3: x0.95 / x0.94).
- **Ranks a floor later**: Hard from floor 3, Deadly from 5, Legendary from 7.
- **Whole-heart hits from floor 8** (was 7).
- **No full circles of beams**: the Lich's, the Pyre Bishop's and the Faceless Saint's sweeping lasers leave a gap.
  The Great Toad's slam warns longer (0.55 s). Wisps spiral fewer orbs; Root Saplings warn longer.
- **Burning pitch and poison clouds** have a bright pulsing rim (orange / green), so they're easy to see and avoid.
- **A breath on the stairs**: reaching a new floor restores a heart (floors 2-4) or half a heart (deeper).

### Release polish (QA pass)

- Loading screen with a progress bar (the art is generated at start-up); a "something went wrong" screen with a
  reload button if start-up fails, errors keep coming, or the graphics device is reset (`main.js`).
- Switching tab or app pauses the game and silences the audio; the save is written.
- Touch layout fitted to the ledger HUD: USE / BOMB / ITEM / pause in a row at the top centre, ROLL in the
  bottom-right corner (clear of the map, banners and boss bar); the relic list leaves room for ROLL.
- Page text (touch buttons, loading, rotate hint) in Silkscreen, a pixel face (SIL Open Font License).
- three.js ships as its own cached chunk. Link-preview text updated.
- Names: the king is Varick, the chronicler Tobiah (no more Aldric / Aldwin / Aldous mix-ups).
- Checked: 24-floor soak (no memory or GPU-object growth, zero console warnings), corrupted saves, phone /
  tablet / ultrawide / 5:4 layouts.

### The three later heroes, made full classes

Maud, Agnes and the Nameless were the sling with stat changes and a starting relic. Each now has a kit as deep as
the first three (attack style, signature dodge, passive, a weapon family of a starter + two finds), balanced on
the training dummy against the first three (`scratchpad/shot/weapontest.mjs`):

| Hero | Attack (`weapon`) | Dodge | Passive | Weapons |
|---|---|---|---|---|
| Maud (8 hp) | `spear`: a long narrow thrust through a line (`WEAPONS.spear`) | `lunge`: fast short dash | `riposte`: the thrust after a lunge is a sure crit | Her Lord's Spear, Boar Spear (stuns), Halberd (sweeping tip) |
| Agnes (6 hp) | `hex`: slow poison thorn-seeds | `bramble`: a roll leaving thorns (each bites once) | `bloom`: foes that die poisoned burst into 6 thorns | Apprentice Staff, Nightshade Staff (double poison), Briar Staff (seeds split) |
| The Nameless (6 hp) | `soul`: bolts through stone and one foe | `phase`: untouchable, through foes, shots and stone; a chill burst where it ends | `hunger`: 7% of kills restore half a heart | Grave Lantern, Chain of the Cells (chains), Bell of the Dead (slow, huge, chills) |

Looks and icons: `render/art/classWeapons.js`. Sounds: thrust, hexCast, soulCast, phase.
Also: your shots are see-through with faint trails and enemy shots draw on top (readability); REDUCE FLASHING
setting (`VISUAL.calm`); the title castle redrawn symmetrical with soft clouds.

### Expansion 10 — the Deep (awaiting OK)

- **The choice** (`_throneCleared` -> `beyondT` -> the `beyond` menu): return home (victory) or `enterDeep()`:
  `Game.deep = true`, the throne room gets a stairway and a boss pedestal (`addBossRewards` no longer stops at the
  throne when hunting). Floors cap at `DEEP_LAST` (19) instead of `THRONE_FLOOR`. Forks continue between Deep floors.
- **Five places** (`DEEP` / `DEEP_ORDER` in `data/chapters.js`, floors 10-19 via `chapterForFloor`; full-sized floors):
  palettes in `palettes.js` (spread from a chapter, recoloured), tilesets (`ROOTDEEP` = HOLLOW style, `FROZEN` /
  `AMETHYST` = CATA, `SUNKEN` = HALLS, `HEART` = HOLLOW), atmospheres (sap, snow, drowned, crystal, heart), songs
  (Ambience), layouts borrowed (`BY_CHAPTER`), arenas (`CHAPTER_ARENAS` / `BOSS_ARENAS`), arrival scenes + Crown lines.
- **Creatures** (art `enemiesArt6.js`): ten, each a new body on a proven behaviour (`VARIANTS` in EnemyManager +
  `VARIANT` in Enemy.js build the old class with the new type's data and sheet): Root Hound (Dire Wolf), Sap Bulb
  (Puffcap), Rime Wraith (Spectre), Ice Golem (Ossuary Golem), Drowned Knight (Black Knight), Tide Siren (Banshee),
  Crystal Spider (Crypt Spider), Shard Magus (Court Magus), Heart Leech (Crypt Bat), Hollowborn (Executioner).
- **Bosses** (`data/bosses5.js`, art `bossesArt9.js`, `deep: true` keeps them off the main roster): the World-Root,
  the Rime Queen, the Sunken King, the Crystal Wyrm (Deadly) and the Hollow (Legendary, 3 phases). Deep first floors
  draw a Deadly roster boss.
- **The end**: the Hollow's death -> `ending = 'deep'`, the `endDeep` scene, its own victory screen,
  +50 embers (`EMBERS.deepVictory`), `stats.deepVictories`.
- Measured (`diffprobe_deep.mjs`): Deep bosses cost a strong build ~6-10 hearts, rising to the Hollow.

### Expansion 10b — walls of their own, 125 relics, shaped rooms, enemies fought

- **Frozen Deep / Amethyst Caverns tilesets** (`FROZEN`, `AMETHYST` in `tilesets.js`) now have their own `floor`,
  `face`, `decorA`, `decorB`: ice blocks with icicles, a figure frozen in the wall, frost crystals, glossy ice floors
  with snow drifts; rough rock with glowing crystal veins, geodes, crystal clusters, a lumpy cave floor with shards.
- **25 more relics** (`data/relics5.js`, icons `itemsArt5.js`): 6 situational, 10 solid, 6 strong, 3 run-carrying (the
  same spread as before). Two new perks in `items/Perks.js`: `roomHeal` (Physician's Kit: 25% per cleared room to heal
  half a heart) and `killHaste` (Hunting Horn: 1.2 s of haste per kill). `trySecondWind` now burns whichever relic
  gave it (the Phoenix Feather or the Last Candle) - without that the Candle would revive forever.
- **Enemies fought** on the title: `Save.data.unlocks.enemiesFought` (each creature type the first time one is killed,
  not on the Daily), shown as `ENEMIES FOUGHT n/70`.
- **Rooms shaped by their walls**: tile `o` = solid stone (left out of the room's floor mask, so the wall autotiler
  draws real walls round it and `_buildWallSolids` makes it block). Nine layouts in `SHAPED_LAYOUTS`: the Round
  Chamber, the Octagon, the Cross, the Diamond, the Pillared Ring, Twin Pillars, the Wedge, the Spire, the Hourglass
  (the last three only fit rooms with doors top and bottom; `connects()` sees to that). Candles light their corners.
- Fixed: the Frozen Deep's snow atmosphere asked for a missing glow preset every frame.
