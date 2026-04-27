import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BulkActionBar,
  Button,
  DataTable,
  FilterBar,
  type BulkActionItem,
  type FilterBarQuery,
  type SelectionState,
  type SortState,
} from '@frontend-showcase/ui';
import {
  createProduct,
  executeBulkAction,
  fetchProducts,
  getFilterOptions,
  simulateExternalCatalogChange,
  updateProduct,
  uploadProductExcel,
} from '../api/mockProductCatalogApi';
import { BulkFailureDetails } from '../components/BulkFailureDetails';
import { DiscardChangesConfirmDialog } from '../components/DiscardChangesConfirmDialog';
import { ExcelImportPanel } from '../components/ExcelImportPanel';
import { OutdatedDataNotice } from '../components/OutdatedDataNotice';
import { ProductCatalogHeader } from '../components/ProductCatalogHeader';
import { ProductEditorDrawer } from '../components/ProductEditorDrawer';
import { ProductCatalogPagination } from '../components/ProductCatalogPagination';
import { QueryChangeConfirmDialog } from '../components/QueryChangeConfirmDialog';
import { getBulkResultState } from '../model/bulkResults';
import {
  DEFAULT_PRODUCT_FORM_VALUE,
  hasProductFormErrors,
  isProductFormDirty,
  normalizeProductFormValue,
  productToFormValue,
  validateProductForm,
} from '../model/productForm';
import { getExcelFileError } from '../model/productMutations';
import {
  areProductQueriesEqual,
  getDefaultFilterDraft,
  queryFromFilterDraft,
  readProductQueryFromUrl,
  toFilterDraft,
  writeProductQueryToUrl,
} from '../model/queryState';
import { getSelectedCount, isSelectionActive } from '../model/selection';
import { getProductTableColumns } from '../model/tableColumns';
import type {
  BulkActionPayload,
  BulkActionState,
  BulkFailure,
  ExcelImportState,
  PendingQueryChange,
  Product,
  ProductDrawerState,
  ProductFormErrors,
  ProductFormValue,
  ProductMutationState,
  ProductQuery,
  TableLoadState,
} from '../model/types';

type DataTableLoadState = 'idle' | 'loading' | 'refreshing' | 'error' | 'success';

type ToastState = {
  message: string;
  showDetailsAction?: boolean;
} | null;

const BULK_ACTIONS: BulkActionItem[] = [
  { id: 'status-active', label: 'Set Active', variant: 'secondary' },
  { id: 'change-category', label: 'Set Category: Coolant', variant: 'secondary' },
  { id: 'delete', label: 'Delete', variant: 'danger' },
];

function toDataTableLoadState(loadState: TableLoadState): DataTableLoadState {
  if (loadState.status === 'initialLoading' || loadState.status === 'queryLoading') return 'loading';
  if (loadState.status === 'refreshLoading') return 'refreshing';
  if (loadState.status === 'error') return 'error';
  if (loadState.status === 'success' || loadState.status === 'empty') return 'success';
  return 'idle';
}

function getErrorMessage(loadState: TableLoadState): string | undefined {
  return loadState.status === 'error' ? loadState.message : undefined;
}

function isTableBusy(loadState: TableLoadState): boolean {
  return (
    loadState.status === 'initialLoading' ||
    loadState.status === 'queryLoading' ||
    loadState.status === 'refreshLoading'
  );
}

function getBulkPayload(actionId: string): BulkActionPayload {
  if (actionId === 'status-active') return { type: 'changeStatus', status: 'active' };
  if (actionId === 'change-category') return { type: 'changeCategory', category: 'Coolant' };
  return { type: 'delete' };
}

