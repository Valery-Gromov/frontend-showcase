import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Chip.module.css';

export interface ChipProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  removable?: boolean;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
  onRemove?: () => void;
}

export function Chip({
  children,
  removable = false,
  selected = false,
  compact = false,
  disabled = false,
  onRemove,
  className,
  ...rest
}: ChipProps) {
  return (
    <div
      {...rest}
      aria-disabled={disabled}
      data-selected={selected}
      data-compact={compact}
      className={className ? `${styles.chip} ${className}` : styles.chip}
    >
      <span>{children}</span>
      {removable ? (
        <button
          type="button"
          aria-label="Remove chip"
          disabled={disabled}
          onClick={onRemove}
          className={styles.removeButton}
        >
          x
        </button>
      ) : null}
    </div>
  );
}
