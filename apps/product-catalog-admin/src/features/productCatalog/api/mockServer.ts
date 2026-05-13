import type { MockRoute } from '@frontend-showcase/mock-network';
import type {
  BulkActionPayload,
  BulkActionResult,
  ExcelImportResult,
  FetchProductsResult,
  Product,
  ProductMutationInput,
  ProductQuery,
  ProductStatus,
  Selection,
} from '../model/types';

const BRANDS = ['Shell', 'Castrol', 'Mobil', 'Total', 'Liqui Moly'] as const;
const CATEGORIES = ['Engine Oil', 'Transmission Oil', 'Coolant', 'Brake Fluid'] as const;
const SAE = ['0W-20', '5W-30', '5W-40', '10W-40'] as const;
const STATUSES = ['active', 'draft', 'archived'] as const satisfies readonly ProductStatus[];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(items: readonly T[]): T {
  const item = items[randomInt(0, items.length - 1)];
  if (item === undefined) {
    throw new Error('Cannot pick from an empty list');
  }
  return item;
}

function makeProduct(index: number): Product {
  const brand = BRANDS[index % BRANDS.length] ?? BRANDS[0];
  const category = CATEGORIES[index % CATEGORIES.length] ?? CATEGORIES[0];
  const sae = SAE[index % SAE.length] ?? SAE[0];
  const status = STATUSES[index % STATUSES.length] ?? STATUSES[0];
  const disabled = index % 17 === 0;

  return {
    id: String(index + 1),
    name: `${brand} ${sae} ${category} #${index + 1}`,
    brand,
    category,
    sae,
    status,
    updatedAt: new Date(Date.now() - index * 3600_000).toISOString(),
    disabled,
    disabledReason: disabled ? 'Locked by external process' : undefined,
  };
}

const productsDb: Product[] = Array.from({ length: 130 }, (_, index) => makeProduct(index));

let catalogVersion = 0;

function bumpCatalogVersion(): void {
  catalogVersion += 1;
}

/**
 * Monotonically increasing version of the catalog DB. Bumped on every mutation (user-initiated
 * or external). Used by `useExternalChangeDetector` to know whether the data drifted since
 * the last successful fetch.
 */
export function getCatalogVersion(): number {
  return catalogVersion;
}

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function queryFromSearchParams(params: URLSearchParams): ProductQuery {
  const page = Number(params.get('page') ?? '1');
  const pageSize = Number(params.get('pageSize') ?? '10');
  const sortRaw = params.get('sort');
  let sort: ProductQuery['sort'] = null;
  if (sortRaw) {
    const [field, direction] = sortRaw.split(':');
    if (field && (direction === 'asc' || direction === 'desc')) {
      sort = { field, direction };
    }
  }

  return {
    search: params.get('search') ?? '',
    brand: parseListParam(params.get('brand')),
    category: parseListParam(params.get('category')),
    sae: parseListParam(params.get('sae')),
    status: params.get('status'),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
    sort,
  };
}

function matchesQuery(item: Product, query: ProductQuery): boolean {
  const text = query.search.trim().toLowerCase();
  if (text && !item.name.toLowerCase().includes(text)) return false;
  if (query.brand.length > 0 && !query.brand.includes(item.brand)) return false;
  if (query.category.length > 0 && !query.category.includes(item.category)) return false;
  if (query.sae.length > 0 && !query.sae.includes(item.sae)) return false;
  if (query.status && item.status !== query.status) return false;
  return true;
}

function sortItems(items: Product[], query: ProductQuery): Product[] {
  if (!query.sort) return items;
  const { field, direction } = query.sort;
  const sign = direction === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    const left = String((a as unknown as Record<string, unknown>)[field] ?? '');
    const right = String((b as unknown as Record<string, unknown>)[field] ?? '');
    return left.localeCompare(right) * sign;
  });
}

function resolveSelectionIds(selection: Selection): string[] {
  if (selection.mode === 'none') return [];
  if (selection.mode === 'some') return selection.ids;

  const snapshot = selection.querySnapshot as ProductQuery;
  const ids = productsDb.filter((product) => matchesQuery(product, snapshot)).map((product) => product.id);
  const excluded = new Set(selection.excludedIds);
  return ids.filter((id) => !excluded.has(id));
}

function findIndexById(id: string): number {
  return productsDb.findIndex((p) => p.id === id);
}

function nextId(): string {
  return String(Math.max(0, ...productsDb.map((p) => Number(p.id))) + 1);
}

/**
 * Mutates the in-memory DB to simulate an external (out-of-band) change. Used by the catalog
 * container on an interval to demonstrate the "outdated data" notice.
 */
