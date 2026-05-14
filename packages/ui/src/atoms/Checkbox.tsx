import { useEffect, useRef } from 'react';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  label?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  id,
  name,
  label,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={styles.label} data-disabled={disabled}>
      <input
        ref={ref}
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-checked={indeterminate ? 'mixed' : checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className={styles.input}
      />
      {label ? <span>{label}</span> : null}
    </label>
  );
}
