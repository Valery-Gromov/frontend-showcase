import { Button } from '../atoms/Button';
import styles from './BulkSelectionSummary.module.css';

export type BulkSelectionMode = 'none' | 'page' | 'allMatching';

export type BulkSelectionSummaryProps = {
  mode: BulkSelectionMode;
  selectedCount: number;
  excludedCount?: number;
  totalKnown?: number | null;
  onClear: () => void;
};

function getSummaryText(
  mode: BulkSelectionMode,
  selectedCount: number,
  excludedCount = 0,
  totalKnown?: number | null,
): string {
  if (mode === 'none') return 'No items selected';
  if (mode === 'page') return `${selectedCount} items selected`;
  if (typeof totalKnown === 'number' && excludedCount > 0) {
    return `${selectedCount} items matching current filters selected`;
  }
  if (typeof totalKnown === 'number') return `All ${totalKnown} items matching current filters selected`;
  return 'All items matching current filters selected';
}

export function BulkSelectionSummary({
  mode,
  selectedCount,
  excludedCount = 0,
  totalKnown,
  onClear,
}: BulkSelectionSummaryProps) {
  return (
    <div className={styles.summary} aria-live="polite" aria-atomic="true">
      <span>{getSummaryText(mode, selectedCount, excludedCount, totalKnown)}</span>
      {mode !== 'none' ? (
        <Button variant="ghost" onClick={onClear}>
          Clear selection
        </Button>
      ) : null}
    </div>
  );
}
