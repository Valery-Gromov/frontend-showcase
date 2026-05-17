import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebouncedValue } from '@frontend-showcase/hooks';
import { Badge, Button, Select } from '@frontend-showcase/ui';
import { ThemeToggle } from '../../app/ThemeToggle';
import {
  analyticsQueryKeys,
  fetchDashboard,
  fetchFilterOptions,
  fetchRevenueTarget,
  updateRevenueTarget,
} from './api/analyticsApi';
import { Breakdown } from './components/Breakdown';
import { KpiCard } from './components/KpiCard';
import { RevenueChart } from './components/RevenueChart';
import { TargetPanel } from './components/TargetPanel';
import { formatDateTime } from './formatters';
import type { AnalyticsFilters, RevenueTarget } from './model/types';
import styles from './AnalyticsDashboard.module.css';

const DEFAULT_FILTERS: AnalyticsFilters = {
  range: '30d',
  brand: 'all',
  category: 'all',
};

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
  const optionsError = optionsQuery.error instanceof Error ? optionsQuery.error.message : undefined;

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
      {optionsError ? (
        <div className={styles.statusRow} aria-live="polite">
          <span className={styles.error}>{optionsError}</span>
        </div>
      ) : null}

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
        <KpiCard
          label="Stockouts"
          metric={dashboard?.kpis.stockouts}
          kind="number"
          loading={dashboardQuery.isLoading}
          direction="lower-is-better"
        />
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
