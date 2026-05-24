import { Container, Graphics } from 'pixi.js';
import { GLYPH_ADVANCE, GLYPH_HEIGHT, GLYPHS, glyphForChar } from '../sprites/font';

// Render a string into a Graphics by emitting one 1×1 rect per filled pixel.
// All coords stay on the integer grid so the result reads sharp at any
// integer stage scale. Returns the total width drawn (in logical pixels).
export function drawPixelText(
  g: Graphics,
  text: string,
  x: number,
  y: number,
  color: number,
): number {
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of text) {
    const glyph = GLYPHS[ch] ?? glyphForChar('?');
    const rows = glyph.split('\n');
    for (let ry = 0; ry < rows.length; ry++) {
      const row = rows[ry];
      for (let rx = 0; rx < row.length; rx++) {
        if (row[rx] === 'X') g.rect(cx + rx, cy + ry, 1, 1);
      }
    }
    cx += GLYPH_ADVANCE;
  }
  g.fill(color);
  return cx - Math.round(x);
}

export function measureTextWidth(text: string): number {
  return Math.max(0, text.length * GLYPH_ADVANCE - 1);
}

export const TEXT_HEIGHT = GLYPH_HEIGHT;

// Stateful text label — clears + rebuilds the graphics only when text or
// color changes. Use this for HUD/dialog fields that swap content over time.
export class PixelLabel {
  readonly root: Container;
  private g = new Graphics();
  private currentText = '';
  private currentColor: number;

  constructor(color: number, initialText = '') {
    this.currentColor = color;
    this.root = this.g;
    if (initialText) this.setText(initialText);
  }

  setText(text: string): void {
    if (text === this.currentText) return;
    this.currentText = text;
    this.redraw();
  }

  setColor(color: number): void {
    if (color === this.currentColor) return;
    this.currentColor = color;
    this.redraw();
  }

  get text(): string {
    return this.currentText;
  }

  get width(): number {
    return measureTextWidth(this.currentText);
  }

  private redraw(): void {
    this.g.clear();
    drawPixelText(this.g, this.currentText, 0, 0, this.currentColor);
  }
}
