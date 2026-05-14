import { createMockFetch } from '@frontend-showcase/mock-network';
import { createHttpClient, HttpClientError } from '@frontend-showcase/sdk';
import type { FetchLogsParams, FetchLogsResult } from '../model/types';
import { createLogMockRoutes } from './mockServer';

const httpClient = createHttpClient({
  baseUrl: '/api',
  timeout: 5000,
  fetch: createMockFetch(createLogMockRoutes(), {
    latency: { min: 180, max: 520 },
    flakyChance: 0.03,
  }),
  retry: {
    maxRetries: 1,
    initialDelayMs: 180,
    retryableStatuses: [502, 503, 504],
  },
});

function toSearch(params: FetchLogsParams): string {
  const query = new URLSearchParams();
  query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.level !== 'all') query.set('level', params.level);
  return `?${query.toString()}`;
}

function unwrapApiError(error: unknown, fallback: string): never {
  if (error instanceof HttpClientError) {
    if (error.code === 'TIMEOUT_ERROR') throw new Error('Log request timed out.');
    if (error.code === 'NETWORK_ERROR') throw new Error('Log service is unavailable.');
    throw new Error(fallback);
  }
  throw error instanceof Error ? error : new Error(fallback);
}

export async function fetchLogs(params: FetchLogsParams): Promise<FetchLogsResult> {
  try {
    return await httpClient.get<FetchLogsResult>(`/logs${toSearch(params)}`);
  } catch (error) {
    unwrapApiError(error, 'Logs could not be loaded.');
  }
}
