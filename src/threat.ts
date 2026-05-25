// Threats — hostile night events that damage shelter stats.
// Counterpart to wonders: same cinematic shape, warning tones,
// and a damage card at the end instead of a reward.
//
// Three starter threats:
//   METEOR STRIKE  -2 hull   (different from the meteor SHOWER wonder)
//   ACRID FOG      -2 oxygen
//   POWER SURGE    -2 power

import { drawText, textWidth } from './font';
import { drawText5, LINE5_H, textWidth5 } from './font5';
import { type Input } from './input';
import type { Palette, PaletteName } from './palette';
import { saveRun } from './save';
import type { Scene } from './scene';
import type { RunState, Shelter } from './types';
import { GameOverScene } from './gameover';

const SCREEN_W = 160;
const SCREEN_H = 144;

export type ThreatId = 'meteor_strike' | 'acrid_fog' | 'power_surge';

interface ThreatDef {
  id: ThreatId;
  label: string;
  apply(s: Shelter): void;
  damageMsg: string;
}

const THREATS: ThreatDef[] = [
  {
    id: 'meteor_strike',
    label: 'METEOR STRIKE',
    apply: (s) => { s.hull = Math.max(0, s.hull - 2); },
    damageMsg: '-2 HULL',
  },
  {
    id: 'acrid_fog',
    label: 'ACRID FOG',
    apply: (s) => { s.oxygen = Math.max(0, s.oxygen - 2); },
    damageMsg: '-2 OXYGEN',
  },
  {
    id: 'power_surge',
    label: 'POWER SURGE',
    apply: (s) => { s.power = Math.max(0, s.power - 2); },
    damageMsg: '-2 POWER',
  },
];

export function pickThreat(): ThreatDef {
  return THREATS[Math.floor(Math.random() * THREATS.length)];
}

export class ThreatScene implements Scene {
  private state: RunState;
  private prev: Scene;
  private threat: ThreatDef;
  private t = 0;
  private duration = 5.5;
  private applied = false;
  // Random shake/streak coords for the cinematic.
  private flashes: { x: number; y: number; life: number }[] = [];
  private spawnAccum = 0;

  constructor(state: RunState, threat: ThreatDef, prev: Scene) {
    this.state = state;
    this.threat = threat;
    this.prev = prev;
  }

  paletteName(): PaletteName {
    return 'ember'; // warm-warning tones for any threat
  }

  update(dt: number, _input: Input): Scene | null {
    this.t += dt;

    // Spawn small effects until just before the card appears.
    this.spawnAccum += dt;
    while (this.spawnAccum > 0.12 && this.t < this.duration - 1.0) {
      this.spawnAccum -= 0.12;
      this.flashes.push({
        x: Math.floor(Math.random() * SCREEN_W),
        y: 12 + Math.floor(Math.random() * (SCREEN_H - 30)),
        life: 0.35 + Math.random() * 0.25,
      });
    }
    for (const f of this.flashes) f.life -= dt;
    this.flashes = this.flashes.filter((f) => f.life > 0);

    if (!this.applied && this.t > this.duration - 1.0) {
      this.applied = true;
      this.threat.apply(this.state.shelter);
      saveRun(this.state);
    }

    if (this.t >= this.duration) {
      // If the threat killed a stat, drop into game over instead of
      // returning to the garden.
      const dead = this.state.shelter.hull === 0 || this.state.shelter.oxygen === 0 || this.state.shelter.power === 0;
      return dead ? new GameOverScene(this.state, this.threat.label) : this.prev;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, p: Palette): void {
    // Underlay the garden, then dark wash.
    this.prev.draw(ctx, p);
    ctx.fillStyle = p[0];
    for (let y = 0; y < SCREEN_H; y += 2) ctx.fillRect(0, y, SCREEN_W, 1);

    // Pulsing flashes
    for (const f of this.flashes) {
      ctx.fillStyle = f.life > 0.2 ? p[3] : p[2];
      ctx.fillRect(f.x, f.y, 2, 2);
    }

    // Caption fade-in
    if (this.t < 1.6) {
      const msg = this.threat.label;
      drawText5(ctx, msg, Math.floor((SCREEN_W - textWidth5(msg)) / 2), 30, p[3]);
      const sub = 'INCOMING';
      drawText(ctx, sub, Math.floor((SCREEN_W - textWidth(sub)) / 2), 44, p[2]);
    }

    // Damage card at the end
    if (this.t > this.duration - 1.0) {
      const lines = [this.threat.damageMsg];
      const boxH = lines.length * LINE5_H + 6;
      const boxW = 100;
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

    const hint = 'BRACE FOR IMPACT...';
    drawText(ctx, hint, Math.floor((SCREEN_W - textWidth(hint)) / 2), SCREEN_H - 7, p[2]);
  }
}
