// Garden scene: 6x4 tile grid with a blinking cursor, plant growth,
// watering, and harvest. Saves on every state-changing action.

import { drawText, textWidth } from './font';
import { type Input } from './input';
import { type Palette } from './palette';
import { saveRun } from './save';
import { drawSeedIcon, drawTile, SPECIES_DATA } from './species';
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

export interface Scene {
  update(dt: number, input: Input): Scene | null;
  draw(ctx: CanvasRenderingContext2D, p: Palette): void;
}

export class GardenScene implements Scene {
  private state: RunState;
  private blink = 0;
  private toast: { msg: string; t: number } | null = null;

  constructor(state: RunState) {
    this.state = state;
  }

  // ---- Update -----------------------------------------------------------
  update(dt: number, input: Input): Scene | null {
    this.state.gameTime += dt;
    this.blink += dt;
    if (this.toast) {
      this.toast.t -= dt;
      if (this.toast.t <= 0) this.toast = null;
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

    if (changed) saveRun(this.state);
    return null;
  }

  // ---- Draw -------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Background
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    this.drawHud(ctx, p);
    this.drawGrid(ctx, p);
    this.drawCursor(ctx, p);
    this.drawPrompt(ctx, p);
    if (this.toast) this.drawToast(ctx, p);
  }

  private drawHud(ctx: CanvasRenderingContext2D, p: Palette): void {
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, 11);

    drawText(ctx, `SOL ${this.state.sol}`, 2, 3, p[3]);

    // Selected seed chip: <icon> <name> S:<seeds> L:<harvested leaves>
    const seed = this.state.selectedSeed;
    const seedCount = this.state.inventory.seeds[seed];
    const leafCount = this.state.inventory.harvested[seed];
    const chipX = 36;
    drawSeedIcon(ctx, chipX, 3, seed, p);
    const chipText = `${SPECIES_DATA[seed].name} ${seedCount}/${leafCount}`;
    drawText(ctx, chipText, chipX + 7, 3, p[3]);

    // Water counter, right-aligned
    const wText = `H2O ${this.state.inventory.water}`;
    drawText(ctx, wText, SCREEN_W - 2 - textWidth(wText), 3, p[3]);
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
    const y = SCREEN_H - 8;
    ctx.fillStyle = p[0];
    ctx.fillRect(0, y - 2, SCREEN_W, 10);
    drawText(ctx, a, 2, y, p[3]);
    const bw = textWidth(b);
    drawText(ctx, b, SCREEN_W - 2 - bw, y, p[3]);
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
