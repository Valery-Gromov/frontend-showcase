import type { HTMLAttributes, ReactNode } from 'react';

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
  style,
  ...rest
}: ChipProps) {
  return (
    <div
      {...rest}
      aria-disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        border: `1px solid ${selected ? '#2563eb' : '#d1d5db'}`,
        background: selected ? '#eff6ff' : '#fff',
        color: disabled ? '#9ca3af' : '#111827',
        padding: compact ? '2px 8px' : '4px 10px',
        fontSize: compact ? 12 : 13,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      <span>{children}</span>
      {removable ? (
        <button
          type="button"
          aria-label="Remove chip"
          disabled={disabled}
          onClick={onRemove}
          style={{ border: 'none', background: 'transparent', cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
          x
        </button>
      ) : null}
    </div>
  );
}
