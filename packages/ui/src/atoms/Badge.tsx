import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const colors: Record<BadgeVariant, { bg: string; fg: string }> = {
  neutral: { bg: '#f3f4f6', fg: '#374151' },
  success: { bg: '#dcfce7', fg: '#166534' },
  warning: { bg: '#fef3c7', fg: '#92400e' },
  danger: { bg: '#fee2e2', fg: '#991b1b' },
  info: { bg: '#dbeafe', fg: '#1d4ed8' },
};

export function Badge({ variant = 'neutral', children, style, ...rest }: BadgeProps) {
  const token = colors[variant];
  return (
    <span
      {...rest}
      data-variant={variant}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
        background: token.bg,
        color: token.fg,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
