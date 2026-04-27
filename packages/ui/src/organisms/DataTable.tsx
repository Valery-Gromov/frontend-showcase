import { Checkbox } from '../atoms/Checkbox';
import { EmptyResultMessage } from '../molecules/EmptyResultMessage';
import { RowCheckboxCell } from '../molecules/RowCheckboxCell';
import { TableHeaderCell } from '../molecules/TableHeaderCell';

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

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            {selectable ? (
              <th style={{ width: 40, textAlign: 'center', padding: 8 }}>
                <Checkbox
                  checked={headerSelection.checked}
                  indeterminate={headerSelection.indeterminate}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onSelectionChange({ mode: 'some', ids: Array.from(new Set(pageRowIds)) });
                    } else {
                      if (selection.mode === 'allMatching') {
                        onSelectionChange({ ...selection, excludedIds: Array.from(new Set([...selection.excludedIds, ...pageRowIds])) });
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
              return (
                <th
                  key={column.key}
                  style={{
                    textAlign: column.align ?? 'left',
                    padding: 8,
                    borderBottom: '1px solid #e5e7eb',
                    width: column.width,
                  }}
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
            {renderRowActions ? <th style={{ width: 80, padding: 8 }}>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {loadState === 'loading' ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0)}
                style={{ padding: 16 }}
              >
                Loading...
              </td>
            </tr>
          ) : null}

          {loadState === 'error' ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0)}
                style={{ padding: 16 }}
              >
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
              <td
                colSpan={columns.length + (selectable ? 1 : 0) + (renderRowActions ? 1 : 0)}
                style={{ padding: 16 }}
              >
                <EmptyResultMessage title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : null}

          {(loadState === 'success' || loadState === 'refreshing' || loadState === 'idle') &&
            rows.map((row) => {
              const meta = getRowMeta(row);
              const selected = isRowSelected(meta.id, selection);
              return (
                <tr key={meta.id} style={{ opacity: meta.disabled ? 0.6 : 1 }}>
                  {selectable ? (
                    <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>
                      <RowCheckboxCell
                        checked={selected}
                        disabled={Boolean(meta.disabled)}
                        disabledReason={meta.disabledReason}
                        onChange={(checked) => {
                          if (selection.mode === 'allMatching') {
                            const excludedSet = new Set(selection.excludedIds);
                            if (checked) excludedSet.delete(meta.id);
                            else excludedSet.add(meta.id);
                            onSelectionChange({ ...selection, excludedIds: Array.from(excludedSet) });
                            return;
                          }
                          const selectedIds = new Set(selection.mode === 'some' ? selection.ids : []);
                          if (checked) selectedIds.add(meta.id);
                          else selectedIds.delete(meta.id);
                          onSelectionChange(selectedIds.size ? { mode: 'some', ids: Array.from(selectedIds) } : { mode: 'none' });
                        }}
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      style={{
                        padding: 8,
                        borderBottom: '1px solid #f3f4f6',
                        textAlign: column.align ?? 'left',
                        verticalAlign: 'top',
                      }}
                    >
                      {column.renderCell(row)}
                    </td>
                  ))}
                  {renderRowActions ? (
                    <td style={{ padding: 8, borderBottom: '1px solid #f3f4f6' }}>{renderRowActions(row)}</td>
                  ) : null}
                </tr>
              );
            })}
        </tbody>
      </table>
      {loadState === 'refreshing' ? (
        <div style={{ padding: 8, fontSize: 12, color: '#6b7280' }}>Refreshing data...</div>
      ) : null}
    </div>
  );
}
