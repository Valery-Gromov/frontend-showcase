import type {
  BulkActionPayload,
  BulkActionResult,
  FetchProductsResult,
  Product,
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

let productsDb: Product[] = Array.from({ length: 130 }, (_, index) => makeProduct(index));

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

export function simulateExternalCatalogChange(): void {
  const index = randomInt(0, productsDb.length - 1);
  const current = productsDb[index];
  if (!current) return;

  productsDb[index] = {
    ...current,
    status: randomFrom(STATUSES),
    updatedAt: new Date().toISOString(),
  };
}

export function getFilterOptions() {
  return {
    brand: BRANDS.map((value) => ({ value, label: value })),
    category: CATEGORIES.map((value) => ({ value, label: value })),
    sae: SAE.map((value) => ({ value, label: value })),
    status: STATUSES.map((value) => ({ value, label: value })),
  };
}

export async function fetchProducts(query: ProductQuery): Promise<FetchProductsResult> {
  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  // Simulate slow API and out-of-order responses.
  const latency = randomInt(500, 1200) + (Math.random() < 0.2 ? 450 : 0);
  await delay(latency);

  const filtered = productsDb.filter((item) => matchesQuery(item, query));
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

  const snapshot = selection.querySnapshot as ProductQuery;
  const ids = productsDb.filter((product) => matchesQuery(product, snapshot)).map((product) => product.id);
  const excluded = new Set(selection.excludedIds);
  return ids.filter((id) => !excluded.has(id));
}

export async function executeBulkAction(
  selection: Selection,
  payload: BulkActionPayload,
): Promise<BulkActionResult> {
  await delay(randomInt(450, 1100));

  const selectedIds = resolveSelectionIds(selection);
  const failed: BulkActionResult['failed'] = [];
  const success: string[] = [];

  for (const id of selectedIds) {
    const row = productsDb.find((product) => product.id === id);
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
      productsDb = productsDb.filter((product) => product.id !== id);
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
