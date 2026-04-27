import { Button } from '@frontend-showcase/ui';

type QueryChangeConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
};

export function QueryChangeConfirmDialog({ open, onCancel, onContinue }: QueryChangeConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="query-change-confirm-title"
        aria-describedby="query-change-confirm-description"
      >
        <h2 id="query-change-confirm-title">Clear current selection?</h2>
        <p id="query-change-confirm-description">Changing query will clear the current selection.</p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
