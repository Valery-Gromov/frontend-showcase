import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRequestSequence } from './useRequestSequence';

describe('useRequestSequence', () => {
  it('marks older request tokens as stale after a newer token is issued', () => {
    const { result } = renderHook(() => useRequestSequence());

    const first = result.current.next();
    expect(first.isLatest).toBe(true);

    const second = result.current.next();

    expect(first.isLatest).toBe(false);
    expect(second.isLatest).toBe(true);
  });
});
