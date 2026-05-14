import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'neutral', children, className, ...rest }: BadgeProps) {
  return (
    <span
      {...rest}
      data-variant={variant}
      className={className ? `${styles.badge} ${className}` : styles.badge}
    >
      {children}
    </span>
  );
}
