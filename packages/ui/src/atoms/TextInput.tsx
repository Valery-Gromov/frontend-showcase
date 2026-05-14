import { useMemo } from 'react';
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react';
import styles from './TextInput.module.css';

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
  className,
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

  const fieldState = hasError ? 'error' : 'default';

  return (
    <div className={className ? `${styles.root} ${className}` : styles.root}>
      <div className={styles.field} data-state={fieldState} data-disabled={disabled}>
        {prefix ? <span className={styles.adornment}>{prefix}</span> : null}
        <input
          {...rest}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          aria-invalid={hasError || undefined}
          className={styles.input}
        />
        {pending ? (
          <span className={styles.adornment} aria-hidden>
            ...
          </span>
        ) : null}
        {clearable && value ? (
          <button
            type="button"
            aria-label="Clear input"
            onClick={handleClear}
            disabled={disabled}
            className={styles.clearButton}
          >
            x
          </button>
        ) : null}
        {suffix ? <span className={styles.adornment}>{suffix}</span> : null}
      </div>
      {hint ? (
        <small className={styles.hint} data-state={fieldState}>
          {hint}
        </small>
      ) : null}
    </div>
  );
}
