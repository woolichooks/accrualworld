// Brewing recipes. Each is a multiset of ingredient species; the
// player slots up to 3 leaves into the bench and the recipe with the
// matching count distribution fires.
//
// Effects apply immediately on brew (no stored-potion inventory yet —
// that arrives with threats in milestone 6). The recipe id is logged
// to meta.discoveredRecipes so future encounters reveal the name and
// effect instead of "???".

import type { RunState, SpeciesId } from './types';

export type RecipeId = 'dew_tonic' | 'mint_calm' | 'tri_sap';

export interface Recipe {
  id: RecipeId;
  name: string;                // "DEW TONIC"
  effect: string;              // human-readable, used by the bench UI
  ingredients: Partial<Record<SpeciesId, number>>;
  apply(state: RunState): string; // returns toast text
}

export const RECIPES: Recipe[] = [
  {
    id: 'dew_tonic',
    name: 'DEW TONIC',
    effect: '+5 WATER',
    ingredients: { sunflower: 2 },
    apply: (s) => { s.inventory.water += 5; return '+5 WATER'; },
  },
  {
    id: 'mint_calm',
    name: 'MINT CALM',
    effect: '+1 OF EACH SEED',
    ingredients: { mint: 2 },
    apply: (s) => {
      s.inventory.seeds.mint += 1;
      s.inventory.seeds.sunflower += 1;
      s.inventory.seeds.basil += 1;
      return '+1 EACH SEED';
    },
  },
  {
    id: 'tri_sap',
    name: 'TRI-SAP',
    effect: '+3 WATER, +1 RAND SEED',
    ingredients: { mint: 1, sunflower: 1, basil: 1 },
    apply: (s) => {
      s.inventory.water += 3;
      const opts: SpeciesId[] = ['mint', 'sunflower', 'basil'];
      const sp = opts[Math.floor(Math.random() * opts.length)];
      s.inventory.seeds[sp] += 1;
      return `+3 H2O, +1 ${sp.toUpperCase()}`;
    },
  },
];

// Find the recipe matching the species slotted into the bench.
// `slots` is a length-3 array of SpeciesId | null.
export function matchRecipe(slots: (SpeciesId | null)[]): Recipe | null {
  const counts: Partial<Record<SpeciesId, number>> = {};
  for (const s of slots) {
    if (!s) continue;
    counts[s] = (counts[s] ?? 0) + 1;
  }
  for (const r of RECIPES) {
    const need = r.ingredients;
    const needKeys = Object.keys(need) as SpeciesId[];
    const haveKeys = Object.keys(counts) as SpeciesId[];
    if (needKeys.length !== haveKeys.length) continue;
    let ok = true;
    for (const k of needKeys) {
      if (counts[k] !== need[k]) { ok = false; break; }
    }
    if (ok) return r;
  }
  return null;
}
