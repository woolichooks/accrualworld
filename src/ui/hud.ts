import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DAWN, MOON_COLOR, SUN2_COLOR, SUN_COLOR } from '../engine/palette';
import { drawSprite } from '../engine/sprite';
import { HEART_EMPTY, HEART_FULL } from '../sprites/tiles';
import { SPR_BLOB_PORTRAIT } from '../sprites/blob';
import type { SolTime } from '../engine/time';

const W = 192;
const H = 116;

// Pixel text — JetBrains Mono served from Google Fonts (see index.html).
// 3.6 px in the prototype maps to 4 px here so it stays readable after the
// integer scale-up.
function pixelText(content: string, color: number, size = 4): Text {
  const style = new TextStyle({
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: size,
    fill: color,
    letterSpacing: 0,
  });
  return new Text({ text: content, style });
}

export class HUD {
  readonly root = new Container();

  private phaseLabel: Text;
  private clockLabel: Text;
  private clockSunIcon = new Graphics();
  private clockMoonIcon = new Graphics();
  private cursor = new Graphics();
  private cursorState = true;
  private cursorTimer = 0;

  constructor() {
    this.buildHearts();
    this.phaseLabel = this.buildPhaseLabel();
    this.clockLabel = this.buildClock();
    this.buildDialogue();
  }

  private buildHearts(): void {
    const bg = new Graphics();
    bg.rect(2, 2, 46, 7).fill(DAWN.ink);
    this.root.addChild(bg);

    const filled = 4;
    const slots = [3, 11, 19, 27, 35];
    slots.forEach((x, i) => {
      const g = new Graphics();
      drawSprite(g, i < filled ? HEART_FULL : HEART_EMPTY, x, 3);
      this.root.addChild(g);
    });
  }

  private buildPhaseLabel(): Text {
    const bg = new Graphics();
    bg.rect(W / 2 - 30, 2, 60, 7).fill(DAWN.ink);
    this.root.addChild(bg);

    const arrow = new Graphics();
    arrow.rect(W / 2 - 27, 4.4, 3, 1).rect(W / 2 - 26, 5.4, 1, 1).fill(DAWN.accent);
    this.root.addChild(arrow);

    const label = pixelText('dawn · sol 47', DAWN.light, 4);
    label.x = W / 2 - 22;
    label.y = 1.6;
    this.root.addChild(label);
    return label;
  }

  private buildClock(): Text {
    const bg = new Graphics();
    bg.rect(W - 50, 2, 48, 7).fill(DAWN.ink);
    this.root.addChild(bg);

    const label = pixelText('04:12', DAWN.accent, 4);
    label.x = W - 47;
    label.y = 1.6;
    this.root.addChild(label);

    this.clockSunIcon.rect(W - 22, 3, 5, 3).fill(SUN_COLOR);
    this.clockMoonIcon.rect(W - 12, 3, 3, 3).fill(SUN2_COLOR);
    this.root.addChild(this.clockSunIcon, this.clockMoonIcon);
    return label;
  }

  // Bottom-of-screen dialogue box with the MIRA portrait + scripted hint.
  // Matches docs/design-handoff/src/art-pocket.jsx layout: a 188×22 inked
  // rect at (2, H-24) with an 18×18 portrait, name, and two text lines.
  private buildDialogue(): void {
    const box = new Graphics();
    box.rect(2, H - 24, W - 4, 22).fill(DAWN.ink);
    this.root.addChild(box);

    // Portrait frame.
    const frame = new Graphics();
    frame.rect(4, H - 22, 18, 18).fill(DAWN.ink).stroke({ color: DAWN.light, width: 0.4 });
    this.root.addChild(frame);

    // Portrait sprite — the 11×10 blob bust.
    const portrait = new Graphics();
    drawSprite(portrait, SPR_BLOB_PORTRAIT, 5, H - 21);
    this.root.addChild(portrait);

    const name = pixelText('MIRA', DAWN.accent, 4);
    name.x = 26;
    name.y = H - 18;
    this.root.addChild(name);

    const line1 = pixelText('the prism-thorn is ready to harvest', DAWN.light, 3.5);
    line1.x = 26;
    line1.y = H - 12;
    this.root.addChild(line1);

    const press = pixelText('- press', DAWN.light, 3.5);
    press.x = 26;
    press.y = H - 7;
    this.root.addChild(press);

    const a = pixelText('A', DAWN.accent, 3.5);
    a.x = 46;
    a.y = H - 7;
    this.root.addChild(a);

    const tail = pixelText('to take a clipping.', DAWN.light, 3.5);
    tail.x = 50;
    tail.y = H - 7;
    this.root.addChild(tail);

    // Blinking next-arrow ▶ in the bottom-right corner of the box.
    this.cursor.rect(W - 8, H - 7, 3, 1).rect(W - 7, H - 6, 1, 1).fill(DAWN.accent);
    this.root.addChild(this.cursor);
  }

  update(time: SolTime): void {
    this.phaseLabel.text = `${time.named} · sol ${time.sol}`;
    this.clockLabel.text = time.clock;

    // Clock icons swap to the moon at night.
    if (time.named === 'night') {
      this.clockSunIcon.clear().rect(W - 22, 3, 5, 3).fill(MOON_COLOR);
      this.clockMoonIcon.clear().rect(W - 12, 3, 3, 3).fill({ color: MOON_COLOR, alpha: 0.5 });
    } else {
      this.clockSunIcon.clear().rect(W - 22, 3, 5, 3).fill(SUN_COLOR);
      this.clockMoonIcon.clear().rect(W - 12, 3, 3, 3).fill(SUN2_COLOR);
    }

    // Cursor blink — 1s loop, 50/50 on/off. Done in update so the binary
    // toggle stays aligned with the engine clock, not a CSS timeline.
    this.cursorTimer += 1 / 60;
    if (this.cursorTimer >= 0.5) {
      this.cursorTimer = 0;
      this.cursorState = !this.cursorState;
      this.cursor.alpha = this.cursorState ? 1 : 0;
    }
  }
}
