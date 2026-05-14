import { describe, expect, it } from 'vitest';
import type { SelectionState } from '@frontend-showcase/ui';
import { getSelectedCount, isSelectionActive } from './selection';

describe('product catalog selection', () => {
  it('treats none and empty some-selection as inactive', () => {
    expect(isSelectionActive({ mode: 'none' })).toBe(false);
    expect(isSelectionActive({ mode: 'some', ids: [] })).toBe(false);
  });

  it('treats explicit ids and allMatching selection as active', () => {
    expect(isSelectionActive({ mode: 'some', ids: ['p-1'] })).toBe(true);
    expect(isSelectionActive({ mode: 'allMatching', excludedIds: [], querySnapshot: {} })).toBe(true);
  });

  it('counts selected ids in some mode', () => {
    expect(getSelectedCount({ mode: 'some', ids: ['p-1', 'p-2'] }, 100)).toBe(2);
  });

  it('counts allMatching by subtracting exclusions when total is known', () => {
    const selection: SelectionState = {
      mode: 'allMatching',
      excludedIds: ['p-3', 'p-4'],
      querySnapshot: { search: 'oil' },
    };

    expect(getSelectedCount(selection, 10)).toBe(8);
  });

  it('does not guess allMatching count when total is unknown', () => {
    const selection: SelectionState = {
      mode: 'allMatching',
      excludedIds: ['p-3'],
      querySnapshot: { search: 'oil' },
    };

    expect(getSelectedCount(selection, null)).toBe(0);
  });

  it('never returns a negative allMatching count', () => {
    const selection: SelectionState = {
      mode: 'allMatching',
      excludedIds: ['p-1', 'p-2', 'p-3'],
      querySnapshot: {},
    };

    expect(getSelectedCount(selection, 2)).toBe(0);
  });
});
