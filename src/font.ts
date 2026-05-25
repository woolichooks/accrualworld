// Tiny 3x5 bitmap font, drawn pixel-by-pixel onto the 160x144 canvas.
// Each glyph is 5 rows of 3 bits packed left-aligned (bit 2 = leftmost).
// Uppercase, digits, and the punctuation we need for the title screen.

const G: Record<string, number[]> = {
  A: [0b010, 0b101, 0b111, 0b101, 0b101],
  B: [0b110, 0b101, 0b110, 0b101, 0b110],
  C: [0b011, 0b100, 0b100, 0b100, 0b011],
  D: [0b110, 0b101, 0b101, 0b101, 0b110],
  E: [0b111, 0b100, 0b110, 0b100, 0b111],
  F: [0b111, 0b100, 0b110, 0b100, 0b100],
  G: [0b011, 0b100, 0b101, 0b101, 0b011],
  H: [0b101, 0b101, 0b111, 0b101, 0b101],
  I: [0b111, 0b010, 0b010, 0b010, 0b111],
  J: [0b001, 0b001, 0b001, 0b101, 0b010],
  K: [0b101, 0b101, 0b110, 0b101, 0b101],
  L: [0b100, 0b100, 0b100, 0b100, 0b111],
  M: [0b101, 0b111, 0b111, 0b101, 0b101],
  N: [0b101, 0b111, 0b111, 0b111, 0b101],
  O: [0b010, 0b101, 0b101, 0b101, 0b010],
  P: [0b110, 0b101, 0b110, 0b100, 0b100],
  Q: [0b010, 0b101, 0b101, 0b111, 0b011],
  R: [0b110, 0b101, 0b110, 0b101, 0b101],
  S: [0b011, 0b100, 0b010, 0b001, 0b110],
  T: [0b111, 0b010, 0b010, 0b010, 0b010],
  U: [0b101, 0b101, 0b101, 0b101, 0b111],
  V: [0b101, 0b101, 0b101, 0b101, 0b010],
  W: [0b101, 0b101, 0b111, 0b111, 0b101],
  X: [0b101, 0b101, 0b010, 0b101, 0b101],
  Y: [0b101, 0b101, 0b010, 0b010, 0b010],
  Z: [0b111, 0b001, 0b010, 0b100, 0b111],
  '0': [0b010, 0b101, 0b101, 0b101, 0b010],
  '1': [0b010, 0b110, 0b010, 0b010, 0b111],
  '2': [0b110, 0b001, 0b010, 0b100, 0b111],
  '3': [0b110, 0b001, 0b010, 0b001, 0b110],
  '4': [0b101, 0b101, 0b111, 0b001, 0b001],
  '5': [0b111, 0b100, 0b110, 0b001, 0b110],
  '6': [0b011, 0b100, 0b110, 0b101, 0b010],
  '7': [0b111, 0b001, 0b010, 0b010, 0b010],
  '8': [0b010, 0b101, 0b010, 0b101, 0b010],
  '9': [0b010, 0b101, 0b011, 0b001, 0b110],
  '-': [0b000, 0b000, 0b111, 0b000, 0b000],
  '.': [0b000, 0b000, 0b000, 0b000, 0b010],
  ':': [0b000, 0b010, 0b000, 0b010, 0b000],
  '!': [0b010, 0b010, 0b010, 0b000, 0b010],
  '?': [0b110, 0b001, 0b010, 0b000, 0b010],
  "'": [0b010, 0b010, 0b000, 0b000, 0b000],
  ',': [0b000, 0b000, 0b000, 0b010, 0b100],
  '/': [0b001, 0b001, 0b010, 0b100, 0b100],
  '(': [0b001, 0b010, 0b010, 0b010, 0b001],
  ')': [0b100, 0b010, 0b010, 0b010, 0b100],
  $: [0b011, 0b110, 0b010, 0b011, 0b110],
  '+': [0b000, 0b010, 0b111, 0b010, 0b000],
  ' ': [0b000, 0b000, 0b000, 0b000, 0b000],
};

export const GLYPH_W = 3;
export const GLYPH_H = 5;
export const KERN = 1;

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): number {
  ctx.fillStyle = color;
  const up = text.toUpperCase();
  let cx = x;
  for (const ch of up) {
    const g = G[ch] ?? G[' '];
    for (let row = 0; row < GLYPH_H; row++) {
      const bits = g[row];
      for (let col = 0; col < GLYPH_W; col++) {
        if (bits & (1 << (GLYPH_W - 1 - col))) {
          ctx.fillRect(cx + col, y + row, 1, 1);
        }
      }
    }
    cx += GLYPH_W + KERN;
  }
  return cx - KERN; // pixel after last glyph
}

export function textWidth(text: string): number {
  if (!text.length) return 0;
  return text.length * (GLYPH_W + KERN) - KERN;
}
