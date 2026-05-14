import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUrlQueryState } from './useUrlQueryState';

interface QueryState {
  page: number;
  search: string;
}

function read(search: string): QueryState {
  const params = new URLSearchParams(search);
  return {
    page: Number(params.get('page') ?? '1'),
    search: params.get('search') ?? '',
  };
}

function write(value: QueryState): string {
  const params = new URLSearchParams();
  if (value.page !== 1) params.set('page', String(value.page));
  if (value.search) params.set('search', value.search);
  return params.toString();
}

describe('useUrlQueryState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/catalog?page=2&search=oil#rows');
  });

  it('reads initial state from the current URL', () => {
    const { result } = renderHook(() => useUrlQueryState({ read, write }));

    expect(result.current[0]).toEqual({ page: 2, search: 'oil' });
  });

  it('writes updates with pushState by default', () => {
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useUrlQueryState({ read, write }));

    act(() => {
      result.current[1]({ page: 3, search: 'filters' });
    });

    expect(pushSpy).toHaveBeenCalledOnce();
    expect(window.location.pathname).toBe('/catalog');
    expect(window.location.search).toBe('?page=3&search=filters');
    expect(window.location.hash).toBe('#rows');
    expect(result.current[0]).toEqual({ page: 3, search: 'filters' });
  });

  it('supports replace override and browser popstate updates', () => {
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const { result } = renderHook(() => useUrlQueryState({ read, write }));

    act(() => {
      result.current[1]({ page: 1, search: 'fresh' }, 'replace');
    });

    expect(replaceSpy).toHaveBeenCalledOnce();
    expect(window.location.search).toBe('?search=fresh');

    act(() => {
      window.history.pushState(null, '', '/catalog?page=5');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current[0]).toEqual({ page: 5, search: '' });
  });
});
