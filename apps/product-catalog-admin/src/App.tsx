import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  BulkActionBar,
  Button,
  DataTable,
  FilterBar,
  type DataTableColumn,
  type FilterBarQuery,
  type SelectionState,
  type SortState,
  StatusBadge,
} from '@frontend-showcase/ui';
import { executeBulkAction, fetchProducts, getFilterOptions } from './mockApi';
import { readQueryFromUrl, writeQueryToUrl } from './queryState';
import type { BulkActionPayload, Product, QueryState } from './types';

type LoadState = 'idle' | 'loading' | 'refreshing' | 'error' | 'success';

function toFilterValue(query: QueryState): FilterBarQuery {
  return {
    search: query.search,
    brand: query.brand,
    category: query.category,
    sae: query.sae,
    status: query.status,
  };
}

function fromFilterValue(filter: FilterBarQuery, previous: QueryState): QueryState {
  return {
    ...previous,
    search: filter.search,
    brand: filter.brand,
    category: filter.category,
    sae: filter.sae,
    status: filter.status,
    page: 1,
  };
}

function isSelectionEmpty(selection: SelectionState): boolean {
  return selection.mode === 'none' || (selection.mode === 'some' && selection.ids.length === 0);
}

function getSelectionCount(selection: SelectionState): number {
  if (selection.mode === 'none') return 0;
  if (selection.mode === 'some') return selection.ids.length;
  return Math.max(0, 99999 - selection.excludedIds.length);
}

