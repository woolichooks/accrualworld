// Word-wrap for the 3x5 font. Each glyph is 3px + 1px kerning so we treat
// characters as 4px wide for layout math. Returns one entry per output line.

export function wrap(text: string, maxChars: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const w of words) {
      if (!line.length) {
        line = w;
      } else if (line.length + 1 + w.length <= maxChars) {
        line += ' ' + w;
      } else {
        out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}
