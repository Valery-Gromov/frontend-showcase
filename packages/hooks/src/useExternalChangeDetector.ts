import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseExternalChangeDetectorOptionsType<T> {
  /** Polling interval in ms. */
  intervalMs: number;
  /**
   * Probe function returning a fingerprint of external state. Compared by `equals` (default
   * `===`) against the last seen fingerprint to decide whether external state changed.
   */
  probe: () => T | Promise<T>;
  /** Equality comparator. Defaults to `Object.is`. */
  equals?: (a: T, b: T) => boolean;
  /**
   * If `true`, the hook does NOT consider the very first probe a change. Useful when the
   * component just rendered and is implicitly "fresh". Defaults to `true`.
   */
  startFresh?: boolean;
}

export interface UseExternalChangeDetectorResultType {
  isOutdated: boolean;
  /**
   * Manually mark the component as fresh against the latest external state. Typically called
   * after a successful refetch.
   */
  markFresh: () => void;
}

/**
 * Detects out-of-band changes to external state by polling a probe function and comparing the
 * result to the last seen fingerprint. Flips `isOutdated` to true whenever the fingerprint
 * changes; the consumer calls `markFresh()` after a refetch to acknowledge it.
 *
 * Stateless about *what* changed — just whether something did. Callers decide how to show the
 * notice and how to recover.
 */
export function useExternalChangeDetector<T>(
  options: UseExternalChangeDetectorOptionsType<T>,
): UseExternalChangeDetectorResultType {
  const { intervalMs, probe, equals = Object.is, startFresh = true } = options;

  const [isOutdated, setIsOutdated] = useState(false);
  const lastSeenRef = useRef<{ value: T } | null>(null);
  const initialized = useRef(false);
  const probeRef = useRef(probe);
  const equalsRef = useRef(equals);

  useEffect(() => {
    probeRef.current = probe;
  }, [probe]);

  useEffect(() => {
    equalsRef.current = equals;
  }, [equals]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const current = await probeRef.current();
      if (cancelled) return;

      if (!initialized.current) {
        initialized.current = true;
        lastSeenRef.current = { value: current };
        if (!startFresh) {
          setIsOutdated(true);
        }
        return;
      }

      const prev = lastSeenRef.current?.value;
      if (prev === undefined || !equalsRef.current(prev, current)) {
        lastSeenRef.current = { value: current };
        setIsOutdated(true);
      }
    };

    const handle = window.setInterval(() => {
      void tick();
    }, intervalMs);

    void tick();

    return () => {
      cancelled = true;
      window.clearInterval(handle);
    };
  }, [intervalMs, startFresh]);

  const markFresh = useCallback(() => {
    setIsOutdated(false);
    void Promise.resolve(probeRef.current()).then((value) => {
      lastSeenRef.current = { value };
    });
  }, []);

  return { isOutdated, markFresh };
}
