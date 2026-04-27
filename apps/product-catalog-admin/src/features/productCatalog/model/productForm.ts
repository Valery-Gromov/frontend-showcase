import type { Product, ProductFormErrors, ProductFormValue, ProductStatus } from './types';

export const DEFAULT_PRODUCT_FORM_VALUE: ProductFormValue = {
  name: '',
  brand: '',
  category: '',
  sae: '',
  status: 'draft',
};

export function productToFormValue(product: Product): ProductFormValue {
  return {
    name: product.name,
    brand: product.brand,
    category: product.category,
    sae: product.sae,
    status: product.status,
  };
}

export function isProductFormDirty(value: ProductFormValue, initialValue: ProductFormValue): boolean {
  return (
    value.name !== initialValue.name ||
    value.brand !== initialValue.brand ||
    value.category !== initialValue.category ||
    value.sae !== initialValue.sae ||
    value.status !== initialValue.status
  );
}

export function validateProductForm(value: ProductFormValue): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!value.name.trim()) errors.name = 'Product name is required.';
  if (!value.brand) errors.brand = 'Brand is required.';
  if (!value.category) errors.category = 'Category is required.';
  if (!value.sae) errors.sae = 'SAE is required.';
  if (!value.status) errors.status = 'Status is required.';

  return errors;
}

export function hasProductFormErrors(errors: ProductFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function normalizeProductFormValue(value: ProductFormValue): ProductFormValue {
  return {
    ...value,
    name: value.name.trim(),
  };
}

export function isProductStatus(value: string): value is ProductStatus {
  return value === 'active' || value === 'draft' || value === 'archived';
}
