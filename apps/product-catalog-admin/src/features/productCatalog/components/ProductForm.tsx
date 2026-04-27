import { Button, Select, TextInput, type SelectOption } from '@frontend-showcase/ui';
import { isProductStatus } from '../model/productForm';
import type { ProductFormErrors, ProductFormValue } from '../model/types';

type ProductFormOptions = {
  brand: SelectOption[];
  category: SelectOption[];
  sae: SelectOption[];
  status: SelectOption[];
};

type ProductFormProps = {
  value: ProductFormValue;
  errors: ProductFormErrors;
  options: ProductFormOptions;
  disabled?: boolean;
  saving?: boolean;
  submitDisabled?: boolean;
  submitLabel: string;
  onChange: (value: ProductFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ProductForm({
  value,
  errors,
  options,
  disabled = false,
  saving = false,
  submitDisabled = false,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const controlsDisabled = disabled || saving;

  return (
    <form
      className="product-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="form-field">
        <span>Name</span>
        <TextInput
          value={value.name}
          onValueChange={(name) => onChange({ ...value, name })}
          disabled={controlsDisabled}
          errorText={errors.name}
          placeholder="Product name"
        />
      </label>

      <label className="form-field">
        <span>Brand</span>
        <Select
          value={value.brand}
          options={options.brand}
          disabled={controlsDisabled}
          error={Boolean(errors.brand)}
          onValueChange={(brand) => onChange({ ...value, brand })}
        />
        {errors.brand ? <small className="form-error">{errors.brand}</small> : null}
      </label>

      <label className="form-field">
        <span>Category</span>
        <Select
          value={value.category}
          options={options.category}
          disabled={controlsDisabled}
          error={Boolean(errors.category)}
          onValueChange={(category) => onChange({ ...value, category })}
        />
        {errors.category ? <small className="form-error">{errors.category}</small> : null}
      </label>

      <label className="form-field">
        <span>SAE</span>
        <Select
          value={value.sae}
          options={options.sae}
          disabled={controlsDisabled}
          error={Boolean(errors.sae)}
          onValueChange={(sae) => onChange({ ...value, sae })}
        />
        {errors.sae ? <small className="form-error">{errors.sae}</small> : null}
      </label>

      <label className="form-field">
        <span>Status</span>
        <Select
          value={value.status}
          options={options.status}
          disabled={controlsDisabled}
          error={Boolean(errors.status)}
          onValueChange={(status) => {
            if (isProductStatus(status)) {
              onChange({ ...value, status });
            }
          }}
        />
        {errors.status ? <small className="form-error">{errors.status}</small> : null}
      </label>

      <div className="drawer-actions">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving} disabled={controlsDisabled || submitDisabled}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
