import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from './Loader';
import styles from './IconButton.module.css';

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: ReactNode;
  label: string;
  loading?: boolean;
  danger?: boolean;
}

export function IconButton({
  icon,
  label,
  loading = false,
  danger = false,
  disabled,
  className,
  ...rest
}: IconButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      type={rest.type ?? 'button'}
      aria-label={label}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-danger={danger}
      className={className ? `${styles.iconButton} ${className}` : styles.iconButton}
    >
      {loading ? <Loader size="xs" label="Icon button loading" /> : icon}
    </button>
  );
}
