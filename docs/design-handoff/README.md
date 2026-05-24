# Handoff: Pocket Garden

A cozy survival garden simulator set on a hostile exoplanet. The player grows radiation-mutated earth plants, brews them into potions that keep the air breathable and the body intact, and unlocks new species by solving accounting puzzles (FASB / ASC / IRS). At night the planet occasionally pauses gameplay to show the player something beautiful — a meteor shower, an aurora, a swarm of fireflies.

This handoff covers four design surfaces:

| Surface | What it is |
|---|---|
| **G1 · Pocket Garden** | The core gameplay handheld — animated garden screen inside a console body, full 32s day/night cycle, harvest/plant cycle, 10 plant species |
| **I · Survival / Riddles / Wonder** | 5-screen flow that teaches the mechanics: SURVIVAL HUD, POTION CRAFTING, ACCOUNTING RIDDLE, CODEX MUTATION CARD, WONDER moment |
| **J · Potion Compendium** | 8-potion catalog page laid out like a book of recipes |
| **K · Wonder Log** | 5 night-scene "tiny moments" that interrupt play with no HUD |

---

## About these files

**The files in this bundle are design references created in HTML/JSX.** They are running prototypes that show intended look, animation timings, sprite art, and copy — they are **not production code to ship**.

Your job is to **recreate these designs in the target game's existing environment** using its established patterns. The most appropriate target is probably a real game engine (Godot, Unity, LÖVE, Bevy, or web-canvas like PixiJS/Phaser) rather than React DOM + SVG — the SVG approach in this prototype is for fast iteration, not runtime performance. If no engine is chosen yet, pick one that handles pixel-art well (Godot 4 with `CanvasItem.texture_filter = NEAREST` is a strong default).

The sprite art, palettes, animation timings, copy, and layout in these files are **canonical**. Match them. The HTML/SVG implementation is **disposable**.

---

## Fidelity

**High-fidelity.** Pixel-perfect mockups with final colors, typography, sprite art, animation timings, and copy. Treat the pixel patterns and palette hex codes as the source of truth.

The handheld console body around the screen is *atmospheric* — used in mockups to communicate the diegetic feel of the game. In a real build, you'd ship just the screen content; the chrome can be replicated as the loading-screen wrapper or omitted entirely.

---

## Design system

### Typefaces

Load these from Google Fonts (or self-host).

| Family | Weights / styles | Used for |
|---|---|---|
| **DM Serif Display** | 400, 400 italic | Display headers, screen titles, "tiny moments" wonder captions, potion names |
| **Caveat** | 500, 600, 700 | Handwritten field notes (journal, recipe cards, signatures) |
| **JetBrains Mono** | 400, 500, 600 | All HUD text, button labels, mono-spaced data, monospace numerics |
| **Inter** | 400, 500, 600, 700 | Out-of-game system UI only (rarely needed in-game) |

Inside the game (the actual pixel screen), the **only** typefaces used are JetBrains Mono (HUD / system text), DM Serif Display Italic (titles, wonder captions, codex species names), and Caveat (journal handwriting). The pixel UI deliberately uses small JetBrains Mono rather than a custom pixel font — it reads cleanly at 3–5 px sizes and matches the cozy/tactile feel.

### Palette — G1 "Dawn" (canonical)

This is the canonical in-game palette. Three variants exist (Dusk, Amber) but **G1 Dawn is the one to implement first**.

| Role | Hex | Use |
|---|---|---|
| `ink` | `#1a0a3e` | All outlines, deep shadows, ink-on-cream text |
| `primary` | `#5e3aa8` | Soil, distant mountains, mid-purple shadow |
| `mid` | `#8a8ee0` | Periwinkle — plant outlines, mid-tone fills |
| `light` | `#c5d4ff` | Light highlights, stars, sky highlights |
| `cream` | `#f4e9c8` | Paper, journal pages, console body, "paper" UI bg |
| `accent` | `#f5cf5e` | Sun-yellow / saffron — accents, ready states, cursors |
| `warm` | `#e07598` | Rose — second sun, hearts, ready indicators |
| `grass` | `#a8c862` | Plant foliage (light) |
| `grassD` | `#6e9e44` | Plant foliage (dark) |
| `soil` | `#3a2570` | Tilled dirt |
| `soilL` | `#5a3e9e` | Soil highlight |
| `water` | `#8acfff` | Watering, droplets, suit window |

