import { createHttpClient, HttpClientError } from '@frontend-showcase/sdk';
import { createMockFetch } from '@frontend-showcase/mock-network';
import type {
  BulkActionPayload,
  BulkActionResult,
  ExcelImportResult,
  FetchProductsResult,
  Product,
  ProductMutationInput,
  ProductQuery,
  Selection,
} from '../model/types';
import {
  createCatalogMockRoutes,
  getCatalogVersion,
  getFilterOptions,
  simulateExternalCatalogChange,
} from './mockServer';

const httpClient = createHttpClient({
  baseUrl: '/api',
  timeout: 5000,
  fetch: createMockFetch(createCatalogMockRoutes(), {
    latency: { min: 500, max: 1200 },
  }),
  retry: {
    maxRetries: 1,
    initialDelayMs: 200,
    retryableStatuses: [502, 503, 504],
  },
});

function productQueryToSearch(query: ProductQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.brand.length) params.set('brand', query.brand.join(','));
  if (query.category.length) params.set('category', query.category.join(','));
  if (query.sae.length) params.set('sae', query.sae.join(','));
  if (query.status) params.set('status', query.status);
  params.set('page', String(query.page));
  params.set('pageSize', String(query.pageSize));
  if (query.sort) params.set('sort', `${query.sort.field}:${query.sort.direction}`);
  const tail = params.toString();
  return tail ? `?${tail}` : '';
}

/**
 * Translates a transport-level HttpClientError into a domain Error with a human message.
 * The catalog UI reads `error.message` directly, so we surface the server's `message` field
 * (attached to `error.responseBody`) when present, and fall back to the SDK wrapper text or
 * a generic message otherwise.
 */
function unwrapDomainError(error: unknown, fallbackMessage: string): never {
  if (error instanceof HttpClientError) {
    const body = error.responseBody;
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.length > 0) {
        throw new Error(message);
      }
    }
    if (error.code === 'TIMEOUT_ERROR') throw new Error('Request timed out. Try again.');
    if (error.code === 'NETWORK_ERROR') throw new Error('Network unavailable. Check connection.');
    throw new Error(fallbackMessage);
  }
  throw error instanceof Error ? error : new Error(fallbackMessage);
}

export async function fetchProducts(query: ProductQuery): Promise<FetchProductsResult> {
  try {
    return await httpClient.get<FetchProductsResult>(`/products${productQueryToSearch(query)}`);
  } catch (error) {
    unwrapDomainError(error, 'Failed to fetch products.');
  }
}

export async function createProduct(input: ProductMutationInput): Promise<Product> {
  try {
    return await httpClient.post<Product>('/products', input);
  } catch (error) {
    unwrapDomainError(error, 'Product could not be created.');
  }
}

export async function updateProduct(id: string, input: ProductMutationInput): Promise<Product> {
  try {
    return await httpClient.put<Product>(`/products/${encodeURIComponent(id)}`, input);
  } catch (error) {
    unwrapDomainError(error, 'Product could not be saved.');
  }
}

export async function executeBulkAction(
  selection: Selection,
  payload: BulkActionPayload,
): Promise<BulkActionResult> {
  try {
    return await httpClient.post<BulkActionResult>('/products/bulk', { selection, payload });
  } catch (error) {
    unwrapDomainError(error, 'Bulk action failed.');
  }
}

export async function uploadProductExcel(file: File): Promise<ExcelImportResult> {
  try {
    return await httpClient.post<ExcelImportResult>('/products/import', { fileName: file.name });
  } catch (error) {
    unwrapDomainError(error, 'Excel upload failed.');
  }
}

export { getCatalogVersion, getFilterOptions, simulateExternalCatalogChange };
