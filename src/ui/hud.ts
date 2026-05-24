import { Container, Graphics } from 'pixi.js';
import { DAWN, MOON_COLOR, SUN2_COLOR, SUN_COLOR } from '../engine/palette';
import { PixelLabel } from '../engine/pixel-text';
import { drawSprite } from '../engine/sprite';
import { HEART_EMPTY, HEART_FULL } from '../sprites/tiles';
import type { SolTime } from '../engine/time';

const W = 192;

// Top-bar HUD: hearts, phase label, clock. The bottom-of-screen dialogue +
// seed picker live in DialoguePanel.
export class HUD {
  readonly root = new Container();

  private phaseLabel = new PixelLabel(DAWN.light, 'dawn · sol 47');
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

  private buildPhaseLabel(): void {
    const bg = new Graphics();
    bg.rect(W / 2 - 30, 2, 60, 7).fill(DAWN.ink);
    this.root.addChild(bg);

    // Animated little arrow that nudges up by 1 px on a 0.9s loop.
    const arrow = new Graphics();
    arrow.rect(W / 2 - 27, 4, 3, 1).rect(W / 2 - 26, 5, 1, 1).fill(DAWN.accent);
    this.root.addChild(arrow);

    this.phaseLabel.root.x = W / 2 - 22;
    this.phaseLabel.root.y = 3;
    this.root.addChild(this.phaseLabel.root);
  }

  private buildClock(): void {
    const bg = new Graphics();
    bg.rect(W - 50, 2, 48, 7).fill(DAWN.ink);
    this.root.addChild(bg);

    this.clockLabel.root.x = W - 47;
    this.clockLabel.root.y = 3;
    this.root.addChild(this.clockLabel.root);

    this.clockSunIcon.rect(W - 22, 3, 5, 3).fill(SUN_COLOR);
    this.clockMoonIcon.rect(W - 12, 3, 3, 3).fill(SUN2_COLOR);
    this.root.addChild(this.clockSunIcon, this.clockMoonIcon);
  }

  update(time: SolTime): void {
    this.phaseLabel.setText(`${time.named} · sol ${time.sol}`);
    this.clockLabel.setText(time.clock);

    if (time.named === 'night') {
      this.clockSunIcon.clear().rect(W - 22, 3, 5, 3).fill(MOON_COLOR);
      this.clockMoonIcon.clear().rect(W - 12, 3, 3, 3).fill({ color: MOON_COLOR, alpha: 0.5 });
    } else {
      this.clockSunIcon.clear().rect(W - 22, 3, 5, 3).fill(SUN_COLOR);
      this.clockMoonIcon.clear().rect(W - 12, 3, 3, 3).fill(SUN2_COLOR);
    }
  }
}
