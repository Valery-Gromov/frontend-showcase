import { Button } from '../atoms/Button';
import { Tooltip } from '../atoms/Tooltip';
import { BulkSelectionSummary } from '../molecules/BulkSelectionSummary';
import { type SelectionState } from './DataTable';
import type { ReactNode } from 'react';
import styles from './BulkActionBar.module.css';

export type BulkActionItem = {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  disabledReason?: string;
};

export type BulkActionBarProps = {
  selection: SelectionState;
  selectedCount: number;
  totalKnown?: number | null;
  actions: BulkActionItem[];
  toolbarActions?: ReactNode;
  loadingActionId?: string | null;
  disabled?: boolean;
  onAction: (actionId: string) => void;
  onClearSelection: () => void;
};

function getSummaryMode(selection: SelectionState): 'none' | 'page' | 'allMatching' {
  if (selection.mode === 'none') return 'none';
  if (selection.mode === 'allMatching') return 'allMatching';
  return 'page';
}

function getExcludedCount(selection: SelectionState): number {
  return selection.mode === 'allMatching' ? selection.excludedIds.length : 0;
}

export function BulkActionBar({
  selection,
  selectedCount,
  totalKnown,
  actions,
  toolbarActions,
  loadingActionId = null,
  disabled = false,
  onAction,
  onClearSelection,
}: BulkActionBarProps) {
  const mode = getSummaryMode(selection);
  const barDisabled = disabled || mode === 'none';

  return (
    <div className={styles.bar} role="region" aria-label="Bulk selection and actions">
      <BulkSelectionSummary
        mode={mode}
        selectedCount={selectedCount}
        excludedCount={getExcludedCount(selection)}
        totalKnown={totalKnown}
        onClear={onClearSelection}
      />
      <div className={styles.actions} role="group" aria-label="Bulk action controls">
        {toolbarActions}
        {actions.map((action) => {
          const isDisabled = barDisabled || Boolean(action.disabled);
          const button = (
            <Button
              key={action.id}
              variant={action.variant ?? 'secondary'}
              disabled={isDisabled}
              loading={loadingActionId === action.id}
              onClick={() => onAction(action.id)}
            >
              {action.label}
            </Button>
          );

          if (isDisabled && action.disabledReason) {
            return (
              <Tooltip key={action.id} content={action.disabledReason}>
                <span>{button}</span>
              </Tooltip>
            );
          }

          return button;
        })}
      </div>
    </div>
  );
}
