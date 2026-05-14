import { createTypedStorage } from '@frontend-showcase/sdk';
import type { ThemeMode, ThemeStorageAdapter } from '@frontend-showcase/ui';

const THEME_KEY = 'theme-mode';
const VALID_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];

const storage = createTypedStorage({ prefix: 'log-viewer:' });

export const themeStorage: ThemeStorageAdapter = {
  get() {
    try {
      const value = storage.get<ThemeMode>(THEME_KEY);
      if (value && (VALID_MODES as readonly string[]).includes(value)) return value;
      return null;
    } catch {
      return null;
    }
  },
  set(mode) {
    try {
      storage.set(THEME_KEY, mode);
    } catch {
      // Theme remains in-memory if storage is unavailable.
    }
  },
};
