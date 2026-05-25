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
import { THREATS } from './threat';
import { RECIPES } from './recipes';
import { MUTATIONS } from './species';
import { wrap } from './text-wrap';
import type { RunState, SpeciesId } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;
// 5x7 font: ~6px per char. Usable width 152px -> ~25 chars/line.
const TITLE_CHARS = 25;
const DETAIL_CHARS = 24;
// y bounds of the content area between tab strip and footer.
const CONTENT_TOP = 26;
const CONTENT_BOTTOM = SCREEN_H - 12;
const ENTRY_SPACER = 4;

type Tab = 'std' | 'wnd' | 'thr' | 'rcp' | 'mut' | 'inf';

const TAB_ORDER: Tab[] = ['std', 'wnd', 'thr', 'rcp', 'mut', 'inf'];
const TAB_LABEL: Record<Tab, string> = {
  std: 'STD',
  wnd: 'WND',
  thr: 'THR',
  rcp: 'RCP',
  mut: 'MUT',
  inf: 'INF',
};
const TAB_HEADER: Record<Tab, string> = {
  std: 'STANDARDS',
  wnd: 'WONDERS',
  thr: 'THREATS',
  rcp: 'RECIPES',
  mut: 'MUTATIONS',
  inf: 'RUN STATS',
};

interface Entry {
  title: string;
  detail: string;
  locked: boolean;
  // Long-form lines shown in the drill-in view. Falls back to the
  // detail line when undefined.
  full?: string[];
}

export class CodexScene implements Scene {
  private state: RunState;
  private prev: Scene;
  private tabIdx = 0;
  private scrollOffset = 0;
  private selectedIdx = 0;  // index within visible entries for drill-in
  private detailEntry: Entry | null = null;
  private detailScroll = 0;
  private t = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'day';
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;

    // ---- Detail view -----------------------------------------------
    if (this.detailEntry) {
      if (input.justPressed('b') || input.justPressed('a')) {
        this.detailEntry = null;
        this.detailScroll = 0;
        return null;
      }
      if (input.justPressed('up') && this.detailScroll > 0) this.detailScroll -= 1;
      if (input.justPressed('down')) {
        const total = this.detailEntry.full?.length ?? 0;
        if (this.detailScroll < total - 1) this.detailScroll += 1;
      }
      return null;
    }

