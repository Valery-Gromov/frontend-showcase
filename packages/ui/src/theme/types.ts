export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact' | 'dense';

export interface ThemeStorageAdapter {
  get(): ThemeMode | null;
  set(mode: ThemeMode): void;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  density: Density;
  setDensity: (density: Density) => void;
}
