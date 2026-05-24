import { Graphics } from 'pixi.js';
import { DAWN, type Palette, ROLE_MAP } from './palette';

// Render an ASCII-pattern sprite into a Graphics object at integer
// pixel coordinates. Rects are batched per colour so we issue one fill()
// per palette role used in the sprite — keeps draw calls tight.
export function drawSprite(
  g: Graphics,
  pattern: string,
  ox = 0,
  oy = 0,
  palette: Palette = DAWN,
): void {
  const rows = pattern.split('\n').map((r) => r.trim()).filter((r) => r.length);
  const byColor = new Map<number, Array<[number, number]>>();
  rows.forEach((row, ry) => {
    for (let rx = 0; rx < row.length; rx++) {
      const ch = row[rx];
      const role = ROLE_MAP[ch];
      if (!role) continue;
      const color = palette[role];
      let bucket = byColor.get(color);
      if (!bucket) {
        bucket = [];
        byColor.set(color, bucket);
      }
      bucket.push([ox + rx, oy + ry]);
    }
  });
  byColor.forEach((cells, color) => {
    for (const [x, y] of cells) g.rect(x, y, 1, 1);
    g.fill(color);
  });
}

export function createSprite(pattern: string, palette: Palette = DAWN): Graphics {
  const g = new Graphics();
  drawSprite(g, pattern, 0, 0, palette);
  return g;
}
