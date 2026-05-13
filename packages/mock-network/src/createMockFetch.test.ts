import { describe, expect, it } from 'vitest';

import { createMockFetch } from './createMockFetch';

describe('createMockFetch', () => {
  it('matches a route by method and exact path and returns a JSON body wrapped in a Response', async () => {
    const mockFetch = createMockFetch([
      {
        method: 'GET',
        pattern: '/products',
        handler: () => ({ status: 200, body: { items: [{ id: '1' }] } }),
      },
    ]);

    const res = await mockFetch('http://mock.local/products');

    expect(res.ok).toBe(true);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/json');
    await expect(res.json()).resolves.toEqual({ items: [{ id: '1' }] });
  });

  it('extracts path parameters from `:name` segments', async () => {
    const mockFetch = createMockFetch([
      {
        method: 'GET',
        pattern: '/products/:id/details',
        handler: ({ params }) => ({ status: 200, body: params }),
      },
    ]);

    const res = await mockFetch('http://mock.local/products/42/details');

    await expect(res.json()).resolves.toEqual({ id: '42' });
  });

  it('parses query string into URLSearchParams', async () => {
    const mockFetch = createMockFetch([
      {
        method: 'GET',
        pattern: '/products',
        handler: ({ query }) => ({
          status: 200,
          body: { search: query.get('search'), page: query.get('page') },
        }),
      },
    ]);

    const res = await mockFetch('http://mock.local/products?search=oil&page=2');

    await expect(res.json()).resolves.toEqual({ search: 'oil', page: '2' });
  });

  it('parses JSON body for POST/PUT/PATCH handlers', async () => {
    const mockFetch = createMockFetch([
      {
        method: 'POST',
        pattern: '/items',
        handler: ({ body }) => ({ status: 201, body }),
      },
    ]);

    const res = await mockFetch('http://mock.local/items', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'first' }),
    });

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ name: 'first' });
  });

  it('returns 404 by default for unmatched routes', async () => {
    const mockFetch = createMockFetch([]);

    const res = await mockFetch('http://mock.local/nope');

    expect(res.status).toBe(404);
  });

  it('returns 503 with the configured flake probability', async () => {
    const mockFetch = createMockFetch(
      [
        {
          method: 'GET',
          pattern: '/x',
          handler: () => ({ status: 200, body: {} }),
        },
      ],
      { flakyChance: 1 },
    );

    const res = await mockFetch('http://mock.local/x');

    expect(res.status).toBe(503);
  });

  it('honors latency configuration and waits roughly the requested time before responding', async () => {
    const mockFetch = createMockFetch(
      [
        {
          method: 'GET',
          pattern: '/slow',
          handler: () => ({ status: 200, body: { ok: true } }),
        },
      ],
      { latency: { min: 40, max: 40 } },
    );

    const started = Date.now();
    const res = await mockFetch('http://mock.local/slow');
    const elapsed = Date.now() - started;

    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(35);
  });

  it('first matching route wins; later routes with the same method+pattern are not invoked', async () => {
    const mockFetch = createMockFetch([
      {
        method: 'GET',
        pattern: '/x',
        handler: () => ({ status: 200, body: { from: 'first' } }),
      },
      {
        method: 'GET',
        pattern: '/x',
        handler: () => ({ status: 200, body: { from: 'second' } }),
      },
    ]);

    const res = await mockFetch('http://mock.local/x');

    await expect(res.json()).resolves.toEqual({ from: 'first' });
  });
});
