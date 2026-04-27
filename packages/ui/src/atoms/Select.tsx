import type { CSSProperties } from 'react';
import { Loader } from './Loader';

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

const baseStyle: CSSProperties = {
  borderRadius: 8,
  border: '1px solid #d1d5db',
  minHeight: 36,
  padding: '6px 8px',
  width: '100%',
};

export function Select(props: SelectProps) {
  const { options, disabled = false, error = false, loading = false, emptyText = 'No options' } = props;
  const style: CSSProperties = {
    ...baseStyle,
    borderColor: error ? '#dc2626' : '#d1d5db',
    opacity: disabled ? 0.6 : 1,
  };

  if (props.multiple) {
    return (
      <div style={{ display: 'grid', gap: 8 }}>
        <select
          multiple
          value={props.value}
          disabled={disabled || loading}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
            props.onValueChange(selected);
          }}
          style={{ ...style, minHeight: 100 }}
        >
          {options.length === 0 ? <option disabled>{emptyText}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {loading ? <Loader size="sm" label="Loading options" /> : null}
          <button
            type="button"
            onClick={() => (props.onClearAll ? props.onClearAll() : props.onValueChange([]))}
            disabled={disabled || loading || props.value.length === 0}
          >
            Clear all
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <select
        value={props.value}
        disabled={disabled || loading}
        onChange={(e) => props.onValueChange(e.target.value)}
        style={style}
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
