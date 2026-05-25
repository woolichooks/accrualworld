// Shared Scene interface. Lives in its own file so scenes can import
// each other without circular type dependencies.

import type { Input } from './input';
import type { Palette, PaletteName } from './palette';

export interface Scene {
  update(dt: number, input: Input): Scene | null;
  draw(ctx: CanvasRenderingContext2D, p: Palette): void;
  // Each scene exposes its preferred world palette. Overlay scenes
  // (menu, puzzle, wonder) typically delegate to the scene they wrap
  // so the world tone follows the underlying time of day.
  paletteName?(): PaletteName;
}
