import { Button } from '../atoms/Button';

export type BulkSelectionMode = 'none' | 'page' | 'allMatching';

export type BulkSelectionSummaryProps = {
  mode: BulkSelectionMode;
  selectedCount: number;
  totalKnown?: number | null;
  onClear: () => void;
};

function getSummaryText(mode: BulkSelectionMode, selectedCount: number, totalKnown?: number | null): string {
  if (mode === 'none') return 'No items selected';
  if (mode === 'page') return `${selectedCount} items selected`;
  if (typeof totalKnown === 'number') return `All ${totalKnown} items matching current filters selected`;
  return 'All items matching current filters selected';
}

export function BulkSelectionSummary({
  mode,
  selectedCount,
  totalKnown,
  onClear,
}: BulkSelectionSummaryProps) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{getSummaryText(mode, selectedCount, totalKnown)}</span>
      {mode !== 'none' ? (
        <Button variant="ghost" onClick={onClear}>
          Clear selection
        </Button>
      ) : null}
    </div>
  );
}