export function ProductCatalogContainer() {
  const [appliedQuery, setAppliedQuery] = useState<ProductQuery>(() => readProductQueryFromUrl(window.location.search));
  const [filterDraft, setFilterDraft] = useState<FilterBarQuery>(() => toFilterDraft(appliedQuery));
  const [pendingQueryChange, setPendingQueryChange] = useState<PendingQueryChange>(null);
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [tableLoadState, setTableLoadState] = useState<TableLoadState>({ status: 'idle' });
  const [selection, setSelection] = useState<SelectionState>({ mode: 'none' });
  const [bulkActionState, setBulkActionState] = useState<BulkActionState>({ status: 'idle' });
  const [bulkFailureDetails, setBulkFailureDetails] = useState<BulkFailure[]>([]);
  const [failureDetailsOpen, setFailureDetailsOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState('');
  const [outdatedNoticeVisible, setOutdatedNoticeVisible] = useState(false);
  const [productDrawerState, setProductDrawerState] = useState<ProductDrawerState>({ mode: 'closed' });
  const [productFormDraft, setProductFormDraft] = useState<ProductFormValue>(DEFAULT_PRODUCT_FORM_VALUE);
  const [productFormErrors, setProductFormErrors] = useState<ProductFormErrors>({});
  const [productMutationState, setProductMutationState] = useState<ProductMutationState>({ status: 'idle' });
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false);
  const [excelImportState, setExcelImportState] = useState<ExcelImportState>({ status: 'closed' });

  const requestSeqRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const appliedQueryRef = useRef(appliedQuery);
  const selectionRef = useRef(selection);

  const options = useMemo(() => getFilterOptions(), []);
  const columns = useMemo(() => getProductTableColumns(), []);
  const pageRowIds = useMemo(() => rows.filter((row) => !row.disabled).map((row) => row.id), [rows]);
  const productFormInitialValue =
    productDrawerState.mode === 'closed' ? DEFAULT_PRODUCT_FORM_VALUE : productDrawerState.initialValue;
  const productFormDirty =
    productDrawerState.mode !== 'closed' && isProductFormDirty(productFormDraft, productFormInitialValue);
  const tableSelection = useMemo<SelectionState>(() => {
    if (selection.mode !== 'allMatching') return selection;

    const disabledPageIds = rows.filter((row) => row.disabled).map((row) => row.id);
    return {
      ...selection,
      excludedIds: Array.from(new Set([...selection.excludedIds, ...disabledPageIds])),
    };
  }, [rows, selection]);

  useEffect(() => {
    appliedQueryRef.current = appliedQuery;
  }, [appliedQuery]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    const fetchAppliedQuery = async () => {
      requestSeqRef.current += 1;
      const seq = requestSeqRef.current;
      setRows([]);
      setTotal(null);
      setTableLoadState({ status: hasLoadedRef.current ? 'queryLoading' : 'initialLoading' });

      try {
        const result = await fetchProducts(appliedQuery);
        if (seq !== requestSeqRef.current) return;

        setRows(result.items);
        setTotal(result.total);
        setLastUpdatedAt(new Date().toLocaleTimeString());
        setOutdatedNoticeVisible(false);
        setTableLoadState({ status: result.items.length > 0 ? 'success' : 'empty' });
        hasLoadedRef.current = true;
      } catch (error) {
        if (seq !== requestSeqRef.current) return;

        setRows([]);
        setTotal(null);
        setTableLoadState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' });
        hasLoadedRef.current = true;
      }
    };

    void fetchAppliedQuery();
  }, [appliedQuery]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      simulateExternalCatalogChange();
      setOutdatedNoticeVisible(true);
    }, 12000);

    return () => window.clearInterval(interval);
  }, []);

  const commitQueryChange = (nextQuery: ProductQuery, source: NonNullable<PendingQueryChange>['source']) => {
    if (areProductQueriesEqual(appliedQueryRef.current, nextQuery)) {
      if (source === 'apply' || source === 'reset' || source === 'popstate') {
        setFilterDraft(toFilterDraft(nextQuery));
      }
      return;
    }

    if (source !== 'popstate') {
      writeProductQueryToUrl(nextQuery, 'push');
    }

    if (source === 'apply' || source === 'reset' || source === 'popstate') {
      setFilterDraft(toFilterDraft(nextQuery));
    }

    setAppliedQuery(nextQuery);
  };

  const requestQueryChange = (nextQuery: ProductQuery, source: NonNullable<PendingQueryChange>['source']) => {
    if (areProductQueriesEqual(appliedQueryRef.current, nextQuery)) {
      if (source === 'reset' || source === 'apply') {
        setFilterDraft(toFilterDraft(nextQuery));
      }
      return;
    }

    if (isSelectionActive(selectionRef.current)) {
      setPendingQueryChange({ nextQuery, source });
      return;
    }

    commitQueryChange(nextQuery, source);
  };

  useEffect(() => {
    const onPopState = () => {
      const nextQuery = readProductQueryFromUrl(window.location.search);
      requestQueryChange(nextQuery, 'popstate');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshCurrentTable = async () => {
    requestSeqRef.current += 1;
    const seq = requestSeqRef.current;
    setTableLoadState({ status: 'refreshLoading' });

    try {
      const result = await fetchProducts(appliedQueryRef.current);
      if (seq !== requestSeqRef.current) return;

      setRows(result.items);
      setTotal(result.total);
      setLastUpdatedAt(new Date().toLocaleTimeString());
      setOutdatedNoticeVisible(false);
      setTableLoadState({ status: result.items.length > 0 ? 'success' : 'empty' });
      hasLoadedRef.current = true;
    } catch (error) {
      if (seq !== requestSeqRef.current) return;

      setToast({ message: error instanceof Error ? error.message : 'Refresh failed.' });
      setTableLoadState({ status: rows.length > 0 ? 'success' : 'empty' });
    }
  };

  const handleConfirmCancel = () => {
    if (pendingQueryChange?.source === 'popstate') {
      writeProductQueryToUrl(appliedQueryRef.current, 'replace');
    }
    setPendingQueryChange(null);
  };

  const handleConfirmContinue = () => {
    if (!pendingQueryChange) return;
    const change = pendingQueryChange;
    setSelection({ mode: 'none' });
    setPendingQueryChange(null);
    commitQueryChange(change.nextQuery, change.source);
  };

  const handleApplyFilters = (nextDraft: FilterBarQuery) => {
    requestQueryChange(queryFromFilterDraft(nextDraft, appliedQueryRef.current), 'apply');
  };

  const handleResetFilters = () => {
    const nextDraft = getDefaultFilterDraft();
    requestQueryChange(queryFromFilterDraft(nextDraft, appliedQueryRef.current), 'reset');
  };

  const handleSortChange = (nextSort: SortState) => {
    requestQueryChange({ ...appliedQueryRef.current, sort: nextSort, page: 1 }, 'sort');
  };

  const handlePageChange = (page: number) => {
    requestQueryChange({ ...appliedQueryRef.current, page }, 'pagination');
  };

  const closeProductDrawer = () => {
    setProductDrawerState({ mode: 'closed' });
    setProductFormDraft(DEFAULT_PRODUCT_FORM_VALUE);
    setProductFormErrors({});
    setProductMutationState({ status: 'idle' });
    setDiscardConfirmOpen(false);
  };

  const requestCloseProductDrawer = () => {
    if (productFormDirty) {
      setDiscardConfirmOpen(true);
      return;
    }

    closeProductDrawer();
  };

  const openEditProductDrawer = (product: Product) => {
    const initialValue = productToFormValue(product);
    setProductDrawerState({ mode: 'edit', product, initialValue });
    setProductFormDraft(initialValue);
    setProductFormErrors({});
    setProductMutationState({ status: 'idle' });
    setDiscardConfirmOpen(false);
  };

  const openCreateProductDrawer = () => {
    setProductDrawerState({ mode: 'create', initialValue: DEFAULT_PRODUCT_FORM_VALUE });
    setProductFormDraft(DEFAULT_PRODUCT_FORM_VALUE);
    setProductFormErrors({});
    setProductMutationState({ status: 'idle' });
    setDiscardConfirmOpen(false);
  };

  const submitProductForm = async () => {
    if (productDrawerState.mode === 'closed') return;

    const normalized = normalizeProductFormValue(productFormDraft);
    const validationErrors = validateProductForm(normalized);
    setProductFormErrors(validationErrors);

    if (hasProductFormErrors(validationErrors)) {
      return;
    }

    setProductMutationState({ status: 'saving' });

    try {
      if (productDrawerState.mode === 'edit') {
        await updateProduct(productDrawerState.product.id, normalized);
        setToast({ message: 'Product was updated.' });
      } else {
        await createProduct(normalized);
        setToast({ message: 'Product was created.' });
      }

      closeProductDrawer();
      await refreshCurrentTable();
    } catch (error) {
      setProductMutationState({
        status: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Product could not be saved.',
        },
      });
    }
  };

  const openExcelImportPanel = () => {
    setExcelImportState({ status: 'idle', file: null });
  };

  const closeExcelImportPanel = () => {
    setExcelImportState({ status: 'closed' });
  };

  const setExcelImportFile = (file: File | null) => {
    setExcelImportState({ status: 'idle', file });
  };

  const uploadExcelFile = async () => {
    const file =
      excelImportState.status === 'idle' || excelImportState.status === 'error' ? excelImportState.file : null;
    const fileError = getExcelFileError(file);

    if (fileError || !file) {
      setExcelImportState({ status: 'error', file, message: fileError ?? 'Choose an Excel file first.' });
      return;
    }

    setExcelImportState({ status: 'uploading', file });

    try {
      const result = await uploadProductExcel(file);
      setExcelImportState({ status: 'success', message: result.message });
      setToast({ message: result.message });
      await refreshCurrentTable();
    } catch (error) {
      setExcelImportState({
        status: 'error',
        file,
        message: error instanceof Error ? error.message : 'Excel upload failed.',
      });
    }
  };

  const runBulkAction = async (actionId: string) => {
    if (!isSelectionActive(selection)) return;

    setBulkActionState({ status: 'submitting', actionId });
    setToast(null);

    try {
      const result = await executeBulkAction(selection, getBulkPayload(actionId));
      const nextState = getBulkResultState(result);

      setBulkActionState(nextState);
      setBulkFailureDetails(nextState.status === 'partialSuccess' ? nextState.failed : []);
      setFailureDetailsOpen(false);
      setToast({
        message: nextState.message,
        showDetailsAction: nextState.status === 'partialSuccess' && nextState.failed.length > 0,
      });

      if (nextState.status === 'success') {
        setSelection({ mode: 'none' });
      }

      void refreshCurrentTable();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bulk action failed.';
      setBulkActionState({ status: 'failure', message });
      setToast({ message });
    }
  };

  const selectedCount = getSelectedCount(selection, total);
  const dataTableLoadState = toDataTableLoadState(tableLoadState);
  const tableBusy = isTableBusy(tableLoadState);

  return (
    <div className="page">
      <div className="container">
        <ProductCatalogHeader
          loadState={tableLoadState}
          lastUpdatedAt={lastUpdatedAt}
          onAddProduct={openCreateProductDrawer}
          onOpenImport={openExcelImportPanel}
        />

        <OutdatedDataNotice
          visible={outdatedNoticeVisible}
          refreshing={tableLoadState.status === 'refreshLoading'}
          onRefresh={() => void refreshCurrentTable()}
        />

        <ExcelImportPanel
          state={excelImportState}
          onFileChange={setExcelImportFile}
          onUpload={() => void uploadExcelFile()}
          onCancel={closeExcelImportPanel}
        />

        <FilterBar
          mode="manual"
          value={filterDraft}
          options={options}
          loading={tableBusy}
          pendingApply={tableLoadState.status === 'queryLoading' || tableLoadState.status === 'initialLoading'}
          onChange={setFilterDraft}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />

        <div className="selection-controls">
          <Button
            variant="ghost"
            onClick={() =>
              setSelection({
                mode: 'allMatching',
                excludedIds: [],
                querySnapshot: appliedQuery,
              })
            }
            disabled={rows.length === 0}
          >
            Select all matching filters
          </Button>
          <span className="hint">When enabled, current and future pages are selected except manually excluded rows.</span>
        </div>

        <BulkActionBar
          selection={tableSelection}
          selectedCount={selectedCount}
          totalKnown={total}
          loadingActionId={bulkActionState.status === 'submitting' ? bulkActionState.actionId : null}
          onClearSelection={() => setSelection({ mode: 'none' })}
          onAction={(actionId) => void runBulkAction(actionId)}
          actions={BULK_ACTIONS}
        />

        {toast ? (
          <div className="toast" role="status">
            <span>{toast.message}</span>
            {toast.showDetailsAction ? (
              <Button variant="ghost" onClick={() => setFailureDetailsOpen(true)}>
                View details
              </Button>
            ) : null}
          </div>
        ) : null}

        <BulkFailureDetails
          failures={bulkFailureDetails}
          open={failureDetailsOpen}
          onClose={() => setFailureDetailsOpen(false)}
        />

        <DataTable<Product>
          rows={rows}
          columns={columns}
          pageRowIds={pageRowIds}
          selectable
          getRowMeta={(row) => ({ id: row.id, disabled: row.disabled, disabledReason: row.disabledReason })}
          sort={appliedQuery.sort}
          onSortChange={handleSortChange}
          selection={tableSelection}
          onSelectionChange={setSelection}
          loadState={dataTableLoadState}
          errorDescription={getErrorMessage(tableLoadState)}
          onRetry={() => void refreshCurrentTable()}
          emptyDescription="Try changing filters or clearing search."
          renderRowActions={(row) => (
            <Button variant="ghost" onClick={() => openEditProductDrawer(row)}>
              Edit
            </Button>
          )}
        />

        <ProductCatalogPagination
          page={appliedQuery.page}
          canGoPrevious={appliedQuery.page > 1}
          canGoNext={rows.length >= appliedQuery.pageSize}
          onPrevious={() => handlePageChange(Math.max(1, appliedQuery.page - 1))}
          onNext={() => handlePageChange(appliedQuery.page + 1)}
        />

        <QueryChangeConfirmDialog
          open={pendingQueryChange !== null}
          onCancel={handleConfirmCancel}
          onContinue={handleConfirmContinue}
        />

        <ProductEditorDrawer
          open={productDrawerState.mode !== 'closed'}
          mode={productDrawerState.mode === 'edit' ? 'edit' : 'create'}
          value={productFormDraft}
          errors={
            productMutationState.status === 'error'
              ? { ...productFormErrors, ...productMutationState.error.fieldErrors }
              : productFormErrors
          }
          options={options}
          dirty={productFormDirty}
          mutationState={productMutationState}
          onChange={(next) => {
            setProductFormDraft(next);
            setProductFormErrors({});
            if (productMutationState.status === 'error') {
              setProductMutationState({ status: 'idle' });
            }
          }}
          onSubmit={() => void submitProductForm()}
          onCancel={requestCloseProductDrawer}
        />

        <DiscardChangesConfirmDialog
          open={discardConfirmOpen}
          onCancel={() => setDiscardConfirmOpen(false)}
          onDiscard={closeProductDrawer}
        />
      </div>
    </div>
  );
}
