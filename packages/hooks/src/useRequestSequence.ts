import { useCallback, useMemo, useRef } from 'react';

export interface RequestTokenType {
  /** True if no newer token has been issued since this one was created. */
  readonly isLatest: boolean;
}

export interface RequestSequenceType {
  /**
   * Issues a new token. Any previously issued tokens immediately become non-latest.
   * Call `next()` right before starting an async operation, and check `token.isLatest`
   * before committing the result to component state.
   */
  next: () => RequestTokenType;
}

/**
 * Tracks an evolving "latest request" pointer to drop stale async responses. This is the
 * race-condition guard that wraps the common pattern:
 *
 *   const tokenRef = useRef(0);
 *   const seq = ++tokenRef.current;
 *   const result = await fetch(...);
 *   if (seq !== tokenRef.current) return;
 *
 * with a clearer API. Each call to `next()` produces a token whose `isLatest` getter compares
 * against the current sequence number, so component code reads cleanly:
 *
 *   const requestSequence = useRequestSequence();
 *   const token = requestSequence.next();
 *   const result = await fetch(...);
 *   if (!token.isLatest) return;
 */
export function useRequestSequence(): RequestSequenceType {
  const latestRef = useRef(0);

  const next = useCallback<RequestSequenceType['next']>(() => {
    latestRef.current += 1;
    const issuedAt = latestRef.current;
    return {
      get isLatest() {
        return latestRef.current === issuedAt;
      },
    };
  }, []);

  return useMemo(() => ({ next }), [next]);
}
