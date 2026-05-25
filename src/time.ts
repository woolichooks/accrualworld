// Sol-cycle phases and palette selection.
//
// Each Sol runs day -> dusk -> night -> dawn -> day. Dusk/dawn use the
// warm 'ember' palette as a short transition; day is 'acrid', night is
// 'indigo'. Durations are tuned short so the cycle is testable within
// minutes; tune up later for the released experience.

import type { PaletteName } from './palette';

export type Phase = 'day' | 'dusk' | 'night' | 'dawn';

export const PHASE_SECONDS: Record<Phase, number> = {
  day:   45,
  dusk:   4,
  night: 25,
  dawn:   4,
};

export const NEXT_PHASE: Record<Phase, Phase> = {
  day: 'dusk',
  dusk: 'night',
  night: 'dawn',
  dawn: 'day',
};

export function paletteForPhase(phase: Phase): PaletteName {
  switch (phase) {
    case 'day':   return 'acrid';
    case 'dusk':  return 'ember';
    case 'night': return 'indigo';
    case 'dawn':  return 'ember';
  }
}

export function isNight(phase: Phase): boolean {
  return phase === 'night';
}

export function phaseLabel(phase: Phase): string {
  return phase.toUpperCase();
}
