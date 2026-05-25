// Per-species data + sprite drawing. Sprites are drawn procedurally
// against the active 4-color palette so they recolor for free with the
// palette system. All sprites fit inside an 18x18 tile with a 1px margin.

import type { SpeciesId, GrowthStage } from './types';
import type { Palette } from './palette';

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
};

// Draw a tile's contents at top-left (x, y) into an 18x18 area.
// `watered` darkens the soil; `stage` selects what plant art to draw.
export function drawTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  species: SpeciesId | null,
  stage: GrowthStage,
  watered: boolean,
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
  }
}
