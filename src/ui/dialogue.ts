import { Container, Graphics, Rectangle, Text, TextStyle } from 'pixi.js';
import { DAWN } from '../engine/palette';
import { drawSprite } from '../engine/sprite';
import { ALL_PLANTS, type PlantId } from '../sprites/plants';
import { SPR_BLOB_PORTRAIT } from '../sprites/blob';

const W = 192;
const H = 116;
const BOX_Y = H - 24;

// The bottom 22-px panel renders either MIRA's scripted hint OR the 10-slot
// seed picker. Both modes share the same inked box so the UI never reflows;
// we just swap which child layer is visible.

function makeText(content: string, color: number, size: number): Text {
  const style = new TextStyle({
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: size,
    fill: color,
    letterSpacing: 0,
  });
  return new Text({ text: content, style });
}

export class DialoguePanel {
  readonly root = new Container();
  onSeedSelected: ((species: PlantId) => void) | null = null;
  onCancel: (() => void) | null = null;

  private hintLayer = new Container();
  private pickerLayer = new Container();

  private line1!: Text;
  private line2Press!: Text;
  private line2Key!: Text;
  private line2Tail!: Text;
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
    const frame = new Graphics();
    frame
      .rect(4, BOX_Y + 2, 18, 18)
      .fill(DAWN.ink)
      .stroke({ color: DAWN.light, width: 0.4 });
    this.hintLayer.addChild(frame);

    const portrait = new Graphics();
    drawSprite(portrait, SPR_BLOB_PORTRAIT, 5, BOX_Y + 3);
    this.hintLayer.addChild(portrait);

    const name = makeText('MIRA', DAWN.accent, 4);
    name.x = 26;
    name.y = BOX_Y + 6;
    this.hintLayer.addChild(name);

    this.line1 = makeText('', DAWN.light, 3.5);
    this.line1.x = 26;
    this.line1.y = BOX_Y + 12;
    this.hintLayer.addChild(this.line1);

    this.line2Press = makeText('', DAWN.light, 3.5);
    this.line2Press.x = 26;
    this.line2Press.y = BOX_Y + 17;
    this.hintLayer.addChild(this.line2Press);

    this.line2Key = makeText('', DAWN.accent, 3.5);
    this.line2Key.y = BOX_Y + 17;
    this.hintLayer.addChild(this.line2Key);

    this.line2Tail = makeText('', DAWN.light, 3.5);
    this.line2Tail.y = BOX_Y + 17;
    this.hintLayer.addChild(this.line2Tail);

    this.cursor = new Graphics();
    this.cursor.rect(W - 8, BOX_Y + 17, 3, 1).rect(W - 7, BOX_Y + 18, 1, 1).fill(DAWN.accent);
    this.hintLayer.addChild(this.cursor);
  }

  private buildPickerLayer(): void {
    // Background catches clicks that miss every slot — treats them as cancel.
    // Added first so slot hit areas sit above it in z-order.
    const cancelBg = new Graphics();
    cancelBg.rect(2, BOX_Y, W - 4, 22).fill({ color: 0, alpha: 0 });
    cancelBg.eventMode = 'static';
    cancelBg.hitArea = new Rectangle(2, BOX_Y, W - 4, 22);
    cancelBg.on('pointertap', () => this.onCancel?.());
    this.pickerLayer.addChild(cancelBg);

    const title = makeText('CHOOSE A SEED', DAWN.accent, 4);
    title.x = 4;
    title.y = BOX_Y + 2;
    this.pickerLayer.addChild(title);

    const hint = makeText('tap to plant · elsewhere to cancel', DAWN.light, 3.5);
    hint.x = 4;
    hint.y = BOX_Y + 7;
    this.pickerLayer.addChild(hint);

    // 10 species across the full panel width.
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

      // Species icon scaled to fit the slot — the 14×14 sprite at 0.6× lands
      // around 8×8 which is fine for recognition at this UI size.
      const icon = new Graphics();
      drawSprite(icon, ALL_PLANTS[species]);
      icon.pivot.set(7, 7);
      icon.position.set(slotX + slotW / 2, slotY + 5);
      icon.scale.set(0.6);
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

  showHint(line1: string, line2?: { press: string; key: string; tail: string }): void {
    this.hintLayer.visible = true;
    this.pickerLayer.visible = false;
    this.line1.text = line1;
    if (line2) {
      this.line2Press.text = line2.press;
      this.line2Press.visible = true;
      this.line2Key.text = line2.key;
      this.line2Key.x = 26 + this.line2Press.width + 2;
      this.line2Key.visible = true;
      this.line2Tail.text = line2.tail;
      this.line2Tail.x = this.line2Key.x + this.line2Key.width + 2;
      this.line2Tail.visible = true;
      this.cursor.visible = true;
    } else {
      this.line2Press.visible = false;
      this.line2Key.visible = false;
      this.line2Tail.visible = false;
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
