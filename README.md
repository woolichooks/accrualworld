# Accrual World

A cozy survival garden simulator on a hostile exoplanet. You're a stranded
auditor; the planet's old terraforming AI only releases seeds, soil nutrients,
and potion recipes to those who can pass its FASB / ASC compliance checks.

The game is presented inside a handheld "Pocket Garden" console — the in-fiction
device the planet hands you to manage your plot.

Built from the **Pocket Garden** design handoff — see
[`docs/design-handoff/`](./docs/design-handoff/) for the canonical spec
(palette, sprite system, animation timings, 10 plants, 8 potions, 12+ riddle
seeds, 5 wonder moments).

## Stack

- **PixiJS 8** for rendering
- **TypeScript** (strict)
- **Vite** dev server / bundler

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle into dist/
```

## Milestone status

- [x] **M1 · Foundation** — palette + role-indexed sprite renderer, all 10
      plants + blob on the G1 Dawn screen, 32s day/night cycle, plant sway,
      blob breathe + blink, HUD (hearts, phase label, clock).
- [x] **M2 · Core loop** — sol-time plant growth, tap-to-harvest with BURST +
      LOOT one-shots, tap-to-plant via a 10-slot seed picker, inventory state,
      MIRA dialogue reflects the current action. (Watering deferred to M3.)
- [x] **M3 · Survival layer** — AIR / SUIT / HP meters drain in real time
      outside the bunker, hazmat-suit + helmet swap on the blob, AIR LOW
      alert sticker, B-key toggles bunker safe-zone, passout auto-respawns
      to the bunker with meters at 50.
- [ ] **M4 · Crafting + potions** — cauldron scene, the 8 canonical recipes.
- [ ] **M5 · Riddles + codex** — FASB terminal, tier-gated seed unlocks,
      Earth ↔ Mutation codex pages.
- [ ] **M6 · Wonders + polish** — 5 cinematic night events, save/load, audio.

## Layout

```
src/
  engine/    palette, sol-time, sprite renderer
  sprites/   ASCII pixel definitions (plants, blob, tiles)
  state/     garden state (beds + inventory), bed roster, stage rules
  scenes/    garden scene composition, per-bed view + FX
  ui/        top HUD + bottom dialogue/seed-picker
  main.ts    Pixi bootstrap, input wiring, ticker
docs/
  design-handoff/   canonical spec — palette, sprites, screens, recipes
```
