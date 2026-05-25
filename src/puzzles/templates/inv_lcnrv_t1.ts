// ASC 330 - Lower of Cost or Net Realizable Value (Tier 1, multiple choice).
//
// Workplace-voice scenario dressed in the colony fiction: quartermaster
// flags a seed lot at month-end; the player picks the carrying value.
// Tier 1 keeps the numbers whole and well-separated so the *concept*
// (compare cost to NRV = SP - costs to sell, take the lower) is the
// point — not the arithmetic.

import { Rng } from '../../rng';
import type { PuzzleTemplate, PuzzleInstance } from '../types';

export const inv_lcnrv_t1: PuzzleTemplate = {
  id: 'inv-lcnrv-t1',
  topic: '330',
  tier: 1,

  generate(rng: Rng, sol: number): PuzzleInstance {
    // Cost in whole dollars; SP differs from cost by at least 3 either
    // direction so the lower side is obvious; CTS is small but nonzero.
    const cost = rng.int(8, 16);
    // 50/50 whether the market dropped (write-down) or held (carry at cost).
    const marketDropped = rng.next() < 0.6;
    const sp = marketDropped ? cost - rng.int(2, 4) : cost + rng.int(3, 5);
    const cts = rng.int(1, 2);
    const nrv = sp - cts;
    const correctValue = Math.min(cost, nrv);

    // Distractors are *plausible mistakes*, not random numbers.
    // 1. Used SP, forgot cost-to-sell.
    // 2. Compared wrong direction (took the higher).
    // 3. Took cost when NRV is lower, or vice versa.
    const candidates = new Set<number>([correctValue, sp, Math.max(cost, nrv), cost, nrv]);
    candidates.delete(correctValue);
    const wrong = rng.shuffle([...candidates]).slice(0, 2);
    const choices = rng.shuffle([
      { label: `$${correctValue}`, correct: true },
      ...wrong.map(v => ({ label: `$${v}`, correct: false })),
    ]);

    const writeDownLine = marketDropped
      ? `WRITE DOWN TO NRV ($${nrv}).`
      : `NO WRITE-DOWN — COST IS LOWER.`;

    return {
      templateId: inv_lcnrv_t1.id,
      topic: '330',
      tier: 1,
      header: 'ASC 330 - INVENTORY CLOSE',
      scenario:
        `SOL ${sol} - MONTH-END.\n` +
        `VEY FLAGGED A SEED LOT.\n` +
        `\n` +
        `COST       $${cost}/UNIT\n` +
        `TRADE PRICE $${sp}/UNIT\n` +
        `DECONTAM    $${cts}/UNIT`,
      question: 'CARRY EACH UNIT AT:',
      choices,
      feedbackCorrect:
        `FILED. NRV = $${sp} - $${cts} = $${nrv}. ` +
        `CARRY AT THE LOWER OF COST AND NRV. ${writeDownLine}`,
      feedbackIncorrect:
        `VEY SIDE-EYES YOU. NRV IS SELLING PRICE LESS ` +
        `COST-TO-SELL ($${sp} - $${cts} = $${nrv}), THEN ` +
        `COMPARE TO COST ($${cost}). TAKE THE LOWER.`,
      codex: {
        citation: 'ASC 330-10-35-1B',
        excerpt:
          'INVENTORY MEASURED USING ANY METHOD OTHER THAN LIFO ' +
          'OR THE RETAIL INVENTORY METHOD SHALL BE MEASURED AT ' +
          'THE LOWER OF COST AND NET REALIZABLE VALUE.',
        note:
          'NRV = ESTIMATED SELLING PRICE LESS REASONABLY ' +
          'PREDICTABLE COSTS OF COMPLETION, DISPOSAL, AND ' +
          'TRANSPORTATION. WRITE-DOWNS HIT THE PERIOD INCURRED ' +
          'AND ARE NOT REVERSED IF NRV LATER RECOVERS.',
      },
      reward: {
        seeds: { mint: 2, sunflower: 1, basil: 1 },
      },
    };
  },
};
