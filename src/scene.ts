// Shared Scene interface. Lives in its own file so scenes can import
// each other without circular type dependencies.

import type { Input } from './input';
import type { Palette } from './palette';

export interface Scene {
  update(dt: number, input: Input): Scene | null;
  draw(ctx: CanvasRenderingContext2D, p: Palette): void;
}
