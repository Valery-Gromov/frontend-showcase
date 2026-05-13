import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHttpClient, HttpClientError } from './client';
import type { FetchFunctionType } from './types';

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

describe('createHttpClient', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('happy path', () => {
    it('returns parsed JSON body for a successful GET', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () => jsonResponse({ id: 1, name: 'item' }));
      const client = createHttpClient({ baseUrl: 'http://api.test', fetch: fetchFn });

      const result = await client.get<{ id: number; name: string }>('/items/1');

      expect(result).toEqual({ id: 1, name: 'item' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
      const [url, init] = fetchFn.mock.calls[0]!;
      expect(url).toBe('http://api.test/items/1');
      expect((init as RequestInit).method).toBe('GET');
    });

    it('serializes a JSON body and sets the content-type header on POST', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () => jsonResponse({ ok: true }, { status: 201 }));
      const client = createHttpClient({ baseUrl: 'http://api.test', fetch: fetchFn });

      await client.post('/items', { title: 'first' });

      const [, init] = fetchFn.mock.calls[0]!;
      const requestInit = init as RequestInit;
      expect(requestInit.method).toBe('POST');
      expect(requestInit.body).toBe(JSON.stringify({ title: 'first' }));
      const headers = new Headers(requestInit.headers);
      expect(headers.get('content-type')).toBe('application/json');
    });

    it('returns `undefined` for a 204 No Content response without trying to parse JSON', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () => new Response(null, { status: 204 }));
      const client = createHttpClient({ baseUrl: 'http://api.test', fetch: fetchFn });

      const result = await client.delete<undefined>('/items/1');

      expect(result).toBeUndefined();
    });

    it('merges default headers into every request', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () => jsonResponse({}));
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        defaultHeaders: { 'x-tenant': 'acme' },
      });

      await client.get('/items', { 'x-trace': 'abc' });

      const [, init] = fetchFn.mock.calls[0]!;
      const headers = new Headers((init as RequestInit).headers);
      expect(headers.get('x-tenant')).toBe('acme');
      expect(headers.get('x-trace')).toBe('abc');
    });
  });

  describe('error handling', () => {
    it('wraps non-OK responses in an HttpClientError carrying status, code, and parsed body', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () =>
        jsonResponse({ message: 'Product is locked' }, { status: 409 }),
      );
      const client = createHttpClient({ baseUrl: 'http://api.test', fetch: fetchFn });

      const error = await client.put<unknown>('/items/1', { name: 'x' }).catch((err) => err);

      expect(error).toBeInstanceOf(HttpClientError);
      const httpError = error as HttpClientError;
      expect(httpError.code).toBe('HTTP_ERROR');
      expect(httpError.status).toBe(409);
      expect(httpError.method).toBe('PUT');
      expect(httpError.responseBody).toEqual({ message: 'Product is locked' });
    });

    it('emits PARSE_ERROR when the response is not valid JSON', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(
        async () =>
          new Response('not json', {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
      );
      const client = createHttpClient({ baseUrl: 'http://api.test', fetch: fetchFn });

      const error = await client.get<unknown>('/items').catch((err) => err);

      expect(error).toBeInstanceOf(HttpClientError);
      expect((error as HttpClientError).code).toBe('PARSE_ERROR');
    });

    it('emits NETWORK_ERROR when the fetch implementation rejects with a non-abort reason', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () => {
        throw new TypeError('Failed to fetch');
      });
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        timeout: 50,
      });

      const error = await client.get<unknown>('/items').catch((err) => err);

      expect(error).toBeInstanceOf(HttpClientError);
      expect((error as HttpClientError).code).toBe('NETWORK_ERROR');
    });

    it('emits TIMEOUT_ERROR when the abort signal fires before the response arrives', async () => {
      const fetchFn = vi.fn<FetchFunctionType>((_, init) => {
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        });
      });
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        timeout: 10,
      });

      const error = await client.get<unknown>('/items').catch((err) => err);

      expect(error).toBeInstanceOf(HttpClientError);
      expect((error as HttpClientError).code).toBe('TIMEOUT_ERROR');
    });
  });

  describe('retry policy', () => {
    it('retries an idempotent GET on a retryable 503 and returns the eventual success body', async () => {
      const responses: Array<() => Response> = [
        () => jsonResponse({ message: 'busy' }, { status: 503 }),
        () => jsonResponse({ ok: true }, { status: 200 }),
      ];
      const fetchFn = vi.fn<FetchFunctionType>(async () => responses.shift()!());
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        retry: { maxRetries: 1, initialDelayMs: 1, backoffFactor: 1 },
      });

      const result = await client.get<{ ok: boolean }>('/items');

      expect(result).toEqual({ ok: true });
      expect(fetchFn).toHaveBeenCalledTimes(2);
    });

    it('does not retry a non-idempotent POST even when the response is retryable', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () =>
        jsonResponse({ message: 'busy' }, { status: 503 }),
      );
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        retry: { maxRetries: 3, initialDelayMs: 1, backoffFactor: 1 },
      });

      await client.post<unknown>('/items', {}).catch(() => undefined);

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('does not retry a non-retryable HTTP status (e.g. 400)', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () =>
        jsonResponse({ message: 'bad' }, { status: 400 }),
      );
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        retry: { maxRetries: 3, initialDelayMs: 1, backoffFactor: 1 },
      });

      await client.get<unknown>('/items').catch(() => undefined);

      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('gives up and rethrows after exhausting retries on persistent failures', async () => {
      const fetchFn = vi.fn<FetchFunctionType>(async () =>
        jsonResponse({ message: 'busy' }, { status: 503 }),
      );
      const client = createHttpClient({
        baseUrl: 'http://api.test',
        fetch: fetchFn,
        retry: { maxRetries: 2, initialDelayMs: 1, backoffFactor: 1 },
      });

      const error = await client.get<unknown>('/items').catch((err) => err);

      expect(fetchFn).toHaveBeenCalledTimes(3);
      expect(error).toBeInstanceOf(HttpClientError);
      expect((error as HttpClientError).status).toBe(503);
    });
  });
});
