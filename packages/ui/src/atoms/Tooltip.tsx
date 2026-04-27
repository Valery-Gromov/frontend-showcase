import type { CSSProperties, ReactNode } from 'react';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: TooltipPlacement;
  delayMs?: number;
  disabled?: boolean;
}

const placementStyle: Record<TooltipPlacement, CSSProperties> = {
  top: { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' },
  right: { left: '100%', top: '50%', transform: 'translate(8px, -50%)' },
  bottom: { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' },
  left: { right: '100%', top: '50%', transform: 'translate(-8px, -50%)' },
};

export function Tooltip({
  content,
  children,
  placement = 'top',
  delayMs = 150,
  disabled = false,
}: TooltipProps) {
  if (disabled) return <>{children}</>;

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <style>{`.ui-tooltip-content { opacity: 0; pointer-events: none; transition: opacity .15s ease; }
.ui-tooltip-wrapper:hover .ui-tooltip-content, .ui-tooltip-wrapper:focus-within .ui-tooltip-content { opacity: 1; transition-delay: ${delayMs}ms; }`}</style>
      <span className="ui-tooltip-wrapper" style={{ display: 'inline-flex' }}>
        <span style={{ display: 'inline-flex' }}>{children}</span>
        <span
          role="tooltip"
          className="ui-tooltip-content"
          style={{
            position: 'absolute',
            zIndex: 20,
            maxWidth: 260,
            padding: '6px 8px',
            borderRadius: 6,
            fontSize: 12,
            color: '#fff',
            background: '#111827',
            ...placementStyle[placement],
          }}
        >
          {content}
        </span>
      </span>
    </span>
  );
}
