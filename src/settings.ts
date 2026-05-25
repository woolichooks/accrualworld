// Persistent player settings. Lives under accrualworld.settings.v1 so
// it survives across runs and even run deletions. Houses the SFX
// toggle and the theme (bezel + screen palette) choice.

import type { ThemeId } from './themes';

const KEY = 'accrualworld.settings.v1';

export interface Settings {
  schema: 1;
  sfxEnabled: boolean;
  theme: ThemeId;
}

const DEFAULTS: Settings = {
  schema: 1,
  sfxEnabled: true,
  theme: 'acrid',
};

let cache: Settings | null = null;

export function loadSettings(): Settings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) { cache = { ...DEFAULTS }; return cache; }
    const data = JSON.parse(raw) as Settings;
    if (data.schema !== 1) { cache = { ...DEFAULTS }; return cache; }
    data.sfxEnabled ??= DEFAULTS.sfxEnabled;
    data.theme ??= DEFAULTS.theme;
    cache = data;
    return cache;
  } catch {
    cache = { ...DEFAULTS };
    return cache;
  }
}

export function saveSettings(s: Settings): void {
  cache = s;
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}
