import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useExternalChangeDetector } from './useExternalChangeDetector';

describe('useExternalChangeDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts fresh, detects external changes, and can be marked fresh again', async () => {
    let version = 1;
    const probe = vi.fn(() => version);
    const { result } = renderHook(() =>
      useExternalChangeDetector({
        intervalMs: 100,
        probe,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(probe).toHaveBeenCalledTimes(1);
    expect(result.current.isOutdated).toBe(false);

    version = 2;
    await act(async () => {
      vi.advanceTimersByTime(100);
      await Promise.resolve();
    });

    expect(result.current.isOutdated).toBe(true);

    await act(async () => {
      result.current.markFresh();
      await Promise.resolve();
    });

    expect(result.current.isOutdated).toBe(false);
  });

  it('can treat the initial probe as already outdated', async () => {
    const { result } = renderHook(() =>
      useExternalChangeDetector({
        intervalMs: 100,
        probe: () => 1,
        startFresh: false,
      }),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isOutdated).toBe(true);
  });
});
