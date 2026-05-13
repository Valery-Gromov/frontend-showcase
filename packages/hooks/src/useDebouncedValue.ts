import { useEffect, useState } from 'react';

/**
 * Returns a debounced version of `value`. The output trails the input by at most `delayMs`
 * milliseconds of "quiet time" since the last input change.
 *
 * Useful for input-driven server filters: connect `value` to the latest input, pipe the result
 * into the request, and the client only fires once typing pauses.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => window.clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
}