export function simulateExternalCatalogChange(): void {
  const index = randomInt(0, productsDb.length - 1);
  const current = productsDb[index];
  if (!current) return;

  productsDb[index] = {
    ...current,
    status: randomFrom(STATUSES),
    updatedAt: new Date().toISOString(),
  };
  bumpCatalogVersion();
}

export function getFilterOptions() {
  return {
    brand: BRANDS.map((value) => ({ value, label: value })),
    category: CATEGORIES.map((value) => ({ value, label: value })),
    sae: SAE.map((value) => ({ value, label: value })),
    status: STATUSES.map((value) => ({ value, label: value })),
  };
}

export function createCatalogMockRoutes(): MockRoute[] {
  return [
    {
      method: 'GET',
      pattern: '/products',
      handler: ({ query }) => {
        const parsed = queryFromSearchParams(query);
        const filtered = productsDb.filter((item) => matchesQuery(item, parsed));
        const sorted = sortItems(filtered, parsed);
        const offset = (parsed.page - 1) * parsed.pageSize;
        const items = sorted.slice(offset, offset + parsed.pageSize);

        const body: FetchProductsResult = {
          items,
          total: null,
          requestId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          querySnapshot: parsed,
        };
        return { status: 200, body };
      },
    },
    {
      method: 'POST',
      pattern: '/products',
      handler: ({ body }) => {
        const input = body as ProductMutationInput;
        if (Math.random() < 0.08) {
          return {
            status: 422,
            body: { message: 'Product could not be created because catalog validation failed.' },
          };
        }

        const created: Product = {
          id: nextId(),
          ...input,
          updatedAt: new Date().toISOString(),
        };
        productsDb.unshift(created);
        bumpCatalogVersion();
        return { status: 201, body: created };
      },
    },
    {
      method: 'PUT',
      pattern: '/products/:id',
      handler: ({ params, body }) => {
        const { id } = params;
        if (!id) return { status: 400, body: { message: 'Missing product id.' } };

        const index = findIndexById(id);
        const current = productsDb[index];
        if (index === -1 || !current) {
          return { status: 404, body: { message: 'Product was deleted or no longer exists.' } };
        }
        if (current.disabled || Math.random() < 0.1) {
          return {
            status: 409,
            body: { message: 'Product changed outside the UI. Refresh the table and try again.' },
          };
        }

        const updated: Product = {
          ...current,
          ...(body as ProductMutationInput),
          updatedAt: new Date().toISOString(),
        };
        productsDb[index] = updated;
        bumpCatalogVersion();
        return { status: 200, body: updated };
      },
    },
    {
      method: 'POST',
      pattern: '/products/bulk',
      handler: ({ body }) => {
        const { selection, payload } = body as { selection: Selection; payload: BulkActionPayload };
        const selectedIds = resolveSelectionIds(selection);
        const failed: BulkActionResult['failed'] = [];
        const success: string[] = [];

        for (const id of selectedIds) {
          const index = findIndexById(id);
          const row = productsDb[index];
          if (!row) {
            failed.push({ id, reason: 'already deleted' });
            continue;
          }
          if (row.disabled || Math.random() < 0.12) {
            failed.push({
              id,
              name: row.name,
              reason: row.disabled ? 'permission denied' : 'conflict with another update',
            });
            continue;
          }
          success.push(id);

          if (payload.type === 'delete') {
            productsDb.splice(index, 1);
            continue;
          }
          if (payload.type === 'changeStatus') {
            productsDb[index] = { ...row, status: payload.status, updatedAt: new Date().toISOString() };
            continue;
          }
          productsDb[index] = { ...row, category: payload.category, updatedAt: new Date().toISOString() };
        }

        if (success.length > 0) bumpCatalogVersion();
        const result: BulkActionResult = { success, failed };
        return { status: 200, body: result };
      },
    },
    {
      method: 'POST',
      pattern: '/products/import',
      handler: ({ body }) => {
        const { fileName } = body as { fileName?: string };
        if (!fileName || (!fileName.toLowerCase().endsWith('.xlsx') && !fileName.toLowerCase().endsWith('.xls'))) {
          return { status: 415, body: { message: 'Upload an Excel file with .xlsx or .xls extension.' } };
        }
        if (Math.random() < 0.12) {
          return {
            status: 422,
            body: { message: 'Backend import rejected the file. Check the template and try again.' },
          };
        }

        const updatedCount = randomInt(3, 18);
        for (let i = 0; i < updatedCount; i += 1) {
          simulateExternalCatalogChange();
        }
        const result: ExcelImportResult = {
          updatedCount,
          message: `Excel import accepted. ${updatedCount} products were updated.`,
        };
        return { status: 200, body: result };
      },
    },
  ];
}
