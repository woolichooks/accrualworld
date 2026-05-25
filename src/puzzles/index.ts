// Registry of puzzle templates. Pick from this list when the player
// opens the Vault. Later milestones expand the catalog (305 sort,
// 360 cap-vs-expense, higher tiers).

import { Rng, randomSeed } from '../rng';
import { inv_lcnrv_t1 } from './templates/inv_lcnrv_t1';
import { inv_lcnrv_t2 } from './templates/inv_lcnrv_t2';
import { inv_lcnrv_t3 } from './templates/inv_lcnrv_t3';
import { cash_classify_t1 } from './templates/cash_classify_t1';
import { ppe_cap_expense_t1 } from './templates/ppe_cap_expense_t1';
import type { PuzzleInstance, PuzzleTemplate } from './types';

export const TEMPLATES: PuzzleTemplate[] = [
  inv_lcnrv_t1,
  inv_lcnrv_t2,
  inv_lcnrv_t3,
  cash_classify_t1,
  ppe_cap_expense_t1,
];

export function pickPuzzle(
  sol: number,
  allowedTiers: readonly number[] = [1, 2, 3],
): PuzzleInstance {
  const rng = new Rng(randomSeed());
  const pool = TEMPLATES.filter((t) => allowedTiers.includes(t.tier));
  // Safety: if filtering eliminated everything (misconfig), fall back
  // to the full list so the Vault never softlocks.
  const list = pool.length > 0 ? pool : TEMPLATES;
  const t = list[Math.floor(Math.random() * list.length)];
  return t.generate(rng, sol);
}

export function templateById(id: string): PuzzleTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export type { PuzzleInstance } from './types';
