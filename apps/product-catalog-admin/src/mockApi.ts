import type {
  BulkActionPayload,
  BulkActionResult,
  FetchProductsResult,
  Product,
  ProductStatus,
  QueryState,
  Selection,
} from './types';

const BRANDS = ['Shell', 'Castrol', 'Mobil', 'Total', 'Liqui Moly'];
const CATEGORIES = ['Engine Oil', 'Transmission Oil', 'Coolant', 'Brake Fluid'];
const SAE = ['0W-20', '5W-30', '5W-40', '10W-40'];
const STATUSES: ProductStatus[] = ['active', 'draft', 'archived'];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeProduct(index: number): Product {
  const brand = BRANDS[index % BRANDS.length];
  const category = CATEGORIES[index % CATEGORIES.length];
  const sae = SAE[index % SAE.length];
  const status = STATUSES[index % STATUSES.length];
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

let PRODUCTS_DB: Product[] = Array.from({ length: 130 }, (_, i) => makeProduct(i));

function matchesQuery(item: Product, query: QueryState): boolean {
  const text = query.search.trim().toLowerCase();
  if (text && !item.name.toLowerCase().includes(text)) return false;
  if (query.brand.length > 0 && !query.brand.includes(item.brand)) return false;
  if (query.category.length > 0 && !query.category.includes(item.category)) return false;
  if (query.sae.length > 0 && !query.sae.includes(item.sae)) return false;
  if (query.status && item.status !== query.status) return false;
  return true;
}

function sortItems(items: Product[], query: QueryState): Product[] {
  if (!query.sort) return items;
  const { field, direction } = query.sort;
  const sign = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const va = String((a as unknown as Record<string, unknown>)[field] ?? '');
    const vb = String((b as unknown as Record<string, unknown>)[field] ?? '');
    return va.localeCompare(vb) * sign;
  });
}

function maybeMutateExternally(): void {
  if (Math.random() < 0.35) {
    const idx = randomInt(0, PRODUCTS_DB.length - 1);
    const current = PRODUCTS_DB[idx];
    if (!current) return;
    PRODUCTS_DB[idx] = {
      ...current,
      status: STATUSES[randomInt(0, STATUSES.length - 1)],
      updatedAt: new Date().toISOString(),
    };
  }
}

export function getFilterOptions() {
  return {
    brand: BRANDS.map((value) => ({ value, label: value })),
    category: CATEGORIES.map((value) => ({ value, label: value })),
    sae: SAE.map((value) => ({ value, label: value })),
    status: STATUSES.map((value) => ({ value, label: value })),
  };
}

export async function fetchProducts(query: QueryState): Promise<FetchProductsResult> {
  maybeMutateExternally();
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Simulate slow API and out-of-order responses.
  const latency = randomInt(500, 1200) + (Math.random() < 0.2 ? 450 : 0);
  await delay(latency);

  const filtered = PRODUCTS_DB.filter((item) => matchesQuery(item, query));
  const sorted = sortItems(filtered, query);
  const offset = (query.page - 1) * query.pageSize;
  const items = sorted.slice(offset, offset + query.pageSize);

  return {
    items,
    total: null,
    requestId,
    querySnapshot: query,
  };
}

function resolveSelectionIds(selection: Selection): string[] {
  if (selection.mode === 'none') return [];
  if (selection.mode === 'some') return selection.ids;

  // allMatching: apply query snapshot against current DB and exclude IDs.
  const snapshot = selection.querySnapshot as QueryState;
  const ids = PRODUCTS_DB.filter((p) => matchesQuery(p, snapshot)).map((p) => p.id);
  const excluded = new Set(selection.excludedIds);
  return ids.filter((id) => !excluded.has(id));
}

export async function executeBulkAction(
  selection: Selection,
  payload: BulkActionPayload,
): Promise<BulkActionResult> {
  await delay(randomInt(450, 1100));

  const selectedIds = resolveSelectionIds(selection);
  const failed: Array<{ id: string; reason: string }> = [];
  const success: string[] = [];

  for (const id of selectedIds) {
    const row = PRODUCTS_DB.find((p) => p.id === id);
    if (!row) {
      failed.push({ id, reason: 'already deleted' });
      continue;
    }
    if (row.disabled || Math.random() < 0.12) {
      failed.push({ id, reason: row.disabled ? 'permission denied' : 'conflict with another update' });
      continue;
    }
    success.push(id);

    if (payload.type === 'delete') {
      PRODUCTS_DB = PRODUCTS_DB.filter((p) => p.id !== id);
      continue;
    }
    if (payload.type === 'changeStatus') {
      row.status = payload.status;
      row.updatedAt = new Date().toISOString();
      continue;
    }
    row.category = payload.category;
    row.updatedAt = new Date().toISOString();
  }

  return { success, failed };
}
