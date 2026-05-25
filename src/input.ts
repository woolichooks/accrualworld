// Virtual handheld buttons. Keyboard + on-screen buttons feed the same
// state. Game code only reads `pressed` (held) and `justPressed` (edge).

export type Button = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start' | 'select' | 'tab';

const BUTTONS: Button[] = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select', 'tab'];

// Keyboard mapping:
//   Arrow keys      -> D-pad
//   A / Z / J       -> A button   (A is the natural choice; Z/J kept
//                                  as alternates for muscle memory)
//   B / X / K       -> B button
//   Enter           -> Start
//   Shift           -> Select
// WASD movement is intentionally dropped because A/D would collide
// with the A button. W and S are kept for vertical scrolling only.
const KEY_MAP: Record<string, Button> = {
  ArrowUp: 'up',       w: 'up',   W: 'up',
  ArrowDown: 'down',   s: 'down', S: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'a', A: 'a', z: 'a', Z: 'a', j: 'a', J: 'a',
  b: 'b', B: 'b', x: 'b', X: 'b', k: 'b', K: 'b',
  Enter: 'start',
  Shift: 'select',
  // Tab cycles tabbed UIs (currently the Codex). Default focus
  // movement is suppressed via preventDefault on keydown.
  Tab: 'tab',
};

export class Input {
  private held = new Set<Button>();
  private edge = new Set<Button>();
  private consumed = new Set<Button>();

  constructor(root: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      const b = KEY_MAP[e.key];
      if (!b) return;
      e.preventDefault();
      if (!this.held.has(b)) this.edge.add(b);
      this.held.add(b);
    });
    window.addEventListener('keyup', (e) => {
      const b = KEY_MAP[e.key];
      if (!b) return;
      e.preventDefault();
      this.held.delete(b);
      this.consumed.delete(b);
    });

    // On-screen buttons: any element with data-btn="<name>"
    for (const el of root.querySelectorAll<HTMLElement>('[data-btn]')) {
      const b = el.dataset.btn as Button;
      if (!BUTTONS.includes(b)) continue;
      const press = (ev: Event) => {
        ev.preventDefault();
        if (!this.held.has(b)) this.edge.add(b);
        this.held.add(b);
        el.classList.add('pressed');
      };
      const release = (ev: Event) => {
        ev.preventDefault();
        this.held.delete(b);
        this.consumed.delete(b);
        el.classList.remove('pressed');
      };
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerup', release);
      el.addEventListener('pointercancel', release);
      el.addEventListener('pointerleave', release);
    }
  }

  pressed(b: Button): boolean { return this.held.has(b); }

  // True once per physical press. Caller "consumes" by reading it; resets on release.
  justPressed(b: Button): boolean {
    if (this.edge.has(b) && !this.consumed.has(b)) {
      this.edge.delete(b);
      this.consumed.add(b);
      return true;
    }
    return false;
  }
}
