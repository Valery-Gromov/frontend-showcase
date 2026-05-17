import { Badge, Skeleton } from '@frontend-showcase/ui';
import type { KpiValue } from '../model/types';
import { formatMetricValue } from '../formatters';
import styles from '../AnalyticsDashboard.module.css';

type MetricDirection = 'higher-is-better' | 'lower-is-better';

export function KpiCard({
  label,
  metric,
  kind,
  loading,
  direction = 'higher-is-better',
}: {
  label: string;
  metric?: KpiValue;
  kind: 'money' | 'number' | 'percent';
  loading: boolean;
  direction?: MetricDirection;
}) {
  const isFavorable =
    metric && (direction === 'higher-is-better' ? metric.delta >= 0 : metric.delta <= 0);
  const variant = isFavorable ? 'success' : 'warning';

  return (
    <article className={styles.kpiCard}>
      <span className={styles.kpiLabel}>{label}</span>
      {loading || !metric ? (
        <Skeleton variant="text" height={32} />
      ) : (
        <>
          <strong className={styles.kpiValue}>{formatMetricValue(kind, metric.value)}</strong>
          <Badge variant={variant}>{metric.delta > 0 ? '+' : ''}{metric.delta}% vs previous</Badge>
        </>
      )}
    </article>
  );
}
