// Run save/load. Meta-progression will live under a separate key
// (`accrualworld.meta.v1`) added in a later milestone.

import { GRID_W, GRID_H, type RunState, type Tile } from './types';

const KEY = 'accrualworld.run.v1';

export function emptyTile(): Tile {
  return { species: null, stage: 0, stageStartedAt: 0, lastWateredAt: 0 };
}

export function newRun(): RunState {
  const tiles: Tile[] = [];
  for (let i = 0; i < GRID_W * GRID_H; i++) tiles.push(emptyTile());
  return {
    schema: 1,
    tiles,
    cursor: { x: 0, y: 0 },
    selectedSeed: 'mint',
    inventory: {
      seeds: { mint: 4, sunflower: 2, basil: 2 },
      water: 8,
      harvested: { mint: 0, sunflower: 0, basil: 0 },
    },
    shelter: { hull: 10, oxygen: 10, power: 10 },
    sol: 1,
    gameTime: 0,
    phase: 'day',
    phaseTime: 0,
  };
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as RunState;
    if (data.schema !== 1) return null;
    if (!Array.isArray(data.tiles) || data.tiles.length !== GRID_W * GRID_H) return null;
    // Backfill any fields a slightly older save might be missing.
    data.inventory ??= { seeds: { mint: 0, sunflower: 0, basil: 0 }, water: 0, harvested: { mint: 0, sunflower: 0, basil: 0 } };
    data.inventory.harvested ??= { mint: 0, sunflower: 0, basil: 0 };
    data.inventory.seeds ??= { mint: 0, sunflower: 0, basil: 0 };
    // Day/night fields added in milestone 4 — backfill for older saves.
    data.phase ??= 'day';
    data.phaseTime ??= 0;
    // Shelter stats added in milestone 6.
    data.shelter ??= { hull: 10, oxygen: 10, power: 10 };
    return data;
  } catch {
    return null;
  }
}

export function saveRun(state: RunState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or disabled storage — fail silently; game still playable in-session.
  }
}

export function clearRun(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
