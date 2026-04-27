import { Select, type SelectOption } from '../atoms/Select';

export type FilterSelectProps = {
  label: string;
  value: string | string[] | null;
  options: SelectOption[];
  multiple?: boolean;
  loading?: boolean;
  error?: string;
  onChange: (value: string | string[] | null) => void;
};

export function FilterSelect({
  label,
  value,
  options,
  multiple = false,
  loading = false,
  error,
  onChange,
}: FilterSelectProps) {
  const hasError = Boolean(error);

  if (multiple) {
    const multiValue = Array.isArray(value) ? value : [];
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        <label style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
        <Select
          multiple
          value={multiValue}
          options={options}
          loading={loading}
          error={hasError}
          onValueChange={(next) => onChange(next)}
          onClearAll={() => onChange([])}
        />
        {error ? <small style={{ color: '#dc2626' }}>{error}</small> : null}
      </div>
    );
  }

  const singleValue = typeof value === 'string' ? value : '';
  const preparedOptions = [{ label: 'All', value: '' }, ...options];

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600 }}>{label}</label>
      <Select
        value={singleValue}
        options={preparedOptions}
        loading={loading}
        error={hasError}
        onValueChange={(next) => onChange(next === '' ? null : next)}
      />
      {error ? <small style={{ color: '#dc2626' }}>{error}</small> : null}
    </div>
  );
}

export type { SelectOption };
