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
    desc: 'OPERATING FUNDS IN THE COLONY BANK ACCOUNT.',
    answer: 'CASH',
    rationale: 'A REGULAR BANK ACCOUNT IS CASH.',
  },
  {
    desc: 'CHECKING ACCOUNT, AVAILABLE ANY TIME.',
    answer: 'CASH',
    rationale: 'SPENDABLE ON DEMAND = CASH.',
  },
  {
    desc: 'PETTY CASH DRAWER IN THE BIODOME OFFICE.',
    answer: 'CASH',
    rationale: 'PHYSICAL CURRENCY ON HAND IS CASH.',
  },
  {
    desc: '60-DAY TREASURY NOTE. BOUGHT 20 SOLS AGO.',
    answer: 'CASH EQUIVALENT',
    rationale: 'BOUGHT WITH 60 DAYS LEFT < 3 MONTHS.',
  },
  {
    desc: '30-DAY MONEY MARKET FUND, BOUGHT TODAY.',
    answer: 'CASH EQUIVALENT',
    rationale: 'BOUGHT WITH 30 DAYS LEFT < 3 MONTHS.',
  },
  {
    desc: '6-MONTH SAVINGS BOND, BOUGHT LAST WEEK.',
    answer: 'NEITHER',
    rationale: 'BOUGHT WITH 6 MONTHS LEFT - TOO LONG.',
  },
  {
    desc: '18-MONTH OUTPOST BOND, BOUGHT YESTERDAY.',
    answer: 'NEITHER',
    rationale: 'WAY MORE THAN 3 MONTHS LEFT.',
  },
  {
    desc: '50K CREDITS LOCKED FOR A PENDING LAWSUIT.',
    answer: 'RESTRICTED CASH',
    rationale: 'YOU CANT SPEND IT - ITS RESTRICTED.',
  },
  {
    desc: 'FUNDS HELD ONLY FOR DEBT REPAYMENT.',
    answer: 'RESTRICTED CASH',
    rationale: 'EARMARKED FOR ONE PURPOSE = RESTRICTED.',
  },
];

export const cash_classify_t1: PuzzleTemplate = {
  id: 'cash-classify-t1',
  topic: '305',
  tier: 1,
  displayName: 'ASC 305 - CASH (T1)',
  blurb: 'CASH / EQUIVALENT / RESTRICTED',
  hint:
    'SPENDABLE NOW = CASH. LIQUID UNDER 3 MONTHS = EQUIVALENT. ' +
    'LOCKED FOR ONE PURPOSE = RESTRICTED. ELSE NEITHER.',
  staticCodex: {
    citation: 'ASC 305-10 / ASC 230-10-20',
    excerpt:
      'CASH EQUIVALENTS ARE SHORT-TERM, HIGHLY LIQUID INVESTMENTS ' +
      'WITH ORIGINAL MATURITIES OF THREE MONTHS OR LESS AT THE ' +
      'DATE OF ACQUISITION.',
    note:
      'ORIGINAL MATURITY IS MEASURED FROM ACQUISITION, NOT TIME ' +
      'REMAINING. RESTRICTED CASH IS REPORTED SEPARATELY.',
  },

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
        `CFO HALE WANTS THIS CLASSIFIED.\n` +
        `\n` +
        item.desc,
      questions: [{ kind: 'mc', prompt: 'WHICH CATEGORY?', choices }],
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
      hint: cash_classify_t1.hint,
    };
  },
};
