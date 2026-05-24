import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { DAWN, MOON_COLOR, SUN2_COLOR, SUN_COLOR } from '../engine/palette';
import { drawSprite } from '../engine/sprite';
import { HEART_EMPTY, HEART_FULL } from '../sprites/tiles';
import type { SolTime } from '../engine/time';

const W = 192;

function pixelText(content: string, color: number, size = 4): Text {
  const style = new TextStyle({
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: size,
    fill: color,
    letterSpacing: 0,
  });
  return new Text({ text: content, style });
}

// Top-bar HUD: hearts, animated phase label, clock. The bottom-of-screen
// dialogue + seed picker live in DialoguePanel.
export class HUD {
  readonly root = new Container();

  private phaseLabel: Text;
  private clockLabel: Text;
  private clockSunIcon = new Graphics();
  private clockMoonIcon = new Graphics();

  constructor() {
    this.buildHearts();
    this.phaseLabel = this.buildPhaseLabel();
    this.clockLabel = this.buildClock();
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

  update(time: SolTime): void {
    this.phaseLabel.text = `${time.named} · sol ${time.sol}`;
    this.clockLabel.text = time.clock;

    if (time.named === 'night') {
      this.clockSunIcon.clear().rect(W - 22, 3, 5, 3).fill(MOON_COLOR);
      this.clockMoonIcon.clear().rect(W - 12, 3, 3, 3).fill({ color: MOON_COLOR, alpha: 0.5 });
    } else {
      this.clockSunIcon.clear().rect(W - 22, 3, 5, 3).fill(SUN_COLOR);
      this.clockMoonIcon.clear().rect(W - 12, 3, 3, 3).fill(SUN2_COLOR);
    }
  }
}
