// Settings screen. Reachable from the title's main menu. Currently
// houses just the SFX toggle; future palette skins / etc. plug in here.

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import type { Scene } from './scene';
import { loadSettings, saveSettings } from './settings';
import { sfx } from './audio';

const SCREEN_W = 160;
const SCREEN_H = 144;

export class SettingsScene implements Scene {
  private prev: Scene;
  private t = 0;
  private idx = 0;

  constructor(prev: Scene) { this.prev = prev; }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'acrid';
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;
    const items = this.items();
    if (input.justPressed('up')) {
      this.idx = (this.idx + items.length - 1) % items.length;
      sfx.cursor();
    }
    if (input.justPressed('down')) {
      this.idx = (this.idx + 1) % items.length;
      sfx.cursor();
    }
    if (input.justPressed('a')) {
      items[this.idx].toggle();
      sfx.click();
    }
    if (input.justPressed('b') || input.justPressed('start')) {
      sfx.cancel();
      return this.prev;
    }
    return null;
  }

  private items(): { label: string; valueText: string; toggle: () => void }[] {
    const s = loadSettings();
    return [
      {
        label: 'SFX',
        valueText: s.sfxEnabled ? 'ON' : 'OFF',
        toggle: () => saveSettings({ ...s, sfxEnabled: !s.sfxEnabled }),
      },
    ];
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
    drawText(ctx, 'SETTINGS', 4, 3, p[3]);

    const items = this.items();
    let y = 30;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const focused = i === this.idx;
      const color = focused ? p[3] : p[2];
      if (focused && Math.floor(this.t * 3) % 2 === 0) {
        drawText5(ctx, '>', 8, y, p[3]);
      }
      drawText5(ctx, it.label, 16, y, color);
      drawText5(ctx, it.valueText, SCREEN_W - 16 - 12, y, color);
      y += LINE5_H + 3;
    }

    // Footer
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    const hint = 'A: TOGGLE   B/START: BACK';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }
}