**Screen background**: `#10052e` (deeper than ink — only ever shown as the screen's dark "off" colour or deep night sky).

### Day/night colour stops (animated CSS variables)

The 32-second day cycle interpolates the sky and ground between these:

```
--sky-dawn:  #4a3a7e   /*  0%   */
--sky-morn:  #3a4a9e   /* 12%   */
--sky-noon:  #5e7ae0   /* 28%   */
--sky-aft:   #c08a8a   /* 45%   */
--sky-dusk:  #6a3a8a   /* 60%   */
--sky-night: #1a0a3e   /* 75%–95% (held) */

--ground-day:   #5e3aa8
--ground-night: #2a1a5e

--sun-color:  #f5cf5e   (primary sun)
--sun2-color: #e07598   (companion sun)
--moon-color: #c5d4ff
```

Two alternate palettes exist in the codebase (Dusk = warm rose/coral, Amber = 4-color warm mono) — these use the **same role names**, just different hex values. The whole game can re-skin by swapping a single CSS class. See `art-pocket.jsx` `pal-dusk` and `pal-amber` blocks for the values.

### Pixel grid & rendering

- All pixel art is authored on a **192 × 116** logical screen (the handheld's native res).
- The screen is rendered at any integer scale (8× → 1536×928, 6× → 1152×696, etc.). Always upscale by integers; never apply bilinear filtering.
- In CSS: `image-rendering: pixelated` (or in the engine: nearest-neighbour texture filter, no MIPs).
- The console body is approximately **900 × 640** with a screen window of roughly 720 × 380 (so the 192 × 116 screen is rendered ~3.7× — for prototype the SVG scales freely; in the real build use a fixed integer scale).
- All sprite coordinates and animation `translate` values are expressed in **logical screen pixels** (1 unit = 1 logical pixel = ~3.7 CSS px when shown inside the prototype console).

---

## Sprite system

Sprites are authored as multi-line ASCII strings where each character maps to a palette role. The renderer (`PixSprite` in `art-pocket.jsx`) walks the string and emits one `<rect width=1 height=1>` per non-`.` cell.

Character → role map:

```
.  transparent          c  cream         s  soil
k  ink (o aliased too)  y  accent        S  soil-light
o  ink                  r  warm          w  water
p  primary              g  grass
b  mid                  G  grass-dark
l  light
```

This means **a sprite definition is palette-agnostic** — the same ASCII pattern renders correctly in Dawn, Dusk, or Amber. In a real game engine, do the same: define sprites in role-indices and look up colour from the active palette at draw time.

### Plant species (10 — the canonical roster)

All defined in `art-pocket.jsx` as `PLANT_*` constants. Each is 14 × 14 logical pixels (the eye/codex variant is 14×14, others may extend slightly).

| Const | In-fiction name | Visual | Used in |
|---|---|---|---|
| `PLANT_BELL` | bell-bloom | Lavender bell with rosy center | Oxalis Brew, Thornguard |
| `PLANT_STAR` | star-bloom | 5-pointed yellow flower with red center | Emberwake, Prismtear |
| `PLANT_CRYS` | glass-moss | 3 crystal shards on soil | Nightseal, Moonmilk, Prismtear, Crystal Wonder |
| `PLANT_DREAM` | dreamer | Eye-stalk that watches back | Nightseal, Prismtear |
| `PLANT_ROSE` | thistle-rose | Cluster of 4 rose-pink blooms | Thornguard, Emberwake, Redoak |
| `PLANT_FERN` | hum-fern | Curling spiral fronds | Oxalis Brew, Hushwater |
| `PLANT_POD` | moonpod | 3 bubble pods clustered | Nightseal, Moonmilk |
| `PLANT_THORN` | prism-thorn | 3 sharp ascending spikes | Emberwake, Thornguard, Redoak — **also the harvest-cycle target plant** |
| `PLANT_CAP` | jelly-cap | Mushroom with checker dome | Moonmilk, Hushwater, Redoak — **doubles as umbrella in Biolum Rain wonder** |
| `PLANT_ORB` | orb-vine | Yellow seedlings + red berry on a stem | Oxalis Brew, Hushwater |

Each plant sits in a parent `<g>` wrapped with the `Plant` helper, which adds a slight rotational sway:

```css
.pp-sway   { transform-box: fill-box; transform-origin: 50% 100%;
             animation: pp-sway 3s ease-in-out infinite alternate; }
.pp-sway2  { animation-duration: 2.4s; animation-delay: -.7s; }
.pp-sway3  { animation-duration: 3.6s; animation-delay: -1.4s; }
@keyframes pp-sway { from { transform: rotate(-2.4deg); }
                     to   { transform: rotate( 2.4deg); } }
```

Stagger plants across the three classes for visual rhythm — no two adjacent plants should sway at the same tempo.

### Player blob

The blob is a single character drawn as three layered sprites for animation:
1. **Body** (`SPR_BLOB_BODY`) — 16×16. Wrapped in `.pp-breathe` (subtle `scaleY` between 1.0 and 0.93 every 2.8s).
2. **Mouth** (`SPR_BLOB_MOUTH`) — same 16×16 grid, just mouth pixels. Also breathes (so it stays attached).
3. **Eyes** (`SPR_BLOB_EYES_OPEN`) — same grid, two 2×2 pupil clusters. Wrapped in `.pp-blink` which sets `opacity: 0` for 60ms every 4.2s.

The `AnimatedBlob` helper composes these. **Replicate this layered pattern in your engine** — keep eyes and body as separate texture regions so you can blink without redrawing the body.

When holding a watering can, render `SPR_CAN_HELD` translated to (60, 68) relative to the blob and add a `.pp-drip` element with a 1×2 + 1×1 water-coloured rect that animates downward.

---

## Animations (CSS keyframes, canonical timings)

All in `art-pocket.jsx`. Re-implement these exactly in your engine.

| Animation | Duration | Easing | Notes |
|---|---|---|---|
| Plant sway | 3.0s / 2.4s / 3.6s | ease-in-out alternate | Rotates ±2.4° around bottom-center. 3 staggered variants. |
| Blob breathe | 2.8s | ease-in-out infinite | scaleY between 1.0 and 0.93, origin bottom-center |
| Blob blink | 4.2s | steps(1) | Eyes invisible from 97% → 99% (≈ 84 ms) |
| Star twinkle | 1.8 / 2.2 / 1.4s | steps(2) | Opacity 1 → 0.15 |
| Sparkle dance | 1.6s | steps(4) | translate(0,0) → (4,-3) → (-3,-5) → (6,2) → back |
| Watering drip | 1.1s | linear | translateY(-4 → 7), fades in 0–20%, out 90–100% |
| Cursor blink (▶) | 1.0s | steps(2) | 50/50 on/off |
| Arrow nudge | 0.9s | steps(2) | translateY 0 ↔ -1 |
| Sky tint | **32s linear loop** | linear | Animates `fill` through 6 sky stops + held night |
| Ground anim | 32s linear loop | linear | Synced to sky — daytime tint on top, night below |
| Stars at night | 32s linear loop | linear | Opacity 0 → 1 only between 78–90% of the cycle |
| Sun arc | 32s linear loop | linear | Translates from off-screen-left, peaks high-center, sets off-right; fades in/out at horizon |
| Sun2 arc | 32s linear loop | linear | Smaller, trails the primary sun, slightly higher Y peak |
| Moon arc | 32s linear loop | linear | Rises from 65%, sets at 100%, only visible at night |
| Phase label cross-fade | 32s | linear (4 keyframe ramps) | Cycles "dawn · sol 47" → "noon · sol 47" → "dusk · sol 47" → "night · sol 47" |
| Clock cross-fade | 32s | linear | "04:12" → "12:08" → "18:36" → "22:48" — fades match phase label |
| Harvest cycle | **8s ease loop** | ease-in-out | See below |
| Scanline drift | 6s linear | linear | Pure visual chrome (the 50% bright band sliding down the screen) |
| Power LED | 1.6s ease-in-out | infinite | Opacity 1 ↔ 0.5 |

### Harvest / plant cycle (8s loop)

The slot at row-1 position-4 cycles through these states. Replace this with **interactive** behaviour in the real game — but use these timings as the visual reference for what each transition should feel like.

| % | State | Sprite | Notes |
|---|---|---|---|
| 0 – 12 | EMPTY | seed dot in soil | One soil pixel + a tiny lighter pixel |
| 13 – 28 | PUFF | white cloud, 9×5 | Plays once seed is planted; fades from scale 0.4 → 1.4 |
| 25 – 42 | SPROUT | tiny 5×6 seedling | Grows from scaleY 0 → 0.4 |
| 42 – 58 | YOUNG | small thorn (9×7) | scaleY 0.75 |
| 60 – 86 | BLOOM | full `PLANT_THORN` | scaleY 1.0 — fully grown |
| 72 – 86 | READY! tag | accent-yellow rect with "READY!" text | Flashes above the bloom in the last quarter of the bloom phase |
| 88 – 94 | BURST | radial sparkle pixels | Pops outward, scale 0.6 → 2.0, opacity 1 → 0 |
| 90 – 99 | LOOT | "+1" with crystal floats up 10 px | Confirms harvest |
| 100 | back to EMPTY | — | Loop |

In a real game the **EMPTY → PUFF → SPROUT → YOUNG → BLOOM** transitions are driven by sol-time after planting; READY/BURST/LOOT play once on harvest interaction.

---

## Screens — detailed spec

Every screen below is **192 × 116 logical pixels**.

### G1 · Pocket Garden (`ArtPocketDawn` in `art-pocket.jsx`)

The home loop. Inside a yellow handheld console with D-pad, A/B, SELECT/START, speaker grille, and a pink LED that pulses.

Screen layout:
- **Sky band** (y 0–58) — animated tint, no fixed colour.
- **Twin suns + moon** rise/set across this band in an arc. Don't draw them as ellipses — they're pixel sprites (~6×6 for primary, ~4×3 for companion, ~6×4 for moon with a 3×3 dark crescent overlay).
- **Far mountain silhouettes** at y ~42–46 (two-row pixel mountain pattern, mid + light colours).
- **Horizon line** at y 58 (`primary`).
- **Ground band** (y 58–116) — animated between `ground-day` / `ground-night`, with `mid` (periwinkle) cap at y 58.
- **Fenceposts** at y 57 — 1×3 light rects every 6 px with 5×1 horizontal rails.
- **Two soil-bed rows** at y 68 and y 92, each 5 beds wide (8 + c×36 starting at x=8). Each bed is 12×10 px tiled soil sprite.
- **10 plants** — one per bed, see [plant species table](#plant-species-10--the-canonical-roster).
- **Player blob** at (48, 64). Watering can sprite at (60, 68). Drip animation at (71, 76).
- **Sparkles** at (48, 56) and (124, 60) — staggered.

HUD overlays:
- **Top-left** (x=2 y=2, 46×7): heart row showing 4 filled + 1 empty heart (5×5 each).
- **Top-center** (W/2-30, y=2, 60×7): rotating phase label — "dawn · sol 47" / "noon · sol 47" / "dusk · sol 47" / "night · sol 47" with a small left-pointing arrow that nudges.
- **Top-right** (W-50, y=2, 48×7): rotating clock with two celestial body indicators (sun + sun2 in day, moon during night).
- **Bottom dialogue box** (x=2, y=92, 188×22): inked rectangle with a portrait-sprite bust on the left, MIRA label, and a "the prism-thorn is ready to harvest — press A to take a clipping." line in JetBrains Mono 3.5. Next-arrow blinks bottom-right of the box.

Console hardware specs:
- Body 900×640, padding 36/56/30. Cream `#e6d2a8` with `#b8a07c` shadow + `#f4e9c8` highlight.
- Bezel `#1a0a3e`, screen-window padding 22.
- LED `#e07598` pulsing.
- D-pad cross: two 32×96 / 96×32 ink rectangles + 4 small triangles in `primary`.
- A button `#f5cf5e`, B button `#e07598`, both 46-px circles tilted -16°.

### I · Survival, riddles & wonder (`ArtPocketStory`)

Layout container: 1280×800, dark purple radial gradient bg.
- Header (32 px from top): mono "POCKET GARDEN · v1.0" eyebrow + DM Serif Display italic 34 px "Survival, riddles & wonder" title + 14 px italic body copy on left; right column shows "5 SCREENS / ★ hostile · gated · awe".
- 5 screen cards in a row, gap 12, each 244 wide.

Each card has: small label (10 px mono, 0.26 em letter-spacing), small badge (8 px mono, accent-yellow bg), 248×156 pixel "screen" frame with scan/glare overlays, and a 12 px italic caption.

Cards:

1. **SURVIVAL HUD** (`ScreenSurvival`)
   - Toxic green-purple linear gradient sky `#5a3a4e → #3a5e5a`.
   - Drifting hazmat-green pixel clouds at (20, 22) and (120, 14) — 8-pixel wide blobs in `pp-light` and `pp-grass`.
   - 5 plants (BELL, FERN, THORN, POD, ORB) on a standard ground.
   - Blob in a **hazmat suit**: warm-yellow body with helmet bubble (light blue), eye dots inside.
   - HUD bars (left column, stacked at y 2 / 11 / 20):
     - **AIR** bar (74×7), fill animates `.ps-air-bar` 8s linear infinite — scaleX from 1.0 → 0.05, colour grass-green → accent-yellow → warm-rose.
     - **SUIT** bar at 70% blue.
     - **HP** row of 5 hearts (3 filled red, 2 empty outlines). First heart wrapped in `.ps-hp` — scales 1.0 ↔ 1.15 every 1.4s.
   - Top-right blinking "⚠ AIR LOW" sticker on warm-rose background (`.ps-alert` 0.9s steps(2)).
   - Bottom prompt: "brew oxalis potion · [A] craft  [X] retreat to bunker".

2. **POTION CRAFTING** (`ScreenCraft`)
   - Bunker interior — striped wall (16 vertical purple stripes), wooden shelf at y 78–81.
   - **Recipe book** (top-left, 64×64) — cream paper with center fold, plant icons (bell + fern + orb), "= potion" arrow, Caveat handwriting "oxalis brew".
   - **Cauldron** centered at (108, 60) — pixel cauldron (`#1a0a3e` rim + `#c5d4ff` fluid), spinning swirl `.ps-swirl` 3s linear, 3 staggered rising bubbles, steam pixels above, heat hatching below.
   - **Ingredient slots** (right column at x=160) — 3 stacked 18×18 squares, each with a plant sprite and "×N" count.
   - **Result slot** (bottom-left at 20, 92) — outlined square with the brewed flask sprite (jelly potion) pulsing via `.ps-mutate`. Right of it: "Oxalis Brew / +12 air for 4h / heals lung scarring".
   - **Brew button** (130, 96, 56×14) — accent-yellow rect, ink text "A · BREW".

3. **ACCOUNTING RIDDLE** (`ScreenRiddle`)
   - Deep night bg. 11 twinkling stars.
   - Centered terminal (-86 → +86 in X, -44 → +44 in Y from center 96,50) — outlined `#0c0420` panel with dashed inner border and 2×2 accent-yellow corner pixels.
   - Header: "▶ ACCOUNT-RIDDLE · TIER 3" left, "SEED LOCK" right.
   - Question text in DM Serif Display Italic 5.5 px, three lines:
     > "When does revenue from a multi-period contract get recognized under ASC 606?"
   - Four answer options A/B/C/D in JetBrains Mono 4 px. **B is correct** (`As performance obligations are satisfied`). The cursor highlights B with a translucent accent-yellow row and a flashing `▶` (`.ps-ans-cursor` 0.7s steps(2)).
   - Bottom-right of terminal: small "UNLOCK" reward preview — accent-yellow seed sprite labeled "starseed".
   - Footer: "[A] confirm  [↑↓] choose  REF ASC 606 · § Step 5".

   **Riddle bank** — design at least 12 riddles spanning the FASB hierarchy. See the [Riddle authoring guide](#riddle-authoring-guide) section below.

4. **CODEX · MUTATION** (`ScreenCodex`)
   - Cream paper card (188×112) with dashed inner border.
   - Header strip (188×14, `primary` fill): "SPECIMEN · TOMATO-VI" left, "RAD-TIER III" right.
   - Two-column split:
     - **Left** (x=40): label "EARTH" + small earth tomato sprite + species "Solanum" + "unmodified".
     - **Center**: ☢ radiation glyph + arrow + "SOL 47" label, wrapped in `.ps-mutate` (pulses brightness).
     - **Right** (x=150): label "MUTATED" + larger glowing mutated tomato sprite + species "Sol. luxia" + nickname "sun-fruit". Surrounded by twinkling sparkle pixels.
   - Bottom stats strip (primary bg): "EFFECTS WHEN EATEN" header + 4 stat columns: STR +5 (warm), HP +12 (grass), ENRG +8 (accent), SHLT +1 (water).
   - Page indicator "07 / 24" bottom-right.

   In the real game: **every cultivable species needs an Earth form, a Mutation form, and the four stat deltas**. Codex page numbers grow with discovery.

5. **WONDER (Meteor Shower)** (`ScreenWonder`)
   - Deep gradient night sky (`#0a0420 → #2a1a5e`).
   - 36 stars with three twinkle classes.
   - 3 meteor streaks falling from top-right → bottom-left, each a 5-pixel tail with fading opacity, on staggered 2.4 / 2.8 / 3.6 s loops.
   - Mountain silhouette + ground at y 74.
   - 5 fireflies near the ground with `.ps-firefly` drift animation.
   - Blob centered at (96, 86) with eye-pixels offset to look upward.
   - Caption box: "✦ a meteor shower ✦" in DM Serif Display italic with accent-yellow stroke.
   - Subtitle: "stop and look up." in Caveat.
   - Bottom-left footer: "no input · just watch".

### J · Potion Compendium (`ArtPocketPotions`)

Cream-paper background (radial gradient `#f7efde → #e6dbc1`) with subtle SVG noise overlay. Ink colour `#1a2a9c`.

Header: mono "POCKET GARDEN · APPENDIX A" eyebrow + DM Serif Display Italic 42 px "Potion Compendium *vol. 1*" + Caveat 18 px subtitle "eight brews known so far. nine more rumored. mind the cork pressure."

Right column header: rarity legend (★★★ legendary / ★★ uncommon / ★ common).

**8 potion cards in a 4×2 grid**, 14 px gap. Each card:
- Rotated by `--tilt: -0.5deg | 0deg | 0.5deg` based on column (gives the page a hand-laid feel).
- Cream `rgba(255,250,232,0.6)` background, ink 1.8 px solid border, 4 px radius.
- Top row: 50×56 pixel **flask** (different fluid colour per potion) + potion name (DM Serif Display Italic 18) + "TIER N · Nh" subtitle. Rarity stars (3 yellow/dim) top-right.
- Horizontal rule.
- Recipe row: 3 plant-sprite icons (24×24, each in a dashed cream box) joined by italic "+" separators. Below: Caveat handwriting listing the names.
- Stat effects: 2-3 stat columns showing `KEY` mono label + `+N` italic value in colour.
- Note: italic Caveat "— heals lung scarring" etc.

Footer: Caveat "— apothecary M. · sol 47, second moon high" left; mono "A · 01 / 02 page" right (suggesting a second volume of 8 more recipes exists).

**All 8 potion recipes** are in `art-pocket-potions.jsx` as the `POTIONS` array — copy this table into your game data:

| Name | Tag | Tier | Ingredients | Effects | Note | Brew | Rarity |
|---|---|---|---|---|---|---|---|
| Oxalis Brew | A | I | bell + fern + orb | AIR +12 · HP +4 | heals lung scarring | 2h | ★ |
| Nightseal | N | II | dreamer + glass-moss + moonpod | SUIT +24 · HP +8 | seals micro-tears for 6h | 3h | ★★ |
| Thornguard | T | II | prism-thorn + rose + bell | STR +5 · DEF +3 | sharp reflexes, 90min | 4h | ★★ |
| Moonmilk | M | I | moonpod + glass-moss + jelly-cap | HP +18 · CALM +1 | sleep restores fully | 1h | ★ |
| Emberwake | E | III | star + rose + thorn | ENRG +24 · HEAT res | no sleep needed · 1 sol | 6h | ★★★ |
| Hushwater | H | I | fern + jelly-cap + orb | PNIC -100% · FOCUS +4 | calms the heart | 1h | ★ |
| Prismtear | P | III | glass-moss + star + dreamer | SIGHT dark · MAGIC +1 | see in dark · 3h | 8h | ★★★ |
| Redoak Root | R | II | rose + thorn + jelly-cap | WALL +2 · SHLT +1 | repairs bunker walls | 5h | ★★ |

### K · Wonder Log (`ArtPocketWonders`)

Same outer layout as I (Survival flow) — radial-purple bg, header + 5 cards in a row, fixed-width 244 px each.

**5 wonder moments**, each its own SVG screen with custom animation:

1. **TWIN-SUN ECLIPSE** (`WonderEclipse`)
   - Eclipse sky gradient (`#1a0a3e → #5e3aa8 → #e07598`).
   - Stars twinkle during full alignment.
   - Big sun static at (96, 34). Small companion sun crosses on a 12s ease-in-out loop, translating from (-50, +10) → (0, 0) → (50, -10).
   - Corona pulses (scale 1 → 1.5) and shadow crescent fades in only during 45–55% of cycle (the "totality" moment).
   - Diamond-ring effect: 4 accent-yellow pixels at compass points around the shadow.
   - Caption: "✦ a twin eclipse ✦" / Caveat "the smaller crosses the great."

2. **ALIEN AURORA** (`WonderAurora`)
   - Night gradient sky. 24 twinkling stars.
   - 3 wavy gradient ribbons across y 14–50, each in green (`aur-1`), pink (`aur-2`), and blue (`aur-3`). Each has its own `pp-aurora-N` animation (5.5 / 6 / 7s) that translates ±4 px and scales Y subtly.
   - Vertical pixel-streak texture in 6 columns (alternating ribbon classes) reinforces the green tone.
   - Mountains + ground.
   - **Reflecting lake** band at y 92–106 — dark with horizontal colour-streaks matching the aurora.
   - Two blobs huddled by the lake.
   - Caption: "✦ an alien aurora ✦" / Caveat "the sky is breathing."

3. **BIOLUMINESCENT RAIN** (`WonderRain`)
   - Night sky with low cloud band (y 14–23).
   - 15 + 7 rain columns — staggered animation delays produce a waterfall effect. Each drop is a 1×6 streak in `#a8c4ff` (primary set) or `#e9a8ff` (secondary set), with fading tail pixels.
   - 5 ripples on the ground at staggered delays — outlined ellipses that scale 0.4 → 1.4 and fade.
   - Glowing puddles (translucent ellipses) reflecting the colours.
   - **Blob with a jelly-cap umbrella** — `PLANT_CAP`-coloured mushroom over a 1-pixel stem.
   - Caption: "✦ bioluminescent rain ✦"

4. **FIREFLY SWARM** (`WonderFireflies`)
   - Night sky. 12 faint stars. Crescent moon top-right.
   - 4 tree silhouettes flanking the scene.
   - Grass tufts along the ground.
   - **28 fireflies** distributed pseudo-randomly across the screen, each assigned one of 4 drift classes (`pw-fly-a/b/c/d`) with negative `animationDelay` for visual diversity. Each firefly is a 5-pixel cluster (center + 4 dim cardinals + 2 halo pixels).
   - 2 close fireflies sit on the blob's outstretched arms (1-pixel arm extensions on each side).
   - Caption: "✦ a firefly swarm ✦" / Caveat "they remember the shape of you."

5. **GLASS-MOSS BLOOM** (`WonderCrystal`)
   - Night sky, 18 stars. Mountain silhouettes.
   - 5 `PLANT_CRYS` (glass-moss) clusters along the ground at x 24/60/96/132/168, each cycling colour via `filter: hue-rotate()` on a 4 s loop with staggered delays.
   - Above each, a **prismatic beam** — 5 vertical 1-pixel streaks in rose/yellow/grass/water/lilac, opacity 0.7. Scales Y 0.7 ↔ 1.0 over 4 s.
   - Blob **lying down** (sprite is horizontal — 22×7 pixels — different from the standing pose; build a third blob pose for this).
   - Caption: "✦ glass-moss midnight ✦" / Caveat "they only bloom for starlight."

**All wonders** share a "no HUD, no input" rule. Game pauses, scene plays for 8–15 seconds, then logs to the player's journal automatically and resumes.

---

## Story integration

The story context that shaped these screens:

> A garden simulator on another planet where everything is trying to kill you — even the air. You grow plants and brew them into potions/medicine to survive. Progressing (new seeds, soil nutrients) requires solving riddles based on accounting concepts (FASB / ASC / IRS / pronouncements). Earth plants exist, but radiation has mutated them — they now confer stats (strength, health, shelter upgrades, energy). At night, tiny moments of wonder happen (meteor showers, firefly swarms).

Implementation implications:

- **Hostile environment** drives everything: AIR is the primary survival meter, not HP. Death is "you ran out of breath" more often than "you got hit." The toxic green-purple sky in the Survival screen reads instantly as "wrong" compared to the cosier blue Garden screen.
- **Plants do double duty**: cosmetic gardening + survival inputs. Every species the player can grow must have a Codex page (Earth ↔ Mutation) and stat deltas. Visually the player notices a plant ripening; functionally they're stockpiling brewing materials.
- **Potions are the conversion layer** between gardening and survival. Without potions, the player dies in days. Most potions consume 3 plant ingredients per brew — design balance accordingly.
- **Accounting riddles gate progression**, not skill. They unlock new seed types or recipe tiers — a "knowledge tax" the world charges. The implication is the player is some kind of accountant-castaway, or there's a corporate AI overlord, or the planet itself is bureaucratic. The mechanic lands differently depending on which framing you pick — confirm with the designer before writing copy.
- **Wonder moments** are the pressure-release valve. Without them the game is grim. They're scripted (not procedural), unpredictable in timing, and unique — each plays once, gets logged forever in the journal, then never appears identically again.

---

## Riddle authoring guide

The terminal screen (`ScreenRiddle`) is built to accept any 4-option multiple-choice question. The display format:

```
HEADER:  ▶ ACCOUNT-RIDDLE · TIER N            SEED LOCK
QUESTION (3 lines, DM Serif Display Italic 5.5 px wrap)
A. <answer 1>
B. <answer 2>
C. <answer 3>
D. <answer 4>
UNLOCK preview: <seed sprite> <species name>
FOOTER:  [A] confirm  [↑↓] choose  REF <citation>
```

Tier suggestions:

| Tier | Topic area | Unlock |
|---|---|---|
| I | Basic concepts (accrual vs cash, debits/credits, the accounting equation) | common seed (bell-bloom, hum-fern) |
| II | ASC standards (606 revenue, 842 leases, 326 credit losses) | uncommon seed (prism-thorn, dreamer) |
| III | Deep FASB / IRS edge cases (uncertain tax positions, hedge accounting, R&D credit) | rare seed (star-bloom, glass-moss) |

Authoring rules:
- Question copy = 110 characters max so it fits the 3 lines at 5.5 px.
- Each answer = 36 characters max to fit one line.
- Always include the citation footer (e.g. "ASC 606 · § Step 5", "IRS Pub. 535", "FASB ASC 842-10-25-3") — it sells the world.
- The correct answer is highlighted by a translucent accent-yellow bar (`opacity: 0.18`) and a flashing `▶` cursor. Wrong-answer feedback should not be in this screen — design a separate failure state.

---

## State management (engine-side)

What needs to persist:

```
PlayerState {
  air: 0..100             # depleting on hostile planet
  suit: 0..100            # integrity, repaired by Nightseal
  hp: 0..100              # hearts
  energy: 0..100
  strength: int
  shelter_tier: int
}

GardenState {
  plots: [Bed]            # 10 beds (2 rows × 5 cols in G1)
  unlocked_species: Set<species_id>
  unlocked_recipes: Set<potion_id>
  codex_pages: Map<species_id, CodexEntry>
}

Bed {
  species: species_id | null
  planted_at_sol: int | null
  stage: enum(EMPTY, PUFF, SPROUT, YOUNG, BLOOM, READY)
  last_watered_at_sol: int
}

WorldState {
  sol: int                    # current sol-day count
  sol_fraction: 0..1          # position within the 32s day (engine seconds, scaled to in-game hours)
  weather: enum(CLEAR, TOXIC_CLOUD, BIOLUM_RAIN, etc)
  active_wonder: wonder_id | null
  seen_wonders: Set<wonder_id> # unique-per-sol-night gate
}

Inventory {
  seeds: Map<species_id, int>
  plant_materials: Map<species_id, int>  # post-harvest
  potions: Map<potion_id, int>
  stardust: int   # currency for shop, earned by completing riddles
  hearts: int     # affection currency (cosmetic)
}
```

Sol-time mapping: 1 in-game sol-day = 32 real seconds in the prototype. In the real build this should be much longer (10–20 real minutes per sol is the cozy-sim sweet spot). The 32s loop is shortened so you can see the cycle in a screenshot during design review.

---

## Assets

All sprites are hand-drawn pixel art **defined as ASCII strings inside the JSX files**. No image files are needed — your engine should reproduce these as either:
- A small spritesheet PNG (export the ASCII to PNG, ~16×16 per sprite), **or**
- A runtime-renderable array of role-indices per sprite (same as the prototype).

Re-exporting tip: parse each `PLANT_*` / `SPR_*` constant by character, map to palette role indices, and emit a PNG with 1-pixel grid alignment. Make sure the output sits on integer pixel boundaries.

Fonts: Google Fonts (DM Serif Display, Caveat, JetBrains Mono, Inter). For in-game pixel-perfect HUD text consider switching JetBrains Mono → a true bitmap font sized to the grid (e.g. m6x11, Pixeled, or a custom 3×5/5×7 you author).

No image assets are shipped in this bundle — everything in the prototype is SVG-drawn from code.

---

## Files in this bundle

```
design_handoff_pocket_garden/
├── README.md                              ← this file
├── demo.html                              ← open in a browser to see all 4 designs render live
├── screenshots/                           ← PNG snapshots of each artboard for quick reference
│   ├── 01-G1-pocket-dawn.png             ← handheld + animated garden scene (mid-cycle frame)
│   ├── 02-I-survival-flow.png            ← 5-screen Survival / Craft / Riddle / Codex / Wonder
│   ├── 03-J-potion-compendium.png        ← 8 potion recipe cards
│   └── 04-K-wonder-log.png               ← 5 wonder moment scenes
└── src/
    ├── art-pocket.jsx                    ← G1 core: sprite system, palettes, 10 plants,
    │                                       AnimatedBlob, day/night cycle, harvest cycle,
    │                                       handheld console shell (Dawn / Dusk / Amber variants)
    ├── art-pocket-story.jsx              ← I: 5-screen flow (Survival/Craft/Riddle/Codex/Wonder)
    ├── art-pocket-potions.jsx            ← J: Potion Compendium (8 recipes, POTIONS data array)
    └── art-pocket-wonders.jsx            ← K: Wonder Log (5 wonder scenes)
```

The screenshots are static — animations don't read in a PNG. Open `demo.html` to see the day/night cycle, harvest growth loop, swaying plants, blinking blob, twinkling stars, drifting fireflies, falling meteors, etc. animate live.

### Cross-file dependencies

`art-pocket.jsx` is the **foundation**. The three other files reference these globals from it at top-level script scope:

```
PLANT_BELL, PLANT_STAR, PLANT_CRYS, PLANT_DREAM, PLANT_ROSE,
PLANT_FERN, PLANT_POD, PLANT_THORN, PLANT_CAP, PLANT_ORB
PixSprite (sprite renderer)
AnimatedBlob, Plant (blob + plant wrapper components)
ROLE (char → palette-role-class map)
```

In a real engine, lift these into a `sprites/` module and import them everywhere — don't replicate the "global script scope" pattern.

### Running the demo

Open `demo.html` in any modern browser. No build step. Babel transpiles the JSX in-page. Once it loads (≈ 2s) you'll see all four artboards stacked. Resize the window — the artboards are fixed 1280×800, scroll horizontally if needed.

---

## Recommended implementation order

1. **Palette + role-indexed sprite renderer** (1–2 days). Get the 10 plants, the blob, the watering can rendering at integer-scale nearest-neighbour. Confirm the Dawn → Dusk → Amber re-skin works.
2. **G1 core loop** (3–5 days). Day/night cycle (use a real sol-time, not the 32s prototype loop). Plant growth states driven by sol-time deltas. Water-can interaction. HUD: phase label, clock, hearts.
3. **Harvest cycle as interaction** (1 day). Tap a ripe plant → BURST + LOOT play, inventory increments, bed returns to EMPTY.
4. **Survival meters** (2 days). AIR depletes constantly when not in bunker; SUIT depletes faster outside; HP depletes when AIR=0. Hazmat suit visual swap when player exits bunker.
5. **Crafting screen** (3 days). Recipe book, ingredient validation, brew timer, output stash.
6. **Codex** (2 days). Earth ↔ Mutation card per species. Unlock pages on first harvest of each.
7. **Riddle terminal + Tier-I bank** (3 days). 4 starter Tier-I riddles, correct/wrong feedback, seed unlock on correct.
8. **Wonder events** (1 wonder/day, 5 days). Build the 5 prototyped wonders. Wire them to sol-night triggers with the "once per sol-night" gate.
9. **Potion Compendium UI** (2 days). The book/codex page, all 8 recipe cards from the POTIONS table.

Total: 18–25 dev-days for a vertical slice that hits the full flow.
