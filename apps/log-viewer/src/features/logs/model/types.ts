export type LogLevel = 'INFO' | 'WARN' | 'ERROR';
export type LogLevelFilter = 'all' | LogLevel;

export interface LogEntry {
  id: string;
  sequence: number;
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  traceId: string;
}

export interface FetchLogsParams {
  cursor: string | null;
  limit: number;
  level: LogLevelFilter;
}

export interface FetchLogsResult {
  items: LogEntry[];
  nextCursor: string | null;
  serverHighWatermark: number;
}
