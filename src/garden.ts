// Garden scene: 6x4 tile grid with a blinking cursor, plant growth,
// watering, and harvest. Saves on every state-changing action.

import { drawText, textWidth } from './font';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { saveRun } from './save';
import { drawSeedIcon, drawTile, SPECIES_DATA } from './species';
import { ConsoleMenu } from './menu';
import type { Scene } from './scene';
import { NEXT_PHASE, PHASE_SECONDS, paletteForPhase, phaseLabel } from './time';
import { MeteorShowerScene } from './wonder';
import {
  GRID_H,
  GRID_W,
  SPECIES,
  TILE_PX,
  type GrowthStage,
  type RunState,
} from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;

const GRID_PX_W = GRID_W * TILE_PX;
const GRID_X = Math.floor((SCREEN_W - GRID_PX_W) / 2);
const GRID_Y = 14;

// How long the harvest/plant toast stays on screen.
const TOAST_S = 1.6;

export class GardenScene implements Scene {
  private state: RunState;
  private blink = 0;
  private toast: { msg: string; t: number } | null = null;
  // Pending scene to return on next update; used when a phase
  // transition wants to launch a wonder cinematic.
  private pendingScene: Scene | null = null;
  // True only while sleepToMorning is iterating; suppresses wonder
  // rolls so the colonist doesn't "witness" things during sleep.
  private isSleeping = false;

  constructor(state: RunState) {
    this.state = state;
  }

  paletteName(): PaletteName {
    return paletteForPhase(this.state.phase);
  }

  // External callers (the Sleep action in the menu) can fast-forward
  // through phases to the next morning. Advances gameTime so plants
  // actually grow while the colonist sleeps. Wonder rolls are
  // suppressed — you can't witness a meteor shower with your eyes shut.
  sleepToMorning(): void {
    this.isSleeping = true;
    // Always advance at least one phase so SLEEP during the day still
    // skips ahead a full cycle to the next morning.
    do {
      const remaining = PHASE_SECONDS[this.state.phase] - this.state.phaseTime;
      this.state.gameTime += remaining;
      this.state.phaseTime = 0;
      this.advancePhase();
      this.catchUpPlants();
    } while (this.state.phase !== 'day');
    this.isSleeping = false;
    saveRun(this.state);
  }

  // Run plant stage transitions up to the current gameTime. Called
  // after sleep so plants leapfrog stages they would have hit.
  private catchUpPlants(): void {
    for (const tile of this.state.tiles) {
      while (tile.species && tile.stage > 0 && tile.stage < 4) {
        const sp = SPECIES_DATA[tile.species];
        const isWatered = tile.lastWateredAt > tile.stageStartedAt;
        const stageSecs = isWatered ? sp.secondsPerStage / 2 : sp.secondsPerStage;
        if (this.state.gameTime - tile.stageStartedAt >= stageSecs) {
          tile.stage = (tile.stage + 1) as GrowthStage;
          tile.stageStartedAt = this.state.gameTime;
        } else {
          break;
        }
      }
    }
  }

