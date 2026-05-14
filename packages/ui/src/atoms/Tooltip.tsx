import type { CSSProperties, ReactNode } from 'react';
import styles from './Tooltip.module.css';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delayMs?: number;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  delayMs = 150,
  disabled = false,
}: TooltipProps) {
  if (disabled) return <>{children}</>;

  // `--tooltip-delay` is the only inline style: per-instance values cannot be a class.
  const delayStyle = { ['--tooltip-delay' as string]: `${delayMs}ms` } as CSSProperties;

  return (
    <span className={styles.wrapper} style={delayStyle}>
      <span className={styles.trigger}>{children}</span>
      <span role="tooltip" className={styles.content} data-placement={placement}>
        {content}
      </span>
    </span>
  );
}
