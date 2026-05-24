import type { PlantId } from '../sprites/plants';
import { ALL_PLANTS } from '../sprites/plants';
import { BED_LAYOUT, type Bed, computeStage, type Stage } from './types';

export interface HarvestFx {
  bedIndex: number;
  startMs: number;
  species: PlantId;
}

export class GardenState {
  readonly beds: Bed[];
  readonly inventory = new Map<PlantId, number>();
  readonly fx: HarvestFx[] = [];

  constructor(nowMs: number) {
    // Bootstrap — every bed starts in bloom with its canonical species, so the
    // garden looks identical to milestone 1 on first frame. plantedAtMs is set
    // far enough in the past that computeStage() returns 'bloom' immediately.
    const longAgo = nowMs - 60_000;
    this.beds = BED_LAYOUT.map((spec, index) => ({
      index,
      x: spec.x,
      y: spec.y,
      swayVariant: spec.swayVariant,
      species: spec.initialSpecies,
      plantedAtMs: longAgo,
    }));

    // Player starts with 3 of each seed. Riddles (M5) will be how new seeds
    // are earned; this lets us exercise the full plant/harvest loop today.
    for (const id of Object.keys(ALL_PLANTS) as PlantId[]) {
      this.inventory.set(id, 0);
    }
  }

  stageOf(bed: Bed, nowMs: number): Stage {
    return computeStage(bed, nowMs);
  }

  plant(bedIndex: number, species: PlantId, nowMs: number): boolean {
    const bed = this.beds[bedIndex];
    if (!bed || bed.species !== null) return false;
    bed.species = species;
    bed.plantedAtMs = nowMs;
    return true;
  }

  harvest(bedIndex: number, nowMs: number): PlantId | null {
    const bed = this.beds[bedIndex];
    if (!bed || bed.species === null) return null;
    if (computeStage(bed, nowMs) !== 'bloom') return null;

    const species = bed.species;
    this.inventory.set(species, (this.inventory.get(species) ?? 0) + 1);
    this.fx.push({ bedIndex, startMs: nowMs, species });
    bed.species = null;
    bed.plantedAtMs = null;
    return species;
  }

  // Drop any harvest FX whose animation has finished.
  pruneFx(nowMs: number, fxDurationMs: number): void {
    while (this.fx.length > 0 && nowMs - this.fx[0].startMs > fxDurationMs) {
      this.fx.shift();
    }
  }
}
