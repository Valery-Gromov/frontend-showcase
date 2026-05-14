import { Loader } from './Loader';
import styles from './Select.module.css';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SelectBaseProps {
  options: SelectOption[];
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  emptyText?: string;
}

interface SingleSelectProps extends SelectBaseProps {
  multiple?: false;
  value: string;
  onValueChange: (value: string) => void;
}

interface MultiSelectProps extends SelectBaseProps {
  multiple: true;
  value: string[];
  onValueChange: (value: string[]) => void;
  onClearAll?: () => void;
}

export type SelectProps = SingleSelectProps | MultiSelectProps;

export function Select(props: SelectProps) {
  const { options, disabled = false, error = false, loading = false, emptyText = 'No options' } = props;

  if (props.multiple) {
    return (
      <div className={styles.root}>
        <select
          multiple
          value={props.value}
          disabled={disabled || loading}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
            props.onValueChange(selected);
          }}
          data-error={error}
          className={`${styles.select} ${styles.multiSelect}`}
        >
          {options.length === 0 ? <option disabled>{emptyText}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className={styles.multiFooter}>
          {loading ? <Loader size="sm" label="Loading options" /> : null}
          <button
            type="button"
            onClick={() => (props.onClearAll ? props.onClearAll() : props.onValueChange([]))}
            disabled={disabled || loading || props.value.length === 0}
            className={styles.clearAllButton}
          >
            Clear all
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <select
        value={props.value}
        disabled={disabled || loading}
        onChange={(e) => props.onValueChange(e.target.value)}
        data-error={error}
        className={styles.select}
      >
        {options.length === 0 ? <option value="">{emptyText}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {loading ? <Loader size="sm" label="Loading options" /> : null}
    </div>
  );
}
