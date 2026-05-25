// Shared run-state types. Persisted to localStorage as `accrualworld.run.v1`.

export type SpeciesId = 'mint' | 'sunflower' | 'basil';

export type GrowthStage = 0 | 1 | 2 | 3 | 4;
// 0 empty | 1 seed | 2 sprout | 3 growing | 4 mature

export interface Tile {
  species: SpeciesId | null;
  stage: GrowthStage;
  // Game-time seconds when the current stage began.
  stageStartedAt: number;
  // Game-time seconds of the last watering (0 if never).
  lastWateredAt: number;
}

export interface Inventory {
  seeds: Record<SpeciesId, number>;
  water: number;
  harvested: Record<SpeciesId, number>;
}

export interface RunState {
  schema: 1;
  tiles: Tile[];           // length GRID_W * GRID_H, row-major
  cursor: { x: number; y: number };
  selectedSeed: SpeciesId;
  inventory: Inventory;
  sol: number;             // colony day counter
  gameTime: number;        // accumulated seconds since run start
}

export const GRID_W = 6;
export const GRID_H = 4;
export const TILE_PX = 18;

export const SPECIES: SpeciesId[] = ['mint', 'sunflower', 'basil'];
