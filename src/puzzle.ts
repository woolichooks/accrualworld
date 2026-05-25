// Full-screen puzzle modal. Each puzzle has 1+ questions chained
// sequentially. A question is either multiple-choice or a numeric
// dial. The whole chain must be answered before feedback appears.
// Phases:
//   QUESTION   active scenario, current question UI
//   FEEDBACK   verdict + reward + "B: WHY?" prompt
//   CODEX      shows the underlying FASB citation
// Pressing A on FEEDBACK or CODEX returns via the `onClose` callback.

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H, GLYPH5_H } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { saveMeta, type MetaState } from './meta';
import type { Scene } from './scene';
import { wrap } from './text-wrap';
import type { PuzzleInstance } from './puzzles/types';
import { DIFFICULTY, type Difficulty } from './types';
import { sfx } from './audio';

const SCREEN_W = 160;
const SCREEN_H = 144;
const TEXT_MAX_CHARS = 25;

export type PuzzleResult =
  | { kind: 'correct'; firstSolve: boolean }
  | { kind: 'incorrect' }
  | { kind: 'cancelled' };

type Phase = 'question' | 'feedback' | 'codex';

interface QuestionState {
  // For MC: focused choice index.
  mcChoice: number;
  // For dial: digit values (most significant first).
  dialDigits: number[];
  dialFocus: number;
}

export class PuzzleScene implements Scene {
  private puzzle: PuzzleInstance;
  private meta: MetaState;
  private prev: Scene;
  private onClose: (r: PuzzleResult) => Scene;

  private phase: Phase = 'question';
  private currentQ = 0;
  private qStates: QuestionState[] = [];
  private answers: number[] = []; // per-question chosen index (mc) or value (dial)
  private allCorrect = false;
  private firstSolve = false;
  private t = 0;

  private scenarioLines: string[];
  private hintLines: string[] = [];
  private feedbackLines: string[] = [];
  private codexLines: string[] = [];

  constructor(
    puzzle: PuzzleInstance,
    meta: MetaState,
    prev: Scene,
    onClose: (r: PuzzleResult) => Scene,
    difficulty: Difficulty = 'normal',
  ) {
    this.puzzle = puzzle;
    this.meta = meta;
    this.prev = prev;
    this.onClose = onClose;
    this.scenarioLines = wrap(puzzle.scenario, TEXT_MAX_CHARS);
    if (DIFFICULTY[difficulty].showHints && puzzle.hint) {
      this.hintLines = wrap('HINT: ' + puzzle.hint, TEXT_MAX_CHARS);
    }
    for (const q of puzzle.questions) {
      this.qStates.push({
        mcChoice: 0,
        dialDigits: q.kind === 'dial' ? new Array(q.digits).fill(0) : [],
        dialFocus: 0,
      });
    }
  }

  paletteName(): PaletteName {
    return this.prev.paletteName?.() ?? 'acrid';
  }

  update(dt: number, input: Input): Scene | null {
    this.t += dt;

    if (this.phase === 'question') return this.updateQuestion(input);
    if (this.phase === 'feedback') return this.updateFeedback(input);
    return this.updateCodex(input);
  }

  private updateQuestion(input: Input): Scene | null {
    const q = this.puzzle.questions[this.currentQ];
    const st = this.qStates[this.currentQ];

    if (input.justPressed('b')) {
      return this.onClose({ kind: 'cancelled' });
    }

    if (q.kind === 'mc') {
      if (input.justPressed('up'))   { st.mcChoice = (st.mcChoice + q.choices.length - 1) % q.choices.length; sfx.cursor(); }
      if (input.justPressed('down')) { st.mcChoice = (st.mcChoice + 1) % q.choices.length; sfx.cursor(); }
      if (input.justPressed('a')) this.submitAnswer(st.mcChoice);
    } else {
      // Dial input.
      if (input.justPressed('left'))  { st.dialFocus = (st.dialFocus + q.digits - 1) % q.digits; sfx.cursor(); }
      if (input.justPressed('right')) { st.dialFocus = (st.dialFocus + 1) % q.digits; sfx.cursor(); }
      if (input.justPressed('up'))   { st.dialDigits[st.dialFocus] = (st.dialDigits[st.dialFocus] + 1) % 10; sfx.click(); }
      if (input.justPressed('down')) { st.dialDigits[st.dialFocus] = (st.dialDigits[st.dialFocus] + 9) % 10; sfx.click(); }
      if (input.justPressed('a')) {
        const value = st.dialDigits.reduce((acc, d) => acc * 10 + d, 0);
        this.submitAnswer(value);
      }
    }
    return null;
  }

