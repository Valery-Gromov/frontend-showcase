/**
 * AbortController с таймаутом; вызывайте `dispose` в `finally`, чтобы снять таймер.
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
