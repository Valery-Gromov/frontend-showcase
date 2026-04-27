import { Button } from '../atoms/Button';
import { type SelectOption } from '../atoms/Select';
import { FilterSelect } from '../molecules/FilterSelect';
import { SearchField } from '../molecules/SearchField';

export type FilterBarQuery = {
  brand: string[];
  category: string[];
  sae: string[];
  status: string | null;
  search: string;
};

export type FilterBarMode = 'instant' | 'manual';

export type FilterBarProps = {
  value: FilterBarQuery;
  mode?: FilterBarMode;
  disabled?: boolean;
  loading?: boolean;
  pendingApply?: boolean;
  options: {
    brand: SelectOption[];
    category: SelectOption[];
    sae: SelectOption[];
    status: SelectOption[];
  };
  errors?: Partial<Record<keyof FilterBarQuery, string>>;
  onChange: (value: FilterBarQuery) => void;
  onApply?: (value: FilterBarQuery) => void;
  onReset: () => void;
};

export function FilterBar({
  value,
  mode = 'instant',
  disabled = false,
  loading = false,
  pendingApply = false,
  options,
  errors,
  onChange,
  onApply,
  onReset,
}: FilterBarProps) {
  const applyVisible = mode === 'manual';

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 12,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8 }}>
        <SearchField
          value={value.search}
          loading={loading}
          placeholder="Search"
          onChange={(search) => onChange({ ...value, search })}
          onClear={() => onChange({ ...value, search: '' })}
        />
        <FilterSelect
          label="Brand"
          value={value.brand}
          options={options.brand}
          multiple
          loading={loading}
          error={errors?.brand}
          onChange={(next) => onChange({ ...value, brand: Array.isArray(next) ? next : [] })}
        />
        <FilterSelect
          label="Category"
          value={value.category}
          options={options.category}
          multiple
          loading={loading}
          error={errors?.category}
          onChange={(next) => onChange({ ...value, category: Array.isArray(next) ? next : [] })}
        />
        <FilterSelect
          label="SAE"
          value={value.sae}
          options={options.sae}
          multiple
          loading={loading}
          error={errors?.sae}
          onChange={(next) => onChange({ ...value, sae: Array.isArray(next) ? next : [] })}
        />
        <FilterSelect
          label="Status"
          value={value.status}
          options={options.status}
          loading={loading}
          error={errors?.status}
          onChange={(next) => onChange({ ...value, status: typeof next === 'string' ? next : null })}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onReset} disabled={disabled || loading}>
          Reset
        </Button>
        {applyVisible ? (
          <Button
            variant="primary"
            onClick={() => onApply?.(value)}
            loading={pendingApply}
            disabled={disabled || !onApply}
          >
            Apply
          </Button>
        ) : null}
      </div>
    </div>
  );
}
