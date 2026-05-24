import { Container, Graphics } from 'pixi.js';
import { DAWN, MOON_COLOR, SUN2_COLOR, SUN_COLOR } from '../engine/palette';
import { drawPixelText, PixelLabel } from '../engine/pixel-text';
import { drawSprite } from '../engine/sprite';
import { HEART_EMPTY, HEART_FULL } from '../sprites/tiles';
import type { SolTime } from '../engine/time';
import type { PlayerState } from '../state/player-state';
import { AIR_MAX, HP_MAX, SUIT_MAX } from '../state/player-state';

const W = 192;

const BAR_W = 74;
// 9 px tall so the 7-tall pixel font fits with 1-px padding top + bottom.
// Previous 7-tall bars clipped the bottom row of each glyph ("I" → "T").
const BAR_H = 9;
const BAR_X = 2;
const AIR_Y = 2;
const SUIT_Y = 13;
const HP_Y = 24;

// Outlined bar with a recolored fill that scales with the meter percentage.
// Color shifts grass → accent → warm as the meter falls (matches the
// prototype's .ps-air-bar palette cascade).
class StatusBar {
  readonly root = new Container();
  private fillG = new Graphics();
  private level = 100;

  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly label: string,
  ) {
    const bg = new Graphics();
    bg.rect(x, y, BAR_W, BAR_H).fill(DAWN.ink);
    this.root.addChild(bg);
    this.root.addChild(this.fillG);
    this.redraw();
  }

  setLevel(percent: number): void {
    const next = Math.max(0, Math.min(100, percent));
    if (Math.round(next) === Math.round(this.level)) return;
    this.level = next;
    this.redraw();
  }

  private redraw(): void {
    this.fillG.clear();
    const innerW = BAR_W - 4;
    const filled = Math.round(innerW * (this.level / 100));
    const color =
      this.level > 60 ? DAWN.grass : this.level > 25 ? DAWN.accent : DAWN.warm;
    if (filled > 0) {
      this.fillG.rect(this.x + 2, this.y + 2, filled, BAR_H - 4).fill(color);
    }
    // Label color picks ink-vs-cream based on which contrasts the fill
    // better at this level (grass and accent are bright → ink; warm-rose
    // and empty are darker → cream).
    const labelColor = this.level > 25 ? DAWN.ink : DAWN.cream;
    drawPixelText(this.fillG, this.label, this.x + 3, this.y + 1, labelColor);
    // Note: y+1 is correct now that BAR_H = 9 — text spans y+1 .. y+7, fully
    // inside the bar with a 1-px padding on top and bottom.
  }
}

export class HUD {
  readonly root = new Container();
  private airBar = new StatusBar(BAR_X, AIR_Y, 'AIR');
  private suitBar = new StatusBar(BAR_X, SUIT_Y, 'SUIT');
  private hpContainer = new Container();
  private hpHearts: Graphics[] = [];
  private lastHpBucket = -1;

  // Top-right column — phase + clock stacked so they don't fight the alert
  // sticker for top-center real estate.
  private phaseLabel = new PixelLabel(DAWN.light, 'DAWN 47');
  private clockLabel = new PixelLabel(DAWN.accent, '04:12');
  private clockSunIcon = new Graphics();
  private clockMoonIcon = new Graphics();

  private alertLayer = new Container();
  private alertVisible = false;
  private alertBlinkTimer = 0;
  private alertBlinkOn = true;

  constructor() {
    this.root.addChild(this.airBar.root, this.suitBar.root, this.hpContainer);
    this.buildHpHearts();
    this.buildPhaseLabel();
    this.buildClock();
    this.buildAlert();
  }

  private buildHpHearts(): void {
    const bg = new Graphics();
    bg.rect(BAR_X, HP_Y, BAR_W, 9).fill(DAWN.ink);
    this.hpContainer.addChild(bg);

    for (let i = 0; i < 5; i++) {
      const g = new Graphics();
      this.hpHearts.push(g);
      this.hpContainer.addChild(g);
    }
    this.renderHearts(5);
  }

  private renderHearts(filledCount: number): void {
    for (let i = 0; i < 5; i++) {
      const g = this.hpHearts[i];
      g.clear();
      drawSprite(g, i < filledCount ? HEART_FULL : HEART_EMPTY, BAR_X + 4 + i * 7, HP_Y + 2);
    }
  }

