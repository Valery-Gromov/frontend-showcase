import { useMemo } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  value: string;
  onValueChange: (value: string) => void;
  clearable?: boolean;
  onClear?: () => void;
  prefix?: ReactNode;
  suffix?: ReactNode;
  helperText?: string;
  errorText?: string;
  pending?: boolean;
}

export function TextInput({
  value,
  onValueChange,
  clearable = false,
  onClear,
  prefix,
  suffix,
  helperText,
  errorText,
  pending = false,
  disabled,
  style,
  ...rest
}: TextInputProps) {
  const hint = useMemo(() => errorText ?? helperText, [errorText, helperText]);
  const hasError = Boolean(errorText);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValueChange(event.target.value);
  };

  const handleClear = () => {
    if (disabled) return;
    if (onClear) onClear();
    else onValueChange('');
  };

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 8,
          border: `1px solid ${hasError ? '#dc2626' : '#d1d5db'}`,
          padding: '0 10px',
          height: 36,
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
      >
        {prefix ? <span>{prefix}</span> : null}
        <input
          {...rest}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={hasError || undefined}
          style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
        />
        {pending ? <span aria-hidden>...</span> : null}
        {clearable && value ? (
          <button type="button" aria-label="Clear input" onClick={handleClear} disabled={disabled}>
            x
          </button>
        ) : null}
        {suffix ? <span>{suffix}</span> : null}
      </div>
      {hint ? <small style={{ color: hasError ? '#dc2626' : '#6b7280' }}>{hint}</small> : null}
    </div>
  );
}
