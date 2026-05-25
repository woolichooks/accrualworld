// Registry of puzzle templates. Pick from this list when the player
// opens the Vault. Later milestones expand the catalog (305 sort,
// 360 cap-vs-expense, higher tiers).

import { Rng, randomSeed } from '../rng';
import { inv_lcnrv_t1 } from './templates/inv_lcnrv_t1';
import type { PuzzleInstance, PuzzleTemplate } from './types';

const TEMPLATES: PuzzleTemplate[] = [
  inv_lcnrv_t1,
];

export function pickPuzzle(sol: number): PuzzleInstance {
  const rng = new Rng(randomSeed());
  const t = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
  return t.generate(rng, sol);
}

export type { PuzzleInstance } from './types';
