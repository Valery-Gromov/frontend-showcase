export type MockHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MockRouteContext {
  /** Full URL passed to the fake fetch. */
  url: string;
  /** Parsed query string. */
  query: URLSearchParams;
  /** Path params extracted from the pattern, e.g. `:id`. */
  params: Record<string, string>;
  /** Parsed JSON body for non-GET requests, `undefined` if missing or unparseable. */
  body: unknown;
  /** Raw Request object for advanced cases. */
  request: Request;
}

export interface MockRouteResult {
  /** HTTP status. Defaults to 200. */
  status?: number;
  /** Response body. Will be JSON-stringified if not a string already. */
  body?: unknown;
  headers?: HeadersInit;
}

export type MockRouteHandler = (
  ctx: MockRouteContext,
) => MockRouteResult | Promise<MockRouteResult>;

export interface MockRoute {
  method: MockHttpMethod;
  /** Path pattern with optional named params, e.g. `/products/:id`. */
  pattern: string;
  handler: MockRouteHandler;
}

export interface MockLatencyConfig {
  /** Minimum delay in ms. Defaults to 0. */
  min?: number;
  /** Maximum delay in ms. Defaults to 0. */
  max?: number;
}

export interface MockNetworkOptions {
  latency?: MockLatencyConfig;
  /**
   * Probability in [0, 1] of returning a 503 instead of invoking the route handler.
   * Useful to demo retry policies.
   */
  flakyChance?: number;
  /**
   * Probability in [0, 1] of returning a 404 when no matching route is found.
   * Defaults to 1; set to 0 to silently return an empty 200.
   */
  unmatchedAs404?: number;
}
