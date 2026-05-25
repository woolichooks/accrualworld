// ASC 330 - Lower of Cost or Net Realizable Value (Tier 2, dial entry).
//
// Same concept as Tier 1, but now numbers carry cents and the player
// types the carrying value into a 4-digit numeric dial. Internally
// stored as cents so the comparison stays integer-clean.

import { Rng } from '../../rng';
import type { PuzzleTemplate, PuzzleInstance } from '../types';

export const inv_lcnrv_t2: PuzzleTemplate = {
  id: 'inv-lcnrv-t2',
  topic: '330',
  tier: 2,
  displayName: 'ASC 330 - LCNRV (T2)',
  blurb: 'CENTS-LEVEL CALC, DIAL ENTRY',
  staticCodex: {
    citation: 'ASC 330-10-35-1B',
    excerpt:
      'CARRY INVENTORY AT THE LOWER OF COST AND NRV. NRV = SP - ' +
      'PREDICTABLE COSTS OF COMPLETION, DISPOSAL, TRANSPORTATION.',
    note:
      'TIER 2 ADDS DECIMALS — THE RULE IS THE SAME; THE ARITHMETIC ' +
      'JUST CARRIES CENTS.',
  },

  generate(rng: Rng, sol: number): PuzzleInstance {
    // All amounts in cents.
    const cost = rng.int(800, 2500); // $8.00 - $25.00
    const marketDropped = rng.next() < 0.6;
    const sp = marketDropped
      ? cost - rng.int(100, 350)
      : cost + rng.int(200, 500);
    const cts = rng.int(10, 90); // $0.10 - $0.90
    const nrv = sp - cts;
    const correct = Math.min(cost, nrv);

    const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const writeDownLine = marketDropped
      ? `WRITE-DOWN OF ${fmt(cost - nrv)} PER UNIT.`
      : `NO WRITE-DOWN; COST IS LOWER.`;

    return {
      templateId: inv_lcnrv_t2.id,
      topic: '330',
      tier: 2,
      header: 'ASC 330 - WRITE-DOWN',
      scenario:
        `SOL ${sol} - MONTH-END.\n` +
        `WIDGET-A: 400 UNITS ON HAND.\n` +
        `\n` +
        `COST        ${fmt(cost)}/UNIT\n` +
        `MARKET PR.  ${fmt(sp)}/UNIT\n` +
        `SHIP+HANDLE ${fmt(cts)}/UNIT`,
      questions: [
        {
          kind: 'dial',
          prompt: 'CARRY EACH UNIT AT:',
          answer: correct,
          tolerance: 5, // ±$0.05
          digits: 4,
          decimals: 2,
          prefix: '$',
        },
      ],
      feedbackCorrect:
        `FILED. NRV = ${fmt(sp)} - ${fmt(cts)} = ${fmt(nrv)}. ` +
        `${writeDownLine}`,
      feedbackIncorrect:
        `NRV IS SELLING PRICE LESS COST-TO-SELL ` +
        `(${fmt(sp)} - ${fmt(cts)} = ${fmt(nrv)}), THEN ` +
        `COMPARE TO COST (${fmt(cost)}). TAKE THE LOWER.`,
      codex: {
        citation: 'ASC 330-10-35-1B',
        excerpt:
          'INVENTORY MEASURED USING ANY METHOD OTHER THAN LIFO ' +
          'OR THE RETAIL INVENTORY METHOD SHALL BE MEASURED AT ' +
          'THE LOWER OF COST AND NET REALIZABLE VALUE.',
        note:
          'WRITE-DOWNS HIT THE PERIOD INCURRED AND ARE NOT REVERSED ' +
          'IF NRV LATER RECOVERS.',
      },
      reward: { seeds: { mint: 1, sunflower: 1, basil: 1, chamomile: 1 } },
    };
  },
};
