import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader } from './Loader';

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
  style,
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
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        border: `1px solid ${danger ? '#dc2626' : '#d1d5db'}`,
        color: danger ? '#dc2626' : '#111827',
        background: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        ...style,
      }}
    >
      {loading ? <Loader size="xs" label="Icon button loading" /> : icon}
    </button>
  );
}
