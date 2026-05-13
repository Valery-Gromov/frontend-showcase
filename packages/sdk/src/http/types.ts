export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const httpMethods = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE',
} as const;

/**
 * `fetch`-compatible function. Provided by the host (global `fetch` in browsers/Node 18+) or
 * injected from a mock transport in tests/demos.
 */
export type FetchFunctionType = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface HttpRetryPolicyType {
  /** Maximum number of additional attempts after the first one. Defaults to 0. */
  maxRetries: number;
  /** Initial delay in ms. Defaults to 200. */
  initialDelayMs?: number;
  /** Multiplier for exponential backoff. Defaults to 2. */
  backoffFactor?: number;
  /**
   * HTTP status codes that are considered retryable. Defaults to `[502, 503, 504]`.
   * Network/timeout errors are always retryable.
   */
  retryableStatuses?: number[];
}

export interface HttpClientConfigType {
  baseUrl: string;
  /** Defaults to 5000 ms. */
  timeout?: number;
  /** Injectable fetch implementation. Defaults to `globalThis.fetch`. */
  fetch?: FetchFunctionType;
  /** Retry policy applied only to idempotent methods (GET/PUT/DELETE). Defaults to no retries. */
  retry?: HttpRetryPolicyType;
  /** Optional headers merged into every request. */
  defaultHeaders?: HeadersInit;
}

export type HttpClientErrorCodeType =
  | 'HTTP_ERROR'
  | 'TIMEOUT_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR';

export interface HttpClientErrorType {
  status?: number;
  method?: HttpMethod;
  url?: string;
  code?: HttpClientErrorCodeType;
  /** Parsed response body if the server returned JSON (or string if not JSON). Best-effort. */
  responseBody?: unknown;
  cause?: unknown;
}

export class HttpClientError extends Error {
  status?: number;
  method?: HttpMethod;
  url?: string;
  code?: HttpClientErrorCodeType;
  responseBody?: unknown;
  override cause?: unknown;

  constructor(message: string, options?: HttpClientErrorType) {
    super(message);
    this.name = 'HttpClientError';
    this.status = options?.status;
    this.method = options?.method;
    this.url = options?.url;
    this.code = options?.code;
    this.responseBody = options?.responseBody;
    this.cause = options?.cause;
  }
}
