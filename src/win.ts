// Win screen — shown when the player launches with a full ship hull.
// Wipes the run save and sends them back to title.
//
// Visual: a tiny ship rises from the horizon through a starfield
// while a triumphant caption holds, then a stats card at the end.

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H, textWidth5 } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { clearRun } from './save';
import { sfx } from './audio';
import type { Scene } from './scene';
import type { RunState } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;

let titleFactory: (() => Scene) | null = null;
export function registerWinTitle(factory: () => Scene): void {
  titleFactory = factory;
}

export class WinScene implements Scene {
  private state: RunState;
  private t = 0;
  private stars: { x: number; y: number; phase: number }[] = [];

  constructor(state: RunState) {
    this.state = state;
    clearRun();
    // Triad shimmer chord for the launch.
    sfx.wonder();
    sfx.puzzleCorrect();
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * SCREEN_W),
        y: Math.floor(Math.random() * (SCREEN_H - 16)),
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  paletteName(): PaletteName { return 'night'; }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;
    if (this.t > 1.0 && (input.justPressed('a') || input.justPressed('start'))) {
      return titleFactory ? titleFactory() : this;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Starfield
    for (const s of this.stars) {
      const tw = Math.sin(this.t * 2 + s.phase);
      ctx.fillStyle = tw > 0.6 ? p[3] : tw > 0 ? p[2] : p[1];
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Horizon and biodome at the bottom — same silhouette as title.
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 24, SCREEN_W, 24);
    ctx.fillStyle = p[0];
    for (let x = 0; x < SCREEN_W; x++) {
      const h = 4 + Math.floor(3 * Math.sin(x * 0.18));
      ctx.fillRect(x, SCREEN_H - 24 - h, 1, h);
    }

    // Ship rises from horizon to top across ~3.5s. Position is
    // pixel-snapped so the ascent reads as pixel art, not animation.
    const launchT = Math.min(this.t / 3.5, 1);
    const shipY = Math.floor(SCREEN_H - 24 - launchT * (SCREEN_H - 40));
    const shipX = SCREEN_W / 2 - 2;
    // Body
    ctx.fillStyle = p[3];
    ctx.fillRect(shipX, shipY, 4, 6);
    ctx.fillRect(shipX + 1, shipY - 1, 2, 1);
    // Fins
    ctx.fillStyle = p[2];
    ctx.fillRect(shipX - 1, shipY + 4, 1, 2);
    ctx.fillRect(shipX + 4, shipY + 4, 1, 2);
    // Exhaust flicker
    if (Math.floor(this.t * 12) % 2 === 0) {
      ctx.fillStyle = p[3];
      ctx.fillRect(shipX + 1, shipY + 6, 2, 1);
      ctx.fillRect(shipX + 1, shipY + 7, 2, 2);
      ctx.fillStyle = p[2];
      ctx.fillRect(shipX, shipY + 8, 4, 1);
    }

    // Caption pulses then yields to the stats card.
    if (this.t < 3.6) {
      const msg = 'RETURN VECTOR LOCKED';
      const w = textWidth5(msg);
      drawText5(ctx, msg, Math.floor((SCREEN_W - w) / 2), 22, p[3]);
      const sub = 'WELL DONE, COLONIST';
      drawText(ctx, sub, Math.floor((SCREEN_W - textWidth(sub)) / 2), 34, p[2]);
    } else {
      const lines = [
        'COLONY ESCAPE LOG',
        '',
        `SOL OF LAUNCH:  ${this.state.sol}`,
        `SHIP HULL PARTS: ${this.state.shipParts}`,
      ];
      let y = 18;
      for (const ln of lines) {
        drawText5(ctx, ln, Math.floor((SCREEN_W - textWidth5(ln)) / 2), y, p[3]);
        y += LINE5_H;
      }
      if (Math.floor(this.t * 2) % 2 === 0) {
        const hint = 'A: RETURN TO TITLE';
        drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 8, p[3]);
      }
    }
  }
}
