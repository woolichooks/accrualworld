// ASC 330 - LCNRV (Tier 3, multi-step). The player computes ending
// inventory under FIFO and then a separate write-down to NRV. Two
// chained questions; both use multiple choice so the focus stays on
// reasoning rather than dial input.

import { Rng } from '../../rng';
import type { PuzzleTemplate, PuzzleInstance, Choice } from '../types';

export const inv_lcnrv_t3: PuzzleTemplate = {
  id: 'inv-lcnrv-t3',
  topic: '330',
  tier: 3,
  displayName: 'ASC 330 - LCNRV (T3)',
  blurb: 'FIFO ENDING + WRITE-DOWN',
  staticCodex: {
    citation: 'ASC 330-10-30 / 330-10-35',
    excerpt:
      'COST FLOW (FIFO/LIFO/AVG) ASSIGNS HISTORICAL COSTS TO ' +
      'ENDING INVENTORY. THE RESULTING CARRYING VALUE IS THEN ' +
      'TESTED AGAINST NRV.',
    note:
      'A WRONG COST FLOW SETS UP THE WRONG NUMBER FOR THE ' +
      'NRV TEST — BOTH STEPS MATTER.',
  },

  generate(rng: Rng, sol: number): PuzzleInstance {
    // Three lots, 10 units each, ascending costs.
    const costs = [rng.int(8, 11), 0, 0];
    costs[1] = costs[0] + rng.int(1, 3);
    costs[2] = costs[1] + rng.int(1, 3);
    const totalUnits = 30;
    const sold = rng.int(16, 22); // 16-22 of 30
    const remaining = totalUnits - sold;
    // Under FIFO, sold consumes from earliest lots first.
    // Remaining units are from the LAST lots.
    // Walk lots back to compute remaining inventory cost.
    let endingCost = 0;
    let need = remaining;
    for (let i = 2; i >= 0 && need > 0; i--) {
      const take = Math.min(10, need);
      endingCost += take * costs[i];
      need -= take;
    }
    const nrvPerUnit = Math.min(...costs) + rng.int(0, 1); // typically below highest cost
    const nrvCap = remaining * nrvPerUnit;
    const writeDown = Math.max(0, endingCost - nrvCap);

    // Build MC choices around each answer with derived distractors.
    const endingChoices: Choice[] = rng.shuffle([
      { label: `$${endingCost}`, correct: true },
      { label: `$${remaining * costs[0]}`, correct: false }, // FIFO->LIFO mistake
      { label: `$${remaining * costs[1]}`, correct: false }, // used middle lot only
      { label: `$${remaining * costs[2] + 5}`, correct: false },
    ]).slice(0, 3);
    // Ensure correct is included
    if (!endingChoices.some(c => c.correct)) endingChoices[0] = { label: `$${endingCost}`, correct: true };

    const writeDownChoices: Choice[] = rng.shuffle([
      { label: `$${writeDown}`, correct: true },
      { label: '$0', correct: writeDown === 0 ? true : false },
      { label: `$${endingCost}`, correct: false },
      { label: `$${nrvCap}`, correct: false },
    ]).slice(0, 3);
    if (!writeDownChoices.some(c => c.correct)) writeDownChoices[0] = { label: `$${writeDown}`, correct: true };

    return {
      templateId: inv_lcnrv_t3.id,
      topic: '330',
      tier: 3,
      header: 'ASC 330 - YEAR-END',
      scenario:
        `SOL ${sol} - ANNUAL CLOSE.\n` +
        `THREE LOTS, 10 UNITS EACH:\n` +
        `LOT A $${costs[0]}  LOT B $${costs[1]}  LOT C $${costs[2]}\n` +
        `SOLD ${sold} UNITS (FIFO).\n` +
        `YEAR-END NRV $${nrvPerUnit}/UNIT.`,
      questions: [
        { kind: 'mc', prompt: 'FIFO ENDING INVENTORY:', choices: endingChoices },
        { kind: 'mc', prompt: 'WRITE-DOWN TO NRV:',     choices: writeDownChoices },
      ],
      feedbackCorrect:
        `ENDING (FIFO) = ${remaining} U FROM LATEST LOTS = ` +
        `$${endingCost}. NRV CAP = ${remaining} x $${nrvPerUnit} = ` +
        `$${nrvCap}. WRITE-DOWN = $${writeDown}.`,
      feedbackIncorrect:
        `FIFO LEAVES LATER LOTS ON HAND. COMPUTE BOOK ` +
        `VALUE = ${remaining} U FROM LATEST COSTS, THEN CAP AT ` +
        `${remaining} x $${nrvPerUnit} = $${nrvCap}.`,
      codex: {
        citation: 'ASC 330-10-30 / 330-10-35',
        excerpt:
          'COSTS ASSIGNED TO INVENTORY DEPEND ON THE COST-FLOW ' +
          'ASSUMPTION (FIFO, AVG). THE RESULTING CARRYING VALUE ' +
          'IS THEN TESTED AGAINST NRV; ANY EXCESS IS WRITTEN ' +
          'DOWN IN THE PERIOD.',
        note:
          'BOTH STEPS MATTER: A WRONG COST FLOW SETS UP THE WRONG ' +
          'NUMBER FOR THE NRV TEST.',
      },
      reward: { seeds: { mint: 2, sunflower: 2, basil: 2, potato: 1, aloe: 1 } },
    };
  },
};
