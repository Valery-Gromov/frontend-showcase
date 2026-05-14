import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from './Loader';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      className={className ? `${styles.button} ${className}` : styles.button}
    >
      {loading ? <Loader size="sm" label="Button loading" /> : null}
      <span className={styles.label}>{children}</span>
    </button>
  );
}
