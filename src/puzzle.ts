// Full-screen puzzle modal. Three phases:
//   QUESTION   scenario + choices, navigate with up/down, A confirms
//   FEEDBACK   result + "B: WHY?" prompt
//   CODEX      shows the underlying FASB citation
// Pressing A on FEEDBACK or CODEX returns to the caller via the
// `onClose` callback (used by the Vault to grant rewards).

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H } from './font5';
import { type Input } from './input';
import { type Palette } from './palette';
import { saveMeta, type MetaState } from './meta';
import type { Scene } from './scene';
import { wrap } from './text-wrap';
import type { PuzzleInstance } from './puzzles/types';

const SCREEN_W = 160;
const SCREEN_H = 144;
// 5x7 font: 6px advance. Usable width 160 - 8 margins = 152 -> ~25 chars/line.
const TEXT_MAX_CHARS = 25;

export type PuzzleResult =
  | { kind: 'correct'; firstSolve: boolean }
  | { kind: 'incorrect' }
  | { kind: 'cancelled' };

type Phase = 'question' | 'feedback' | 'codex';

export class PuzzleScene implements Scene {
  private puzzle: PuzzleInstance;
  private meta: MetaState;
  private prev: Scene;
  private onClose: (r: PuzzleResult) => Scene;

  private phase: Phase = 'question';
  private choiceIdx = 0;
  private wasCorrect = false;
  private firstSolve = false;
  // For the blinking ">" pointer and toast pulses.
  private t = 0;

  // Cached wraps so we don't re-wrap every frame.
  private scenarioLines: string[];
  private feedbackLines: string[] = [];
  private codexLines: string[] = [];

  constructor(
    puzzle: PuzzleInstance,
    meta: MetaState,
    prev: Scene,
    onClose: (r: PuzzleResult) => Scene,
  ) {
    this.puzzle = puzzle;
    this.meta = meta;
    this.prev = prev;
    this.onClose = onClose;
    this.scenarioLines = wrap(puzzle.scenario, TEXT_MAX_CHARS);
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;

    if (this.phase === 'question') {
      if (input.justPressed('up')) {
        this.choiceIdx = (this.choiceIdx - 1 + this.puzzle.choices.length) % this.puzzle.choices.length;
      }
      if (input.justPressed('down')) {
        this.choiceIdx = (this.choiceIdx + 1) % this.puzzle.choices.length;
      }
      if (input.justPressed('b')) {
        // Bail out without answering.
        return this.onClose({ kind: 'cancelled' });
      }
      if (input.justPressed('a')) {
        const choice = this.puzzle.choices[this.choiceIdx];
        this.wasCorrect = choice.correct;
        if (this.wasCorrect) {
          this.meta.ledgerMarks[this.puzzle.topic] += 1;
          // First solve for this template = a Codex unlock event.
          this.firstSolve = !this.meta.codexSeen.includes(this.puzzle.templateId);
          if (this.firstSolve) this.meta.codexSeen.push(this.puzzle.templateId);
          saveMeta(this.meta);
        }
        this.feedbackLines = wrap(
          this.wasCorrect ? this.puzzle.feedbackCorrect : this.puzzle.feedbackIncorrect,
          TEXT_MAX_CHARS,
        );
        this.phase = 'feedback';
      }
      return null;
    }

    if (this.phase === 'feedback') {
      if (input.justPressed('b')) {
        const c = this.puzzle.codex;
        const lines: string[] = [];
        lines.push(...wrap(c.citation, TEXT_MAX_CHARS));
        lines.push('');
        lines.push(...wrap(c.excerpt, TEXT_MAX_CHARS));
        if (c.note) {
          lines.push('');
          lines.push(...wrap('PRACTICAL NOTE: ' + c.note, TEXT_MAX_CHARS));
        }
        this.codexLines = lines;
        this.phase = 'codex';
        return null;
      }
      if (input.justPressed('a')) {
        return this.onClose(
          this.wasCorrect
            ? { kind: 'correct', firstSolve: this.firstSolve }
            : { kind: 'incorrect' },
        );
      }
      return null;
    }

    // CODEX
    if (input.justPressed('a') || input.justPressed('b')) {
      return this.onClose(
        this.wasCorrect
          ? { kind: 'correct', firstSolve: this.firstSolve }
          : { kind: 'incorrect' },
      );
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Render the previous scene faintly behind, then a dim overlay so the
    // puzzle modal reads as an in-world wrist-console popup.
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Header bar.
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    drawText(ctx, this.puzzle.header, 3, 3, p[3]);

    // Footer bar.
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);

    if (this.phase === 'question') this.drawQuestion(ctx, p);
    else if (this.phase === 'feedback') this.drawFeedback(ctx, p);
    else this.drawCodex(ctx, p);
  }

  private drawQuestion(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Scenario
    let y = 14;
    for (const ln of this.scenarioLines) {
      drawText5(ctx, ln, 4, y, p[3]);
      y += LINE5_H;
    }

    // Question prompt
    y += 2;
    drawText5(ctx, this.puzzle.question, 4, y, p[2]);
    y += LINE5_H + 1;

    // Choices
    for (let i = 0; i < this.puzzle.choices.length; i++) {
      const c = this.puzzle.choices[i];
      const focused = i === this.choiceIdx;
      const color = focused ? p[3] : p[2];
      drawText5(ctx, c.label, 14, y, color);
      if (focused && Math.floor(this.t * 3) % 2 === 0) {
        drawText5(ctx, '>', 6, y, p[3]);
      }
      y += LINE5_H + 1;
    }

    const hint = 'A:CONFIRM   B:CANCEL';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }

  private drawFeedback(ctx: CanvasRenderingContext2D, p: Palette): void {
    const verdict = this.wasCorrect ? 'CORRECT' : 'INCORRECT';
    drawText5(ctx, verdict, 4, 16, p[3]);

    let y = 16 + LINE5_H + 2;
    for (const ln of this.feedbackLines) {
      drawText5(ctx, ln, 4, y, p[3]);
      y += LINE5_H;
    }

    if (this.wasCorrect) {
      // Reward summary
      const parts = Object.entries(this.puzzle.reward.seeds)
        .filter(([, n]) => n && n > 0)
        .map(([sp, n]) => `+${n} ${sp.toUpperCase()}`);
      if (parts.length) {
        y += 3;
        drawText5(ctx, 'REWARD: ' + parts.join('  '), 4, y, p[3]);
      }
    }

    const hint = 'B:WHY?   A:CLOSE';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }

  private drawCodex(ctx: CanvasRenderingContext2D, p: Palette): void {
    drawText5(ctx, 'CODEX OF STANDARDS', 4, 16, p[3]);
    let y = 16 + LINE5_H + 2;
    for (const ln of this.codexLines) {
      drawText5(ctx, ln, 4, y, p[3]);
      y += LINE5_H;
    }
    const hint = 'A/B: CLOSE';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }
}
