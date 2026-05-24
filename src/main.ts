import { Application, Container } from 'pixi.js';
import { SCREEN_BG } from './engine/palette';
import { getSolTime } from './engine/time';
import { GardenScene, SCREEN_H, SCREEN_W } from './scenes/garden';
import { GardenState } from './state/garden-state';
import { SPECIES_LABEL } from './state/types';
import type { PlantId } from './sprites/plants';
import { HUD } from './ui/hud';
import { DialoguePanel } from './ui/dialogue';

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

  const stage = new Container();
  stage.scale.set(scale);
  app.stage.addChild(stage);

  const now = (): number => performance.now();
  const garden = new GardenState(now());
  const scene = new GardenScene(garden);
  stage.addChild(scene.root);

  const hud = new HUD();
  stage.addChild(hud.root);

  const dialogue = new DialoguePanel();
  stage.addChild(dialogue.root);

  let pendingBed: number | null = null;

  // Wire bed taps — ripe → harvest, empty → open seed picker.
  for (const view of scene.bedViews) {
    view.onTap = (bedIndex: number): void => {
      const bed = garden.beds[bedIndex];
      const stage = garden.stageOf(bed, now());
      if (stage === 'bloom') {
        const species = garden.harvest(bedIndex, now());
        if (species) {
          view.triggerHarvestFx(now());
          const total = garden.inventory.get(species) ?? 0;
          dialogue.showHint(
            `+1 ${SPECIES_LABEL[species]}  (×${total} total)`,
            { press: '- tap another plant or empty bed.', key: '', tail: '' },
          );
        }
      } else if (stage === 'empty') {
        pendingBed = bedIndex;
        dialogue.showPicker();
      }
      // Other stages (puff/sprout/young) — no-op, growing.
    };
  }

  dialogue.onSeedSelected = (species: PlantId): void => {
    if (pendingBed === null) return;
    const planted = garden.plant(pendingBed, species, now());
    if (planted) {
      dialogue.showHint(`planted ${SPECIES_LABEL[species]}.`, {
        press: '- it will bloom in ~18s.',
        key: '',
        tail: '',
      });
      pendingBed = null;
    }
  };
  dialogue.onCancel = (): void => {
    pendingBed = null;
    showDefaultHint();
  };

  function showDefaultHint(): void {
    dialogue.showHint('the prism-thorn is ready to harvest', {
      press: '- press',
      key: 'A',
      tail: 'to take a clipping.',
    });
  }
  showDefaultHint();

  const refit = (): void => {
    const next = computeIntegerScale(slot);
    if (next === stage.scale.x) return;
    stage.scale.set(next);
    app.renderer.resize(SCREEN_W * next, SCREEN_H * next);
  };
  window.addEventListener('resize', refit);
  new ResizeObserver(refit).observe(slot);

  const start = now();
  app.ticker.add(() => {
    const elapsedMs = now() - start;
    const elapsedSeconds = elapsedMs / 1000;
    const time = getSolTime(elapsedMs);
    scene.update(time, elapsedSeconds, now());
    hud.update(time);
    dialogue.update();
    garden.pruneFx(now(), 1500);
  });
}

function computeIntegerScale(slot: HTMLElement): number {
  const rect = slot.getBoundingClientRect();
  const availW = Math.max(1, rect.width - 4);
  const availH = Math.max(1, rect.height - 4);
  const sx = Math.floor(availW / SCREEN_W);
  const sy = Math.floor(availH / SCREEN_H);
  return Math.max(1, Math.min(sx, sy));
}

void boot();
