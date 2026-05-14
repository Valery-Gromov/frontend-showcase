import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'rectangle' | 'table-row' | 'card';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ variant = 'text', width, height }: SkeletonProps) {
  const overrides: CSSProperties = {};
  if (width !== undefined) overrides.width = width;
  if (height !== undefined) overrides.height = height;
  return <div className={styles.skeleton} data-variant={variant} style={overrides} />;
}
