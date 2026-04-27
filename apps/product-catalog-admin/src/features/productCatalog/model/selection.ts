import type { SelectionState } from '@frontend-showcase/ui';

export function isSelectionActive(selection: SelectionState): boolean {
  return selection.mode === 'allMatching' || (selection.mode === 'some' && selection.ids.length > 0);
}

export function getSelectedCount(selection: SelectionState, total: number | null): number {
  if (selection.mode === 'none') return 0;
  if (selection.mode === 'some') return selection.ids.length;
  if (typeof total === 'number') return Math.max(0, total - selection.excludedIds.length);
  return 0;
}
