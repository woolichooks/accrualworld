import type { PlantId } from '../sprites/plants';

export type Stage = 'empty' | 'puff' | 'sprout' | 'young' | 'bloom';

export interface Bed {
  index: number;
  x: number; // logical-pixel position of the plant sprite (top-left)
  y: number;
  swayVariant: 0 | 1 | 2;
  species: PlantId | null;
  /** Real-time milliseconds when this seed was planted, or null if empty. */
  plantedAtMs: number | null;
}

// Stage boundaries in real seconds after planting. Tuned for snappy testing —
// in a real production build these should be sol-fractions (e.g. PUFF for the
// first hour of a sol, BLOOM after one full sol passes).
export const STAGE_PUFF_END = 1.5;
export const STAGE_SPROUT_END = 8;
export const STAGE_YOUNG_END = 18;

export function computeStage(bed: Bed, nowMs: number): Stage {
  if (bed.species === null || bed.plantedAtMs === null) return 'empty';
  const elapsedSec = (nowMs - bed.plantedAtMs) / 1000;
  if (elapsedSec < STAGE_PUFF_END) return 'puff';
  if (elapsedSec < STAGE_SPROUT_END) return 'sprout';
  if (elapsedSec < STAGE_YOUNG_END) return 'young';
  return 'bloom';
}

// Canonical bed roster — matches the layout in docs/design-handoff/src/art-pocket.jsx.
// Two rows × five beds. Sway variants are staggered so no two adjacent beds
// pulse at the same tempo.
export const BED_LAYOUT: Array<{
  x: number;
  y: number;
  swayVariant: 0 | 1 | 2;
  initialSpecies: PlantId;
}> = [
  { x: 6, y: 56, swayVariant: 0, initialSpecies: 'bell' },
  { x: 42, y: 56, swayVariant: 1, initialSpecies: 'star' },
  { x: 78, y: 56, swayVariant: 2, initialSpecies: 'fern' },
  { x: 114, y: 56, swayVariant: 0, initialSpecies: 'thorn' },
  { x: 150, y: 56, swayVariant: 1, initialSpecies: 'dream' },
  { x: 6, y: 80, swayVariant: 1, initialSpecies: 'pod' },
  { x: 42, y: 80, swayVariant: 0, initialSpecies: 'crys' },
  { x: 78, y: 80, swayVariant: 2, initialSpecies: 'rose' },
  { x: 114, y: 80, swayVariant: 0, initialSpecies: 'cap' },
  { x: 150, y: 80, swayVariant: 1, initialSpecies: 'orb' },
];

// In-fiction species names used for dialogue lines.
export const SPECIES_LABEL: Record<PlantId, string> = {
  bell: 'bell-bloom',
  star: 'star-bloom',
  crys: 'glass-moss',
  dream: 'dreamer',
  rose: 'thistle-rose',
  fern: 'hum-fern',
  pod: 'moonpod',
  thorn: 'prism-thorn',
  cap: 'jelly-cap',
  orb: 'orb-vine',
};
