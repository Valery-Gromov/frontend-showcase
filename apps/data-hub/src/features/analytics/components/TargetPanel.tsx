import { Button } from '@frontend-showcase/ui';
import type { RevenueTarget } from '../model/types';
import { currency, formatDateTime } from '../formatters';
import styles from '../AnalyticsDashboard.module.css';

const TARGET_STEP = 50_000;
const MIN_REVENUE_TARGET = 100_000;

export function TargetPanel({
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
  const canDecrease = value - TARGET_STEP >= MIN_REVENUE_TARGET;

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
          <Button
            variant="secondary"
            loading={saving}
            disabled={!canDecrease}
            onClick={() => onChange(value - TARGET_STEP)}
          >
            -50k
          </Button>
          <Button variant="secondary" loading={saving} onClick={() => onChange(value + TARGET_STEP)}>
            +50k
          </Button>
        </div>
      </div>
    </section>
  );
}
