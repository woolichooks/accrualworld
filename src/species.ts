// Per-species data + sprite drawing. Sprites are drawn procedurally
// against the active 4-color palette so they recolor for free with the
// palette system. All sprites fit inside an 18x18 tile with a 1px margin.

import { STAT_MAX, type SpeciesId, type GrowthStage, type RunState } from './types';
import type { Palette } from './palette';

// Alien mutations. Each species has one. Rolled by wonders/threats on
// each currently-growing plant. A mutated plant still yields a leaf on
// harvest plus the mutation's stat bonus.
export interface Mutation {
  id: string;
  name: string;           // display label
  harvestBonus: string;   // toast-friendly summary
  apply(state: RunState): void;
}

const clamp = (n: number) => Math.min(STAT_MAX, n);

export const MUTATIONS: Record<SpeciesId, Mutation> = {
  mint: {
    id: 'palemint',
    name: 'PALEMINT',
    harvestBonus: '+2 OXY',
    apply: (s) => { s.shelter.oxygen = clamp(s.shelter.oxygen + 2); },
  },
  sunflower: {
    id: 'lumenroot',
    name: 'LUMENROOT',
    harvestBonus: '+2 PWR',
    apply: (s) => { s.shelter.power = clamp(s.shelter.power + 2); },
  },
  basil: {
    id: 'ironleaf',
    name: 'IRONLEAF',
    harvestBonus: '+2 HUL',
    apply: (s) => { s.shelter.hull = clamp(s.shelter.hull + 2); },
  },
  // Tier 2 mutations — bigger single-stat restores. The plants
  // themselves take longer to mature (see SPECIES_DATA), so the
  // higher payoff is offset by a longer growth window.
  chamomile: {
    id: 'glassbloom',
    name: 'GLASSBLOOM',
    harvestBonus: '+3 HUL',
    apply: (s) => { s.shelter.hull = clamp(s.shelter.hull + 3); },
  },
  potato: {
    id: 'emberspud',
    name: 'EMBERSPUD',
    harvestBonus: '+3 PWR',
    apply: (s) => { s.shelter.power = clamp(s.shelter.power + 3); },
  },
  aloe: {
    id: 'soothevine',
    name: 'SOOTHEVINE',
    harvestBonus: '+3 OXY',
    apply: (s) => { s.shelter.oxygen = clamp(s.shelter.oxygen + 3); },
  },
  // Resource mutations — utility-flavored.
  garlic: {
    id: 'sporeclove',
    name: 'SPORECLOVE',
    harvestBonus: '+1 EACH SEED',
    apply: (s) => {
      for (const sp of Object.keys(s.inventory.seeds) as SpeciesId[]) {
        s.inventory.seeds[sp] += 1;
      }
    },
  },
  lavender: {
    id: 'dreampetal',
    name: 'DREAMPETAL',
    harvestBonus: '+5 WATER',
    apply: (s) => { s.inventory.water += 5; },
  },
};

// Roll mutation independently on each growing plant. Returns the
// number that newly mutated this call. Plants already mutated, empty,
// or harvestable (stage 4) are skipped.
export function mutateGardenPlants(state: RunState, chance: number): number {
  let n = 0;
  for (const tile of state.tiles) {
    if (!tile.species || tile.mutated) continue;
    if (tile.stage === 0 || tile.stage === 4) continue;
    if (Math.random() < chance) {
      tile.mutated = true;
      n++;
    }
  }
  return n;
}

export interface Species {
  id: SpeciesId;
  name: string;             // display name (uppercase, fits in HUD)
  // Seconds per stage transition when unwatered. Watered halves this.
  secondsPerStage: number;
  // Yield count per harvested plant.
  yieldPerHarvest: number;
  // Index into palette[] used as the plant's main tone (1..3).
  toneIdx: 2 | 3;
}

export const SPECIES_DATA: Record<SpeciesId, Species> = {
  mint:      { id: 'mint',      name: 'MINT',  secondsPerStage: 8,  yieldPerHarvest: 2, toneIdx: 3 },
  sunflower: { id: 'sunflower', name: 'SUN',   secondsPerStage: 10, yieldPerHarvest: 1, toneIdx: 3 },
  basil:     { id: 'basil',     name: 'BASIL', secondsPerStage: 9,  yieldPerHarvest: 2, toneIdx: 2 },
  chamomile: { id: 'chamomile', name: 'CHAM',  secondsPerStage: 12, yieldPerHarvest: 1, toneIdx: 3 },
  potato:    { id: 'potato',    name: 'POTA',  secondsPerStage: 14, yieldPerHarvest: 3, toneIdx: 2 },
  aloe:      { id: 'aloe',      name: 'ALOE',  secondsPerStage: 12, yieldPerHarvest: 1, toneIdx: 2 },
  garlic:    { id: 'garlic',    name: 'GARL',  secondsPerStage: 10, yieldPerHarvest: 2, toneIdx: 3 },
  lavender:  { id: 'lavender',  name: 'LAV',   secondsPerStage: 11, yieldPerHarvest: 1, toneIdx: 3 },
};

