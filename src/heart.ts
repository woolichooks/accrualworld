// Heart icon for the HUD's compact stat panel. 5x5 outline with 7
// interior pixels that fill from the bottom point up as the stat
// rises. When the value is <=2 the whole icon blinks; when 0 the
// outline dims so a dead stat still reads.

import type { Palette } from './palette';

const OUTLINE: [number, number][] = [
  [1, 0], [3, 0],
  [0, 1], [4, 1],
  [0, 2], [4, 2],
  [1, 3], [3, 3],
  [2, 4],
];

// In fill order: index 0 appears first, last index appears last.
const INTERIOR: [number, number][] = [
  [2, 3],                     // bottom point
  [2, 2], [1, 2], [3, 2],     // middle row
  [2, 1], [1, 1], [3, 1],     // top row
];

export const HEART_W = 5;
export const HEART_H = 5;

export function drawHeart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  value: number,
  maxValue: number,
  blink: number,
  p: Palette,
): void {
  // Critical stats flicker so they catch the eye.
  const critical = value > 0 && value <= 2;
  if (critical && Math.floor(blink * 3) % 2 === 0) return;
  // A fully-empty stat (value 0) renders only the dim outline and
  // also flickers a beat differently so it can't be confused with low.
  if (value === 0 && Math.floor(blink * 2) % 2 === 0) return;

  const ratio = Math.max(0, Math.min(1, value / maxValue));
  const fillCount = Math.round(ratio * INTERIOR.length);

  // Outline
  ctx.fillStyle = value === 0 ? p[2] : p[3];
  for (const [px, py] of OUTLINE) ctx.fillRect(x + px, y + py, 1, 1);

  // Interior (drain from top)
  ctx.fillStyle = p[3];
  for (let i = 0; i < fillCount; i++) {
    const [px, py] = INTERIOR[i];
    ctx.fillRect(x + px, y + py, 1, 1);
  }
}
