// Shape of a generated puzzle instance handed to the PuzzleScene.
// Templates produce these via `generate(rng)` so numbers reshuffle
// every encounter while the underlying concept stays identical.

import type { SpeciesId } from '../types';

export type Topic = '305' | '330' | '360';
export type Tier = 1 | 2 | 3;

export interface CodexRef {
  citation: string;     // e.g. "ASC 330-10-35-1B"
  excerpt: string;      // short paragraph quote
  note?: string;        // plain-English practical note
}

export interface Choice {
  label: string;
  correct: boolean;
}

// A single ask inside a puzzle. Tier 1/2 puzzles have exactly one;
// Tier 3 multi-step puzzles chain several. Each step is either a
// multiple-choice or a numeric-dial input.
export type Question =
  | {
      kind: 'mc';
      prompt: string;
      choices: Choice[];
    }
  | {
      kind: 'dial';
      prompt: string;
      // Stored as the smallest integer unit the puzzle uses (cents,
      // whole dollars, etc.) so float math doesn't bite. The UI
      // formats per the `digits` and `decimals` fields.
      answer: number;
      tolerance: number;     // +/- in same unit
      digits: number;        // total dial digits (e.g. 4 for 0..9999)
      decimals: number;      // how many of the digits are decimal
      prefix?: string;       // e.g. '$'
    };

export interface PuzzleInstance {
  templateId: string;
  topic: Topic;
  tier: Tier;
  // Header bar text, e.g. "ASC 330 - MONTH-END CLOSE".
  header: string;
  // Pre-formatted scenario lines (no wrapping yet; PuzzleScene wraps).
  scenario: string;
  // Ordered list of asks. Tier 1/2 use length 1.
  questions: Question[];
  // Feedback after the player completes the whole chain.
  feedbackCorrect: string;
  feedbackIncorrect: string;
  // Codex panel (the "Why?" reveal).
  codex: CodexRef;
  // What the player gets for a correct answer (all questions correct).
  reward: SeedReward;
}

export interface SeedReward {
  // Map of species -> count. Granted once on first correct answer.
  seeds: Partial<Record<SpeciesId, number>>;
}

export interface PuzzleTemplate {
  id: string;
  topic: Topic;
  tier: Tier;
  // Static metadata used by the Codex screen so we don't have to
  // generate a puzzle instance just to label one in a list.
  displayName: string;   // "ASC 330 - INVENTORY"
  blurb: string;         // "LOWER OF COST OR NRV"
  // Static codex content shown in the Codex drill-in. Mirrors what
  // the dynamic instance.codex returns, but generic enough to be
  // shown without rolling a puzzle.
  staticCodex: CodexRef;
  generate(rng: import('../rng').Rng, sol: number): PuzzleInstance;
}
