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
// restore them. A stat at 0 starts a critical countdown — see
// criticalSols on RunState.
export interface Shelter {
  hull: number;
  oxygen: number;
  power: number;
}

export const STAT_MAX = 10;

// Number of dawns a shelter stat may stay at 0 before the run ends.
// 0 means "no grace, die instantly"; 2 gives the player one full
// cycle to brew the matching defensive recipe.
export const CRITICAL_SOLS_GRACE = 2;

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface DifficultySettings {
  allowedTiers: number[];
  showHints: boolean;
  wrongPenaltyOxygen: number;
  rewardMultiplier: number;
  label: string;
  blurb: string;
}

export const DIFFICULTY: Record<Difficulty, DifficultySettings> = {
  easy: {
    allowedTiers: [1],
    showHints: true,
    wrongPenaltyOxygen: 0,
    rewardMultiplier: 1,
    label: 'EASY',
    blurb: 'BEGINNER. HINTS ON. NO PENALTY.',
  },
  normal: {
    allowedTiers: [1, 2, 3],
    showHints: false,
    wrongPenaltyOxygen: 0,
    rewardMultiplier: 1,
    label: 'NORMAL',
    blurb: 'STANDARD. MIXED TIERS.',
  },
  hard: {
    allowedTiers: [2, 3],
    showHints: false,
    wrongPenaltyOxygen: 1,
    rewardMultiplier: 2,
    label: 'HARD',
    blurb: 'EXPERIENCED. -1 OXY ON WRONG. 2X REWARD.',
  },
};

export interface RunState {
  schema: 1;
  tiles: Tile[];           // length GRID_W * GRID_H, row-major
  cursor: { x: number; y: number };
  selectedSeed: SpeciesId;
  inventory: Inventory;
  shelter: Shelter;
  // Per-stat count of dawns the stat has been at 0. Reset whenever
  // the stat is restored above 0. When any value reaches
  // CRITICAL_SOLS_GRACE, the run ends.
  criticalSols: { hull: number; oxygen: number; power: number };
  sol: number;             // colony day counter
  gameTime: number;        // accumulated seconds since run start
  // Day/night cycle
  phase: import('./time').Phase;
  phaseTime: number;       // seconds elapsed into current phase
  difficulty: Difficulty;
}

export const GRID_W = 6;
export const GRID_H = 4;
export const TILE_PX = 18;

export const SPECIES: SpeciesId[] = [
  'mint', 'sunflower', 'basil',
  'chamomile', 'potato', 'aloe', 'garlic', 'lavender',
];
