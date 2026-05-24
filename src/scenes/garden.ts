import { Container, Graphics } from 'pixi.js';
import {
  DAWN,
  GROUND_DAY,
  GROUND_NIGHT,
  MOON_COLOR,
  SKY_STOPS,
  SUN2_COLOR,
  SUN_COLOR,
  lerp,
  sampleStops,
} from '../engine/palette';
import { drawSprite } from '../engine/sprite';
import { type SolTime, starOpacity } from '../engine/time';
import {
  SPR_BLOB_BODY,
  SPR_BLOB_BODY_HAZMAT,
  SPR_BLOB_EYES_OPEN,
  SPR_BLOB_HELMET,
  SPR_BLOB_MOUTH,
  SPR_CAN_HELD,
} from '../sprites/blob';
import { TILE_SOIL } from '../sprites/tiles';
import { GardenState } from '../state/garden-state';
import { BedView } from './bed-view';

export const SCREEN_W = 192;
export const SCREEN_H = 116;

interface Celestial {
  container: Container;
  // Waypoints: [phase, dx, dy, opacity]. Position is offset from screen center.
  waypoints: Array<[number, number, number, number]>;
}

export class GardenScene {
  readonly root = new Container();
  readonly bedViews: BedView[];

  private skyRect = new Graphics();
  private groundRect = new Graphics();
  private starsContainer = new Container();
  private starTwinkle: Array<{ rect: Graphics; phase: number; period: number }> = [];
  private blobBody = new Container();
  private blobBodyG!: Graphics;
  private blobBodyHazmatG!: Graphics;
  private blobHelmet = new Container();
  private blobEyes = new Container();
  private blobMouth = new Container();
  private hazmat = false;

  private sun!: Celestial;
  private sun2!: Celestial;
  private moon!: Celestial;

  constructor(private state: GardenState) {
    this.buildSky();
    this.buildHorizon();
    this.buildStars();
    this.buildCelestials();
    this.buildMountains();
    this.buildGround();
    this.buildFence();
    this.buildSoilBeds();
    this.bedViews = this.buildBeds();
    this.buildBlob();
  }

  // === build ===

  private buildSky(): void {
    this.skyRect.rect(0, 0, SCREEN_W, 58).fill(0x4a3a7e);
    this.root.addChild(this.skyRect);
  }

  private buildHorizon(): void {
    const g = new Graphics();
    g.rect(0, 58, SCREEN_W, 1).fill(DAWN.primary);
    this.root.addChild(g);
  }

  private buildStars(): void {
    const positions: Array<[number, number, number]> = [
      [8, 5, 1.8], [22, 12, 2.2], [38, 6, 1.4], [54, 14, 1.8],
      [72, 8, 2.2], [90, 16, 1.4], [108, 7, 1.8], [128, 12, 2.2],
      [148, 5, 1.4], [164, 16, 1.8], [180, 9, 2.2], [16, 22, 2.2],
      [46, 20, 1.4], [80, 24, 1.8], [120, 22, 2.2], [156, 26, 1.4],
    ];
    positions.forEach(([x, y, period], i) => {
      const rect = new Graphics().rect(x, y, 1, 1).fill(MOON_COLOR);
      this.starsContainer.addChild(rect);
      this.starTwinkle.push({ rect, phase: (i * 0.31) % 1, period });
    });
    this.root.addChild(this.starsContainer);
  }

