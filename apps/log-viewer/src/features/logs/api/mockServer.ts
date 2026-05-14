import type { MockRoute } from '@frontend-showcase/mock-network';
import type { FetchLogsParams, FetchLogsResult, LogEntry, LogLevel, LogLevelFilter } from '../model/types';

const SERVICES = ['catalog-api', 'pricing-worker', 'sync-gateway', 'search-indexer', 'auth-edge'] as const;
const LEVELS: readonly LogLevel[] = ['INFO', 'WARN', 'ERROR'];
const MESSAGES = [
  'request completed',
  'cache refresh finished',
  'retry policy scheduled a second attempt',
  'upstream latency exceeded budget',
  'cursor window materialized',
  'partial batch accepted',
  'schema validation rejected payload',
  'background compaction finished',
] as const;

let highWatermark = 0;
const logsDb: LogEntry[] = [];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFrom<T>(items: readonly T[]): T {
  const item = items[randomInt(0, items.length - 1)];
  if (item === undefined) throw new Error('Cannot pick from an empty list.');
  return item;
}

function levelForSequence(sequence: number): LogLevel {
  if (sequence % 19 === 0) return 'ERROR';
  if (sequence % 7 === 0) return 'WARN';
  return 'INFO';
}

function createLog(sequence: number, timestamp: Date): LogEntry {
  const level = levelForSequence(sequence);
  const service = SERVICES[sequence % SERVICES.length] ?? SERVICES[0];
  return {
    id: `log-${sequence}`,
    sequence,
    timestamp: timestamp.toISOString(),
    level,
    service,
    message: `${randomFrom(MESSAGES)} · seq=${sequence}`,
    traceId: `trc-${sequence.toString(16).padStart(6, '0')}`,
  };
}

function seedLogs(): void {
  if (logsDb.length > 0) return;
  const start = Date.now() - 1000 * 60 * 45;
  for (let index = 0; index < 1200; index += 1) {
    highWatermark += 1;
    logsDb.push(createLog(highWatermark, new Date(start + index * 2200)));
  }
}

function appendLiveLogs(): void {
  const count = randomInt(1, 6);
  for (let index = 0; index < count; index += 1) {
    highWatermark += 1;
    logsDb.push(createLog(highWatermark, new Date(Date.now() + index * 120)));
  }
}

function encodeCursor(sequence: number): string {
  return `cursor-${sequence.toString(36)}`;
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) return 0;
  const match = /^cursor-([0-9a-z]+)$/i.exec(cursor);
  if (!match?.[1]) return 0;
  const parsed = Number.parseInt(match[1], 36);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseLevel(value: string | null): LogLevelFilter {
  if (value === 'INFO' || value === 'WARN' || value === 'ERROR') return value;
  return 'all';
}

function matchesLevel(log: LogEntry, level: LogLevelFilter): boolean {
  return level === 'all' || log.level === level;
}

function queryFromSearchParams(query: URLSearchParams): FetchLogsParams {
  const limit = Number(query.get('limit') ?? '200');
  return {
    cursor: query.get('cursor'),
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 200,
    level: parseLevel(query.get('level')),
  };
}

function fetchLogs(params: FetchLogsParams): FetchLogsResult {
  const afterSequence = decodeCursor(params.cursor);
  const items = logsDb
    .filter((log) => log.sequence > afterSequence && matchesLevel(log, params.level))
    .slice(0, params.limit);
  const last = items[items.length - 1];

  return {
    items,
    nextCursor: last ? encodeCursor(last.sequence) : params.cursor,
    serverHighWatermark: highWatermark,
  };
}

export function createLogMockRoutes(): MockRoute[] {
  seedLogs();
  return [
    {
      method: 'GET',
      pattern: '/logs',
      handler: ({ query }) => {
        appendLiveLogs();
        return { status: 200, body: fetchLogs(queryFromSearchParams(query)) };
      },
    },
  ];
}

export const logLevelOptions = [
  { value: 'all', label: 'All levels' },
  ...LEVELS.map((level) => ({ value: level, label: level })),
];
