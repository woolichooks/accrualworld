// Meta-progression — persists across runs, even after the colonist dies.
// Stored separately from run state under `accrualworld.meta.v1`.

import type { SpeciesId } from './types';

const KEY = 'accrualworld.meta.v1';

export interface MetaState {
  schema: 1;
  // Per-topic count of correctly solved puzzles. Tier ceiling math will
  // read this in a later milestone.
  ledgerMarks: { '305': number; '330': number; '360': number };
  // Codex entries: which puzzle templates the player has seen the Why?
  // panel for at least once. Stored as ids.
  codexSeen: string[];
  // Total seeds earned via puzzles across all runs (debug / stat).
  seedsEarned: Record<SpeciesId, number>;
  // Wonders the player has witnessed at least once, by id.
  witnessedWonders: string[];
  // Threats the player has survived (or at least seen the cinematic of)
  // at least once, by threat id. Drives the codex Threats tab unlocks.
  encounteredThreats: string[];
  // Brewing recipes the player has successfully crafted at least once,
  // by recipe id. Drives the "???" vs full-name reveal on the bench.
  discoveredRecipes: string[];
}

export function newMeta(): MetaState {
  return {
    schema: 1,
    ledgerMarks: { '305': 0, '330': 0, '360': 0 },
    codexSeen: [],
    seedsEarned: {
      mint: 0, sunflower: 0, basil: 0,
      chamomile: 0, potato: 0, aloe: 0, garlic: 0, lavender: 0,
    },
    witnessedWonders: [],
    encounteredThreats: [],
    discoveredRecipes: [],
  };
}

export function loadMeta(): MetaState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newMeta();
    const data = JSON.parse(raw) as MetaState;
    if (data.schema !== 1) return newMeta();
    // Backfill missing fields defensively.
    data.ledgerMarks ??= { '305': 0, '330': 0, '360': 0 };
    data.codexSeen ??= [];
    data.seedsEarned ??= {
      mint: 0, sunflower: 0, basil: 0,
      chamomile: 0, potato: 0, aloe: 0, garlic: 0, lavender: 0,
    };
    // Backfill any missing species keys from milestone 8.
    const newSpecies: SpeciesId[] = ['chamomile', 'potato', 'aloe', 'garlic', 'lavender'];
    for (const sp of newSpecies) data.seedsEarned[sp] ??= 0;
    data.witnessedWonders ??= [];
    data.encounteredThreats ??= [];
    data.discoveredRecipes ??= [];
    return data;
  } catch {
    return newMeta();
  }
}

export function saveMeta(state: MetaState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}