    // ---- List view -------------------------------------------------
    if (input.justPressed('b') || input.justPressed('start')) return this.prev;
    if (input.justPressed('left')) {
      this.tabIdx = (this.tabIdx + TAB_ORDER.length - 1) % TAB_ORDER.length;
      this.scrollOffset = 0;
      this.selectedIdx = 0;
    }
    if (input.justPressed('right') || input.justPressed('tab')) {
      this.tabIdx = (this.tabIdx + 1) % TAB_ORDER.length;
      this.scrollOffset = 0;
      this.selectedIdx = 0;
    }
    if (input.justPressed('up') && this.selectedIdx > 0) this.selectedIdx -= 1;
    if (input.justPressed('down')) {
      const entries = this.entriesFor(TAB_ORDER[this.tabIdx]);
      if (this.selectedIdx < entries.length - 1) this.selectedIdx += 1;
    }
    // Auto-scroll so the focused entry stays visible. Two directions:
    // selection went above the viewport, or below it.
    const entries = this.entriesFor(TAB_ORDER[this.tabIdx]);
    if (this.selectedIdx < this.scrollOffset) this.scrollOffset = this.selectedIdx;
    while (this.selectedIdx > this.lastVisibleIndex(entries)) {
      this.scrollOffset += 1;
    }
    if (input.justPressed('a')) {
      const entries = this.entriesFor(TAB_ORDER[this.tabIdx]);
      const e = entries[this.selectedIdx];
      if (e && !e.locked && e.full && e.full.length > 0) {
        this.detailEntry = e;
        this.detailScroll = 0;
      }
    }
    return null;
  }

  // Pre-compute wrapped lines for an entry so render and overflow math agree.
  private wrapEntry(e: Entry): { title: string[]; detail: string[]; height: number } {
    const title = wrap(e.title, TITLE_CHARS);
    const detail = wrap(e.detail, DETAIL_CHARS);
    return {
      title,
      detail,
      height: (title.length + detail.length) * LINE5_H + ENTRY_SPACER,
    };
  }

  // The highest index that currently fits in the viewport starting at
  // scrollOffset. Used to auto-scroll on down-presses; returns
  // scrollOffset - 1 if even the first entry doesn't fit (defensive).
  private lastVisibleIndex(entries: Entry[]): number {
    let y = CONTENT_TOP;
    let last = this.scrollOffset - 1;
    for (let i = this.scrollOffset; i < entries.length; i++) {
      const w = this.wrapEntry(entries[i]);
      if (y + w.height > CONTENT_BOTTOM) break;
      y += w.height;
      last = i;
    }
    return last;
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
          full: seen
            ? [
                `TOPIC: ASC ${t.topic} - TIER ${t.tier}`,
                '',
                t.staticCodex.citation,
                '',
                t.staticCodex.excerpt,
                ...(t.staticCodex.note ? ['', 'PRACTICAL NOTE:', t.staticCodex.note] : []),
              ]
            : undefined,
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
          full: seen ? [w.description, '', 'SEEN ONLY AT NIGHT, AWAKE.'] : undefined,
        };
      });
    }
    if (tab === 'thr') {
      return THREATS.map((t) => {
        const seen = meta.encounteredThreats.includes(t.id);
        return {
          title: t.label,
          detail: seen ? `${t.damageMsg}` : 'NOT YET ENCOUNTERED',
          locked: !seen,
          full: seen
            ? [
                t.description,
                '',
                `EFFECT: ${t.damageMsg}`,
                '',
                'STRIKES AT NIGHT. SLEEP AVOIDS IT.',
              ]
            : undefined,
        };
      });
    }
    if (tab === 'rcp') {
      return RECIPES.map((r) => {
        const seen = meta.discoveredRecipes.includes(r.id);
        const ing = Object.entries(r.ingredients)
          .map(([sp, n]) => `${n}x ${sp.toUpperCase()}`)
          .join(' + ');
        return {
          title: seen ? r.name : '???',
          detail: seen ? `${ing}  ${r.effect}` : 'NOT YET BREWED',
          locked: !seen,
          full: seen
            ? [
                `INGREDIENTS: ${ing}`,
                `EFFECT: ${r.effect}`,
                '',
                'BREWED AT THE COLONY BENCH.',
              ]
            : undefined,
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
          full: [
            `HOST PLANT: ${sp.toUpperCase()}`,
            `HARVEST BONUS: ${m.harvestBonus}`,
            '',
            'TRIGGERED BY WONDERS AND THREATS.',
            'EACH GROWING PLANT ROLLS 35%.',
          ],
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
      { title: 'THREATS ENCOUNTERED', detail: `${meta.encounteredThreats.length} / ${THREATS.length}`, locked: false },
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
    if (this.detailEntry) {
      const title = `CODEX  ${this.detailEntry.title}`;
      drawText(ctx, title, 4, 3, p[3]);
      this.drawDetail(ctx, p);
      this.drawFooter(ctx, p, 'A/B: BACK');
      return;
    }
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

    // Entries list — variable-height entries with word-wrapped title
    // and detail. We render as many as fit between the tab strip and
    // the footer; anything beyond stays for the next scroll step.
    const entries = this.entriesFor(TAB_ORDER[this.tabIdx]);
    let y = CONTENT_TOP;
    let lastDrawn = this.scrollOffset - 1;
    if (entries.length === 0) {
      drawText5(ctx, 'EMPTY.', 4, y, p[2]);
    } else {
      for (let i = this.scrollOffset; i < entries.length; i++) {
        const e = entries[i];
        const w = this.wrapEntry(e);
        if (y + w.height > CONTENT_BOTTOM) break;
        const focused = i === this.selectedIdx;
        const titleColor = e.locked ? p[2] : p[3];
        // Blinking '>' marker on the focused entry so the player
        // can see which entry A will drill into.
        if (focused && Math.floor(this.t * 3) % 2 === 0) {
          drawText5(ctx, '>', 0, y, p[3]);
        }
        for (const ln of w.title) {
          drawText5(ctx, ln, 6, y, titleColor);
          y += LINE5_H;
        }
        for (const ln of w.detail) {
          drawText5(ctx, ln, 10, y, p[2]);
          y += LINE5_H;
        }
        y += ENTRY_SPACER;
        lastDrawn = i;
      }
    }

    // Scroll indicators when there's content above/below the viewport.
    if (this.scrollOffset > 0) {
      drawText5(ctx, '^', SCREEN_W - 8, CONTENT_TOP, p[3]);
    }
    if (lastDrawn < entries.length - 1) {
      drawText5(ctx, 'V', SCREEN_W - 8, CONTENT_BOTTOM - LINE5_H, p[3]);
    }

    this.drawFooter(ctx, p, 'TAB/<>:TAB  UD:PICK  A:OPEN  B:BACK');
  }

  // Drill-in: shows the entry's full content (wrapped) with vertical
  // scroll. Footer is drawn by the caller.
  private drawDetail(ctx: CanvasRenderingContext2D, p: Palette): void {
    if (!this.detailEntry) return;
    const lines: string[] = [];
    for (const para of this.detailEntry.full ?? []) {
      if (para === '') { lines.push(''); continue; }
      lines.push(...wrap(para, TITLE_CHARS));
    }
    let y = CONTENT_TOP;
    for (let i = this.detailScroll; i < lines.length; i++) {
      if (y + LINE5_H > CONTENT_BOTTOM) break;
      drawText5(ctx, lines[i], 4, y, p[3]);
      y += LINE5_H;
    }
  }

  private drawFooter(ctx: CanvasRenderingContext2D, p: Palette, hint: string): void {
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }
}

// Tiny consumer of the lookups above so unused-symbol checks pass.
// Surfaces wonderById/templateById for callers that want details.
export { templateById, wonderById };