// Draw a tile's contents at top-left (x, y) into an 18x18 area.
// `watered` darkens the soil; `stage` selects what plant art to draw.
// `mutated` adds a twinkling sparkle pixel. `blink` is a free-running
// clock (typically the garden's blink time) used to animate the sparkle.
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  species: SpeciesId | null,
  stage: GrowthStage,
  watered: boolean,
  mutated: boolean,
  blink: number,
  p: Palette,
): void {
  // Soil bed
  ctx.fillStyle = watered ? p[0] : p[1];
  ctx.fillRect(x + 1, y + 1, 16, 16);
  // Soil specks
  ctx.fillStyle = watered ? p[1] : p[0];
  ctx.fillRect(x + 4, y + 13, 1, 1);
  ctx.fillStyle = watered ? p[1] : p[2];
  ctx.fillRect(x + 11, y + 6, 1, 1);

  // Tile border (subtle)
  ctx.fillStyle = p[0];
  ctx.fillRect(x, y, 18, 1);
  ctx.fillRect(x, y + 17, 18, 1);
  ctx.fillRect(x, y, 1, 18);
  ctx.fillRect(x + 17, y, 1, 18);

  if (!species || stage === 0) return;

  // Plant art is centered horizontally; rooted at row y+15.
  const cx = x + 9;
  const base = y + 15;
  const tone = p[SPECIES_DATA[species].toneIdx];
  const dark = p[1];

  if (stage === 1) {
    // Seed: a single nub poking out
    ctx.fillStyle = tone;
    ctx.fillRect(cx, base, 1, 1);
  } else if (stage === 2) {
    // Sprout: 2px stem, 1 leaf
    ctx.fillStyle = tone;
    ctx.fillRect(cx, base - 1, 1, 2);
    ctx.fillRect(cx + 1, base - 1, 1, 1);
  } else if (stage === 3) {
    // Growing: taller stem + two leaves
    ctx.fillStyle = tone;
    ctx.fillRect(cx, base - 3, 1, 4);
    ctx.fillRect(cx - 1, base - 2, 1, 1);
    ctx.fillRect(cx + 1, base - 1, 1, 1);
  } else {
    // Mature: species-specific bloom on top of a stem
    ctx.fillStyle = tone;
    ctx.fillRect(cx, base - 6, 1, 6); // stem
    ctx.fillRect(cx - 1, base - 4, 1, 1);
    ctx.fillRect(cx + 1, base - 3, 1, 1);
    switch (species) {
      case 'mint':
        // Bushy cluster
        ctx.fillRect(cx - 2, base - 8, 5, 1);
        ctx.fillRect(cx - 1, base - 9, 3, 1);
        ctx.fillStyle = dark;
        ctx.fillRect(cx, base - 7, 1, 1);
        break;
      case 'sunflower':
        // Disc bloom with dark center
        ctx.fillRect(cx - 2, base - 8, 5, 1);
        ctx.fillRect(cx - 2, base - 9, 5, 1);
        ctx.fillRect(cx - 1, base - 10, 3, 1);
        ctx.fillStyle = dark;
        ctx.fillRect(cx, base - 9, 1, 1);
        break;
      case 'basil':
        // Layered leaves
        ctx.fillRect(cx - 1, base - 7, 3, 1);
        ctx.fillRect(cx - 2, base - 8, 5, 1);
        ctx.fillRect(cx - 1, base - 9, 3, 1);
        break;
      case 'chamomile':
        // 5-petal flower with a dark center pip
        ctx.fillRect(cx - 1, base - 7, 3, 1);
        ctx.fillRect(cx - 2, base - 8, 1, 1);
        ctx.fillRect(cx + 2, base - 8, 1, 1);
        ctx.fillRect(cx, base - 9, 1, 1);
        ctx.fillStyle = dark;
        ctx.fillRect(cx, base - 8, 1, 1);
        break;
      case 'potato':
        // Round bushy mass
        ctx.fillRect(cx - 2, base - 6, 5, 1);
        ctx.fillRect(cx - 2, base - 7, 5, 1);
        ctx.fillRect(cx - 1, base - 8, 3, 1);
        ctx.fillStyle = dark;
        ctx.fillRect(cx - 1, base - 7, 1, 1);
        ctx.fillRect(cx + 1, base - 6, 1, 1);
        break;
      case 'aloe':
        // Radial spikes
        ctx.fillRect(cx, base - 8, 1, 2);
        ctx.fillRect(cx - 2, base - 7, 1, 1);
        ctx.fillRect(cx + 2, base - 7, 1, 1);
        ctx.fillRect(cx - 1, base - 8, 1, 1);
        ctx.fillRect(cx + 1, base - 8, 1, 1);
        break;
      case 'garlic':
        // Bulb at base with thin shoots
        ctx.fillRect(cx - 2, base - 1, 5, 1);
        ctx.fillRect(cx - 1, base - 2, 3, 1);
        ctx.fillRect(cx, base - 9, 1, 3);
        ctx.fillRect(cx + 1, base - 8, 1, 2);
        break;
      case 'lavender':
        // Tall cluster on a thin stem
        ctx.fillRect(cx, base - 10, 1, 1);
        ctx.fillRect(cx - 1, base - 9, 3, 1);
        ctx.fillRect(cx, base - 8, 1, 1);
        ctx.fillRect(cx - 1, base - 7, 3, 1);
        ctx.fillStyle = dark;
        ctx.fillRect(cx, base - 9, 1, 1);
        break;
    }
  }

  // Alien sparkle for mutated plants — a 1px twinkle that hops around
  // the plant on a slow blink cycle. Cheap and reads instantly.
  if (mutated) {
    const phase = Math.floor(blink * 3) % 4;
    if (phase !== 3) {
      const offsets: [number, number][] = [
        [-3, -5], [3, -6], [2, -3], [-2, -2],
      ];
      const [dx, dy] = offsets[phase];
      ctx.fillStyle = p[3];
      ctx.fillRect(cx + dx, base + dy, 1, 1);
    }
  }
}

