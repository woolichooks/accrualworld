// ASC 305 - Cash and Cash Equivalents (Tier 1, multiple choice).
// Workplace scenario: CFO Hale wants line items tagged for the
// balance sheet. The trap is the 3-month rule for cash equivalents
// (original maturity at acquisition) and the restricted-cash bucket.

import { Rng } from '../../rng';
import type { PuzzleTemplate, PuzzleInstance, Choice } from '../types';

type Tag = 'CASH' | 'CASH EQUIVALENT' | 'RESTRICTED CASH' | 'NEITHER';
const TAGS: Tag[] = ['CASH', 'CASH EQUIVALENT', 'RESTRICTED CASH', 'NEITHER'];

interface Item {
  desc: string;
  answer: Tag;
  rationale: string; // appended to feedback
}

const POOL: Item[] = [
  {
    desc: 'OPERATING CREDITS IN THE COLONY BANK ACCOUNT.',
    answer: 'CASH',
    rationale: 'DEMAND DEPOSITS ARE CASH.',
  },
  {
    desc: '60-DAY FEDERATION T-BILLS, BOUGHT 20 SOLS AGO.',
    answer: 'CASH EQUIVALENT',
    rationale: 'ORIGINAL MATURITY UNDER 3 MONTHS.',
  },
  {
    desc: '6-MONTH FUEL-BOND CD PURCHASED LAST WEEK.',
    answer: 'NEITHER',
    rationale: 'ORIGINAL MATURITY EXCEEDS 3 MONTHS.',
  },
  {
    desc: '50K CREDITS HELD IN ESCROW FOR ARBITRATION.',
    answer: 'RESTRICTED CASH',
    rationale: 'USE IS LEGALLY CONTRAINED.',
  },
  {
    desc: 'PETTY CASH DRAWER IN THE BIODOME OFFICE.',
    answer: 'CASH',
    rationale: 'CURRENCY ON HAND IS CASH.',
  },
  {
    desc: 'BOND SINKING FUND, RESERVED FOR DEBT REPAYMENT.',
    answer: 'RESTRICTED CASH',
    rationale: 'COMMITTED TO A SPECIFIC PURPOSE.',
  },
  {
    desc: '18-MONTH OUTPOST BOND PURCHASED YESTERDAY.',
    answer: 'NEITHER',
    rationale: 'TOO LONG TO QUALIFY AS AN EQUIVALENT.',
  },
];

export const cash_classify_t1: PuzzleTemplate = {
  id: 'cash-classify-t1',
  topic: '305',
  tier: 1,
  displayName: 'ASC 305 - CASH',
  blurb: 'CASH / EQUIVALENT / RESTRICTED',

  generate(rng: Rng, sol: number): PuzzleInstance {
    const item = rng.pick(POOL);
    const choices: Choice[] = rng.shuffle(
      TAGS.map((t) => ({ label: t, correct: t === item.answer })),
    );
    return {
      templateId: cash_classify_t1.id,
      topic: '305',
      tier: 1,
      header: 'ASC 305 - TREASURY RECON',
      scenario:
        `SOL ${sol} - TREASURY RECON.\n` +
        `CFO HALE WANTS THIS TAGGED.\n` +
        `\n` +
        item.desc,
      question: 'TAG FOR THE BALANCE SHEET:',
      choices,
      feedbackCorrect: `FILED AS ${item.answer}. ${item.rationale}`,
      feedbackIncorrect:
        `HALE FROWNS. CORRECT TAG IS ${item.answer}. ` +
        item.rationale,
      codex: {
        citation: 'ASC 305-10 / ASC 230-10-20',
        excerpt:
          'CASH EQUIVALENTS ARE SHORT-TERM, HIGHLY LIQUID ' +
          'INVESTMENTS WITH ORIGINAL MATURITIES OF THREE MONTHS ' +
          'OR LESS AT THE DATE OF ACQUISITION.',
        note:
          'RESTRICTED CASH IS REPORTED SEPARATELY FROM CASH AND ' +
          'CASH EQUIVALENTS. ORIGINAL MATURITY IS MEASURED FROM ' +
          'WHEN THE INSTRUMENT WAS ACQUIRED, NOT REMAINING TIME.',
      },
      reward: { seeds: { mint: 1, sunflower: 2, basil: 1 } },
    };
  },
};
