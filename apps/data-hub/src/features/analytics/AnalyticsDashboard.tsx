import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDebouncedValue } from '@frontend-showcase/hooks';
import { Badge, Button, Select, Skeleton } from '@frontend-showcase/ui';
import { ThemeToggle } from '../../app/ThemeToggle';
import {
  analyticsQueryKeys,
  fetchDashboard,
  fetchFilterOptions,
  fetchRevenueTarget,
  updateRevenueTarget,
} from './api/analyticsApi';
import type {
  AnalyticsDashboardResponse,
  AnalyticsFilters,
  KpiValue,
  RevenueTarget,
} from './model/types';
import styles from './AnalyticsDashboard.module.css';

const DEFAULT_FILTERS: AnalyticsFilters = {
  range: '30d',
  brand: 'all',
  category: 'all',
};

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatValue(kind: 'money' | 'number' | 'percent', value: number): string {
  if (kind === 'money') return currency.format(value);
  if (kind === 'percent') return `${value.toFixed(2)}%`;
  return compactNumber.format(value);
}

function formatDateTime(value?: string): string {
  if (!value) return 'No snapshot yet';
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function KpiCard({
  label,
  metric,
  kind,
  loading,
}: {
  label: string;
  metric?: KpiValue;
  kind: 'money' | 'number' | 'percent';
  loading: boolean;
}) {
  const variant = metric && metric.delta < 0 ? 'warning' : 'success';
  return (
    <article className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{label}</span>
      {loading || !metric ? (
        <Skeleton variant="text" height={32} />
      ) : (
        <>
          <strong className={styles.kpiValue}>{formatValue(kind, metric.value)}</strong>
          <Badge variant={variant}>{metric.delta > 0 ? '+' : ''}{metric.delta}% vs previous</Badge>
        </>
      )}
    </article>
  );
}

function RevenueChart({ data }: { data?: AnalyticsDashboardResponse }) {
  if (!data) {
    return <Skeleton variant="rectangle" height="100%" />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data.series} margin={{ top: 10, right: 22, bottom: 0, left: 4 }}>
        <CartesianGrid stroke="var(--color-outline-variant)" vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={{ stroke: 'var(--color-outline)' }}
          tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
          minTickGap={28}
        />
        <YAxis
          tickFormatter={(value) => compactNumber.format(Number(value))}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-outline)' }}
          tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }}
          width={54}
        />
        <Tooltip formatter={(value) => currency.format(Number(value))} />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--color-primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function Breakdown({ data }: { data?: AnalyticsDashboardResponse }) {
  if (!data) {
    return (
      <div className={styles.breakdownList}>
        <Skeleton variant="text" height={22} />
        <Skeleton variant="text" height={22} />
        <Skeleton variant="text" height={22} />
      </div>
    );
  }

  return (
    <div className={styles.breakdownList}>
      {data.breakdown.map((item) => (
        <div className={styles.breakdownItem} key={item.label}>
          <div className={styles.breakdownTopline}>
            <span>{item.label}</span>
            <span>{currency.format(item.revenue)} · {item.share}%</span>
          </div>
          <div className={styles.meter} aria-hidden>
            <div className={styles.meterFill} style={{ width: `${item.share}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TargetPanel({
  target,
  currentRevenue,
  saving,
  error,
  onChange,
}: {
  target?: RevenueTarget;
  currentRevenue?: number;
  saving: boolean;
  error?: string;
  onChange: (value: number) => void;
}) {
  const value = target?.value ?? 1_250_000;
  const progress = currentRevenue ? Math.min(100, Math.round((currentRevenue / value) * 100)) : 0;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h2 className={styles.panelTitle}>Revenue target</h2>
          <p className={styles.panelSubtitle}>Optimistic mutation with rollback on server conflict</p>
        </div>
      </div>
      <div className={styles.targetBody}>
        <div className={styles.targetValue}>{currency.format(value)}</div>
        <div className={styles.meter} aria-label={`Current revenue reached ${progress}% of target`}>
          <div className={styles.meterFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.muted}>Updated {formatDateTime(target?.updatedAt)}</span>
        {error ? <span className={styles.error}>{error}</span> : null}
        <div className={styles.targetActions}>
          <Button variant="secondary" loading={saving} onClick={() => onChange(value - 50_000)}>
            -50k
          </Button>
          <Button variant="secondary" loading={saving} onClick={() => onChange(value + 50_000)}>
            +50k
          </Button>
        </div>
      </div>
    </section>
  );
}

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);
  const debouncedFilters = useDebouncedValue(filters, 250);
  const queryClient = useQueryClient();

  const optionsQuery = useQuery({
    queryKey: analyticsQueryKeys.options,
    queryFn: fetchFilterOptions,
  });

  const dashboardQuery = useQuery({
    queryKey: analyticsQueryKeys.dashboard(debouncedFilters),
    queryFn: () => fetchDashboard(debouncedFilters),
    placeholderData: (previous) => previous,
    refetchInterval: 30_000,
  });

  const targetQuery = useQuery({
    queryKey: analyticsQueryKeys.revenueTarget,
    queryFn: fetchRevenueTarget,
  });

  const targetMutation = useMutation({
    mutationFn: updateRevenueTarget,
    onMutate: async (value) => {
      await queryClient.cancelQueries({ queryKey: analyticsQueryKeys.revenueTarget });
      const previous = queryClient.getQueryData<RevenueTarget>(analyticsQueryKeys.revenueTarget);
      queryClient.setQueryData<RevenueTarget>(analyticsQueryKeys.revenueTarget, {
        value,
        updatedAt: new Date().toISOString(),
      });
      return { previous };
    },
    onError: (_error, _value, context) => {
      if (context?.previous) {
        queryClient.setQueryData(analyticsQueryKeys.revenueTarget, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: analyticsQueryKeys.revenueTarget });
    },
  });

  const options = optionsQuery.data;
  const dashboard = dashboardQuery.data;
  const currentRevenue = dashboard?.kpis.revenue.value;
  const statusText = dashboardQuery.isFetching
    ? 'Refreshing analytics snapshot'
    : `Snapshot ${formatDateTime(dashboard?.snapshotAt)}`;
  const targetError = targetMutation.error instanceof Error ? targetMutation.error.message : undefined;
  const loadError = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : undefined;

  const chartSubtitle = useMemo(() => {
    const brand = filters.brand === 'all' ? 'all brands' : filters.brand;
    const category = filters.category === 'all' ? 'all categories' : filters.category;
    return `${brand} · ${category} · ${filters.range}`;
  }, [filters]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Data Hub</p>
          <h1 className={styles.title}>Analytics dashboard</h1>
          <p className={styles.subtitle}>
            Server-state cache, stale-while-revalidate, background refresh, Recharts, and an
            optimistic target update running over the same SDK/mock-network transport as the catalog.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className={styles.toolbar} aria-label="Dashboard filters">
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Range</span>
          <Select
            value={filters.range}
            options={options?.ranges ?? []}
            loading={optionsQuery.isLoading}
            onValueChange={(range) =>
              setFilters((current) => ({ ...current, range: range as AnalyticsFilters['range'] }))
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Brand</span>
          <Select
            value={filters.brand}
            options={options?.brands ?? []}
            loading={optionsQuery.isLoading}
            onValueChange={(brand) => setFilters((current) => ({ ...current, brand }))}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Category</span>
          <Select
            value={filters.category}
            options={options?.categories ?? []}
            loading={optionsQuery.isLoading}
            onValueChange={(category) => setFilters((current) => ({ ...current, category }))}
          />
        </label>
        <Button variant="secondary" loading={dashboardQuery.isFetching} onClick={() => dashboardQuery.refetch()}>
          Refresh
        </Button>
      </section>

      <div className={styles.statusRow} aria-live="polite">
        <Badge variant={dashboard?.stale ? 'warning' : 'info'}>
          {dashboard?.stale ? 'Stale snapshot' : 'Server-state cache'}
        </Badge>
        <span className={styles.muted}>{statusText}</span>
        {loadError ? <span className={styles.error}>{loadError}</span> : null}
      </div>

      <section className={styles.kpiGrid} aria-label="Key performance indicators">
        <KpiCard label="Revenue" metric={dashboard?.kpis.revenue} kind="money" loading={dashboardQuery.isLoading} />
        <KpiCard label="Orders" metric={dashboard?.kpis.orders} kind="number" loading={dashboardQuery.isLoading} />
        <KpiCard
          label="Conversion"
          metric={dashboard?.kpis.conversionRate}
          kind="percent"
          loading={dashboardQuery.isLoading}
        />
        <KpiCard label="Stockouts" metric={dashboard?.kpis.stockouts} kind="number" loading={dashboardQuery.isLoading} />
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Revenue trend</h2>
              <p className={styles.panelSubtitle}>{chartSubtitle}</p>
            </div>
          </div>
          <div className={styles.chartShell}>
            <RevenueChart data={dashboard} />
          </div>
        </section>

        <div className={styles.sideStack}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2 className={styles.panelTitle}>Breakdown</h2>
                <p className={styles.panelSubtitle}>
                  {filters.brand === 'all' ? 'Revenue by brand' : 'Revenue by category'}
                </p>
              </div>
            </div>
            <Breakdown data={dashboard} />
          </section>

          <TargetPanel
            target={targetQuery.data}
            currentRevenue={currentRevenue}
            saving={targetMutation.isPending}
            error={targetError}
            onChange={(value) => targetMutation.mutate(value)}
          />
        </div>
      </div>
    </main>
  );
}
