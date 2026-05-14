import type { MockRoute } from '@frontend-showcase/mock-network';
import type {
  AnalyticsDashboardResponse,
  AnalyticsFilters,
  AnalyticsFilterOptions,
  BreakdownItem,
  DateRangePreset,
  RevenueTarget,
  TimeSeriesPoint,
} from '../model/types';

const BRANDS = ['Shell', 'Castrol', 'Mobil', 'Total', 'Liqui Moly'] as const;
const CATEGORIES = ['Engine Oil', 'Transmission Oil', 'Coolant', 'Brake Fluid'] as const;
const RANGE_DAYS: Record<DateRangePreset, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

let requestCount = 0;
let revenueTarget: RevenueTarget = {
  value: 1_250_000,
  updatedAt: new Date().toISOString(),
};

function option(value: string) {
  return { value, label: value === 'all' ? 'All' : value };
}

export const analyticsFilterOptions: AnalyticsFilterOptions = {
  ranges: [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ],
  brands: ['all', ...BRANDS].map(option),
  categories: ['all', ...CATEGORIES].map(option),
};

function parseFilters(query: URLSearchParams): AnalyticsFilters {
  const rangeRaw = query.get('range');
  const range: DateRangePreset = rangeRaw === '7d' || rangeRaw === '90d' ? rangeRaw : '30d';
  const brandRaw = query.get('brand') ?? 'all';
  const categoryRaw = query.get('category') ?? 'all';

  return {
    range,
    brand: BRANDS.includes(brandRaw as (typeof BRANDS)[number]) ? brandRaw : 'all',
    category: CATEGORIES.includes(categoryRaw as (typeof CATEGORIES)[number]) ? categoryRaw : 'all',
  };
}

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function segmentFactor(value: string, items: readonly string[]): number {
  if (value === 'all') return 1;
  const index = items.indexOf(value);
  return index === -1 ? 1 : 0.72 + index * 0.09;
}

function buildSeries(filters: AnalyticsFilters, stale: boolean): TimeSeriesPoint[] {
  const days = RANGE_DAYS[filters.range];
  const now = new Date();
  if (stale) now.setDate(now.getDate() - 1);

  const brandFactor = segmentFactor(filters.brand, BRANDS);
  const categoryFactor = segmentFactor(filters.category, CATEGORIES);
  const horizonFactor = filters.range === '90d' ? 0.82 : filters.range === '7d' ? 1.08 : 1;

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - index - 1));
    const seasonal = 1 + Math.sin(index / 4) * 0.08;
    const noise = seededNoise(index + days * 13) * 0.18;
    const base = 34_000 * brandFactor * categoryFactor * horizonFactor;
    const revenue = Math.round(base * seasonal * (0.91 + noise));
    const orders = Math.round((revenue / 92) * (0.92 + seededNoise(index + 99) * 0.18));
    const conversionRate = Number((2.8 + seededNoise(index + 42) * 1.7).toFixed(2));

    return {
      date: date.toISOString().slice(0, 10),
      revenue,
      orders,
      conversionRate,
    };
  });
}

function sum(items: TimeSeriesPoint[], key: keyof Pick<TimeSeriesPoint, 'revenue' | 'orders'>): number {
  return items.reduce((total, item) => total + item[key], 0);
}

function deltaFor(total: number, seed: number): number {
  const direction = seededNoise(seed) > 0.38 ? 1 : -1;
  return Number((direction * (2 + seededNoise(seed + 17) * 14)).toFixed(1));
}

function buildBreakdown(filters: AnalyticsFilters, totalRevenue: number): BreakdownItem[] {
  const labels = filters.brand === 'all' ? BRANDS : CATEGORIES;
  const values = labels.map((label, index) => ({
    label,
    revenue: Math.round(totalRevenue * (0.13 + seededNoise(index + label.length) * 0.16)),
    share: 0,
  }));
  const subtotal = values.reduce((acc, item) => acc + item.revenue, 0);
  return values
    .map((item) => ({
      ...item,
      share: subtotal === 0 ? 0 : Number(((item.revenue / subtotal) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

function buildDashboard(filters: AnalyticsFilters): AnalyticsDashboardResponse {
  requestCount += 1;
  const stale = requestCount % 5 === 0;
  const series = buildSeries(filters, stale);
  const revenue = sum(series, 'revenue');
  const orders = sum(series, 'orders');
  const conversionRate = Number(
    (series.reduce((total, item) => total + item.conversionRate, 0) / series.length).toFixed(2),
  );
  const stockouts = Math.max(3, Math.round(orders * 0.012 * segmentFactor(filters.category, CATEGORIES)));

  return {
    filters,
    kpis: {
      revenue: { value: revenue, delta: deltaFor(revenue, 1) },
      orders: { value: orders, delta: deltaFor(orders, 2) },
      conversionRate: { value: conversionRate, delta: deltaFor(conversionRate, 3) },
      stockouts: { value: stockouts, delta: -deltaFor(stockouts, 4) },
    },
    series,
    breakdown: buildBreakdown(filters, revenue),
    snapshotAt: new Date(Date.now() - (stale ? 80_000 : 0)).toISOString(),
    stale,
  };
}

export function createAnalyticsMockRoutes(): MockRoute[] {
  return [
    {
      method: 'GET',
      pattern: '/api/analytics/filter-options',
      handler: () => ({ status: 200, body: analyticsFilterOptions }),
    },
    {
      method: 'GET',
      pattern: '/api/analytics/dashboard',
      handler: ({ query }) => ({ status: 200, body: buildDashboard(parseFilters(query)) }),
    },
    {
      method: 'GET',
      pattern: '/api/analytics/revenue-target',
      handler: () => ({ status: 200, body: revenueTarget }),
    },
    {
      method: 'PATCH',
      pattern: '/api/analytics/revenue-target',
      handler: ({ body }) => {
        const value = Number((body as { value?: unknown } | undefined)?.value);
        if (!Number.isFinite(value) || value < 100_000) {
          return { status: 422, body: { message: 'Revenue target must be at least 100,000.' } };
        }
        if (Math.random() < 0.15) {
          return { status: 409, body: { message: 'Target changed on the server. Try again.' } };
        }
        revenueTarget = { value: Math.round(value), updatedAt: new Date().toISOString() };
        return { status: 200, body: revenueTarget };
      },
    },
  ];
}
