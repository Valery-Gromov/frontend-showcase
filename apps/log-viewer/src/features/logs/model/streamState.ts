import type { LogEntry } from './types';

export const DEFAULT_FOLLOW_THRESHOLD_PX = 96;

export interface ScrollMetrics {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}

export function mergeLogs(current: LogEntry[], next: LogEntry[]): LogEntry[] {
  if (next.length === 0) return current;
  const byId = new Map(current.map((log) => [log.id, log]));
  for (const log of next) byId.set(log.id, log);
  return Array.from(byId.values()).sort((a, b) => a.sequence - b.sequence);
}

export function isNearBottom(
  metrics: ScrollMetrics,
  thresholdPx = DEFAULT_FOLLOW_THRESHOLD_PX,
): boolean {
  return metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight < thresholdPx;
}
