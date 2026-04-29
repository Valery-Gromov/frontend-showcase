import { Button } from '../atoms/Button';
import { Tooltip } from '../atoms/Tooltip';
import { BulkSelectionSummary } from '../molecules/BulkSelectionSummary';
import { type SelectionState } from './DataTable';
import type { ReactNode } from 'react';

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
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 10,
        padding: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <BulkSelectionSummary
        mode={mode}
        selectedCount={selectedCount}
        totalKnown={totalKnown}
        onClear={onClearSelection}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
