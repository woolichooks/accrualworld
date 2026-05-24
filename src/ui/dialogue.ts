import { Container, Graphics, Rectangle } from 'pixi.js';
import { DAWN } from '../engine/palette';
import { drawPixelText, PixelLabel, measureTextWidth } from '../engine/pixel-text';
import { drawSprite } from '../engine/sprite';
import { ALL_PLANTS, type PlantId } from '../sprites/plants';
import { SPR_BLOB_PORTRAIT } from '../sprites/blob';

const W = 192;
const H = 116;
const BOX_Y = H - 24;

// The bottom 22-px panel renders either MIRA's scripted hint OR the 10-slot
// seed picker. Both modes share the same inked box so the UI never reflows.
//
// Copy is shorter than the design prototype's lowercase JetBrains Mono lines
// — the 5×7 pixel font trades verbosity for crispness. Two lines of 7-tall
// text fit comfortably in the 22-px box with a 9-px line height.
export class DialoguePanel {
  readonly root = new Container();
  onSeedSelected: ((species: PlantId) => void) | null = null;
  onCancel: (() => void) | null = null;

  private hintLayer = new Container();
  private pickerLayer = new Container();

  private line1 = new PixelLabel(DAWN.accent);
  private line2Press = new PixelLabel(DAWN.light);
  private line2Key = new PixelLabel(DAWN.accent);
  private line2Tail = new PixelLabel(DAWN.light);
  private cursor!: Graphics;
  private cursorOn = true;
  private cursorTimer = 0;

  constructor() {
    this.buildBox();
    this.buildHintLayer();
    this.buildPickerLayer();
    this.pickerLayer.visible = false;
  }

  private buildBox(): void {
    const box = new Graphics();
    box.rect(2, BOX_Y, W - 4, 22).fill(DAWN.ink);
    this.root.addChild(box);
    this.root.addChild(this.hintLayer, this.pickerLayer);
  }

  private buildHintLayer(): void {
    // Portrait frame + bust — character identification. The MIRA name label
    // was dropped after it overlapped the headline; the portrait does the
    // identifying and the panel reads cleaner without the redundant text.
    const frame = new Graphics();
    frame
      .rect(4, BOX_Y + 2, 18, 18)
      .fill(DAWN.ink)
      .stroke({ color: DAWN.light, width: 0.4 });
    this.hintLayer.addChild(frame);

    const portrait = new Graphics();
    drawSprite(portrait, SPR_BLOB_PORTRAIT, 5, BOX_Y + 3);
    this.hintLayer.addChild(portrait);

    // Two text rows: headline (line1) at y=BOX_Y+4, action below at +13.
    // 7-tall font × 2 + 2-px gap = 16 px, sits inside the 22-px box with
    // 3-px top padding and 3-px bottom padding.
    this.line1.root.x = 26;
    this.line1.root.y = BOX_Y + 4;
    this.hintLayer.addChild(this.line1.root);

    this.line2Press.root.y = BOX_Y + 13;
    this.hintLayer.addChild(this.line2Press.root);
    this.line2Key.root.y = BOX_Y + 13;
    this.hintLayer.addChild(this.line2Key.root);
    this.line2Tail.root.y = BOX_Y + 13;
    this.hintLayer.addChild(this.line2Tail.root);

    this.cursor = new Graphics();
    drawPixelText(this.cursor, '▶', W - 10, BOX_Y + 13, DAWN.accent);
    this.hintLayer.addChild(this.cursor);
  }

  private buildPickerLayer(): void {
    // Background catches clicks that miss every slot — treats them as cancel.
    const cancelBg = new Graphics();
    cancelBg.rect(2, BOX_Y, W - 4, 22).fill({ color: 0, alpha: 0 });
    cancelBg.eventMode = 'static';
    cancelBg.hitArea = new Rectangle(2, BOX_Y, W - 4, 22);
    cancelBg.on('pointertap', () => this.onCancel?.());
    this.pickerLayer.addChild(cancelBg);

    const titleG = new Graphics();
    drawPixelText(titleG, 'PICK SEED', 4, BOX_Y + 3, DAWN.accent);
    this.pickerLayer.addChild(titleG);

    // 10 species across the panel width.
    const speciesList = Object.keys(ALL_PLANTS) as PlantId[];
    const slotW = 17;
    const gap = 1.5;
    speciesList.forEach((species, i) => {
      const slotX = 4 + i * (slotW + gap);
      const slotY = BOX_Y + 12;

      const slot = new Container();
      const bg = new Graphics();
      bg.rect(slotX, slotY, slotW, 10).fill(DAWN.primary);
      slot.addChild(bg);

      const icon = new Graphics();
      drawSprite(icon, ALL_PLANTS[species]);
      icon.pivot.set(7, 7);
      icon.position.set(slotX + slotW / 2, slotY + 5);
      icon.scale.set(0.62);
      slot.addChild(icon);

      slot.eventMode = 'static';
      slot.cursor = 'pointer';
      slot.hitArea = new Rectangle(slotX, slotY, slotW, 10);
      slot.on('pointertap', (e) => {
        e.stopPropagation();
        this.onSeedSelected?.(species);
      });

      this.pickerLayer.addChild(slot);
    });
  }

  // Single-line hint. If `action` is given, it appears on its own line below
  // with the key letter colored — e.g. ("PRISM-THORN", { press: "(", key: "A", tail: ") HARVEST" }).
  showHint(headline: string, action?: { press: string; key: string; tail: string }): void {
    this.hintLayer.visible = true;
    this.pickerLayer.visible = false;
    this.line1.setText(headline);
    if (action) {
      // Headline stays at row 1, action below it at row 2.
      this.line1.root.y = BOX_Y + 4;

      this.line2Press.setText(action.press);
      this.line2Press.root.x = 26;
      this.line2Press.root.visible = !!action.press;

      this.line2Key.setText(action.key);
      this.line2Key.root.x = 26 + measureTextWidth(action.press) + (action.press ? 2 : 0);
      this.line2Key.root.visible = !!action.key;

      this.line2Tail.setText(action.tail);
      this.line2Tail.root.x =
        this.line2Key.root.x + measureTextWidth(action.key) + (action.key ? 2 : 0);
      this.line2Tail.root.visible = !!action.tail;

      this.cursor.visible = true;
    } else {
      // No action — center the headline vertically inside the box.
      this.line1.root.y = BOX_Y + 8;
      this.line2Press.root.visible = false;
      this.line2Key.root.visible = false;
      this.line2Tail.root.visible = false;
      this.cursor.visible = false;
    }
  }

  showPicker(): void {
    this.hintLayer.visible = false;
    this.pickerLayer.visible = true;
  }

  update(): void {
    if (!this.cursor.visible) return;
    this.cursorTimer += 1 / 60;
    if (this.cursorTimer >= 0.5) {
      this.cursorTimer = 0;
      this.cursorOn = !this.cursorOn;
      this.cursor.alpha = this.cursorOn ? 1 : 0;
    }
  }
}
