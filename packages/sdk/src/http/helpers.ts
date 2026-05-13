import type { HttpMethod } from './types';

/**
 * AbortController with timeout; call `dispose` in `finally` to clear the timer even if the
 * request succeeded earlier.
 */
export function createTimedAbortController(timeoutMs: number): {
  controller: AbortController;
  dispose: () => void;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  return {
    controller,
    dispose: () => {
      clearTimeout(timeoutId);
    },
  };
}

const IDEMPOTENT_METHODS: ReadonlySet<HttpMethod> = new Set<HttpMethod>(['GET', 'PUT', 'DELETE']);

export function isIdempotentMethod(method: HttpMethod): boolean {
  return IDEMPOTENT_METHODS.has(method);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function mergeHeaders(...sources: Array<HeadersInit | undefined>): Headers {
  const merged = new Headers();
  for (const source of sources) {
    if (!source) continue;
    const headers = new Headers(source);
    headers.forEach((value, key) => {
      merged.set(key, value);
    });
  }
  return merged;
}
