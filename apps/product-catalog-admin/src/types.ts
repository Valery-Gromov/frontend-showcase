import type { SelectionState, SortState } from '@frontend-showcase/ui';

export type ProductStatus = 'active' | 'draft' | 'archived';

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  sae: string;
  status: ProductStatus;
  updatedAt: string;
  disabled?: boolean;
  disabledReason?: string;
};

export type QueryState = {
  search: string;
  brand: string[];
  category: string[];
  sae: string[];
  status: string | null;
  page: number;
  pageSize: number;
  sort: SortState;
};

export type FetchProductsResult = {
  items: Product[];
  total: number | null;
  requestId: string;
  querySnapshot: QueryState;
};

export type BulkActionType = 'changeStatus' | 'delete' | 'changeCategory';

export type BulkActionPayload =
  | { type: 'changeStatus'; status: ProductStatus }
  | { type: 'delete' }
  | { type: 'changeCategory'; category: string };

export type BulkActionResult = {
  success: string[];
  failed: Array<{ id: string; reason: string }>;
};

export type Selection = SelectionState;
