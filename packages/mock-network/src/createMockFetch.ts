import { compilePathMatcher } from './path';
import type {
  MockHttpMethod,
  MockNetworkOptions,
  MockRoute,
  MockRouteContext,
  MockRouteResult,
} from './types';

interface CompiledRoute {
  method: MockHttpMethod;
  match: (pathname: string) => Record<string, string> | null;
  handler: MockRoute['handler'];
}

function pickLatency(options: MockNetworkOptions): number {
  const min = options.latency?.min ?? 0;
  const max = Math.max(min, options.latency?.max ?? 0);
  if (max === 0) return 0;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toResponse(result: MockRouteResult): Response {
  const status = result.status ?? 200;
  const headers = new Headers(result.headers);
  if (result.body === undefined) {
    return new Response(null, { status, headers });
  }
  if (typeof result.body === 'string') {
    if (!headers.has('content-type')) headers.set('content-type', 'text/plain');
    return new Response(result.body, { status, headers });
  }
  if (!headers.has('content-type')) headers.set('content-type', 'application/json');
  return new Response(JSON.stringify(result.body), { status, headers });
}

async function readBody(request: Request): Promise<unknown> {
  if (request.method === 'GET' || request.method === 'DELETE') return undefined;
  const text = await request.clone().text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parseUrl(input: RequestInfo | URL): URL {
  if (input instanceof URL) return input;
  const raw = typeof input === 'string' ? input : input.url;
  const base =
    typeof globalThis.location !== 'undefined' ? globalThis.location.origin : 'http://mock.local';
  return new URL(raw, base);
}

/**
 * Build a `fetch`-compatible function that resolves requests against a list of declarative
 * routes. Designed for dev/demo and tests, not for production usage.
 *
 * Order of routes matters: the first matching `(method, pattern)` wins.
 */
export function createMockFetch(routes: MockRoute[], options: MockNetworkOptions = {}) {
  const compiled: CompiledRoute[] = routes.map((route) => ({
    method: route.method,
    match: compilePathMatcher(route.pattern),
    handler: route.handler,
  }));
  const unmatchedAs404 = options.unmatchedAs404 ?? 1;

  return async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = parseUrl(input);
    const request = new Request(url.toString(), init);
    const method = (request.method.toUpperCase() as MockHttpMethod) || 'GET';

    const latency = pickLatency(options);
    if (latency > 0) {
      await delay(latency);
    }

    if (typeof options.flakyChance === 'number' && Math.random() < options.flakyChance) {
      return new Response(JSON.stringify({ error: 'Service Unavailable' }), {
        status: 503,
        headers: { 'content-type': 'application/json' },
      });
    }

    for (const route of compiled) {
      if (route.method !== method) continue;
      const params = route.match(url.pathname);
      if (!params) continue;

      const ctx: MockRouteContext = {
        url: request.url,
        query: url.searchParams,
        params,
        body: await readBody(request),
        request,
      };
      const result = await route.handler(ctx);
      return toResponse(result);
    }

    if (Math.random() < unmatchedAs404) {
      return new Response(JSON.stringify({ error: `No mock route for ${method} ${url.pathname}` }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(null, { status: 200 });
  };
}
