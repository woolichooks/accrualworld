import { Application, Container } from 'pixi.js';
import { SCREEN_BG } from './engine/palette';
import { getSolTime } from './engine/time';
import { GardenScene, SCREEN_H, SCREEN_W } from './scenes/garden';
import { HUD } from './ui/hud';

async function boot(): Promise<void> {
  const slot = document.getElementById('screen');
  if (!slot) throw new Error('#screen slot missing');

  const scale = computeIntegerScale(slot);
  const app = new Application();
  await app.init({
    width: SCREEN_W * scale,
    height: SCREEN_H * scale,
    background: SCREEN_BG,
    antialias: false,
    roundPixels: true,
  });
  slot.appendChild(app.canvas);

  // Logical 192×116 grid scaled up; sprites are in logical pixels.
  const stage = new Container();
  stage.scale.set(scale);
  app.stage.addChild(stage);

  const garden = new GardenScene();
  stage.addChild(garden.root);

  const hud = new HUD();
  stage.addChild(hud.root);

  // Re-fit on viewport change so the canvas always picks the largest integer
  // scale that fits the screen slot (slot itself is sized by CSS).
  const refit = (): void => {
    const next = computeIntegerScale(slot);
    if (next === stage.scale.x) return;
    stage.scale.set(next);
    app.renderer.resize(SCREEN_W * next, SCREEN_H * next);
  };
  window.addEventListener('resize', refit);
  new ResizeObserver(refit).observe(slot);

  const start = performance.now();
  app.ticker.add(() => {
    const elapsedMs = performance.now() - start;
    const elapsedSeconds = elapsedMs / 1000;
    const time = getSolTime(elapsedMs);
    garden.update(time, elapsedSeconds);
    hud.update(time);
  });
}

function computeIntegerScale(slot: HTMLElement): number {
  const rect = slot.getBoundingClientRect();
  // Account for the 2px screen border on each side.
  const availW = Math.max(1, rect.width - 4);
  const availH = Math.max(1, rect.height - 4);
  const sx = Math.floor(availW / SCREEN_W);
  const sy = Math.floor(availH / SCREEN_H);
  return Math.max(1, Math.min(sx, sy));
}

void boot();
