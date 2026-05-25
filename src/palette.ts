// Palette helper. Palette names are semantic slots — day / night /
// event — and the active theme decides which actual colors to use
// for each slot. See themes.ts.

import { getTheme } from './themes';
import { loadSettings } from './settings';

export type Palette = readonly [string, string, string, string];
export type PaletteName = 'day' | 'night' | 'event';

export function getPalette(name: PaletteName): Palette {
  const themeId = loadSettings().theme;
  return getTheme(themeId).palettes[name];
}

// Backwards-compat shim for any leftover callers — main.ts used to
// look up PALETTES[name]. Now it's a function call.
export const PALETTES = new Proxy(
  {} as Record<PaletteName, Palette>,
  { get: (_t, prop) => getPalette(prop as PaletteName) },
);
