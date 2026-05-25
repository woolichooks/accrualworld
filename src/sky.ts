// Sky clock — a tiny animated widget that shows where the colonist is
// in the current half-cycle. Sun traverses left->right across an arc
// during day+dusk; moon does the same during night+dawn. Lives in the
// HUD strip; 18x10 px including a horizon line at the bottom.

import type { Palette } from './palette';
import { PHASE_SECONDS, type Phase } from './time';

export const SKYCLOCK_W = 18;
export const SKYCLOCK_H = 10;

// Arc parameters (relative to widget origin).
const CX = 8.5;
const CY = 8;
const RX = 7.5;
const RY = 6.5;
const HORIZON_Y = 8;

function halfCycleProgress(phase: Phase, phaseTime: number): { isSun: boolean; progress: number } {
  const dayTotal = PHASE_SECONDS.day + PHASE_SECONDS.dusk;
  const nightTotal = PHASE_SECONDS.night + PHASE_SECONDS.dawn;
  if (phase === 'day') return { isSun: true, progress: phaseTime / dayTotal };
  if (phase === 'dusk') return { isSun: true, progress: (PHASE_SECONDS.day + phaseTime) / dayTotal };
  if (phase === 'night') return { isSun: false, progress: phaseTime / nightTotal };
  return { isSun: false, progress: (PHASE_SECONDS.night + phaseTime) / nightTotal };
}

export function drawSkyClock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: Phase,
  phaseTime: number,
  p: Palette,
): void {
  // Horizon line.
  ctx.fillStyle = p[2];
  ctx.fillRect(x, y + HORIZON_Y, SKYCLOCK_W, 1);

  // Arc — dotted; sample enough points that pixels don't have gaps.
  ctx.fillStyle = p[1];
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const a = Math.PI - (i / steps) * Math.PI;
    const px = Math.round(x + CX + Math.cos(a) * RX);
    const py = Math.round(y + CY - Math.sin(a) * RY);
    if (py < y + HORIZON_Y) ctx.fillRect(px, py, 1, 1);
  }

  // Celestial body position.
  const { isSun, progress } = halfCycleProgress(phase, phaseTime);
  const t = Math.max(0, Math.min(1, progress));
  const ba = Math.PI - t * Math.PI;
  const bx = Math.round(x + CX + Math.cos(ba) * RX);
  const by = Math.round(y + CY - Math.sin(ba) * RY);

  if (isSun) {
    // Sun: bright 2x2 cluster with a brighter core.
    ctx.fillStyle = p[3];
    ctx.fillRect(bx - 1, by - 1, 3, 1);
    ctx.fillRect(bx - 1, by, 3, 1);
    ctx.fillRect(bx, by - 2, 1, 1);
    ctx.fillRect(bx, by + 1, 1, 1);
  } else {
    // Moon: 2x2 with a "shadow" pixel for the crescent feel.
    ctx.fillStyle = p[3];
    ctx.fillRect(bx, by, 1, 1);
    ctx.fillRect(bx, by - 1, 1, 1);
    ctx.fillRect(bx - 1, by - 1, 1, 1);
    ctx.fillStyle = p[2];
    ctx.fillRect(bx - 1, by, 1, 1);
  }
}
