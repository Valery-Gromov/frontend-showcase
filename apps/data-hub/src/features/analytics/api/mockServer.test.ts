import { describe, expect, it } from 'vitest';
import { createMockFetch } from '@frontend-showcase/mock-network';
import { createAnalyticsMockRoutes } from './mockServer';
import type { AnalyticsDashboardResponse } from '../model/types';

describe('analytics mock server', () => {
  it('falls back to valid default filters for unknown query params', async () => {
    const fetch = createMockFetch(createAnalyticsMockRoutes());

    const response = await fetch(
      'http://mock.local/api/analytics/dashboard?range=bad&brand=Unknown&category=Nope',
    );
    const body = (await response.json()) as AnalyticsDashboardResponse;

    expect(response.status).toBe(200);
    expect(body.filters).toEqual({ range: '30d', brand: 'all', category: 'all' });
    expect(body.series).toHaveLength(30);
  });

  it('marks every fifth dashboard response as stale', async () => {
    const fetch = createMockFetch(createAnalyticsMockRoutes());
    const snapshots: AnalyticsDashboardResponse[] = [];

    for (let index = 0; index < 5; index += 1) {
      const response = await fetch('http://mock.local/api/analytics/dashboard?range=7d');
      snapshots.push((await response.json()) as AnalyticsDashboardResponse);
    }
    const staleSnapshot = snapshots.at(4);

    expect(snapshots.slice(0, 4).every((snapshot) => snapshot.stale === false)).toBe(true);
    expect(staleSnapshot?.stale).toBe(true);
    expect(staleSnapshot?.series).toHaveLength(7);
  });

  it('rejects revenue targets below the server minimum', async () => {
    const fetch = createMockFetch(createAnalyticsMockRoutes());

    const response = await fetch('http://mock.local/api/analytics/revenue-target', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 50_000 }),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      message: 'Revenue target must be at least 100,000.',
    });
  });
});
