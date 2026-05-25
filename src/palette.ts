// 4-color palettes (index 0 darkest -> 3 lightest). Default is the
// sickly Accrualworld green; others are queued up for later screens.

export type Palette = readonly [string, string, string, string];

export const PALETTES = {
  acrid:   ['#0b1a10', '#1a3a26', '#4d8a52', '#b8d97a'] as const,
  indigo:  ['#0a0a1f', '#1a1a3a', '#4a4a7a', '#b8c0e0'] as const, // night
  ember:   ['#1a0a08', '#3a1410', '#a83a20', '#f0c060'] as const, // wonder
} as const;

export type PaletteName = keyof typeof PALETTES;
