import { Container, Graphics } from 'pixi.js';
import { DAWN, MOON_COLOR, SUN2_COLOR, SUN_COLOR } from '../engine/palette';
import { PixelLabel } from '../engine/pixel-text';
import { drawSprite } from '../engine/sprite';
import { HEART_EMPTY, HEART_FULL } from '../sprites/tiles';
import type { SolTime } from '../engine/time';

const W = 192;
const BAR_Y = 1;
const BAR_H = 10; // 7-tall font + 1.5 padding top/bottom (rounded)
const TEXT_Y = BAR_Y + 2;

// Top-bar HUD: hearts, phase label, clock. Bar expanded to 10px tall to fit
// the 5×7 font. The bottom dialogue + seed picker live in DialoguePanel.
export class HUD {
  readonly root = new Container();

  private phaseLabel = new PixelLabel(DAWN.light, 'DAWN 47');
  private clockLabel = new PixelLabel(DAWN.accent, '04:12');
  private clockSunIcon = new Graphics();
  private clockMoonIcon = new Graphics();

  constructor() {
    this.buildHearts();
    this.buildPhaseLabel();
    this.buildClock();
  }

  private buildHearts(): void {
    const bg = new Graphics();
    bg.rect(2, BAR_Y, 44, BAR_H).fill(DAWN.ink);
    this.root.addChild(bg);

    const filled = 4;
    const slots = [4, 12, 20, 28, 36];
    slots.forEach((x, i) => {
      const g = new Graphics();
      drawSprite(g, i < filled ? HEART_FULL : HEART_EMPTY, x, BAR_Y + 3);
      this.root.addChild(g);
    });
  }

  private buildPhaseLabel(): void {
    // 60-px box, centered. "DAWN 47" / "NOON 47" etc. all fit at 7 chars × 6 = 42 px,
    // leaving room for a left-side arrow nudge indicator.
    const boxX = W / 2 - 30;
    const bg = new Graphics();
    bg.rect(boxX, BAR_Y, 60, BAR_H).fill(DAWN.ink);
    this.root.addChild(bg);

    const arrow = new Graphics();
    arrow.rect(boxX + 3, BAR_Y + 5, 3, 1).rect(boxX + 4, BAR_Y + 6, 1, 1).fill(DAWN.accent);
    this.root.addChild(arrow);

    this.phaseLabel.root.x = boxX + 9;
    this.phaseLabel.root.y = TEXT_Y;
    this.root.addChild(this.phaseLabel.root);
  }

  private buildClock(): void {
    const bg = new Graphics();
    bg.rect(W - 50, BAR_Y, 48, BAR_H).fill(DAWN.ink);
    this.root.addChild(bg);

    this.clockLabel.root.x = W - 47;
    this.clockLabel.root.y = TEXT_Y;
    this.root.addChild(this.clockLabel.root);

    // Sun + companion icons to the right of the clock digits.
    this.clockSunIcon.rect(W - 16, BAR_Y + 3, 5, 4).fill(SUN_COLOR);
    this.clockMoonIcon.rect(W - 7, BAR_Y + 3, 4, 4).fill(SUN2_COLOR);
    this.root.addChild(this.clockSunIcon, this.clockMoonIcon);
  }

  update(time: SolTime): void {
    // Phase label: "DAWN 47" / "NOON 47" / "DUSK 47" / "NITE 47".
    const phaseShort = time.named === 'night' ? 'NITE' : time.named.toUpperCase();
    this.phaseLabel.setText(`${phaseShort} ${time.sol}`);
    this.clockLabel.setText(time.clock);

    if (time.named === 'night') {
      this.clockSunIcon.clear().rect(W - 16, BAR_Y + 3, 5, 4).fill(MOON_COLOR);
      this.clockMoonIcon.clear().rect(W - 7, BAR_Y + 3, 4, 4).fill({ color: MOON_COLOR, alpha: 0.5 });
    } else {
      this.clockSunIcon.clear().rect(W - 16, BAR_Y + 3, 5, 4).fill(SUN_COLOR);
      this.clockMoonIcon.clear().rect(W - 7, BAR_Y + 3, 4, 4).fill(SUN2_COLOR);
    }
  }
}
