// ASC 360 - PP&E: capitalize vs. expense (Tier 1, multiple choice).
// Workplace scenario: controller Yumi forwards an engineering memo;
// the player decides whether the cost extends life/capacity
// (capitalize and depreciate) or merely maintains it (expense).

import { Rng } from '../../rng';
import type { PuzzleTemplate, PuzzleInstance, Choice } from '../types';

type Tag = 'CAPITALIZE' | 'EXPENSE';

interface Item {
  desc: string;
  answer: Tag;
  rationale: string;
}

const POOL: Item[] = [
  {
    desc: 'PATCH THE EXISTING AIRLOCK SCRUBBER, $4200.',
    answer: 'EXPENSE',
    rationale: 'RESTORES EXISTING SERVICE POTENTIAL.',
  },
  {
    desc: 'REPLACE SCRUBBER WITH A 12-YEAR UNIT, $18K.',
    answer: 'CAPITALIZE',
    rationale: 'EXTENDS USEFUL LIFE AND CAPACITY.',
  },
  {
    desc: 'ROUTINE LUBRICATION ON THE CONVEYOR BELT.',
    answer: 'EXPENSE',
    rationale: 'MAINTAINS, DOES NOT IMPROVE.',
  },
  {
    desc: 'NEW SOLAR ARRAY, RATED FOR 15 YEARS, $50K.',
    answer: 'CAPITALIZE',
    rationale: 'WHOLLY NEW LONG-LIVED ASSET.',
  },
  {
    desc: 'TOUCH-UP PAINT ON THE DOME HULL.',
    answer: 'EXPENSE',
    rationale: 'COSMETIC MAINTENANCE.',
  },
  {
    desc: 'NEW 20-YEAR ROOF ON BIODOME 2, $32K.',
    answer: 'CAPITALIZE',
    rationale: 'BETTERMENT WITH LONG LIFE.',
  },
  {
    desc: 'ANNUAL FILTER CLEAN, ALL SCRUBBERS.',
    answer: 'EXPENSE',
    rationale: 'ROUTINE MAINTENANCE.',
  },
  {
    desc: 'ADD SECOND AIRLOCK DOOR FOR REDUNDANCY.',
    answer: 'CAPITALIZE',
    rationale: 'ADDS CAPACITY / SAFETY MARGIN.',
  },
];

export const ppe_cap_expense_t1: PuzzleTemplate = {
  id: 'ppe-cap-expense-t1',
  topic: '360',
  tier: 1,
  displayName: 'ASC 360 - PP&E',
  blurb: 'CAPITALIZE VS EXPENSE',

  generate(rng: Rng, sol: number): PuzzleInstance {
    const item = rng.pick(POOL);
    const choices: Choice[] = rng.shuffle(
      (['CAPITALIZE', 'EXPENSE'] as Tag[]).map((t) => ({
        label: t,
        correct: t === item.answer,
      })),
    );
    return {
      templateId: ppe_cap_expense_t1.id,
      topic: '360',
      tier: 1,
      header: 'ASC 360 - ENG. MEMO',
      scenario:
        `SOL ${sol} - ENGINEERING MEMO.\n` +
        `YUMI ASKS HOW TO POST THIS.\n` +
        `\n` +
        item.desc,
      question: 'POST AS:',
      choices,
      feedbackCorrect: `${item.answer}. ${item.rationale}`,
      feedbackIncorrect:
        `YUMI MARKS IT UP. CORRECT TREATMENT IS ` +
        `${item.answer}. ${item.rationale}`,
      codex: {
        citation: 'ASC 360-10-30 / 360-10-35',
        excerpt:
          'COSTS THAT EXTEND AN ASSET\'S USEFUL LIFE OR INCREASE ' +
          'CAPACITY/EFFICIENCY ARE CAPITALIZED AND DEPRECIATED. ' +
          'ROUTINE REPAIRS THAT MAINTAIN EXISTING SERVICE ARE ' +
          'EXPENSED AS INCURRED.',
        note:
          'TEST: DOES THE COST MAKE THE ASSET BETTER OR LONGER-LIVED ' +
          '(CAPITALIZE), OR JUST KEEP IT RUNNING (EXPENSE)?',
      },
      reward: { seeds: { mint: 1, sunflower: 1, basil: 2 } },
    };
  },
};
