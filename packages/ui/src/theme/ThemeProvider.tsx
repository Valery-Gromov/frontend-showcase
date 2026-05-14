import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type {
  Density,
  ResolvedTheme,
  ThemeContextValue,
  ThemeMode,
  ThemeStorageAdapter,
} from './types';

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_STORAGE_KEY = 'ui:theme-mode';
const VALID_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];
const VALID_DENSITIES: readonly Density[] = ['comfortable', 'compact', 'dense'];

export interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  defaultDensity?: Density;
  storage?: ThemeStorageAdapter;
  storageKey?: string;
}

// Falls back to localStorage when no adapter is provided. Guarded so SSR / non-DOM environments do
// not throw at module load.
function createLocalStorageAdapter(key: string): ThemeStorageAdapter {
  return {
    get() {
      if (typeof window === 'undefined') return null;
      try {
        const raw = window.localStorage.getItem(key);
        if (raw && (VALID_MODES as readonly string[]).includes(raw)) {
          return raw as ThemeMode;
        }
        return null;
      } catch {
        return null;
      }
    },
    set(mode) {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(key, mode);
      } catch {
        // storage unavailable / quota exceeded — ignore, theme still works in-memory
      }
    },
  };
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveMode(mode: ThemeMode, systemTheme: ResolvedTheme): ResolvedTheme {
  return mode === 'system' ? systemTheme : mode;
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
  defaultDensity = 'comfortable',
  storage,
  storageKey = DEFAULT_STORAGE_KEY,
}: ThemeProviderProps) {
  const fallbackAdapterRef = useRef<ThemeStorageAdapter | null>(null);
  if (!storage && fallbackAdapterRef.current === null) {
    fallbackAdapterRef.current = createLocalStorageAdapter(storageKey);
  }
  const effectiveStorage = storage ?? fallbackAdapterRef.current!;

  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [density, setDensityState] = useState<Density>(defaultDensity);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>('light');

  // Read persisted mode and current system preference after mount so SSR output stays stable.
  useEffect(() => {
    const stored = effectiveStorage.get();
    if (stored) setModeState(stored);
    setSystemTheme(getSystemTheme());
  }, [effectiveStorage]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const resolvedMode = resolveMode(mode, systemTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', resolvedMode);
  }, [resolvedMode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-density', density);
  }, [density]);

  const setMode = useCallback(
    (next: ThemeMode) => {
      setModeState(next);
      effectiveStorage.set(next);
    },
    [effectiveStorage],
  );

  const setDensity = useCallback((next: Density) => {
    if (!VALID_DENSITIES.includes(next)) return;
    setDensityState(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolvedMode, setMode, density, setDensity }),
    [mode, resolvedMode, setMode, density, setDensity],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return ctx;
}
