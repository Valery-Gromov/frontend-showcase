import { Tooltip } from '../atoms/Tooltip';

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
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{label}</span>
      {sortable ? (
        <span aria-hidden style={{ fontSize: 12 }}>
          {getSortIcon(sortDirection)}
        </span>
      ) : null}
    </span>
  );

  const control = sortable ? (
    <button
      type="button"
      onClick={onSort}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {content}
    </button>
  ) : (
    <span style={{ fontWeight: 600 }}>{content}</span>
  );

  if (!tooltip) {
    return control;
  }

  return <Tooltip content={tooltip}>{control}</Tooltip>;
}
