// Game over — shown when a shelter stat hits 0. Clears the run save
// (meta survives), then returns to title on A/Start.

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H, textWidth5 } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { clearRun } from './save';
import type { Scene } from './scene';
import type { RunState } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;

// We import TitleScene lazily through a setter to avoid a require
// cycle with main.ts. main.ts registers the title constructor at boot.
let titleFactory: (() => Scene) | null = null;
export function registerTitle(factory: () => Scene): void {
  titleFactory = factory;
}

export class GameOverScene implements Scene {
  private state: RunState;
  private cause: string;
  private t = 0;

  constructor(state: RunState, cause: string) {
    this.state = state;
    this.cause = cause;
    // Wipe the run immediately; the player can only return to title.
    clearRun();
  }

  paletteName(): PaletteName {
    return 'ember';
  }

  update(_dt: number, input: Input): Scene | null {
    this.t += _dt;
    if (this.t > 0.6 && (input.justPressed('a') || input.justPressed('start'))) {
      return titleFactory ? titleFactory() : this;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    const title = 'COLONY SILENT';
    drawText5(ctx, title, Math.floor((SCREEN_W - textWidth5(title)) / 2), 30, p[3]);

    const lines = [
      `LOST AT SOL ${this.state.sol}`,
      `CAUSE: ${this.cause}`,
      '',
      'HULL  ' + this.state.shelter.hull,
      'OXY   ' + this.state.shelter.oxygen,
      'POWER ' + this.state.shelter.power,
    ];
    let y = 50;
    for (const ln of lines) {
      drawText5(ctx, ln, Math.floor((SCREEN_W - textWidth5(ln)) / 2), y, p[2]);
      y += LINE5_H;
    }

    if (Math.floor(this.t * 2) % 2 === 0 && this.t > 0.6) {
      const hint = 'A: RETURN TO TITLE';
      drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 14, p[3]);
    }
  }
}
