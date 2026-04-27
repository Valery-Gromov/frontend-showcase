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
    <button
      type="button"
      onClick={sortable ? onSort : undefined}
      disabled={!sortable}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: sortable ? 'pointer' : 'default',
        fontWeight: 600,
      }}
    >
      <span>{label}</span>
      {sortable ? <span aria-hidden>{getSortIcon(sortDirection)}</span> : null}
    </button>
  );

  if (!tooltip) return content;

  return <Tooltip content={tooltip}>{content}</Tooltip>;
}
