import { Button } from '@frontend-showcase/ui';

type DiscardChangesConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
};

export function DiscardChangesConfirmDialog({ open, onCancel, onDiscard }: DiscardChangesConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discard-changes-title"
        aria-describedby="discard-changes-description"
      >
        <h2 id="discard-changes-title">Discard changes?</h2>
        <p id="discard-changes-description">You have unsaved product changes. Closing now will discard them.</p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onCancel}>
            Keep editing
          </Button>
          <Button variant="danger" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
