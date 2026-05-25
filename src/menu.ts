// Colony Console — a small modal menu opened with START from the
// garden. Surfaces VAULT, BREW, STATUS, CODEX, SLEEP, RESUME, and
// the conditional LAUNCH (visible only once the ship hull is full).

import { drawText, textWidth } from './font';
import { type Input } from './input';
import { type Palette } from './palette';
import { saveRun } from './save';
import type { Scene } from './scene';
import type { PaletteName } from './palette';
import { loadMeta } from './meta';
import { pickPuzzle } from './puzzles';
import { PuzzleScene, type PuzzleResult } from './puzzle';
import { BrewBenchScene } from './brew';
import { CodexScene } from './codex';
import { StatusScene } from './status';
import { sfx } from './audio';
import { WinScene } from './win';
import { DIFFICULTY, SHIP_PARTS_TARGET, type RunState, type SpeciesId } from './types';
import type { GardenScene } from './garden';

const SCREEN_W = 160;
const SCREEN_H = 144;
const ROW_H = 14;

interface MenuItem {
  label: string;
  hint: string;
  action: (ctx: MenuContext) => Scene | null;
}

interface MenuContext {
  state: RunState;
  prev: Scene;
  self: ConsoleMenu;
}

export class ConsoleMenu implements Scene {
  private state: RunState;
  private prev: Scene;
  private idx = 0;
  private toast: { msg: string; t: number } | null = null;
  private t = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'day';
  }

  flash(msg: string): void {
    this.toast = { msg, t: 2.0 };
  }

  // Build menu items each frame so LAUNCH appears the moment the
  // ship hull reaches the target.
  private items(): MenuItem[] {
    const items: MenuItem[] = [];
    if (this.state.shipParts >= SHIP_PARTS_TARGET) {
      items.push({
        label: 'LAUNCH -  GO HOME',
        hint: 'RETURN TO EARTH. RUN COMPLETE.',
        action: (mc) => new WinScene(mc.state),
      });
    }
    items.push({
      label: 'VAULT  -  SOLVE LEDGER',
      hint: 'EARN SEEDS BY CLOSING THE BOOKS',
      action: (mc) => {
        const meta = loadMeta();
        const diff = DIFFICULTY[mc.state.difficulty];
        const puzzle = pickPuzzle(mc.state.sol, diff.allowedTiers);
        const onClose = (r: PuzzleResult): Scene => {
          if (r.kind === 'correct') {
            for (const [sp, n] of Object.entries(puzzle.reward.seeds)) {
              if (!n) continue;
              mc.state.inventory.seeds[sp as SpeciesId] += n * diff.rewardMultiplier;
            }
            if (r.firstSolve) mc.state.shipParts += 1;
            saveRun(mc.state);
            mc.self.flash(r.firstSolve ? 'SEEDS + CODEX + SHIP PART' : 'SEEDS GRANTED');
          } else if (r.kind === 'incorrect') {
            if (diff.wrongPenaltyOxygen > 0) {
              mc.state.shelter.oxygen = Math.max(
                0,
                mc.state.shelter.oxygen - diff.wrongPenaltyOxygen,
              );
              saveRun(mc.state);
              mc.self.flash(`REJECTED. -${diff.wrongPenaltyOxygen} OXY`);
            } else {
              mc.self.flash('FILE REJECTED. TRY LATER.');
            }
          }
          return mc.self;
        };
        return new PuzzleScene(puzzle, meta, mc.self, onClose, mc.state.difficulty);
      },
    });
    items.push(
      {
        label: 'BREW   -  COMBINE LEAVES',
        hint: 'TURN HARVEST INTO POTIONS',
        action: (mc) => new BrewBenchScene(mc.state, mc.self),
      },
      {
        label: 'STATUS -  EXPANDED VIEW',
        hint: 'FULL SHELTER + INVENTORY',
        action: (mc) => new StatusScene(mc.state, mc.self),
      },
      {
        label: 'CODEX  -  ARCHIVES',
        hint: 'STANDARDS, WONDERS, RECIPES',
        action: (mc) => new CodexScene(mc.state, mc.self),
      },
      {
        label: 'SLEEP',
        hint: 'SKIP TO NEXT MORNING',
        action: (mc) => {
          (mc.prev as GardenScene).sleepToMorning();
          return mc.prev;
        },
      },
      {
        label: 'RESUME',
        hint: 'BACK TO THE GARDEN',
        action: (mc) => mc.prev,
      },
    );
    return items;
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;
    if (this.toast) {
      this.toast.t -= dt;
      if (this.toast.t <= 0) this.toast = null;
    }
    const items = this.items();
    if (this.idx >= items.length) this.idx = 0;

    if (input.justPressed('up'))   { this.idx = (this.idx - 1 + items.length) % items.length; sfx.cursor(); }
    if (input.justPressed('down')) { this.idx = (this.idx + 1) % items.length; sfx.cursor(); }
    if (input.justPressed('b') || input.justPressed('start')) { sfx.cancel(); return this.prev; }
    if (input.justPressed('a')) {
      sfx.confirm();
      const mc: MenuContext = { state: this.state, prev: this.prev, self: this };
      const next = items[this.idx].action(mc);
      if (next) return next;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    drawText(ctx, 'COLONY CONSOLE', 4, 3, p[3]);
    // Ship-hull readout on the right edge so the player tracks
    // progress without leaving the menu.
    const partsText = `HULL ${this.state.shipParts}/${SHIP_PARTS_TARGET}`;
    drawText(ctx, partsText, SCREEN_W - 2 - textWidth(partsText), 3, p[3]);

    const items = this.items();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const focused = i === this.idx;
      const y = 16 + i * ROW_H;
      drawText(ctx, item.label, 14, y, focused ? p[3] : p[2]);
      if (focused) {
        if (Math.floor(this.t * 3) % 2 === 0) drawText(ctx, '>', 6, y, p[3]);
        drawText(ctx, item.hint, 14, y + 6, p[2]);
      }
    }

    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    const hint = 'A:OPEN   B/START:CLOSE';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);

    if (this.toast) {
      const msg = this.toast.msg;
      const w = textWidth(msg) + 6;
      const x = Math.floor((SCREEN_W - w) / 2);
      const y = 14;
      ctx.fillStyle = p[0];
      ctx.fillRect(x, y, w, 9);
      ctx.fillStyle = p[3];
      ctx.fillRect(x, y, w, 1);
      ctx.fillRect(x, y + 8, w, 1);
      drawText(ctx, msg, x + 3, y + 2, p[3]);
    }
  }
}