  private submitAnswer(value: number): void {
    this.answers[this.currentQ] = value;
    if (this.currentQ + 1 < this.puzzle.questions.length) {
      this.currentQ += 1;
      return;
    }
    // Final question answered — evaluate the whole chain.
    this.evaluate();
    this.feedbackLines = wrap(
      this.allCorrect ? this.puzzle.feedbackCorrect : this.puzzle.feedbackIncorrect,
      TEXT_MAX_CHARS,
    );
    this.phase = 'feedback';
  }

  private evaluate(): void {
    let allOk = true;
    for (let i = 0; i < this.puzzle.questions.length; i++) {
      const q = this.puzzle.questions[i];
      const ans = this.answers[i];
      if (q.kind === 'mc') {
        if (!q.choices[ans]?.correct) { allOk = false; break; }
      } else {
        if (Math.abs(ans - q.answer) > q.tolerance) { allOk = false; break; }
      }
    }
    this.allCorrect = allOk;
    if (allOk) {
      this.meta.ledgerMarks[this.puzzle.topic] += 1;
      this.firstSolve = !this.meta.codexSeen.includes(this.puzzle.templateId);
      if (this.firstSolve) this.meta.codexSeen.push(this.puzzle.templateId);
      saveMeta(this.meta);
      sfx.puzzleCorrect();
    } else {
      sfx.puzzleWrong();
    }
  }