// Tiny species icon for HUD (5x5 area). Used for the selected-seed chip.
export function drawSeedIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  species: SpeciesId,
  p: Palette,
): void {
  const tone = p[SPECIES_DATA[species].toneIdx];
  ctx.fillStyle = p[1];
  ctx.fillRect(x, y, 5, 5);
  ctx.fillStyle = tone;
  switch (species) {
    case 'mint':
      ctx.fillRect(x + 1, y + 1, 3, 1);
      ctx.fillRect(x + 2, y + 2, 1, 2);
      break;
    case 'sunflower':
      ctx.fillRect(x + 1, y + 1, 3, 3);
      ctx.fillStyle = p[0];
      ctx.fillRect(x + 2, y + 2, 1, 1);
      break;
    case 'basil':
      ctx.fillRect(x + 1, y + 2, 3, 1);
      ctx.fillRect(x + 2, y + 1, 1, 3);
      break;
    case 'chamomile':
      // five dots radiating
      ctx.fillRect(x + 2, y + 1, 1, 1);
      ctx.fillRect(x + 1, y + 2, 1, 1);
      ctx.fillRect(x + 3, y + 2, 1, 1);
      ctx.fillRect(x + 2, y + 3, 1, 1);
      ctx.fillStyle = p[0];
      ctx.fillRect(x + 2, y + 2, 1, 1);
      break;
    case 'potato':
      // chunky bulb
      ctx.fillRect(x + 1, y + 1, 3, 3);
      break;
    case 'aloe':
      // V of spikes
      ctx.fillRect(x + 1, y + 1, 1, 1);
      ctx.fillRect(x + 3, y + 1, 1, 1);
      ctx.fillRect(x + 2, y + 2, 1, 1);
      ctx.fillRect(x + 2, y + 3, 1, 1);
      break;
    case 'garlic':
      // bulb base
      ctx.fillRect(x + 1, y + 2, 3, 2);
      ctx.fillRect(x + 2, y + 1, 1, 1);
      break;
    case 'lavender':
      // tall sprig
      ctx.fillRect(x + 2, y + 1, 1, 3);
      ctx.fillRect(x + 1, y + 2, 1, 1);
      ctx.fillRect(x + 3, y + 2, 1, 1);
      break;
  }
}
