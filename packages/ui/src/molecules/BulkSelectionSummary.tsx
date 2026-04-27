import { Button } from '../atoms/Button';

export type BulkSelectionSummaryProps = {
  mode: 'none' | 'page' | 'allMatching';
  selectedCount: number;
  totalKnown?: number | null;
  onClear: () => void;
};

function getSummaryText(mode: BulkSelectionSummaryProps['mode'], selectedCount: number, totalKnown?: number | null) {
  if (mode === 'allMatching') {
    if (typeof totalKnown === 'number') {
      return `All ${totalKnown} items matching current filters selected`;
    }
    return 'All items matching current filters selected';
  }
  if (mode === 'page') {
    return `${selectedCount} items selected`;
  }
  return 'No items selected';
}

export function BulkSelectionSummary({ mode, selectedCount, totalKnown, onClear }: BulkSelectionSummaryProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span>{getSummaryText(mode, selectedCount, totalKnown)}</span>
      <Button variant="ghost" onClick={onClear} disabled={mode === 'none'}>
        Clear selection
      </Button>
    </div>
  );
}
