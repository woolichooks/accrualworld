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

export interface PuzzleInstance {
  templateId: string;
  topic: Topic;
  tier: Tier;
  // Header bar text, e.g. "ASC 330 - MONTH-END CLOSE".
  header: string;
  // Pre-formatted scenario lines (no wrapping yet; PuzzleScene wraps).
  scenario: string;
  // The single line ask under the scenario.
  question: string;
  // For now we ship multiple-choice only; dial/sort come later.
  choices: Choice[];
  // Feedback after the player answers.
  feedbackCorrect: string;
  feedbackIncorrect: string;
  // Codex panel (the "Why?" reveal).
  codex: CodexRef;
  // What the player gets for a correct answer.
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
  generate(rng: import('../rng').Rng, sol: number): PuzzleInstance;
}
