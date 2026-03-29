export function getDefaultStorage(): Storage | null {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
