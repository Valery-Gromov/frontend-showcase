import { describe, expect, it } from 'vitest';
import { isNearBottom, mergeLogs } from './streamState';
import type { LogEntry } from './types';

function log(sequence: number, overrides: Partial<LogEntry> = {}): LogEntry {
  return {
    id: `log-${sequence}`,
    sequence,
    timestamp: new Date(sequence * 1000).toISOString(),
    level: 'INFO',
    service: 'catalog-api',
    message: `message ${sequence}`,
    traceId: `trace-${sequence}`,
    ...overrides,
  };
}

describe('stream state helpers', () => {
  it('merges new logs by id and keeps sequence order', () => {
    const current = [log(2), log(4, { message: 'old' })];
    const next = [log(3), log(4, { message: 'new' }), log(1)];

    expect(mergeLogs(current, next)).toEqual([
      log(1),
      log(2),
      log(3),
      log(4, { message: 'new' }),
    ]);
  });

  it('keeps the current array reference when no new logs arrive', () => {
    const current = [log(1)];

    expect(mergeLogs(current, [])).toBe(current);
  });

  it('treats scroll positions inside the threshold as near the bottom', () => {
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 825, clientHeight: 100 })).toBe(true);
  });

  it('treats scroll positions at or beyond the threshold as away from the bottom', () => {
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 804, clientHeight: 100 })).toBe(false);
    expect(isNearBottom({ scrollHeight: 1000, scrollTop: 700, clientHeight: 100 })).toBe(false);
  });
});
