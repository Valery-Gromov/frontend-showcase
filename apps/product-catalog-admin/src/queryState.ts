import type { QueryState } from './types';
import type { SortState } from '@frontend-showcase/ui';

const DEFAULT_PAGE_SIZE = 10;

function parseListParam(params: URLSearchParams, key: string): string[] {
  const raw = params.get(key);
  if (!raw) return [];
  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

function parseSort(raw: string | null): SortState {
  if (!raw) return null;
  const [field, direction] = raw.split(':');
  if (!field || (direction !== 'asc' && direction !== 'desc')) return null;
  return { field, direction };
}

export function readQueryFromUrl(search: string): QueryState {
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

export function writeQueryToUrl(query: QueryState): void {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.brand.length) params.set('brand', query.brand.join(','));
  if (query.category.length) params.set('category', query.category.join(','));
  if (query.sae.length) params.set('sae', query.sae.join(','));
  if (query.status) params.set('status', query.status);
  if (query.page !== 1) params.set('page', String(query.page));
  if (query.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(query.pageSize));
  if (query.sort) params.set('sort', `${query.sort.field}:${query.sort.direction}`);

  const url = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
  window.history.replaceState(null, '', url);
}
