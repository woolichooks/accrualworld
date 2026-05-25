// Expanded status view. Opened from the garden via TAB (or the
// Colony Console). Shows full bars for each shelter stat plus a
// quick inventory readout. A/B/START close it.

import { drawText, textWidth } from './font';
import { drawText5 } from './font5';
import { drawHeart, HEART_W } from './heart';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import type { Scene } from './scene';
import { DIFFICULTY, STAT_MAX, SPECIES, type RunState } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;

export class StatusScene implements Scene {
  private state: RunState;
  private prev: Scene;
  private t = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'acrid';
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;
    if (input.justPressed('a') || input.justPressed('b') ||
        input.justPressed('start') || input.justPressed('tab')) {
      return this.prev;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Header
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    const mode = DIFFICULTY[this.state.difficulty].label;
    drawText(ctx, `STATUS  ${mode}`, 4, 3, p[3]);
    drawText(ctx, `SOL ${this.state.sol}`, SCREEN_W - 2 - textWidth(`SOL ${this.state.sol}`), 3, p[3]);

    // Shelter stats — heart, label, segmented bar, numeric.
    const stats: { label: string; value: number; max: number }[] = [
      { label: 'HULL',   value: this.state.shelter.hull,   max: STAT_MAX },
      { label: 'OXYGEN', value: this.state.shelter.oxygen, max: STAT_MAX },
      { label: 'POWER',  value: this.state.shelter.power,  max: STAT_MAX },
      { label: 'WATER',  value: this.state.inventory.water, max: STAT_MAX },
    ];

    let y = 18;
    for (const s of stats) {
      drawHeart(ctx, 4, y, s.value, s.max, this.t, p);
      drawText5(ctx, s.label, 4 + HEART_W + 3, y, p[3]);
      // Segmented bar: 10 cells, filled to value (capped at max).
      const barX = 60;
      const barW = 80;
      const cells = 10;
      const cellW = Math.floor(barW / cells);
      for (let c = 0; c < cells; c++) {
        const filled = c < Math.min(s.value, s.max);
        ctx.fillStyle = filled ? p[3] : p[1];
        ctx.fillRect(barX + c * cellW, y + 1, cellW - 1, 5);
      }
      drawText(ctx, `${s.value}`, SCREEN_W - 14, y + 1, p[3]);
      y += 9;
    }

    // Inventory readout — seeds and leaves, compact.
    y += 4;
    drawText(ctx, 'SEEDS', 4, y, p[2]);
    drawText(ctx, this.invLine(this.state.inventory.seeds), 30, y, p[3]);
    y += 8;
    drawText(ctx, 'LEAF',  4, y, p[2]);
    drawText(ctx, this.invLine(this.state.inventory.harvested), 30, y, p[3]);

    // Footer
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    const hint = 'A/B/TAB: CLOSE';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }

  // Compact inventory line: e.g. "M4 S2 B0 C0 P1 A0 G0 L0". First
  // letter of species + count.
  private invLine(counts: Record<string, number>): string {
    return SPECIES.map((sp) => `${sp[0].toUpperCase()}${counts[sp] ?? 0}`).join(' ');
  }
}
