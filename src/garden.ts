// Garden scene: 6x4 tile grid with a blinking cursor, plant growth,
// watering, and harvest. Saves on every state-changing action.

import { drawText, textWidth } from './font';
import { drawHeart, HEART_W } from './heart';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { saveRun } from './save';
import { sfx } from './audio';
import { drawSeedIcon, drawTile, MUTATIONS, SPECIES_DATA } from './species';
import { ConsoleMenu } from './menu';
import type { Scene } from './scene';
import { StatusScene } from './status';
import { NEXT_PHASE, PHASE_SECONDS, paletteForPhase, phaseLabel } from './time';
import { drawSkyClock, SKYCLOCK_W } from './sky';
import { pickWonder } from './wonder';
import { ThreatScene, pickThreat } from './threat';
import { GameOverScene } from './gameover';
import {
  CRITICAL_SOLS_GRACE,
  GRID_H,
  GRID_W,
  SPECIES,
  STAT_MAX,
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
    const moved =
      input.justPressed('left')  ? (c.x = (c.x - 1 + GRID_W) % GRID_W, true) :
      input.justPressed('right') ? (c.x = (c.x + 1) % GRID_W, true) :
      input.justPressed('up')    ? (c.y = (c.y - 1 + GRID_H) % GRID_H, true) :
      input.justPressed('down')  ? (c.y = (c.y + 1) % GRID_H, true) : false;
    if (moved) { sfx.cursor(); changed = true; }

    // SELECT cycles the chosen seed type.
    if (input.justPressed('select')) {
      const i = SPECIES.indexOf(this.state.selectedSeed);
      this.state.selectedSeed = SPECIES[(i + 1) % SPECIES.length];
      sfx.cursor();
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
          sfx.plant();
          changed = true;
        } else {
          this.toast = { msg: 'NO SEEDS', t: TOAST_S };
          sfx.warn();
        }
      } else if (tile.stage === 4 && tile.species) {
        const sp = SPECIES_DATA[tile.species];
        const newTotal = this.state.inventory.harvested[tile.species] + sp.yieldPerHarvest;
        this.state.inventory.harvested[tile.species] = newTotal;
        // Focus the HUD chip on what we just picked so the count is visible.
        this.state.selectedSeed = tile.species;
        let msg = `+${sp.yieldPerHarvest} ${sp.name} (${newTotal})`;
        if (tile.mutated) {
          const m = MUTATIONS[tile.species];
          m.apply(this.state);
          msg = `${m.name}! ${m.harvestBonus}`;
          sfx.wonder();
        } else {
          sfx.harvest();
        }
        this.toast = { msg, t: TOAST_S };
        tile.species = null;
        tile.stage = 0;
        tile.stageStartedAt = 0;
        tile.lastWateredAt = 0;
        tile.mutated = false;
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
          sfx.water();
          changed = true;
        } else {
          this.toast = { msg: 'NO WATER', t: TOAST_S };
          sfx.warn();
        }
      }
    }

    if (changed || phaseChanged) saveRun(this.state);

    if (input.justPressed('start')) {
      return new ConsoleMenu(this.state, this);
    }
    if (input.justPressed('tab')) {
      return new StatusScene(this.state, this);
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
  // Run the per-dawn grace tick: any stat at 0 bumps its counter,
  // any stat above 0 resets to 0, and if any counter has reached
  // CRITICAL_SOLS_GRACE the run ends on the next update.
  private tickCriticalCounters(): void {
    const s = this.state.shelter;
    const c = this.state.criticalSols;
    const tally = (val: number, cur: number) => (val === 0 ? cur + 1 : 0);
    c.hull   = tally(s.hull,   c.hull);
    c.oxygen = tally(s.oxygen, c.oxygen);
    c.power  = tally(s.power,  c.power);
    let cause = '';
    if (c.hull   >= CRITICAL_SOLS_GRACE) cause = 'HULL OFFLINE';
    else if (c.oxygen >= CRITICAL_SOLS_GRACE) cause = 'OXY DEPLETED';
    else if (c.power  >= CRITICAL_SOLS_GRACE) cause = 'POWER OUT';
    if (cause) {
      this.pendingScene = new GameOverScene(this.state, cause);
    } else if (c.hull > 0 || c.oxygen > 0 || c.power > 0) {
      // Loud reminder if anything is critical and not yet game over.
      const left = CRITICAL_SOLS_GRACE - Math.max(c.hull, c.oxygen, c.power);
      this.toast = { msg: `CRITICAL - ${left} SOL LEFT`, t: 2.4 };
    }
  }

  private advancePhase(): void {
    const prev = this.state.phase;
    const next = NEXT_PHASE[prev];
    this.state.phase = next;
    // Toast the transition so the player notices.
    this.toast = { msg: phaseLabel(next), t: 1.4 };
    // Dawn advances the Sol counter (a new colony day) and is the
    // tick point for the critical-stat grace counters. Surviving a
    // sol also salvages one ship-hull part.
    if (next === 'day' && prev === 'dawn') {
      this.state.sol += 1;
      this.state.shipParts += 1;
      this.tickCriticalCounters();
    }
    // Entering night: roll one of wonder / threat / nothing.
    // Suppressed during sleep — the colonist neither sees the sky nor
    // weathers the storm consciously (sleep is the safe-but-quiet path).
    if (next === 'night' && !this.isSleeping) {
      const r = Math.random();
      if (r < 0.30) {
        this.pendingScene = pickWonder(this.state, this);
      } else if (r < 0.80) {
        this.pendingScene = new ThreatScene(this.state, pickThreat(), this);
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
    ctx.fillRect(0, 0, SCREEN_W, 12);

    // Left: SOL
    drawText(ctx, `SOL ${this.state.sol}`, 2, 3, p[3]);

    // Right: compact status bar — 4 hearts with their numeric values.
    // Order H/O/P/W from left to right; criticality is per-icon (the
    // drawHeart helper blinks low stats). Press TAB for full status.
    const stats = [
      this.state.shelter.hull,
      this.state.shelter.oxygen,
      this.state.shelter.power,
      Math.min(this.state.inventory.water, STAT_MAX),
    ];
    const rawValues = [
      this.state.shelter.hull,
      this.state.shelter.oxygen,
      this.state.shelter.power,
      this.state.inventory.water,
    ];
    const chunkW = 14; // heart(5) + gap(1) + 2-char count(7) + spacer(1)
    const totalW = chunkW * stats.length;
    const rightStart = SCREEN_W - totalW - 2;
    for (let i = 0; i < stats.length; i++) {
      const x = rightStart + i * chunkW;
      drawHeart(ctx, x, 3, stats[i], STAT_MAX, this.blink, p);
      const numText = `${rawValues[i]}`;
      drawText(ctx, numText, x + HEART_W + 1, 3, p[3]);
    }

    // Center-left: sky-clock + phase label, positioned between SOL
    // and the stats panel.
    const phase = phaseLabel(this.state.phase);
    const labelW = textWidth(phase);
    const groupW = SKYCLOCK_W + 3 + labelW;
    const available = rightStart - 26;
    const groupX = 26 + Math.floor((available - groupW) / 2);
    drawSkyClock(ctx, groupX, 1, this.state.phase, this.state.phaseTime, p);
    drawText(ctx, phase, groupX + SKYCLOCK_W + 3, 3, p[3]);
  }

  // Tile-status line — drawn first under the grid so the player's
  // attention lands here. Shows what's on the focused tile plus the
  // currently selected seed (so cycling with SELECT has an obvious
  // anchor for what got chosen).
  private drawTileStatus(ctx: CanvasRenderingContext2D, p: Palette): void {
    const tile = this.state.tiles[this.state.cursor.y * GRID_W + this.state.cursor.x];
    const y = GRID_Y + GRID_H * TILE_PX + 4;
    let tileLabel: string;
    if (!tile.species || tile.stage === 0) {
      tileLabel = 'TILE: EMPTY';
    } else {
      const stageName = ['', 'SEED', 'SPROUT', 'GROWING', 'MATURE'][tile.stage];
      const watered = tile.lastWateredAt > tile.stageStartedAt ? ' (WET)' : '';
      const name = tile.mutated
        ? MUTATIONS[tile.species].name
        : SPECIES_DATA[tile.species].name;
      tileLabel = `TILE: ${name} ${stageName}${watered}`;
    }
    drawText(ctx, tileLabel, 2, y, p[3]);

    // Right-aligned: currently selected seed full name so the player
    // always knows what's planted on the next A press.
    const selName = SPECIES_DATA[this.state.selectedSeed].name;
    const selText = `SEED: ${selName}`;
    drawText(ctx, selText, SCREEN_W - 2 - textWidth(selText), y, p[3]);
  }

  // Stock panel — two rows of four species (so seed/harvest counts
  // have generous room each). Per chunk: <icon> <name> <seeds>/<leaves>.
  // Selected species renders in p[3]; others in p[2].
  private drawStockPanel(ctx: CanvasRenderingContext2D, p: Palette): void {
    const rowY = [
      GRID_Y + GRID_H * TILE_PX + 14,
      GRID_Y + GRID_H * TILE_PX + 22,
    ];
    const perRow = 4;
    const chunkW = Math.floor(SCREEN_W / perRow); // 40px each
    for (let i = 0; i < SPECIES.length; i++) {
      const sp = SPECIES[i];
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = col * chunkW + 1;
      const y = rowY[row];
      const seeds = this.state.inventory.seeds[sp];
      const leaves = this.state.inventory.harvested[sp];
      const selected = this.state.selectedSeed === sp;

      drawSeedIcon(ctx, x, y, sp, p);
      const name = SPECIES_DATA[sp].name.slice(0, 4);
      const color = selected ? p[3] : p[2];
      drawText(ctx, name, x + 7, y, color);
      const countText = `${seeds}/${leaves}`;
      // Right-align the count within the chunk for visual alignment.
      const cx = (col + 1) * chunkW - textWidth(countText) - 2;
      drawText(ctx, countText, cx, y, color);
    }
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
          tile.mutated,
          this.blink,
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

    // Always label the buttons by their *purpose* — the player learns
    // what B does even before they stand on a plant. Dim when the
    // action isn't currently available.
    let a: string;
    let aActive: boolean;
    if (tile.stage === 0) {
      a = `A:PLANT ${SPECIES_DATA[this.state.selectedSeed].name}`;
      aActive = this.state.inventory.seeds[this.state.selectedSeed] > 0;
    } else if (tile.stage === 4) {
      a = 'A:HARVEST';
      aActive = true;
    } else {
      a = 'A:GROWING';
      aActive = false;
    }
    const b = 'B:WATER';
    const bActive =
      !!(tile.species && tile.stage > 0 && tile.stage < 4) &&
      this.state.inventory.water > 0;

    // Two-line footer: action prompts on top, helper hints below.
    const y1 = SCREEN_H - 16;
    const y2 = SCREEN_H - 7;
    ctx.fillStyle = p[0];
    ctx.fillRect(0, y1 - 2, SCREEN_W, 18);

    drawText(ctx, a, 2, y1, aActive ? p[3] : p[2]);
    drawText(ctx, b, SCREEN_W - 2 - textWidth(b), y1, bActive ? p[3] : p[2]);

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
