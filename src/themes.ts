// Themes. Each one bundles:
//   - A bezel color set (applied via CSS custom properties)
//   - Three on-screen palettes, indexed by semantic slot
//     (day / night / event), so the time-of-day cycle and the
//     wonder/threat overlays continue to work seamlessly.
//
// Themes are inspired by classic handheld colorways: cream DMG,
// blue, yellow, red, green, and the original acrid green default.

import type { Palette, PaletteName } from './palette';

export type ThemeId =
  | 'acrid'
  | 'dmg'
  | 'cobalt'
  | 'golden'
  | 'crimson'
  | 'lichen';

export interface BezelColors {
  main: string;
  edge: string;
  light: string;
  screenFrame?: string;
  btnPrimary?: string;
  btnPrimaryEdge?: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  bezel: BezelColors;
  palettes: Record<PaletteName, Palette>;
}

export const THEMES: Record<ThemeId, Theme> = {
  acrid: {
    id: 'acrid',
    name: 'ACRID',
    bezel: { main: '#2a2628', edge: '#15110f', light: '#3a3436' },
    palettes: {
      day:   ['#0b1a10', '#1a3a26', '#4d8a52', '#b8d97a'] as const,
      night: ['#0a0a1f', '#1a1a3a', '#4a4a7a', '#b8c0e0'] as const,
      event: ['#1a0a08', '#3a1410', '#a83a20', '#f0c060'] as const,
    },
  },
  dmg: {
    id: 'dmg',
    name: 'DMG CREAM',
    bezel: {
      main: '#9c9a96', edge: '#5c5a56', light: '#bcbab6',
      screenFrame: '#3c3a36',
      btnPrimary: '#7a1a3a', btnPrimaryEdge: '#3a0a18',
    },
    palettes: {
      day:   ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] as const,
      night: ['#0a1820', '#1a3040', '#4060a0', '#a0d0e0'] as const,
      event: ['#3a1f0a', '#7a4a0a', '#cca010', '#f0d860'] as const,
    },
  },
  cobalt: {
    id: 'cobalt',
    name: 'COBALT',
    bezel: { main: '#1a4a8a', edge: '#0a1f4a', light: '#2a6abe' },
    palettes: {
      day:   ['#0a1838', '#1a3a78', '#4d8acc', '#b8d9ff'] as const,
      night: ['#04081a', '#0e1a3a', '#3a4a8a', '#a0b8e0'] as const,
      event: ['#2a0a3a', '#6a1f6a', '#c060c0', '#f0a0e8'] as const,
    },
  },
  golden: {
    id: 'golden',
    name: 'GOLDEN',
    bezel: {
      main: '#c89a14', edge: '#7a5a0a', light: '#e8b830',
      btnPrimary: '#3a3036', btnPrimaryEdge: '#15110f',
    },
    palettes: {
      day:   ['#2a1a08', '#5a3a0e', '#b08020', '#f0d870'] as const,
      night: ['#1a1810', '#3a3a1a', '#8a7a3a', '#e0d8a0'] as const,
      event: ['#3a0a0a', '#7a1f10', '#c84a20', '#f0a040'] as const,
    },
  },
  crimson: {
    id: 'crimson',
    name: 'CRIMSON',
    bezel: { main: '#8a1a1a', edge: '#3a0a0a', light: '#b83030' },
    palettes: {
      day:   ['#2a0808', '#5a1a18', '#a83a30', '#f0a070'] as const,
      night: ['#1a0a18', '#3a1a3a', '#7a3a7a', '#d0a0d0'] as const,
      event: ['#2a1a00', '#5a3a00', '#c89010', '#f8e040'] as const,
    },
  },
  lichen: {
    id: 'lichen',
    name: 'LICHEN',
    bezel: { main: '#2a4a2a', edge: '#0a1f0a', light: '#3a6a3a' },
    palettes: {
      day:   ['#102810', '#2a5a20', '#6abe40', '#c0f080'] as const,
      night: ['#08101a', '#1a2a3a', '#4a6a8a', '#a0c8e0'] as const,
      event: ['#2a1a0a', '#5a3a1a', '#b07830', '#e8c870'] as const,
    },
  },
};

export const THEME_ORDER: ThemeId[] = ['acrid', 'dmg', 'cobalt', 'golden', 'crimson', 'lichen'];

export function getTheme(id: ThemeId): Theme {
  return THEMES[id] ?? THEMES.acrid;
}

// Apply a theme's bezel colors via CSS custom properties. Screen
// palettes are resolved per draw via getPalette() in palette.ts.
export function applyThemeBezel(id: ThemeId): void {
  const t = getTheme(id);
  const root = document.documentElement;
  root.style.setProperty('--bezel', t.bezel.main);
  root.style.setProperty('--bezel-edge', t.bezel.edge);
  root.style.setProperty('--bezel-light', t.bezel.light);
  if (t.bezel.screenFrame) {
    root.style.setProperty('--screen-frame', t.bezel.screenFrame);
  } else {
    root.style.removeProperty('--screen-frame');
  }
  if (t.bezel.btnPrimary) {
    root.style.setProperty('--btn', t.bezel.btnPrimary);
    root.style.setProperty('--btn-edge', t.bezel.btnPrimaryEdge ?? t.bezel.edge);
  } else {
    root.style.removeProperty('--btn');
    root.style.removeProperty('--btn-edge');
  }
}
