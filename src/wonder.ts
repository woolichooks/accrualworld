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
import { sfx } from './audio';
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
    sfx.meteor();
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

// ---- Firefly Swarm ------------------------------------------------------
// Bioluminescent drift across the garden. Gentle pulse. Awards +1 of
// every seed type and may trigger mutations like other wonders.

interface Firefly { x: number; y: number; vx: number; vy: number; phase: number; }

export class FireflySwarmScene implements Scene {
  static readonly ID = 'firefly_swarm';

  private state: RunState;
  private prev: Scene;
  private t = 0;
  private duration = 5.5;
  private flies: Firefly[] = [];
  private applied = false;
  private firstSighting = false;
  private mutatedCount = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
    sfx.wonder();
    for (let i = 0; i < 22; i++) {
      this.flies.push({
        x: Math.random() * SCREEN_W,
        y: 30 + Math.random() * (SCREEN_H - 60),
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.5) * 10,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  paletteName(): PaletteName { return 'indigo'; }

  update(dt: number, _input: Input): Scene | null {
    this.t += dt;
    for (const f of this.flies) {
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < 0 || f.x > SCREEN_W) f.vx *= -1;
      if (f.y < 20 || f.y > SCREEN_H - 18) f.vy *= -1;
      f.phase += dt * 3;
    }
    if (!this.applied && this.t > this.duration - 1.0) {
      this.applied = true;
      this.state.inventory.seeds.mint += 1;
      this.state.inventory.seeds.sunflower += 1;
      this.state.inventory.seeds.basil += 1;
      this.mutatedCount = mutateGardenPlants(this.state, 0.35);
      saveRun(this.state);
      const meta = loadMeta();
      if (!meta.witnessedWonders.includes(FireflySwarmScene.ID)) {
        meta.witnessedWonders.push(FireflySwarmScene.ID);
        this.firstSighting = true;
      }
      saveMeta(meta);
    }
    if (this.t >= this.duration) return this.prev;
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    for (let y = 0; y < SCREEN_H; y += 2) ctx.fillRect(0, y, SCREEN_W, 1);

    for (const f of this.flies) {
      const glow = (Math.sin(f.phase) + 1) * 0.5;
      ctx.fillStyle = glow > 0.5 ? p[3] : p[2];
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
    }

    if (this.t < 1.6) {
      const msg = 'FIREFLY SWARM';
      drawText5(ctx, msg, Math.floor((SCREEN_W - textWidth5(msg)) / 2), 30, p[3]);
    }

    if (this.t > this.duration - 1.0) {
      const lines = ['+1 MINT  +1 SUN  +1 BASIL'];
      if (this.mutatedCount > 0) lines.push(`${this.mutatedCount} PLANT(S) MUTATED`);
      if (this.firstSighting) lines.push('NEW SIGHTING LOGGED');
      drawCard(ctx, lines, p);
    }

    const hint = 'WATCHING THE DRIFT...';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[2]);
  }
}

// ---- Twin Moons ---------------------------------------------------------
// Both moons align over the horizon. Each currently-growing plant
// advances one stage immediately, capped at MATURE. No mutation roll —
// the moons are nurturing, not radiative.

export class TwinMoonsScene implements Scene {
  static readonly ID = 'twin_moons';

  private state: RunState;
  private prev: Scene;
  private t = 0;
  private duration = 5.0;
  private applied = false;
  private firstSighting = false;
  private advanced = 0;

  constructor(state: RunState, prev: Scene) {
    this.state = state;
    this.prev = prev;
    sfx.wonder();
  }

  paletteName(): PaletteName { return 'indigo'; }