  private updateFeedback(input: Input): Scene | null {
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
        this.allCorrect
          ? { kind: 'correct', firstSolve: this.firstSolve }
          : { kind: 'incorrect' },
      );
    }
    return null;
  }

  private updateCodex(input: Input): Scene | null {
    if (input.justPressed('a') || input.justPressed('b')) {
      return this.onClose(
        this.allCorrect
          ? { kind: 'correct', firstSolve: this.firstSolve }
          : { kind: 'incorrect' },
      );
    }
    return null;
  }

  // ---- Draw -----------------------------------------------------------
  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

    // Header
    ctx.fillStyle = p[1];
    ctx.fillRect(0, 0, SCREEN_W, 11);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, 10, SCREEN_W, 1);
    let header = this.puzzle.header;
    if (this.puzzle.questions.length > 1 && this.phase === 'question') {
      header += `  Q${this.currentQ + 1}/${this.puzzle.questions.length}`;
    }
    drawText(ctx, header, 3, 3, p[3]);

    if (this.phase === 'question') this.drawQuestion(ctx, p);
    else if (this.phase === 'feedback') this.drawFeedback(ctx, p);
    else this.drawCodex(ctx, p);

    this.drawFooter(ctx, p);
  }

  private drawFooter(ctx: CanvasRenderingContext2D, p: Palette): void {
    ctx.fillStyle = p[1];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 10);
    ctx.fillStyle = p[3];
    ctx.fillRect(0, SCREEN_H - 10, SCREEN_W, 1);
    let hint: string;
    if (this.phase === 'question') {
      const q = this.puzzle.questions[this.currentQ];
      hint = q.kind === 'dial' ? 'LR:DIGIT UD:VALUE A:OK' : 'A:CONFIRM   B:CANCEL';
    } else if (this.phase === 'feedback') hint = 'B:WHY?   A:CLOSE';
    else hint = 'A/B: CLOSE';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }

  private drawQuestion(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Scenario (only on first question; subsequent steps free up space)
    let y = 14;
    if (this.currentQ === 0) {
      // In easy mode, surface a one-line plain-English rule at the
      // top of the question. Dimmer than the scenario so it reads as
      // a note, not as part of the situation.
      for (const ln of this.hintLines) {
        drawText5(ctx, ln, 4, y, p[2]);
        y += LINE5_H;
      }
      if (this.hintLines.length > 0) y += 2;
      for (const ln of this.scenarioLines) {
        drawText5(ctx, ln, 4, y, p[3]);
        y += LINE5_H;
      }
      y += 2;
    } else {
      drawText5(ctx, 'NEXT STEP...', 4, y, p[2]);
      y += LINE5_H + 2;
    }

    const q = this.puzzle.questions[this.currentQ];
    drawText5(ctx, q.prompt, 4, y, p[2]);
    y += LINE5_H + 1;

    if (q.kind === 'mc') this.drawMC(ctx, p, y);
    else this.drawDial(ctx, p, y);
  }

  private drawMC(ctx: CanvasRenderingContext2D, p: Palette, startY: number): void {
    const q = this.puzzle.questions[this.currentQ];
    if (q.kind !== 'mc') return;
    const st = this.qStates[this.currentQ];
    let y = startY;
    for (let i = 0; i < q.choices.length; i++) {
      const c = q.choices[i];
      const focused = i === st.mcChoice;
      drawText5(ctx, c.label, 14, y, focused ? p[3] : p[2]);
      if (focused && Math.floor(this.t * 3) % 2 === 0) {
        drawText5(ctx, '>', 6, y, p[3]);
      }
      y += LINE5_H + 1;
    }
  }

  private drawDial(ctx: CanvasRenderingContext2D, p: Palette, startY: number): void {
    const q = this.puzzle.questions[this.currentQ];
    if (q.kind !== 'dial') return;
    const st = this.qStates[this.currentQ];
    // Render digits as a centered block. Decimal point inserted at the
    // correct position. Focus underline pulses to show the active digit.
    const digitGap = 1;
    const digitW = 5;
    const dotW = 2;
    const dotPositions = q.digits - q.decimals; // dot after this many leading digits
    const totalW =
      q.digits * (digitW + digitGap) - digitGap +
      (q.decimals > 0 ? dotW + digitGap : 0) +
      (q.prefix ? (q.prefix.length * 4) + 2 : 0);
    let x = Math.floor((SCREEN_W - totalW) / 2);
    const y = startY + 4;

    if (q.prefix) {
      drawText(ctx, q.prefix, x, y + 1, p[3]);
      x += q.prefix.length * 4 + 2;
    }
    for (let i = 0; i < q.digits; i++) {
      if (i === dotPositions && q.decimals > 0) {
        // Decimal point
        ctx.fillStyle = p[3];
        ctx.fillRect(x, y + GLYPH5_H - 1, 1, 1);
        x += dotW + digitGap;
      }
      const digit = `${st.dialDigits[i]}`;
      drawText5(ctx, digit, x, y, p[3]);
      // Underline focused digit (pulse).
      if (i === st.dialFocus && Math.floor(this.t * 4) % 2 === 0) {
        ctx.fillStyle = p[3];
        ctx.fillRect(x, y + GLYPH5_H + 1, digitW, 1);
      }
      x += digitW + digitGap;
    }
  }

  private drawFeedback(ctx: CanvasRenderingContext2D, p: Palette): void {
    const verdict = this.allCorrect ? 'CORRECT' : 'INCORRECT';
    drawText5(ctx, verdict, 4, 16, p[3]);

    let y = 16 + LINE5_H + 2;
    for (const ln of this.feedbackLines) {
      drawText5(ctx, ln, 4, y, p[3]);
      y += LINE5_H;
    }

    if (this.allCorrect) {
      const parts = Object.entries(this.puzzle.reward.seeds)
        .filter(([, n]) => n && n > 0)
        .map(([sp, n]) => `+${n} ${sp.toUpperCase()}`);
      if (parts.length) {
        y += 3;
        const rewardLines = wrap('REWARD: ' + parts.join('  '), TEXT_MAX_CHARS);
        for (const ln of rewardLines) {
          drawText5(ctx, ln, 4, y, p[3]);
          y += LINE5_H;
        }
      }
    }
  }

  private drawCodex(ctx: CanvasRenderingContext2D, p: Palette): void {
    drawText5(ctx, 'CODEX OF STANDARDS', 4, 16, p[3]);
    let y = 16 + LINE5_H + 2;
    for (const ln of this.codexLines) {
      drawText5(ctx, ln, 4, y, p[3]);
      y += LINE5_H;
    }
  }
}

