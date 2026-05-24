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
- [ ] **M2 · Core loop** — sol-time plant growth, watering, harvest pop into
      inventory, tap-to-plant.
- [ ] **M3 · Survival layer** — AIR / SUIT / HP meters, hazmat-suit swap,
      bunker safe-zone.
- [ ] **M4 · Crafting + potions** — cauldron scene, the 8 canonical recipes.
- [ ] **M5 · Riddles + codex** — FASB terminal, tier-gated seed unlocks,
      Earth ↔ Mutation codex pages.
- [ ] **M6 · Wonders + polish** — 5 cinematic night events, save/load, audio.

## Layout

```
src/
  engine/    palette, sol-time, sprite renderer
  sprites/   ASCII pixel definitions (plants, blob, tiles)
  scenes/    garden scene composition + per-frame update
  ui/        HUD overlays
  main.ts    Pixi bootstrap, integer scale, ticker
docs/
  design-handoff/   canonical spec — palette, sprites, screens, recipes
```
