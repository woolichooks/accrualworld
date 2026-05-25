// Colony Console — a small modal menu opened with START from the garden.
// Currently surfaces the Vault (puzzle entry) and a resume action.

import { drawText, textWidth } from './font';
import { type Input } from './input';
import { type Palette } from './palette';
import { saveRun } from './save';
import type { Scene } from './scene';
import type { PaletteName } from './palette';
import { loadMeta } from './meta';
import { pickPuzzle } from './puzzles';
import { PuzzleScene, type PuzzleResult } from './puzzle';
import type { RunState, SpeciesId } from './types';
import type { GardenScene } from './garden';

const SCREEN_W = 160;
const SCREEN_H = 144;

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

  private items: MenuItem[] = [
    {
      label: 'VAULT  -  SOLVE LEDGER',
      hint: 'EARN SEEDS BY CLOSING THE BOOKS',
      action: (mc) => {
        const meta = loadMeta();
        const puzzle = pickPuzzle(mc.state.sol);
        const onClose = (r: PuzzleResult): Scene => {
          if (r.kind === 'correct') {
            for (const [sp, n] of Object.entries(puzzle.reward.seeds)) {
              if (!n) continue;
              mc.state.inventory.seeds[sp as SpeciesId] += n;
            }
            saveRun(mc.state);
            mc.self.flash(r.firstSolve ? 'SEEDS + CODEX UNLOCKED' : 'SEEDS GRANTED');
          } else if (r.kind === 'incorrect') {
            mc.self.flash('FILE REJECTED. TRY LATER.');
          }
          return mc.self;
        };
        return new PuzzleScene(puzzle, meta, mc.self, onClose);
      },
    },
    {
      label: 'SLEEP',
      hint: 'SKIP TO NEXT MORNING',
      action: (mc) => {
        // The garden owns time. Tell it to fast-forward, then resume it.
        (mc.prev as GardenScene).sleepToMorning();
        mc.self.flash('A NEW SOL BEGINS');
        return null;
      },
    },
    {
      label: 'RESUME',
      hint: 'BACK TO THE GARDEN',
      action: (mc) => mc.prev,
    },
  ];

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'acrid';
  }

  flash(msg: string): void {
    this.toast = { msg, t: 2.0 };
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;
    if (this.toast) {
      this.toast.t -= dt;
      if (this.toast.t <= 0) this.toast = null;
    }

    if (input.justPressed('up'))   this.idx = (this.idx - 1 + this.items.length) % this.items.length;
    if (input.justPressed('down')) this.idx = (this.idx + 1) % this.items.length;
    if (input.justPressed('b') || input.justPressed('start')) return this.prev;
    if (input.justPressed('a')) {
      const mc: MenuContext = { state: this.state, prev: this.prev, self: this };
      const next = this.items[this.idx].action(mc);
      if (next) return next;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Dim the garden underneath.
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Header
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    drawText(ctx, 'COLONY CONSOLE', 4, 3, p[3]);

    // Menu items
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const focused = i === this.idx;
      const y = 28 + i * 18;
      drawText(ctx, item.label, 14, y, focused ? p[3] : p[2]);
      if (focused) {
        if (Math.floor(this.t * 3) % 2 === 0) drawText(ctx, '>', 6, y, p[3]);
        drawText(ctx, item.hint, 14, y + 8, p[2]);
      }
    }

    // Footer
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
