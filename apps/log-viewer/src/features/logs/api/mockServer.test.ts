import { describe, expect, it } from 'vitest';
import { createMockFetch } from '@frontend-showcase/mock-network';
import { createLogMockRoutes } from './mockServer';
import type { FetchLogsResult } from '../model/types';

async function fetchLogs(path: string, routes = createLogMockRoutes()): Promise<FetchLogsResult> {
  const fetch = createMockFetch(routes);
  const response = await fetch(`http://mock.local${path}`);
  expect(response.status).toBe(200);
  return (await response.json()) as FetchLogsResult;
}

describe('log mock server', () => {
  it('caps invalid or oversized limits to the server maximum', async () => {
    const body = await fetchLogs('/api/logs?limit=9999');

    expect(body.items).toHaveLength(500);
    expect(body.items[0]?.sequence).toBe(1);
    expect(body.nextCursor).toBe('cursor-dw');
  });

  it('returns an opaque cursor for the last item in the page', async () => {
    const routes = createLogMockRoutes();
    const first = await fetchLogs('/api/logs?limit=3', routes);
    const second = await fetchLogs(`/api/logs?limit=3&cursor=${first.nextCursor}`, routes);

    expect(first.items.map((item) => item.sequence)).toEqual([1, 2, 3]);
    expect(first.nextCursor).toBe('cursor-3');
    expect(second.items.map((item) => item.sequence)).toEqual([4, 5, 6]);
    expect(second.nextCursor).toBe('cursor-6');
  });

  it('applies level filters and reports a query-scoped high watermark', async () => {
    const body = await fetchLogs('/api/logs?limit=5&level=ERROR');

    expect(body.items).toHaveLength(5);
    expect(body.items.every((item) => item.level === 'ERROR')).toBe(true);
    expect(body.items.map((item) => item.sequence)).toEqual([19, 38, 57, 76, 95]);
    expect(body.serverHighWatermark % 19).toBe(0);
  });

  it('isolates in-memory state per route factory', async () => {
    const firstRoutes = createLogMockRoutes();
    const first = await fetchLogs('/api/logs?limit=1', firstRoutes);
    await fetchLogs('/api/logs?limit=1', firstRoutes);

    const second = await fetchLogs('/api/logs?limit=1');

    expect(first.items[0]?.sequence).toBe(1);
    expect(second.items[0]?.sequence).toBe(1);
    expect(second.serverHighWatermark).toBeLessThan(first.serverHighWatermark + 10);
  });
});
