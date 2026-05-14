import { Tooltip } from '../atoms/Tooltip';
import styles from './TableHeaderCell.module.css';

export type SortDirection = 'asc' | 'desc' | null;

export type TableHeaderCellProps = {
  label: string;
  sortable?: boolean;
  sortDirection?: SortDirection;
  tooltip?: string;
  onSort?: () => void;
};

function getSortIcon(sortDirection: SortDirection): string {
  if (sortDirection === 'asc') return '↑';
  if (sortDirection === 'desc') return '↓';
  return '↕';
}

export function TableHeaderCell({
  label,
  sortable = false,
  sortDirection = null,
  tooltip,
  onSort,
}: TableHeaderCellProps) {
  const content = (
    <button
      type="button"
      onClick={sortable ? onSort : undefined}
      disabled={!sortable}
      className={styles.button}
    >
      <span>{label}</span>
      {sortable ? (
        <span aria-hidden className={styles.sortIcon}>
          {getSortIcon(sortDirection)}
        </span>
      ) : null}
    </button>
  );

  if (!tooltip) return content;

  return <Tooltip content={tooltip}>{content}</Tooltip>;
}
