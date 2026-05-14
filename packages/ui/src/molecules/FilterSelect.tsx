import { Select, type SelectOption } from '../atoms/Select';
import styles from './FilterSelect.module.css';

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
    <div className={styles.root}>
      <label className={styles.label}>{label}</label>
      {multiple ? (
        <div className={styles.multi}>
          <div
            role="group"
            aria-label={label}
            aria-busy={loading || undefined}
            className={styles.optionList}
            data-loading={loading}
          >
            {options.length === 0 ? <span className={styles.emptyOptions}>No options</span> : null}
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
                  className={styles.option}
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
            className={styles.clearAll}
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
      {error ? <small className={styles.errorText}>{error}</small> : null}
    </div>
  );
}
