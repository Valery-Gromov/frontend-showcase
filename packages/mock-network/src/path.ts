/**
 * Compiles a path pattern (e.g. `/products/:id/details`) into a matcher returning either
 * the extracted params or `null` if the path does not match.
 */
export function compilePathMatcher(
  pattern: string,
): (pathname: string) => Record<string, string> | null {
  const segments = pattern.split('/');

  return (pathname) => {
    const incoming = pathname.split('/');
    if (incoming.length !== segments.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < segments.length; i += 1) {
      const expected = segments[i];
      const actual = incoming[i];
      if (expected === undefined || actual === undefined) return null;
      if (expected.startsWith(':')) {
        const name = expected.slice(1);
        params[name] = decodeURIComponent(actual);
        continue;
      }
      if (expected !== actual) return null;
    }
    return params;
  };
}
