import { ProductForm } from './ProductForm';
import type { ProductFormErrors, ProductFormValue, ProductMutationState } from '../model/types';
import type { SelectOption } from '@frontend-showcase/ui';

type ProductFormOptions = {
  brand: SelectOption[];
  category: SelectOption[];
  sae: SelectOption[];
  status: SelectOption[];
};

type ProductEditorDrawerProps = {
  open: boolean;
  mode: 'create' | 'edit';
  value: ProductFormValue;
  errors: ProductFormErrors;
  options: ProductFormOptions;
  dirty: boolean;
  mutationState: ProductMutationState;
  onChange: (value: ProductFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ProductEditorDrawer({
  open,
  mode,
  value,
  errors,
  options,
  dirty,
  mutationState,
  onChange,
  onSubmit,
  onCancel,
}: ProductEditorDrawerProps) {
  if (!open) return null;

  const saving = mutationState.status === 'saving';
  const title = mode === 'edit' ? 'Edit product' : 'Add product';

  return (
    <aside className="drawer" aria-labelledby="product-editor-title">
      <div className="drawer-panel">
        <div className="drawer-header">
          <div>
            <h2 id="product-editor-title">{title}</h2>
            <p>{mode === 'edit' ? 'Update catalog product details.' : 'Create a new catalog product.'}</p>
          </div>
        </div>

        {mutationState.status === 'error' ? (
          <div className="form-alert" role="alert">
            {mutationState.error.message}
          </div>
        ) : null}

        <ProductForm
          value={value}
          errors={errors}
          options={options}
          saving={saving}
          submitDisabled={mode === 'edit' && !dirty}
          submitLabel={mode === 'edit' ? 'Save changes' : 'Create product'}
          onChange={onChange}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      </div>
    </aside>
  );
}
