import { Button } from '../atoms/Button';

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
    <div
      style={{
        border: '1px dashed #d1d5db',
        borderRadius: 10,
        padding: 16,
        display: 'grid',
        gap: 8,
        justifyItems: 'start',
      }}
    >
      <span aria-hidden style={{ fontSize: 18 }}>
        o
      </span>
      <strong>{title}</strong>
      {description ? <span style={{ color: '#6b7280' }}>{description}</span> : null}
      {actionLabel ? (
        <Button variant="secondary" onClick={onAction} disabled={!onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