  private buildCelestials(): void {
    const sun = new Container();
    const sg = new Graphics();
    sg.rect(-3, -4, 6, 1).rect(-4, -3, 8, 6).rect(-3, 3, 6, 1).fill(SUN_COLOR);
    const corona = new Graphics();
    corona.rect(-7, -1, 1, 2).rect(6, -1, 1, 2).fill({ color: SUN_COLOR, alpha: 0.6 });
    sun.addChild(sg, corona);
    this.root.addChild(sun);
    this.sun = {
      container: sun,
      waypoints: [
        [0.0, -110, 38, 0], [0.08, -90, 28, 1], [0.28, 0, -4, 1],
        [0.5, 70, 6, 1], [0.62, 95, 30, 1], [0.7, 115, 40, 0],
        [1.0, -110, 38, 0],
      ],
    };

    const sun2 = new Container();
    const s2g = new Graphics();
    s2g.rect(-2, -2, 4, 1).rect(-3, -1, 6, 3).rect(-2, 2, 4, 1).fill(SUN2_COLOR);
    sun2.addChild(s2g);
    this.root.addChild(sun2);
    this.sun2 = {
      container: sun2,
      waypoints: [
        [0.0, -120, 44, 0], [0.14, -80, 24, 1], [0.35, -10, 4, 1],
        [0.55, 80, 14, 1], [0.66, 110, 36, 0], [1.0, -120, 44, 0],
      ],
    };

    const moon = new Container();
    const mg = new Graphics();
    mg.rect(-3, -3, 6, 1).rect(-4, -2, 8, 4).rect(-3, 2, 6, 1).fill(MOON_COLOR);
    const crescent = new Graphics();
    crescent.rect(-2, -2, 3, 3).fill({ color: 0x1a0a3e, alpha: 0.6 });
    crescent.rect(2, -1, 1, 1).rect(3, 1, 1, 1).fill({ color: 0x1a0a3e, alpha: 0.4 });
    moon.addChild(mg, crescent);
    this.root.addChild(moon);
    this.moon = {
      container: moon,
      waypoints: [
        [0.0, -110, 38, 0], [0.65, -110, 38, 0], [0.72, -80, 24, 1],
        [0.85, 0, 0, 1], [0.95, 60, 8, 1], [1.0, 80, 24, 0],
      ],
    };
  }

  private buildMountains(): void {
    const back = new Graphics();
    drawSprite(
      back,
      `
        .................................................................................................................................................................................
        ..................ppp..................................................................ppppp...........................ppppp...........................ppp.......................
        ..............ppppppppp.........................ppppp..............................ppppppppppppp..........ppp.......ppppppppppp..............ppppp..ppppppppp....................
        .........ppppppppppppppppp.................pppppppppppppp.............pppppppp..ppppppppppppppppppppp..pppppppppppppppppppppppppp........pppppppppppppppppppppppp................
      `,
      0,
      42,
    );
    this.root.addChild(back);

    const mid = new Graphics();
    mid.rect(0, 50, SCREEN_W, 3).fill(DAWN.mid);
    this.root.addChild(mid);
  }

  private buildGround(): void {
    this.groundRect.rect(0, 58, SCREEN_W, SCREEN_H - 58).fill(GROUND_DAY);
    this.root.addChild(this.groundRect);
    const cap = new Graphics();
    cap.rect(0, 58, SCREEN_W, 2).fill(DAWN.mid);
    this.root.addChild(cap);
  }

  private buildFence(): void {
    const fence = new Graphics();
    const posts = Math.floor(SCREEN_W / 6);
    for (let i = 0; i < posts; i++) fence.rect(i * 6, 57, 1, 3);
    for (let i = 0; i < posts; i++) fence.rect(i * 6 + 1, 58, 5, 1);
    fence.fill(DAWN.light);
    this.root.addChild(fence);
  }

  private buildSoilBeds(): void {
    [68, 92].forEach((py) => {
      for (let c = 0; c < 5; c++) {
        const bed = new Graphics();
        drawSprite(bed, TILE_SOIL, 8 + c * 36, py);
        this.root.addChild(bed);
      }
    });
  }

  private buildBeds(): BedView[] {
    return this.state.beds.map((bed) => {
      const view = new BedView(bed);
      this.root.addChild(view.root);
      return view;
    });
  }

