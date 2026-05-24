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
  PLANT_BELL,
  PLANT_CAP,
  PLANT_CRYS,
  PLANT_DREAM,
  PLANT_FERN,
  PLANT_ORB,
  PLANT_POD,
  PLANT_ROSE,
  PLANT_STAR,
  PLANT_THORN,
} from '../sprites/plants';
import { SPR_BLOB_BODY, SPR_BLOB_EYES_OPEN, SPR_BLOB_MOUTH, SPR_CAN_HELD } from '../sprites/blob';
import { TILE_SOIL } from '../sprites/tiles';

export const SCREEN_W = 192;
export const SCREEN_H = 116;

// Sway timing buckets — three classes so adjacent plants don't sway in sync.
// Matches @keyframes pp-sway in art-pocket.jsx: ±2.4° around bottom-center.
const SWAY_VARIANTS = [
  { period: 3.0, phaseOffset: 0 },
  { period: 2.4, phaseOffset: -0.7 },
  { period: 3.6, phaseOffset: -1.4 },
];

interface PlantBed {
  container: Container;
  swayInner: Container;
  variant: number;
  baseX: number;
  baseY: number;
}

interface Celestial {
  container: Container;
  // Waypoints: [phase, dx, dy, opacity]. Position is offset from screen center.
  waypoints: Array<[number, number, number, number]>;
}

export class GardenScene {
  readonly root = new Container();

  private skyRect = new Graphics();
  private groundRect = new Graphics();
  private starsContainer = new Container();
  private starTwinkle: Array<{ rect: Graphics; phase: number; period: number }> = [];
  private plants: PlantBed[] = [];
  private blobBody = new Container();
  private blobEyes = new Container();
  private blobMouth = new Container();

  private sun!: Celestial;
  private sun2!: Celestial;
  private moon!: Celestial;

