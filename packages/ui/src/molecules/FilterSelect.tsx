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
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
      {multiple ? (
        <Select
          multiple
          options={options}
          value={Array.isArray(value) ? value : []}
          loading={loading}
          error={Boolean(error)}
          onValueChange={(next) => onChange(next.length ? next : null)}
          onClearAll={() => onChange(null)}
        />
      ) : (
        <Select
          options={options}
          value={typeof value === 'string' ? value : ''}
          loading={loading}
          error={Boolean(error)}
          onValueChange={(next) => onChange(next || null)}
        />
      )}
      {error ? <small style={{ color: '#dc2626' }}>{error}</small> : null}
    </div>
  );
}
