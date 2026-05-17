import { Skeleton } from '@frontend-showcase/ui';
import type { AnalyticsDashboardResponse } from '../model/types';
import { currency } from '../formatters';
import styles from '../AnalyticsDashboard.module.css';

export function Breakdown({ data }: { data?: AnalyticsDashboardResponse }) {
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
