// 5×7 monospace pixel font. Each glyph is 5 columns × 7 rows; chars advance
// 6 px (5 + 1 gap), line height 9 px (7 + 2 gap). Uppercase-only so we don't
// have to handle descenders — UI text reads as the cozy retro-handheld
// register a 192×116 screen naturally suggests.
//
// All glyphs render via drawPixelText → one 1×1 rect per filled pixel through
// the same Graphics pipeline as the sprites, so every glyph lands on the
// integer pixel grid and stays crisp at any integer stage scale.

export const GLYPH_WIDTH = 5;
export const GLYPH_HEIGHT = 7;
export const GLYPH_ADVANCE = 6;
export const LINE_HEIGHT = 9;

export const GLYPHS: Record<string, string> = {
  ' ': '.....\n.....\n.....\n.....\n.....\n.....\n.....',

  A: '.XXX.\nX...X\nX...X\nXXXXX\nX...X\nX...X\nX...X',
  B: 'XXXX.\nX...X\nX...X\nXXXX.\nX...X\nX...X\nXXXX.',
  C: '.XXXX\nX....\nX....\nX....\nX....\nX....\n.XXXX',
  D: 'XXXX.\nX...X\nX...X\nX...X\nX...X\nX...X\nXXXX.',
  E: 'XXXXX\nX....\nX....\nXXXX.\nX....\nX....\nXXXXX',
  F: 'XXXXX\nX....\nX....\nXXXX.\nX....\nX....\nX....',
  G: '.XXXX\nX....\nX....\nX..XX\nX...X\nX...X\n.XXX.',
  H: 'X...X\nX...X\nX...X\nXXXXX\nX...X\nX...X\nX...X',
  I: 'XXXXX\n..X..\n..X..\n..X..\n..X..\n..X..\nXXXXX',
  J: 'XXXXX\n...X.\n...X.\n...X.\n...X.\nX..X.\n.XX..',
  K: 'X...X\nX..X.\nX.X..\nXX...\nX.X..\nX..X.\nX...X',
  L: 'X....\nX....\nX....\nX....\nX....\nX....\nXXXXX',
  M: 'X...X\nXX.XX\nX.X.X\nX.X.X\nX...X\nX...X\nX...X',
  N: 'X...X\nXX..X\nX.X.X\nX.X.X\nX..XX\nX...X\nX...X',
  O: '.XXX.\nX...X\nX...X\nX...X\nX...X\nX...X\n.XXX.',
  P: 'XXXX.\nX...X\nX...X\nXXXX.\nX....\nX....\nX....',
  Q: '.XXX.\nX...X\nX...X\nX...X\nX.X.X\nX..X.\n.XX.X',
  R: 'XXXX.\nX...X\nX...X\nXXXX.\nX.X..\nX..X.\nX...X',
  S: '.XXXX\nX....\nX....\n.XXX.\n....X\n....X\nXXXX.',
  T: 'XXXXX\n..X..\n..X..\n..X..\n..X..\n..X..\n..X..',
  U: 'X...X\nX...X\nX...X\nX...X\nX...X\nX...X\n.XXX.',
  V: 'X...X\nX...X\nX...X\nX...X\nX...X\n.X.X.\n..X..',
  W: 'X...X\nX...X\nX...X\nX.X.X\nX.X.X\nXX.XX\nX...X',
  X: 'X...X\nX...X\n.X.X.\n..X..\n.X.X.\nX...X\nX...X',
  Y: 'X...X\nX...X\n.X.X.\n..X..\n..X..\n..X..\n..X..',
  Z: 'XXXXX\n....X\n...X.\n..X..\n.X...\nX....\nXXXXX',

  '0': '.XXX.\nX...X\nX..XX\nX.X.X\nXX..X\nX...X\n.XXX.',
  '1': '..X..\n.XX..\n..X..\n..X..\n..X..\n..X..\n.XXX.',
  '2': '.XXX.\nX...X\n....X\n...X.\n..X..\n.X...\nXXXXX',
  '3': '.XXX.\nX...X\n....X\n..XX.\n....X\nX...X\n.XXX.',
  '4': '...X.\n..XX.\n.X.X.\nX..X.\nXXXXX\n...X.\n...X.',
  '5': 'XXXXX\nX....\nX....\nXXXX.\n....X\nX...X\n.XXX.',
  '6': '.XXX.\nX...X\nX....\nXXXX.\nX...X\nX...X\n.XXX.',
  '7': 'XXXXX\n....X\n...X.\n..X..\n.X...\n.X...\n.X...',
  '8': '.XXX.\nX...X\nX...X\n.XXX.\nX...X\nX...X\n.XXX.',
  '9': '.XXX.\nX...X\nX...X\n.XXXX\n....X\nX...X\n.XXX.',

  '.': '.....\n.....\n.....\n.....\n.....\n.....\n..X..',
  ',': '.....\n.....\n.....\n.....\n.....\n..X..\n.X...',
  '!': '..X..\n..X..\n..X..\n..X..\n..X..\n.....\n..X..',
  '?': '.XXX.\nX...X\n....X\n...X.\n..X..\n.....\n..X..',
  ':': '.....\n.....\n..X..\n.....\n.....\n..X..\n.....',
  ';': '.....\n.....\n..X..\n.....\n.....\n..X..\n.X...',
  '-': '.....\n.....\n.....\nXXXXX\n.....\n.....\n.....',
  '+': '.....\n..X..\n..X..\nXXXXX\n..X..\n..X..\n.....',
  '=': '.....\n.....\nXXXXX\n.....\nXXXXX\n.....\n.....',
  '/': '....X\n....X\n...X.\n..X..\n.X...\nX....\nX....',
  '(': '..XX.\n.X...\n.X...\nX....\n.X...\n.X...\n..XX.',
  ')': '.XX..\n...X.\n...X.\n....X\n...X.\n...X.\n.XX..',
  "'": '..X..\n..X..\n.....\n.....\n.....\n.....\n.....',
  '·': '.....\n.....\n.....\n..X..\n.....\n.....\n.....',
  '×': '.....\n.....\nX...X\n.X.X.\n..X..\n.X.X.\nX...X',
  '▶': 'X....\nXX...\nXXX..\nXXXX.\nXXX..\nXX...\nX....',
  '*': '.....\nX.X.X\n.XXX.\nXXXXX\n.XXX.\nX.X.X\n.....',
};

export function glyphForChar(ch: string): string {
  return GLYPHS[ch] ?? GLYPHS['?'];
}