  constructor() {
    this.buildSky();
    this.buildHorizon();
    this.buildStars();
    this.buildCelestials();
    this.buildMountains();
    this.buildGround();
    this.buildFence();
    this.buildSoilBeds();
    this.buildPlants();
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
      [8, 5, 1.8],
      [22, 12, 2.2],
      [38, 6, 1.4],
      [54, 14, 1.8],
      [72, 8, 2.2],
      [90, 16, 1.4],
      [108, 7, 1.8],
      [128, 12, 2.2],
      [148, 5, 1.4],
      [164, 16, 1.8],
      [180, 9, 2.2],
      [16, 22, 2.2],
      [46, 20, 1.4],
      [80, 24, 1.8],
      [120, 22, 2.2],
      [156, 26, 1.4],
    ];
    positions.forEach(([x, y, period], i) => {
      const rect = new Graphics().rect(x, y, 1, 1).fill(MOON_COLOR);
      this.starsContainer.addChild(rect);
      this.starTwinkle.push({ rect, phase: (i * 0.31) % 1, period });
    });
    this.root.addChild(this.starsContainer);
  }

  private buildCelestials(): void {
    // Primary sun — 8×6 with cap pixels and faint corona rays.
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
        [0.0, -110, 38, 0],
        [0.08, -90, 28, 1],
        [0.28, 0, -4, 1],
        [0.5, 70, 6, 1],
        [0.62, 95, 30, 1],
        [0.7, 115, 40, 0],
        [1.0, -110, 38, 0],
      ],
    };

    // Companion sun — smaller, rosier, trails slightly higher.
    const sun2 = new Container();
    const s2g = new Graphics();
    s2g.rect(-2, -2, 4, 1).rect(-3, -1, 6, 3).rect(-2, 2, 4, 1).fill(SUN2_COLOR);
    sun2.addChild(s2g);
    this.root.addChild(sun2);
    this.sun2 = {
      container: sun2,
      waypoints: [
        [0.0, -120, 44, 0],
        [0.14, -80, 24, 1],
        [0.35, -10, 4, 1],
        [0.55, 80, 14, 1],
        [0.66, 110, 36, 0],
        [1.0, -120, 44, 0],
      ],
    };

    // Moon — crescent, only visible at night.
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
        [0.0, -110, 38, 0],
        [0.65, -110, 38, 0],
        [0.72, -80, 24, 1],
        [0.85, 0, 0, 1],
        [0.95, 60, 8, 1],
        [1.0, 80, 24, 0],
      ],
    };
  }

  private buildMountains(): void {
    // Back ridge (primary).
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

    // Mid band (mid/periwinkle) — fills the gap below the ridge.
    const mid = new Graphics();
    const W = SCREEN_W;
    mid.rect(0, 50, W, 3).fill(DAWN.mid);
    this.root.addChild(mid);
  }

  private buildGround(): void {
    this.groundRect.rect(0, 58, SCREEN_W, SCREEN_H - 58).fill(GROUND_DAY);
    this.root.addChild(this.groundRect);
    // Periwinkle cap on the horizon.
    const cap = new Graphics();
    cap.rect(0, 58, SCREEN_W, 2).fill(DAWN.mid);
    this.root.addChild(cap);
  }

  private buildFence(): void {
    const fence = new Graphics();
    const posts = Math.floor(SCREEN_W / 6);
    for (let i = 0; i < posts; i++) {
      fence.rect(i * 6, 57, 1, 3);
    }
    for (let i = 0; i < posts; i++) {
      fence.rect(i * 6 + 1, 58, 5, 1);
    }
    fence.fill(DAWN.light);
    this.root.addChild(fence);
  }

  private buildSoilBeds(): void {
    const rows = [68, 92];
    rows.forEach((py) => {
      for (let c = 0; c < 5; c++) {
        const bed = new Graphics();
        drawSprite(bed, TILE_SOIL, 8 + c * 36, py);
        this.root.addChild(bed);
      }
    });
  }

  private buildPlants(): void {
    // Roster mirrors art-pocket.jsx — two rows × five beds. Indices into
    // SWAY_VARIANTS are picked so no two adjacent plants share a tempo.
    const roster: Array<[string, number, number, number]> = [
      [PLANT_BELL, 6, 56, 0],
      [PLANT_STAR, 42, 56, 1],
      [PLANT_FERN, 78, 56, 2],
      [PLANT_THORN, 114, 56, 0],
      [PLANT_DREAM, 150, 56, 1],
      [PLANT_POD, 6, 80, 1],
      [PLANT_CRYS, 42, 80, 0],
      [PLANT_ROSE, 78, 80, 2],
      [PLANT_CAP, 114, 80, 0],
      [PLANT_ORB, 150, 80, 1],
    ];
    for (const [pattern, x, y, variant] of roster) {
      const container = new Container();
      container.x = x;
      container.y = y;
      const swayInner = new Container();
      const g = new Graphics();
      drawSprite(g, pattern);
      // Pivot at bottom-center of the 14×14 sprite so rotation looks like
      // a stem-anchored sway, not a free spin.
      g.pivot.set(7, 14);
      g.position.set(7, 14);
      swayInner.addChild(g);
      container.addChild(swayInner);
      this.root.addChild(container);
      this.plants.push({
        container,
        swayInner: g as unknown as Container,
        variant,
        baseX: x,
        baseY: y,
      });
    }
  }

  private buildBlob(): void {
    const bodyG = new Graphics();
    drawSprite(bodyG, SPR_BLOB_BODY);
    bodyG.pivot.set(8, 16);
    bodyG.position.set(8, 16);
    this.blobBody.addChild(bodyG);
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

    this.root.addChild(this.blobBody, this.blobMouth, this.blobEyes);

    // Watering can off the right shoulder + a static drip cluster (drip
    // animation lands in milestone 2 with the harvest cycle).
    const can = new Graphics();
    drawSprite(can, SPR_CAN_HELD);
    can.x = 60;
    can.y = 68;
    this.root.addChild(can);
  }

  // === per-frame update ===

  update(time: SolTime, elapsedSeconds: number): void {
    // Sky tint.
    const skyColor = sampleStops(SKY_STOPS, time.phase);
    this.skyRect.clear().rect(0, 0, SCREEN_W, 58).fill(skyColor);

    // Ground — daylight on, night off, with soft cross-fades.
    const dayFactor = computeDayFactor(time.phase);
    const groundColor = lerp(GROUND_NIGHT, GROUND_DAY, dayFactor);
    this.groundRect.clear().rect(0, 58, SCREEN_W, SCREEN_H - 58).fill(groundColor);

    // Star backdrop — overall opacity follows night ramp; each star
    // individually twinkles on its own period.
    const baseStarAlpha = starOpacity(time.phase);
    this.starsContainer.alpha = baseStarAlpha;
    for (const star of this.starTwinkle) {
      const t = (elapsedSeconds / star.period + star.phase) % 1;
      star.rect.alpha = t < 0.5 ? 1 : 0.15;
    }

    // Celestials.
    this.applyArc(this.sun, time.phase, 80, 16);
    this.applyArc(this.sun2, time.phase, 80, 22);
    this.applyArc(this.moon, time.phase, 80, 14);

    // Plant sway — ±2.4° around bottom-center, three staggered tempos.
    for (const plant of this.plants) {
      const v = SWAY_VARIANTS[plant.variant];
      // ease-in-out alternate: sine over [period*2] is a good approximation.
      const t = (elapsedSeconds + v.phaseOffset) / v.period;
      const eased = Math.sin(t * Math.PI);
      plant.swayInner.rotation = (eased * 2.4 * Math.PI) / 180;
    }

    // Blob breathe — scaleY between 1.0 and 0.93 every 2.8s (sine).
    const breatheT = (elapsedSeconds % 2.8) / 2.8;
    const breatheScale = 1 - 0.035 * (1 - Math.cos(breatheT * Math.PI * 2));
    this.blobBody.scale.y = breatheScale;
    this.blobMouth.scale.y = breatheScale;

    // Blob blink — eyes invisible from 97%–99% of a 4.2s loop.
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

// Smoothed day vs night blend. 1.0 = full daylight, 0.0 = full night.
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
