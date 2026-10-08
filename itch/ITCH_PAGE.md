# Below the Keep — itch.io page

Everything needed to put the game on itch.io: what to type in each field, which image goes where, and the
page's look. Upload steps are at the bottom (about fifteen minutes).

---

## Files in this folder

| File | Size | Where it goes on itch |
|---|---|---|
| `below-the-keep-web.zip` | — | **Uploads** (the game itself, played in the browser) |
| `itch-cover.png` | 630 × 500 | **Cover image** (the thumbnail in search and on profiles) |
| `itch-banner.png` | 960 × 300 | **Edit theme → Header image** (the banner across the top of the page) |
| `trailer.gif` | 480 × 360, 23 s, 4.5 MB | First thing in the **Description** (see below) |
| `trailer-small.gif` | 360 × 270, 23 s, 2.2 MB | Backup, if itch refuses the big one |
| `screenshots/01 … 08` | 1280 × 720 | **Screenshots**, uploaded in this order |
| `og-image.png` | 1200 × 630 | Not for itch: the website's link preview (also in `public/`) |

Screenshot order (the first two show up most, so they're the boss fights):
1. `01-boss-mad-king` — the Mad King's ring burst
2. `02-crystal-wyrm` — the Crystal Wyrm's breath, in the Amethyst Caverns
3. `03-burning-halls` — Sir Aldwin in a storm of shots
4. `04-sunken-kingdom` — the Deep: a drowned crowd and a siren's ring
5. `05-frozen-deep` — the Deep: a round chamber of ice
6. `06-catacombs` — Maud and the skeletons
7. `07-the-crown` — the story: the king finds the crown
8. `08-title` — the title screen

---

## Title
Below the Keep

## Project URL
`below-the-keep`

## Short description or tagline
A dark medieval roguelike. Descend beneath a sinking castle, gather relics, and break the crown that whispers.

## Classification
- Kind of project: **HTML**
- Classification: **Games**
- Release status: **Released**
- Genre: **Action**
- Tags (itch takes ten): `roguelike`, `roguelite`, `pixel-art`, `dungeon-crawler`, `bullet-hell`, `dark-fantasy`, `medieval`, `top-down-shooter`, `procedural-generation`, `singleplayer`
- Pricing: **No payments** (or **Donate**, if you want a tip jar)
- AI disclosure: itch asks whether the project uses AI-generated content. Answer it honestly for how the game
  was made: the code, and the pixel art it draws, were written with an AI assistant.

## Embed options
- **Embed in page**, viewport **1280 × 720**
- Tick **Mobile friendly** (orientation: **Landscape**) and **Fullscreen button**
- Leave **Automatically start on page load** off (the title screen waits for a key press to start the sound anyway)

---

## Description (paste into the page body)

Put `trailer.gif` at the very top: in the description editor, click the image button and upload it. (itch's
separate "Gameplay video or trailer" field only takes YouTube or Vimeo links, so the GIF goes here.)

> **For three hundred years the Keep of Hollowmere stood over its valley. Then a new king dug too deep, and found a crown that whispers.**
>
> Now the Keep is sinking into the dark it woke. Fight down through the Cells, the Catacombs, the Hollow and the Burning Halls to the Throne of the Mad King, and break the thing that wears him.
>
> Then, if you dare, keep going. Ten more floors lie below the throne, and something older is waiting at the bottom.
>
> **Every descent is new.** The floors, the rooms, the relics on the pedestals and the boss at the bottom are drawn fresh each run.
>
> ### Six heroes
> - **Wren**, the Wandering Wizard. Spells, and a blink that carries him through a crowd.
> - **Rowan**, the Ranger Knight. A crossbow; steady your aim and the bolt always crits.
> - **Sir Aldwin**, the Iron Knight. Sword and shield: he swings, parries shots and shield-charges.
> - Three more must be earned: a squire with a spear, a witch's apprentice, and someone who already died down there.
>
> ### What waits below
> - **125 relics** that stack and combine: homing, piercing, splitting, chain lightning, burning, freezing, exploding. Each one ranked Common to Legendary.
> - **70 creatures** and **50 bosses**, each boss ranked Normal, Hard, Deadly or Legendary. The deadlier the boss, the better the spoils.
> - **The Deep**: the Rootdeep, the Frozen Deep, the Sunken Kingdom, the Amethyst Caverns and the Hollow Heart, each with its own guardian.
> - **Three secret realms** behind sealed doors, each with a boss you won't meet anywhere else.
> - **The Hearth**: every run brings embers home. Free the prisoners in the Gatehouse and they'll teach you what to spend them on.
> - **Stalked**: a separate mode where Beatrix the Wandering hunts you down through every floor. She can't be killed.
> - **Oaths**: after your first win, swear oaths to make the descent harder and its rewards richer.
> - **The Daily Descent**: one seed and one hero for everyone, every day, on a global leaderboard.
> - A story told in pixel-art cutscenes, and more than one way for it to end.
>
> ### Controls
> - Move **WASD** · Shoot **arrow keys** · Dodge **Shift**
> - Active relic **Space** · Scroll or potion **Q** · Powder keg **E** · Pause **Esc**
> - Gamepad and touch (phone held sideways) both work. There's a **Reduce Flashing** setting.
>
> Hand-made procedural pixel art, real-time lighting, and music and sound synthesised live as you play.
> Free, no ads, no account needed. Also playable at **below-the-keep.vercel.app**.

---

## Edit theme (the page's look)

Open the page, then **Edit theme** at the top.

| Setting | Value | Why |
|---|---|---|
| Header image | `itch-banner.png` | The logo and the moon across the top |
| Background | `#0b0a0d` | The game's own night-black |
| Inner column background | `#141118` | One step lighter, so the text panel reads as a panel |
| Text | `#d8cfbd` | The parchment white of the game's text |
| Links | `#e8c46c` | The gold of the logo |
| Buttons | `#c02634`, button text `#f2e6d0` | The red of "The only way out is down" |
| Borders | `#2a2230` | Barely there |

If the theme editor offers a pixel font for headings, use it; otherwise keep the default (a plain font
reads better at small sizes than a fake pixel one).

---

## How to upload

1. Sign in at itch.io → **Upload new project**.
2. Fill in the title, URL, short description and classification above. **Kind of project: HTML**.
3. **Uploads** → upload `below-the-keep-web.zip` → tick **This file will be played in the browser**.
4. **Embed options** as above.
5. **Description**: upload `trailer.gif` first (image button), then paste the description under it.
6. **Cover image**: `itch-cover.png`. **Screenshots**: `screenshots/01` to `08`, in order.
7. Tags, pricing, and the AI disclosure question.
8. **Save & view page** → **Edit theme** → header image and colours above → **Save**.
9. When it looks right: **Visibility → Public** → **Save**.

The browser build on itch shares the same Daily Descent leaderboard as the website.
