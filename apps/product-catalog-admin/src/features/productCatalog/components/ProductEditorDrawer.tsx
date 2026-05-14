import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    window.setTimeout(() => {
      const panel = panelRef.current;
      const firstFocusable = panel?.querySelector<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable ?? panel)?.focus();
    }, 0);

    return () => {
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const saving = mutationState.status === 'saving';
  const title = mode === 'edit' ? 'Edit product' : 'Add product';

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key !== 'Tab') return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      ),
    );

    if (focusable.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleBackdropClick = (event: MouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  };

  return (
    <aside
      className="drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-editor-title"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div ref={panelRef} className="drawer-panel" tabIndex={-1}>
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
