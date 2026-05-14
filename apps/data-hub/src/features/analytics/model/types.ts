export type DateRangePreset = '7d' | '30d' | '90d';

export interface AnalyticsFilters {
  range: DateRangePreset;
  brand: string;
  category: string;
}

export interface AnalyticsFilterOptions {
  ranges: Array<{ label: string; value: DateRangePreset }>;
  brands: Array<{ label: string; value: string }>;
  categories: Array<{ label: string; value: string }>;
}

export interface KpiValue {
  value: number;
  delta: number;
}

export interface DashboardKpis {
  revenue: KpiValue;
  orders: KpiValue;
  conversionRate: KpiValue;
  stockouts: KpiValue;
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  orders: number;
  conversionRate: number;
}

export interface BreakdownItem {
  label: string;
  revenue: number;
  share: number;
}

export interface AnalyticsDashboardResponse {
  filters: AnalyticsFilters;
  kpis: DashboardKpis;
  series: TimeSeriesPoint[];
  breakdown: BreakdownItem[];
  snapshotAt: string;
  stale: boolean;
}

export interface RevenueTarget {
  value: number;
  updatedAt: string;
}