  private buildPhaseLabel(): void {
    const boxX = W - 50;
    const bg = new Graphics();
    bg.rect(boxX, AIR_Y, 48, 9).fill(DAWN.ink);
    this.root.addChild(bg);

    const arrow = new Graphics();
    arrow.rect(boxX + 2, AIR_Y + 4, 3, 1).rect(boxX + 3, AIR_Y + 5, 1, 1).fill(DAWN.accent);
    this.root.addChild(arrow);

    this.phaseLabel.root.x = boxX + 8;
    this.phaseLabel.root.y = AIR_Y + 1;
    this.root.addChild(this.phaseLabel.root);
  }

  private buildClock(): void {
    const boxX = W - 50;
    const bg = new Graphics();
    bg.rect(boxX, SUIT_Y, 48, 9).fill(DAWN.ink);
    this.root.addChild(bg);

    this.clockLabel.root.x = boxX + 3;
    this.clockLabel.root.y = SUIT_Y + 1;
    this.root.addChild(this.clockLabel.root);

    this.clockSunIcon.rect(W - 14, SUIT_Y + 3, 5, 3).fill(SUN_COLOR);
    this.clockMoonIcon.rect(W - 7, SUIT_Y + 3, 3, 3).fill(SUN2_COLOR);
    this.root.addChild(this.clockSunIcon, this.clockMoonIcon);
  }

  private buildAlert(): void {
    // ⚠ AIR LOW sticker — sits top-center on a warm-rose plate. Blinks
    // while active. Hidden by default.
    const stickerW = 56;
    const stickerX = (W - stickerW) / 2;
    const bgG = new Graphics();
    bgG.rect(stickerX, AIR_Y, stickerW, 9).fill(DAWN.warm);
    this.alertLayer.addChild(bgG);

    const textG = new Graphics();
    drawPixelText(textG, 'AIR LOW!', stickerX + 5, AIR_Y + 1, DAWN.ink);
    this.alertLayer.addChild(textG);

    this.alertLayer.visible = false;
    this.root.addChild(this.alertLayer);
  }

  update(time: SolTime, player: PlayerState, deltaMs: number): void {
    this.airBar.setLevel((player.air / AIR_MAX) * 100);
    this.suitBar.setLevel((player.suit / SUIT_MAX) * 100);
    const bucket = Math.max(0, Math.min(5, Math.ceil((player.hp / HP_MAX) * 5)));
    if (bucket !== this.lastHpBucket) {
      this.renderHearts(bucket);
      this.lastHpBucket = bucket;
    }

    const phaseShort = time.named === 'night' ? 'NITE' : time.named.toUpperCase();
    this.phaseLabel.setText(`${phaseShort} ${time.sol}`);
    this.clockLabel.setText(time.clock);
    if (time.named === 'night') {
      this.clockSunIcon.clear().rect(W - 14, SUIT_Y + 2, 5, 3).fill(MOON_COLOR);
      this.clockMoonIcon.clear().rect(W - 7, SUIT_Y + 2, 3, 3).fill({ color: MOON_COLOR, alpha: 0.5 });
    } else {
      this.clockSunIcon.clear().rect(W - 14, SUIT_Y + 2, 5, 3).fill(SUN_COLOR);
      this.clockMoonIcon.clear().rect(W - 7, SUIT_Y + 2, 3, 3).fill(SUN2_COLOR);
    }

    const shouldShow = player.airCritical() && !player.inBunker;
    if (shouldShow !== this.alertVisible) {
      this.alertVisible = shouldShow;
      this.alertLayer.visible = shouldShow;
      this.alertBlinkOn = true;
      this.alertBlinkTimer = 0;
      this.alertLayer.alpha = 1;
    }
    if (this.alertVisible) {
      this.alertBlinkTimer += deltaMs;
      if (this.alertBlinkTimer >= 450) {
        this.alertBlinkTimer = 0;
        this.alertBlinkOn = !this.alertBlinkOn;
        this.alertLayer.alpha = this.alertBlinkOn ? 1 : 0.25;
      }
    }
  }
}
