// Wonders — short cinematic micro-events that punctuate the cycle.
// Milestone 4 ships one: METEOR SHOWER.
//
// A wonder scene wraps whatever the player was doing (typically the
// garden), disables input until the cinematic finishes, then returns.
// Side effects (reward, codex unlock) are applied on completion.

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H, textWidth5 } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { loadMeta, saveMeta } from './meta';
import { saveRun } from './save';
import type { Scene } from './scene';
import { mutateGardenPlants } from './species';
import type { RunState } from './types';

const SCREEN_W = 160;
const SCREEN_H = 144;

interface Streak {
  x: number;        // head x
  y: number;        // head y
  vx: number;       // px/s
  vy: number;
  life: number;     // seconds remaining
  bright: boolean;  // big flash on impact
}

export class MeteorShowerScene implements Scene {
  static readonly ID = 'meteor_shower';

  private state: RunState;
  private prev: Scene;
  private t = 0;
  // Phases of the cinematic: intro caption -> shower -> reward toast -> exit
  private duration = 6.0;
  private streaks: Streak[] = [];
  private spawnAccum = 0;
  private applied = false;
  private rewardWater = 2;
  private firstSighting = false;
  private mutatedCount = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    // Force night tones during the shower; brighter palette would
    // wash the streaks out.
    return 'indigo';
  }

  update(dt: number, _input: Input): Scene | null {
    this.t += dt;
    // Spawn 4-6 streaks per second
    this.spawnAccum += dt;
    while (this.spawnAccum > 0.18 && this.t < this.duration - 1.2) {
      this.spawnAccum -= 0.18;
      this.spawnStreak();
    }
    // Advance existing streaks
    for (const s of this.streaks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    }
    this.streaks = this.streaks.filter((s) => s.life > 0 && s.x < SCREEN_W + 8 && s.y < SCREEN_H + 8);

    // Apply reward + meta unlock once near the end.
    if (!this.applied && this.t > this.duration - 1.0) {
      this.applied = true;
      this.state.inventory.water += this.rewardWater;
      // Cosmic radiation from the shower mutates some plants.
      this.mutatedCount = mutateGardenPlants(this.state, 0.35);
      saveRun(this.state);
      const meta = loadMeta();
      if (!meta.witnessedWonders.includes(MeteorShowerScene.ID)) {
        meta.witnessedWonders.push(MeteorShowerScene.ID);
        this.firstSighting = true;
      }
      saveMeta(meta);
    }

    if (this.t >= this.duration) return this.prev;
    return null;
  }

  private spawnStreak(): void {
    // Streaks fall from top-left-ish area, angled down-right.
    const startX = -8 + Math.random() * (SCREEN_W * 0.7);
    const startY = -8 + Math.random() * 20;
    const speed = 80 + Math.random() * 60;
    const angle = 0.6 + Math.random() * 0.2; // radians, mostly down-right
    this.streaks.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed * 2,
      life: 1.4 + Math.random() * 0.6,
      bright: Math.random() < 0.18,
    });
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Faint underlayer so the garden is visible behind the meteors.
    this.prev.draw(ctx, p);
    // Dark overlay to simulate night sky.
    ctx.fillStyle = p[0];
    for (let y = 0; y < SCREEN_H; y += 2) {
      ctx.fillRect(0, y, SCREEN_W, 1);
    }

    // Draw streaks: trailing tail in p[2], head in p[3]; rare ones flash white-ish (p[3] bigger).
    for (const s of this.streaks) {
      const len = 8;
      const tx = s.x - (s.vx / Math.hypot(s.vx, s.vy)) * len;
      const ty = s.y - (s.vy / Math.hypot(s.vx, s.vy)) * len;
      // Tail (3 pixels along the line)
      ctx.fillStyle = p[2];
      for (let i = 1; i <= 3; i++) {
        const fx = Math.round(tx + (s.x - tx) * (i / 4));
        const fy = Math.round(ty + (s.y - ty) * (i / 4));
        ctx.fillRect(fx, fy, 1, 1);
      }
      ctx.fillStyle = p[3];
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1);
      if (s.bright) {
        ctx.fillRect(Math.round(s.x - 1), Math.round(s.y), 1, 1);
        ctx.fillRect(Math.round(s.x), Math.round(s.y - 1), 1, 1);
      }
    }

    // Caption fades in for the first second, then out at the end.
    let captionAlpha: 'none' | 'dim' | 'bright' = 'none';
    if (this.t < 1.2) captionAlpha = 'bright';
    else if (this.t < 2.0) captionAlpha = 'dim';

    if (captionAlpha !== 'none') {
      const msg = 'METEOR SHOWER';
      const w = textWidth5(msg);
      drawText5(ctx, msg, Math.floor((SCREEN_W - w) / 2), 30, captionAlpha === 'bright' ? p[3] : p[2]);
    }

    // Reward / sighting card at the end.
    if (this.t > this.duration - 1.0) {
      const lines: string[] = [];
      lines.push(`+${this.rewardWater} WATER COLLECTED`);
      if (this.mutatedCount > 0) lines.push(`${this.mutatedCount} PLANT(S) MUTATED`);
      if (this.firstSighting) lines.push('NEW SIGHTING LOGGED');
      const boxH = lines.length * LINE5_H + 6;
      const boxW = 124;
      const bx = Math.floor((SCREEN_W - boxW) / 2);
      const by = SCREEN_H - boxH - 14;
      ctx.fillStyle = p[0];
      ctx.fillRect(bx, by, boxW, boxH);
      ctx.fillStyle = p[3];
      ctx.fillRect(bx, by, boxW, 1);
      ctx.fillRect(bx, by + boxH - 1, boxW, 1);
      ctx.fillRect(bx, by, 1, boxH);
      ctx.fillRect(bx + boxW - 1, by, 1, boxH);
      let y = by + 4;
      for (const ln of lines) {
        drawText5(ctx, ln, bx + 4, y, p[3]);
        y += LINE5_H;
      }
    }

    // Footer hint (subtle; you can't skip but the hint reassures).
    const hint = 'WATCHING THE SKY...';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[2]);
  }
}
