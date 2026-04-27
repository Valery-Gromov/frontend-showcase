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

function toggleOption(value: string[], optionValue: string): string[] {
  if (value.includes(optionValue)) {
    return value.filter((item) => item !== optionValue);
  }

  return [...value, optionValue];
}

export function FilterSelect({
  label,
  value,
  options,
  multiple = false,
  loading = false,
  error,
  onChange,
}: FilterSelectProps) {
  const selectedValues = Array.isArray(value) ? value : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
      {multiple ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            role="group"
            aria-label={label}
            aria-busy={loading || undefined}
            style={{
              display: 'grid',
              gap: 0,
              padding: '4px 0',
              height: 176,
              overflowY: 'auto',
              background: '#fff',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {options.length === 0 ? (
              <span style={{ color: '#6b7280', fontSize: 13 }}>No options</span>
            ) : null}
            {options.map((option) => {
              const selected = selectedValues.includes(option.value);
              const disabled = loading || Boolean(option.disabled);

              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  onClick={() => onChange(toggleOption(selectedValues, option.value))}
                  style={{
                    border: 0,
                    background: selected ? '#f3f4f6' : '#fff',
                    color: '#111827',
                    minHeight: 44,
                    padding: '0 14px',
                    fontSize: 16,
                    fontWeight: 500,
                    textAlign: 'left',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.55 : 1,
                    outlineOffset: 2,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={loading || selectedValues.length === 0}
            style={{
              justifySelf: 'start',
              border: 0,
              background: 'transparent',
              color: '#374151',
              borderRadius: 6,
              minHeight: 28,
              padding: '0 10px',
              cursor: loading || selectedValues.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || selectedValues.length === 0 ? 0.55 : 1,
            }}
          >
            Clear all
          </button>
        </div>
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
