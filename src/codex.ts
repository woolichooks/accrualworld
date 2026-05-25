// Codex — meta-progression viewer. Five tabs surface everything the
// player has accumulated across runs:
//
//   STD  STANDARDS    FASB topics encountered (puzzle templates seen)
//   WND  WONDERS       Cosmic events witnessed
//   RCP  RECIPES       Brews discovered at the bench
//   MUT  MUTATIONS    Plant variants (always shown — they're lore;
//                      individual unlocks would add scope w/o payoff)
//   INF  RUN STATS    Current sol + ledger marks per topic

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { loadMeta } from './meta';
import type { Scene } from './scene';
import { templateById, TEMPLATES } from './puzzles';
import { wonderById, WONDERS } from './wonder';
import { RECIPES } from './recipes';
import { MUTATIONS } from './species';
import type { RunState, SpeciesId } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;

type Tab = 'std' | 'wnd' | 'rcp' | 'mut' | 'inf';

const TAB_ORDER: Tab[] = ['std', 'wnd', 'rcp', 'mut', 'inf'];
const TAB_LABEL: Record<Tab, string> = {
  std: 'STD',
  wnd: 'WND',
  rcp: 'RCP',
  mut: 'MUT',
  inf: 'INF',
};
const TAB_HEADER: Record<Tab, string> = {
  std: 'STANDARDS',
  wnd: 'WONDERS',
  rcp: 'RECIPES',
  mut: 'MUTATIONS',
  inf: 'RUN STATS',
};

interface Entry {
  title: string;
  detail: string;
  locked: boolean;
}

export class CodexScene implements Scene {
  private state: RunState;
  private prev: Scene;
  private tabIdx = 0;
  private scrollOffset = 0;
  private t = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'acrid';
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;
    if (input.justPressed('b') || input.justPressed('start')) return this.prev;
    if (input.justPressed('left')) {
      this.tabIdx = (this.tabIdx + TAB_ORDER.length - 1) % TAB_ORDER.length;
      this.scrollOffset = 0;
    }
    if (input.justPressed('right')) {
      this.tabIdx = (this.tabIdx + 1) % TAB_ORDER.length;
      this.scrollOffset = 0;
    }
    // Up/down scrolls the list.
    if (input.justPressed('up') && this.scrollOffset > 0) this.scrollOffset -= 1;
    if (input.justPressed('down')) {
      const entries = this.entriesFor(TAB_ORDER[this.tabIdx]);
      const maxScroll = Math.max(0, entries.length - this.maxVisibleEntries());
      if (this.scrollOffset < maxScroll) this.scrollOffset += 1;
    }
    return null;
  }

  private maxVisibleEntries(): number {
    // Each entry takes 2 lines (title + detail) + 1 spacer. ~3 entries fit.
    return 3;
  }

  private entriesFor(tab: Tab): Entry[] {
    const meta = loadMeta();
    if (tab === 'std') {
      return TEMPLATES.map((t) => {
        const seen = meta.codexSeen.includes(t.id);
        return {
          title: t.displayName,
          detail: seen ? t.blurb : 'NOT YET ENCOUNTERED',
          locked: !seen,
        };
      });
    }
    if (tab === 'wnd') {
      return WONDERS.map((w) => {
        const seen = meta.witnessedWonders.includes(w.id);
        return {
          title: w.name,
          detail: seen ? w.description : 'NOT YET WITNESSED',
          locked: !seen,
        };
      });
    }
    if (tab === 'rcp') {
      return RECIPES.map((r) => {
        const seen = meta.discoveredRecipes.includes(r.id);
        const ing = Object.entries(r.ingredients)
          .map(([sp, n]) => `${n}${sp[0].toUpperCase()}`)
          .join('+');
        return {
          title: seen ? r.name : '???',
          detail: seen ? `${ing}  ${r.effect}` : 'NOT YET BREWED',
          locked: !seen,
        };
      });
    }
    if (tab === 'mut') {
      // Always shown — lore reference. (Could gate per-mutation later.)
      return (Object.keys(MUTATIONS) as SpeciesId[]).map((sp) => {
        const m = MUTATIONS[sp];
        return {
          title: m.name,
          detail: `${sp.toUpperCase()} ${m.harvestBonus} ON HARVEST`,
          locked: false,
        };
      });
    }
    // INF — run stats
    const lm = meta.ledgerMarks;
    return [
      { title: 'CURRENT RUN', detail: `SOL ${this.state.sol}`, locked: false },
      { title: 'LEDGER MARKS', detail: `305:${lm['305']} 330:${lm['330']} 360:${lm['360']}`, locked: false },
      { title: 'STANDARDS LOGGED', detail: `${meta.codexSeen.length} / ${TEMPLATES.length}`, locked: false },
      { title: 'WONDERS WITNESSED', detail: `${meta.witnessedWonders.length} / ${WONDERS.length}`, locked: false },
      { title: 'RECIPES BREWED', detail: `${meta.discoveredRecipes.length} / ${RECIPES.length}`, locked: false },
    ];
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Header bar with title
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    const title = `CODEX  ${TAB_HEADER[TAB_ORDER[this.tabIdx]]}`;
    drawText(ctx, title, 4, 3, p[3]);

    // Tab strip
    const tabY = 14;
    const tabW = Math.floor(SCREEN_W / TAB_ORDER.length);
    for (let i = 0; i < TAB_ORDER.length; i++) {
      const focused = i === this.tabIdx;
      const lbl = TAB_LABEL[TAB_ORDER[i]];
      const lw = textWidth(lbl);
      const tx = i * tabW + Math.floor((tabW - lw) / 2);
      drawText(ctx, lbl, tx, tabY, focused ? p[3] : p[2]);
      if (focused) {
        ctx.fillStyle = p[3];
        ctx.fillRect(i * tabW + 2, tabY + 7, tabW - 4, 1);
      }
    }

    // Entries list
    const entries = this.entriesFor(TAB_ORDER[this.tabIdx]);
    const visible = entries.slice(this.scrollOffset, this.scrollOffset + this.maxVisibleEntries());
    let y = 26;
    if (visible.length === 0) {
      drawText5(ctx, 'EMPTY.', 4, y, p[2]);
    } else {
      for (const e of visible) {
        const titleColor = e.locked ? p[2] : p[3];
        drawText5(ctx, e.title, 4, y, titleColor);
        y += LINE5_H;
        drawText5(ctx, e.detail, 8, y, p[2]);
        y += LINE5_H + 4;
      }
    }

    // Scroll indicators if there's more above/below.
    if (this.scrollOffset > 0) {
      drawText5(ctx, '^', SCREEN_W - 8, 26, p[3]);
    }
    if (this.scrollOffset + this.maxVisibleEntries() < entries.length) {
      drawText5(ctx, 'v', SCREEN_W - 8, SCREEN_H - 22, p[3]);
    }

    // Footer
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    const hint = '<> TAB  UD SCROLL  B BACK';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }
}

// Tiny consumer of the lookups above so unused-symbol checks pass.
// Surfaces wonderById/templateById for callers that want details.
export { templateById, wonderById };
