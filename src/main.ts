import { Application, Container } from 'pixi.js';
import { SCREEN_BG } from './engine/palette';
import { getSolTime } from './engine/time';
import { BunkerScene } from './scenes/bunker';
import { GardenScene, SCREEN_H, SCREEN_W } from './scenes/garden';
import { GardenState } from './state/garden-state';
import { PlayerState } from './state/player-state';
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
  const player = new PlayerState();

  const gardenScene = new GardenScene(garden);
  const bunkerScene = new BunkerScene();
  stage.addChild(gardenScene.root, bunkerScene.root);

  // Start in the bunker so the player has a safe beat before stepping out.
  gardenScene.root.visible = false;
  bunkerScene.root.visible = true;

  const hud = new HUD();
  stage.addChild(hud.root);

  const dialogue = new DialoguePanel();
  stage.addChild(dialogue.root);

  let pendingBed: number | null = null;

  // --- bed interaction (garden only) ---
  for (const view of gardenScene.bedViews) {
    view.onTap = (bedIndex: number): void => {
      if (player.inBunker) return;
      const bed = garden.beds[bedIndex];
      const stage = garden.stageOf(bed, now());
      if (stage === 'bloom') {
        const species = garden.harvest(bedIndex, now());
        if (species) {
          view.triggerHarvestFx(now());
          const total = garden.inventory.get(species) ?? 0;
          dialogue.showHint(
            `+1 ${SPECIES_LABEL[species].toUpperCase()}`,
            { press: 'TOTAL', key: `×${total}`, tail: '' },
          );
        }
      } else if (stage === 'empty') {
        pendingBed = bedIndex;
        dialogue.showPicker();
      }
    };
  }

  dialogue.onSeedSelected = (species: PlantId): void => {
    if (pendingBed === null) return;
    const planted = garden.plant(pendingBed, species, now());
    if (planted) {
      dialogue.showHint(`PLANTED ${SPECIES_LABEL[species].toUpperCase()}`, {
        press: 'BLOOMS IN ~18S',
        key: '',
        tail: '',
      });
      pendingBed = null;
    }
  };
  dialogue.onCancel = (): void => {
    pendingBed = null;
    showHintForLocation();
  };

  // --- bunker toggle (B key) + on-screen hints ---
  function showHintForLocation(): void {
    if (player.inBunker) {
      dialogue.showHint('SAFE IN BUNKER', {
        press: '(',
        key: 'B',
        tail: ') GO OUTSIDE',
      });
    } else {
      dialogue.showHint('TEND THE GARDEN', {
        press: '(',
        key: 'B',
        tail: ') BACK TO BUNKER',
      });
    }
  }

  function applyLocationToScenes(): void {
    gardenScene.root.visible = !player.inBunker;
    bunkerScene.root.visible = player.inBunker;
    gardenScene.setHazmat(!player.inBunker);
  }
  applyLocationToScenes();
  showHintForLocation();

  window.addEventListener('keydown', (e) => {
    if (e.key === 'b' || e.key === 'B') {
      player.toggleBunker();
      applyLocationToScenes();
      showHintForLocation();
    }
  });

  // --- viewport refit ---
  const refit = (): void => {
    const next = computeIntegerScale(slot);
    if (next === stage.scale.x) return;
    stage.scale.set(next);
    app.renderer.resize(SCREEN_W * next, SCREEN_H * next);
  };
  window.addEventListener('resize', refit);
  new ResizeObserver(refit).observe(slot);

  // --- main loop ---
  let lastTickMs = now();
  const start = now();
  app.ticker.add(() => {
    const tickNow = now();
    const deltaMs = tickNow - lastTickMs;
    lastTickMs = tickNow;
    const elapsedMs = tickNow - start;
    const elapsedSeconds = elapsedMs / 1000;
    const time = getSolTime(elapsedMs);

    // Survival update; auto-resuscitate + dialog message on passout.
    const result = player.update(deltaMs);
    if (result.died) {
      player.resuscitate();
      applyLocationToScenes();
      dialogue.showHint('PASSED OUT', {
        press: 'RECOVERED IN BUNKER',
        key: '',
        tail: '',
      });
    }

    gardenScene.update(time, elapsedSeconds, tickNow);
    bunkerScene.update(elapsedSeconds);
    hud.update(time, player, deltaMs);
    dialogue.update();
    garden.pruneFx(tickNow, 1500);
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
