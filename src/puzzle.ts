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
// Vertical bounds of the body area (between header bar and footer bar).
const BODY_TOP = 14;
const BODY_BOTTOM = SCREEN_H - 12;

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

  // Per-phase scroll offset (in lines). Reset on phase change.
  private scrollLines = 0;
  // Per-phase scroll for the scenario area in QUESTION phase. SELECT
  // advances it (UP/DOWN are reserved for choice navigation).
  private scenarioScroll = 0;

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
    return this.prev.paletteName?.() ?? 'day';
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

    // SELECT advances the scenario scroll one line and wraps to top
    // once we've shown the bottom. Cheap, discoverable via the hint
    // footer, and never collides with choice navigation.
    if (input.justPressed('select')) {
      const total = this.scenarioTotalLines();
      const visible = this.scenarioVisibleLines(q);
      const maxScroll = Math.max(0, total - visible);
      if (maxScroll > 0) {
        this.scenarioScroll = (this.scenarioScroll + 1) % (maxScroll + 1);
        sfx.cursor();
      }
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
      this.scenarioScroll = 0;
      return;
    }
    // Final question answered — evaluate the whole chain.
    this.evaluate();
    this.feedbackLines = wrap(
      this.allCorrect ? this.puzzle.feedbackCorrect : this.puzzle.feedbackIncorrect,
      TEXT_MAX_CHARS,
    );
    this.phase = 'feedback';
    this.scrollLines = 0;
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
    const max = this.maxFeedbackScroll();
    if (input.justPressed('up') && this.scrollLines > 0) { this.scrollLines -= 1; sfx.cursor(); }
    if (input.justPressed('down') && this.scrollLines < max) { this.scrollLines += 1; sfx.cursor(); }
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
      this.scrollLines = 0;
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
    const max = this.maxCodexScroll();
    if (input.justPressed('up') && this.scrollLines > 0) { this.scrollLines -= 1; sfx.cursor(); }
    if (input.justPressed('down') && this.scrollLines < max) { this.scrollLines += 1; sfx.cursor(); }
    if (input.justPressed('a') || input.justPressed('b')) {
      return this.onClose(
        this.allCorrect
          ? { kind: 'correct', firstSolve: this.firstSolve }
          : { kind: 'incorrect' },
      );
    }
    return null;
  }

  // ---- Layout helpers --------------------------------------------------

  private bottomBlockHeight(): number {
    const q = this.puzzle.questions[this.currentQ];
    if (q.kind === 'mc') {
      // prompt + (n choices @ LINE5_H+1)
      return (LINE5_H + 1) + q.choices.length * (LINE5_H + 1) + 2;
    }
    // dial: prompt + dial display (~16px)
    return (LINE5_H + 1) + 16 + 2;
  }

  private scenarioTotalLines(): number {
    if (this.currentQ !== 0) return 1; // "NEXT STEP..."
    const blank = this.hintLines.length > 0 ? 1 : 0;
    return this.hintLines.length + blank + this.scenarioLines.length;
  }

  private scenarioVisibleLines(_q: PuzzleInstance['questions'][number]): number {
    const top = BODY_TOP;
    const bottom = BODY_BOTTOM - this.bottomBlockHeight() - 4;
    return Math.max(1, Math.floor((bottom - top) / LINE5_H));
  }

  private maxFeedbackScroll(): number {
    const lines = this.feedbackContentLines();
    const visible = Math.max(1, Math.floor((BODY_BOTTOM - BODY_TOP) / LINE5_H));
    return Math.max(0, lines.length - visible);
  }

  private maxCodexScroll(): number {
    const visible = Math.max(1, Math.floor((BODY_BOTTOM - BODY_TOP - LINE5_H - 2) / LINE5_H));
    return Math.max(0, this.codexLines.length - visible);
  }

  private feedbackContentLines(): { text: string; bright: boolean }[] {
    const out: { text: string; bright: boolean }[] = [];
    out.push({ text: this.allCorrect ? 'CORRECT' : 'INCORRECT', bright: true });
    out.push({ text: '', bright: false });
    for (const ln of this.feedbackLines) out.push({ text: ln, bright: true });
    if (this.allCorrect) {
      const parts = Object.entries(this.puzzle.reward.seeds)
        .filter(([, n]) => n && n > 0)
        .map(([sp, n]) => `+${n} ${sp.toUpperCase()}`);
      if (parts.length) {
        out.push({ text: '', bright: false });
        for (const ln of wrap('REWARD: ' + parts.join('  '), TEXT_MAX_CHARS)) {
          out.push({ text: ln, bright: true });
        }
      }
    }
    return out;
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
      // Surface SEL:MORE only when there's content to scroll.
      const total = this.scenarioTotalLines();
      const visible = this.scenarioVisibleLines(q);
      const canScroll = total > visible;
      const base = q.kind === 'dial' ? 'LR:DIG UD:VAL A:OK' : 'A:OK B:CANCEL';
      hint = canScroll ? base + '  SEL:MORE' : base;
    } else if (this.phase === 'feedback') {
      hint = this.maxFeedbackScroll() > 0 ? 'UD:SCROLL B:WHY? A:CLOSE' : 'B:WHY?  A:CLOSE';
    } else {
      hint = this.maxCodexScroll() > 0 ? 'UD:SCROLL  A/B:CLOSE' : 'A/B: CLOSE';
    }
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[3]);
  }

  // QUESTION: bottom-anchored prompt + choices. Scenario above is
  // clipped to the remaining viewport and scrolls on SELECT.
  private drawQuestion(ctx: CanvasRenderingContext2D, p: Palette): void {
    const q = this.puzzle.questions[this.currentQ];
    const bottomH = this.bottomBlockHeight();
    const bottomY = BODY_BOTTOM - bottomH;

    // Top viewport for scenario + hint.
    const topY = BODY_TOP;
    const topMaxY = bottomY - 4;
    const viewportLines = Math.max(1, Math.floor((topMaxY - topY) / LINE5_H));

    // Build flat line list for the top area.
    const lines: { text: string; bright: boolean }[] = [];
    if (this.currentQ === 0) {
      for (const ln of this.hintLines) lines.push({ text: ln, bright: false });
      if (this.hintLines.length > 0) lines.push({ text: '', bright: false });
      for (const ln of this.scenarioLines) lines.push({ text: ln, bright: true });
    } else {
      lines.push({ text: 'NEXT STEP...', bright: false });
    }

    const total = lines.length;
    const maxScroll = Math.max(0, total - viewportLines);
    const scroll = Math.min(this.scenarioScroll, maxScroll);
    const visible = lines.slice(scroll, scroll + viewportLines);

    let y = topY;
    for (const ln of visible) {
      drawText5(ctx, ln.text, 4, y, ln.bright ? p[3] : p[2]);
      y += LINE5_H;
    }
    // Scroll indicators.
    if (scroll > 0) drawText5(ctx, '^', SCREEN_W - 8, topY, p[3]);
    if (scroll < maxScroll) drawText5(ctx, 'V', SCREEN_W - 8, topMaxY - LINE5_H, p[3]);

    // Prompt + choices/dial anchored at the bottom.
    drawText5(ctx, q.prompt, 4, bottomY, p[2]);
    if (q.kind === 'mc') this.drawMC(ctx, p, bottomY + LINE5_H + 1);
    else this.drawDial(ctx, p, bottomY + LINE5_H + 1);
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
    const digitGap = 1;
    const digitW = 5;
    const dotW = 2;
    const dotPositions = q.digits - q.decimals;
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
        ctx.fillStyle = p[3];
        ctx.fillRect(x, y + GLYPH5_H - 1, 1, 1);
        x += dotW + digitGap;
      }
      const digit = `${st.dialDigits[i]}`;
      drawText5(ctx, digit, x, y, p[3]);
      if (i === st.dialFocus && Math.floor(this.t * 4) % 2 === 0) {
        ctx.fillStyle = p[3];
        ctx.fillRect(x, y + GLYPH5_H + 1, digitW, 1);
      }
      x += digitW + digitGap;
    }
  }

  private drawFeedback(ctx: CanvasRenderingContext2D, p: Palette): void {
    const content = this.feedbackContentLines();
    const visible = Math.max(1, Math.floor((BODY_BOTTOM - BODY_TOP) / LINE5_H));
    const max = Math.max(0, content.length - visible);
    const scroll = Math.min(this.scrollLines, max);
    let y = BODY_TOP + 2;
    for (let i = scroll; i < Math.min(content.length, scroll + visible); i++) {
      drawText5(ctx, content[i].text, 4, y, content[i].bright ? p[3] : p[2]);
      y += LINE5_H;
    }
    if (scroll > 0) drawText5(ctx, '^', SCREEN_W - 8, BODY_TOP + 2, p[3]);
    if (scroll < max) drawText5(ctx, 'V', SCREEN_W - 8, BODY_BOTTOM - LINE5_H - 2, p[3]);
  }

  private drawCodex(ctx: CanvasRenderingContext2D, p: Palette): void {
    drawText5(ctx, 'CODEX OF STANDARDS', 4, BODY_TOP + 2, p[3]);
    const headerH = LINE5_H + 2;
    const visible = Math.max(1, Math.floor((BODY_BOTTOM - BODY_TOP - headerH) / LINE5_H));
    const max = Math.max(0, this.codexLines.length - visible);
    const scroll = Math.min(this.scrollLines, max);
    let y = BODY_TOP + headerH + 2;
    for (let i = scroll; i < Math.min(this.codexLines.length, scroll + visible); i++) {
      drawText5(ctx, this.codexLines[i], 4, y, p[3]);
      y += LINE5_H;
    }
    if (scroll > 0) drawText5(ctx, '^', SCREEN_W - 8, BODY_TOP + headerH + 2, p[3]);
    if (scroll < max) drawText5(ctx, 'V', SCREEN_W - 8, BODY_BOTTOM - LINE5_H - 2, p[3]);
  }
}
