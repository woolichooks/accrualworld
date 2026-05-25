// Screen-shake controller. Scenes call startShake(); main applies a
// random pixel-aligned translate before drawing each frame and resets
// after. Trauma decays linearly so the effect feels punchy not jittery.

let amplitude = 0;
let timer = 0;
let totalDuration = 0;

export function startShake(amp: number, durationSec: number): void {
  amplitude = Math.max(amplitude, amp);
  if (durationSec > timer) {
    timer = durationSec;
    totalDuration = durationSec;
  }
}

export function updateShake(dt: number): void {
  if (timer <= 0) { amplitude = 0; return; }
  timer -= dt;
  if (timer < 0) timer = 0;
}

export function getShakeOffset(): { x: number; y: number } {
  if (timer <= 0 || amplitude <= 0) return { x: 0, y: 0 };
  const factor = totalDuration > 0 ? timer / totalDuration : 0;
  const amp = amplitude * factor;
  return {
    x: Math.round((Math.random() - 0.5) * 2 * amp),
    y: Math.round((Math.random() - 0.5) * 2 * amp),
  };
}
