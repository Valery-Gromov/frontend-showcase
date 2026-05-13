import { createTimedAbortController, delay, isIdempotentMethod, mergeHeaders } from './helpers';
import {
  HttpClientError,
  type FetchFunctionType,
  type HttpClientConfigType,
  type HttpMethod,
  type HttpRetryPolicyType,
  httpMethods,
} from './types';

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_INITIAL_RETRY_DELAY_MS = 200;
const DEFAULT_BACKOFF_FACTOR = 2;
const DEFAULT_RETRYABLE_STATUSES: readonly number[] = [502, 503, 504];

function resolveFetch(injected?: FetchFunctionType): FetchFunctionType {
  if (injected) return injected;
  if (typeof globalThis.fetch === 'function') return globalThis.fetch.bind(globalThis);
  throw new Error('No fetch implementation available. Provide `config.fetch` when constructing HttpClient.');
}

async function readResponseBodySafely(res: Response): Promise<unknown> {
  try {
    const text = await res.clone().text();
    if (!text) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

function isRetryableError(error: unknown, retryableStatuses: readonly number[]): boolean {
  if (!(error instanceof HttpClientError)) return true;
  if (error.code === 'TIMEOUT_ERROR' || error.code === 'NETWORK_ERROR') return true;
  if (error.code === 'HTTP_ERROR' && typeof error.status === 'number') {
    return retryableStatuses.includes(error.status);
  }
  return false;
}

class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly fetchFn: FetchFunctionType;
  private readonly retry: Required<Omit<HttpRetryPolicyType, 'retryableStatuses'>> & {
    retryableStatuses: readonly number[];
  };
  private readonly defaultHeaders?: HeadersInit;

  constructor(config: HttpClientConfigType) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = resolveFetch(config.fetch);
    this.defaultHeaders = config.defaultHeaders;
    this.retry = {
      maxRetries: config.retry?.maxRetries ?? 0,
      initialDelayMs: config.retry?.initialDelayMs ?? DEFAULT_INITIAL_RETRY_DELAY_MS,
      backoffFactor: config.retry?.backoffFactor ?? DEFAULT_BACKOFF_FACTOR,
      retryableStatuses: config.retry?.retryableStatuses ?? DEFAULT_RETRYABLE_STATUSES,
    };
  }

  private async performOnce<T>(
    method: HttpMethod,
    path: string,
    headers?: HeadersInit,
    body?: unknown,
  ): Promise<T> {
    const { controller, dispose } = createTimedAbortController(this.timeout);
    const url = `${this.baseUrl}${path}`;

    const config: RequestInit = {
      method,
      signal: controller.signal,
      headers: mergeHeaders(this.defaultHeaders, headers),
    };

    if (body !== undefined) {
      config.body = JSON.stringify(body);
    }

    try {
      const res = await this.fetchFn(url, config);

      if (!res.ok) {
        const responseBody = await readResponseBodySafely(res);
        throw new HttpClientError(`HTTP error ${res.status} for ${method} ${url}`, {
          status: res.status,
          method,
          url,
          code: 'HTTP_ERROR',
          responseBody,
        });
      }

      if (res.status === 204) {
        return undefined as T;
      }

      try {
        return (await res.json()) as T;
      } catch (parseError) {
        throw new HttpClientError(`Failed to parse JSON response for ${method} ${url}`, {
          method,
          url,
          code: 'PARSE_ERROR',
          cause: parseError,
        });
      }
    } catch (error) {
      if (error instanceof HttpClientError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new HttpClientError(`Request timed out after ${this.timeout}ms for ${method} ${url}`, {
          method,
          url,
          code: 'TIMEOUT_ERROR',
          cause: error,
        });
      }

      throw new HttpClientError(`Network request failed for ${method} ${url}`, {
        method,
        url,
        code: 'NETWORK_ERROR',
        cause: error,
      });
    } finally {
      dispose();
    }
  }

  private async request<T>(
    method: HttpMethod,
    path: string,
    headers?: HeadersInit,
    body?: unknown,
  ): Promise<T> {
    const allowRetry = isIdempotentMethod(method) && this.retry.maxRetries > 0;
    let attempt = 0;
    let nextDelayMs = this.retry.initialDelayMs;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        return await this.performOnce<T>(method, path, headers, body);
      } catch (error) {
        const canRetry =
          allowRetry &&
          attempt < this.retry.maxRetries &&
          isRetryableError(error, this.retry.retryableStatuses);
        if (!canRetry) {
          throw error;
        }
        await delay(nextDelayMs);
        nextDelayMs *= this.retry.backoffFactor;
        attempt += 1;
      }
    }
  }

  get<T>(path: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(httpMethods.get, path, headers);
  }

  post<T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> {
    const merged = mergeHeaders({ 'content-type': 'application/json' }, headers);
    return this.request<T>(httpMethods.post, path, merged, body);
  }

  put<T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> {
    const merged = mergeHeaders({ 'content-type': 'application/json' }, headers);
    return this.request<T>(httpMethods.put, path, merged, body);
  }

  patch<T>(path: string, body: unknown, headers?: HeadersInit): Promise<T> {
    const merged = mergeHeaders({ 'content-type': 'application/json' }, headers);
    return this.request<T>(httpMethods.patch, path, merged, body);
  }

  delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(httpMethods.delete, path, headers);
  }
}

function createHttpClient(config: HttpClientConfigType): HttpClient {
  return new HttpClient(config);
}

export { createHttpClient, HttpClient };
export { HttpClientError, httpMethods } from './types';
export type {
  FetchFunctionType,
  HttpClientConfigType,
  HttpClientErrorCodeType,
  HttpClientErrorType,
  HttpMethod,
  HttpRetryPolicyType,
} from './types';
