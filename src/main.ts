import './style.css';
import { Input } from './input';
import { PALETTES, type PaletteName } from './palette';
import { drawText, textWidth } from './font';
import { GardenScene } from './garden';
import type { Scene } from './scene';
import { loadRun, newRun, clearRun } from './save';
import { registerTitle } from './gameover';
import { DIFFICULTY, type Difficulty } from './types';

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

const defaultPalette: PaletteName = 'acrid';
document.getElementById('powerled')!.classList.add('on');

// ---- Title scene ---------------------------------------------------------
class TitleScene implements Scene {
  private t = 0;
  private stars: { x: number; y: number; phase: number }[] = [];
  // Two-step menu: main -> difficulty (only when starting a new run).
  private mainIdx = 0;            // 0 CONTINUE, 1 NEW RUN
  private picking = false;        // true while the difficulty submenu is open
  private diffIdx = 1;            // default cursor lands on NORMAL
  private readonly diffs: Difficulty[] = ['easy', 'normal', 'hard'];
  private hasSave = loadRun() !== null;

  constructor() {
    for (let i = 0; i < 28; i++) {
      this.stars.push({
        x: Math.floor(Math.random() * SCREEN_W),
        y: Math.floor(Math.random() * (SCREEN_H - 50)),
        phase: Math.random() * Math.PI * 2,
      });
    }
    if (!this.hasSave) this.mainIdx = 1;
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;

    if (this.picking) {
      if (input.justPressed('up')) this.diffIdx = (this.diffIdx + 2) % 3;
      if (input.justPressed('down')) this.diffIdx = (this.diffIdx + 1) % 3;
      if (input.justPressed('b')) { this.picking = false; return null; }
      if (input.justPressed('a') || input.justPressed('start')) {
        clearRun();
        return new GardenScene(newRun(this.diffs[this.diffIdx]));
      }
      return null;
    }

    if (this.hasSave && (input.justPressed('up') || input.justPressed('down'))) {
      this.mainIdx = 1 - this.mainIdx;
    }
    if (input.justPressed('start') || input.justPressed('a')) {
      if (this.mainIdx === 0 && this.hasSave) {
        return new GardenScene(loadRun()!);
      }
      this.picking = true;
      return null;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    for (const s of this.stars) {
      const tw = Math.sin(this.t * 2 + s.phase);
      ctx.fillStyle = tw > 0.6 ? p[3] : tw > 0 ? p[2] : p[1];
      ctx.fillRect(s.x, s.y, 1, 1);
    }

    // Horizon
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

    const domeX = 110, domeY = SCREEN_H - 40;
    ctx.fillStyle = p[2];
    ctx.fillRect(domeX, domeY, 14, 6);
    ctx.fillRect(domeX + 2, domeY - 2, 10, 2);
    ctx.fillRect(domeX + 4, domeY - 4, 6, 2);
    ctx.fillStyle = p[3];
    ctx.fillRect(domeX + 6, domeY - 4, 2, 1);

    const title = 'ACCRUALWORLD';
    drawText(ctx, title, Math.floor((SCREEN_W - textWidth(title)) / 2), 24, p[3]);
    const sub = 'A LEDGER ON SOIL 9';
    drawText(ctx, sub, Math.floor((SCREEN_W - textWidth(sub)) / 2), 36, p[2]);

    if (this.picking) {
      this.drawDifficultyPicker(ctx, p);
      return;
    }

    // Main menu
    const opts: { label: string; enabled: boolean }[] = [
      { label: 'CONTINUE', enabled: this.hasSave },
      { label: 'NEW RUN',  enabled: true },
    ];
    for (let i = 0; i < opts.length; i++) {
      const o = opts[i];
      const label = o.label;
      const y = 72 + i * 12;
      const x = Math.floor((SCREEN_W - textWidth(label)) / 2);
      const dim = !o.enabled;
      const focused = i === this.mainIdx;
      const color = dim ? p[1] : focused ? p[3] : p[2];
      drawText(ctx, label, x, y, color);
      if (focused && Math.floor(this.t * 2) % 2 === 0) {
        drawText(ctx, '>', x - 6, y, p[3]);
      }
    }

    const hint = 'D-PAD + A/START';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[2]);
  }

  private drawDifficultyPicker(ctx: CanvasRenderingContext2D, p: readonly string[]): void {
    const label = 'PICK DIFFICULTY';
    drawText(ctx, label, Math.floor((SCREEN_W - textWidth(label)) / 2), 56, p[3]);
    for (let i = 0; i < this.diffs.length; i++) {
      const d = this.diffs[i];
      const cfg = DIFFICULTY[d];
      const y = 72 + i * 10;
      const focused = i === this.diffIdx;
      const color = focused ? p[3] : p[2];
      const x = 18;
      drawText(ctx, cfg.label, x, y, color);
      if (focused && Math.floor(this.t * 2) % 2 === 0) {
        drawText(ctx, '>', x - 6, y, p[3]);
      }
    }
    // Blurb for the focused option, wrapped lightly.
    const blurb = DIFFICULTY[this.diffs[this.diffIdx]].blurb;
    drawText(ctx, blurb, Math.floor((SCREEN_W - textWidth(blurb)) / 2), 110, p[2]);
    const hint = 'A/START:BEGIN  B:BACK';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[2]);
  }
}

// Give the game-over scene a way to construct a fresh TitleScene
// without importing main.ts (which would cycle).
registerTitle(() => new TitleScene());

let scene: Scene = new TitleScene();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const next = scene.update(dt, input);
  if (next) scene = next;
  const paletteName = scene.paletteName?.() ?? defaultPalette;
  scene.draw(ctx, PALETTES[paletteName]);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
