import { Container, Graphics } from 'pixi.js';
import { DAWN } from '../engine/palette';
import { drawPixelText } from '../engine/pixel-text';
import { drawSprite } from '../engine/sprite';
import { SPR_BLOB_BODY, SPR_BLOB_EYES_OPEN, SPR_BLOB_MOUTH } from '../sprites/blob';
import { TILE_SHELF, TILE_WALL_STRIPE } from '../sprites/bunker';
import { SCREEN_H, SCREEN_W } from './garden';

// Minimal bunker interior — a striped purple wall, a wooden shelf line, and
// the blob standing inside in his civvies (no hazmat suit). The cauldron +
// crafting UI lands in M4; this scene's job in M3 is to be the safe zone
// where AIR/SUIT/HP stop ticking down.
export class BunkerScene {
  readonly root = new Container();
  private blobBody = new Container();
  private blobEyes = new Container();
  private blobMouth = new Container();

  constructor() {
    this.buildFloor();
    this.buildWall();
    this.buildShelf();
    this.buildSignage();
    this.buildBlob();
  }

  private buildFloor(): void {
    const floor = new Graphics();
    floor.rect(0, 0, SCREEN_W, SCREEN_H).fill(DAWN.soil);
    this.root.addChild(floor);
  }

  private buildWall(): void {
    // Repeat the 4-wide stripe across the top 2/3 of the screen.
    for (let x = 0; x < SCREEN_W; x += 4) {
      const g = new Graphics();
      drawSprite(g, TILE_WALL_STRIPE, x, 4);
      this.root.addChild(g);
    }
    // Floor band (darker soil) at the bottom.
    const band = new Graphics();
    band.rect(0, 70, SCREEN_W, SCREEN_H - 70).fill(DAWN.soil);
    this.root.addChild(band);
    const cap = new Graphics();
    cap.rect(0, 68, SCREEN_W, 2).fill(DAWN.ink);
    this.root.addChild(cap);
  }

  private buildShelf(): void {
    const shelf = new Graphics();
    for (let x = 12; x < SCREEN_W - 12; x += 16) {
      drawSprite(shelf, TILE_SHELF, x, 56);
    }
    this.root.addChild(shelf);

    // Placeholder cauldron silhouette in the middle — full UI in M4.
    const cauldron = new Graphics();
    cauldron
      .rect(82, 60, 28, 8)
      .rect(86, 56, 20, 4)
      .fill(DAWN.ink);
    cauldron.rect(88, 58, 16, 2).fill(DAWN.water);
    this.root.addChild(cauldron);
  }

  private buildSignage(): void {
    // Signage sits below the HUD bars (which top out at y=27) so the two
    // don't overlap when the bunker scene renders behind the HUD overlay.
    const sub = new Graphics();
    drawPixelText(sub, 'METERS HOLD HERE', 6, 36, DAWN.cream);
    this.root.addChild(sub);

    const tag = new Graphics();
    drawPixelText(tag, 'CAULDRON · M4', 105, 50, DAWN.warm);
    this.root.addChild(tag);
  }

  private buildBlob(): void {
    const bodyG = new Graphics();
    drawSprite(bodyG, SPR_BLOB_BODY);
    bodyG.pivot.set(8, 16);
    bodyG.position.set(8, 16);
    this.blobBody.addChild(bodyG);
    this.blobBody.x = 50;
    this.blobBody.y = 82;

    const mouthG = new Graphics();
    drawSprite(mouthG, SPR_BLOB_MOUTH);
    mouthG.pivot.set(8, 16);
    mouthG.position.set(8, 16);
    this.blobMouth.addChild(mouthG);
    this.blobMouth.x = 50;
    this.blobMouth.y = 82;

    const eyesG = new Graphics();
    drawSprite(eyesG, SPR_BLOB_EYES_OPEN);
    this.blobEyes.addChild(eyesG);
    this.blobEyes.x = 50;
    this.blobEyes.y = 82;

    this.root.addChild(this.blobBody, this.blobMouth, this.blobEyes);
  }

  update(elapsedSeconds: number): void {
    const breatheT = (elapsedSeconds % 2.8) / 2.8;
    const breatheScale = 1 - 0.035 * (1 - Math.cos(breatheT * Math.PI * 2));
    this.blobBody.scale.y = breatheScale;
    this.blobMouth.scale.y = breatheScale;

    const blinkT = (elapsedSeconds % 4.2) / 4.2;
    this.blobEyes.alpha = blinkT > 0.97 && blinkT < 0.99 ? 0 : 1;
  }
}
