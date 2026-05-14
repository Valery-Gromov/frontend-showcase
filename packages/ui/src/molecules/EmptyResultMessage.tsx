import { Button } from '../atoms/Button';
import styles from './EmptyResultMessage.module.css';

export type EmptyResultMessageProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyResultMessage({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyResultMessageProps) {
  return (
    <div className={styles.message}>
      <span aria-hidden className={styles.icon}>
        🔍
      </span>
      <strong>{title}</strong>
      {description ? <span className={styles.description}>{description}</span> : null}
      {actionLabel && onAction ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
