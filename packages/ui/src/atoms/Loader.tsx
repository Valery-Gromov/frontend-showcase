import styles from './Loader.module.css';

export type LoaderVariant = 'inline' | 'block' | 'overlay';
export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg';

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: LoaderSize;
  label?: string;
}

export function Loader({ variant = 'inline', size = 'md', label = 'Loading' }: LoaderProps) {
  return (
    <span aria-live="polite" aria-label={label} className={styles.container} data-variant={variant}>
      <span className={styles.spinner} data-size={size} />
    </span>
  );
}
