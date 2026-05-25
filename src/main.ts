import './style.css';
import { Input } from './input';
import { PALETTES, type PaletteName } from './palette';
import { drawText, textWidth } from './font';

const SCREEN_W = 160;
const SCREEN_H = 144;

// ---- Build the handheld DOM shell ----------------------------------------
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <div class="handheld" id="handheld">
    <div class="brand">
      <span>ACCRUALWORLD</span>
      <span class="led"><i class="dot" id="powerled"></i></span>
    </div>
    <div class="screen-frame">
      <div class="screen-label">DOT MATRIX WITH STEREO SOUND</div>
      <canvas id="screen" width="${SCREEN_W}" height="${SCREEN_H}"></canvas>
    </div>
    <div class="controls">
      <div class="dpad" aria-label="dpad">
        <button class="up"    data-btn="up"   aria-label="up"></button>
        <button class="down"  data-btn="down" aria-label="down"></button>
        <button class="left"  data-btn="left" aria-label="left"></button>
        <button class="right" data-btn="right" aria-label="right"></button>
        <div class="center"></div>
      </div>
      <div class="ab">
        <button data-btn="b" aria-label="b">B</button>
        <button data-btn="a" aria-label="a">A</button>
      </div>
      <div class="startsel">
        <div class="lbl"><button data-btn="select" aria-label="select"></button>SELECT</div>
        <div class="lbl"><button data-btn="start" aria-label="start"></button>START</div>
      </div>
    </div>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
const ctx = canvas.getContext('2d', { alpha: false })!;
ctx.imageSmoothingEnabled = false;

const input = new Input(app);

// ---- Tiny scene system ----------------------------------------------------
interface Scene {
  update(dt: number): Scene | null;
  draw(ctx: CanvasRenderingContext2D, p: readonly string[]): void;
}

let palette: PaletteName = 'acrid';
const powerled = document.getElementById('powerled')!;
powerled.classList.add('on');

// ---- Title scene ---------------------------------------------------------
class TitleScene implements Scene {
  private t = 0;
  private stars: { x: number; y: number; phase: number }[] = [];

  constructor() {
    // Background starfield, seeded but doesn't need to be reproducible.
    for (let i = 0; i < 28; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * SCREEN_W),
        y: Math.floor(Math.random() * (SCREEN_H - 40)),
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  update(dt: number): Scene | null {
    this.t += dt;
    if (input.justPressed('start') || input.justPressed('a')) {
      // Milestone 1 stops at title; pressing START flashes the screen.
      return new BootFlashScene();
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
    // Sky
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Stars (twinkle)
    for (const s of this.stars) {
      const tw = Math.sin(this.t * 2 + s.phase);
      ctx.fillStyle = tw > 0.6 ? p[3] : tw > 0 ? p[2] : p[1];
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Horizon silhouette: jagged alien hills
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 32, SCREEN_W, 32);
    ctx.fillStyle = p[0];
    for (let x = 0; x < SCREEN_W; x++) {
      const h =
        6 +
        Math.floor(4 * Math.sin(x * 0.12)) +
        Math.floor(3 * Math.sin(x * 0.37 + 1.3));
      ctx.fillRect(x, SCREEN_H - 32 - h, 1, h);
    }

    // A tiny biodome on the horizon
    const domeX = 110, domeY = SCREEN_H - 40;
    ctx.fillStyle = p[2];
    ctx.fillRect(domeX, domeY, 14, 6);
    ctx.fillRect(domeX + 2, domeY - 2, 10, 2);
    ctx.fillRect(domeX + 4, domeY - 4, 6, 2);
    ctx.fillStyle = p[3];
    ctx.fillRect(domeX + 6, domeY - 4, 2, 1); // light

    // Title
    const title = 'ACCRUALWORLD';
    const tw = textWidth(title);
    drawText(ctx, title, Math.floor((SCREEN_W - tw) / 2), 36, p[3]);

    const sub = 'A LEDGER ON SOIL 9';
    const sw = textWidth(sub);
    drawText(ctx, sub, Math.floor((SCREEN_W - sw) / 2), 50, p[2]);

    // Blinking PRESS START
    if (Math.floor(this.t * 1.8) % 2 === 0) {
      const ps = 'PRESS START';
      const pw = textWidth(ps);
      drawText(ctx, ps, Math.floor((SCREEN_W - pw) / 2), 96, p[3]);
    }

    // Footer
    const foot = 'V0.1  MILESTONE 1';
    drawText(ctx, foot, 4, SCREEN_H - 7, p[2]);
  }
}

// Brief flash so START feels connected; returns to title.
class BootFlashScene implements Scene {
  private t = 0;
  update(dt: number): Scene | null {
    this.t += dt;
    if (this.t > 0.35) return new TitleScene();
    return null;
  }
  draw(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
    const flash = this.t < 0.12 ? p[3] : this.t < 0.22 ? p[2] : p[1];
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    const msg = 'BOOTING COLONY OS...';
    drawText(ctx, msg, Math.floor((SCREEN_W - textWidth(msg)) / 2), 70, p[0]);
  }
}

let scene: Scene = new TitleScene();

// ---- Main loop -----------------------------------------------------------
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  const next = scene.update(dt);
  if (next) scene = next;

  const p = PALETTES[palette];
  scene.draw(ctx, p);

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
