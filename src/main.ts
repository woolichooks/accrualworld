import { Application, Container, Graphics } from 'pixi.js';
import { SCREEN_BG } from './engine/palette';
import { getSolTime } from './engine/time';
import { GardenScene, SCREEN_H, SCREEN_W } from './scenes/garden';
import { HUD } from './ui/hud';

async function boot(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app missing');

  // Pick the largest integer scale that fits the viewport — keeps every
  // logical pixel sharp. The design doc calls for ~3.7× inside the prototype
  // console; standalone we can go bigger.
  const scale = computeIntegerScale();
  const app = new Application();
  await app.init({
    width: SCREEN_W * scale,
    height: SCREEN_H * scale,
    background: SCREEN_BG,
    antialias: false,
    roundPixels: true,
  });
  host.appendChild(app.canvas);

  // Logical 192×116 screen lives inside a stage container scaled by `scale`.
  // All sprite coordinates are in logical pixels.
  const stage = new Container();
  stage.scale.set(scale);
  app.stage.addChild(stage);

  const garden = new GardenScene();
  stage.addChild(garden.root);

  // HUD sits on top of the garden inside the same logical pixel grid.
  const hud = new HUD();
  stage.addChild(hud.root);

  // Sky window is 0..58; HUD overlay extends from y=2. Add a 1-pixel inner
  // border to mimic the prototype's bezel/screen seam.
  const bezel = new Graphics();
  bezel.rect(0, 0, SCREEN_W, SCREEN_H).stroke({ color: 0x10052e, width: 1, alignment: 1 });
  stage.addChild(bezel);

  // Resize handler — recompute integer scale and re-mount the renderer.
  window.addEventListener('resize', () => {
    const next = computeIntegerScale();
    if (next === stage.scale.x) return;
    stage.scale.set(next);
    app.renderer.resize(SCREEN_W * next, SCREEN_H * next);
  });

  const start = performance.now();
  app.ticker.add(() => {
    const elapsedMs = performance.now() - start;
    const elapsedSeconds = elapsedMs / 1000;
    const time = getSolTime(elapsedMs);
    garden.update(time, elapsedSeconds);
    hud.update(time);
  });
}

function computeIntegerScale(): number {
  const padding = 80;
  const availableW = window.innerWidth - padding;
  const availableH = window.innerHeight - padding;
  const sx = Math.floor(availableW / SCREEN_W);
  const sy = Math.floor(availableH / SCREEN_H);
  return Math.max(2, Math.min(sx, sy));
}

void boot();
