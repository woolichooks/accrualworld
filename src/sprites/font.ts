// 3×5 monospace pixel font, authored as ASCII glyphs. Every character renders
// through the same Graphics pipeline as the sprites, so text lands on integer
// pixel boundaries and stays crisp at every integer stage scale.
//
// Each glyph is 3 columns × 5 rows. Characters advance 4 px (3 + 1 gap). This
// is a tighter pitch than the prototype's 3.5 px JetBrains Mono but it reads
// because every pixel is exact — no antialiasing, no sub-pixel positioning.

export const GLYPH_WIDTH = 3;
export const GLYPH_HEIGHT = 5;
export const GLYPH_ADVANCE = 4;

export const GLYPHS: Record<string, string> = {
  ' ': '...\n...\n...\n...\n...',

  // Uppercase
  A: 'XXX\nX.X\nXXX\nX.X\nX.X',
  B: 'XX.\nX.X\nXX.\nX.X\nXX.',
  C: '.XX\nX..\nX..\nX..\n.XX',
  D: 'XX.\nX.X\nX.X\nX.X\nXX.',
  E: 'XXX\nX..\nXX.\nX..\nXXX',
  F: 'XXX\nX..\nXX.\nX..\nX..',
  G: '.XX\nX..\nX.X\nX.X\n.XX',
  H: 'X.X\nX.X\nXXX\nX.X\nX.X',
  I: 'XXX\n.X.\n.X.\n.X.\nXXX',
  J: '..X\n..X\n..X\nX.X\n.X.',
  K: 'X.X\nX.X\nXX.\nX.X\nX.X',
  L: 'X..\nX..\nX..\nX..\nXXX',
  M: 'X.X\nXXX\nXXX\nX.X\nX.X',
  N: 'XX.\nXXX\nX.X\nXXX\n.XX',
  O: '.X.\nX.X\nX.X\nX.X\n.X.',
  P: 'XX.\nX.X\nXX.\nX..\nX..',
  Q: '.X.\nX.X\nX.X\nXXX\n.XX',
  R: 'XX.\nX.X\nXX.\nX.X\nX.X',
  S: '.XX\nX..\n.X.\n..X\nXX.',
  T: 'XXX\n.X.\n.X.\n.X.\n.X.',
  U: 'X.X\nX.X\nX.X\nX.X\n.XX',
  V: 'X.X\nX.X\nX.X\nX.X\n.X.',
  W: 'X.X\nX.X\nX.X\nXXX\nXXX',
  X: 'X.X\nX.X\n.X.\nX.X\nX.X',
  Y: 'X.X\nX.X\n.X.\n.X.\n.X.',
  Z: 'XXX\n..X\n.X.\nX..\nXXX',

  // Lowercase — row 1 is empty for x-height letters; ascenders use row 1,
  // descenders hint into the baseline corner pixel of row 5.
  a: '...\n.XX\nX.X\nX.X\n.XX',
  b: 'X..\nX..\nXX.\nX.X\nXX.',
  c: '...\n.XX\nX..\nX..\n.XX',
  d: '..X\n..X\n.XX\nX.X\n.XX',
  e: '...\n.X.\nX.X\nXX.\n.XX',
  f: '.XX\nX..\nXX.\nX..\nX..',
  g: '...\n.XX\nX.X\n.XX\n..X',
  h: 'X..\nX..\nXX.\nX.X\nX.X',
  i: '.X.\n...\n.X.\n.X.\n.X.',
  j: '..X\n...\n..X\nX.X\n.X.',
  k: 'X..\nX.X\nXX.\nX.X\nX.X',
  l: '.X.\n.X.\n.X.\n.X.\n.XX',
  m: '...\nXXX\nXXX\nX.X\nX.X',
  n: '...\nXX.\nX.X\nX.X\nX.X',
  o: '...\n.X.\nX.X\nX.X\n.X.',
  p: '...\nXX.\nX.X\nXX.\nX..',
  q: '...\n.XX\nX.X\n.XX\n..X',
  r: '...\nXX.\nX.X\nX..\nX..',
  s: '...\n.XX\nX..\n.X.\nXX.',
  t: '.X.\nXXX\n.X.\n.X.\n.XX',
  u: '...\nX.X\nX.X\nX.X\n.XX',
  v: '...\nX.X\nX.X\nX.X\n.X.',
  w: '...\nX.X\nX.X\nXXX\nXXX',
  x: '...\nX.X\n.X.\nX.X\nX.X',
  y: '...\nX.X\nX.X\n.XX\nX..',
  z: '...\nXXX\n..X\n.X.\nXXX',

  // Digits
  '0': '.X.\nX.X\nX.X\nX.X\n.X.',
  '1': '.X.\nXX.\n.X.\n.X.\nXXX',
  '2': 'XX.\n..X\n.X.\nX..\nXXX',
  '3': 'XX.\n..X\n.X.\n..X\nXX.',
  '4': 'X.X\nX.X\nXXX\n..X\n..X',
  '5': 'XXX\nX..\nXX.\n..X\nXX.',
  '6': '.XX\nX..\nXX.\nX.X\n.X.',
  '7': 'XXX\n..X\n.X.\nX..\nX..',
  '8': '.X.\nX.X\n.X.\nX.X\n.X.',
  '9': '.X.\nX.X\n.XX\n..X\nXX.',

  // Punctuation
  '.': '...\n...\n...\n...\n.X.',
  ',': '...\n...\n...\n.X.\nX..',
  '!': '.X.\n.X.\n.X.\n...\n.X.',
  '?': 'XX.\n..X\n.X.\n...\n.X.',
  ':': '...\n.X.\n...\n.X.\n...',
  ';': '...\n.X.\n...\n.X.\nX..',
  '-': '...\n...\nXXX\n...\n...',
  '+': '...\n.X.\nXXX\n.X.\n...',
  '=': '...\nXXX\n...\nXXX\n...',
  '/': '..X\n..X\n.X.\nX..\nX..',
  '(': '.X.\nX..\nX..\nX..\n.X.',
  ')': '.X.\n..X\n..X\n..X\n.X.',
  "'": '.X.\n.X.\n...\n...\n...',
  '·': '...\n...\n.X.\n...\n...',
  '×': '...\nX.X\n.X.\nX.X\n...',
  '▶': 'X..\nXX.\nXXX\nXX.\nX..',
  '*': '...\nX.X\n.X.\nX.X\n...',
};

export function glyphForChar(ch: string): string {
  return GLYPHS[ch] ?? GLYPHS['?'];
}