  private buildBlob(): void {
    // Stack two body sprites — normal + hazmat — and toggle visibility based
    // on player.inBunker so we don't rebuild geometry every frame.
    this.blobBodyG = new Graphics();
    drawSprite(this.blobBodyG, SPR_BLOB_BODY);
    this.blobBodyG.pivot.set(8, 16);
    this.blobBodyG.position.set(8, 16);
    this.blobBody.addChild(this.blobBodyG);

    this.blobBodyHazmatG = new Graphics();
    drawSprite(this.blobBodyHazmatG, SPR_BLOB_BODY_HAZMAT);
    this.blobBodyHazmatG.pivot.set(8, 16);
    this.blobBodyHazmatG.position.set(8, 16);
    this.blobBodyHazmatG.visible = false;
    this.blobBody.addChild(this.blobBodyHazmatG);

    this.blobBody.x = 48;
    this.blobBody.y = 64;

    const mouthG = new Graphics();
    drawSprite(mouthG, SPR_BLOB_MOUTH);
    mouthG.pivot.set(8, 16);
    mouthG.position.set(8, 16);
    this.blobMouth.addChild(mouthG);
    this.blobMouth.x = 48;
    this.blobMouth.y = 64;

    const eyesG = new Graphics();
    drawSprite(eyesG, SPR_BLOB_EYES_OPEN);
    this.blobEyes.addChild(eyesG);
    this.blobEyes.x = 48;
    this.blobEyes.y = 64;

    // Helmet bubble — sits over the blob with a glassy alpha. Hidden in
    // civvies, visible with the hazmat suit.
    const helmetG = new Graphics();
    drawSprite(helmetG, SPR_BLOB_HELMET);
    this.blobHelmet.addChild(helmetG);
    this.blobHelmet.x = 48;
    this.blobHelmet.y = 48;
    this.blobHelmet.alpha = 0.55;
    this.blobHelmet.visible = false;

    this.root.addChild(this.blobBody, this.blobMouth, this.blobEyes, this.blobHelmet);

    const can = new Graphics();
    drawSprite(can, SPR_CAN_HELD);
    can.x = 60;
    can.y = 68;
    this.root.addChild(can);
  }

  setHazmat(on: boolean): void {
    if (on === this.hazmat) return;
    this.hazmat = on;
    this.blobBodyG.visible = !on;
    this.blobBodyHazmatG.visible = on;
    this.blobHelmet.visible = on;
  }

  // === per-frame update ===

  update(time: SolTime, elapsedSeconds: number, nowMs: number): void {
    const skyColor = sampleStops(SKY_STOPS, time.phase);
    this.skyRect.clear().rect(0, 0, SCREEN_W, 58).fill(skyColor);

    const dayFactor = computeDayFactor(time.phase);
    const groundColor = lerp(GROUND_NIGHT, GROUND_DAY, dayFactor);
    this.groundRect.clear().rect(0, 58, SCREEN_W, SCREEN_H - 58).fill(groundColor);

    const baseStarAlpha = starOpacity(time.phase);
    this.starsContainer.alpha = baseStarAlpha;
    for (const star of this.starTwinkle) {
      const t = (elapsedSeconds / star.period + star.phase) % 1;
      star.rect.alpha = t < 0.5 ? 1 : 0.15;
    }

    this.applyArc(this.sun, time.phase, 80, 16);
    this.applyArc(this.sun2, time.phase, 80, 22);
    this.applyArc(this.moon, time.phase, 80, 14);

    // Bed updates — each view computes its own stage from sol-time + redraws
    // only on stage transitions.
    for (let i = 0; i < this.state.beds.length; i++) {
      const bed = this.state.beds[i];
      const stage = this.state.stageOf(bed, nowMs);
      this.bedViews[i].update(stage, nowMs, elapsedSeconds);
    }

    const breatheT = (elapsedSeconds % 2.8) / 2.8;
    const breatheScale = 1 - 0.035 * (1 - Math.cos(breatheT * Math.PI * 2));
    this.blobBody.scale.y = breatheScale;
    this.blobMouth.scale.y = breatheScale;

    const blinkT = (elapsedSeconds % 4.2) / 4.2;
    this.blobEyes.alpha = blinkT > 0.97 && blinkT < 0.99 ? 0 : 1;
  }

  private applyArc(c: Celestial, phase: number, baseX: number, baseY: number): void {
    const { dx, dy, alpha } = sampleWaypoints(c.waypoints, phase);
    c.container.x = baseX + dx;
    c.container.y = baseY + dy;
    c.container.alpha = alpha;
  }
}

function computeDayFactor(phase: number): number {
  if (phase < 0.14) return phase / 0.14;
  if (phase < 0.55) return 1;
  if (phase < 0.68) return 1 - (phase - 0.55) / 0.13;
  return 0;
}

function sampleWaypoints(
  waypoints: Array<[number, number, number, number]>,
  phase: number,
): { dx: number; dy: number; alpha: number } {
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (phase >= a[0] && phase <= b[0]) {
      const span = b[0] - a[0];
      const t = span === 0 ? 0 : (phase - a[0]) / span;
      return {
        dx: a[1] + (b[1] - a[1]) * t,
        dy: a[2] + (b[2] - a[2]) * t,
        alpha: a[3] + (b[3] - a[3]) * t,
      };
    }
  }
  const last = waypoints[waypoints.length - 1];
  return { dx: last[1], dy: last[2], alpha: last[3] };
}
