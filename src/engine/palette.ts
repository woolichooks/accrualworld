// Canonical Pocket Garden palette (Dawn variant). Hex values are the source of
// truth — see docs/design-handoff/README.md § "Palette — G1 Dawn".

export type Role =
  | 'ink'
  | 'primary'
  | 'mid'
  | 'light'
  | 'cream'
  | 'accent'
  | 'warm'
  | 'grass'
  | 'grassD'
  | 'soil'
  | 'soilL'
  | 'water';

export type Palette = Record<Role, number>;

export const DAWN: Palette = {
  ink: 0x1a0a3e,
  primary: 0x5e3aa8,
  mid: 0x8a8ee0,
  light: 0xc5d4ff,
  cream: 0xf4e9c8,
  accent: 0xf5cf5e,
  warm: 0xe07598,
  grass: 0xa8c862,
  grassD: 0x6e9e44,
  soil: 0x3a2570,
  soilL: 0x5a3e9e,
  water: 0x8acfff,
};

export const SCREEN_BG = 0x10052e;

// ASCII char → palette role. The same sprite definitions render correctly under
// any palette variant (Dawn / Dusk / Amber).
export const ROLE_MAP: Record<string, Role> = {
  k: 'ink',
  o: 'ink',
  p: 'primary',
  b: 'mid',
  l: 'light',
  c: 'cream',
  y: 'accent',
  r: 'warm',
  g: 'grass',
  G: 'grassD',
  s: 'soil',
  S: 'soilL',
  w: 'water',
};

// Day/night colour stops (Dawn). Sky tint interpolates along these as a
// function of sol-phase (0..1).
export const SKY_STOPS: Array<{ t: number; color: number }> = [
  { t: 0.0, color: 0x4a3a7e }, // dawn
  { t: 0.12, color: 0x3a4a9e }, // morn
  { t: 0.28, color: 0x5e7ae0 }, // noon
  { t: 0.45, color: 0xc08a8a }, // aft
  { t: 0.6, color: 0x6a3a8a }, // dusk
  { t: 0.75, color: 0x1a0a3e }, // night start (held)
  { t: 0.95, color: 0x1a0a3e }, // night end
  { t: 1.0, color: 0x4a3a7e }, // wrap → dawn
];

export const GROUND_DAY = 0x5e3aa8;
export const GROUND_NIGHT = 0x2a1a5e;

export const SUN_COLOR = 0xf5cf5e;
export const SUN2_COLOR = 0xe07598;
export const MOON_COLOR = 0xc5d4ff;

export function lerp(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return ((r << 16) | (g << 8) | bl) >>> 0;
}

export function sampleStops(stops: Array<{ t: number; color: number }>, t: number): number {
  const wrapped = ((t % 1) + 1) % 1;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (wrapped >= a.t && wrapped <= b.t) {
      const span = b.t - a.t;
      const localT = span === 0 ? 0 : (wrapped - a.t) / span;
      return lerp(a.color, b.color, localT);
    }
  }
  return stops[stops.length - 1].color;
}