  // ---- Update -----------------------------------------------------------
  update(dt: number, input: Input): Scene | null {
    if (this.pendingScene) {
      const s = this.pendingScene;
      this.pendingScene = null;
      return s;
    }

    this.state.gameTime += dt;
    this.state.phaseTime += dt;
    this.blink += dt;
    if (this.toast) {
      this.toast.t -= dt;
      if (this.toast.t <= 0) this.toast = null;
    }

    // Advance phase if elapsed; one tick may cross multiple phases on
    // very low FPS, so loop.
    let phaseChanged = false;
    while (this.state.phaseTime >= PHASE_SECONDS[this.state.phase]) {
      this.state.phaseTime -= PHASE_SECONDS[this.state.phase];
      this.advancePhase();
      phaseChanged = true;
    }

    // Advance any plants whose stage timer is up.
    let changed = false;
    for (const tile of this.state.tiles) {
      if (!tile.species || tile.stage === 0 || tile.stage === 4) continue;
      const sp = SPECIES_DATA[tile.species];
      const isWatered = tile.lastWateredAt > tile.stageStartedAt;
      const stageSecs = isWatered ? sp.secondsPerStage / 2 : sp.secondsPerStage;
      if (this.state.gameTime - tile.stageStartedAt >= stageSecs) {
        tile.stage = (tile.stage + 1) as GrowthStage;
        tile.stageStartedAt = this.state.gameTime;
        changed = true;
      }
    }

    // Cursor movement.
    const c = this.state.cursor;
    if (input.justPressed('left'))  { c.x = (c.x - 1 + GRID_W) % GRID_W; changed = true; }
    if (input.justPressed('right')) { c.x = (c.x + 1) % GRID_W;          changed = true; }
    if (input.justPressed('up'))    { c.y = (c.y - 1 + GRID_H) % GRID_H; changed = true; }
    if (input.justPressed('down'))  { c.y = (c.y + 1) % GRID_H;          changed = true; }

    // SELECT cycles the chosen seed type.
    if (input.justPressed('select')) {
      const i = SPECIES.indexOf(this.state.selectedSeed);
      this.state.selectedSeed = SPECIES[(i + 1) % SPECIES.length];
      changed = true;
    }

    // A: plant on empty, harvest on mature.
    if (input.justPressed('a')) {
      const tile = this.state.tiles[c.y * GRID_W + c.x];
      if (tile.stage === 0) {
        const seed = this.state.selectedSeed;
        if (this.state.inventory.seeds[seed] > 0) {
          this.state.inventory.seeds[seed]--;
          tile.species = seed;
          tile.stage = 1;
          tile.stageStartedAt = this.state.gameTime;
          tile.lastWateredAt = 0;
          this.toast = { msg: `PLANTED ${SPECIES_DATA[seed].name}`, t: TOAST_S };
          changed = true;
        } else {
          this.toast = { msg: 'NO SEEDS', t: TOAST_S };
        }
      } else if (tile.stage === 4 && tile.species) {
        const sp = SPECIES_DATA[tile.species];
        const newTotal = this.state.inventory.harvested[tile.species] + sp.yieldPerHarvest;
        this.state.inventory.harvested[tile.species] = newTotal;
        // Focus the HUD chip on what we just picked so the count is visible.
        this.state.selectedSeed = tile.species;
        this.toast = { msg: `+${sp.yieldPerHarvest} ${sp.name} (${newTotal})`, t: TOAST_S };
        tile.species = null;
        tile.stage = 0;
        tile.stageStartedAt = 0;
        tile.lastWateredAt = 0;
        changed = true;
      }
    }

    // B: water current tile (any non-empty plant; costs 1 water).
    if (input.justPressed('b')) {
      const tile = this.state.tiles[c.y * GRID_W + c.x];
      if (tile.species && tile.stage > 0 && tile.stage < 4) {
        if (this.state.inventory.water > 0) {
          this.state.inventory.water--;
          tile.lastWateredAt = this.state.gameTime;
          this.toast = { msg: 'WATERED', t: TOAST_S };
          changed = true;
        } else {
          this.toast = { msg: 'NO WATER', t: TOAST_S };
        }
      }
    }

    if (changed || phaseChanged) saveRun(this.state);

    if (input.justPressed('start')) {
      return new ConsoleMenu(this.state, this);
    }
    // If a phase change queued a scene (e.g. wonder), return it.
    if (this.pendingScene) {
      const s = this.pendingScene;
      this.pendingScene = null;
      return s;
    }
    return null;
  }

  // Step exactly one phase forward; called by update() and by Sleep.
  private advancePhase(): void {
    const prev = this.state.phase;
    const next = NEXT_PHASE[prev];
    this.state.phase = next;
    // Toast the transition so the player notices.
    this.toast = { msg: phaseLabel(next), t: 1.4 };
    // Dawn advances the Sol counter (a new colony day).
    if (next === 'day' && prev === 'dawn') {
      this.state.sol += 1;
    }
    // Entering night: 30% chance of a wonder. Skipped during sleep.
    if (next === 'night' && !this.isSleeping) {
      if (Math.random() < 0.30) {
        this.pendingScene = new MeteorShowerScene(this.state, this);
      }
    }
  }

