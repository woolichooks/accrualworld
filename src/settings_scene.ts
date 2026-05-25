// Settings screen. Reachable from the title's main menu.
// Houses the SFX toggle and the THEME cycler (bezel + screen
// palettes are bundled per theme — see themes.ts).

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H, textWidth5 } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import type { Scene } from './scene';
import { loadSettings, saveSettings } from './settings';
import { sfx } from './audio';
import { applyThemeBezel, getTheme, THEME_ORDER } from './themes';

const SCREEN_W = 160;
const SCREEN_H = 144;

interface Item {
  label: string;
  valueText: string;
  // A primary action (SFX: toggle; THEME: next).
  activate: () => void;
  // Optional reverse direction for cyclers — bound to LEFT.
  reverse?: () => void;
}

export class SettingsScene implements Scene {
  private prev: Scene;
  private t = 0;
  private idx = 0;

  constructor(prev: Scene) { this.prev = prev; }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'day';
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
    if (input.justPressed('right') || input.justPressed('a')) {
      items[this.idx].activate();
      sfx.click();
    }
    if (input.justPressed('left')) {
      const it = items[this.idx];
      (it.reverse ?? it.activate)();
      sfx.click();
    }
    if (input.justPressed('b') || input.justPressed('start')) {
      sfx.cancel();
      return this.prev;
    }
    return null;
  }

  private items(): Item[] {
    const s = loadSettings();
    const cycleTheme = (dir: 1 | -1) => {
      const i = THEME_ORDER.indexOf(s.theme);
      const next = THEME_ORDER[(i + dir + THEME_ORDER.length) % THEME_ORDER.length];
      saveSettings({ ...s, theme: next });
      applyThemeBezel(next);
    };
    return [
      {
        label: 'SFX',
        valueText: s.sfxEnabled ? 'ON' : 'OFF',
        activate: () => saveSettings({ ...s, sfxEnabled: !s.sfxEnabled }),
      },
      {
        label: 'THEME',
        valueText: getTheme(s.theme).name,
        activate: () => cycleTheme(1),
        reverse: () => cycleTheme(-1),
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
      // Right-align the value text with chevrons either side when
      // the row is a cycler (so the player knows LEFT/RIGHT works).
      const vt = it.valueText;
      const vw = textWidth5(vt);
      const vx = SCREEN_W - 16 - vw;
      drawText5(ctx, vt, vx, y, color);
      if (it.reverse) {
        drawText5(ctx, '<', vx - 8, y, color);
        drawText5(ctx, '>', SCREEN_W - 14, y, color);
      }
      y += LINE5_H + 3;
    }

    // Live preview swatch — 3 squares showing the active theme's
    // day / event / night colors at index 3 so the player sees the
    // change without leaving the screen.
    const themeId = loadSettings().theme;
    const theme = getTheme(themeId);
    const slots: PaletteName[] = ['day', 'event', 'night'];
    const sw = 8;
    const gap = 2;
    const totalW = slots.length * (sw + gap) - gap;
    const sx = Math.floor((SCREEN_W - totalW) / 2);
    const sy = SCREEN_H - 32;
    drawText(ctx, 'PREVIEW', Math.floor((SCREEN_W - textWidth('PREVIEW')) / 2), sy - 8, p[2]);
    for (let i = 0; i < slots.length; i++) {
      const pal = theme.palettes[slots[i]];
      const x = sx + i * (sw + gap);
      // Two horizontal bands per swatch for a slight palette preview.
      ctx.fillStyle = pal[1];
      ctx.fillRect(x, sy, sw, 4);
      ctx.fillStyle = pal[3];
      ctx.fillRect(x, sy + 4, sw, 4);
    }

    // Footer
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    const hint = 'LR/A: CHANGE   B: BACK';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }
}
