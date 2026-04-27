import type { FilterBarQuery, SortState } from '@frontend-showcase/ui';
import type { ProductQuery } from './types';

export const DEFAULT_PAGE_SIZE = 10;

const DEFAULT_FILTER_DRAFT: FilterBarQuery = {
  search: '',
  brand: [],
  category: [],
  sae: [],
  status: null,
};

export function getDefaultFilterDraft(): FilterBarQuery {
  return {
    search: DEFAULT_FILTER_DRAFT.search,
    brand: [],
    category: [],
    sae: [],
    status: DEFAULT_FILTER_DRAFT.status,
  };
}

export function getDefaultProductQuery(): ProductQuery {
  return {
    ...getDefaultFilterDraft(),
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: null,
  };
}

function parseListParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseSort(raw: string | null): SortState {
  if (!raw) return null;
  const [field, direction] = raw.split(':');
  if (!field || (direction !== 'asc' && direction !== 'desc')) return null;
  return { field, direction };
}

export function readProductQueryFromUrl(search: string): ProductQuery {
  const params = new URLSearchParams(search);
  const page = Number(params.get('page') ?? '1');
  const pageSize = Number(params.get('pageSize') ?? String(DEFAULT_PAGE_SIZE));

  return {
    search: params.get('search') ?? '',
    brand: parseListParam(params, 'brand'),
    category: parseListParam(params, 'category'),
    sae: parseListParam(params, 'sae'),
    status: params.get('status'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE,
    sort: parseSort(params.get('sort')),
  };
}

export function productQueryToSearchParams(query: ProductQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.brand.length) params.set('brand', query.brand.join(','));
  if (query.category.length) params.set('category', query.category.join(','));
  if (query.sae.length) params.set('sae', query.sae.join(','));
  if (query.status) params.set('status', query.status);
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(query.pageSize));
  if (query.sort) params.set('sort', `${query.sort.field}:${query.sort.direction}`);
  return params;
}

export function getProductQueryUrl(query: ProductQuery): string {
  const params = productQueryToSearchParams(query);
  return `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
}

export function writeProductQueryToUrl(query: ProductQuery, mode: 'push' | 'replace' = 'push'): void {
  const url = getProductQueryUrl(query);
  if (mode === 'replace') {
    window.history.replaceState(null, '', url);
    return;
  }
  window.history.pushState(null, '', url);
}

export function toFilterDraft(query: ProductQuery): FilterBarQuery {
  return {
    search: query.search,
    brand: query.brand,
    category: query.category,
    sae: query.sae,
    status: query.status,
  };
}

export function queryFromFilterDraft(filter: FilterBarQuery, previous: ProductQuery): ProductQuery {
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

export function areProductQueriesEqual(a: ProductQuery, b: ProductQuery): boolean {
  return productQueryToSearchParams(a).toString() === productQueryToSearchParams(b).toString();
}
