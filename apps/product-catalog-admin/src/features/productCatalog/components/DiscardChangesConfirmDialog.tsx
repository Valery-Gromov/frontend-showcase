import { ConfirmDialog } from './ConfirmDialog';

type DiscardChangesConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
};

export function DiscardChangesConfirmDialog({ open, onCancel, onDiscard }: DiscardChangesConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Discard changes?"
      description="You have unsaved product changes. Closing now will discard them."
      cancelLabel="Keep editing"
      confirmLabel="Discard"
      confirmVariant="danger"
      titleId="discard-changes-title"
      descriptionId="discard-changes-description"
      onCancel={onCancel}
      onConfirm={onDiscard}
    />
  );
}
