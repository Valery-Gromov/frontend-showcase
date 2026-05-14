import type { CSSProperties } from 'react';
import { Checkbox } from '../atoms/Checkbox';
import { EmptyResultMessage } from '../molecules/EmptyResultMessage';
import { RowCheckboxCell } from '../molecules/RowCheckboxCell';
import { TableHeaderCell } from '../molecules/TableHeaderCell';
import styles from './DataTable.module.css';

export type SelectionState =
  | { mode: 'none' }
  | { mode: 'some'; ids: string[] }
  | { mode: 'allMatching'; excludedIds: string[]; querySnapshot: unknown };

export type SortDirection = 'asc' | 'desc';
export type SortState = { field: string; direction: SortDirection } | null;

export type DataTableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  sortField?: string;
  tooltip?: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  renderCell: (row: T) => React.ReactNode;
};

export type DataTableRowMeta = {
  id: string;
  disabled?: boolean;
  disabledReason?: string;
};

export type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowMeta: (row: T) => DataTableRowMeta;
  sort: SortState;
  onSortChange: (next: SortState) => void;
  selection: SelectionState;
  onSelectionChange: (next: SelectionState) => void;
  loadState: 'idle' | 'loading' | 'refreshing' | 'error' | 'success';
  selectable?: boolean;
  pageRowIds: string[];
  renderRowActions?: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
};

function isRowSelected(id: string, selection: SelectionState): boolean {
  if (selection.mode === 'none') return false;
  if (selection.mode === 'some') return selection.ids.includes(id);
  return !selection.excludedIds.includes(id);
}

function getHeaderCheckboxState(pageRowIds: string[], selection: SelectionState): {
  checked: boolean;
  indeterminate: boolean;
} {
  if (pageRowIds.length === 0) return { checked: false, indeterminate: false };
  const selectedCount = pageRowIds.filter((id) => isRowSelected(id, selection)).length;
  return {
    checked: selectedCount === pageRowIds.length,
    indeterminate: selectedCount > 0 && selectedCount < pageRowIds.length,
  };
}

export function DataTable<T>({
  rows,
  columns,
  getRowMeta,
  sort,
  onSortChange,
  selection,
  onSelectionChange,
  loadState,
  selectable = true,
  pageRowIds,
  renderRowActions,
  emptyTitle = 'No results found',
  emptyDescription,
  errorTitle = 'Failed to load data',
  errorDescription,
  onRetry,
}: DataTableProps<T>) {
  const headerSelection = getHeaderCheckboxState(pageRowIds, selection);
  const colSpan = columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0);

  return (
    <div className={styles.frame}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.headerRow}>
            {selectable ? (
              <th className={styles.selectionCell}>
                <Checkbox
                  checked={headerSelection.checked}
                  indeterminate={headerSelection.indeterminate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange({ mode: 'some', ids: Array.from(new Set(pageRowIds)) });
                    } else {
                      if (selection.mode === 'allMatching') {
                        onSelectionChange({ mode: 'none' });
                        return;
                      }
                      onSelectionChange({ mode: 'none' });
                    }
                  }}
                />
              </th>
            ) : null}
            {columns.map((column) => {
              const currentField = column.sortField ?? column.key;
              const isSorted = sort?.field === currentField;
              const sortDirection = isSorted ? sort?.direction ?? null : null;
              const widthStyle: CSSProperties | undefined =
                column.width !== undefined ? { width: column.width } : undefined;
              return (
                <th
                  key={column.key}
                  className={styles.headerCell}
                  data-align={column.align ?? 'left'}
                  style={widthStyle}
                >
                  <TableHeaderCell
                    label={column.label}
                    tooltip={column.tooltip}
                    sortable={column.sortable}
                    sortDirection={sortDirection}
                    onSort={() => {
                      if (!column.sortable) return;
                      if (!isSorted) {
                        onSortChange({ field: currentField, direction: 'asc' });
                        return;
                      }
                      if (sortDirection === 'asc') {
                        onSortChange({ field: currentField, direction: 'desc' });
                        return;
                      }
                      onSortChange(null);
                    }}
                  />
                </th>
              );
            })}
            {renderRowActions ? <th className={styles.actionsCell}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {loadState === 'loading' ? (
            <tr>
              <td colSpan={colSpan} className={styles.statusCell}>
                Loading...
              </td>
            </tr>
          ) : null}

          {loadState === 'error' ? (
            <tr>
              <td colSpan={colSpan} className={styles.statusCell}>
                <EmptyResultMessage
                  title={errorTitle}
                  description={errorDescription}
                  actionLabel={onRetry ? 'Retry' : undefined}
                  onAction={onRetry}
                />
              </td>
            </tr>
          ) : null}

          {(loadState === 'success' || loadState === 'refreshing' || loadState === 'idle') && rows.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className={styles.statusCell}>
                <EmptyResultMessage title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : null}

          {(loadState === 'success' || loadState === 'refreshing' || loadState === 'idle') &&
            rows.map((row) => {
              const meta = getRowMeta(row);
              const selected = isRowSelected(meta.id, selection);
              const allMatchingLocked = selection.mode === 'allMatching' && !meta.disabled;
              return (
                <tr key={meta.id} className={styles.bodyRow} data-disabled={meta.disabled}>
                  {selectable ? (
                    <td className={styles.cell}>
                      <RowCheckboxCell
                        checked={selected}
                        disabled={Boolean(meta.disabled) || allMatchingLocked}
                        disabledReason={
                          meta.disabledReason ??
                          (allMatchingLocked ? 'Clear selection to choose individual rows' : undefined)
                        }
                        onChange={(checked) => {
                          if (selection.mode === 'allMatching') {
                            return;
                          }
                          const selectedIds = new Set(selection.mode === 'some' ? selection.ids : []);
                          if (checked) selectedIds.add(meta.id);
                          else selectedIds.delete(meta.id);
                          onSelectionChange(
                            selectedIds.size
                              ? { mode: 'some', ids: Array.from(selectedIds) }
                              : { mode: 'none' },
                          );
                        }}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={styles.cell}
                      data-align={column.align ?? 'left'}
                    >
                      {column.renderCell(row)}
                    </td>
                  ))}
                  {renderRowActions ? (
                    <td className={styles.cell}>{renderRowActions(row)}</td>
                  ) : null}
                </tr>
              );
            })}
        </tbody>
      </table>
      {loadState === 'refreshing' ? (
        <div className={styles.refreshingHint}>Refreshing data...</div>
      ) : null}
    </div>
  );
}
