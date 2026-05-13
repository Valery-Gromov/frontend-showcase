import { useCallback, useEffect, useState } from 'react';

export type UrlHistoryModeType = 'push' | 'replace';

export interface UseUrlQueryStateOptionsType<T> {
  /** Parse a `URLSearchParams.toString()` into the typed state. */
  read: (search: string) => T;
  /**
   * Serialize the typed state back to a query string (with or without the leading `?`).
   * Return an empty string to clear the search portion.
   */
  write: (value: T) => string;
  /**
   * Comparator used to skip no-op URL writes. Defaults to a structural JSON comparison, which
   * is fine for query-shaped objects.
   */
  equals?: (a: T, b: T) => boolean;
  /** Whether to use `pushState` or `replaceState`. Defaults to `push`. */
  historyMode?: UrlHistoryModeType;
}

function defaultEquals<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function buildUrlWithSearch(search: string): string {
  const cleanSearch = search.startsWith('?') ? search : search.length > 0 ? `?${search}` : '';
  const { pathname, hash } = window.location;
  return `${pathname}${cleanSearch}${hash}`;
}

/**
 * Two-way bind a typed state to the URL's query portion.
 *
 * - On mount, parses `window.location.search` via `read`.
 * - On `popstate`, re-parses and updates state (so browser back/forward works).
 * - On `setValue`, writes the next state to the URL via `pushState` or `replaceState`.
 *
 * The hook does not own the *meaning* of the state — it only owns the URL sync. Callers
 * provide `read`/`write` to keep the URL shape under their control.
 */
export function useUrlQueryState<T>(
  options: UseUrlQueryStateOptionsType<T>,
): readonly [T, (next: T, historyOverride?: UrlHistoryModeType) => void] {
  const { read, write, equals = defaultEquals, historyMode = 'push' } = options;

  const [value, setValueState] = useState<T>(() => read(window.location.search));

  useEffect(() => {
    const onPopState = () => {
      setValueState(read(window.location.search));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [read]);

  const setValue = useCallback(
    (next: T, historyOverride?: UrlHistoryModeType) => {
      setValueState((current) => {
        if (equals(current, next)) return current;
        const search = write(next);
        const url = buildUrlWithSearch(search);
        const mode = historyOverride ?? historyMode;
        if (mode === 'replace') {
          window.history.replaceState(window.history.state, '', url);
        } else {
          window.history.pushState(window.history.state, '', url);
        }
        return next;
      });
    },
    [equals, historyMode, write],
  );

  return [value, setValue] as const;
}
