// Player survival state. AIR is the primary meter — the planet's atmosphere
// is hostile, so being outside the bunker drains it constantly. SUIT integrity
// drops slower; once AIR hits 0, HP starts taking real damage.
//
// All depletion rates are tuned snappy for testing — at the defaults, a fresh
// player passes out in roughly 1 minute of garden time. M4 potions will be
// how meters are restored mid-play.

export const AIR_MAX = 100;
export const SUIT_MAX = 100;
export const HP_MAX = 100;

export const AIR_CRITICAL = 25;

export const AIR_DRAIN_PER_SEC = 1.5;
export const SUIT_DRAIN_PER_SEC = 0.5;
export const HP_DRAIN_AT_NO_AIR_PER_SEC = 6;

export class PlayerState {
  air = AIR_MAX;
  suit = SUIT_MAX;
  hp = HP_MAX;
  inBunker = true;

  /** Returns true on the frame the player passes out (HP hit 0). */
  update(deltaMs: number): { died: boolean } {
    if (this.inBunker) return { died: false };

    const dt = deltaMs / 1000;
    this.air = Math.max(0, this.air - AIR_DRAIN_PER_SEC * dt);
    this.suit = Math.max(0, this.suit - SUIT_DRAIN_PER_SEC * dt);

    if (this.air <= 0) {
      const before = this.hp;
      this.hp = Math.max(0, this.hp - HP_DRAIN_AT_NO_AIR_PER_SEC * dt);
      if (before > 0 && this.hp <= 0) return { died: true };
    }
    return { died: false };
  }

  enterBunker(): void {
    this.inBunker = true;
  }

  exitBunker(): void {
    this.inBunker = false;
  }

  toggleBunker(): boolean {
    this.inBunker = !this.inBunker;
    return this.inBunker;
  }

  // Auto-revive after a passout: drop the player back in the bunker with half
  // meters. Death is non-permanent in M3 — losing a sol is the real cost.
  resuscitate(): void {
    this.air = 50;
    this.suit = 50;
    this.hp = 50;
    this.inBunker = true;
  }

  airCritical(): boolean {
    return this.air > 0 && this.air < AIR_CRITICAL;
  }
}
