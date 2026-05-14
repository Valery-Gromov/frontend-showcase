import { describe, expect, it } from 'vitest';
import { shouldConfirmSelectionInvalidation } from './useProductCatalogQuery';

describe('product catalog query selection invalidation', () => {
  it('keeps allMatching selection across pagination', () => {
    expect(
      shouldConfirmSelectionInvalidation(
        {
          mode: 'allMatching',
          excludedIds: [],
          querySnapshot: { search: 'oil' },
        },
        'pagination',
      ),
    ).toBe(false);
  });

  it('confirms page changes for explicit page-only selections', () => {
    expect(shouldConfirmSelectionInvalidation({ mode: 'some', ids: ['p-1'] }, 'pagination')).toBe(true);
  });

  it('confirms filter changes for allMatching selection', () => {
    expect(
      shouldConfirmSelectionInvalidation(
        {
          mode: 'allMatching',
          excludedIds: [],
          querySnapshot: { search: 'oil' },
        },
        'apply',
      ),
    ).toBe(true);
  });
});
