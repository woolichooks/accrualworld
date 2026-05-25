// Shared run-state types. Persisted to localStorage as `accrualworld.run.v1`.

export type SpeciesId =
  | 'mint'
  | 'sunflower'
  | 'basil'
  | 'chamomile'
  | 'potato'
  | 'aloe'
  | 'garlic'
  | 'lavender';

export type GrowthStage = 0 | 1 | 2 | 3 | 4;
// 0 empty | 1 seed | 2 sprout | 3 growing | 4 mature

export interface Tile {
  species: SpeciesId | null;
  stage: GrowthStage;
  // Game-time seconds when the current stage began.
  stageStartedAt: number;
  // Game-time seconds of the last watering (0 if never).
  lastWateredAt: number;
  // Alien mutations are rolled by wonders and threats. A mutated
  // plant sparkles in the grid and grants its species' stat bonus
  // when harvested (in addition to the regular leaf yield).
  mutated: boolean;
}

export interface Inventory {
  seeds: Record<SpeciesId, number>;
  water: number;
  harvested: Record<SpeciesId, number>;
}

// Shelter stats. Threats reduce these at night; defensive brews
// restore them. Any stat hitting 0 ends the run.
export interface Shelter {
  hull: number;
  oxygen: number;
  power: number;
}

export const STAT_MAX = 10;

export interface RunState {
  schema: 1;
  tiles: Tile[];           // length GRID_W * GRID_H, row-major
  cursor: { x: number; y: number };
  selectedSeed: SpeciesId;
  inventory: Inventory;
  shelter: Shelter;
  sol: number;             // colony day counter
  gameTime: number;        // accumulated seconds since run start
  // Day/night cycle
  phase: import('./time').Phase;
  phaseTime: number;       // seconds elapsed into current phase
}

export const GRID_W = 6;
export const GRID_H = 4;
export const TILE_PX = 18;

export const SPECIES: SpeciesId[] = [
  'mint', 'sunflower', 'basil',
  'chamomile', 'potato', 'aloe', 'garlic', 'lavender',
];
