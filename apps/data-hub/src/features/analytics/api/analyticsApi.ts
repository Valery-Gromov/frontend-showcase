import { createMockFetch } from '@frontend-showcase/mock-network';
import { createHttpClient, HttpClientError } from '@frontend-showcase/sdk';
import type {
  AnalyticsDashboardResponse,
  AnalyticsFilterOptions,
  AnalyticsFilters,
  RevenueTarget,
} from '../model/types';
import { createAnalyticsMockRoutes } from './mockServer';

const httpClient = createHttpClient({
  baseUrl: '/api',
  timeout: 5000,
  fetch: createMockFetch(createAnalyticsMockRoutes(), {
    latency: { min: 450, max: 1100 },
    flakyChance: 0.04,
  }),
  retry: {
    maxRetries: 1,
    initialDelayMs: 250,
    retryableStatuses: [502, 503, 504],
  },
});

export const analyticsQueryKeys = {
  options: ['analytics', 'filter-options'] as const,
  dashboard: (filters: AnalyticsFilters) => ['analytics', 'dashboard', filters] as const,
  revenueTarget: ['analytics', 'revenue-target'] as const,
};

function filtersToSearch(filters: AnalyticsFilters): string {
  const params = new URLSearchParams();
  params.set('range', filters.range);
  if (filters.brand !== 'all') params.set('brand', filters.brand);
  if (filters.category !== 'all') params.set('category', filters.category);
  return `?${params.toString()}`;
}

function unwrapApiError(error: unknown, fallback: string): never {
  if (error instanceof HttpClientError) {
    const body = error.responseBody;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string') throw new Error(message);
    }
    if (error.code === 'TIMEOUT_ERROR') throw new Error('Analytics request timed out.');
    if (error.code === 'NETWORK_ERROR') throw new Error('Analytics service is unavailable.');
    throw new Error(fallback);
  }
  throw error instanceof Error ? error : new Error(fallback);
}

export async function fetchFilterOptions(): Promise<AnalyticsFilterOptions> {
  try {
    return await httpClient.get<AnalyticsFilterOptions>('/analytics/filter-options');
  } catch (error) {
    unwrapApiError(error, 'Filter options could not be loaded.');
  }
}

export async function fetchDashboard(
  filters: AnalyticsFilters,
): Promise<AnalyticsDashboardResponse> {
  try {
    return await httpClient.get<AnalyticsDashboardResponse>(
      `/analytics/dashboard${filtersToSearch(filters)}`,
    );
  } catch (error) {
    unwrapApiError(error, 'Dashboard data could not be loaded.');
  }
}

export async function fetchRevenueTarget(): Promise<RevenueTarget> {
  try {
    return await httpClient.get<RevenueTarget>('/analytics/revenue-target');
  } catch (error) {
    unwrapApiError(error, 'Revenue target could not be loaded.');
  }
}

export async function updateRevenueTarget(value: number): Promise<RevenueTarget> {
  try {
    return await httpClient.patch<RevenueTarget>('/analytics/revenue-target', { value });
  } catch (error) {
    unwrapApiError(error, 'Revenue target could not be saved.');
  }
}
