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

export type ProductFormValue = {
  name: string;
  brand: string;
  category: string;
  sae: string;
  status: ProductStatus;
};

export type ProductFormErrors = Partial<Record<keyof ProductFormValue, string>>;

export type ProductMutationError = {
  message: string;
  fieldErrors?: ProductFormErrors;
};

export type ProductMutationState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success'; message: string }
  | { status: 'error'; error: ProductMutationError };

export type ProductDrawerState =
  | { mode: 'closed' }
  | { mode: 'edit'; product: Product; initialValue: ProductFormValue }
  | { mode: 'create'; initialValue: ProductFormValue };

export type ProductMutationInput = ProductFormValue;

export type ExcelImportState =
  | { status: 'closed' }
  | { status: 'idle'; file: File | null }
  | { status: 'uploading'; file: File }
  | { status: 'success'; message: string }
  | { status: 'error'; file: File | null; message: string };

export type ExcelImportResult = {
  message: string;
  updatedCount: number;
};

export type ProductQuery = {
  search: string;
  brand: string[];
  category: string[];
  sae: string[];
  status: string | null;
  page: number;
  pageSize: number;
  sort: SortState;
};

export type PendingQueryChange = {
  nextQuery: ProductQuery;
  source: 'apply' | 'reset' | 'sort' | 'pagination' | 'popstate';
} | null;

export type TableLoadState =
  | { status: 'idle' }
  | { status: 'initialLoading' }
  | { status: 'queryLoading' }
  | { status: 'refreshLoading' }
  | { status: 'success' }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export type FetchProductsResult = {
  items: Product[];
  total: number | null;
  requestId: string;
  querySnapshot: ProductQuery;
};

export type BulkActionPayload =
  | { type: 'changeStatus'; status: ProductStatus }
  | { type: 'delete' }
  | { type: 'changeCategory'; category: string };

export type BulkFailure = {
  id: string;
  reason: string;
  name?: string;
};

export type BulkActionResult = {
  success: string[];
  failed: BulkFailure[];
};

export type BulkActionState =
  | { status: 'idle' }
  | { status: 'submitting'; actionId: string }
  | { status: 'success'; message: string }
  | { status: 'partialSuccess'; message: string; failed: BulkFailure[] }
  | { status: 'failure'; message: string };

export type Selection = SelectionState;
