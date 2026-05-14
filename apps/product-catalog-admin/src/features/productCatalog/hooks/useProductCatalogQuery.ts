import { useEffect, useRef, useState } from 'react';
import type { FilterBarQuery, SelectionState, SortState } from '@frontend-showcase/ui';
import { readCatalogPreferences, writeCatalogPreferences } from '../model/preferences';
import {
  areProductQueriesEqual,
  getDefaultFilterDraft,
  queryFromFilterDraft,
  readProductQueryFromUrl,
  toFilterDraft,
  writeProductQueryToUrl,
} from '../model/queryState';
import { isSelectionActive } from '../model/selection';
import type { PendingQueryChange, ProductQuery } from '../model/types';

type UseProductCatalogQueryOptions = {
  selection: SelectionState;
  onSelectionInvalidated: () => void;
};

export function shouldConfirmSelectionInvalidation(
  selection: SelectionState,
  source: NonNullable<PendingQueryChange>['source'],
): boolean {
  if (!isSelectionActive(selection)) return false;
  return !(selection.mode === 'allMatching' && source === 'pagination');
}

export function useProductCatalogQuery({ selection, onSelectionInvalidated }: UseProductCatalogQueryOptions) {
  const [appliedQuery, setAppliedQuery] = useState<ProductQuery>(() => readProductQueryFromUrl(window.location.search));
  const [filterDraft, setFilterDraft] = useState<FilterBarQuery>(() => toFilterDraft(appliedQuery));
  const [filtersOpen, setFiltersOpen] = useState(() => readCatalogPreferences().filtersOpen);
  const [pendingQueryChange, setPendingQueryChange] = useState<PendingQueryChange>(null);
  const appliedQueryRef = useRef(appliedQuery);
  const selectionRef = useRef(selection);

  useEffect(() => {
    appliedQueryRef.current = appliedQuery;
  }, [appliedQuery]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    writeCatalogPreferences({ filtersOpen });
  }, [filtersOpen]);

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

    if (shouldConfirmSelectionInvalidation(selectionRef.current, source)) {
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

  const handleConfirmCancel = () => {
    if (pendingQueryChange?.source === 'popstate') {
      writeProductQueryToUrl(appliedQueryRef.current, 'replace');
    }
    setPendingQueryChange(null);
  };

  const handleConfirmContinue = () => {
    if (!pendingQueryChange) return;
    const change = pendingQueryChange;
    onSelectionInvalidated();
    setPendingQueryChange(null);
    commitQueryChange(change.nextQuery, change.source);
  };

  const handleApplyFilters = (nextDraft: FilterBarQuery) => {
    requestQueryChange(queryFromFilterDraft(nextDraft, appliedQueryRef.current), 'apply');
    setFiltersOpen(false);
  };

  const handleResetFilters = () => {
    const nextDraft = getDefaultFilterDraft();
    requestQueryChange(queryFromFilterDraft(nextDraft, appliedQueryRef.current), 'reset');
    setFiltersOpen(false);
  };

  const handleSortChange = (nextSort: SortState) => {
    requestQueryChange({ ...appliedQueryRef.current, sort: nextSort, page: 1 }, 'sort');
  };

  const handlePageChange = (page: number) => {
    requestQueryChange({ ...appliedQueryRef.current, page }, 'pagination');
  };

  return {
    appliedQuery,
    appliedQueryRef,
    filterDraft,
    filtersOpen,
    pendingQueryChange,
    setFilterDraft,
    setFiltersOpen,
    handleApplyFilters,
    handleConfirmCancel,
    handleConfirmContinue,
    handlePageChange,
    handleResetFilters,
    handleSortChange,
  };
}
