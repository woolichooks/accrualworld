import { Container, Graphics, Rectangle } from 'pixi.js';
import { DAWN } from '../engine/palette';
import { drawPixelText, measureTextWidth } from '../engine/pixel-text';
import { drawSprite } from '../engine/sprite';
import { ALL_PLANTS } from '../sprites/plants';
import type { Bed, Stage } from '../state/types';

const SWAY_VARIANTS = [
  { period: 3.0, phaseOffset: 0 },
  { period: 2.4, phaseOffset: -0.7 },
  { period: 3.6, phaseOffset: -1.4 },
];

// Generic 5×6 sprout used during the SPROUT stage regardless of species.
// Lifted from the prototype's harvest-cycle sprout (art-pocket.jsx).
const SPROUT_PATTERN = `
..g..
.ggg.
g.g.g
..p..
..p..
.ppo.
`;

// Single white-cloud puff for the PUFF stage.
const PUFF_PATTERN = `
..ll.....
.llllll..
llllllll.
.llllll..
..ll.....
`;

// Empty-bed indicator: one soil pixel + a tiny lighter pixel above.
const EMPTY_HINT_PATTERN = `
.S.
.s.
`;

const STAGE_FX_DURATION_MS = 1000;
const READY_FLASH_HZ = 2.6;

export class BedView {
  readonly root = new Container();
  readonly hitArea: Rectangle;
  onTap: ((bedIndex: number) => void) | null = null;

  private bed: Bed;
  private spriteLayer = new Container();
  private fxLayer = new Container();
  private readyTag = new Container();
  private renderedStage: Stage | null = null;
  private renderedSpecies: string | null = null;
  private fxActive = false;
  private fxStartMs = 0;

  constructor(bed: Bed) {
    this.bed = bed;
    this.root.x = bed.x;
    this.root.y = bed.y;

    // Hit area covers the 14×14 plant footprint. Slightly inflated horizontally
    // so the click target stays usable through sway rotation.
    this.hitArea = new Rectangle(-1, 0, 16, 16);
    this.root.eventMode = 'static';
    this.root.cursor = 'pointer';
    this.root.hitArea = this.hitArea;
    this.root.on('pointertap', () => this.onTap?.(bed.index));

    this.root.addChild(this.spriteLayer, this.readyTag, this.fxLayer);
    this.buildReadyTag();
  }

  private buildReadyTag(): void {
    // Tag fits 6-char "READY!" at the 5×7 font (36 + 4 padding = 40 wide).
    const tagW = measureTextWidth('READY!') + 4;
    const bg = new Graphics();
    bg.rect(-2, -10, tagW, 9).fill(DAWN.accent);
    this.readyTag.addChild(bg);

    const text = new Graphics();
    drawPixelText(text, 'READY!', 0, -9, DAWN.ink);
    this.readyTag.addChild(text);
    this.readyTag.visible = false;
  }

  triggerHarvestFx(nowMs: number): void {
    this.fxActive = true;
    this.fxStartMs = nowMs;
  }

  update(stage: Stage, nowMs: number, elapsedSec: number): void {
    // Re-render the sprite layer only when the visible state actually changes.
    // Per-frame work below is limited to transforms and the FX layer.
    const species = this.bed.species ?? '';
    if (stage !== this.renderedStage || species !== this.renderedSpecies) {
      this.renderStage(stage);
      this.renderedStage = stage;
      this.renderedSpecies = species;
    }

    // Plant sway (only meaningful for the BLOOM stage's full-size sprite).
    if (stage === 'bloom' && this.spriteLayer.children[0]) {
      const variant = SWAY_VARIANTS[this.bed.swayVariant];
      const t = (elapsedSec + variant.phaseOffset) / variant.period;
      const eased = Math.sin(t * Math.PI);
      this.spriteLayer.children[0].rotation = (eased * 2.4 * Math.PI) / 180;
    }

    // READY tag flashes above bloom — accent yellow plate with ink text, on
    // 50/50 visible/hidden cadence so it reads as urgent without being noisy.
    if (stage === 'bloom') {
      const flash = Math.floor(elapsedSec * READY_FLASH_HZ) % 2 === 0;
      this.readyTag.visible = flash;
    } else {
      this.readyTag.visible = false;
    }

    // Harvest FX layer — BURST radial sparkles + LOOT float-up.
    if (this.fxActive) {
      const fxElapsed = nowMs - this.fxStartMs;
      if (fxElapsed >= STAGE_FX_DURATION_MS) {
        this.fxLayer.removeChildren();
        this.fxActive = false;
      } else {
        this.renderFx(fxElapsed);
      }
    }
  }

  private renderStage(stage: Stage): void {
    this.spriteLayer.removeChildren();
    switch (stage) {
      case 'empty': {
        const g = new Graphics();
        drawSprite(g, EMPTY_HINT_PATTERN, 6, 13);
        this.spriteLayer.addChild(g);
        return;
      }
      case 'puff': {
        const g = new Graphics();
        drawSprite(g, PUFF_PATTERN, 3, 7);
        this.spriteLayer.addChild(g);
        return;
      }
      case 'sprout': {
        const g = new Graphics();
        drawSprite(g, SPROUT_PATTERN, 5, 8);
        this.spriteLayer.addChild(g);
        return;
      }
      case 'young':
      case 'bloom': {
        const species = this.bed.species;
        if (!species) return;
        const g = new Graphics();
        drawSprite(g, ALL_PLANTS[species]);
        g.pivot.set(7, 14);
        g.position.set(7, 14);
        // YOUNG is the same sprite at 75% height — same silhouette, smaller.
        g.scale.y = stage === 'young' ? 0.75 : 1;
        this.spriteLayer.addChild(g);
        return;
      }
    }
  }

  private renderFx(fxElapsed: number): void {
    this.fxLayer.removeChildren();

    // BURST radial sparkle — 0–500ms, scales 0.6 → 2.0, fades out.
    if (fxElapsed < 500) {
      const t = fxElapsed / 500;
      const scale = 0.6 + 1.4 * t;
      const alpha = 1 - t;
      const burst = new Graphics();
      const sparks: Array<[number, number, number]> = [
        [7, 7, DAWN.accent],
        [1, 2, DAWN.accent],
        [12, 2, DAWN.accent],
        [-1, 7, DAWN.light],
        [14, 7, DAWN.light],
        [2, 12, DAWN.accent],
        [11, 12, DAWN.accent],
        [0, 0, DAWN.warm],
        [13, 0, DAWN.warm],
      ];
      for (const [x, y, color] of sparks) {
        burst.rect(x, y, 1, 1).fill(color);
      }
      burst.pivot.set(7, 7);
      burst.position.set(7, 7);
      burst.scale.set(scale);
      burst.alpha = alpha;
      this.fxLayer.addChild(burst);
    }

    // LOOT — a tiny crystal + "+1" floating up over the second half of the FX.
    if (fxElapsed > 200) {
      const t = Math.min(1, (fxElapsed - 200) / 800);
      const dy = -10 * t;
      const loot = new Container();
      const crystal = new Graphics();
      drawSprite(crystal, '.y.\nyyy\n.y.', 5, 4);
      loot.addChild(crystal);
      const label = new Graphics();
      drawPixelText(label, '+1', 10, 3, DAWN.accent);
      loot.addChild(label);
      loot.y = dy;
      loot.alpha = 1 - Math.max(0, t - 0.7) / 0.3;
      this.fxLayer.addChild(loot);
    }
  }
}