  // ---- Draw -------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Background
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    this.drawHud(ctx, p);
    this.drawGrid(ctx, p);
    this.drawCursor(ctx, p);
    this.drawStockPanel(ctx, p);
    this.drawTileStatus(ctx, p);
    this.drawPrompt(ctx, p);
    if (this.toast) this.drawToast(ctx, p);
  }

  private drawHud(ctx: CanvasRenderingContext2D, p: Palette): void {
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    drawText(ctx, `SOL ${this.state.sol}`, 2, 3, p[3]);

    // Phase label in the middle.
    const phase = phaseLabel(this.state.phase);
    drawText(ctx, phase, Math.floor((SCREEN_W - textWidth(phase)) / 2), 3, p[3]);

    const wText = `H2O ${this.state.inventory.water}`;
    drawText(ctx, wText, SCREEN_W - 2 - textWidth(wText), 3, p[3]);
  }

  // Always-visible stock for all species: <icon> <name> <seeds>/<leaves>.
  // The currently selected seed (for planting) is brightened + marked with '>'.
  private drawStockPanel(ctx: CanvasRenderingContext2D, p: Palette): void {
    const y = GRID_Y + GRID_H * TILE_PX + 4; // 4px below grid
    // Three chunks evenly distributed across the screen width.
    const chunkW = Math.floor(SCREEN_W / 3);
    for (let i = 0; i < SPECIES.length; i++) {
      const sp = SPECIES[i];
      const sd = SPECIES_DATA[sp];
      const seeds = this.state.inventory.seeds[sp];
      const leaves = this.state.inventory.harvested[sp];
      const selected = this.state.selectedSeed === sp;

      const text = `${sd.name} ${seeds}/${leaves}`;
      const totalW = 5 + 2 + textWidth(text); // icon + gap + text
      const x = i * chunkW + Math.floor((chunkW - totalW) / 2);

      drawSeedIcon(ctx, x, y, sp, p);
      drawText(ctx, text, x + 7, y, selected ? p[3] : p[2]);
      if (selected) drawText(ctx, '>', x - 4, y, p[3]);
    }
  }

  // Below the stock row: what's on the focused tile.
  private drawTileStatus(ctx: CanvasRenderingContext2D, p: Palette): void {
    const tile = this.state.tiles[this.state.cursor.y * GRID_W + this.state.cursor.x];
    const y = GRID_Y + GRID_H * TILE_PX + 14;
    let label: string;
    if (!tile.species || tile.stage === 0) {
      label = 'TILE: EMPTY';
    } else {
      const stageName = ['', 'SEED', 'SPROUT', 'GROWING', 'MATURE'][tile.stage];
      const watered = tile.lastWateredAt > tile.stageStartedAt ? ' (WET)' : '';
      label = `TILE: ${SPECIES_DATA[tile.species].name} ${stageName}${watered}`;
    }
    drawText(ctx, label, 2, y, p[3]);
  }

  private drawGrid(ctx: CanvasRenderingContext2D, p: Palette): void {
    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const tile = this.state.tiles[gy * GRID_W + gx];
        const isWatered = tile.lastWateredAt > tile.stageStartedAt && tile.stage > 0;
        drawTile(
          ctx,
          GRID_X + gx * TILE_PX,
          GRID_Y + gy * TILE_PX,
          tile.species,
          tile.stage,
          isWatered,
          p,
        );
      }
    }
  }

  private drawCursor(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Blinking corner brackets around the focused tile.
    if (Math.floor(this.blink * 3) % 2 === 0) return;
    const x = GRID_X + this.state.cursor.x * TILE_PX;
    const y = GRID_Y + this.state.cursor.y * TILE_PX;
    ctx.fillStyle = p[3];
    // Top-left
    ctx.fillRect(x, y, 4, 1); ctx.fillRect(x, y, 1, 4);
    // Top-right
    ctx.fillRect(x + 14, y, 4, 1); ctx.fillRect(x + 17, y, 1, 4);
    // Bottom-left
    ctx.fillRect(x, y + 17, 4, 1); ctx.fillRect(x, y + 14, 1, 4);
    // Bottom-right
    ctx.fillRect(x + 14, y + 17, 4, 1); ctx.fillRect(x + 17, y + 14, 1, 4);
  }

  private drawPrompt(ctx: CanvasRenderingContext2D, p: Palette): void {
    const tile = this.state.tiles[this.state.cursor.y * GRID_W + this.state.cursor.x];
    let a = '';
    let b = '';
    if (tile.stage === 0) {
      a = `A:PLANT ${SPECIES_DATA[this.state.selectedSeed].name}`;
    } else if (tile.stage === 4) {
      a = 'A:HARVEST';
    } else {
      a = 'A:--';
    }
    if (tile.species && tile.stage > 0 && tile.stage < 4) {
      b = 'B:WATER';
    } else {
      b = 'B:--';
    }

    // Two-line footer: action prompts on top, helper hints below.
    const y1 = SCREEN_H - 16;
    const y2 = SCREEN_H - 7;
    ctx.fillStyle = p[0];
    ctx.fillRect(0, y1 - 2, SCREEN_W, 18);

    drawText(ctx, a, 2, y1, p[3]);
    drawText(ctx, b, SCREEN_W - 2 - textWidth(b), y1, p[3]);

    // Helper hints. SELECT hint is always shown. When the currently
    // selected seed is out, the START hint blinks to draw the eye
    // toward the Vault.
    const selHint = 'SEL:CYCLE';
    drawText(ctx, selHint, 2, y2, p[2]);

    const outOfSeeds = this.state.inventory.seeds[this.state.selectedSeed] === 0;
    if (outOfSeeds) {
      const startHint = 'START:GET SEEDS';
      const blink = Math.floor(this.blink * 2) % 2 === 0;
      const color = blink ? p[3] : p[2];
      drawText(ctx, startHint, SCREEN_W - 2 - textWidth(startHint), y2, color);
    } else {
      const startHint = 'START:VAULT';
      drawText(ctx, startHint, SCREEN_W - 2 - textWidth(startHint), y2, p[2]);
    }
  }

  private drawToast(ctx: CanvasRenderingContext2D, p: Palette): void {
    if (!this.toast) return;
    const msg = this.toast.msg;
    const w = textWidth(msg) + 6;
    const x = Math.floor((SCREEN_W - w) / 2);
    const y = SCREEN_H - 22;
    ctx.fillStyle = p[0];
    ctx.fillRect(x, y, w, 9);
    ctx.fillStyle = p[3];
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + 8, w, 1);
    drawText(ctx, msg, x + 3, y + 2, p[3]);
  }
}