export function App() {
  const [query, setQuery] = useState<QueryState>(() => readQueryFromUrl(window.location.search));
  const [rows, setRows] = useState<Product[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [selection, setSelection] = useState<SelectionState>({ mode: 'none' });
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string>('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>('');
  const [manualFilterDraft, setManualFilterDraft] = useState<FilterBarQuery>(() => toFilterValue(query));
  const requestSeqRef = useRef(0);

  const options = useMemo(() => getFilterOptions(), []);

  const columns = useMemo<DataTableColumn<Product>[]>(
    () => [
      { key: 'name', label: 'Name', sortable: true, renderCell: (row) => row.name },
      { key: 'brand', label: 'Brand', sortable: true, renderCell: (row) => row.brand },
      { key: 'category', label: 'Category', sortable: true, renderCell: (row) => row.category },
      { key: 'sae', label: 'SAE', sortable: true, renderCell: (row) => row.sae },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        renderCell: (row) => <StatusBadge status={row.status} tooltip={`Updated at ${new Date(row.updatedAt).toLocaleString()}`} />,
      },
    ],
    [],
  );

  useEffect(() => {
    writeQueryToUrl(query);
    setManualFilterDraft(toFilterValue(query));
  }, [query]);

  useEffect(() => {
    const onPopState = () => {
      const next = readQueryFromUrl(window.location.search);
      setQuery(next);
      setSelection({ mode: 'none' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;
      setErrorMessage(undefined);
      setLoadState((prev) => (prev === 'idle' || prev === 'error' ? 'loading' : 'refreshing'));

      try {
        const res = await fetchProducts(query);
        if (seq !== requestSeqRef.current) {
          return;
        }
        setRows(res.items);
        setLastUpdatedAt(new Date().toLocaleTimeString());
        setLoadState('success');
      } catch (error) {
        if (seq !== requestSeqRef.current) return;
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
        setLoadState('error');
      }
    };
    void fetchData();
  }, [query]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuery((prev) => ({ ...prev }));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const pageRowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selectedCount = getSelectionCount(selection);
  const filterValue = toFilterValue(query);

  const runBulkAction = async (payload: BulkActionPayload, actionId: string) => {
    if (isSelectionEmpty(selection)) return;
    setBulkBusy(actionId);
    const result = await executeBulkAction(selection, payload);
    setBulkBusy(null);

    if (result.failed.length === 0) {
      setToast(`Bulk action completed. ${result.success.length} succeeded.`);
      setSelection({ mode: 'none' });
    } else {
      setToast(
        `Partial success: ${result.success.length} succeeded, ${result.failed.length} failed (${result.failed
          .slice(0, 2)
          .map((f) => f.reason)
          .join(', ')})`,
      );
      // Keep selection so user can retry or inspect.
    }
    setQuery((prev) => ({ ...prev }));
  };

  const bulkActions = [
    { id: 'status-active', label: 'Set Active', variant: 'secondary' as const },
    { id: 'change-category', label: 'Set Category: Coolant', variant: 'secondary' as const },
    { id: 'delete', label: 'Delete', variant: 'danger' as const },
  ];

  const tableSort = query.sort;

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <h1>Product Catalog Admin</h1>
          <div className="header-meta">
            <Badge variant="info">URL-driven query</Badge>
            <Badge variant={loadState === 'refreshing' ? 'warning' : 'neutral'}>
              {loadState === 'refreshing' ? 'Refreshing...' : `Updated: ${lastUpdatedAt || '-'}`}
            </Badge>
          </div>
        </header>

        <FilterBar
          mode="manual"
          value={manualFilterDraft}
          options={options}
          loading={loadState === 'loading' || loadState === 'refreshing'}
          pendingApply={loadState === 'loading' || loadState === 'refreshing'}
          onChange={setManualFilterDraft}
          onApply={(next) => setQuery((prev) => fromFilterValue(next, prev))}
          onReset={() => {
            const reset: FilterBarQuery = { search: '', brand: [], category: [], sae: [], status: null };
            setManualFilterDraft(reset);
            setQuery((prev) => fromFilterValue(reset, prev));
            setSelection({ mode: 'none' });
          }}
        />

        <div className="selection-controls">
          <Button
            variant="ghost"
            onClick={() =>
              setSelection({
                mode: 'allMatching',
                excludedIds: [],
                querySnapshot: query,
              })
            }
            disabled={rows.length === 0}
          >
            Select all matching filters
          </Button>
          <span className="hint">When enabled, current and future pages are selected except manually excluded rows.</span>
        </div>

        <BulkActionBar
          selection={selection}
          selectedCount={selectedCount}
          totalKnown={null}
          loadingActionId={bulkBusy}
          onClearSelection={() => setSelection({ mode: 'none' })}
          onAction={(actionId) => {
            if (actionId === 'status-active') {
              void runBulkAction({ type: 'changeStatus', status: 'active' }, actionId);
              return;
            }
            if (actionId === 'change-category') {
              void runBulkAction({ type: 'changeCategory', category: 'Coolant' }, actionId);
              return;
            }
            void runBulkAction({ type: 'delete' }, actionId);
          }}
          actions={bulkActions}
        />

        {toast ? <div className="toast">{toast}</div> : null}

        <DataTable<Product>
          rows={rows}
          columns={columns}
          pageRowIds={pageRowIds}
          selectable
          getRowMeta={(row) => ({ id: row.id, disabled: row.disabled, disabledReason: row.disabledReason })}
          sort={tableSort}
          onSortChange={(next: SortState) => setQuery((prev) => ({ ...prev, sort: next, page: 1 }))}
          selection={selection}
          onSelectionChange={setSelection}
          loadState={loadState}
          errorDescription={errorMessage}
          onRetry={() => setQuery((prev) => ({ ...prev }))}
          emptyDescription="Try changing filters or clearing search."
          renderRowActions={(row) => (
            <Button
              variant="ghost"
              onClick={() => setToast(`Open edit drawer for product ${row.id}`)}
            >
              Edit
            </Button>
          )}
        />

        <div className="pagination">
          <Button
            variant="secondary"
            onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            disabled={query.page <= 1}
          >
            Previous
          </Button>
          <span>Page {query.page}</span>
          <Button
            variant="secondary"
            onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
            disabled={rows.length < query.pageSize}
          >
            Next
          </Button>
        </div>

        <div className="debug">
          <strong>Debug:</strong> query in URL is source of truth; stale responses are ignored; selection survives refresh.
        </div>
      </div>
    </div>
  );
}
