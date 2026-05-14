import { ConfirmDialog } from './ConfirmDialog';

type QueryChangeConfirmDialogProps = {
  open: boolean;
  onCancel: () => void;
  onContinue: () => void;
};

export function QueryChangeConfirmDialog({ open, onCancel, onContinue }: QueryChangeConfirmDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      title="Clear current selection?"
      description="Changing query will clear the current selection."
      cancelLabel="Cancel"
      confirmLabel="Continue"
      titleId="query-change-confirm-title"
      descriptionId="query-change-confirm-description"
      onCancel={onCancel}
      onConfirm={onContinue}
    />
  );
}
