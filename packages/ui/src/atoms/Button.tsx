import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { Loader } from './Loader';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: { background: '#2563eb', color: '#fff', border: '1px solid #2563eb' },
  secondary: { background: '#fff', color: '#111827', border: '1px solid #d1d5db' },
  ghost: { background: 'transparent', color: '#111827', border: '1px solid transparent' },
  danger: { background: '#dc2626', color: '#fff', border: '1px solid #dc2626' },
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      style={{
        ...variantStyles[variant],
        height: 36,
        padding: '0 14px',
        borderRadius: 8,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        outlineOffset: 2,
        ...style,
      }}
    >
      {loading ? <Loader size="sm" label="Button loading" /> : null}
      <span>{children}</span>
    </button>
  );
}
