import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('trails input changes until the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 'first' } },
    );

    expect(result.current).toBe('first');

    rerender({ value: 'second' });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(99);
    });
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('second');
  });

  it('updates immediately when delay is disabled', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 0),
      { initialProps: { value: 'first' } },
    );

    rerender({ value: 'second' });

    expect(result.current).toBe('second');
  });
});
