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
| E1 | Expansion: 20 enemies, 20 bosses, 25 relics, random scaled bosses, depth difficulty, Isaac-style systems | **Done — awaiting OK** |

After each phase: runs with no console errors, explain how to test, STOP and wait for OK.

---

## 1. The Game

**Working title:** Below the Keep

A top-down roguelike dungeon shooter (twin-stick, room-by-room) set entirely in a dark medieval world.
**Use ONLY original names, characters, items and art.** Nothing copied from The Binding of Isaac (names, items, enemies, sprites, text).

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

- Pixel-art HUD: hearts, pennies, bombs, keys, active charge, minimap. Pixel font.
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


### Expansion 1 — done (awaiting OK)
- **Random bosses, Isaac-style:** every floor draws its boss from all 28 (seeded, no repeats in a run). Each boss
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
- **Isaac-style systems with their own twist:** iron hearts (armour that soaks hits, can't be healed);
  chests (wooden / iron with a key / cursed gamble) and gem-studded rocks; **omens** (curses of a floor:
  Darkness, the Maze, the Lost, the Unknown, the Blind, the Hunt); **transformations** - carry three relics of a
  set (Plague, Saint, Beast, Alchemy, Menagerie) to become the Plaguebearer, the Saint, the Beast, the
  Alchemist or the Beastmaster (`data/sets.js`, `items/Sets.js`); the **Trial Chamber** (three waves for a
  relic) and the **Gambler's Den** (dice table, a beggar who repays kindness).
