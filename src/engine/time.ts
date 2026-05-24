// Sol-time. The prototype uses a 32s real-second sol so the cycle is visible
// in a screenshot during review; the real game will lengthen this (10–20 real
// minutes per sol). See docs/design-handoff/README.md § "State management".

export const SOL_DURATION_SECONDS = 32;
export const STARTING_SOL = 47;

export type Phase = 'dawn' | 'noon' | 'dusk' | 'night';

export interface SolTime {
  phase: number; // 0..1 within the current sol
  sol: number; // integer sol counter (starts at 47)
  named: Phase;
  clock: string; // display string ("04:12" etc.)
}

// Phase boundaries match the prototype's label cross-fade timings.
const PHASE_TABLE: Array<{ until: number; named: Phase; clock: string }> = [
  { until: 0.22, named: 'dawn', clock: '04:12' },
  { until: 0.52, named: 'noon', clock: '12:08' },
  { until: 0.75, named: 'dusk', clock: '18:36' },
  { until: 1.01, named: 'night', clock: '22:48' },
];

export function getSolTime(elapsedMs: number): SolTime {
  const seconds = elapsedMs / 1000;
  const sol = STARTING_SOL + Math.floor(seconds / SOL_DURATION_SECONDS);
  const phase = (seconds % SOL_DURATION_SECONDS) / SOL_DURATION_SECONDS;
  const entry = PHASE_TABLE.find((p) => phase < p.until)!;
  return { phase, sol, named: entry.named, clock: entry.clock };
}

// Star opacity for the twinkling backdrop. Stars fade in only during night.
// Matches the @keyframes pp-night-only ramp in art-pocket.jsx.
export function starOpacity(phase: number): number {
  if (phase < 0.7 || phase > 0.95) return 0;
  if (phase < 0.78) return (phase - 0.7) / 0.08;
  if (phase > 0.9) return 1 - (phase - 0.9) / 0.05;
  return 1;
}
