// Brewing recipes. Each is a multiset of ingredient species; the
// player slots up to 3 leaves into the bench and the recipe with the
// matching count distribution fires.
//
// Effects apply immediately on brew (no stored-potion inventory yet —
// that arrives with threats in milestone 6). The recipe id is logged
// to meta.discoveredRecipes so future encounters reveal the name and
// effect instead of "???".

import { STAT_MAX, type RunState, type SpeciesId } from './types';

export type RecipeId =
  | 'dew_tonic'
  | 'mint_calm'
  | 'tri_sap'
  | 'iron_salve'
  | 'aether_vapor'
  | 'volt_brew';

const restore = (cur: number, amt: number) => Math.min(STAT_MAX, cur + amt);

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
  // Defensive recipes — restore shelter stats. Effects clamp at STAT_MAX
  // so overbrewing wastes leaves; the player has to time it.
  {
    id: 'iron_salve',
    name: 'IRON SALVE',
    effect: '+4 HULL',
    ingredients: { basil: 3 },
    apply: (s) => { s.shelter.hull = restore(s.shelter.hull, 4); return '+4 HULL'; },
  },
  {
    id: 'aether_vapor',
    name: 'AETHER VAPOR',
    effect: '+4 OXYGEN',
    ingredients: { sunflower: 1, mint: 2 },
    apply: (s) => { s.shelter.oxygen = restore(s.shelter.oxygen, 4); return '+4 OXYGEN'; },
  },
  {
    id: 'volt_brew',
    name: 'VOLT BREW',
    effect: '+4 POWER',
    ingredients: { sunflower: 2, basil: 1 },
    apply: (s) => { s.shelter.power = restore(s.shelter.power, 4); return '+4 POWER'; },
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
