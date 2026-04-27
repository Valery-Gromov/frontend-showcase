import type { CSSProperties } from 'react';

export type SkeletonVariant = 'text' | 'rectangle' | 'table-row' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ variant = 'text', width, height }: SkeletonProps) {
  const common: CSSProperties = {
    borderRadius: 8,
    background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%)',
    backgroundSize: '400% 100%',
    animation: 'ui-skeleton-shimmer 1.2s ease-in-out infinite',
  };

  if (variant === 'table-row') {
    return <div style={{ ...common, height: 36, width: '100%' }} />;
  }
  if (variant === 'card') {
    return <div style={{ ...common, height: 120, width: 240 }} />;
  }
  if (variant === 'rectangle') {
    return <div style={{ ...common, height: height ?? 80, width: width ?? '100%' }} />;
  }
  return (
    <div style={{ ...common, height: height ?? 14, width: width ?? '60%' }}>
      <style>{'@keyframes ui-skeleton-shimmer {0% {background-position: 100% 0;}100% {background-position: 0 0;}}'}</style>
    </div>
  );
}
