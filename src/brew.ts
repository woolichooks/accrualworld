// Brew Bench — combine harvested leaves into potions/medicine.
//
// 3 ingredient slots, each holds one species or empty. Player slots
// what they have, presses A to brew. If the multiset matches a recipe
// the effect applies immediately and the recipe gets logged to meta.
//
// Controls:
//   UP/DOWN     change focused slot
//   LEFT/RIGHT  cycle species in focused slot (-/mint/sun/basil)
//   SELECT      clear focused slot
//   A           brew
//   B           back to console menu

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { loadMeta, saveMeta } from './meta';
import { saveRun } from './save';
import type { Scene } from './scene';
import { drawSeedIcon, SPECIES_DATA } from './species';
import { matchRecipe } from './recipes';
import { sfx } from './audio';
import type { RunState, SpeciesId } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;
const SLOT_CYCLE: (SpeciesId | null)[] = [null, 'mint', 'sunflower', 'basil'];

export class BrewBenchScene implements Scene {
  private state: RunState;
  private prev: Scene;
  private slots: (SpeciesId | null)[] = [null, null, null];
  private focused = 0;
  private toast: { msg: string; t: number } | null = null;
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
    if (this.toast) {
      this.toast.t -= dt;
      if (this.toast.t <= 0) this.toast = null;
    }

    if (input.justPressed('b')) return this.prev;

    if (input.justPressed('up'))   this.focused = (this.focused + this.slots.length - 1) % this.slots.length;
    if (input.justPressed('down')) this.focused = (this.focused + 1) % this.slots.length;
    if (input.justPressed('left'))  this.cycleSlot(-1);
    if (input.justPressed('right')) this.cycleSlot(+1);
    if (input.justPressed('select')) this.slots[this.focused] = null;

    if (input.justPressed('a')) this.tryBrew();
    return null;
  }

  private cycleSlot(dir: number): void {
    const current = this.slots[this.focused];
    let i = SLOT_CYCLE.indexOf(current);
    if (i < 0) i = 0;
    i = (i + dir + SLOT_CYCLE.length) % SLOT_CYCLE.length;
    this.slots[this.focused] = SLOT_CYCLE[i];
  }

  private tryBrew(): void {
    // Need at least one ingredient to attempt a brew.
    if (this.slots.every((s) => s === null)) {
      this.toast = { msg: 'NEED INGREDIENTS', t: 1.6 };
      sfx.warn();
      return;
    }
    // Tally ingredient demand and verify the player has the leaves.
    const need: Partial<Record<SpeciesId, number>> = {};
    for (const s of this.slots) {
      if (!s) continue;
      need[s] = (need[s] ?? 0) + 1;
    }
    for (const k of Object.keys(need) as SpeciesId[]) {
      if (this.state.inventory.harvested[k] < (need[k] ?? 0)) {
        this.toast = { msg: `NOT ENOUGH ${k.toUpperCase()}`, t: 1.6 };
        sfx.warn();
        return;
      }
    }
    // Match a recipe; if none, fizzle.
    const recipe = matchRecipe(this.slots);
    if (!recipe) {
      this.toast = { msg: 'COMBINATION FAILED', t: 1.6 };
      sfx.puzzleWrong();
      return;
    }
    // Consume leaves, apply effect, log discovery.
    for (const k of Object.keys(need) as SpeciesId[]) {
      this.state.inventory.harvested[k] -= need[k] ?? 0;
    }
    const reward = recipe.apply(this.state);
    sfx.brew();
    saveRun(this.state);

    const meta = loadMeta();
    const first = !meta.discoveredRecipes.includes(recipe.id);
    if (first) meta.discoveredRecipes.push(recipe.id);
    saveMeta(meta);

    this.toast = {
      msg: first ? `NEW: ${recipe.name}  ${reward}` : `${recipe.name}: ${reward}`,
      t: 2.4,
    };
    this.slots = [null, null, null];
  }

  // ---- Draw ------------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Header
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    drawText(ctx, 'BREW BENCH', 4, 3, p[3]);

    // Leaves available, right side
    const leaves = `M${this.state.inventory.harvested.mint}` +
                   ` S${this.state.inventory.harvested.sunflower}` +
                   ` B${this.state.inventory.harvested.basil}`;
    drawText(ctx, 'LEAVES ' + leaves, SCREEN_W - 2 - textWidth('LEAVES ' + leaves), 3, p[3]);

    // Slots column
    let y = 22;
    for (let i = 0; i < this.slots.length; i++) {
      const focused = i === this.focused;
      const sp = this.slots[i];
      const label = sp ? SPECIES_DATA[sp].name : '-';

      // Pointer chevron blinks on the focused row.
      if (focused && Math.floor(this.t * 3) % 2 === 0) {
        drawText5(ctx, '>', 6, y, p[3]);
      }
      drawText5(ctx, `SLOT ${i + 1}`, 14, y, focused ? p[3] : p[2]);
      if (sp) {
        drawSeedIcon(ctx, 60, y + 1, sp, p);
        drawText5(ctx, label, 68, y, focused ? p[3] : p[2]);
      } else {
        drawText5(ctx, label, 60, y, p[2]);
      }
      y += LINE5_H + 2;
    }

    // Recipe preview line.
    const match = matchRecipe(this.slots);
    const meta = loadMeta();
    let resultLine = 'RESULT: ---';
    let effectLine = '';
    if (match) {
      const known = meta.discoveredRecipes.includes(match.id);
      resultLine = `RESULT: ${known ? match.name : '???'}`;
      effectLine = known ? `EFFECT: ${match.effect}` : 'EFFECT: UNKNOWN UNTIL BREWED';
    } else if (this.slots.some((s) => s !== null)) {
      resultLine = 'RESULT: NO MATCH';
    }
    drawText5(ctx, resultLine, 4, y + 2, p[3]);
    if (effectLine) drawText5(ctx, effectLine, 4, y + 2 + LINE5_H, p[2]);

    // Toast above the footer
    if (this.toast) {
      const msg = this.toast.msg;
      const w = textWidth(msg) + 6;
      const x = Math.floor((SCREEN_W - w) / 2);
      const ty = SCREEN_H - 22;
      ctx.fillStyle = p[0];
      ctx.fillRect(x, ty, w, 9);
      ctx.fillStyle = p[3];
      ctx.fillRect(x, ty, w, 1);
      ctx.fillRect(x, ty + 8, w, 1);
      drawText(ctx, msg, x + 3, ty + 2, p[3]);
    }

    // Footer
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    const hint = 'A:BREW  B:BACK  SEL:CLR';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }
}
