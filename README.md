# Below the Keep

A top-down roguelike dungeon shooter in a dark medieval world. Built with Three.js + Vite.
The full design lives in [GAME_DESIGN.md](GAME_DESIGN.md).

## Run it

```
npm install     # first time only
npm run dev     # then open the http://localhost:5173 link it prints
```

## Controls

| Action | Keyboard | Gamepad |
|---|---|---|
| Move | WASD | Left stick |
| Shoot | Arrow keys | Right stick |
| Active relic / scroll or potion / powder keg | Space / Q / E | RB / LB / LT (or A) |
| Title screen: choose character / begin / seeded run / collection | A, D (or ← →) / Enter / F / C | D-pad / A / — / X |
| Collection page: browse / next page / back | Arrows / Tab (or Q) / Esc | D-pad / RB / Start |
| Quit to title (while paused) | T | |
| Pause (shows the run seed) | Esc | Start |
| New run (while paused) | R | Y |
| Debug: FPS + draw calls | F3 | |
| Debug: lighting-only view | F4 | |
| Debug: reveal map / open secret walls / next floor | F5 / F6 / F7 | |

Replay a run: add `?seed=XXXX-XXXX` to the URL.

On a phone: left thumb moves, right thumb shoots; BOMB / ITEM / USE buttons at the top. On the title screen tap the
sides to change character, the bottom for the collection, anywhere else to begin.

## Sound and music

Everything you hear is synthesised live, no sound files: plucked lute and harp strings, cast bells, clanging
metal, frame drums, war horns, a choir and beastly growls, all in a stone-dungeon reverb (`src/core/Synth.js`
builds the instruments, `src/core/Sounds.js` has a recipe per sound effect). The music is generated too
(`src/core/Ambience.js`): a drone with lute and harp in the old church modes, a mood per chapter, drums and horns
for bosses. To use your own music instead, put a file in `public/assets/music/` and name it in `src/data/music.js`
(e.g. `cells: 'assets/music/cells.ogg'`); set `generated: false` there to turn the generated music off.

## Where things live

- `src/data/` — **every tunable number** (speeds, damage, lights, particles), palettes, controls, room layouts, asset list
- `src/data/chapters.js` — the four chapters, the throne and the Forgotten Vault (tiles, light, air, bosses)
- `src/data/characters.js` — the four playable characters; `src/data/curios.js` — trinkets, scrolls, potions, seals, journal pages
- `src/data/music.js` — which music file plays when
- `src/data/difficulty.js` — **how much harder each floor gets**, and how random bosses are scaled
- `src/data/omens.js`, `src/data/sets.js` — floor curses and the five transformations
- `src/data/bosses2.js` — the second boss roster (every boss is data: phases + attack patterns)
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
