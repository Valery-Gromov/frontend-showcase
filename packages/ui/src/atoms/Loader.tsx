import type { CSSProperties } from 'react';

export type LoaderVariant = 'inline' | 'block' | 'overlay';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  label?: string;
}

const sizeMap: Record<LoaderSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
};

export function Loader({ variant = 'inline', size = 'md', label = 'Loading' }: LoaderProps) {
  const px = sizeMap[size];
  const spinnerStyle: CSSProperties = {
    width: px,
    height: px,
    borderRadius: '999px',
    border: '2px solid #d1d5db',
    borderTopColor: '#2563eb',
    animation: 'ui-loader-spin 0.8s linear infinite',
    display: 'inline-block',
  };

  const containerStyle: CSSProperties =
    variant === 'overlay'
      ? {
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.6)',
        }
      : variant === 'block'
        ? { display: 'flex', width: '100%', justifyContent: 'center', padding: 12 }
        : { display: 'inline-flex', alignItems: 'center' };

  return (
    <span aria-live="polite" aria-label={label} style={containerStyle}>
      <style>{'@keyframes ui-loader-spin { to { transform: rotate(360deg); } }'}</style>
      <span style={spinnerStyle} />
    </span>
  );
}