  update(dt: number, _input: Input): Scene | null {
    this.t += dt;
    if (!this.applied && this.t > this.duration - 1.0) {
      this.applied = true;
      for (const tile of this.state.tiles) {
        if (!tile.species) continue;
        if (tile.stage >= 1 && tile.stage <= 3) {
          tile.stage = (tile.stage + 1) as 1 | 2 | 3 | 4;
          tile.stageStartedAt = this.state.gameTime;
          this.advanced += 1;
        }
      }
      saveRun(this.state);
      const meta = loadMeta();
      if (!meta.witnessedWonders.includes(TwinMoonsScene.ID)) {
        meta.witnessedWonders.push(TwinMoonsScene.ID);
        this.firstSighting = true;
      }
      saveMeta(meta);
    }
    if (this.t >= this.duration) return this.prev;
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    for (let y = 0; y < SCREEN_H; y += 2) ctx.fillRect(0, y, SCREEN_W, 1);

    // Two moons cresting over the horizon, slowly rising.
    const rise = Math.min(this.t / 2.0, 1.0);
    const baseY = 80 - Math.floor(rise * 30);
    drawMoon(ctx, 48, baseY, p);
    drawMoon(ctx, 110, baseY - 6, p);

    if (this.t < 1.8) {
      const msg = 'TWIN MOONS ALIGN';
      drawText5(ctx, msg, Math.floor((SCREEN_W - textWidth5(msg)) / 2), 22, p[3]);
    }

    if (this.t > this.duration - 1.0) {
      const lines = [`${this.advanced} PLANT(S) BLOOMED`];
      if (this.firstSighting) lines.push('NEW SIGHTING LOGGED');
      drawCard(ctx, lines, p);
    }

    const hint = 'WATCHING THE SKY...';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[2]);
  }
}

function drawMoon(ctx: CanvasRenderingContext2D, cx: number, cy: number, p: Palette): void {
  // Soft 7x7 moon: outline in p[2], face in p[3], crescent shadow in p[1].
  const pix = [
    [0, 1, 1, 1, 1, 1, 0],
    [1, 2, 2, 2, 2, 1, 0],
    [1, 2, 2, 2, 1, 0, 0],
    [1, 2, 2, 1, 0, 0, 0],
    [1, 2, 2, 2, 1, 0, 0],
    [1, 2, 2, 2, 2, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
  ];
  for (let yy = 0; yy < pix.length; yy++) {
    for (let xx = 0; xx < pix[yy].length; xx++) {
      const v = pix[yy][xx];
      if (v === 0) continue;
      ctx.fillStyle = v === 1 ? p[2] : p[3];
      ctx.fillRect(cx + xx - 3, cy + yy - 3, 1, 1);
    }
  }
}

function drawCard(ctx: CanvasRenderingContext2D, lines: string[], p: Palette): void {
  const boxH = lines.length * LINE5_H + 6;
  const boxW = 130;
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

// ---- Wonder registry ---------------------------------------------------
export interface WonderDef {
  id: string;
  name: string;
  description: string;
  make(state: RunState, prev: Scene): Scene;
}

export const WONDERS: WonderDef[] = [
  {
    id: MeteorShowerScene.ID,
    name: 'METEOR SHOWER',
    description: 'COSMIC RAIN. +WATER. PLANTS MAY MUTATE.',
    make: (s, p) => new MeteorShowerScene(s, p),
  },
  {
    id: FireflySwarmScene.ID,
    name: 'FIREFLY SWARM',
    description: 'BIOLUMINESCENT DRIFT. +1 OF EACH SEED.',
    make: (s, p) => new FireflySwarmScene(s, p),
  },
  {
    id: TwinMoonsScene.ID,
    name: 'TWIN MOONS',
    description: 'MOONS ALIGN. PLANTS LEAP ONE STAGE.',
    make: (s, p) => new TwinMoonsScene(s, p),
  },
];

export function pickWonder(state: RunState, prev: Scene): Scene {
  const w = WONDERS[Math.floor(Math.random() * WONDERS.length)];
  return w.make(state, prev);
}

export function wonderById(id: string): WonderDef | undefined {
  return WONDERS.find((w) => w.id === id);
}
